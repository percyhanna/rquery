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

  var $R = global.$R = function (components) {
    return new rQuery(components);
  };
}(this));
