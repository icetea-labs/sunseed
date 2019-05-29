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
    return this.getState("state");
  }

  set state(value) {
    this.setState("state", value);
  }

  get #state() {
    return this.getState("#state");
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
    decorators: ["state", "view"],
    fieldType: ["number"]
  },
  "#state": {
    type: "ClassPrivateProperty",
    decorators: ["state", "view"],
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
