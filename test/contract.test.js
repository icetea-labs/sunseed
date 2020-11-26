const Terser = require('terser')
const plugin = require('../src/plugins/main')
const babelify = require('../src/babelify')
const transform = require('../src/transform')

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
      @state property
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
    fieldType: "any"
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
      @state property = Math.PI
      xyz = this.property.get()

      constructor() {
        this.x = 1
      }
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  property = define("property");
  xyz = msg.name === '__on_deployed' ? undefined : this.property.get();

  __on_deployed() {
    this.property.set(Math.PI);
    this.xyz = this.property.get();
    this.x = 1;
  }

}

const __contract = new A();

const __metadata = {
  property: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
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

// test('json remote', async () => {
//   let src = `
//     const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/4b06f0eafc710a9ce54615c5d3d7e98d/raw/f1cf29bdac9d09d59f996f512c83f6d09c0710a2/test.json')
//     @contract class A {}
//   `
//   src = await transform(src)
//   src = babelify(src, [plugin])
//   src = Terser.minify(src).code
//   expect(src).toBe('const test={test:1};class A{}const __contract=new A,__metadata={};')
// })
//
// test('js remote', async () => {
//   let src = `
//     const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/2ff57e279116fd9e7ee3ae39b4e81860/raw/d5c5c2716d60b507c7f52ac99b7d5653230ed513/test.js')
//     @contract class A {}
//   `
//   src = await transform(src)
//   src = babelify(src, [plugin])
//   src = Terser.minify(src).code
//   expect(src).toBe('const test=function(){const t={exports:{}};t.exports;return t.exports=()=>"test",t.exports}();class A{}const __contract=new A,__metadata={};')
// })

// test('whitelist require', async () => {
//   let src = `
//     const _ = require('lodash')
//     @contract class A {
//       @pure test() { return _.isEmpty([]) }
//     }
//   `
//   src = babelify(src, [plugin])
//   src = await transform(src)
//   src = Terser.minify(src, { parse: { bare_returns: true } }).code
//   expect(src).toBe('let __return_value;return function e(r,t,n){function o(i,s){if(!t[i]){if(!r[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(a)return a(i,!0);var d=new Error("Cannot find module \'"+i+"\'");throw d.code="MODULE_NOT_FOUND",d}var l=t[i]={exports:{}};r[i][0].call(l.exports,(function(e){return o(r[i][1][e]||e)}),l,l.exports,e,r,t,n)}return t[i].exports}for(var a="function"==typeof require&&require,i=0;i<n.length;i++)o(n[i]);return o}({1:[function(e,r,t){__return_value=function(e,r,t){{const{msg:r,block:t,balanceOf:n,loadContract:o,loadLibrary:a,isValidAddress:i,deployContract:s}=this.runtime,{path:c}=e(";").stateUtil(this);if(!r.name)throw new Error("Method name is required.");const d=e("lodash");class l{test(){return d.isEmpty([])}}const u=new l,p={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};{const e="string"==typeof p[r.name]?p[r.name]:r.name;if(["__on_deployed","__on_received"].includes(r.name)&&!(e in u))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in u)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(p[e]&&p[e].decorators&&p[e].decorators.includes("internal"))throw new Error("Method "+r.name+" is internal.");Object.defineProperties(u,Object.getOwnPropertyDescriptors(this));const t={instance:u,meta:p};if("__metadata"===e)return t;const n=(r,t,n,o)=>{if(!t)return r;const a=t[n];if(a&&Array.isArray(a)){let t=null===r?"null":typeof r;if(!a.includes(t)){if("object"===t&&(t=Object.prototype.toString.call(r).split(" ")[1].slice(0,-1).toLowerCase(),a.includes(t)))return r;if("string"===t&&a.includes("address")&&i(r))return!0;throw new Error("Error executing \'"+e+"\': wrong "+o+" type. Expect: "+a.join(" | ")+". Got: "+t+".")}}return r};if("function"==typeof t.instance[e]){if(!(r=>!(!["__on_deployed","__on_received"].includes(e)&&p[e])||!!p[e].decorators&&(!("transaction"!==r||!p[e].decorators.includes("payable"))||p[e].decorators.includes(r)))(r.callType))throw new Error("Method "+e+" is not decorated as @"+r.callType+" and cannot be invoked in such mode");const o=r.params;p[e]&&p[e].params&&p[e].params.length&&p[e].params.forEach((e,r)=>{const t=o.length>r?o[r]:void 0;n(t,e,"type","param \'"+e.name+"\'")}),"function"==typeof t.instance.onready&&t.instance.onready();const a=t.instance[e].apply(t.instance,o);return n(a,p[e],"returnType","return")}return"function"==typeof t.instance.onready&&t.instance.onready(),n(t.instance[e],p[e],"fieldType","field")}}}.call(this,e,r,t)}.bind(this),{";":";",lodash:"lodash"}]},{},[1]),__return_value;')
// })
//
// test('whitelist special', async () => {
//   let src = `
//     const _ = require(';')
//     @contract class A {
//       @pure test() { return _.isEmpty([]) }
//     }
//   `
//   src = await transform(src)
//   src = Terser.minify(src, { parse: { bare_returns: true } }).code
//   expect(src).toBe('let __return_value;return function e(r,t,n){function o(i,s){if(!t[i]){if(!r[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(a)return a(i,!0);var d=new Error("Cannot find module \'"+i+"\'");throw d.code="MODULE_NOT_FOUND",d}var u=t[i]={exports:{}};r[i][0].call(u.exports,(function(e){return o(r[i][1][e]||e)}),u,u.exports,e,r,t,n)}return t[i].exports}for(var a="function"==typeof require&&require,i=0;i<n.length;i++)o(n[i]);return o}({1:[function(e,r,t){__return_value=function(e,r,t){{const{msg:r,block:t,balanceOf:n,loadContract:o,loadLibrary:a,isValidAddress:i,deployContract:s}=this.runtime,{path:c}=e(";").stateUtil(this);if(!r.name)throw new Error("Method name is required.");const d=e(";");class u{test(){return d.isEmpty([])}}const l=new u,p={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};{const e="string"==typeof p[r.name]?p[r.name]:r.name;if(["__on_deployed","__on_received"].includes(r.name)&&!(e in l))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in l)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(p[e]&&p[e].decorators&&p[e].decorators.includes("internal"))throw new Error("Method "+r.name+" is internal.");Object.defineProperties(l,Object.getOwnPropertyDescriptors(this));const t={instance:l,meta:p};if("__metadata"===e)return t;const n=(r,t,n,o)=>{if(!t)return r;const a=t[n];if(a&&Array.isArray(a)){let t=null===r?"null":typeof r;if(!a.includes(t)){if("object"===t&&(t=Object.prototype.toString.call(r).split(" ")[1].slice(0,-1).toLowerCase(),a.includes(t)))return r;if("string"===t&&a.includes("address")&&i(r))return!0;throw new Error("Error executing \'"+e+"\': wrong "+o+" type. Expect: "+a.join(" | ")+". Got: "+t+".")}}return r};if("function"==typeof t.instance[e]){if(!(r=>!(!["__on_deployed","__on_received"].includes(e)&&p[e])||!!p[e].decorators&&(!("transaction"!==r||!p[e].decorators.includes("payable"))||p[e].decorators.includes(r)))(r.callType))throw new Error("Method "+e+" is not decorated as @"+r.callType+" and cannot be invoked in such mode");const o=r.params;p[e]&&p[e].params&&p[e].params.length&&p[e].params.forEach((e,r)=>{const t=o.length>r?o[r]:void 0;n(t,e,"type","param \'"+e.name+"\'")}),"function"==typeof t.instance.onready&&t.instance.onready();const a=t.instance[e].apply(t.instance,o);return n(a,p[e],"returnType","return")}return"function"==typeof t.instance.onready&&t.instance.onready(),n(t.instance[e],p[e],"fieldType","field")}}}.call(this,e,r,t)}.bind(this),{";":";"}]},{},[1]),__return_value;')
// })
//
// test('prefer local module', async () => {
//   const src = `
//     const moment = require('moment@local')
//     @contract class A {
//       @pure test() { return moment().format() }
//     }
//   `
//   await transform(src)
//   babelify(src, [plugin])
//   Terser.minify(src)
// })
//
// test('prefer remote module', async () => {
//   let src = `
//     const ms = require('ms')
//     @contract class A {
//       @pure test() { return ms(100) }
//     }
//   `
//   src = await transform(src, '/', null, { remote: { ms: true } })
//   expect(src).toBe(`const ms = require('ms');
//
// @contract
// class A {
//   @pure
//   test() {
//     return ms(100);
//   }
//
// }`)
// })

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
