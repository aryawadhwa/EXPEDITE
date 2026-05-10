
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.
## 2024-05-15 - Optimize N+1 database queries in `RAGService`
**Learning:** Found sequential fetch requests in the backend `rag.py` making the document context build slow. The `get_multiple_assets_content` method was querying `UserAsset.get` for each document independently in a loop, resulting in an N+1 query pattern. We can fetch them all in a single bulk query using Beanie's `In` operator. Note that the object IDs should be valid `bson.ObjectId` and properly deduplicated.
**Action:** Used bulk queries with Beanie's `In` operator from `beanie.operators` when retrieving multiple documents by ID, to optimize performance and avoid N+1 query patterns.
