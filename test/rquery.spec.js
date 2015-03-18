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

describe('#at', function () {
  before(function () {
    this.$r = $R(['p', 'a']);
  });

  describe('when accessing a valid index', function () {
    before(function () {
      this.value = this.$r.at(0);
    });

    it('returns a new rquery object', function () {
      expect($R.isRQuery(this.value)).to.equal(true);
    });

    it('returns only one item', function () {
      expect(this.value.length).to.equal(1);
    });

    it('returns the item requested', function () {
      expect(this.value[0]).to.equal('p');
    });
  });

  describe('when accessing an invalid index', function () {
    before(function () {
      this.value = this.$r.at(2);
    });

    it('returns an rquery object', function () {
      expect($R.isRQuery(this.value)).to.equal(true);
    });

    it('returns an empty rquery object', function () {
      expect(this.value.length).to.be.equal(0);
    });
  });
});

describe('#text', function () {
  var TestUtils = React.addons.TestUtils;

  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        var p1 = React.createElement('p', null, 'Te'),
            p2 = React.createElement('p', null, 'xt');

        return React.createElement('div', null, p1, p2);
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.$r = $R(this.component).findComponent(this.reactClass);
  });

  context('when called on multiple components', function() {
    it('returns the inner text of the selected components', function() {
      expect(this.$r.find('p').text()).to.eq('Text');
    });
  });

  context('when called on single component', function() {
    it('returns the inner text of the selected component', function() {
      expect(this.$r.text()).to.eq('Text');
    });
  });
});
