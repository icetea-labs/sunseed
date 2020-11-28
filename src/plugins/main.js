const template = require('@babel/template')
const types = require('@babel/types')
const { METHODS, FORBIDDEN_STATE_TYPES } = require('../constant')
const { typeOf } = require('../common')
let numberOfContracts = 0
let contractName = ''
let metadata = {}
let extendData = {}

function isMethod (node) {
  if (!node) return false
  const type = node.type
  if (type === 'ClassMethod' || type === 'ClassPrivateMethod') {
    return true
  }
  const valueType = node.value && node.value.type
  return valueType === 'FunctionExpression' ||
    valueType === 'ArrowFunctionExpression'
}

const SUPPORTED_TYPES = ['number', 'string', 'boolean', 'bigint', 'null', 'undefined',
  'function', 'array', 'map', 'set', 'date', 'regexp', 'promise', 'address', 'list', 'autolist']

function concatUnique (a, b) {
  if (!Array.isArray(a)) {
    a = [a]
  }
  if (!Array.isArray(b)) {
    b = [b]
  }
  const result = a.concat(b.filter(i => !a.includes(i)))

  for (let i = 0; i < result.length; i++) {
    if (!SUPPORTED_TYPES.includes(result[i])) {
      return 'any'
    }
  }

  if (result.length === 1) {
    return result[0]
  }

  return result
}

function getTypeName (node, insideUnion) {
  if (!node) return 'any'
  const ta = insideUnion ? node : node.typeAnnotation
  const tn = ta.type
  if (!tn) return 'any'
  let result
  if (tn === 'Identifier') {
    result = ta.name
  } else if (!tn.endsWith('TypeAnnotation')) {
    result = tn
  } else {
    result = tn.slice(0, tn.length - 14)
  }

  result = result.toLowerCase()

  // sanitize result

  if (result === 'void') {
    result = 'undefined'
  } else if (result === 'nullliteral') {
    result = 'null'
  } else if (result === 'generic') {
    const t = ta.id.name.toLowerCase()
    result = SUPPORTED_TYPES.includes(t) ? t : 'any'
  } else if (result === 'nullable') {
    result = concatUnique(['undefined', 'null'], getTypeName(ta))
  } else if (result === 'union') {
    result = []
    ta.types.forEach(ut => {
      result = concatUnique(result, getTypeName(ut, true))
    })
  } else if (!SUPPORTED_TYPES.includes(result)) {
    result = 'any'
  }
  return result !== 'any' && Array.isArray(result) ? result : [result]
}

function getTypeParams (params) {
  return params.map(p => {
    const item = p.left || p
    const param = {
      name: item.name,
      type: getTypeName(item.typeAnnotation)
    }
    if (p.right) {
      if (types.isNullLiteral(p.right)) {
        param.defaultValue = null
      } else if (types.isLiteral(p.right)) {
        param.defaultValue = p.right.value
      }
    }
    return param
  })
}

const METHOD_DECORATORS = ['transaction', 'view', 'pure', 'payable', 'internal', 'onreceive']
const PROPERTY_DECORATORS = ['state', 'pure', 'internal', 'view']

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ClassDeclaration: function (path) {
        new IceTea(t).classDeclaration(path)
      },
      Program: {
        exit (path) {
          new IceTea(t).exit(path.node)
        }
      }
    }
  }
}

class IceTea {
  constructor (types) {
    this.types = types // babel types
    this[METHODS.__ON_DEPLOYED] = 0 // count __on_deployed
    this.className = ''
    this.metadata = {}
    this.klass = undefined
    this.onDeployedPivot = 0 // appending state in exist ondeploy
  }

  classDeclaration (path) {
    const klass = path.node
    this.className = klass.id.name
    this.klass = klass
    if (!metadata[this.className]) {
      metadata[this.className] = {}
    }
    this.metadata = metadata[this.className]
    if (klass.superClass) {
      extendData[this.className] = klass.superClass.name
    }

    const contracts = this.findDecorators(klass, 'contract')
    numberOfContracts += contracts.length
    const ctor = this.findConstructor(klass)
    if (ctor) {
      ctor.kind = 'method'
      ctor.key.name = METHODS.__ON_DEPLOYED
      this.replaceSuper(ctor)
    }

    if (contracts.length > 0) {
      contractName = klass.id.name
      this.deleteDecorators(klass, contracts)
    }

    path.get('body.body').map(body => {
      if (['ClassProperty', 'ClassPrivateProperty'].includes(body.node.type)) {
        this.classProperty(body)
      } else if (['ClassMethod', 'ClassPrivateMethod'].includes(body.node.type)) {
        this.classMethod(body.node)
      }
    })
  }

