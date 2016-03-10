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

  var showCompositeWarning = true;

  function isShallow (component) {
    return '$$typeof' in component;
  }

  function isArray (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  function descendantsFromNode (node) {
    return _.chain(node.childNodes).filter(function (node) {
      return node.nodeType === Node.ELEMENT_NODE;
    }).map(function (node) {
      var descendants = descendantsFromNode(node);
      descendants.unshift(node);
      return descendants;
    }).flatten().value();
  }

  function rquery_findAllInRenderedTree (component, predicate) {
    var components;

    if (TestUtils.isDOMComponent(component)) {
      components = descendantsFromNode(component);
      return _.filter(components, predicate);
    } else {
      return TestUtils.findAllInRenderedTree(component, predicate);
    }
  }

  function findDescendantsInContext (context, onlyChildren) {
    return getDescendants(context._origRootComponent, context.currentScope, onlyChildren);
  }

  function reactIdDepth (reactId) {
    return reactId.split('.').length;
  }

  function componentDepth (component) {
    return reactIdDepth(rquery_getReactId(component));
  }

  function rquery_getDOMNode (component) {
    if (TestUtils.isDOMComponent(component)) {
      return component;
    }

    return ReactDOM.findDOMNode(component);
  }

  function rquery_getReactId (component) {
    return rquery_getDOMNode(component).getAttribute('data-reactid');
  }

  function getComponentProp (component, prop, shallow) {
    if (shallow) {
      if (prop === 'class') {
        prop = 'className';
      }

      return component && component.props && component.props[prop];
    }

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

  function getShallowChildren (node, recursive) {
    var children = [];

    if (node && node.props && node.props.children) {
      children = [].concat(node.props.children);
    }

    if (recursive) {
      return _.chain(children)
              .map(function (child) {
                return getShallowChildren(child, true);
              })
              .flatten()
              .concat(children)
              .value();
    }

    return children;
  }

  function getShallowDescendants (components, onlyChildren, includeSelf, childTypes) {
    childTypes = childTypes || 'object';

    return _.chain(components)
            .map(function (component) {
              return getShallowChildren(component, !onlyChildren)
            })
            .flatten()
            .concat(includeSelf ? components : [])
            .unique()
            .filter(function (child) {
              return typeof child === childTypes;
            })
            .value();
  }

  function getDescendants (root, components, onlyChildren, includeSelf) {
    if (isShallow(root)) {
      return getShallowDescendants(components, onlyChildren, includeSelf);
    }

    var prefixes = _.map(components, function (component) {
          return rquery_getReactId(component) + '.';
        });

    return rquery_findAllInRenderedTree(root, function (descendant) {
      var descendantId,
          descendantDepth = componentDepth(descendant);

      if (includeSelf) {
        // the prefix includes a trailing '.', so check for that
        descendantId = rquery_getReactId(descendant) + '.';

        if (_.includes(prefixes, descendantId)) {
          return true;
        }
      }

      return _.some(prefixes, function (prefix) {
        var depth,
            descendantPrefix = rquery_getReactId(descendant).substring(0, prefix.length);

        if (onlyChildren) {
          depth = reactIdDepth(descendantPrefix);

          // The prefix includes a trailing '.', so the prefix depth will
          // actually be equal to all of its children's depth. Skip any
          // components that are not at this depth, since they aren't children.
          if (depth !== descendantDepth) {
            return false;
          }
        }

        return descendantPrefix === prefix;
      });
    });
  }

  function includeCompositeComponents (component) {
    if (component && component._renderedComponent) {
      return [component, component._renderedComponent];
    }

    return [component];
  }

  var STEP_DEFINITIONS = [
    // group modifiers
    {
      matcher: /^:not\(/,
      pushStack: true,
      runStep: function (context, match, steps) {
        var notContext = new Context([], context._origRootComponent);
        notContext.defaultScope = context.currentScope.slice();
        notContext.resetScope();

        runSteps(steps, notContext);

        context.setScope(_.without.apply(_, [context.currentScope].concat(notContext.results)));
      }
    },
    {
      matcher: /^\)/,
      popStack: true
    },

    // scope modifiers
    {
      matcher: /^\s*>\s*/,
      runStep: function (context, match) {
        var newScope = findDescendantsInContext(context, true);
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
        var newScope = findDescendantsInContext(context);
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
                && (component._reactInternalInstance._currentElement.type.displayName === match[1]
                || component._reactInternalInstance._currentElement.type.name === match[1]);
          }

          return false;
        });
      },
      runShallowStep: function (context, match) {
        context.filterScope(function (component) {
          if (typeof component.type === 'function') {
            return (component.type.displayName === match[1]
                || component.type.name === match[1]);
          }

          return false;
        });
      }
    },
    {
      matcher: /^([a-z]\w*)/,
      runStep: function (context, match) {
        context.filterScope(function (component) {
          // if the component is composite, then look at its DOM node to match
          // this allows the composite component to be kept in the context
          if (TestUtils.isCompositeComponent(component)) {
            component = rquery_getDOMNode(component);
          }

          return component.tagName.toUpperCase() === match[1].toUpperCase();
        });
      },
      runShallowStep: function (context, match) {
        context.filterScope(function (component) {
          if (typeof component.type === 'string') {
            return component.type.toUpperCase() === match[1].toUpperCase();
          }

          return false;
        });
      }
    },
    {
      matcher: /^\.([^\s:.)!\[\]]+)/,
      matchClass: function (className, match) {
        var classes = className.split(' ');
        return classes.indexOf(match[1]) !== -1;
      },
      runStep: function (context, match) {
        var self = this;

        context.filterScope(function (component) {
          if (TestUtils.isDOMComponent(component) && component.className) {
            return self.matchClass(component.className, match);
          }

          return false;
        });
      },
      runShallowStep: function (context, match) {
        var self = this;

        context.filterScope(function (component) {
          if (component && component.props && component.props.className) {
            return self.matchClass(component.props.className, match);
          }

          return false;
        });
      }
    },
    {
      // `.find('div[1]')` is shorthand for `find('div').at(1)`
      matcher: /^\[(\d+)\]/,
      runStep: function (context, match) {
        var index = parseInt(match[1], 10),
            newScope = [];

        if (context.currentScope[index]) {
          newScope.push(context.currentScope[index]);
        }

        context.setScope(newScope);
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
                prop = String(getComponentProp(component, propName, context.shallow));

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
          return new rquery(component, context._origRootComponent).text().indexOf(match[1]) !== -1;
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
    var parsedStep, step,
        steps = [],
        stack = [];

    while (!isEmptyString(selector)) {
      parsedStep = parseNextStep(selector);

      if (parsedStep) {
        step = parsedStep.step;
        steps.push(parsedStep);

        if (step.pushStack) {
          stack.push(steps);
          parsedStep.steps = steps = [];
        } else if (step.popStack) {
          if (stack.length < 1) {
            throw new Error('Syntax error, unmatched )');
          }

          // pop ourselves from the steps array, as we don't actually do anything
          steps.pop();

          steps = stack.pop();
        }

        selector = selector.substr(parsedStep.match[0].length);
      } else {
        throw new Error('Failed to parse selector at: ' + selector);
      }
    }

    if (stack.length !== 0) {
      throw new Error('Syntax error, unclosed )');
    }

    return steps;
  }

  function runSteps (steps, context) {
    steps.forEach(function (step) {
      var stepRunner = step.step.runStep;

      if (context.shallow) {
        stepRunner = step.step.runShallowStep || step.step.runStep;
      }

      stepRunner.call(step.step, context, step.match, step.steps);
    });

    context.saveResults();
  }

  function Context (rootComponents, origRootComponent) {
    this.shallow = isShallow(origRootComponent);
    this.rootComponents = rootComponents;
    this._origRootComponent = origRootComponent;
    this.results = [];
    this.defaultScope = getDescendants(origRootComponent, rootComponents, false, true);
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
    this.shallow = isShallow(_rootComponent);
    this.length = components.length;

    for (var i = 0; i < components.length; i++) {
      this[i] = components[i];
    }
  }

  rquery.prototype.find = function (selector) {
    var steps = buildSteps(selector),
        context = new Context(this.components, this._rootComponent);

    runSteps(steps, context);

    return new rquery(context.results, this._rootComponent);
  };

  rquery.prototype.findComponent = function (type) {
    if (this.shallow) {
      return this._generate(function (component) {
        console.log(component);
        return component.type === type;
      });
    }

    return this._generate(function (component) {
      return TestUtils.isCompositeComponentWithType(component, type);
    });
  };

  rquery.prototype.get = function (index) {
    return this.components[index];
  };

  rquery.prototype.at = function (index) {
    return new rquery(this.components[index], this._rootComponent);
  };

  rquery.prototype._generate = function (predicate) {
    var matches;

    if (this.shallow) {
      matches = _.filter(getShallowDescendants(this.components, false, true), predicate);
    } else {
      matches = [].concat.apply([], this.components.map(function (component) {
        return TestUtils.findAllInRenderedTree(component, predicate);
      }));
    }

    return new rquery(matches, this._rootComponent);
  };

  rquery.prototype.simulateEvent = function (eventName, eventData) {
    this._notAllowedInShallowMode('simulateEvent');

    for (var i = 0; i < this.components.length; i++) {
      TestUtils.Simulate[eventName](rquery_getDOMNode(this.components[i]), eventData);
    }

    return this;
  };

  rquery.prototype.ensureSimulateEvent = function (eventName, eventData) {
    this._notAllowedInShallowMode('ensureSimulateEvent');

    var name = 'ensure' + eventName[0].toUpperCase() + eventName.substr(1);

    if (this.length !== 1) {
      throw new Error('Called ' + name + ', but current context has ' + this.length + ' components. ' + name + ' only works when 1 component is present.');
    }

    if (eventName === 'click' && this[0].disabled) {
      throw new Error('Called ' + name + ', but the targeted element is disabled.');
    }

    return this.simulateEvent(eventName, eventData);
  }

  rquery.prototype.clickAndChange = function (clickData, changeData) {
    this._notAllowedInShallowMode('clickAndChange');

    this.click(clickData);
    this.change(changeData);
    return this;
  };

  rquery.prototype.ensureClickAndChange = function (clickData, changeData) {
    this._notAllowedInShallowMode('ensureClickAndChange');

    this.ensureSimulateEvent('click', clickData);
    this.ensureSimulateEvent('change', changeData);
    return this;
  };

  rquery.prototype._toggleCheckbox = function () {
    var i, node;

    for (i = 0; i < this.length; i++) {
      node = this[i];

      if (TestUtils.isDOMComponent(node)) {
        if (node.tagName.toUpperCase() === 'INPUT' && node.type.toUpperCase() === 'CHECKBOX') {
          node.checked = !node.checked;
        }
      }
    }
  }

  rquery.prototype.toggleCheckbox = function (clickData) {
    this._notAllowedInShallowMode('toggleCheckbox');

    this._toggleCheckbox();
    this.clickAndChange(clickData);

    return this;
  };

  rquery.prototype.ensureToggleCheckbox = function (clickData) {
    this._notAllowedInShallowMode('ensureToggleCheckbox');

    if (this.length !== 1) {
      throw new Error('Called ensureToggleCheckbox, but current context has ' + this.length + ' components. ensureToggleCheckbox only works when 1 component is present.');
    }

    this._toggleCheckbox();
    this.ensureClickAndChange(clickData);

    return this;
  };

  rquery.prototype.prop = function (name) {
    if (this.length < 1) {
      throw new Error('$R#prop requires at least one component. No components in current scope.');
    }

    if (componentHasProp(this[0], name)) {
      return getComponentProp(this[0], name, this.shallow);
    }
  };

  rquery.prototype.state = function (name) {
    this._notAllowedInShallowMode('state');

    if (this.length < 1) {
      throw new Error('$R#state requires at least one component. No components in current scope.');
    }

    return (this[0].state || {})[name];
  };

  rquery.prototype.nodes = function () {
    this._notAllowedInShallowMode('nodes');

    return _.map(this.components, rquery_getDOMNode);
  };

  rquery.prototype.text = function () {
    if (this.shallow) {
      return getShallowDescendants(this.components, false, true, 'string').join('');
    }

    return _.map(this.nodes(), function(node) {
      return node.innerText || node.textContent;
    }).join('');
  };

  rquery.prototype.html = function () {
    this._notAllowedInShallowMode('html');

    return _.map(this.nodes(), function(node) {
      return node.innerHTML || '';
    }).join('');
  };

  rquery.prototype.val = function (value) {
    this._notAllowedInShallowMode('val');

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
    this._notAllowedInShallowMode('checked');

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

  rquery.prototype._notAllowedInShallowMode = function (methodName) {
    if (this.shallow) {
      throw new Error('The ' + methodName + '() method is not allowed in shallow rquery objects.');
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
      this._notAllowedInShallowMode(eventName);

      return this.simulateEvent(eventName, eventData);
    };

    var name = 'ensure' + eventName[0].toUpperCase() + eventName.substr(1);
    rquery.prototype[name] = function (eventData) {
      this._notAllowedInShallowMode(name);

      return this.ensureSimulateEvent(eventName, eventData);
    };
  });

  var $R = function (component, selector) {
    var $r;

    if (isArray(component)) {
      throw new Error('Cannot initialize an rquery object with an array of components. This prevents rquery from traversing the tree as necessary.');
    } else if (typeof component !== 'object') {
      throw new Error('Must initialize an rquery object with a React component.');
    } else if (!TestUtils.isCompositeComponent(component) && showCompositeWarning) {
      showCompositeWarning = false;
      window.console && console.warn('Initializing an rquery object with a DOM component (really just a DOM node in React 0.14) prevents rquery from properly traversing the React tree. For best results, initialize your rquery object with a composite component.');
    }

    // pass in root component to constructor
    $r = new rquery(component, component);

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
