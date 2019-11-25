const Terser = require('terser')
const plugin = require('../src/babel')
const { babelify, transform } = require('../src/transform')

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
  let src = `
    @contract class A {
      @state property
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  property = __path("property");
}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
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
      @state property = Math.PI
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  __on_deployed() {
    this.property = Math.PI;
  }

  property = __path("property", Math.PI);
}

const __contract = new A();

const __metadata = {
  __on_deployed: {
    type: "ClassMethod",
    decorators: ["payable"]
  },
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  }
};`)
})

test('json remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/4b06f0eafc710a9ce54615c5d3d7e98d/raw/f1cf29bdac9d09d59f996f512c83f6d09c0710a2/test.json')
    @contract class A {}
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const test={test:1};class A{}const __contract=new A,__metadata={};')
})

test('js remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/2ff57e279116fd9e7ee3ae39b4e81860/raw/d5c5c2716d60b507c7f52ac99b7d5653230ed513/test.js')
    @contract class A {}
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const test=function(){const t={exports:{}};t.exports;return t.exports=()=>"test",t.exports}();class A{}const __contract=new A,__metadata={};')
})

test('whitelist require', async () => {
  let src = `
    const _ = require('lodash')
    @contract class A {
      @pure test() { return _.isEmpty([]) }
    }
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const _=require("lodash");class A{test(){return _.isEmpty([])}}const __contract=new A,__metadata={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};')
})

test('whitelist special', async () => {
  let src = `
    const _ = require(';')
    @contract class A {
      @pure test() { return _.isEmpty([]) }
    }
  `
  src = await transform(src)
  src = babelify(src, [plugin])
  src = Terser.minify(src).code
  expect(src).toBe('const _=require(";");class A{test(){return _.isEmpty([])}}const __contract=new A,__metadata={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};')
})

test('prefer local module', async () => {
  const src = `
    const moment = require('moment@local')
    @contract class A {
      @pure test() { return moment().format() }
    }
  `
  await transform(src)
  babelify(src, [plugin])
  Terser.minify(src)
})

test('prefer remote module', async () => {
  let src = `
    const ms = require('ms')
    @contract class A {
      @pure test() { return ms(100) }
    }
  `
  src = await transform(src, '/', null, { remote: { ms: true } })
  expect(src).toBe(`const ms = require('ms');

@contract
class A {
  @pure
  test() {
    return ms(100);
  }

}`)
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

  state = __path("state");
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
