const plugin = require('../src/plugins/main')
const babelify = require('../src/babelify')
const { transpile } = require('../src')
const makeWrapper = require('../src/wrapper/entryWrapper')

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

  expect(src).toEqual(`class A {
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
      @state state: number = 1
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
      @state func: function = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use Symbol with state', () => {
  let src = `
    @contract class A {
      @state symbol: Symbol = Symbol()
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use WeakMap with state', () => {
  let src = `
    @contract class A {
      @state map: WeakMap = new WeakMap()
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use private function with state', () => {
  let src = `
    @contract class A {
      @state #func: function = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('try transpile', async () => {
  const cannotMinStateSrc = `
  @contract class A {
    @state state: number = 1
  }
`

  const cannotMinSrc = `
    @contract class A {
      @pure state = () => 1
    }
  `

  await transpile(cannotMinStateSrc, { prettier: true })
  await transpile(cannotMinSrc, { prettier: true })

  await expect(transpile(cannotMinStateSrc, { minify: true })).resolves.toBeDefined()
  await expect(transpile(cannotMinSrc, { minify: true })).resolves.toBeDefined()
})

test('getState default', async () => {
  let src = `
    @contract class A {
      @state numberState: number = 1
      @state arrayState: array = [1, 2, 3]
      @state sumState: number = 1 + 2
      @state objState: object = { state: 1 }
    }
  `
  src = babelify(src, [plugin])
  expect(src).toEqual(`class A {
  numberState = __define("numberState", 1);
  arrayState = __define("arrayState", [1, 2, 3]);
  sumState = __define("sumState", 1 + 2);
  objState = __define("objState", {
    state: 1
  });
}

const __contract = new A();

const __metadata = {
  numberState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["number"]
  },
  arrayState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["array"]
  },
  sumState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["number"]
  },
  objState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["object"]
  }
};`)
})
