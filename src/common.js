const validate = require('validate-npm-package-name')

module.exports.plugins = [
  'decorators-legacy',
  'classProperties',
  'asyncGenerators',
  'bigInt',
  'classPrivateMethods',
  'classPrivateProperties',
  'classProperties',
  'doExpressions',
  'flow',
  'flowComments',
  'functionBind',
  'functionSent',
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

module.exports.isHttp = (value) => {
  return value.startsWith('http://') || value.startsWith('https://')
}

module.exports.isNodeModule = (value) => {
  const { validForNewPackages, validForOldPackages } = validate(value)
  return validForNewPackages || validForOldPackages
}

let whiteListModules = [
  'lodash', 'moment', 'big.js', '@hapi/joi', 'validator', 'ajv', 'cheerio', '@iceteachain/utils', ';',
  'assert', 'buffer', 'crypto', 'querystring', 'stream', 'string_decoder', 'url', 'util', 'create-hash'
]

module.exports.isWhitelistModule = (value) => {
  return whiteListModules.some(element => {
    return value === element || value.startsWith(`${element}/`)
  })
}

module.exports.getWhiteListModules = () => {
  return whiteListModules
}

module.exports.setWhiteListModules = (modules) => {
  whiteListModules = modules
}

module.exports.addWhiteListModule = (module) => {
  if (whiteListModules.includes(module)) {
    return
  }
  whiteListModules.push(module)
}

module.exports.removeWhiteListModule = (module) => {
  whiteListModules = whiteListModules.filter(whitelist => (whitelist !== module))
}

module.exports.typeOf = (node) => {
  if (!node) {
    return 'undefined'
  }
  const type = node.type
  const valueType = node.value && node.value.type
  if (['ClassMethod', 'ClassPrivateMethod'].includes(type) || ['FunctionExpression', 'ArrowFunctionExpression'].includes(valueType)) {
    return 'function'
  }
  if (valueType === 'CallExpression' && node.value.callee && node.value.callee.name === 'Symbol') {
    return 'symbol'
  }
  if (valueType === 'NewExpression' && node.value.callee && node.value.callee.name === 'WeakMap') {
    return 'weakmap'
  }
  return 'object'
}

module.exports.isNode = () => typeof process !== 'undefined' && process.versions != null && process.versions.node != null
