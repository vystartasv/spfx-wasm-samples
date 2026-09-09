# Deployment

From the repository root:

```text
npm ci
npm run build:smart-upload
npm run package:smart-upload
```

Upload `samples/wasm-smart-upload/sharepoint/solution/wasm-smart-upload.sppkg` to the SharePoint app catalog, deploy it, and trust the solution if prompted. Add the Smart upload web part to a page. The small-file action writes to the current site’s `Site Assets` library using the current user’s SharePoint permissions.
