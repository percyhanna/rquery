mocha.setup('bdd');
var expect = chai.expect;
window.onload = function () {
  (window.mochaPhantomJS || window.mocha).run();
};
