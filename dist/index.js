"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var prettier = require('prettier/standalone');

var plugins = [require('prettier/parser-babylon')];

var Terser = require('terser');

var flowPlugin = require('@babel/plugin-transform-flow-strip-types');

var plugin = require('./babel');

var makeWrapper = require('./wrapper');

var _require = require('./transform'),
    transform = _require.transform,
    babelify = _require.babelify;

exports.transpile =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(src, _ref) {
    var _ref$minify, minify, _ref$minifyOpts, minifyOpts, _ref$prettier, prettier, _ref$prettierOpts, prettierOpts, _ref$context, context, project;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref$minify = _ref.minify, minify = _ref$minify === void 0 ? false : _ref$minify, _ref$minifyOpts = _ref.minifyOpts, minifyOpts = _ref$minifyOpts === void 0 ? {} : _ref$minifyOpts, _ref$prettier = _ref.prettier, prettier = _ref$prettier === void 0 ? false : _ref$prettier, _ref$prettierOpts = _ref.prettierOpts, prettierOpts = _ref$prettierOpts === void 0 ? {} : _ref$prettierOpts, _ref$context = _ref.context, context = _ref$context === void 0 ? '/' : _ref$context, project = _ref.project;
            // The decorated plugins should append this, but for now we add here to simplify
            // src += ';const __contract = new __contract_name();const __metadata = {}'
            // then, babelify it
            src = babelify(src, [plugin]); // remove flow types

            src = babelify(src, [flowPlugin]); // don't know, maybe babel not support decorators along to private property

            _context.next = 5;
            return transform(src, context, project);

          case 5:
            src = _context.sent;
            // finally, wrap it
            src = makeWrapper(src).trim(); // preparation for minified

            src = prettify(src, {
              semi: true
            });

            if (prettier) {
              src = prettify(src, prettierOpts);
            } else if (minify) {
              src = doMinify(src, minifyOpts);
            } // console.log(src)


            return _context.abrupt("return", src);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function (_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

function prettify(src) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return prettier.format(src, {
    parser: 'babel',
    plugins: plugins
  });
}

function doMinify(src) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var result = Terser.minify(src, (0, _objectSpread2["default"])({
    parse: {
      bare_returns: true
    },
    keep_classnames: true,
    keep_fnames: true
  }, opts));

  if (result.error) {
    throw new Error(JSON.stringify(result.error));
  }

  return result.code;
}