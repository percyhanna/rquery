(function (rquery) {
  // Module systems magic dance.
  if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    // NodeJS
    module.exports = rquery;
  } else if (typeof define === "function" && define.amd) {
    // AMD
    define(['lodash', 'react', 'react-dom', 'react-addons-test-utils'], function (_, React, ReactDOM, TestUtils) {
      return rquery(_, React, ReactDOM, TestUtils);
    });
  } else {
    // Other environment (usually <script> tag): assume React is already loaded.
    window.$R = rquery(window._, React, ReactDOM, React.addons.TestUtils);
  }
}(function (_, React, ReactDOM, TestUtils) {
  'use strict';

  function isArray (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  function descendentsFromNode (node) {
    return _.chain(node.childNodes).filter(function (node) {
      return node.nodeType === Node.ELEMENT_NODE;
    }).map(function (node) {
      var descendents = descendentsFromNode(node);
      descendents.unshift(node);
      return descendents;
    }).flatten().value();
  }

  function rquery_findAllInRenderedTree (component, predicate) {
    var components;

    if (TestUtils.isDOMComponent(component)) {
      components = descendentsFromNode(component);
      return _.filter(components, predicate);
    } else {
      return TestUtils.findAllInRenderedTree(component, predicate);
    }
  }

  function componentDepth (component) {
    if (TestUtils.isDOMComponent(component)) {
      return component.getAttribute('data-reactid').split('.').length;
    } else {
      return component._reactInternalInstance._rootNodeID.split('.').length;
    }
  }

  function rquery_getDOMNode (component) {
    if (TestUtils.isDOMComponent(component)) {
      return component;
    }

    return ReactDOM.findDOMNode(component);
  }

  function getComponentProp (component, prop) {
    if (TestUtils.isDOMComponent(component)) {
      if (prop === 'className') {
        return component.className;
      } else {
        return component.getAttribute(prop);
      }
    } else {
      return component.props[prop];
    }
  }

  function componentHasProp (component, prop) {
    if (TestUtils.isDOMComponent(component)) {
      return component.hasAttribute(prop);
    } else {
      return component.props && prop in component.props;
    }
  }

  function getDescendents (components, includeSelf) {
    return _(components)
      .map(function (component) {
        var components = rquery_findAllInRenderedTree(component, function () {
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
              var depth = componentDepth(component);

              return rquery_findAllInRenderedTree(context._origRootComponent, function (descendent) {
                return depth + 1 === componentDepth(descendent);
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
            return component._reactInternalInstance
                && component._reactInternalInstance._currentElement
                && component._reactInternalInstance._currentElement.type
                && component._reactInternalInstance._currentElement.type.displayName === match[1];
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
            return component.tagName === match[1].toUpperCase();
          }

          return false;
        });
      }
    },
    {
      matcher: /^\.([^\s:.]+)/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          if (TestUtils.isDOMComponent(component) && component.className) {
            var classes = component.className.split(' ');
            return classes.indexOf(match[1]) !== -1;
          }

          return false;
        });
      }
    },
    {
      matcher: /^\[([^\s~|^$*=]+)(?:([~|^$*]?=)"((?:\\"|.)*?)")?\]/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          var propName = match[1],
              hasProp = componentHasProp(component, propName);

          if (match[2]) {
            var value = match[3].replace('\\"', '"'),
                prop = String(getComponentProp(component, propName));

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
    },
    {
      matcher: /^:contains\(((?:\\\)|.)*)\)/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          return $R(component).text().indexOf(match[1]) !== -1;
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

  function Context (rootComponents, origRootComponent) {
    this.rootComponents = rootComponents;
    this._origRootComponent = origRootComponent;
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

  function rquery (components, _rootComponent) {
    if (!isArray(components)) {
      if (components) {
        components = [components];
      } else {
        components = [];
      }
    }

    this.components = components;
    this._rootComponent = _rootComponent;
    this.length = components.length;

    for (var i = 0; i < components.length; i++) {
      this[i] = components[i];
    }
  }

  rquery.prototype.find = function (selector) {
    var steps = buildSteps(selector),
        context = new Context(this.components, this._rootComponent);

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

  rquery.prototype.at = function (index) {
    return new rquery(this.components[index]);
  };

  rquery.prototype._generate = function (predicate) {
    var matches = [].concat.apply([], this.components.map(function (component) {
      return TestUtils.findAllInRenderedTree(component, predicate);
    }));

    return new rquery(matches);
  };

  rquery.prototype.simulateEvent = function (eventName, eventData) {
    for (var i = 0; i < this.components.length; i++) {
      TestUtils.Simulate[eventName](rquery_getDOMNode(this.components[i]), eventData);
    }

    return this;
  };

  rquery.prototype.ensureSimulateEvent = function (eventName, eventData) {
    if (this.length !== 1) {
      var name = 'ensure' + eventName[0].toUpperCase() + eventName.substr(1);
      throw new Error('Called ' + name + ', but current context has ' + this.length + ' components. ' + name + ' only works when 1 component is present.');
    }

    return this.simulateEvent(eventName, eventData);
  }

  rquery.prototype.clickAndChange = function (clickData, changeData) {
    this.click(clickData);
    this.change(changeData);
    return this;
  };

  rquery.prototype.ensureClickAndChange = function (clickData, changeData) {
    this.ensureSimulateEvent('click', clickData);
    this.ensureSimulateEvent('change', changeData);
    return this;
  };

  rquery.prototype.prop = function (name) {
    if (this.length < 1) {
      throw new Error('$R#prop requires at least one component. No components in current scope.');
    }

    if (componentHasProp(this[0], name)) {
      return getComponentProp(this[0], name);
    }
  };

  rquery.prototype.state = function (name) {
    if (this.length < 1) {
      throw new Error('$R#state requires at least one component. No components in current scope.');
    }

    return (this[0].state || {})[name];
  };

  rquery.prototype.nodes = function () {
    return _.map(this.components, rquery_getDOMNode);
  };

  rquery.prototype.text = function () {
    return _.map(this.nodes(), function(node) {
      return node.innerText || node.textContent;
    }).join('');
  };

  rquery.prototype.html = function () {
    return _.map(this.nodes(), function(node) {
      return node.innerHTML || '';
    }).join('');
  };

  rquery.prototype.val = function (value) {
    if (value !== undefined) {
      _.each(this.components, function(component) {
        var node = rquery_getDOMNode(component);

        if ('value' in node) {
          node.value = value;
          $R(component).change();
        }
      });

      return this;
    } else {
      if (this.components[0]) {
        return rquery_getDOMNode(this.components[0]).value;
      }
    }
  };

  rquery.prototype.checked = function (value) {
    if (value !== undefined) {
      _.each(this.components, function (component) {
        var node = rquery_getDOMNode(component);

        if ('checked' in node) {
          node.checked = value;
          $R(component).change();
        }
      });

      return this;
    } else {
      if (this.components[0]) {
        return rquery_getDOMNode(this.components[0]).checked;
      }
    }
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
      return this.simulateEvent(eventName, eventData);
    };

    var name = 'ensure' + eventName[0].toUpperCase() + eventName.substr(1);
    rquery.prototype[name] = function (eventData) {
      return this.ensureSimulateEvent(eventName, eventData);
    };
  });

  var $R = function (components, selector) {
    var $r;

    if (isArray(components)) {
      throw new Error('Cannot initialize an rquery object with an array of components. This prevents rquery from traversing the tree as necessary.');
    }

    // pass in root component to constructor
    $r = new rquery(components, components);

    if (selector) {
      return $r.find(selector);
    }

    return $r;
  };

  $R.rquery = rquery;
  $R.isRQuery = function (obj) {
    return obj instanceof rquery;
  };

  $R.extend = function (obj) {
    _.defaults(rquery.prototype, obj);
  };

  return $R;
}));
