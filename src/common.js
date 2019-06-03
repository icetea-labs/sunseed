const validate = require('validate-npm-package-name')

exports.plugins = [
  'decorators-legacy',
  'classProperties',
  'flow',
  'flowComments',
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

exports.isHttp = (value) => {
  return value.startsWith('http://') || value.startsWith('https://')
}

exports.isNodeModule = (value) => {
  const { validForNewPackages, validForOldPackages } = validate(value)
  return validForNewPackages || validForOldPackages
}

let whiteListModules = [
  'lodash', 'moment', 'big.js', '@hapi/joi', 'validator', 'ajv', 'cheerio', '@icetea/polytils', 'icetea-botutils',
  'assert', 'buffer', 'crypto', 'querystring', 'stream', 'string_decoder', 'url', 'util'
]

exports.isWhitelistModule = (value) => {
  return whiteListModules.some(element => {
    return value === element || value.startsWith(`${element}/`)
  })
}

exports.getWhiteListModules = () => {
  return whiteListModules
}

exports.setWhiteListModules = (modules) => {
  whiteListModules = modules
}

exports.addWhiteListModule = (module) => {
  if (whiteListModules.includes(module)) {
    return
  }
  whiteListModules.push(module)
}

exports.removeWhiteListModule = (module) => {
  whiteListModules = whiteListModules.filter(whitelist => (whitelist !== module))
}
