
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.

## 2026-05-09 - Prevent N+1 queries by replacing await Model.get() in loops
**Learning:** Found sequential `await Model.get(id)` database calls inside loops in routers (`assets.py`, `reviews.py`). This creates an N+1 query problem, adding significant latency.
**Action:** Replace `await Model.get(id)` loops with a single bulk query using Beanie's `In` operator: `await Model.find(In(Model.id, object_ids)).to_list()`, then build a dictionary map to access the fetched documents efficiently within the loop. Always check for independent DB requests in loops.
