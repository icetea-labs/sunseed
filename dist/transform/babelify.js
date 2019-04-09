"use strict";

var babel = require('@babel/core');

module.exports = function (src, plugins) {
  var sourceFilename = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'Contract source';
  return babel.transformSync(src, {
    parserOpts: {
      sourceType: 'module',
      strictMode: true,
      sourceFilename: sourceFilename,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins: ['asyncGenerators', 'bigInt', 'classPrivateMethods', 'classPrivateProperties', 'classProperties', ['decorators', {
        decoratorsBeforeExport: false
      }], 'doExpressions', // 'dynamicImport',
      // 'exportDefaultFrom',
      // 'exportNamespaceFrom',
      'flow', 'flowComments', 'functionBind', 'functionSent', // 'importMeta',
      'jsx', 'logicalAssignment', 'nullishCoalescingOperator', 'numericSeparator', 'objectRestSpread', 'optionalCatchBinding', 'optionalChaining', ['pipelineOperator', {
        proposal: 'minimal'
      }], 'throwExpressions']
    },
    retainLines: false,
    minified: false,
    sourceMaps: false,
    plugins: plugins
  }).code;
};