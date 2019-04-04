const url = require('url')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const babelParser = require('@babel/parser')
const { plugins, isHttp } = require('../common')
const resolveExternal = require('../external')
const importToRequire = require('../import2require')
const babelify = require('./babelify')

exports.transform = async (src, context = "") => {
  src = await babelify(src, [importToRequire])
  const parsed = babelParser.parse(src, {
    sourceType: "module",
    plugins
  })
  let requires = {}

  const bodies = parsed.program.body
  await Promise.all(bodies.map(async body => {
    if(body.type === 'VariableDeclaration') {
      if(body.declarations.length === 1) {
        const declaration = body.declarations[0]
        if(declaration.type === 'VariableDeclarator' && declaration.init.type === 'CallExpression' && declaration.init.callee.name === 'require') {
          const arguments_ = declaration.init.arguments
          if(arguments_.length === 1 && arguments_[0].type === 'StringLiteral') {
            const value = arguments_[0].value
            if(isHttp(value)) {
              const data = (await axios.get(value)).data
              requires[value] = await exports.transform(data, value)
            } else {
              if(isHttp(context)) {
                const data = (await axios.get(url.resolve(context, value))).data
                requires[value] = await exports.transform(data, url.resolve(context, value))
              }

              let filePath = value
              if(!filePath.endsWith('.js')) {
                filePath += "/index.js"
              }
              if(context && !value.startsWith("/")) {
                filePath = path.resolve(context, filePath)
              }
              const data = fs.readFileSync(filePath).toString()
              requires[value] = await exports.transform(data, filePath.startsWith("/") ? path.dirname(filePath) : "")
            }
          }
        }
      }
    }
  }))

  if(requires === {}) {
    return src
  }

  // first, preprocess
  src = await babelify(src, [resolveExternal(requires)])
  return src
}

exports.babelify = babelify