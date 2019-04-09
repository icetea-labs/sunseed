"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var validate = require("validate-npm-package-name");

var builtin = require('module').builtinModules;

var whiteListModules = (0, _toConsumableArray2["default"])(builtin);
exports.plugins = ["decorators-legacy", "classProperties", 'flow', 'flowComments', 'asyncGenerators', 'bigInt', 'classPrivateMethods', 'classPrivateProperties', 'classProperties', 'doExpressions', 'flow', 'flowComments', 'functionBind', 'functionSent', 'jsx', 'logicalAssignment', 'nullishCoalescingOperator', 'numericSeparator', 'objectRestSpread', 'optionalCatchBinding', 'optionalChaining', ['pipelineOperator', {
  proposal: 'minimal'
}], 'throwExpressions'];

exports.isHttp = function (value) {
  return value.startsWith('http://') || value.startsWith('https://');
};

exports.isNodeModule = function (value) {
  var _validate = validate(value),
      validForNewPackages = _validate.validForNewPackages,
      validForOldPackages = _validate.validForOldPackages;

  return validForNewPackages || validForOldPackages;
};

exports.isWhitelistModule = function (value) {
  return whiteListModules.includes(value);
};