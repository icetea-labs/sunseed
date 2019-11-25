module.exports = (src, {
  noState
} = {}) => {
  const stateFunc = noState ? '' : `
  const __proxyState$Unwrap = value => {
    const real = value && value.__proxyState$RealObj;
    return typeof real !== 'function' ? value : real.call(value);
  }

  const __proxyState$Get = (name, defValue) => {

    // this will throw if msg.callType if 'pure'
    const state = this.getState(name, defValue);
  
    // no need to check with Object.isFrozen since we can use msg.type
    // note that typeof null is 'object'
    if (state === null || typeof state !== 'object' || 'view' === msg.callType) {
      return state;
    }

    const saveState = () => this.setState(name, state);
  
    const makeProxy = realObj => {
      const handler = {
        get (target, property, receiver) {
          if (property === '__proxyState$RealObj') {
            return () => realObj;
          }
  
          const v = Reflect.get(target, property, receiver);
          if (v === null || typeof v !== 'object') {
            return v;
          }
          return makeProxy(v)
        },

        set (target, prop, value, receiver) {
          const r = Reflect.set(target, prop, __proxyState$Unwrap(value), receiver);
          saveState();
          return r;
        },

        defineProperty (target, property, desc) {
          if (desc.value) {
            desc.value = __proxyState$Unwrap(desc.value)
          }
          const r = Reflect.defineProperty(target, property, desc);
          saveState();
          return r;
        },

        deleteProperty (target, property) {
          const r = Reflect.deleteProperty(target, property);
          saveState();
          return r;
        }
      }
  
      return new Proxy(realObj, handler);
    }
  
    return makeProxy(state)
  }
  `

  return `'use strict';
const {msg, block, balanceOf, loadContract, loadLibrary, isValidAddress, deployContract} = this.runtime

if (!msg.name) {
  throw new Error("Method name is required.")
}

${stateFunc}

${src}

// block to scope our let/const
{
  const __name = typeof __metadata[msg.name] === 'string' ? __metadata[msg.name] : msg.name
  if (["__on_deployed", "__on_received"].includes(msg.name) && !(__name in __contract)) {
    // call event methods but contract does not have one
    return;
  }
  if (!["__metadata", "address", "balance", "deployedBy"].includes(__name) && 
    (!(__name in __contract) || __name.startsWith('#'))) {
      throw new Error("Method " + __name + " is private or does not exist.");
  }
  if (__metadata[__name] && __metadata[__name].decorators && __metadata[__name].decorators.includes('internal')) {
    throw new Error("Method " + msg.name + " is internal.")
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
    if (!typeHolder) return value
    const types = typeHolder[typeProp]
    if (types && Array.isArray(types)) {
      let valueType = value === null ? 'null' : typeof value;
      if (!types.includes(valueType)) {
        if (valueType === 'object') {
          valueType = Object.prototype.toString.call(value).split(' ')[1].slice(0, -1).toLowerCase()
          if (types.includes(valueType)) return value;
        }

        if(valueType === 'string' && types.includes('address')) {
          if(isValidAddress(value)) {
            return true;
          }
        }

        throw new Error("Error executing '" + __name + "': wrong " + info + " type. Expect: " + 
        types.join(" | ") + ". Got: " + valueType + ".");
      }
    }
    return value;
  }
  if (typeof __c.instance[__name] === "function") {
    // Check stateMutablitity
    const isValidCallType = (d) => {
      if (["__on_deployed", "__on_received"].includes(__name) || !__metadata[__name]) return true; // FIXME
      if (!__metadata[__name].decorators) {
        return false;
      }
      if (d === "transaction" && __metadata[__name].decorators.includes("payable")) {
        return true;
      } 
      return __metadata[__name].decorators.includes(d);
    }
    if (!isValidCallType(msg.callType)) {
      throw new Error("Method " + __name + " is not decorated as @" + msg.callType + " and cannot be invoked in such mode");
    }
      // Check input param type
    const params = msg.params;
    if (__metadata[__name] && __metadata[__name].params && __metadata[__name].params.length) {
      __metadata[__name].params.forEach((p, index) => {
        const pv = (params.length  > index) ? params[index] : undefined;
        __checkType(pv, p, 'type', "param '" + p.name + "'");
      })
    }
    // Call the function, finally
    if (typeof __c.instance.onready === 'function') __c.instance.onready()
    const result = __c.instance[__name].apply(__c.instance, params);
    return __checkType(result, __metadata[__name], 'returnType', "return");
  }

  if (typeof __c.instance.onready === 'function') __c.instance.onready()
  return __checkType(__c.instance[__name], __metadata[__name], 'fieldType', 'field');
}
`
}
