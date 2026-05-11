
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.

## 2024-05-18 - Replacing loops of UserAsset.get with batch fetch queries using Beanie In
**Learning:** Found N+1 query bottlenecks when retrieving document data inside loops sequentially (`await UserAsset.get()`). It's important to map out database access loops and use the `In` operator for batch processing. The caveat is to correctly preserve the output ordering given that `find` does not ensure matching input array order, so mapping output back to the original index is essential (especially for RAG context building).
**Action:** Replaced looped `UserAsset.get` across `routers/assets.py`, `routers/reviews.py`, and `services/rag.py` with `UserAsset.find(In(UserAsset.id, object_ids))` followed by an ID map reconstruction to ensure correctness and speedup asset loading tasks.
