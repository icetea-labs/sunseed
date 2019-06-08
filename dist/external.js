"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var template = require('@babel/template');

var _require = require('./common'),
    isWhitelistModule = _require.isWhitelistModule;

var Icetea =
/*#__PURE__*/
function () {
  function Icetea(types, data) {
    (0, _classCallCheck2["default"])(this, Icetea);
    this.types = types;
    this.data = data;
  }

  (0, _createClass2["default"])(Icetea, [{
    key: "run",
    value: function run(path) {
      var node = path.node;

      if (!node || node.callee.name !== 'require') {
        return;
      }

      var arguments_ = node.arguments;

      if (!arguments_.length || arguments_[0].type !== 'StringLiteral') {
        return;
      }

      var value = arguments_[0].value;
      var code = this.data[value];

      if (!code) {
        if (!isWhitelistModule(value)) {
          throw this.buildError('External source not found for non-whitelist moduel: ' + value, node);
        }

        return;
      }

      if (value.endsWith('.json')) {
        path.replaceWith(this.types.valueToNode(code));
      } else {
        var fn = template.expression("(function () {\n        const module={exports:{}}\n        const exports=module.exports;\n        CODE\n        ;return module.exports\n      })()");
        path.replaceWith(fn({
          CODE: code
        }));
      }
    }
  }, {
    key: "buildError",
    value: function buildError(message, nodePath) {
      if (nodePath && nodePath.buildCodeFrameError) {
        throw nodePath.buildCodeFrameError(message);
      }

      throw new SyntaxError(message);
    }
  }]);
  return Icetea;
}();

module.exports = function (data) {
  return function (babel) {
    var t = babel.types;
    return {
      visitor: {
        CallExpression: function CallExpression(path) {
          new Icetea(t, data).run(path);
        }
      }
    };
  };
};