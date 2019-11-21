"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var prettier = require('prettier/standalone');

var plugins = [require('prettier/parser-babylon')];

var Terser = require('terser');

var flowPlugin = require('@babel/plugin-transform-flow-strip-types');

var plugin = require('./babel');

var makeWrapper = require('./wrapper');

var _require = require('./transform'),
    transform = _require.transform,
    babelify = _require.babelify;

var _require2 = require('./common'),
    getWhiteListModules = _require2.getWhiteListModules,
    setWhiteListModules = _require2.setWhiteListModules,
    addWhiteListModule = _require2.addWhiteListModule,
    removeWhiteListModule = _require2.removeWhiteListModule;

var transpile = function transpile(src) {
  var options,
      _options$minify,
      minify,
      _options$minifyOpts,
      minifyOpts,
      _options$prettier,
      prettier,
      _options$prettierOpts,
      prettierOpts,
      _options$context,
      context,
      _options$buildOptions,
      buildOptions,
      project,
      _args = arguments;

  return _regenerator["default"].async(function transpile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
          _options$minify = options.minify, minify = _options$minify === void 0 ? false : _options$minify, _options$minifyOpts = options.minifyOpts, minifyOpts = _options$minifyOpts === void 0 ? {} : _options$minifyOpts, _options$prettier = options.prettier, prettier = _options$prettier === void 0 ? false : _options$prettier, _options$prettierOpts = options.prettierOpts, prettierOpts = _options$prettierOpts === void 0 ? {} : _options$prettierOpts, _options$context = options.context, context = _options$context === void 0 ? '/' : _options$context, _options$buildOptions = options.buildOptions, buildOptions = _options$buildOptions === void 0 ? {} : _options$buildOptions, project = options.project; // The decorated plugins should append this, but for now we add here to simplify
          // src += ';const __contract = new __contract_name();const __metadata = {}'
          // then, babelify it

          src = babelify(src, [plugin]); // remove flow types

          src = babelify(src, [flowPlugin]); // don't know, maybe babel not support decorators along to private property

          _context.next = 6;
          return _regenerator["default"].awrap(transform(src, context, project, buildOptions));

        case 6:
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

        case 11:
        case "end":
          return _context.stop();
      }
    }
  });
};

var simpleTranspile = function simpleTranspile(src) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$minify2 = options.minify,
      minify = _options$minify2 === void 0 ? false : _options$minify2,
      _options$minifyOpts2 = options.minifyOpts,
      minifyOpts = _options$minifyOpts2 === void 0 ? {} : _options$minifyOpts2,
      _options$prettier2 = options.prettier,
      prettier = _options$prettier2 === void 0 ? false : _options$prettier2,
      _options$prettierOpts2 = options.prettierOpts,
      prettierOpts = _options$prettierOpts2 === void 0 ? {} : _options$prettierOpts2; // The decorated plugins should append this, but for now we add here to simplify
  // src += ';const __contract = new __contract_name();const __metadata = {}'
  // then, babelify it

  src = babelify(src, [plugin]); // remove flow types

  src = babelify(src, [flowPlugin]); // finally, wrap it

  src = makeWrapper(src).trim(); // preparation for minified

  src = prettify(src, {
    semi: true
  });

  if (prettier) {
    src = prettify(src, prettierOpts);
  } else if (minify) {
    src = doMinify(src, minifyOpts);
  }

  return src;
};

function prettify(src) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return prettier.format(src, {
    parser: 'babel',
    plugins: plugins
  });
}

function doMinify(src) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var result = Terser.minify(src, _objectSpread({
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

module.exports = {
  transpile: transpile,
  simpleTranspile: simpleTranspile,
  addWhiteListModule: addWhiteListModule,
  removeWhiteListModule: removeWhiteListModule,
  getWhiteListModules: getWhiteListModules,
  setWhiteListModules: setWhiteListModules
};