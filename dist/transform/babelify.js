"use strict";

var babel = require('@babel/core');

var _require = require('../common'),
    babelPlugins = _require.plugins;

module.exports = function (src, plugins) {
  var sourceFilename = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'Contract source';
  return babel.transformSync(src, {
    parserOpts: {
      sourceType: 'module',
      strictMode: true,
      sourceFilename: sourceFilename,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins: babelPlugins
    },
    retainLines: false,
    minified: false,
    sourceMaps: false,
    plugins: plugins
  }).code;
};