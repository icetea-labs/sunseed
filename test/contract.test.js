const Terser = require('terser')
const plugin = require('../src/babel')
const { babelify, transform } = require('../src/transform')

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
  const src = `
    @contract class A {
      @onreceive receive() {}
    }
  `
  babelify(src, [plugin])
  Terser.minify(src)
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
  const { error } = Terser.minify(src)
  expect(error.message).toBe('Unexpected token: operator (=)')
})

test('json remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/4b06f0eafc710a9ce54615c5d3d7e98d/raw/f1cf29bdac9d09d59f996f512c83f6d09c0710a2/test.json')
    @contract class A {}
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const test={test:1};class A{}const __contract=new A,__metadata={};')
})

test('js remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/2ff57e279116fd9e7ee3ae39b4e81860/raw/d5c5c2716d60b507c7f52ac99b7d5653230ed513/test.js')
    @contract class A {}
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const test=function(){const t={exports:{}};t.exports;return t.exports=(()=>"test"),t.exports}();class A{}const __contract=new A,__metadata={};')
})

test('whitelist require', async () => {
  let src = `
    const _ = require('lodash')
    @contract class A {
      @pure test() { return _.isEmpty([]) }
    }
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const _=require("lodash");class A{test(){return _.isEmpty([])}}const __contract=new A,__metadata={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};')
})

test('prefer local module', async () => {
  let src = `
    const moment = require('moment@local')
    @contract class A {
      @pure test() { return moment().format() }
    }
  `
  await transform(src)
  babelify(src, [plugin])
  Terser.minify(src)
})
