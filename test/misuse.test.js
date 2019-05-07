const plugin = require('../src/babel')
const { babelify, transform } = require('../src/transform')

test('2 contract decorators error', () => {
  let src = `
    @contract class A {}
    @contract class B {}
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('one __on_deployed', () => {
  let src = `
    @contract class A {
      constructor() {}
      __on_deployed() {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('no __on_received', () => {
  let src = `
    @contract class A {
      __on_received() {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use function with state', () => {
  let src = `
    @contract class A {
      @state func = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('only state and pure in property', () => {
  let src = `
    @contract class A {
      @transaction a = 1
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('private method cannot payable', () => {
  let src = `
    @contract class A {
      @payable #privateFunc() {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('at lease one contract', () => {
  let src = `
    class A {}
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('non-payable @onreceive function should have empty body', () => {
  let src = `
    class A {
      @onreceive receive() { this.a = 1 }
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('only one @onreceive per class', () => {
  let src = `
    class A {
      @onreceive @payable receive() { this.a = 1 }
      @onreceive @payable receive2() { this.a2 = 1 }
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('only js and json, weak way', () => {
  let src = `
    const test = require('./misc/test.node')
    @contract class A {}
  `
  expect(transform(src, __dirname)).rejects.toThrow(Error)
})
