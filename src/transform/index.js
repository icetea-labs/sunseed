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
      if(!['.js', '.json'].includes(path.extname(value))) {
        throw new Error('only support .js and .json')
      }
      const data = (await axios.get(value)).data
      if(typeof data === 'string') {
        requires[value] = await exports.transform(data, value)
      } else {
        requires[value] = data
      }
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
      if(!['.js', '.json'].includes(path.extname(value))) {
        throw new Error('only support .js and .json')
      }
      const data = (await axios.get(url.resolve(context, value))).data
      if(typeof data === 'string') {
        requires[value] = await exports.transform(data, url.resolve(context, value))
      } else {
        requires[value] = data
      }
      return
    }

    let filePath;
    if(isNodeModule(value)) {
      filePath = require.resolve(`${value}`) // to ignore webpack warning
    } else {
      filePath = require.resolve(`${path.resolve(context, value)}`)
    }
    if(!['.js', '.json'].includes(path.extname(filePath))) {
      throw new Error('only support .js and .json')
    }
    const data = fs.readFileSync(filePath).toString()
    if(typeof data === 'string') {
      requires[value] = await exports.transform(data, path.dirname(filePath))
    } else {
      requires[value] = data
    }
  }))

  if(requires === {}) {
    return src
  }

  // first, preprocess
  src = await babelify(src, [resolveExternal(requires)])
  if(src.endsWith(';')) {
    src = src.slice(0, -1) // for redundancy Semicolon
  }
  return src
}

exports.babelify = babelify