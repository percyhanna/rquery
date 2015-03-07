describe('#findComponent', function () {
  var TestUtils = React.addons.TestUtils;

  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        return React.createElement('p');
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.$r = $R(this.component).findComponent(this.reactClass);
  });

  it('finds one component', function () {
    expect(this.$r).to.have.length(1);
  });

  it('component is instance of MyComponent', function () {
    expect(this.$r[0]).to.be.componentOfType(this.reactClass);
  });
});

describe('#get', function () {
  before(function () {
    this.$r = $R(['p']);
  });

  describe('when accessing a valid index', function () {
    before(function () {
      this.value = this.$r.get(0);
    });

    it('returns the component directly', function () {
      expect(this.value).to.equal('p');
    });
  });

  describe('when accessing an invalid index', function () {
    before(function () {
      this.value = this.$r.get(1);
    });

    it('returns undefined', function () {
      expect(this.value).to.be.undefined();
    });
  });
});
