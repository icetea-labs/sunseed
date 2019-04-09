"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var template = require("@babel/template");

var IceTea =
/*#__PURE__*/
function () {
  function IceTea(types) {
    (0, _classCallCheck2["default"])(this, IceTea);
    this.types = types;
  }

  (0, _createClass2["default"])(IceTea, [{
    key: "run",
    value: function run(klass) {
      var node = klass.node;
      var source = "require('".concat(node.source.value, "')");
      var specifiers = node.specifiers;
      var lefts = [];
      var hasDefault = false;
      var require1 = template.smart("\n\t\t  const LOCAL = SOURCE\n\t  ");
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = specifiers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var specifier = _step.value;

          if (specifier.type === "ImportNamespaceSpecifier" || specifier.type === "ImportDefaultSpecifier") {
            klass.replaceWith(require1({
              LOCAL: specifier.local.name,
              SOURCE: source
            }));
            source = specifier.local.name;
            hasDefault = true;
          }

          if (specifier.type === "ImportSpecifier") {
            lefts.push([specifier.local.name, specifier.imported.name]);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (lefts.length > 0) {
        var tmp = "{" + lefts.map(function (left) {
          return "".concat(left[1], ": ").concat(left[0]);
        }).join(", ") + "}";
        var require2 = template.smart("\n\t      const ".concat(tmp, " = SOURCE\n\t    "));
        klass.insertAfter(require2({
          SOURCE: source
        }));
      }

      if (!hasDefault) {
        klass.remove();
      }
    }
  }]);
  return IceTea;
}();

module.exports = function (babel) {
  var t = babel.types;
  return {
    visitor: {
      ImportDeclaration: function ImportDeclaration(node) {
        new IceTea(t).run(node);
      }
    }
  };
};