const prettier = require('prettier/standalone')
const plugins = [require('prettier/parser-babylon')]
const Terser = require('terser')
const flowPlugin = require('@babel/plugin-transform-flow-strip-types')
const { isNode } = require('./common')
const babelify = require('./babelify')
const mainPlugin = require('./plugins/main')
const import2require = require('./plugins/import2require')
const transform = require('./transform')
const makeWrapper = require('./wrapper')
const { getWhiteListModules, setWhiteListModules, addWhiteListModule, removeWhiteListModule } = require('./common')

const transpile = async (src, options = {}) => {
  const {
    minify = false,
    minifyOpts = {},
    prettier = false,
    prettierOpts = {},
    buildOpts = {},
    project // for studio support file, to keep deadline, TODO: remove if possible
  } = options

  if (isNode() && project) {
    throw new Error('options.project is only on browser')
  }

  src = babelify(src, [mainPlugin, flowPlugin, import2require])

  // browserify it
  src = await transform(src, project, buildOpts)

  // Minify need semi to work properly
  src = prettify(src, { semi: true })

  if (prettier) {
    src = prettify(src, prettierOpts)
  } else if (minify) {
    try {
      src = doMinify(src, minifyOpts)
    } catch (err) {
      throw new Error(`Terser minify does not support some new node features, err=${err}`)
    }
  }

  return src
}

const simpleTranspile = (src, options = {}) => {
  const {
    minify = false,
    minifyOpts = {},
    prettier = false,
    prettierOpts = {}
  } = options

  src = babelify(src, [mainPlugin, flowPlugin, import2require])

  // finally, wrap it
  src = makeWrapper(src).trim()

  // preparation for minified
  src = prettify(src, { semi: true })

  if (prettier) {
    src = prettify(src, prettierOpts)
  } else if (minify) {
    src = doMinify(src, minifyOpts)
  }

  return src
}

function prettify (src, opts = {}) {
  return prettier.format(src, { parser: 'babel', plugins })
}

function doMinify (src, opts = {}) {
  const result = Terser.minify(src, {
    parse: {
      bare_returns: true
    },
    keep_classnames: true,
    keep_fnames: true,
    ...opts
  })
  if (result.error) {
    throw new Error(JSON.stringify(result.error))
  }
  return result.code
}

module.exports = { transpile, simpleTranspile, addWhiteListModule, removeWhiteListModule, getWhiteListModules, setWhiteListModules }
