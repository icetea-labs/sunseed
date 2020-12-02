const external = require('../src/plugins/external')
const babelify = require('../src/babelify')

describe('external plugin', () => {
  test('require non string literal', () => {
    const src = `
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
