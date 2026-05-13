
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.

## 2024-05-15 - Parallelize independent loop-bound I/O tasks
**Learning:** Found sequential API calls and DB queries in a `for` loop in `approve_all_drafts` of `backend/app/routers/reviews.py`, which resulted in poor bulk operation performance because each iteration blocked the next.
**Action:** Used `asyncio.gather` with an `asyncio.Semaphore` (to manage concurrency limits safely) to parallelize the tasks, significantly improving bulk email sending throughput and performance.
