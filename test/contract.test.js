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
      xyz = this.property.value()

      constructor() {
        this.x = 1
      }
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  property = __path("property");
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

test('json remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/4b06f0eafc710a9ce54615c5d3d7e98d/raw/f1cf29bdac9d09d59f996f512c83f6d09c0710a2/test.json')
    @contract class A {}
  `
  src = babelify(src, [plugin])
  try {
    src = await transform(src)
  } catch (err) {
    console.log(err)
  }
  expect(src).toBe(`let __return_value
  
  (function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw a.code = "MODULE_NOT_FOUND", a;
        }

        var p = n[i] = {
          exports: {}
        };
        e[i][0].call(p.exports, function (r) {
          var n = e[i][1][r];
          return o(n || r);
        }, p, p.exports, r, e, n, t);
      }

      return n[i].exports;
    }

    for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);

    return o;
  }

  return r;
})()({
  1: [function (require, module, exports) {
    {
      function inner(require, module, exports) {
        {
          'use strict';

          const {
            msg,
            block,
            balanceOf,
            loadContract,
            loadLibrary,
            isValidAddress,
            deployContract
          } = this.runtime;

          const {
            path: __path
          } = require(';').stateUtil(this);

          if (!msg.name) {
            throw new Error("Method name is required.");
          }

          const test = require("https://gist.githubusercontent.com/Sotatek-DucPham/4b06f0eafc710a9ce54615c5d3d7e98d/raw/f1cf29bdac9d09d59f996f512c83f6d09c0710a2/test.json");

          class A {}

          const __contract = new A();

          const __metadata = {}; // block to scope our let/const

          {
            const __name = typeof __metadata[msg.name] === 'string' ? __metadata[msg.name] : msg.name;

            if (["__on_deployed", "__on_received"].includes(msg.name) && !(__name in __contract)) {
              // call event methods but contract does not have one
              return;
            }

            if (!["__metadata", "address", "balance", "deployedBy"].includes(__name) && (!(__name in __contract) || __name.startsWith('#'))) {
              throw new Error("Method " + __name + " is private or does not exist.");
            }

            if (__metadata[__name] && __metadata[__name].decorators && __metadata[__name].decorators.includes('internal')) {
              throw new Error("Method " + msg.name + " is internal.");
            }

            Object.defineProperties(__contract, Object.getOwnPropertyDescriptors(this));
            const __c = {
              instance: __contract,
              meta: __metadata
            };

            if (__name === "__metadata") {
              return __c;
            }

            const __checkType = (value, typeHolder, typeProp, info) => {
              if (!typeHolder) return value;
              const types = typeHolder[typeProp];

              if (types && Array.isArray(types)) {
                let valueType = value === null ? 'null' : typeof value;

                if (!types.includes(valueType)) {
                  if (valueType === 'object') {
                    valueType = Object.prototype.toString.call(value).split(' ')[1].slice(0, -1).toLowerCase();
                    if (types.includes(valueType)) return value;
                  }

                  if (valueType === 'string' && types.includes('address')) {
                    if (isValidAddress(value)) {
                      return true;
                    }
                  }

                  throw new Error("Error executing '" + __name + "': wrong " + info + " type. Expect: " + types.join(" | ") + ". Got: " + valueType + ".");
                }
              }

              return value;
            };

            if (typeof __c.instance[__name] === "function") {
              // Check stateMutablitity
              const isValidCallType = d => {
                if (["__on_deployed", "__on_received"].includes(__name) || !__metadata[__name]) return true; // FIXME

                if (!__metadata[__name].decorators) {
                  return false;
                }

                if (d === "transaction" && __metadata[__name].decorators.includes("payable")) {
                  return true;
                }

                return __metadata[__name].decorators.includes(d);
              };

              if (!isValidCallType(msg.callType)) {
                throw new Error("Method " + __name + " is not decorated as @" + msg.callType + " and cannot be invoked in such mode");
              } // Check input param type


              const params = msg.params;

              if (__metadata[__name] && __metadata[__name].params && __metadata[__name].params.length) {
                __metadata[__name].params.forEach((p, index) => {
                  const pv = params.length > index ? params[index] : undefined;

                  __checkType(pv, p, 'type', "param '" + p.name + "'");
                });
              } // Call the function, finally


              if (typeof __c.instance.onready === 'function') __c.instance.onready();

              const result = __c.instance[__name].apply(__c.instance, params);

              return __checkType(result, __metadata[__name], 'returnType', "return");
            }

            if (typeof __c.instance.onready === 'function') __c.instance.onready();
            return __checkType(__c.instance[__name], __metadata[__name], 'fieldType', 'field');
          }
        }
      }

      __return_value = inner.call(this, require, module, exports);
    }
  }.bind(this), {
    "https://gist.githubusercontent.com/Sotatek-DucPham/4b06f0eafc710a9ce54615c5d3d7e98d/raw/f1cf29bdac9d09d59f996f512c83f6d09c0710a2/test.json": 2,
    ";": ";"
  }],
  2: [function (require, module, exports) {
    module.exports = {
      "test": 1
    };
  }, {}]
}, {}, [1]);
  
  return __return_value`)
})

test('js remote', async () => {
  let src = `
    const test = require('https://gist.githubusercontent.com/Sotatek-DucPham/2ff57e279116fd9e7ee3ae39b4e81860/raw/d5c5c2716d60b507c7f52ac99b7d5653230ed513/test.js')
    @contract class A {}
  `
  src = babelify(src, [plugin])
  src = await transform(src)
  src = Terser.minify(src, { parse: { bare_returns: true } }).code
  expect(src).toBe('let __return_value;return function e(t,r,n){function o(i,s){if(!r[i]){if(!t[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(a)return a(i,!0);var d=new Error("Cannot find module \'"+i+"\'");throw d.code="MODULE_NOT_FOUND",d}var u=r[i]={exports:{}};t[i][0].call(u.exports,(function(e){return o(t[i][1][e]||e)}),u,u.exports,e,t,r,n)}return r[i].exports}for(var a="function"==typeof require&&require,i=0;i<n.length;i++)o(n[i]);return o}({1:[function(e,t,r){__return_value=function(e,t,r){{const{msg:t,block:r,balanceOf:n,loadContract:o,loadLibrary:a,isValidAddress:i,deployContract:s}=this.runtime,{path:c}=e(";").stateUtil(this);if(!t.name)throw new Error("Method name is required.");e("https://gist.githubusercontent.com/Sotatek-DucPham/2ff57e279116fd9e7ee3ae39b4e81860/raw/d5c5c2716d60b507c7f52ac99b7d5653230ed513/test.js");class d{}const u=new d,l={};{const e="string"==typeof l[t.name]?l[t.name]:t.name;if(["__on_deployed","__on_received"].includes(t.name)&&!(e in u))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in u)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(l[e]&&l[e].decorators&&l[e].decorators.includes("internal"))throw new Error("Method "+t.name+" is internal.");Object.defineProperties(u,Object.getOwnPropertyDescriptors(this));const r={instance:u,meta:l};if("__metadata"===e)return r;const n=(t,r,n,o)=>{if(!r)return t;const a=r[n];if(a&&Array.isArray(a)){let r=null===t?"null":typeof t;if(!a.includes(r)){if("object"===r&&(r=Object.prototype.toString.call(t).split(" ")[1].slice(0,-1).toLowerCase(),a.includes(r)))return t;if("string"===r&&a.includes("address")&&i(t))return!0;throw new Error("Error executing \'"+e+"\': wrong "+o+" type. Expect: "+a.join(" | ")+". Got: "+r+".")}}return t};if("function"==typeof r.instance[e]){if(!(t=>!(!["__on_deployed","__on_received"].includes(e)&&l[e])||!!l[e].decorators&&(!("transaction"!==t||!l[e].decorators.includes("payable"))||l[e].decorators.includes(t)))(t.callType))throw new Error("Method "+e+" is not decorated as @"+t.callType+" and cannot be invoked in such mode");const o=t.params;l[e]&&l[e].params&&l[e].params.length&&l[e].params.forEach((e,t)=>{const r=o.length>t?o[t]:void 0;n(r,e,"type","param \'"+e.name+"\'")}),"function"==typeof r.instance.onready&&r.instance.onready();const a=r.instance[e].apply(r.instance,o);return n(a,l[e],"returnType","return")}return"function"==typeof r.instance.onready&&r.instance.onready(),n(r.instance[e],l[e],"fieldType","field")}}}.call(this,e,t,r)}.bind(this),{"https://gist.githubusercontent.com/Sotatek-DucPham/2ff57e279116fd9e7ee3ae39b4e81860/raw/d5c5c2716d60b507c7f52ac99b7d5653230ed513/test.js":2,";":";"}],2:[function(e,t,r){t.exports=()=>"test"},{}]},{},[1]),__return_value;')
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
  expect(src).toBe('let __return_value;return function e(r,t,n){function o(i,s){if(!t[i]){if(!r[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(a)return a(i,!0);var d=new Error("Cannot find module \'"+i+"\'");throw d.code="MODULE_NOT_FOUND",d}var l=t[i]={exports:{}};r[i][0].call(l.exports,(function(e){return o(r[i][1][e]||e)}),l,l.exports,e,r,t,n)}return t[i].exports}for(var a="function"==typeof require&&require,i=0;i<n.length;i++)o(n[i]);return o}({1:[function(e,r,t){__return_value=function(e,r,t){{const{msg:r,block:t,balanceOf:n,loadContract:o,loadLibrary:a,isValidAddress:i,deployContract:s}=this.runtime,{path:c}=e(";").stateUtil(this);if(!r.name)throw new Error("Method name is required.");const d=e("lodash");class l{test(){return d.isEmpty([])}}const u=new l,p={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};{const e="string"==typeof p[r.name]?p[r.name]:r.name;if(["__on_deployed","__on_received"].includes(r.name)&&!(e in u))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in u)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(p[e]&&p[e].decorators&&p[e].decorators.includes("internal"))throw new Error("Method "+r.name+" is internal.");Object.defineProperties(u,Object.getOwnPropertyDescriptors(this));const t={instance:u,meta:p};if("__metadata"===e)return t;const n=(r,t,n,o)=>{if(!t)return r;const a=t[n];if(a&&Array.isArray(a)){let t=null===r?"null":typeof r;if(!a.includes(t)){if("object"===t&&(t=Object.prototype.toString.call(r).split(" ")[1].slice(0,-1).toLowerCase(),a.includes(t)))return r;if("string"===t&&a.includes("address")&&i(r))return!0;throw new Error("Error executing \'"+e+"\': wrong "+o+" type. Expect: "+a.join(" | ")+". Got: "+t+".")}}return r};if("function"==typeof t.instance[e]){if(!(r=>!(!["__on_deployed","__on_received"].includes(e)&&p[e])||!!p[e].decorators&&(!("transaction"!==r||!p[e].decorators.includes("payable"))||p[e].decorators.includes(r)))(r.callType))throw new Error("Method "+e+" is not decorated as @"+r.callType+" and cannot be invoked in such mode");const o=r.params;p[e]&&p[e].params&&p[e].params.length&&p[e].params.forEach((e,r)=>{const t=o.length>r?o[r]:void 0;n(t,e,"type","param \'"+e.name+"\'")}),"function"==typeof t.instance.onready&&t.instance.onready();const a=t.instance[e].apply(t.instance,o);return n(a,p[e],"returnType","return")}return"function"==typeof t.instance.onready&&t.instance.onready(),n(t.instance[e],p[e],"fieldType","field")}}}.call(this,e,r,t)}.bind(this),{";":";",lodash:"lodash"}]},{},[1]),__return_value;')
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
  expect(src).toBe('let __return_value;return function e(r,t,n){function o(i,s){if(!t[i]){if(!r[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(a)return a(i,!0);var d=new Error("Cannot find module \'"+i+"\'");throw d.code="MODULE_NOT_FOUND",d}var u=t[i]={exports:{}};r[i][0].call(u.exports,(function(e){return o(r[i][1][e]||e)}),u,u.exports,e,r,t,n)}return t[i].exports}for(var a="function"==typeof require&&require,i=0;i<n.length;i++)o(n[i]);return o}({1:[function(e,r,t){__return_value=function(e,r,t){{const{msg:r,block:t,balanceOf:n,loadContract:o,loadLibrary:a,isValidAddress:i,deployContract:s}=this.runtime,{path:c}=e(";").stateUtil(this);if(!r.name)throw new Error("Method name is required.");const d=e(";");class u{test(){return d.isEmpty([])}}const l=new u,p={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};{const e="string"==typeof p[r.name]?p[r.name]:r.name;if(["__on_deployed","__on_received"].includes(r.name)&&!(e in l))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in l)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(p[e]&&p[e].decorators&&p[e].decorators.includes("internal"))throw new Error("Method "+r.name+" is internal.");Object.defineProperties(l,Object.getOwnPropertyDescriptors(this));const t={instance:l,meta:p};if("__metadata"===e)return t;const n=(r,t,n,o)=>{if(!t)return r;const a=t[n];if(a&&Array.isArray(a)){let t=null===r?"null":typeof r;if(!a.includes(t)){if("object"===t&&(t=Object.prototype.toString.call(r).split(" ")[1].slice(0,-1).toLowerCase(),a.includes(t)))return r;if("string"===t&&a.includes("address")&&i(r))return!0;throw new Error("Error executing \'"+e+"\': wrong "+o+" type. Expect: "+a.join(" | ")+". Got: "+t+".")}}return r};if("function"==typeof t.instance[e]){if(!(r=>!(!["__on_deployed","__on_received"].includes(e)&&p[e])||!!p[e].decorators&&(!("transaction"!==r||!p[e].decorators.includes("payable"))||p[e].decorators.includes(r)))(r.callType))throw new Error("Method "+e+" is not decorated as @"+r.callType+" and cannot be invoked in such mode");const o=r.params;p[e]&&p[e].params&&p[e].params.length&&p[e].params.forEach((e,r)=>{const t=o.length>r?o[r]:void 0;n(t,e,"type","param \'"+e.name+"\'")}),"function"==typeof t.instance.onready&&t.instance.onready();const a=t.instance[e].apply(t.instance,o);return n(a,p[e],"returnType","return")}return"function"==typeof t.instance.onready&&t.instance.onready(),n(t.instance[e],p[e],"fieldType","field")}}}.call(this,e,r,t)}.bind(this),{";":";"}]},{},[1]),__return_value;')
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
  expect(src).toBe('let __return_value;return function e(r,t,n){function o(i,s){if(!t[i]){if(!r[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(a)return a(i,!0);var d=new Error("Cannot find module \'"+i+"\'");throw d.code="MODULE_NOT_FOUND",d}var u=t[i]={exports:{}};r[i][0].call(u.exports,(function(e){return o(r[i][1][e]||e)}),u,u.exports,e,r,t,n)}return t[i].exports}for(var a="function"==typeof require&&require,i=0;i<n.length;i++)o(n[i]);return o}({1:[function(e,r,t){__return_value=function(e,r,t){{const{msg:r,block:t,balanceOf:n,loadContract:o,loadLibrary:a,isValidAddress:i,deployContract:s}=this.runtime,{path:c}=e(";").stateUtil(this);if(!r.name)throw new Error("Method name is required.");const d=e("ms");class u{test(){return d(100)}}const l=new u,p={test:{type:"ClassMethod",decorators:["pure"],returnType:"any",params:[]}};{const e="string"==typeof p[r.name]?p[r.name]:r.name;if(["__on_deployed","__on_received"].includes(r.name)&&!(e in l))return;if(!["__metadata","address","balance","deployedBy"].includes(e)&&(!(e in l)||e.startsWith("#")))throw new Error("Method "+e+" is private or does not exist.");if(p[e]&&p[e].decorators&&p[e].decorators.includes("internal"))throw new Error("Method "+r.name+" is internal.");Object.defineProperties(l,Object.getOwnPropertyDescriptors(this));const t={instance:l,meta:p};if("__metadata"===e)return t;const n=(r,t,n,o)=>{if(!t)return r;const a=t[n];if(a&&Array.isArray(a)){let t=null===r?"null":typeof r;if(!a.includes(t)){if("object"===t&&(t=Object.prototype.toString.call(r).split(" ")[1].slice(0,-1).toLowerCase(),a.includes(t)))return r;if("string"===t&&a.includes("address")&&i(r))return!0;throw new Error("Error executing \'"+e+"\': wrong "+o+" type. Expect: "+a.join(" | ")+". Got: "+t+".")}}return r};if("function"==typeof t.instance[e]){if(!(r=>!(!["__on_deployed","__on_received"].includes(e)&&p[e])||!!p[e].decorators&&(!("transaction"!==r||!p[e].decorators.includes("payable"))||p[e].decorators.includes(r)))(r.callType))throw new Error("Method "+e+" is not decorated as @"+r.callType+" and cannot be invoked in such mode");const o=r.params;p[e]&&p[e].params&&p[e].params.length&&p[e].params.forEach((e,r)=>{const t=o.length>r?o[r]:void 0;n(t,e,"type","param \'"+e.name+"\'")}),"function"==typeof t.instance.onready&&t.instance.onready();const a=t.instance[e].apply(t.instance,o);return n(a,p[e],"returnType","return")}return"function"==typeof t.instance.onready&&t.instance.onready(),n(t.instance[e],p[e],"fieldType","field")}}}.call(this,e,r,t)}.bind(this),{";":";",ms:"ms"}]},{},[1]),__return_value;')
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
