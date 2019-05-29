const external = require('../src/external')
const { babelify } = require('../src/transform')

describe('external plugin', () => {
  test('require non string literal', () => {
    let src = `
      const test = require(1)
    `
    babelify(src, [external([])])
  })

  test('external source not found', () => {
    let src = `
      const test = require('./test')
    `
    expect(() => {
      src = babelify(src, [external([])])
    }).toThrow(SyntaxError)
  })
})
