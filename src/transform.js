const traverse = require('@babel/traverse').default
const babelParser = require('@babel/parser')
const tempy = require('tempy')
const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const url = require('url')
const axios = require('axios')
const mkdirp = require('mkdirp')
const template = require('@babel/template')
const browserify = require('browserify')
const { isNode, plugins, getWhiteListModules, isHttp, isNodeModule } = require('./common')
const babelify = require('./babelify')
const makeWrapper = require('./wrapper')

const transform = async (src, project, options) => {
  const { remote } = options
  const parsed = babelParser.parse(src, {
    sourceType: 'module',
    plugins
  })
  const requires = {}
  traverse(parsed, {
    CallExpression: ({ node }) => {
      if (!node || node.callee.name !== 'require') {
        return
      }
      const arguments_ = node.arguments
      if (arguments_.length !== 1 || arguments_[0].type !== 'StringLiteral') {
        return
      }
      const value = arguments_[0].value
      requires[value] = value
    }
  })

  const dir = tempy.directory()

  if (isNode()) {
    src = await transformUseFs(src, dir, requires, remote)
  }
  return src
}

async function transformUseFs (src, dir, requires, remote) {
  const ignores = getWhiteListModules()
  await Promise.all(Object.keys(requires).map(async value => {
    if (remote && remote[value]) {
      delete requires[value]
      ignores.push(value)
      return true
    }
    if (isNodeModule(value)) {
      delete requires[value]
      return true
    }
    if (isHttp(value)) {
      const data = (await axios.get(value)).data
      const tmpdir = '.tmp-dir-' + Math.random().toFixed(20).slice(2)
      const parsed = new url.URL(value)
      const filename = path.basename(parsed.pathname)
      mkdirp.sync(`${dir}/${tmpdir}`)
      const filepath = `${dir}/${tmpdir}/${filename}`
      await fsp.writeFile(filepath, data)
      requires[value] = filepath
      return true
    }
    return true
  }))

  src = babelify(src, [function ({ types: t }) {
    return {
      visitor: {
        CallExpression: function (path) {
          const node = path.node
          if (!node || node.callee.name !== 'require') {
            return
          }
          const arguments_ = node.arguments
          if (!arguments_.length || arguments_[0].type !== 'StringLiteral') {
            return
          }
          const value = arguments_[0].value
          const filename = requires[value]
          if (!filename) {
            return
          }
          const fn = template.expression('require(\'NAME\')')
          path.replaceWith(fn({
            NAME: filename
          }))
        }
      }
    }
  }])

  src = makeWrapper(src).trim()

  const tmpfile = '.tmp-sunseed-' + Math.random().toFixed(20).slice(2) + '.js'
  await fsp.writeFile(`./${tmpfile}`, src)
  try {
    src = (await bundle(`./${tmpfile}`, ignores)).toString()
    await fsp.unlink(`./${tmpfile}`)
  } catch (err) {
    await fsp.unlink(`./${tmpfile}`)
    throw err
  }

  for (const key in requires) {
    src = src.replace(new RegExp(requires[key], 'g'), key)
  }

  return src
}

function bundle (filepath, ignores) {
  return new Promise((resolve, reject) => {
    const bundle = browserify(filepath, { node: true, builtins: false, ignoreMissing: true }).external(ignores).bundle()
    bundle.on('error', reject)
    const tmpfile = tempy.directory() + '/.tmp-browserify-' + Math.random().toFixed(20).slice(2)
    bundle.pipe(fs.createWriteStream(tmpfile))
    bundle.on('end', () => {
      fsp.readFile(tmpfile).then(resolve).catch(reject)
    })
  })
}

module.exports = transform
