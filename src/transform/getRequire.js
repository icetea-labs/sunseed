const traverse = require('@babel/traverse').default
const babelParser = require('@babel/parser')
const { plugins } = require('../common')

module.exports.getRequire = (src) => {
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
  return requires
}
