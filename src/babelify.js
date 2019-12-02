const babel = require('@babel/core')
const { plugins: babelPlugins } = require('./common')

module.exports = (src, plugins, sourceFilename = 'Contract source') => {
  return babel.transformSync(src, {
    parserOpts: {
      sourceType: 'module',
      strictMode: true,
      sourceFilename,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins: babelPlugins
    },
    retainLines: false,
    minified: false,
    sourceMaps: false,
    plugins
  }).code
}
