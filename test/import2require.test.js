const importToRequire = require('../src/plugins/import2require')
const babelify = require('../src/babelify')

test('pure property', () => {
  let src = `
    import ms from 'ms'
    import * as ms2 from 'ms'
    import { a, b as c } from 'ms'
  `
  src = babelify(src, [importToRequire])
  expect(src).toBe(`const ms = require('ms');
const ms2 = require('ms');
const {
  a: a,
  b: c
} = require('ms');`)
})
