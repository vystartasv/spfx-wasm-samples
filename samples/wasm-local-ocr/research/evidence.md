# Evidence

- Tesseract.js npm metadata lists version 7.0.0, browser/Webpack support, and Apache-2.0 licensing: <https://www.npmjs.com/package/tesseract.js/v/7.0.0>.
- The maintained package's browser defaults point to CDN worker/core URLs; this sample overrides both with emitted same-origin assets so deployment does not require a CDN. The package source documents `workerPath`, `corePath`, and `langPath` options: <https://github.com/naptha/tesseract.js/blob/main/src/createWorker.js>.
- The separate English package exists specifically to distribute language files independently: <https://www.npmjs.com/package/@tesseract.js-data/eng>.
- The package contains `4.0.0_best/eng.traineddata.gz`; Webpack emits it without changing its contents. This is why the sample can truthfully report a packaged model rather than claiming offline OCR without an asset.
