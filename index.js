const babel = require('@babel/core')
const plugin = require('./babel')
const { resolveExternal } = require('./preprocess')
const makeWrapper = require('./wrapper')

const prettier = require("prettier")
const UglifyJS = require("uglify-js")

exports.transpile = async (src, { 
  uglify = true,
  uglifyOpts = {},
  prettier = false,
  prettierOpts = {} }) => {
  // first, preprocess
  src = await resolveExternal(src)

  // The decorated plugins should append this, but for now we add here to simplify
  src += ';const __contract = new __contract_name();const __metadata = {}'
  // then, babelify it
  src = babelify(src, [plugin])

  // remove flow types
  src = babelify(src,['@babel/plugin-transform-flow-strip-types'])

  // finally, wrap it
  src = makeWrapper(src).trim()

  if (prettier) {
    src = prettify(src, prettierOpts)
  } else if (uglify) {
    src = minify(src, uglifyOpts)
  }

  console.log(src)

  return src
}

function babelify (src, plugins, sourceFilename = 'Contract source') {
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
  }).code
}

function prettify(src, opts = {}) {
  return prettier.format(src, { semi: false, parser: "babel", ...opts })
}

function minify(src, opts = {}) {
  return UglifyJS.minify(src, { 
    parse: {
      bare_returns: true
    },
    ...opts
  })
}