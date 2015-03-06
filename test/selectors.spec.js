describe('Selectors', function () {
  var reactClass, component;

  var TestUtils = React.addons.TestUtils;

  function run (selector) {
    component = TestUtils.renderIntoDocument(React.createElement(reactClass));
    return $R(component, selector);
  };

  before(function () {
    reactClass = React.createClass({
      displayName: "MyComponent",

      render: function () {
        return (
          React.createElement('div', { id: 'my-component', className: 'my-class some-other-class' },
            React.createElement('p', {}, 'Hello, world!'),
            React.createElement('p', {}, 'More paragraphs.'),
            React.createElement('a', { className: 'button', target: '_blank', 'data-something': 'hello ' }, 'Click me!'),
            React.createElement('button', { className: 'button button-default' }, 'Save')
          )
        );
      }
    });
  });

  describe('text description of component', function () {
    before(function () {
      this.$r = run('MyComponent');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of MyComponent', function () {
      expect(this.$r[0]).to.be.componentOfType(reactClass);
    });
  });

  describe('text description of DOM component', function () {
    before(function () {
      this.$r = run('a');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });
  });

  describe('DOM selector with multiple matches', function () {
    before(function () {
      this.$r = run('p');
    });

    it('finds two components', function () {
      expect(this.$r).to.have.length(2);
    });

    it('first component is instance of "p" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('p');
    });

    it('second component is instance of "p" tag', function () {
      expect(this.$r[1]).to.be.componentWithTag('p');
    });
  });

  describe('DOM class selector', function () {
    before(function () {
      this.$r = run('.button');
    });

    it('finds two components', function () {
      expect(this.$r).to.have.length(2);
    });

    it('first component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('second component is instance of "button" tag', function () {
      expect(this.$r[1]).to.be.componentWithTag('button');
    });
  });

  describe('DOM class selector with dash', function () {
    before(function () {
      this.$r = run('.my-class');
    });

    it('find one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('first component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('div');
    });
  });

  describe('attribute selector', function () {
    before(function () {
      this.$r = run('[target]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].props).to.contain.key('target');
    });
  });

  describe('attribute selector with dash in name', function () {
    before(function () {
      this.$r = run('[data-something]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has data-something property', function () {
      expect(this.$r[0].props).to.contain.key('data-something');
    });
  });

  describe('attribute value selector', function () {
    before(function () {
      this.$r = run('[target=_blank]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].props).to.contain.key('target');
    });
  });
});
