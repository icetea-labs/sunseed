"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var url = require('url');

var fs = require('fs');

var path = require('path');

var axios = require('axios');

var babelParser = require('@babel/parser');

var traverse = require('@babel/traverse')["default"];

var _require = require('../common'),
    plugins = _require.plugins,
    isHttp = _require.isHttp,
    isNodeModule = _require.isNodeModule,
    isWhitelistModule = _require.isWhitelistModule;

var resolveExternal = require('../external');

var importToRequire = require('../import2require');

var babelify = require('./babelify');
/**
 * transform bundle library with contract source
 * @param {string} src - contract source require external library
 * @param {string} context - for recursive require
 * @param {Object} project - support icetea-studio (does not use fs)
 * @param {Object} options - bundle module config
 */


exports.transform =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(src) {
    var context,
        project,
        options,
        parsed,
        requires,
        _args2 = arguments;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            context = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : '/';
            project = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : null;
            options = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : {};
            _context2.next = 5;
            return babelify(src, [importToRequire]);

          case 5:
            src = _context2.sent;
            parsed = babelParser.parse(src, {
              sourceType: 'module',
              plugins: plugins
            });
            requires = {};
            traverse(parsed, {
              CallExpression: function CallExpression(_ref2) {
                var node = _ref2.node;

                if (!node || node.callee.name !== 'require') {
                  return;
                }

                var arguments_ = node.arguments;

                if (arguments_.length !== 1 || arguments_[0].type !== 'StringLiteral') {
                  return;
                }

                var value = arguments_[0].value;
                requires[value] = value;
              }
            });
            _context2.next = 11;
            return Promise.all(Object.keys(requires).map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee(value) {
                var _data, _data2, localFlag, moduleName, filePath, data;

                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!(isWhitelistModule(value) || options.remote && options.remote[value])) {
                          _context.next = 3;
                          break;
                        }

                        delete requires[value];
                        return _context.abrupt("return");

                      case 3:
                        if (!isHttp(value)) {
                          _context.next = 17;
                          break;
                        }

                        if (['.js', '.json'].includes(path.extname(value))) {
                          _context.next = 6;
                          break;
                        }

                        throw new Error('"require" supports only .js and .json files.');

                      case 6:
                        _context.next = 8;
                        return axios.get(value);

                      case 8:
                        _data = _context.sent.data;

                        if (!(typeof _data === 'string')) {
                          _context.next = 15;
                          break;
                        }

                        _context.next = 12;
                        return exports.transform(_data, value, null, options);

                      case 12:
                        requires[value] = _context.sent;
                        _context.next = 16;
                        break;

                      case 15:
                        requires[value] = _data;

                      case 16:
                        return _context.abrupt("return");

                      case 17:
                        if (!isHttp(context)) {
                          _context.next = 33;
                          break;
                        }

                        if (!isNodeModule(value)) {
                          _context.next = 20;
                          break;
                        }

                        throw new Error('Cannot use node_modules in remote URL.');

                      case 20:
                        if (['.js', '.json'].includes(path.extname(value))) {
                          _context.next = 22;
                          break;
                        }

                        throw new Error('"require" supports only .js and .json files.');

                      case 22:
                        _context.next = 24;
                        return axios.get(url.resolve(context, value));

                      case 24:
                        _data2 = _context.sent.data;

                        if (!(typeof _data2 === 'string')) {
                          _context.next = 31;
                          break;
                        }

                        _context.next = 28;
                        return exports.transform(_data2, url.resolve(context, value), null, options);

                      case 28:
                        requires[value] = _context.sent;
                        _context.next = 32;
                        break;

                      case 31:
                        requires[value] = _data2;

                      case 32:
                        return _context.abrupt("return");

                      case 33:
                        // if you want to use bundle instead of blockchain node_modules
                        localFlag = '@local';
                        moduleName = value;

                        if (moduleName.endsWith(localFlag)) {
                          moduleName = moduleName.slice(0, -localFlag.length);
                        }

                        if (isNodeModule(moduleName)) {
                          filePath = require.resolve("".concat(moduleName)); // to ignore webpack warning
                        } else {
                          if (project) {
                            filePath = path.join(context, value);
                          } else {
                            filePath = require.resolve("".concat(path.resolve(context, value)));
                          }
                        }

                        if (['.js', '.json'].includes(path.extname(filePath))) {
                          _context.next = 39;
                          break;
                        }

                        throw new Error('"require" supports only .js and .json files.');

                      case 39:
                        if (project) {
                          data = project.getFile(filePath).getData().toString();
                        } else {
                          data = fs.readFileSync(filePath).toString();
                        }

                        _context.prev = 40;
                        data = JSON.parse(data);
                        requires[value] = data;
                        _context.next = 54;
                        break;

                      case 45:
                        _context.prev = 45;
                        _context.t0 = _context["catch"](40);

                        if (!(_context.t0 instanceof SyntaxError)) {
                          _context.next = 53;
                          break;
                        }

                        _context.next = 50;
                        return exports.transform(data, path.dirname(filePath), project, options);

                      case 50:
                        requires[value] = _context.sent;
                        _context.next = 54;
                        break;

                      case 53:
                        throw _context.t0;

                      case 54:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, null, [[40, 45]]);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 11:
            if (!(Object.keys(requires).length === 0)) {
              _context2.next = 13;
              break;
            }

            return _context2.abrupt("return", src);

          case 13:
            _context2.next = 15;
            return babelify(src, [resolveExternal(requires)]);

          case 15:
            src = _context2.sent;

            if (src.endsWith(';')) {
              src = src.slice(0, -1); // for redundancy Semicolon
            }

            return _context2.abrupt("return", src);

          case 18:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.babelify = babelify;