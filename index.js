const babel = require('@babel/core')
const plugin = require('./babel')
const { resolveExternal } = require('./preprocess')
const makeWrapper = require('./wrapper')

exports.transpile = (src, opts) => {
  // first, preprocess
  src = resolveExternal(src)

  // then, babel it
  const result = babelIt(src, [plugin])
  src = babel.transformFromAstSync(result.ast, result.code, {
    retainLines: false,
    minified: false,
    sourceMaps: false,
    ['@babel/plugin-transform-flow-strip-types']
  })

  // finally, wrap it
  src = makeWrapper(src)

  console.log(src)

  return src
}

babelIt (src, plugins, sourceFilename = 'Contract source') {
  return babel.transformSync(src, {
    parserOpts: {
      sourceType: 'script',
      strictMode: true,
      sourceFilename,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins: [
        'asyncGenerators',
        'bigInt',
        'classPrivateMethods',
        'classPrivateProperties',
        'classProperties',
        ['decorators', { decoratorsBeforeExport: false }],
        'doExpressions',
        // 'dynamicImport',
        // 'exportDefaultFrom',
        // 'exportNamespaceFrom',
        'flow',
        'flowComments',
        'functionBind',
        'functionSent',
        // 'importMeta',
        'jsx',
        'logicalAssignment',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        ['pipelineOperator', { proposal: 'minimal' }],
        'throwExpressions'
      ]
    },
    retainLines: false,
    minified: false,
    sourceMaps: false,
    plugins
  })
}