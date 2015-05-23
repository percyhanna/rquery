module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: [
      "../node_modules/lodash/index.js",
      "../node_modules/es5-shim/es5-shim.js",
      "../node_modules/react/dist/react-with-addons.js",
      "../node_modules/mocha/mocha.js",
      "../node_modules/chai/chai.js",
      "../node_modules/chai-react/chai-react.js",
      "../node_modules/sinon/pkg/sinon.js",
      "../node_modules/sinon-chai/lib/sinon-chai.js",
      "../rquery.js",
      "./component.js",
      "./tests.js",
      "./rquery.spec.js",
      "./selectors.spec.js",
      "./events.spec.js",
      "./component.spec.js"
    ],
    reporters: ['progress']
  });
};
