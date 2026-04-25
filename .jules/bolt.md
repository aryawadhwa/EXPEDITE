
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.

## 2024-05-15 - Fix N+1 query in Beanie document processing
**Learning:** Found an N+1 database querying anti-pattern in the `RAGService` where multiple IDs triggered `UserAsset.get` in a loop, compounded by another loop fetching document metdata. Beanie and MongoDB perform much better when using `In` queries for bulk lookups.
**Action:** Used Beanie's `In` operator to batch fetch all `UserAsset` documents into a single query before parsing, instead of calling `.get()` sequentially for each document ID.