  classProperty (path) {
    const { node } = path
    const decorators = node.decorators || []

    if (!decorators.every(decorator => {
      return PROPERTY_DECORATORS.includes(decorator.expression.name)
    })) {
      const allowDecorators = PROPERTY_DECORATORS.map(method => `@${method}`)
      throw this.buildError(`Only ${allowDecorators.join(', ')} are valid for a class field.`, node)
    }

    const internals = this.findDecorators(node, 'internal')
    const name = node.key.name || ('#' + node.key.id.name) // private property does not have key.name

    if (internals.length > 0) {
      if (name.startsWith('#')) {
        throw this.buildError('Private field cannot be @internal.', node)
      }
      if (decorators.some(decorator => {
        return ['transaction', 'view', 'pure', 'onreceive'].includes(decorator.expression.name)
      })) {
        throw this.buildError('A @transaction, @view, @pure or @onreceive field cannot be @internal.', node)
      }
    }

    if (this.isState(node)) {
      const typeOfNode = typeOf(node)
      if (FORBIDDEN_STATE_TYPES.includes(typeOfNode)) {
        throw this.buildError(`${typeOfNode} cannot be marked as @state.`, node)
      }

      const indents = this.findMethodDefinition(this.klass, name)
      if (indents.length > 0) {
        throw this.buildError(`${name} is already marked @state and cannot have getter or setter.`, node)
      }

      const pures = this.findDecorators(node, 'pure')
      if (pures.length > 0) {
        throw this.buildError(`${name} cannot be marked with both @state and @pure.`, node)
      }

      if (!this.isConstant(node.value)) {
        const klassPath = path.parentPath.parentPath
        const onDeploy = this.findOrCreateOnDeployed(klassPath)
        const fn = template.smart(`
          this.NAME.value(DEFAULT)
        `)
        onDeploy.body.body.splice(this.onDeployedPivot, 0, fn({
          NAME: name,
          DEFAULT: node.value
        }))
        this.onDeployedPivot += 1
      }

      this.wrapState(path, this.isConstant(node.value))

      if (!this.metadata[name]) {
        const decoratorNames = decorators.map(decorator => decorator.expression.name)
        if (decoratorNames.length === 1 && decoratorNames[0] === 'state') {
          decoratorNames.push('internal')
        }
        this.metadata[name] = {
          type: node.type,
          decorators: decoratorNames,
          fieldType: getTypeName(node.typeAnnotation)
        }
      }

      return
    }

    if (this.isStateDependent(path) && !isMethod(node)) {
      const klassPath = path.parentPath.parentPath
      const onDeploy = this.findOrCreateOnDeployed(klassPath)
      const fn = template.smart('this.PROPERTY = VALUE')
      onDeploy.body.body.splice(this.onDeployedPivot, 0, fn({
        PROPERTY: name,
        VALUE: node.value
      }))
      this.onDeployedPivot += 1

      const property = template.smart(`NAME = msg.name === '${METHODS.__ON_DEPLOYED}' ? undefined : VALUE`)
      path.replaceWith(property({
        NAME: name,
        VALUE: node.value
      }))
    }

    if (!this.metadata[name]) {
      this.metadata[name] = {
        type: node.type,
        decorators: decorators.map(decorator => decorator.expression.name)
      }

      if (!isMethod(node)) {
        this.metadata[name].fieldType = getTypeName(node.typeAnnotation)
        if (decorators.length === 0) {
          if (name.startsWith('#')) { // private property
            this.metadata[name].decorators.push('pure')
          } else {
            this.metadata[name].decorators.push('internal')
          }
        }
      } else {
        this.metadata[name].returnType = getTypeName(node.value.returnType)
        this.metadata[name].params = getTypeParams(node.value.params)
        if (decorators.length === 0) {
          if (name.startsWith('#')) { // private function
            this.metadata[name].decorators.push('view')
          } else {
            this.metadata[name].decorators.push('internal')
          }
        }
      }
    }

    // delete propery decorator
    this.deleteDecorators(node, this.findDecorators(node, ...PROPERTY_DECORATORS))
  }

