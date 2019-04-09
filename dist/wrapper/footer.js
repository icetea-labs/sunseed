"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

// block to scope our let/const
{
  var __name = typeof __metadata[msg.name] === 'string' ? __metadata[msg.name] : msg.name;

  if (["__on_deployed", "__on_received"].includes(msg.name) && !(__name in __contract)) {
    // call event methods but contract does not have one
    return;
  }

  expect(["__metadata", "address", "balance", "deployedBy"].includes(__name) || __name in __contract && !__name.startsWith('#'), "Method " + __name + " is private or does not exist.");
  Object.defineProperties(__contract, Object.getOwnPropertyDescriptors(void 0));
  var __c = {
    instance: __contract,
    meta: __metadata
  };

  if (__name === "__metadata") {
    return __c;
  }

  var __checkType = function __checkType(value, typeHolder, typeProp, info) {
    if (!typeHolder) return value;
    var types = typeHolder[typeProp];

    if (types && Array.isArray(types)) {
      var valueType = value === null ? 'null' : (0, _typeof2["default"])(value);

      if (!types.includes(valueType)) {
        if (valueType === 'object') {
          valueType = Object.prototype.toString.call(value).split(' ')[1].slice(0, -1).toLowerCase();
          if (types.includes(valueType)) return value;
        }

        revert("Error executing '" + __name + "': wrong " + info + " type. Expect: " + types.join(" | ") + ". Got: " + valueType + ".");
      }
    }

    return value;
  };

  if (typeof __c.instance[__name] === "function") {
    // Check stateMutablitity
    var isValidCallType = function isValidCallType(d) {
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
      revert("Method " + __name + " is not decorated as @" + msg.callType + " and cannot be invoked in such mode");
    } // Check input param type


    var params = msg.params;

    if (__metadata[__name] && __metadata[__name].params && __metadata[__name].params.length) {
      __metadata[__name].params.forEach(function (p, index) {
        var pv = params.length > index ? params[index] : undefined;

        __checkType(pv, p, 'type', "param '" + p.name + "'");
      });
    } // Call the function, finally


    var result = __c.instance[__name].apply(__c.instance, params);

    return __checkType(result, __metadata[__name], 'returnType', "return");
  }

  return __checkType(__c.instance[__name], __metadata[__name], 'fieldType', 'field');
}