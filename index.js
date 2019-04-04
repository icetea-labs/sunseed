const babel = require('@babel/core')
const prettier = require("prettier")
// const UglifyJS = require("uglify-js")
const Terser = require("terser")
const babelParser = require('@babel/parser')
const axios = require('axios')
const fs = require('fs')
const flowPlugin = require('@babel/plugin-transform-flow-strip-types')
const path = require('path')

const plugin = require('./babel')
const resolveExternal = require('./external')
const importToRequire = require('./import2require')
const makeWrapper = require('./wrapper')
const { plugins } = require('./common')

exports.transpile = async (src, { 
  minify = false,
  minifyOpts = {},
  prettier = false,
  prettierOpts = {},
  context = "" }) => {

  while(true) {
    // fetch resources first
    src = await babelify(src, [importToRequire])
    let hasRequire = false
    let result = {}
    const parsed = babelParser.parse(src, {
      sourceType: "module",
      plugins
    })
    const bodies = parsed.program.body
    await Promise.all(bodies.map(async body => {
      if(body.type === 'VariableDeclaration') {
        if(body.declarations.length === 1) {
          const declaration = body.declarations[0]
          if(declaration.type === 'VariableDeclarator' && declaration.init.type === 'CallExpression' && declaration.init.callee.name === 'require') {
            const arguments = declaration.init.arguments
            if(arguments.length === 1 && arguments[0].type === 'StringLiteral') {
              const value = arguments[0].value
              if(value.startsWith('http://') || value.startsWith('https://')) {
                result[value] = (await axios.get(value)).data
              } else {
                let filePath = value
                if(context && !value.startsWith("/")) {
                  filePath = path.resolve(context, filePath)
                }
                result[value] = fs.readFileSync(filePath).toString()
              }
              hasRequire = true
            }
          }
        }
      }
    }))

    if(!hasRequire) {
      break 
    }

    // first, preprocess
    src = await babelify(src, [resolveExternal(result)])
  }

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