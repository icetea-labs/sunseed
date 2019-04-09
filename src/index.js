const babel = require('@babel/core')
const prettier = require("prettier")
const Terser = require("terser")
const flowPlugin = require('@babel/plugin-transform-flow-strip-types')

const plugin = require('./babel')
const makeWrapper = require('./wrapper')
const { transform } = require('./transform')

exports.transpile = async (src, { 
  minify = false,
  minifyOpts = {},
  prettier = false,
  prettierOpts = {},
  context = "/" }) => {

  src = await transform(src, context)

  // The decorated plugins should append this, but for now we add here to simplify
  src += ';const __contract = new __contract_name();const __metadata = {}'
  // then, babelify it
  src = babelify(src, [plugin])

  // remove flow types
  src = babelify(src, [flowPlugin])

  // finally, wrap it
  src = makeWrapper(src).trim()

  // preparation for minified
  src = prettify(src, {semi: true})

  if (prettier) {
    src = prettify(src, prettierOpts)
  } else if (minify) {
    src = doMinify(src, minifyOpts)
  }

  // console.log(src)

  return src
}

function babelify (src, plugins, sourceFilename = 'Contract source') {
  return babel.transformSync(src, {
    parserOpts: {
      sourceType: 'module',
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
  }).code
}

function prettify(src, opts = {}) {
  return prettier.format(src, { parser: "babel", ...opts })
}

function doMinify(src, opts = {}) {
  const result = Terser.minify(src, {
    parse: {
      bare_returns: true
    },
    ...opts
  })
  return result.code
}