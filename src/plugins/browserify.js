const template = require('@babel/template')

module.exports = function ({ types: t }) {
  return {
    visitor: {
      Program (path) {
        const { node } = path
        const main = node.body[0].expression
        const entryIndex = main.arguments[2].elements[0].value - 1
        const entryPath = path.get('body')[0].get('expression.arguments')[0].get('properties')[entryIndex]
        return processEntryFile(entryPath)
      }
    }
  }
}

function processEntryFile (path) {
  const entryFunction = path.get('value.elements')[0]
  const entryBody = entryFunction.get('body')

  const wrap = template.smart(`
    function inner(require,module,exports) {
      BODY
    }
    __return_value = inner.call(this,require,module,exports)
  `)
  entryBody.replaceWithMultiple(wrap({ BODY: entryBody.node }))

  const functionWrap = template.expression(`
    function (require,module,exports) {
      BODY
    }.bind(this)
  `)
  entryFunction.replaceWithMultiple(functionWrap({ BODY: entryBody.node }))
}
