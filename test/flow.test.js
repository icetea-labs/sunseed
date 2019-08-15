const flowPlugin = require('@babel/plugin-transform-flow-strip-types')
const plugin = require('../src/babel')
const { babelify } = require('../src/transform')

test('typed state', () => {
  let src = `
    @contract class Typed {
      @state state: number
      @state #state: number

      @pure test(arg1: number = 1, arg2: string = null) : void {}
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class Typed {
  get state() {
    const state = this.getState("state");

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("state", target);
        return true;
      }
    });
  }

  set state(value) {
    this.setState("state", value);
  }

  get #state() {
    const state = this.getState("#state");

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("#state", target);
        return true;
      }
    });
  }

  set #state(value) {
    this.setState("#state", value);
  }

  test(arg1: number = 1, arg2: string = null): void {}

}

const __contract = new Typed();

const __metadata = {
  state: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["number"]
  },
  "#state": {
    type: "ClassPrivateProperty",
    decorators: ["state", "internal"],
    fieldType: ["number"]
  },
  test: {
    type: "ClassMethod",
    decorators: ["pure"],
    returnType: ["undefined"],
    params: [{
      name: "arg1",
      type: ["number"],
      defaultValue: 1
    }, {
      name: "arg2",
      type: ["string"],
      defaultValue: null
    }]
  }
};`)
})

test('address state', () => {
  let src = `
    @contract class AddressTest {
      @state who: address

      @transaction withdraw(who: address) { }
    }
  `
  src = babelify(src, [plugin])
  src = babelify(src, [flowPlugin])
  expect(src).toBe(`class AddressTest {
  get who() {
    const state = this.getState("who");

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("who", target);
        return true;
      }
    });
  }

  set who(value) {
    this.setState("who", value);
  }

  withdraw(who) {}

}

const __contract = new AddressTest();

const __metadata = {
  who: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["address"]
  },
  withdraw: {
    type: "ClassMethod",
    decorators: ["transaction"],
    returnType: "any",
    params: [{
      name: "who",
      type: ["address"]
    }]
  }
};`)
})
