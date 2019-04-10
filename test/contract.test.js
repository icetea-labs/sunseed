const Terser = require("terser")
const plugin = require('../src/babel')
const { babelify } = require('../src/transform')

test('constructor to deploy', () => {
  let src = `
    @contract class A {
      constructor() {}
    }
  `
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('class A{__on_deployed(){}}const __contract=new A,__metadata={__on_deployed:{type:"ClassMethod",decorators:["view"],returnType:"any",params:[]}};')
})

test('onreceive method', () => {
  let src = `
    @contract class A {
      @onreceive receive() {}
    }
  `
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  // expect(src).toBe('class A{__on_deployed(){}}const __contract=new A,__metadata={__on_deployed:{type:"ClassMethod",decorators:["view"],returnType:"any",params:[]}};')
})

test('state', () => {
  let src = `
    @contract class A {
      @state property
    }
  `
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('class A{get property(){return this.getState("property")}set property(t){this.setState("property",t)}}const __contract=new A,__metadata={property:{type:"ClassProperty",decorators:["state","view"],fieldType:"any"}};')
})

test('non constant', () => {
  let src = `
    @contract class A {
      property = () => {}
    }
  `
  src = babelify(src, [plugin])
  const { error }  = Terser.minify(src)
  expect(error.message).toBe('Unexpected token: operator (=)')
})

