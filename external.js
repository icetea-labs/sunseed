const template = require("@babel/template");

class IceTea {
  constructor(types, data) {
    this.types = types
    this.data = data
  }

  run(klass) {
    const declarations = klass.declarations
    if(declarations.length === 1) {
      const declaration = declarations[0]
      if(declaration.type === 'VariableDeclarator' && declaration.init && declaration.init.type === 'CallExpression' && declaration.init.callee.name === 'require') {
        const arguments_ = declaration.init.arguments
        if(arguments_.length === 1 && arguments_[0].type === 'StringLiteral') {
          const value = arguments_[0].value
          const code = this.data[value]

          if(!code) {
            throw this.buildError('source not found', klass)
          }

          const fn = template.expression(`
            (function () {
              const module={exports:{}};
              const exports=module.exports;
              CODE
              return module.exports
            })()
          `);
          declaration.init = fn({
            CODE: code
          })
        }
      }
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
  return function(babel) {
    const { types: t } = babel;
  
    return {
      visitor: {
        VariableDeclaration: function (node) {
          new IceTea(t, data).run(node.node);
        }
      }
    };
  }
}
