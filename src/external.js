const template = require('@babel/template')
const { isNodeModule } = require('./common')

class IceTea {
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
    if (arguments_.length !== 1 || arguments_[0].type !== 'StringLiteral') {
      return
    }
    const value = arguments_[0].value
    const code = this.data[value]

    if (!code) {
      if (!isNodeModule(value)) {
        throw this.buildError('external source not found', node)
      }
      return
    }

    const fn = template.expression(`
      (function () {
        const module={exports:{}};
        const exports=module.exports;
        CODE
        return module.exports
      })()
    `)

    if (value.endsWith('.js')) {
      path.replaceWith(fn({
        CODE: code
      }))
    }
    if (value.endsWith('.json')) {
      path.replaceWith(this.types.valueToNode(code))
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
          new IceTea(t, data).run(path)
        }
      }
    }
  }
}
