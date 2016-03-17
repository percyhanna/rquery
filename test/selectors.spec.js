function runSelectors (shallow) {
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

  function getProp (component, prop) {
    if (TestUtils.isDOMComponent(component)) {
      if (prop === 'className') {
        prop = 'class';
      }

      if (component.hasAttribute(prop)) {
        return component.getAttribute(prop);
      }
    } else {
      return component.props[prop];
    }
  }

  function expectType (component, type) {
    if (shallow) {
      expect(component.type).to.equal(type);
    } else {
      if (typeof type === 'string') {
        expect(component).to.be.componentWithTag(type);
      } else {
        expect(component).to.be.componentOfType(type);
      }
    }
  }

  function expectAttribute (component, attribute) {
    var hasAttribute;

    if (shallow) {
      hasAttribute = attribute in component.props;
    } else {
      hasAttribute = component.hasAttribute(attribute);
    }

    expect(hasAttribute).to.be.true;
  }

  function className (component) {
    return getProp(component, 'className');
  }

  function tagName (component) {
    if (shallow) {
      if (typeof component.type === 'string') {
        return component.type.toUpperCase();
      }
    } else {
      return component.tagName;
    }
  }

  function run (selector, element) {
    var component, renderer;

    if (!element) {
      element = React.createElement(MyComponent)
    }

    if (shallow) {
      renderer = TestUtils.createRenderer();
      renderer.render(element);
      return $R(renderer.getRenderOutput(), selector);
    } else {
      component = TestUtils.renderIntoDocument(element);
      return $R(component, selector);
    }
  };

  describe('text description of component', function () {
    before(function () {
      this.$r = run('ChildComponent');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of ChildComponent', function () {
      expectType(this.$r[0], ChildComponent);
    });
  });

  describe('text description of connected component', function () {
    before(function () {
      this.originalChildComponentDisplayName = ChildComponent.displayName;
      ChildComponent.displayName = 'Connect(ChildComponent)';
      this.$r = run('ChildComponent');
    });

    after(function () {
      ChildComponent.displayName = this.originalChildComponentDisplayName;
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of ChildComponent', function () {
      expectType(this.$r[0], ChildComponent);
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
      expectType(this.$r[0], 'a');
    });
  });

  describe('chained calls to find', function () {
    it('correctly matches composite components', function () {
      this.$r = run('div').find('ChildComponent');
      expect(this.$r).to.have.length(1);
    });

    it('matches composite components chained from a DOM component', function () {
      var TestComponent = React.createClass({
        render: function () {
          return (
            React.createElement('div', {},
              React.createElement('div', { className: 'my-class' },
                React.createElement(ChildComponent)
              )
            )
          );
        }
      });

      this.$r = run('', React.createElement(TestComponent));

      expect(this.$r.find('.my-class').find('ChildComponent')).to.have.length(1);
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
      expectType(this.$r[0], 'a');
      expectType(this.$r[1], 'p');
      expectType(this.$r[2], 'p');
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

    if (!shallow) {
      it('finds composite components that are descendants of composite components', function () {
        this.$r = run('MyComponent ChildComponent');
        expect(this.$r).to.have.length(1);
      });
    }

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

    if (!shallow) {
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
    }

    it('finds composite components that are children of DOM components', function () {
      this.$r = run('div > ChildComponent');
      expect(this.$r).to.have.length(1);
    });
  });

  if (!shallow) {
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
  }

  describe('DOM selector with multiple matches', function () {
    before(function () {
      this.$r = run('p');
    });

    it('finds two components', function () {
      expect(this.$r).to.have.length(2);
    });

    it('first component is instance of "p" tag', function () {
      expectType(this.$r[0], 'p');
    });

    it('second component is instance of "p" tag', function () {
      expectType(this.$r[1], 'p');
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
      expectType(this.$r[0], 'a');
    });

    it('second component is instance of "button" tag', function () {
      expectType(this.$r[1], 'button');
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
      expectType(this.$r[0], 'div');
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
      expect(className(this.$r[0])).to.equal('my-class some-other-class');
    });
  });

  describe('index selector', function () {
    it('matches the indexed element', function () {
      this.$r = run('button[0]');

      expect(this.$r).to.have.length(1);
      expect(tagName(this.$r[0])).to.eql('BUTTON');
      expect(className(this.$r[0])).to.eql('button button-default');
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
      expectType(this.$r[0], 'a');
    });

    it('component has target property', function () {
      expectAttribute(this.$r[0], 'target');
    });
  });

  describe('chained attribute selectors', function () {
    before(function () {
      this.$r = run('div[id="my-component"][class~="my-class"]');
    });

    it('finds the correct component', function () {
      expect(this.$r).to.have.length(1);
      expect(getProp(this.$r[0], 'id')).to.equal('my-component');
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
      expectType(this.$r[0], 'a');
    });

    it('component has data-something property', function () {
      expectAttribute(this.$r[0], 'data-something');
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
      expectType(this.$r[0], 'a');
    });

    it('component has target property', function () {
      expectAttribute(this.$r[0], 'target');
    });
  });

  describe('attribute ~= selector', function () {
    before(function () {
      this.$r = run('[class~="my-class"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "div" tag', function () {
      expectType(this.$r[0], 'div');
    });

    it('component has target property', function () {
      expect(className(this.$r[0])).to.equal('my-class some-other-class');
    });
  });

  describe('attribute |= selector', function () {
    before(function () {
      this.$r = run('[class|="my"]');
    });

    it('finds one component', function () {
      expect(this.$r).to.have.length(1);
    });

    it('component is instance of "div" tag', function () {
      expectType(this.$r[0], 'div');
    });

    it('component has target property', function () {
      expect(className(this.$r[0])).to.equal('my-class some-other-class');
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
      expectType(this.$r[0], 'a');
    });

    it('component has target property', function () {
      expectAttribute(this.$r[0], 'data-something');
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
      expectType(this.$r[0], 'a');
    });

    it('component has target property', function () {
      expectAttribute(this.$r[0], 'data-something');
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
      expectType(this.$r[0], 'a');
    });

    it('component has target property', function () {
      expectAttribute(this.$r[0], 'data-something');
    });
  });

  describe(':contains() selector', function () {
    describe('when not scoped to a specific element', function () {
      before(function () {
        this.$r = run(':contains(descendant)');
      });

      it('finds all components that contain the text', function () {
        expect(this.$r).to.have.length(shallow ? 4 : 5);
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
        expect(this.$r).to.have.length(shallow ? 7 : 8);
      });

      it('the matched descendants have the expected tag names', function () {
        var expected;

        if (shallow) {
          expected = [
            'SPAN',
            'SPAN',
            'A',
            'BUTTON',
            'SPAN',
            undefined,
            'DIV'
          ];
        } else {
          expected = [
            'SPAN',
            'A',
            'BUTTON',
            'SPAN',
            undefined,
            'BUTTON',
            'DIV',
            'SPAN'
          ];
        }

        expect(this.$r.components.map(tagName)).to.eql(expected);
      });

      it('the matched descendants have the expected class names', function () {
        var expected;

        if (shallow) {
          expected = [
            undefined,
            undefined,
            'button',
            'button button-default',
            undefined,
            undefined,
            undefined
          ];
        } else {
          expected = [
            undefined,
            'button',
            'button button-default',
            undefined,
            undefined,
            'child-component',
            undefined,
            undefined
          ];
        }

        expect(this.$r.components.map(className)).to.eql(expected);
      });

      it('the composite component is matched', function () {
        expectType(this.$r[shallow ? 5 : 4], ChildComponent);
      });
    });

    describe('when scoped to children', function () {
      before(function () {
        this.$r = run('div > :not(p)');
      });

      it('finds all the children that do not match the given selector', function () {
        expect(this.$r).to.have.length(shallow ? 6 : 7);
      });

      it('the matched children have the expected tag names', function () {
        var expected;

        if (shallow) {
          expected = [
            'SPAN',
            'A',
            'BUTTON',
            'SPAN',
            undefined,
            'DIV'
          ];
        } else {
          expected = [
            'A',
            'BUTTON',
            'SPAN',
            undefined,
            'BUTTON',
            'DIV',
            'SPAN'
          ];
        }

        expect(this.$r.components.map(tagName)).to.eql(expected);
      });

      it('the matched children have the expected class names', function () {
        var expected;

        if (shallow) {
          expected = [
            undefined,
            'button',
            'button button-default',
            undefined,
            undefined,
            undefined
          ];
        } else {
          expected = [
            'button',
            'button button-default',
            undefined,
            undefined,
            'child-component',
            undefined,
            undefined
          ];
        }

        expect(this.$r.components.map(className)).to.eql(expected);
      });
    });

    describe('when using union selector', function () {
      before(function () {
        this.$r = run('div :not(p, button, span)');
      });

      it('finds all the descendants that do not match any of the union expressions', function () {
        expect(this.$r).to.have.length(shallow ? 3 : 2);
      });

      it('the matched children have the expected tag names', function () {
        var expected;

        if (shallow) {
          expected = [
            'A',
            undefined,
            'DIV'
          ];
        } else {
          expected = [
            'A',
            'DIV'
          ];
        }

        expect(this.$r.components.map(tagName)).to.eql(expected);
      });

      it('the matched children have the expected class names', function () {
        var expected;

        if (shallow) {
          expected = [
            'button',
            undefined,
            undefined
          ];
        } else {
          expected = [
            'button',
            undefined
          ];
        }

        expect(this.$r.components.map(className)).to.eql(expected);
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
}

describe('Normal Selectors', function () {
  runSelectors(false);
});

describe('Shallow Selectors', function () {
  runSelectors(true);
});
