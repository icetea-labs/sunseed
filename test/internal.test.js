const plugin = require('../src/babel')
const { babelify } = require('../src/transform')

describe('internal new feature', () => {
  test('some misuse situation', () => {
    let src = '@contract class PrivateProp { @internal #prop }'
    expect(() => {
      src = babelify(src, [plugin])
    }).toThrow(SyntaxError)

    src = '@contract class PureProp { @internal @pure prop }'
    expect(() => {
      src = babelify(src, [plugin])
    }).toThrow(SyntaxError)

    src = '@contract class PrivateFunc { @internal #func () {} }'
    expect(() => {
      src = babelify(src, [plugin])
    }).toThrow(SyntaxError)
  })

  test('internal default', () => {
    let src = `
      @contract class Internal { 
        #pure
        pure
        #func = () => {}
        func () {}
      }
    `
    src = babelify(src, [plugin])
    expect(src).toBe(`class Internal {
  #pure;
  pure;
  #func = () => {};

  func() {}

}

const __contract = new Internal();

const __metadata = {
  "#pure": {
    type: "ClassPrivateProperty",
    decorators: ["pure"],
    fieldType: "any"
  },
  pure: {
    type: "ClassProperty",
    decorators: ["internal"],
    fieldType: "any"
  },
  "#func": {
    type: "ClassPrivateProperty",
    decorators: ["view"],
    returnType: "any",
    params: []
  },
  func: {
    type: "ClassMethod",
    decorators: ["internal"],
    returnType: "any",
    params: []
  }
};`)
  })
})
