describe('Events', function () {
  var component, called;

  var TestUtils = React.addons.TestUtils;

  before(function () {
    called = false;
    component = TestUtils.renderIntoDocument(React.createElement('a', {
      onClick: function () {
        called = true;
      }
    }));
    this.$r = $R(component);
  });

  describe('#click', function () {
    before(function () {
      this.$r.click();
    });

    it('calls the onClick handler', function () {
      expect(called).to.be.true;
    });
  });
});
