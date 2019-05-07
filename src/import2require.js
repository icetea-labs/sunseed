const template = require('@babel/template')

class IceTea {
  constructor (types) {
    this.types = types
  }

  run (klass) {
    const node = klass.node
    let source = `require('${node.source.value}')`
    const specifiers = node.specifiers
    let lefts = []
    let hasDefault = false

    const require1 = template.smart(`
      const LOCAL = SOURCE
    `)
    for (let specifier of specifiers) {
      if (specifier.type === 'ImportNamespaceSpecifier' || specifier.type === 'ImportDefaultSpecifier') {
        klass.replaceWith(
          require1({
            LOCAL: specifier.local.name,
            SOURCE: source
          })
        )
        source = specifier.local.name
        hasDefault = true
      }
      if (specifier.type === 'ImportSpecifier') {
        lefts.push([specifier.local.name, specifier.imported.name])
      }
    }
    if (lefts.length > 0) {
      let tmp = '{' + lefts.map(left => `${left[1]}: ${left[0]}`).join(', ') + '}'
      const require2 = template.smart(`
        const ${tmp} = SOURCE
      `)
      klass.insertAfter(
        require2({
          SOURCE: source
        })
      )
    }
    if (!hasDefault) {
      klass.remove()
    }
  }
}

module.exports = function (babel) {
  const { types: t } = babel

  return {
    visitor: {
      ImportDeclaration: function (node) {
        new IceTea(t).run(node)
      }
    }
  }
}
