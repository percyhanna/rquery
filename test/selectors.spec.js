describe('Selectors', function () {
  var MyComponent = React.createClass({
    displayName: "MyComponent",

    render: function () {
      return (
        React.createElement('div', { id: 'my-component', className: 'my-class some-other-class' },
          React.createElement('p', {}, 'Hello, world!'),
          React.createElement('p', {}, React.createElement('span', {}, 'not descendant')),
          React.createElement('a', { className: 'button', target: '_blank', 'data-something': 'hello ' }, 'Click me!'),
          React.createElement('button', { className: 'button button-default' }, 'Save'),
          React.createElement('span', {}, 'descendant'),
          React.createElement(ChildComponent),
          React.createElement('div', {}, React.createElement('span', {}, 'not a child of p'))
        )
      );
    }
  });

  var ChildComponent = React.createClass({
    displayName: 'ChildComponent',

    render: function () {
      return (
        React.createElement('button', { className: 'child-component' }, 'my child component')
      );
    }
  });

  var TestUtils = React.addons.TestUtils;

  function run (selector) {
    var component = TestUtils.renderIntoDocument(React.createElement(MyComponent));
    return $R(component, selector);
  };

  describe('text description of component', function () {
    before(function () {
      this.$r = run('MyComponent');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of MyComponent', function () {
      expect(this.$r[0]).to.be.componentOfType(MyComponent);
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

  describe('union selector', function () {
    before(function () {
      this.$r = run('a, p');
    });

    it('finds all a & p components', function () {
      expect(this.$r).to.have.length(3);
    });

    it('components are found in union order, then document order', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
      expect(this.$r[1]).to.be.componentWithTag('p');
      expect(this.$r[2]).to.be.componentWithTag('p');
    });
  });

  describe('descendant selector', function () {
    it('finds all span components', function () {
      this.$r = run('div span');
      expect(this.$r).to.have.length(3);
    });

    it('finds all p components', function () {
      this.$r = run('div p');
      expect(this.$r).to.have.length(2);
    });

    it('finds composite components that are descendants of composite components', function () {
      this.$r = run('MyComponent ChildComponent');
      expect(this.$r).to.have.length(1);
    });

    it('finds composite components that are descendants of DOM components', function () {
      this.$r = run('div ChildComponent');
      expect(this.$r).to.have.length(1);
    });
  });

  describe('child selector', function () {
    before(function () {
      this.$r = run('div > span');
    });

    it('finds all child span components', function () {
      expect(this.$r).to.have.length(2);
    });

    describe('when descendant is of same depth, but not a child', function () {
      before(function () {
        this.$r = run('p > span')
      });

      it('does not match the cousin', function () {
        expect(this.$r).to.have.length(1);
      });
    });

    describe('internal composite DOM components', function () {
      before(function () {
        this.$r = run('div > button');
      });

      it('finds the button components', function () {
        expect(this.$r).to.have.length(3);
      });

      it('finds the composite component', function () {
        expect(TestUtils.isCompositeComponentWithType(this.$r[1], ChildComponent)).to.be.true;
      });
    });

    it('finds composite components that are children of composite components', function () {
      this.$r = run('MyComponent > ChildComponent');
      expect(this.$r).to.have.length(1);
    });

    it('finds composite components that are children of DOM components', function () {
      this.$r = run('div > ChildComponent');
      expect(this.$r).to.have.length(1);
    });
  });

  describe('composite selector with child selector', function () {
    before(function () {
      this.$r = run('MyComponent > span');
    });

    it('finds all child span components', function () {
      expect(this.$r).to.have.length(1);
    });

    describe('composite component\'s DOM component', function () {
      before(function () {
        this.$r = run('MyComponent > div');
      });

      it('returns the composite component\'s DOM component', function () {
        expect(this.$r).to.have.length(1);
      });
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

    it('first component is instance of "div" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('div');
    });
  });

  describe('chained DOM class selector', function () {
    before(function () {
      this.$r = run('.my-class.some-other-class');
    });

    it('find one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('has the correct class names', function () {
      expect(this.$r[0]).to.have.prop('className', 'my-class some-other-class');
    });
  });

  describe('index selector', function () {
    it('matches the indexed element', function () {
      this.$r = run('div[1]');

      expect(this.$r).to.have.length(1);
      expect(this.$r[0].tagName).to.eql('DIV');
      expect(this.$r[0].className).to.eql('my-class some-other-class');
    });

    it('matches nothing if index out of range', function () {
      this.$r = run('div[3]');

      expect(this.$r).to.have.length(0);
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
      expect(this.$r[0].hasAttribute('target')).to.be.true;
    });
  });

  describe('chained attribute selectors', function () {
    before(function () {
      this.$r = run('div[id="my-component"][class~="my-class"]');
    });

    it('finds the correct component', function () {
      expect(this.$r).to.have.length(1);
      expect(this.$r[0]).to.have.prop('id', 'my-component');
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
      expect(this.$r[0].hasAttribute('data-something')).to.be.true;
    });
  });

  describe('attribute value selector', function () {
    before(function () {
      this.$r = run('[target="_blank"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].hasAttribute('target')).to.be.true;
    });
  });

  describe('attribute ~= selector', function () {
    before(function () {
      this.$r = run('[class~="my-class"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].className).to.equal('my-class some-other-class');
    });
  });

  describe('attribute |= selector', function () {
    before(function () {
      this.$r = run('[class|="my"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].className).to.equal('my-class some-other-class');
    });
  });

  describe('attribute ^= selector', function () {
    before(function () {
      this.$r = run('[data-something^="he"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].hasAttribute('data-something')).to.be.true;
    });
  });

  describe('attribute $= selector', function () {
    before(function () {
      this.$r = run('[data-something$="lo "]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].hasAttribute('data-something')).to.be.true;
    });
  });

  describe('attribute *= selector', function () {
    before(function () {
      this.$r = run('[data-something*="ell"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "a" tag', function () {
      expect(this.$r[0]).to.be.componentWithTag('a');
    });

    it('component has target property', function () {
      expect(this.$r[0].hasAttribute('data-something')).to.be.true;
    });
  });

  describe(':contains() selector', function () {
    describe('when not scoped to a specific element', function () {
      before(function () {
        this.$r = run(':contains(descendant)');
      });

      it('finds all components that contain the text', function () {
        expect(this.$r).to.have.length(5);
      });
    });

    describe('when scoped to a specific element', function () {
      before(function () {
        this.$r = run('div :contains(descendant)');
      });

      it('finds all scoped components that contain the text', function () {
        expect(this.$r).to.have.length(3);
      });
    });
  });

  describe(':not() selector', function () {
    describe('when scoped to descendants', function () {
      before(function () {
        this.$r = run('div :not(p)');
      });

      it('finds all the descendants that do not match the given selector', function () {
        expect(this.$r).to.have.length(8);
      });

      it('the matched descendants have the expected tag names', function () {
        expect(this.$r.components.map(function (component) {
          return component.tagName;
        })).to.eql([
          'SPAN',
          'A',
          'BUTTON',
          'SPAN',
          undefined,
          'BUTTON',
          'DIV',
          'SPAN'
        ]);
      });

      it('the matched descendants have the expected class names', function () {
        expect(this.$r.components.map(function (component) {
          return component.className;
        })).to.eql([
          '',
          'button',
          'button button-default',
          '',
          undefined,
          'child-component',
          '',
          ''
        ]);
      });

      it('the composite component is matched', function () {
        expect(TestUtils.isCompositeComponentWithType(this.$r[4], ChildComponent)).to.be.true;
      });
    });

    describe('when scoped to children', function () {
      before(function () {
        this.$r = run('div > :not(p)');
      });

      it('matches all children that do not match the given selector', function () {
        expect(this.$r).to.have.length(7);

        // a.button, button.button.button-default, span, Constructor, button.child-component, div, span
        expect(this.$r.components.map(function (component) {
          return component.tagName;
        })).to.eql([
          'A',
          'BUTTON',
          'SPAN',
          undefined,
          'BUTTON',
          'DIV',
          'SPAN'
        ]);

        expect(this.$r.components.map(function (component) {
          return component.className;
        })).to.eql([
          'button',
          'button button-default',
          '',
          undefined,
          'child-component',
          '',
          ''
        ]);
      });
    });

    describe('when using union selector', function () {
      before(function () {
        this.$r = run('div :not(p, button, span)');
      });

      it('finds all the descendants that do not match any of the union expressions', function () {
        expect(this.$r).to.have.length(2);
      });

      it('the matched descendants have the expected tag names', function () {
        expect(this.$r.components.map(function (component) {
          return component.tagName;
        })).to.eql([
          'A',
          'DIV'
        ]);
      });

      it('the matched descendants have the expected class names', function () {
        expect(this.$r.components.map(function (component) {
          return component.className;
        })).to.eql([
          'button',
          ''
        ]);
      });
    });

    describe('when match negates self', function () {
      before(function () {
        this.$r = run('div.my-class:not(.my-class)');
      });

      it('matches nothing', function () {
        expect(this.$r).to.have.length(0);
      });
    });

    it('throws an error on missing )', function () {
      expect(function () {
        run(':not(');
      }).to.throw('Syntax error, unclosed )');
    });

    it('throws an error on un-matched )', function () {
      expect(function () {
        run(')');
      }).to.throw('Syntax error, unmatched )');
    });
  });
});
