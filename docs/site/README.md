# GitHub Pages site

The site is intentionally dependency-free and deploys the contents of this directory as a GitHub Pages artifact.

## Local preview

From the repository root:

    npm run validate:site
    python3 -m http.server 8000 --directory docs/site

Open http://localhost:8000. A local HTTP server is useful because the theme preference uses browser storage and the page should be checked at the responsive widths listed in the repository task.

## Deployment

The Pages workflow at .github/workflows/pages.yml validates and publishes docs/site on pushes to main. It also supports workflow_dispatch. The workflow uses the repository’s Pages environment; enable GitHub Pages with GitHub Actions as the source if the repository has not used Pages before.

The page uses relative CSS/JavaScript assets and in-page anchors, so it works at a project subpath. Links to source documentation and sample READMEs point to the repository’s GitHub tree because those source files are not copied into the Pages artifact.
