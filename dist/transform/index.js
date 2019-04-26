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

exports.transform =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(src) {
    var context,
        parsed,
        requires,
        _args2 = arguments;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            context = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : "/";
            _context2.next = 3;
            return babelify(src, [importToRequire]);

          case 3:
            src = _context2.sent;
            parsed = babelParser.parse(src, {
              sourceType: "module",
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
            _context2.next = 9;
            return Promise.all(Object.keys(requires).map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee(value) {
                var _data, _data2, filePath, data;

                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!isHttp(value)) {
                          _context.next = 14;
                          break;
                        }

                        if (['.js', '.json'].includes(path.extname(value))) {
                          _context.next = 3;
                          break;
                        }

                        throw new Error('only support .js and .json');

                      case 3:
                        _context.next = 5;
                        return axios.get(value);

                      case 5:
                        _data = _context.sent.data;

                        if (!(typeof _data === 'string')) {
                          _context.next = 12;
                          break;
                        }

                        _context.next = 9;
                        return exports.transform(_data, value);

                      case 9:
                        requires[value] = _context.sent;
                        _context.next = 13;
                        break;

                      case 12:
                        requires[value] = _data;

                      case 13:
                        return _context.abrupt("return");

                      case 14:
                        if (!(isNodeModule(value) && isWhitelistModule(value))) {
                          _context.next = 17;
                          break;
                        }

                        delete requires[value];
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

                        throw new Error('Cannot use node_module in remote url');

                      case 20:
                        if (['.js', '.json'].includes(path.extname(value))) {
                          _context.next = 22;
                          break;
                        }

                        throw new Error('only support .js and .json');

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
                        return exports.transform(_data2, url.resolve(context, value));

                      case 28:
                        requires[value] = _context.sent;
                        _context.next = 32;
                        break;

                      case 31:
                        requires[value] = _data2;

                      case 32:
                        return _context.abrupt("return");

                      case 33:
                        if (isNodeModule(value)) {
                          filePath = require.resolve("".concat(value)); // to ignore webpack warning
                        } else {
                          filePath = require.resolve("".concat(path.resolve(context, value)));
                        }

                        if (['.js', '.json'].includes(path.extname(filePath))) {
                          _context.next = 36;
                          break;
                        }

                        throw new Error('only support .js and .json');

                      case 36:
                        data = fs.readFileSync(filePath).toString();

                        if (!(typeof data === 'string')) {
                          _context.next = 43;
                          break;
                        }

                        _context.next = 40;
                        return exports.transform(data, path.dirname(filePath));

                      case 40:
                        requires[value] = _context.sent;
                        _context.next = 44;
                        break;

                      case 43:
                        requires[value] = data;

                      case 44:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee);
              }));

              return function (_x2) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 9:
            if (!(requires === {})) {
              _context2.next = 11;
              break;
            }

            return _context2.abrupt("return", src);

          case 11:
            _context2.next = 13;
            return babelify(src, [resolveExternal(requires)]);

          case 13:
            src = _context2.sent;

            if (src.endsWith(';')) {
              src = src.slice(0, -1); // for redundancy Semicolon
            }

            return _context2.abrupt("return", src);

          case 16:
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