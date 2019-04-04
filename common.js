exports.plugins = [
  "decorators-legacy",
  "classProperties"
]

exports.isHttp = (value) => {
  return value.startsWith('http://') || value.startsWith('https://')
}
