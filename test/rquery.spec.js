var TestUtils = React.addons.TestUtils;

describe('#findComponent', function () {
  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        return React.createElement('p', this.props);
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

  describe('when the rquery is shallow rendered', function () {
    before(function () {
      this.renderer = TestUtils.createRenderer();
      this.element = React.createElement(this.reactClass, {}, React.createElement(this.reactClass))
      this.renderer.render(this.element);

      this.$r = $R(this.renderer.getRenderOutput());
    });

    it('finds the component', function () {
      expect(this.$r.findComponent(this.reactClass)).to.have.length(1);
    });

    it('the component is the correct type', function () {
      expect(this.$r.findComponent(this.reactClass)[0].type).to.equal(this.reactClass);
    });
  });
});

describe('#get', function () {
  before(function () {
    this.component = TestUtils.renderIntoDocument(React.createElement('div', { 'data-something': 123 }));
    this.$r = $R(this.component);
  });

  describe('when accessing a valid index', function () {
    it('returns the component directly', function () {
      expect(this.$r.get(0)).to.equal(this.component);
    });
  });

  describe('when accessing an invalid index', function () {
    it('returns undefined', function () {
      expect(this.$r.get(1)).to.be.undefined();
    });
  });
});

describe('#at', function () {
  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        return React.createElement('div', {},
          React.createElement('p'),
          React.createElement('p')
        );
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.$r = $R(this.component, 'p');
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
      expect(this.value[0]).to.be.instanceOf(Element);
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

describe('#prop', function () {
  before(function () {
    this.component = TestUtils.renderIntoDocument(React.createElement('div', { 'data-something': 123 }));
    this.$r = $R(this.component);
  });

  it('returns the prop value when defined', function() {
    expect(this.$r.prop('data-something')).to.eq('123');
  });

  it('returns undefined when no prop is defined', function() {
    expect(this.$r.prop('abc')).to.be.undefined;
  });

  it('throws an error when no component is in the scope', function() {
    var $r = this.$r;
    expect(function () {
      $r.find('p').prop('a');
    }).to.throw('$R#prop requires at least one component. No components in current scope.');
  });
});

describe('#state', function () {
  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        return React.createElement('div');
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.component.setState({
      a: 123
    });
    this.$r = $R(this.component);
  });

  it('returns the state value when defined', function() {
    expect(this.$r.state('a')).to.eq(123);
  });

  it('returns undefined when no state is defined', function() {
    expect(this.$r.state('abc')).to.be.undefined;
  });

  it('throws an error when no component is in the scope', function() {
    var $r = this.$r;
    expect(function () {
      $r.find('p').state('a');
    }).to.throw('$R#state requires at least one component. No components in current scope.');
  });
});

describe('#nodes', function () {
  before(function () {
    this.reactClass = React.createClass({
      render: function () {
        var p1 = React.createElement('p', null, 'Te'),
            p2 = React.createElement('p', null, 'xt');

        return React.createElement('div', null, p1, p2);
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.$r = $R(this.component);
  });

  context('when called on a single component', function() {
    it('returns the top-level node', function() {
      var nodes = this.$r.nodes();

      expect(nodes).to.have.length(1);
      expect(nodes[0].tagName.toUpperCase()).to.eq('DIV');
    });
  });

  context('when called on multiple components', function() {
    it('returns each node', function() {
      var nodes = this.$r.find('p').nodes();

      expect(nodes).to.have.length(2);
      expect(nodes[0].tagName.toUpperCase()).to.eq('P');
      expect(nodes[1].tagName.toUpperCase()).to.eq('P');
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
              React.createElement('strong', { key: 1 }, 'xt')
            ]);

        return React.createElement('div', null, p1, p2);
      }
    });

    this.component = TestUtils.renderIntoDocument(React.createElement(this.reactClass));
    this.$r = $R(this.component).findComponent(this.reactClass);
  });

  context('when called on multiple components', function() {
    it('returns the inner text of the selected components', function() {
      expect(this.$r.html()).to.eq('<p>Te</p><p><strong>xt</strong></p>');
    });
  });

  context('when called on single component', function() {
    it('returns the inner text of the selected component', function() {
      expect(this.$r.find('p').at(1).html()).to.eq('<strong>xt</strong>');
    });
  });
});

describe('#val', function () {
  before(function () {
    this.spy = sinon.spy($R.rquery.prototype, 'change');
  });

  after(function () {
    this.spy.restore();
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

    it('returns the attribute value', function () {
      expect(this.$r.val()).to.eq('hello');
      expect(this.spy).to.not.have.beenCalled;
    });

    it('does not change the value', function () {
      this.$r.val('world');
      expect(this.spy).to.not.have.beenCalled;
    });
  });
});

describe('#checked', function () {
  before(function () {
    this.spy = sinon.spy($R.rquery.prototype, 'change');
  });

  after(function () {
    this.spy.restore();
  });

  describe('when called on an input', function () {
    before(function () {
      this.component = TestUtils.renderIntoDocument(React.createElement('input', { defaultChecked: true }));
      this.$r = $R(this.component);
    });

    it('returns the current checked property value when no checked value passed in', function () {
      expect(this.$r.checked()).to.equal(true);
      expect(this.spy).to.not.have.beenCalled;
    });

    it('changes the checked property value of the input', function () {
      this.$r.checked(false);
      expect(this.$r.checked()).to.equal(false);
      expect(this.spy).to.have.beenCalled;
    });
  });

  describe('when called on a non-input', function () {
    before(function () {
      this.component = TestUtils.renderIntoDocument(React.createElement('div'));
      this.$r = $R(this.component);
    });

    it('returns undefined when no value passed in', function () {
      expect(this.$r.checked()).to.be.undefined;
      expect(this.spy).to.not.have.beenCalled;
    });

    it('no changes when a value is passed in', function () {
      this.$r.checked(true);
      expect(this.spy).to.not.have.beenCalled;
    });
  });
});

describe('.isRQuery', function () {
  before(function () {
    this.component = TestUtils.renderIntoDocument(React.createElement('div', { 'data-something': 123 }));
  });

  it('it returns false for non rquery objects', function() {
    expect($R.isRQuery('abc')).to.be.false;
    expect($R.isRQuery(123)).to.be.false;
    expect($R.isRQuery({})).to.be.false;
  });

  it('it returns true for rquery objects', function() {
    expect($R.isRQuery($R(this.component))).to.be.true;
    expect($R.isRQuery($R(this.component).at(0))).to.be.true;
  });
});

describe('.extend', function () {
  before(function () {
    this.component = TestUtils.renderIntoDocument(React.createElement('div', { 'data-something': 123 }));

    this._builtInFind = $R(this.component).find;

    $R.extend({
      find: function () {}, // should not allow overriding a built-in method
      customMethod: function () {
        return 123;
      }
    });

    this.$r = $R(this.component);
  });

  it('does not allow overriding built-in methods', function() {
    expect(this._builtInFind).to.eq(this.$r.find);
  });

  it('it allows execution of custom methods', function() {
    expect(this.$r.customMethod()).to.eq(123);
  });
});
