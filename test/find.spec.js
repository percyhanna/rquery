describe('$R.find', function () {
  var reactClass, component;

  var TestUtils = React.addons.TestUtils;

  function find (selector) {
    component = TestUtils.renderIntoDocument(React.createElement(reactClass));
    return $R(component).find(selector);
  };

  before(function () {
    reactClass = React.createClass({
      displayName: "MyComponent",

      render: function () {
        return (
          React.createElement('div', { id: 'my-component', className: 'my-class some-other-class' },
            React.createElement('p', {}, 'Hello, world!'),
            React.createElement('p', {}, 'More paragraphs.'),
            React.createElement('a', { className: 'button', target: '_blank' }, 'Click me!'),
            React.createElement('button', { className: 'button button-default' }, 'Save')
          )
        );
      }
    });
  });

  describe('text description of component', function () {
    before(function () {
      this.$r = find('MyComponent');
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
      this.$r = find('a');
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
      this.$r = find('p');
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
      this.$r = find('.button');
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

  describe('attribute selector', function () {
    before(function () {
      this.$r = find('[target]');
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
