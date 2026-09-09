# Benchmark methodology

Run the web part in a production-like browser, select the same file, choose the same chunk size, and record the displayed hashing, chunking, and total preparation values. Repeat at least five times after a warm-up and report median and range. Keep browser version, device class, file byte length, chunk size, and whether the worker or native fallback ran.

The fixture provides deterministic bytes and boundaries, but browser scheduling, memory pressure, and Web Crypto implementation affect timings. Compare only runs with the same environment. The sample intentionally does not claim that local preparation accelerates a remote upload; network transfer and SharePoint throttling are outside this benchmark.
