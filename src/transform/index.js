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

exports.transform = async (src, context = "/") => {
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
    if (isNodeModule(value) && isWhitelistModule(value)) {
      delete requires[value]
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
        const filePath = require.resolve(`${value}`) // to ignore webpack warning
        const data = fs.readFileSync(filePath).toString()
        requires[value] = await exports.transform(data, path.dirname(filePath))
      }
      return
    }
    const filePath = require.resolve(`${path.resolve(context, value)}`)
    const data = fs.readFileSync(filePath).toString()
    requires[value] = await exports.transform(data, path.dirname(filePath))
  }))

  if(requires === {}) {
    return src
  }

  // first, preprocess
  src = await babelify(src, [resolveExternal(requires)])
  return src
}

exports.babelify = babelify