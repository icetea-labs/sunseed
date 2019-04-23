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
                var _data, _data2, _filePath, _data3, filePath, data;

                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!isHttp(value)) {
                          _context.next = 8;
                          break;
                        }

                        _context.next = 3;
                        return axios.get(value);

                      case 3:
                        _data = _context.sent.data;
                        _context.next = 6;
                        return exports.transform(_data, value);

                      case 6:
                        requires[value] = _context.sent;
                        return _context.abrupt("return");

                      case 8:
                        if (!(isNodeModule(value) && isWhitelistModule(value))) {
                          _context.next = 11;
                          break;
                        }

                        delete requires[value];
                        return _context.abrupt("return");

                      case 11:
                        if (!isHttp(context)) {
                          _context.next = 21;
                          break;
                        }

                        if (!isNodeModule(value)) {
                          _context.next = 14;
                          break;
                        }

                        throw new Error('Cannot use node_module in remote url');

                      case 14:
                        _context.next = 16;
                        return axios.get(url.resolve(context, value));

                      case 16:
                        _data2 = _context.sent.data;
                        _context.next = 19;
                        return exports.transform(_data2, url.resolve(context, value));

                      case 19:
                        requires[value] = _context.sent;
                        return _context.abrupt("return");

                      case 21:
                        if (!isNodeModule(value)) {
                          _context.next = 29;
                          break;
                        }

                        if (isWhitelistModule(value)) {
                          _context.next = 28;
                          break;
                        }

                        _filePath = require.resolve("".concat(value)); // to ignore webpack warning

                        _data3 = fs.readFileSync(_filePath).toString();
                        _context.next = 27;
                        return exports.transform(_data3, path.dirname(_filePath));

                      case 27:
                        requires[value] = _context.sent;

                      case 28:
                        return _context.abrupt("return");

                      case 29:
                        filePath = require.resolve("".concat(path.resolve(context, value)));
                        data = fs.readFileSync(filePath).toString();
                        _context.next = 33;
                        return exports.transform(data, path.dirname(filePath));

                      case 33:
                        requires[value] = _context.sent;

                      case 34:
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
            return _context2.abrupt("return", src);

          case 15:
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