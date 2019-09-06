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
  let src = `
    @contract class A {
      @state state = 1
    }
  `
  let cannotMinSrc = `
    @contract class A {
      @pure state = () => 1
    }
  `

  await transpile(src, { prettier: true })
  await transpile(src, { minify: true })
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
  get numberState() {
    const state = this.getState("numberState", 1);

    if (typeof state !== "object") {
      return state;
    }

    const setState = this.setState;
    const handler = {
      get(target, property, receiver) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        const value = Reflect.get(target, property, receiver);
        if (desc && !desc.writable && !desc.configurable) return value;

        if (typeof value === 'object') {
          return new Proxy(value, handler);
        }

        return value;
      },

      defineProperty(target, property, descriptor) {
        const result = Reflect.defineProperty(target, property, descriptor);
        setState("numberState", state);
        return result;
      },

      deleteProperty(target, property) {
        const result = Reflect.deleteProperty(target, property);
        setState("numberState", state);
        return result;
      }

    };
    return new Proxy(state, handler);
  }

  set numberState(value) {
    this.setState("numberState", value);
  }

  get arrayState() {
    const state = this.getState("arrayState", [1, 2, 3]);

    if (typeof state !== "object") {
      return state;
    }

    const setState = this.setState;
    const handler = {
      get(target, property, receiver) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        const value = Reflect.get(target, property, receiver);
        if (desc && !desc.writable && !desc.configurable) return value;

        if (typeof value === 'object') {
          return new Proxy(value, handler);
        }

        return value;
      },

      defineProperty(target, property, descriptor) {
        const result = Reflect.defineProperty(target, property, descriptor);
        setState("arrayState", state);
        return result;
      },

      deleteProperty(target, property) {
        const result = Reflect.deleteProperty(target, property);
        setState("arrayState", state);
        return result;
      }

    };
    return new Proxy(state, handler);
  }

  set arrayState(value) {
    this.setState("arrayState", value);
  }

  get sumState() {
    const state = this.getState("sumState", 1 + 2);

    if (typeof state !== "object") {
      return state;
    }

    const setState = this.setState;
    const handler = {
      get(target, property, receiver) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        const value = Reflect.get(target, property, receiver);
        if (desc && !desc.writable && !desc.configurable) return value;

        if (typeof value === 'object') {
          return new Proxy(value, handler);
        }

        return value;
      },

      defineProperty(target, property, descriptor) {
        const result = Reflect.defineProperty(target, property, descriptor);
        setState("sumState", state);
        return result;
      },

      deleteProperty(target, property) {
        const result = Reflect.deleteProperty(target, property);
        setState("sumState", state);
        return result;
      }

    };
    return new Proxy(state, handler);
  }

  set sumState(value) {
    this.setState("sumState", value);
  }

  get objState() {
    const state = this.getState("objState", {
      state: 1
    });

    if (typeof state !== "object") {
      return state;
    }

    const setState = this.setState;
    const handler = {
      get(target, property, receiver) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        const value = Reflect.get(target, property, receiver);
        if (desc && !desc.writable && !desc.configurable) return value;

        if (typeof value === 'object') {
          return new Proxy(value, handler);
        }

        return value;
      },

      defineProperty(target, property, descriptor) {
        const result = Reflect.defineProperty(target, property, descriptor);
        setState("objState", state);
        return result;
      },

      deleteProperty(target, property) {
        const result = Reflect.deleteProperty(target, property);
        setState("objState", state);
        return result;
      }

    };
    return new Proxy(state, handler);
  }

  set objState(value) {
    this.setState("objState", value);
  }

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
