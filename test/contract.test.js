const Terser = require('terser')
const plugin = require('../src/plugins/main')
const babelify = require('../src/babelify')
const transform = require('../src/transform/nodeTransform')

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
  let src = `
    @contract class A {
      @onreceive receive() {}
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  receive() {}

}

const __contract = new A();

const __metadata = {
  receive: {
    type: "ClassMethod",
    decorators: ["onreceive"],
    returnType: "any",
    params: []
  },
  __on_received: "receive"
};`)
})

test('state', () => {
  let srcDefine = `
    @contract class A {
      @state property: string
    }
  `
  srcDefine = babelify(srcDefine, [plugin])
  expect(srcDefine).toBe(`class A {
  property = define("property");
}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["string"]
  }
};`)

  let srcDefineList = `
      @contract class A {
      @state property: List
    }
  `
  srcDefineList = babelify(srcDefineList, [plugin])

  expect(srcDefineList).toBe(`class A {
  property = defineList("property");
}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["list"]
  }
};`)

  let srcDefineAutoList = `
      @contract class A {
      @state property: AutoList
    }
  `
  srcDefineAutoList = babelify(srcDefineAutoList, [plugin])

  expect(srcDefineAutoList).toBe(`class A {
  property = defineAutoList("property");
}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["autolist"]
  }
};`)
})

test('non constant', () => {
  let src = `
    @contract class A {
      property = () => {}
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  property = () => {};
}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["internal"],
    returnType: "any",
    params: []
  }
};`)
})

test('non constant state init', () => {
  let src = `
    @contract class A {
      @state property: number = Math.PI
      xyz = this.property.value()

      constructor() {
        this.x = 1
      }
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  property = define("property");
  xyz = msg.name === '__on_deployed' ? undefined : this.property.value();

  __on_deployed() {
    this.property.value(Math.PI);
    this.xyz = this.property.value();
    this.x = 1;
  }

}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["number"]
  },
  xyz: {
    type: "ClassProperty",
    decorators: ["internal"],
    fieldType: "any"
  },
  __on_deployed: {
    type: "ClassMethod",
    decorators: ["view"],
    returnType: "any",
    params: []
  }
};`)
})

test('json remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/thanhtung6824/230f995a9e89a6c9bdd4a760a5df1c0c/raw/0e839d1a989c48d82f791984022ec65bb31be7a5/test.json')
    @contract class A {}
  `
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const test=require("https://gist.githubusercontent.com/thanhtung6824/230f995a9e89a6c9bdd4a760a5df1c0c/raw/0e839d1a989c48d82f791984022ec65bb31be7a5/test.json");class A{}const __contract=new A,__metadata={};')
})
//
test('js remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/thanhtung6824/b38e5ddcd66f34cd85d2afda33a22e12/raw/a5707d45b30b349f9d0772019abbfc9cc132d3fe/test.js')
    @contract class A {}
  `
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const test=require("https://gist.githubusercontent.com/thanhtung6824/b38e5ddcd66f34cd85d2afda33a22e12/raw/a5707d45b30b349f9d0772019abbfc9cc132d3fe/test.js");class A{}const __contract=new A,__metadata={};')
})

test('whitelist require', async () => {
  let src = `
    const _ = require('lodash')
    @contract class A {
      @pure test() { return _.isEmpty([]) }
    }
  `
  src = babelify(src, [plugin])
  src = await transform(src)
  src = Terser.minify(src, { parse: { bare_returns: true } }).code
  expect(src).toBeDefined()
})

test('whitelist special', async () => {
  let src = `
    const _ = require(';')
    @contract class A {
      @pure test() { return _.isEmpty([]) }
    }
  `
  src = babelify(src, [plugin])
  src = await transform(src)
  src = Terser.minify(src, { parse: { bare_returns: true } }).code
  expect(src).toBeDefined()
})

test('prefer remote module', async () => {
  let src = `
    const ms = require('ms')
    @contract class A {
      @pure test() { return ms(100) }
    }
  `
  src = babelify(src, [plugin])
  src = await transform(src, null, { remote: { ms: true } })
  src = Terser.minify(src, { parse: { bare_returns: true } }).code
  expect(src).toBeDefined()
})

test('inherit contract', async () => {
  let src = `
    class A {
      constructor() { console.log('A') }
      @state state: number
    }
    @contract class B extends A {
      constructor() {
        super()
        console.log('B')
      }
    }
  `

  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  __on_deployed() {
    console.log('A');
  }

  state = define("state");
}

class B extends A {
  __on_deployed() {
    super.__on_deployed();

    console.log('B');
  }

}

const __contract = new B();

const __metadata = {
  __on_deployed: {
    type: "ClassMethod",
    decorators: ["view"],
    returnType: "any",
    params: []
  },
  state: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: ["number"]
  }
};`)
})
