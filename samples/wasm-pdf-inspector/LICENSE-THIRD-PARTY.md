# Third-party license attribution

This sample bundles `@hyzyla/pdfium` 2.1.13 under MIT. The package's exact wrapper license text is:

```text
Copyright (c) 2012-2023 Scott Chacon and others

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

The wrapper embeds a PDFium WebAssembly build. PDFium is an upstream Google project with its own BSD-style licensing/notices. Durable sources are the pinned npm tarball recorded by `package-lock.json`, the wrapper source at https://github.com/hyzyla/pdfium, and PDFium at https://pdfium.googlesource.com/pdfium/. Before redistribution, run `npm ci`, verify the package version and lockfile integrity, inspect the package README, `LICENSE.md`, and `dist/pdfium.wasm`, identify the PDFium revision used by the package/source build, and review that revision's upstream `LICENSE` and notice files. Retain any changed asset hash and the corresponding source/notices with the release.
