const plugin = require('../src/plugins/main')
const babelify = require('../src/babelify')
const { transpile } = require('../src')
const makeWrapper = require('../src/entryWrapper')

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
  await expect(transpile(cannotMinStateSrc, { minify: true })).resolves.toBe('let __return_value;return function r(e,t,n){function o(a,s){if(!t[a]){if(!e[a]){var c="function"==typeof require&&require;if(!s&&c)return c(a,!0);if(i)return i(a,!0);var d=new Error("Cannot find module \'"+a+"\'");throw d.code="MODULE_NOT_FOUND",d}var l=t[a]={exports:{}};e[a][0].call(l.exports,(function(t){return o(e[a][1][t]||t)}),l,l.exports,r,e,t,n)}return t[a].exports}for(var i="function"==typeof require&&require,a=0;a<n.length;a++)o(n[a]);return o}({1:[function(e,t,n){__return_value=function inner(e,t,n){{const{msg:t,block:n,balanceOf:i,loadContract:a,loadLibrary:s,isValidAddress:c,deployContract:d}=this.runtime,{stateUtil:l}=e(";"),{define:u,defineList:f,defineAutoList:p}=l(this);if(!t.name)throw new Error("Method name is required.");class A{state=u("state",1)}const y=new A,_={state:{type:"ClassProperty",decorators:["state","internal"],fieldType:"any"}};{const e="string"==typeof _[t.name]?_[t.name]:t.name;if(["__on_deployed","__on_received"].includes(t.name)&&!(e in y))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in y)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(_[e]&&_[e].decorators&&_[e].decorators.includes("internal"))throw new Error("Method "+t.name+" is internal.");Object.defineProperties(y,Object.getOwnPropertyDescriptors(this));const n={instance:y,meta:_};if("__metadata"===e)return n;const __checkType=(t,n,i,a)=>{if(!n)return t;const s=n[i];if(s&&Array.isArray(s)){let n=null===t?"null":typeof t;if(!s.includes(n)){if("object"===n&&(n=Object.prototype.toString.call(t).split(" ")[1].slice(0,-1).toLowerCase(),s.includes(n)))return t;if("string"===n&&s.includes("address")&&c(t))return!0;throw new Error("Error executing \'"+e+"\': wrong "+a+" type. Expect: "+s.join(" | ")+". Got: "+n+".")}}return t};if("function"==typeof n.instance[e]){if(!(t=>!(!["__on_deployed","__on_received"].includes(e)&&_[e])||!!_[e].decorators&&(!("transaction"!==t||!_[e].decorators.includes("payable"))||_[e].decorators.includes(t)))(t.callType))throw new Error("Method "+e+" is not decorated as @"+t.callType+" and cannot be invoked in such mode");const i=t.params;_[e]&&_[e].params&&_[e].params.length&&_[e].params.forEach((e,t)=>{const n=i.length>t?i[t]:void 0;__checkType(n,e,"type","param \'"+e.name+"\'")}),"function"==typeof n.instance.onready&&n.instance.onready();const a=n.instance[e].apply(n.instance,i);return __checkType(a,_[e],"returnType","return")}return"function"==typeof n.instance.onready&&n.instance.onready(),__checkType(n.instance[e],_[e],"fieldType","field")}}}.call(this,e,t,n)}.bind(this),{";":";"}]},{},[1]),__return_value;')
  await expect(transpile(cannotMinSrc, { minify: true })).resolves.toBe('let __return_value;return function r(e,n,t){function o(a,s){if(!n[a]){if(!e[a]){var c="function"==typeof require&&require;if(!s&&c)return c(a,!0);if(i)return i(a,!0);var d=new Error("Cannot find module \'"+a+"\'");throw d.code="MODULE_NOT_FOUND",d}var u=n[a]={exports:{}};e[a][0].call(u.exports,(function(n){return o(e[a][1][n]||n)}),u,u.exports,r,e,n,t)}return n[a].exports}for(var i="function"==typeof require&&require,a=0;a<t.length;a++)o(t[a]);return o}({1:[function(e,n,t){__return_value=function inner(e,n,t){{const{msg:n,block:t,balanceOf:i,loadContract:a,loadLibrary:s,isValidAddress:c,deployContract:d}=this.runtime,{stateUtil:u}=e(";"),{define:l,defineList:f,defineAutoList:p}=u(this);if(!n.name)throw new Error("Method name is required.");class A{state=()=>1}const y=new A,_={state:{type:"ClassProperty",decorators:["pure"],returnType:"any",params:[]}};{const e="string"==typeof _[n.name]?_[n.name]:n.name;if(["__on_deployed","__on_received"].includes(n.name)&&!(e in y))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in y)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(_[e]&&_[e].decorators&&_[e].decorators.includes("internal"))throw new Error("Method "+n.name+" is internal.");Object.defineProperties(y,Object.getOwnPropertyDescriptors(this));const t={instance:y,meta:_};if("__metadata"===e)return t;const __checkType=(n,t,i,a)=>{if(!t)return n;const s=t[i];if(s&&Array.isArray(s)){let t=null===n?"null":typeof n;if(!s.includes(t)){if("object"===t&&(t=Object.prototype.toString.call(n).split(" ")[1].slice(0,-1).toLowerCase(),s.includes(t)))return n;if("string"===t&&s.includes("address")&&c(n))return!0;throw new Error("Error executing \'"+e+"\': wrong "+a+" type. Expect: "+s.join(" | ")+". Got: "+t+".")}}return n};if("function"==typeof t.instance[e]){if(!(n=>!(!["__on_deployed","__on_received"].includes(e)&&_[e])||!!_[e].decorators&&(!("transaction"!==n||!_[e].decorators.includes("payable"))||_[e].decorators.includes(n)))(n.callType))throw new Error("Method "+e+" is not decorated as @"+n.callType+" and cannot be invoked in such mode");const i=n.params;_[e]&&_[e].params&&_[e].params.length&&_[e].params.forEach((e,n)=>{const t=i.length>n?i[n]:void 0;__checkType(t,e,"type","param \'"+e.name+"\'")}),"function"==typeof t.instance.onready&&t.instance.onready();const a=t.instance[e].apply(t.instance,i);return __checkType(a,_[e],"returnType","return")}return"function"==typeof t.instance.onready&&t.instance.onready(),__checkType(t.instance[e],_[e],"fieldType","field")}}}.call(this,e,n,t)}.bind(this),{";":";"}]},{},[1]),__return_value;')
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
  expect(src).toEqual(`class A {
  numberState = define("numberState", 1);
  arrayState = define("arrayState", [1, 2, 3]);
  sumState = define("sumState", 1 + 2);
  objState = define("objState", {
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
