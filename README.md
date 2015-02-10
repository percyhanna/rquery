# rQuery
Like jQuery, but for React.js

## Vision
[`chai-react`](https://github.com/percyhanna/chai-react/) was originally built
to help with test assertions of React components. However, it quickly started
adding too much complexity because it was attempting to solve two problems: 1)
making assertions of properties/rendered content and 2) navigating the rendered
React tree to make those assertions.

`rQuery` is meant to take over the rendered tree navigation responsibility from
`chai-react`, which will allow it to be used with any testing framework. It will
also provide convenience wrappers for various common test actions, such as event
dispatching.
