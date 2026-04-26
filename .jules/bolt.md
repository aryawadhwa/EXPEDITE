
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.

## 2024-05-15 - Optimize Beanie/MongoDB fetches using Bulk Query
**Learning:** Found N+1 query patterns in `backend/app/routers/assets.py` (`build_rag_context`) and `backend/app/routers/reviews.py` (`update_draft_attachments`) where multiple database records were fetched sequentially inside a `for` loop using `await UserAsset.get()`. This degrades performance, especially as list sizes grow.
**Action:** Replaced sequential `get()` calls with a single bulk query using Beanie's `In` operator (`UserAsset.find(In(UserAsset.id, object_ids)).to_list()`). Always look out for loops containing `await model.get()` calls and convert them to bulk queries. Ensure IDs are properly converted (e.g. using `bson.ObjectId`) before querying.
