"use strict";

var validate = require('validate-npm-package-name');

exports.plugins = ['decorators-legacy', 'classProperties', 'flow', 'flowComments', 'asyncGenerators', 'bigInt', 'classPrivateMethods', 'classPrivateProperties', 'classProperties', 'doExpressions', 'flow', 'flowComments', 'functionBind', 'functionSent', 'jsx', 'logicalAssignment', 'nullishCoalescingOperator', 'numericSeparator', 'objectRestSpread', 'optionalCatchBinding', 'optionalChaining', ['pipelineOperator', {
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

var whiteListModules = ['lodash', 'moment', 'big.js', '@hapi/joi', 'validator', 'ajv', 'cheerio', '@icetea/polytils', 'icetea-botutils', 'assert', 'buffer', 'crypto', 'querystring', 'stream', 'string_decoder', 'url', 'util'];

exports.isWhitelistModule = function (value) {
  return whiteListModules.some(function (element) {
    return value === element || value.startsWith("".concat(element, "/"));
  });
};

exports.getWhiteListModules = function () {
  return whiteListModules;
};

exports.setWhiteListModules = function (modules) {
  whiteListModules = modules;
};

exports.addWhiteListModule = function (module) {
  if (whiteListModules.includes(module)) {
    return;
  }

  whiteListModules.push(module);
};

exports.removeWhiteListModule = function (module) {
  whiteListModules = whiteListModules.filter(function (whitelist) {
    return whitelist !== module;
  });
};