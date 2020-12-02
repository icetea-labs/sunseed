const template = require('@babel/template')
const { isWhitelistModule } = require('../common')

class Icetea {
  constructor (types, data) {
    this.types = types
    this.data = data
  }

  run (path) {
    const node = path.node
    if (!node || node.callee.name !== 'require') {
      return
    }
    const arguments_ = node.arguments
    if (!arguments_.length || arguments_[0].type !== 'StringLiteral') {
      return
    }
    const value = arguments_[0].value
    const code = this.data[value]

    if (!code) {
      if (!isWhitelistModule(value)) {
        throw this.buildError('External source not found for non-whitelist moduel: ' + value, node)
      }
      return
    }

    if (value.endsWith('.json')) {
      path.replaceWith(this.types.valueToNode(code))
    } else {
      const fn = template.expression(`(function () {
        const module={exports:{}}
        const exports=module.exports;
        CODE
        ;return module.exports
      })()`)
      path.replaceWith(fn({
        CODE: code
      }))
    }
  }

  buildError (message, nodePath) {
    if (nodePath && nodePath.buildCodeFrameError) {
      throw nodePath.buildCodeFrameError(message)
    }
    throw new SyntaxError(message)
  }
}

module.exports = function (data) {
  return function (babel) {
    const { types: t } = babel

    return {
      visitor: {
        CallExpression: function (path) {
          new Icetea(t, data).run(path)
        }
      }
    }
  }
}
