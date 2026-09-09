# Privacy-first smart upload accelerator

Runnable SPFx 1.23.2 web part. Select or drop one file, choose a deterministic chunk size, and press **Prepare locally**. A dedicated Web Worker uses browser Web Crypto SHA-256 to hash the whole file and every chunk. The UI reports measured hashing, chunking, total time, byte size, and chunk count. Timings are from the current browser run; no timing is fabricated.

## Upload boundary

Preparation never uploads. The web part provides a real `SPHttpClient` adapter for original files up to 10 MB, targeting this site’s `Site Assets` library. Larger files can run a deterministic local resumable simulation. This sample does not claim to implement SharePoint resumable upload: the optional `uploadResumable` contract is an explicit extension point for an adapter that can create and resume an appropriate upload session. No local simulation reports remote success.

Run `npm run start:smart-upload`, or build and package with the root scripts. Deploy `sharepoint/solution/wasm-smart-upload.sppkg` to the tenant app catalog, trust the client-side solution, and add the **Smart upload** web part to a page.

The deterministic fixture is generated only after its button is pressed. It is useful for repeatable local testing and benchmark comparisons; its measured time is not a promise about tenant upload performance.
