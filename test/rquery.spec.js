var TestUtils = React.addons.TestUtils;

describe('#findComponent', function () {
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
      expect(this.$r.text()).to.eq('Text');
    });
  });

  context('when called on single component', function() {
    it('returns the inner text of the selected component', function() {
      expect(this.$r.find('p').at(0).text()).to.eq('Te');
    });
  });
});

describe('#html', function () {
  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        var p1 = React.createElement('p', null, 'Te'),
            p2 = React.createElement('p', null, [
              React.createElement('strong', null, 'xt')
            ]);

        return React.createElement('div', null, p1, p2);
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.$r = $R(this.component).findComponent(this.reactClass);
  });

  context('when called on multiple components', function() {
    it('returns the inner text of the selected components', function() {
      expect(this.$r.html()).to.match(new RegExp('<p data-reactid="[^"]+">Te</p><p data-reactid="[^"]+"><strong data-reactid="[^"]+">xt</strong></p>'));
    });
  });

  context('when called on single component', function() {
    it('returns the inner text of the selected component', function() {
      expect(this.$r.find('p').at(1).html()).to.match(new RegExp('<strong data-reactid="[^"]+">xt</strong>'));
    });
  });
});

describe('#val', function () {
  before(function () {
    this.spy = sinon.spy($R.rquery.prototype, 'change');
  });

  after(function () {
    this.spy.reset();
  });

  describe('when called on an input', function () {
    before(function () {
      this.component = TestUtils.renderIntoDocument(React.createElement('input', { defaultValue: 'hello' }));
      this.$r = $R(this.component);
    });

    it('returns the current value when no value passed in', function () {
      expect(this.$r.val()).to.equal('hello');
      expect(this.spy).to.not.have.beenCalled;
    });

    it('changes the value of the input', function () {
      this.$r.val('world');
      expect(this.$r.val()).to.equal('world');
      expect(this.spy).to.have.beenCalled;
    });
  });

  describe('when called on a non-input', function () {
    before(function () {
      this.component = TestUtils.renderIntoDocument(React.createElement('div', { value: 'hello' }));
      this.$r = $R(this.component);
    });

    it('returns undefined', function () {
      expect(this.$r.val()).to.be.undefined;
      expect(this.spy).to.not.have.beenCalled;
    });

    it('does not change the value', function () {
      this.$r.val('world');
      expect(this.spy).to.not.have.beenCalled;
    });
  });
});

describe('.isRQuery', function () {
  it('it returns false for non rquery objects', function() {
    expect($R.isRQuery('abc')).to.be.false;
    expect($R.isRQuery(123)).to.be.false;
    expect($R.isRQuery([])).to.be.false;
    expect($R.isRQuery({})).to.be.false;
  });

  it('it returns true for rquery objects', function() {
    expect($R.isRQuery($R([]))).to.be.true;
    expect($R.isRQuery($R([]).at(0))).to.be.true;
  });
});

describe('.mixin', function () {
  before(function () {
    this._builtInFind = $R([]).find;

    $R.mixin({
      find: function () {}, // should not allow overriding a built-in method
      customMethod: function () {
        return 123;
      }
    });
    this.$r = $R([]);
  });

  it('does not allow overriding built-in methods', function() {
    expect(this._builtInFind).to.eq(this.$r.find);
  });

  it('it allows execution of custom methods', function() {
    expect(this.$r.customMethod()).to.eq(123);
  });
});