  classMethod (klass) {
    const decorators = klass.decorators || []

    if (!decorators.every(decorator => {
      return METHOD_DECORATORS.includes(decorator.expression.name)
    })) {
      const allowDecorators = METHOD_DECORATORS.map(method => `@${method}`)
      throw this.buildError(`Only ${allowDecorators.join(', ')} is allowed by method`, klass)
    }

    const name = klass.key.name || ('#' + klass.key.id.name)
    if (name === METHODS.__ON_RECEIVED) {
      throw this.buildError(`${METHODS.__ON_RECEIVED} cannot be specified directly.`, klass)
    }
    if (name === METHODS.__ON_DEPLOYED) {
      if (this[METHODS.__ON_DEPLOYED] > 0) {
        throw this.buildError(`${METHODS.__ON_DEPLOYED} cannot be specified directly.`, klass)
      }
      this[METHODS.__ON_DEPLOYED] += 1
    }
    if (name.startsWith('#')) {
      const payables = this.findDecorators(klass, 'payable')
      if (payables.length > 0) {
        throw this.buildError('Private function cannot be @payable.', klass)
      }
      const internals = this.findDecorators(klass, 'internal')
      if (internals.length > 0) {
        throw this.buildError('Private function cannot be @internal.', klass)
      }
    }

    if (!this.metadata[name]) {
      this.metadata[name] = {
        type: klass.type,
        decorators: decorators.map(decorator => decorator.expression.name),
        returnType: getTypeName(klass.returnType),
        params: getTypeParams(klass.params)
      }
      if (decorators.length === 0) {
        if (name.startsWith('#') || name === METHODS.__ON_DEPLOYED) { // private method
          this.metadata[name].decorators.push('view')
        } else {
          this.metadata[name].decorators.push('internal')
        }
      }
    }

    const onreceives = this.findDecorators(klass, 'onreceive')
    if (onreceives.length > 0) {
      const payables = this.findDecorators(klass, 'payable')
      if (payables.length === 0 && klass.body.body.length > 0) {
        throw this.buildError('Non-payable @onreceive function should have empty body.', klass)
      }
      if (this.metadata[METHODS.__ON_RECEIVED]) {
        throw this.buildError('Only one @onreceive is allowed per class.', klass)
      }
      this.metadata[METHODS.__ON_RECEIVED] = klass.key.name
    }

    this.deleteDecorators(klass, this.findDecorators(klass, ...METHOD_DECORATORS))
  }

  exit (node) {
    if (numberOfContracts === 0) {
      throw this.buildError('Your smart contract does not have a @contract class.', node)
    }
    if (numberOfContracts > 1) {
      throw this.buildError('Your smart contract has more than one @contract classes.', node)
    }

    let name = contractName
    let parent = extendData[name]
    while (parent) {
      metadata[contractName] = { ...metadata[parent], ...metadata[contractName] }
      name = parent
      parent = extendData[name]
    }

    this.appendNewCommand(node)
    this.appendMetadata(node)
    this.reset()
  }

  reset () {
    numberOfContracts = 0
    contractName = ''
    metadata = {}
    extendData = {}
  }

  replaceSuper (ctor) {
    ctor.body.body = ctor.body.body.map(body => {
      if (!body.expression || body.expression.type !== 'CallExpression') {
        return body
      }
      if (body.expression.callee.type === 'Super') {
        const superTemplate = template.smart(`
          super.${METHODS.__ON_DEPLOYED}(ARGUMENTS)
        `)
        body = superTemplate({
          ARGUMENTS: body.expression.arguments
        })
      }
      return body
    })
  }

  wrapState (path, useInitValue = true) {
    const { node } = path
    const name = node.key.name || ('#' + node.key.id.name)
    const fieldType = getTypeName(node.typeAnnotation)[0]
    let defineType = 'define'
    if (fieldType === 'list') defineType = 'defineList'
    if (fieldType === 'autolist') defineType = 'defineAutoList'
    const wrap = template.smart(`
      class noname {
        NAME = ${defineType}('NAME', DEFAULT)
      }
    `, {
      plugins: ['classProperties']
    })
    path.replaceWithMultiple(wrap({
      NAME: name,
      DEFAULT: useInitValue ? node.value : undefined
    }).body.body)
  }

