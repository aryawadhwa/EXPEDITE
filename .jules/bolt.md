
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.
## 2024-04-27 - Beanie ODM N+1 Query & In Operator ObjectIDs
**Learning:** In the `RAGService`'s context builder, fetching documents sequentially in a loop caused severe N+1 querying (and in one place, 2 * N queries). Additionally, when optimizing to a bulk query using Beanie's `In` operator, passing string IDs silently fails to match because MongoDB stores them as `ObjectId`s.
**Action:** Always optimize bulk document fetches using Beanie's `In` operator (e.g. `UserAsset.find(In(UserAsset.id, object_ids)).to_list()`), and ensure that string IDs are mapped to `bson.ObjectId` before executing the query.
