
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.
## 2025-05-05 - Avoid Beanie/MongoDB N+1 Queries with `In` Operator
**Learning:** In MongoDB via Beanie ODM, retrieving multiple documents by ID in a loop causes an N+1 query pattern, which drastically slows down the backend.
**Action:** Always fetch related documents in a single bulk query using Beanie's `In` operator (e.g., `await UserAsset.find(In(UserAsset.id, obj_ids)).to_list()`). Convert string IDs to `bson.ObjectId` before querying.
