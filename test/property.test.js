const plugin = require('../src/babel')
const { babelify } = require('../src/transform')
const { transpile } = require('../src')
const makeWrapper = require('../src/wrapper')

test('pure property', () => {
  let src = `
    @contract class A {
      @pure state = 1
      @pure method = () => 1
    }
  `
  src = babelify(src, [plugin])

  // wrapper is easy logic but long
  // only run once for coverage
  makeWrapper(src).trim()

  expect(src).toBe(`class A {
  state = 1;
  method = () => 1;
}

const __contract = new A();

const __metadata = {
  state: {
    type: "ClassProperty",
    decorators: ["pure"],
    fieldType: "any"
  },
  method: {
    type: "ClassProperty",
    decorators: ["pure"],
    returnType: "any",
    params: []
  }
};`)
})

test('cannot duplicate getter and setter', () => {
  let src = `
    @contract class A {
      @state state = 1

      get state() {
        return undefined
      }

      set state(value) {
        this.setState("state", undefined);
      }
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use function property with state', () => {
  let src = `
    @contract class A {
      @state func = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use Symbol with state', () => {
  let src = `
    @contract class A {
      @state symbol = Symbol()
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use WeakMap with state', () => {
  let src = `
    @contract class A {
      @state map = new WeakMap()
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use private function with state', () => {
  let src = `
    @contract class A {
      @state #func = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('try transpile', async () => {
  const cannotMinStateSrc = `
  @contract class A {
    @state state = 1
  }
`

  const cannotMinSrc = `
    @contract class A {
      @pure state = () => 1
    }
  `

  await transpile(cannotMinStateSrc, { prettier: true })
  await transpile(cannotMinSrc, { prettier: true })
  // TODO: wait for Terser support classProperties
  await expect(transpile(cannotMinStateSrc, { minify: true })).rejects.toThrow(Error)
  await expect(transpile(cannotMinSrc, { minify: true })).rejects.toThrow(Error)
})

test('getState default', async () => {
  let src = `
    @contract class A {
      @state numberState = 1
      @state arrayState = [1, 2, 3]
      @state sumState = 1 + 2
      @state objState = { state: 1 }
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  numberState = __path("numberState", 1);
  arrayState = __path("arrayState", [1, 2, 3]);
  sumState = __path("sumState", 1 + 2);
  objState = __path("objState", {
    state: 1
  });
}

const __contract = new A();

const __metadata = {
  numberState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  },
  arrayState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  },
  sumState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  },
  objState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  }
};`)
})
