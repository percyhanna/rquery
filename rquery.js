(function (global) {
  'use strict';

  var TestUtils = React.addons.TestUtils;

  function isArray (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  var SELECTORS = [
    {
      matcher: /^([A-Z]\w*)/,
      buildPredicate: function (match) {
        return function (component) {
          if (TestUtils.isCompositeComponent(component)) {
            return component._currentElement.type.displayName === match[1];
          }

          return false;
        };
      }
    },
    {
      matcher: /^([a-z]\w*)/,
      buildPredicate: function (match) {
        return function (component) {
          if (TestUtils.isDOMComponent(component)) {
            return component._tag === match[1];
          }

          return false;
        };
      }
    },
    {
      matcher: /^\.(\w+)/,
      buildPredicate: function (match) {
        return function (component) {
          if (TestUtils.isDOMComponent(component)
              && component.props.className) {
            var classes = component.props.className.split(' ');
            return classes.indexOf(match[1]) !== -1;
          }

          return false;
        };
      }
    },
    {
      matcher: /^\[(\w+)(?:=(.*))?\]/,
      buildPredicate: function (match) {
        return function (component) {
          var hasProp = TestUtils.isDOMComponent(component)
                        && match[1] in component.props;

          if (match[2]) {
            return component.props[match[1]] === match[2];
          }

          return hasProp;
        };
      }
    }
  ];

  function parseSelector (selector) {
    var predicate, match, selectorDef;

    for (var i = 0; i < SELECTORS.length; i++) {
      selectorDef = SELECTORS[i];
      match = selector.match(selectorDef.matcher);
      if (match) {
        predicate = selectorDef.buildPredicate(match);
        break;
      }
    }

    if (!predicate) {
      throw new Error('Invalid selector: ' + selector);
    }

    return predicate;
  };

  function rQuery (components) {
    if (!isArray(components)) {
      components = [components];
    }

    this.components = components;
    this.length = components.length;

    for (var i = 0; i < components.length; i++) {
      this[i] = components[i];
    }
  };

  rQuery.prototype.find = function (selector) {
    var predicate = parseSelector(selector);
    return this._generate(predicate);
  };

  rQuery.prototype._generate = function (predicate) {
    var matches = [].concat.apply([], this.components.map(function (component) {
      return TestUtils.findAllInRenderedTree(component, predicate);
    }));

    return new rQuery(matches);
  };

  rQuery.prototype.simulateEvent = function (eventName, eventData) {
    for (var i = 0; i < this.components.length; i++) {
      TestUtils.Simulate[eventName](this.components[i].getDOMNode(), eventData);
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
    rQuery.prototype[eventName] = function (eventData) {
      this.simulateEvent(eventName, eventData);
    };
  });

  var $R = global.$R = function (components, selector) {
    var $r = new rQuery(components);

    if (selector) {
      return $r.find(selector);
    }

    return $r;
  };
}(this));
