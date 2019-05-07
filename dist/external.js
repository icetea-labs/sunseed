"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var template = require('@babel/template');

var _require = require('./common'),
    isNodeModule = _require.isNodeModule;

var IceTea =
/*#__PURE__*/
function () {
  function IceTea(types, data) {
    (0, _classCallCheck2["default"])(this, IceTea);
    this.types = types;
    this.data = data;
  }

  (0, _createClass2["default"])(IceTea, [{
    key: "run",
    value: function run(path) {
      var node = path.node;

      if (!node || node.callee.name !== 'require') {
        return;
      }

      var arguments_ = node.arguments;

      if (arguments_.length !== 1 || arguments_[0].type !== 'StringLiteral') {
        return;
      }

      var value = arguments_[0].value;
      var code = this.data[value];

      if (!code) {
        if (!isNodeModule(value)) {
          throw this.buildError('external source not found', node);
        }

        return;
      }

      var fn = template.expression("\n      (function () {\n        const module={exports:{}};\n        const exports=module.exports;\n        CODE\n        return module.exports\n      })()\n    ");

      if (value.endsWith('.json')) {
        path.replaceWith(this.types.valueToNode(code));
      } else {
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
  return IceTea;
}();

module.exports = function (data) {
  return function (babel) {
    var t = babel.types;
    return {
      visitor: {
        CallExpression: function CallExpression(path) {
          new IceTea(t, data).run(path);
        }
      }
    };
  };
};