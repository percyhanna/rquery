(function (rquery) {
  // Module systems magic dance.
  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    // NodeJS
    module.exports = rquery;
  } else if (typeof define === "function" && define.amd) {
    // AMD
    define(['react', 'lodash'], function (React, _) {
      return rquery(_, React);
    });
  } else {
    // Other environment (usually <script> tag): assume React is already loaded.
    window.$R = rquery(window._, React);
  }
}(function (_, React) {
  'use strict';

  var TestUtils = React.addons.TestUtils;

  function isArray (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  function getDescendents (components, includeSelf) {
    return _(components)
      .map(function (component) {
        var components = TestUtils.findAllInRenderedTree(component, function () {
          return true;
        });

        if (!includeSelf) {
          components.shift();
        }

        return components;
      })
      .flatten()
      .uniq()
      .value();
  }

  function includeCompositeComponents (component) {
    if (component._renderedComponent) {
      return [component, component._renderedComponent];
    }

    return [component];
  }

  var STEP_DEFINITIONS = [
    // scope modifiers
    {
      matcher: /^\s*>\s*/,
      runStep: function (context, match) {
        var newScope = _(context.currentScope)
            .map(function (component) {
              component = component._renderedComponent || component;

              return TestUtils.findAllInRenderedTree(component, function (descendent) {
                return descendent._mountDepth === component._mountDepth + 1;
              });
            })
            .compact()
            .flatten()
            .map(includeCompositeComponents)
            .flatten()
            .value();

        context.setScope(newScope);
      }
    },
    {
      matcher: /^,\s*/,
      runStep: function (context, match) {
        context.saveResults();
        context.resetScope();
      }
    },
    {
      matcher: /^\s+/,
      runStep: function (context, match) {
        var newScope = getDescendents(context.currentScope, false);
        context.setScope(newScope);
      }
    },

    // selectors
    {
      matcher: /^([A-Z]\w*)/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          if (TestUtils.isCompositeComponent(component)) {
            return component._currentElement.type.displayName === match[1];
          }

          return false;
        });
      }
    },
    {
      matcher: /^([a-z]\w*)/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          if (TestUtils.isDOMComponent(component)) {
            return component._tag === match[1];
          }

          return false;
        });
      }
    },
    {
      matcher: /^\.([^\s]+)/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          if (TestUtils.isDOMComponent(component)
              && component.props.className) {
            var classes = component.props.className.split(' ');
            return classes.indexOf(match[1]) !== -1;
          }

          return false;
        });
      }
    },
    {
      matcher: /^\[([^\s~|^$*=]+)(?:([~|^$*]?=)"((?:\\"|.)*)")?\]/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          var propName = match[1] === 'class' ? 'className' : match[1],
              hasProp = TestUtils.isDOMComponent(component)
                        && propName in component.props;

          if (match[2]) {
            var value = match[3].replace('\\"', '"'),
                prop = String(component.props[propName]);

            switch (match[2]) {
              case '=':
                return prop === value;

              case '~=':
                return prop.split(/\s+/).indexOf(value) !== -1;

              case '|=':
                return prop === value || prop.indexOf(value + '-') === 0;

              case '^=':
                return prop.indexOf(value) === 0;

              case '$=':
                return prop.indexOf(value) === prop.length - value.length;

              case '*=':
                return prop.indexOf(value) !== -1;

              default:
                throw new Error('Unknown attribute operator: ' + operator);
                break;
            }
          }

          return hasProp;
        });
      }
    }
  ];

  function isEmptyString (str) {
    return /^\s*$/.test(str);
  }

  function parseNextStep (selector) {
    var match, step;

    for (var i = 0; i < STEP_DEFINITIONS.length; i++) {
      step = STEP_DEFINITIONS[i];
      match = selector.match(step.matcher);
      if (match) {
        return {
          match: match,
          step: step
        };
      }
    }
  }

  function buildSteps (selector) {
    var step,
        steps = [];

    while (!isEmptyString(selector)) {
      step = parseNextStep(selector);

      if (step) {
        steps.push(step);
        selector = selector.substr(step.match[0].length);
      } else {
        throw new Error('Failed to parse selector at: ' + selector);
      }
    }

    return steps;
  }

  function Context (rootComponents) {
    this.rootComponents = rootComponents;
    this.results = [];
    this.defaultScope = getDescendents(rootComponents, true);
    this.resetScope();
  }

  Context.prototype.setScope = function (scope) {
    this.currentScope = _(scope)
      .map(includeCompositeComponents)
      .flatten()
      .value();
  };

  Context.prototype.resetScope = function () {
    this.setScope(this.defaultScope);
  };

  Context.prototype.filterScope = function (predicate) {
    this.currentScope = this.currentScope.filter(predicate);
  };

  Context.prototype.saveResults = function () {
    this.results = _.union(this.results, this.currentScope);
  };

  function rquery (components) {
    if (!isArray(components)) {
      if (components) {
        components = [components];
      } else {
        components = [];
      }
    }

    this.components = components;
    this.length = components.length;

    for (var i = 0; i < components.length; i++) {
      this[i] = components[i];
    }
  }

  rquery.prototype.find = function (selector) {
    var steps = buildSteps(selector),
        context = new Context(this.components);

    steps.forEach(function (step) {
      step.step.runStep(context, step.match);
    });

    context.saveResults();

    return new rquery(context.results);
  };

  rquery.prototype.findComponent = function (type) {
    return this._generate(function (component) {
      return TestUtils.isCompositeComponentWithType(component, type);
    });
  };

  rquery.prototype.get = function (index) {
    return this.components[index];
  };

  rquery.prototype._generate = function (predicate) {
    var matches = [].concat.apply([], this.components.map(function (component) {
      return TestUtils.findAllInRenderedTree(component, predicate);
    }));

    return new rquery(matches);
  };

  rquery.prototype.simulateEvent = function (eventName, eventData) {
    for (var i = 0; i < this.components.length; i++) {
      TestUtils.Simulate[eventName](this.components[i].getDOMNode(), eventData);
    }
  };

  rquery.prototype.text = function () {
    return _.reduce(this.components, function(memo, comp) {
      return memo += comp.getDOMNode().innerText || comp.getDOMNode().textContent;
    }, '')
  };

  var EVENT_NAMES = [
    // clipboard events
    'copy', 'cut', 'paste',
    // keyboard events
    'keyDown', 'keyPress', 'keyUp',
    // focus events
    'focus', 'blur',
    // form events
    'change', 'input', 'submit',
    // mouse events
    'click', 'mouseDown', 'mouseEnter', 'mouseLeave', 'mouseMove', 'mouseOut', 'mouseOver', 'mouseUp',
    'doubleClick', 'drag', 'dragEnd', 'dragEnter', 'dragExit', 'dragLeave', 'dragOver', 'dragStart', 'drop',
    // touch events
    'touchCancel', 'touchEnd', 'touchMove', 'touchStart',
    // UI events
    'scroll',
    // wheel events
    'wheel'
  ];

  EVENT_NAMES.forEach(function (eventName) {
    rquery.prototype[eventName] = function (eventData) {
      this.simulateEvent(eventName, eventData);
    };
  });

  var $R = function (components, selector) {
    var $r = new rquery(components);

    if (selector) {
      return $r.find(selector);
    }

    return $r;
  };

  return $R;
}));
