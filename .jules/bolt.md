
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.

## 2024-05-18 - Asyncio Data Processing in Request Handlers
**Learning:** Sequential processing in FastAPI request handlers (e.g. iterating over drafts to send emails or query the database one by one using `await`) creates significant bottlenecks (N+1 query/request patterns).
**Action:** When performing bulk external API calls or database lookups within a loop, extract the single-item logic into an `async def process_item(...)` and execute them concurrently via `asyncio.gather(*tasks)`. Always use `asyncio.Semaphore(N)` to bound the concurrency and avoid overwhelming external providers or depleting DB connection pools.
