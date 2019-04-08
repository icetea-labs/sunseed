const validate = require("validate-npm-package-name")

exports.plugins = [
  "decorators-legacy",
  "classProperties",
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
  return validForNewPackages && validForOldPackages
}

exports.isWhitelistModule = (value) => {
  return [].includes(value)
}
