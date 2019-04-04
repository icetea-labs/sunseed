const url = require('url')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const babelParser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { plugins, isHttp, isNodeModule, isWhitelistModule } = require('../common')
const resolveExternal = require('../external')
const importToRequire = require('../import2require')
const babelify = require('./babelify')

exports.transform = async (src, context = "/", node_module="/") => {
  src = await babelify(src, [importToRequire])
  const parsed = babelParser.parse(src, {
    sourceType: "module",
    plugins
  })
  let requires = {}

  traverse(parsed, {
    CallExpression: ({ node }) => {
      if(!node || node.callee.name !== 'require') {
        return
      }
      const arguments_ = node.arguments
      if(arguments_.length !== 1 || arguments_[0].type !== 'StringLiteral') {
        return
      }
      const value = arguments_[0].value
      requires[value] = value
    }
  })

  await Promise.all(Object.keys(requires).map(async value => {
    if(isHttp(value)) {
      const data = (await axios.get(value)).data
      requires[value] = await exports.transform(data, value)
      return
    }
    if(isHttp(context)) {
      if(isNodeModule(value)) {
        throw new Error('Cannot use node_module in remote url')
      }
      const data = (await axios.get(url.resolve(context, value))).data
      requires[value] = await exports.transform(data, url.resolve(context, value))
      return
    }
    if(isNodeModule(value)) {
      if(!isWhitelistModule(value)) {
        const filePath = path.resolve(node_module, value, 'index.js')
        const data = fs.readFileSync(filePath).toString()
        requires[value] = await exports.transform(data, path.dirname(filePath), node_module)
      }
      return
    }
    let filePath = path.resolve(context, value)
    if(!filePath.endsWith('.js')) {
      if(fs.existsSync(filePath + ".js")) {
        filePath += ".js"
      } else {
        filePath += "/index.js"
      }
    }
    const data = fs.readFileSync(filePath).toString()
    requires[value] = await exports.transform(data, path.dirname(filePath), node_module)
  }))

  if(requires === {}) {
    return src
  }

  // first, preprocess
  src = await babelify(src, [resolveExternal(requires)])
  return src
}

exports.babelify = babelify