  appendNewCommand (node) {
    const append = template.smart(`
      const __contract = new NAME();
    `)
    node.body.push(append({
      NAME: contractName
    }))
  }

  appendMetadata (node) {
    const meta = template.smart(`
      const __metadata = META
    `)
    node.body.push(meta({
      META: this.types.valueToNode(metadata[contractName])
    }))
  }

  findConstructor (klass) {
    return klass.body.body.filter(body => {
      return body.kind === 'constructor'
    })[0]
  }

  findMethodDefinition (klass, name) {
    return klass.body.body.filter(body => {
      return ['MethodDefinition', 'ClassMethod'].includes(body.type) &&
        body.key.name === name &&
        ['get', 'set'].includes(body.kind)
    })
  }

  findMethod (klass, ...names) {
    return klass.body.body.filter(body => {
      return body.type === 'ClassMethod' && names.includes(body.key.name)
    })[0]
  }

  buildError (message, nodePath) {
    this.reset()
    if (nodePath && nodePath.buildCodeFrameError) {
      return nodePath.buildCodeFrameError(message)
    }
    return new SyntaxError(message)
  }

  findDecorators (klass, ...names) {
    return (klass.decorators || []).filter(decorator => {
      return names.includes(decorator.expression.name)
    })
  }

  deleteDecorators (klass, decorators) {
    decorators.forEach(decorator => {
      const index = klass.decorators.indexOf(decorator)
      if (index >= 0) {
        klass.decorators.splice(index, 1)
      }
    })
  }

  isConstant (value) {
    if (value === null || value === undefined) {
      return true
    }
    const { types } = this
    if (types.isLiteral(value) && value.type !== 'TemplateLiteral') {
      return true
    }
    if (value.type === 'ArrayExpression') {
      return value.elements && value.elements.every(element => {
        return this.isConstant(element)
      })
    }
    if (value.type === 'BinaryExpression') {
      return value.left && value.right && this.isConstant(value.left) && this.isConstant(value.right)
    }
    if (value.type === 'ObjectExpression') {
      return value.properties && value.properties.every(property => {
        return property.key.type !== 'TemplateLiteral' && this.isConstant(property.value)
      })
    }
    if (['FunctionExpression', 'ArrowFunctionExpression'].includes(value.type)) {
      const { body } = value
      if (body.type === 'BlockStatement') {
        const returnStatement = body.body.find(block => block.type === 'ReturnStatement')
        if (!returnStatement) {
          return this.isConstant(returnStatement)
        }
        return this.isConstant(returnStatement.argument)
      }
      return this.isConstant(body)
    }
    return false
  }

  isState (node) {
    const states = this.findDecorators(node, 'state')
    return states.length > 0
  }

  isStateDependent (path) {
    let isDependent = false
    path.traverse({
      CallExpression (path) {
        const { node } = path
        if (!node.callee || !node.callee.property || !node.callee.object || !node.callee.object.object) {
          return
        }
        if (node.callee.type !== 'MemberExpression') {
          return
        }
        if (node.callee.property.name !== 'value' && node.callee.property.name !== 'get') {
          return
        }
        if (node.callee.object.object.type !== 'ThisExpression') {
          return
        }
        isDependent = true
      }
    })
    return isDependent
  }

  findOrCreateOnDeployed (klassPath) {
    let onDeploy = this.findMethod(klassPath.node, METHODS.__ON_DEPLOYED)
    if (!onDeploy) {
      // class noname is only used for valid syntax
      const fn = template.smart(`
          class noname {
            ${METHODS.__ON_DEPLOYED} () {}
          }
        `)
      klassPath.node.body.body.unshift(...fn().body.body)
      onDeploy = klassPath.node.body.body[0]
      this.metadata[METHODS.__ON_DEPLOYED] = {
        type: 'ClassMethod',
        decorators: ['payable']
      }
      this.onDeployedPivot = 0
    }
    return onDeploy
  }
}
