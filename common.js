const validate = require("validate-npm-package-name")

exports.plugins = [
  "decorators-legacy",
  "classProperties",
  'flow',
  'flowComments',
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
