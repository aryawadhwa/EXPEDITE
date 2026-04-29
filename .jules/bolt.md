
## 2024-05-14 - Parallelize independent fetch calls
**Learning:** Found sequential fetch requests in the frontend `Dashboard.tsx` making the UI slow. Each fetch call had independent URL params and awaited independently.
**Action:** Used `Promise.all` for fetch calls to parallelize them, reducing overall load time. Always look out for independent API requests in React useEffect hooks that can be parallelized.
## 2024-05-15 - Parallelize independent API calls using Promise.all in components
**Learning:** Sequential `await` statements in loops block execution, creating N+1 request delays and making the UI slow when multiple network requests must be completed.
**Action:** Always map elements inside arrays to arrays of un-awaited Promises, then run `Promise.all` over the un-awaited promises to parallelize network operations. Ensure proper error handling to avoid one rejection throwing out the whole set.
