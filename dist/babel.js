"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var template = require('@babel/template');

var types = require('@babel/types');

var numberOfContracts = 0;
var contractName = '';
var metadata = {};
var extendData = {};

function isMethod(node) {
  if (!node) return false;
  var type = node.type;

  if (type === 'ClassMethod' || type === 'ClassPrivateMethod') {
    return true;
  }

  var valueType = node.value && node.value.type;
  return valueType === 'FunctionExpression' || valueType === 'ArrowFunctionExpression';
}

var SUPPORTED_TYPES = ['number', 'string', 'boolean', 'bigint', 'null', 'undefined', 'function', 'array', 'map', 'set', 'date', 'regexp', 'promise', 'address'];

function concatUnique(a, b) {
  if (!Array.isArray(a)) {
    a = [a];
  }

  if (!Array.isArray(b)) {
    b = [b];
  }

  var result = a.concat(b.filter(function (i) {
    return !a.includes(i);
  }));

  for (var i = 0; i < result.length; i++) {
    if (!SUPPORTED_TYPES.includes(result[i])) {
      return 'any';
    }
  }

  if (result.length === 1) {
    return result[0];
  }

  return result;
}

function getTypeName(node, insideUnion) {
  if (!node) return 'any';
  var ta = insideUnion ? node : node.typeAnnotation;
  var tn = ta.type;
  if (!tn) return 'any';
  var result;

  if (tn === 'Identifier') {
    result = ta.name;
  } else if (!tn.endsWith('TypeAnnotation')) {
    result = tn;
  } else {
    result = tn.slice(0, tn.length - 14);
  }

  result = result.toLowerCase(); // sanitize result

  if (result === 'void') {
    result = 'undefined';
  } else if (result === 'nullliteral') {
    result = 'null';
  } else if (result === 'generic') {
    var t = ta.id.name.toLowerCase();
    result = SUPPORTED_TYPES.includes(t) ? t : 'any';
  } else if (result === 'nullable') {
    result = concatUnique(['undefined', 'null'], getTypeName(ta));
  } else if (result === 'union') {
    result = [];
    ta.types.forEach(function (ut) {
      result = concatUnique(result, getTypeName(ut, true));
    });
  } else if (!SUPPORTED_TYPES.includes(result)) {
    result = 'any';
  }

  return result !== 'any' && Array.isArray(result) ? result : [result];
}

function getTypeParams(params) {
  return params.map(function (p) {
    var item = p.left || p;
    var param = {
      name: item.name,
      type: getTypeName(item.typeAnnotation)
    };

    if (p.right) {
      if (types.isNullLiteral(p.right)) {
        param.defaultValue = null;
      } else if (types.isLiteral(p.right)) {
        param.defaultValue = p.right.value;
      }
    }

    return param;
  });
}

var METHOD_DECORATORS = ['transaction', 'view', 'pure', 'payable', 'internal', 'onreceive'];
var PROPERTY_DECORATORS = ['state', 'pure', 'internal', 'view'];

module.exports = function (_ref) {
  var t = _ref.types;
  return {
    visitor: {
      ClassDeclaration: function ClassDeclaration(path) {
        new IceTea(t).classDeclaration(path);
      },
      Program: {
        exit: function exit(path) {
          new IceTea(t).exit(path.node);
        }
      }
    }
  };
};

var IceTea =
/*#__PURE__*/
function () {
  function IceTea(types) {
    (0, _classCallCheck2["default"])(this, IceTea);
    this.types = types;
    this.__on_deployed = 0;
    this.className = '';
    this.metadata = {};
    this.klass = undefined;
  }

  (0, _createClass2["default"])(IceTea, [{
    key: "classDeclaration",
    value: function classDeclaration(path) {
      var _this = this;

      var klass = path.node;
      this.className = klass.id.name;
      this.klass = klass;

      if (!metadata[this.className]) {
        metadata[this.className] = {};
      }

      this.metadata = metadata[this.className];

      if (klass.superClass) {
        extendData[this.className] = klass.superClass.name;
      }

      var contracts = this.findDecorators(klass, 'contract');
      numberOfContracts += contracts.length;
      var ctor = this.findConstructor(klass);

      if (ctor) {
        ctor.kind = 'method';
        ctor.key.name = '__on_deployed';
        this.replaceSuper(ctor);
      }

      if (contracts.length > 0) {
        contractName = klass.id.name;
        this.deleteDecorators(klass, contracts);
      }

      path.get('body.body').map(function (body) {
        if (['ClassProperty', 'ClassPrivateProperty'].includes(body.node.type)) {
          _this.classProperty(body);
        } else if (['ClassMethod', 'ClassPrivateMethod'].includes(body.node.type)) {
          _this.classMethod(body.node);
        }
      });
    }
  }, {
    key: "classProperty",
    value: function classProperty(path) {
      var node = path.node;
      var decorators = node.decorators || [];

      if (!decorators.every(function (decorator) {
        return PROPERTY_DECORATORS.includes(decorator.expression.name);
      })) {
        var allowDecorators = PROPERTY_DECORATORS.map(function (method) {
          return "@".concat(method);
        });
        throw this.buildError("Only ".concat(allowDecorators.join(', '), " are valid for a class field."), node);
      }

      var states = this.findDecorators(node, 'state');
      var internals = this.findDecorators(node, 'internal');
      var name = node.key.name || '#' + node.key.id.name; // private property does not have key.name

      if (internals.length > 0) {
        if (name.startsWith('#')) {
          throw this.buildError('Private field cannot be @internal.', node);
        }

        if (decorators.some(function (decorator) {
          return ['transaction', 'view', 'pure', 'onreceive'].includes(decorator.expression.name);
        })) {
          throw this.buildError('A @transaction, @view, @pure or @onreceive field cannot be @internal.', node);
        }
      }

      if (node.value && !this.isConstant(node.value) && !isMethod(node)) {
        var klassPath = path.parentPath.parentPath;
        var onDeploy = this.findMethod(klassPath.node, '__on_deployed');

        if (!onDeploy) {
          var _klassPath$node$body$;

          // class noname is only used for valid syntax
          var _fn = template.smart("\n          class noname {\n            __on_deployed () {}\n          }\n        ");

          (_klassPath$node$body$ = klassPath.node.body.body).unshift.apply(_klassPath$node$body$, (0, _toConsumableArray2["default"])(_fn().body.body));

          onDeploy = klassPath.node.body.body[0];
          this.metadata['__on_deployed'] = {
            type: 'ClassMethod',
            decorators: ['payable']
          };
        }

        var fn = template.smart("\n        this.NAME = DEFAULT\n      ");
        onDeploy.body.body.unshift(fn({
          NAME: name,
          DEFAULT: node.value
        })); // initialization is already added constructor

        if (states.length === 0) {
          path.remove();
        }
      }

      if (states.length > 0) {
        if (isMethod(node)) {
          throw this.buildError('Function cannot be marked as @state.', node);
        }

        var indents = this.findMethodDefinition(this.klass, name);

        if (indents.length > 0) {
          throw this.buildError("".concat(name, " is already marked @state and cannot have getter or setter."), node);
        }

        var pures = this.findDecorators(node, 'pure');

        if (pures.length > 0) {
          throw this.buildError("".concat(name, " cannot be marked with both @state and @pure."), node);
        }

        this.wrapState(path);

        if (!this.metadata[name]) {
          var decoratorNames = decorators.map(function (decorator) {
            return decorator.expression.name;
          });

          if (decoratorNames.length === 1 && decoratorNames[0] === 'state') {
            decoratorNames.push('internal');
          }

          this.metadata[name] = {
            type: node.type,
            decorators: decoratorNames,
            fieldType: getTypeName(node.typeAnnotation)
          };
        }

        return;
      }

      if (!this.metadata[name]) {
        this.metadata[name] = {
          type: node.type,
          decorators: decorators.map(function (decorator) {
            return decorator.expression.name;
          })
        };

        if (!isMethod(node)) {
          this.metadata[name]['fieldType'] = getTypeName(node.typeAnnotation);

          if (decorators.length === 0) {
            if (name.startsWith('#')) {
              // private property
              this.metadata[name]['decorators'].push('pure');
            } else {
              this.metadata[name]['decorators'].push('internal');
            }
          }
        } else {
          this.metadata[name]['returnType'] = getTypeName(node.value.returnType);
          this.metadata[name]['params'] = getTypeParams(node.value.params);

          if (decorators.length === 0) {
            if (name.startsWith('#')) {
              // private function
              this.metadata[name]['decorators'].push('view');
            } else {
              this.metadata[name]['decorators'].push('internal');
            }
          }
        }
      } // delete propery decorator


      this.deleteDecorators(node, this.findDecorators.apply(this, [node].concat(PROPERTY_DECORATORS)));
    }
  }, {
    key: "classMethod",
    value: function classMethod(klass) {
      var decorators = klass.decorators || [];

      if (!decorators.every(function (decorator) {
        return METHOD_DECORATORS.includes(decorator.expression.name);
      })) {
        var allowDecorators = METHOD_DECORATORS.map(function (method) {
          return "@".concat(method);
        });
        throw this.buildError("Only ".concat(allowDecorators.join(', '), " is allowed by method"), klass);
      }

      var name = klass.key.name || '#' + klass.key.id.name;

      if (name === '__on_received') {
        throw this.buildError('__on_received cannot be specified directly.', klass);
      }

      if (name === '__on_deployed') {
        if (this.__on_deployed > 0) {
          throw this.buildError('__on_deployed cannot be specified directly.', klass);
        }

        this.__on_deployed += 1;
      }

      if (name.startsWith('#')) {
        var payables = this.findDecorators(klass, 'payable');

        if (payables.length > 0) {
          throw this.buildError('Private function cannot be @payable.', klass);
        }

        var internals = this.findDecorators(klass, 'internal');

        if (internals.length > 0) {
          throw this.buildError('Private function cannot be @internal.', klass);
        }
      }

      if (!this.metadata[name]) {
        this.metadata[name] = {
          type: klass.type,
          decorators: decorators.map(function (decorator) {
            return decorator.expression.name;
          }),
          returnType: getTypeName(klass.returnType),
          params: getTypeParams(klass.params)
        };

        if (decorators.length === 0) {
          if (name.startsWith('#') || name === '__on_deployed') {
            // private method
            this.metadata[name].decorators.push('view');
          } else {
            this.metadata[name].decorators.push('internal');
          }
        }
      }

      var onreceives = this.findDecorators(klass, 'onreceive');

      if (onreceives.length > 0) {
        var _payables = this.findDecorators(klass, 'payable');

        if (_payables.length === 0 && klass.body.body.length > 0) {
          throw this.buildError('Non-payable @onreceive function should have empty body.', klass);
        }

        if (this.metadata['__on_received']) {
          throw this.buildError('Only one @onreceive is allowed per class.', klass);
        }

        this.metadata['__on_received'] = klass.key.name;
      }

      this.deleteDecorators(klass, this.findDecorators.apply(this, [klass].concat(METHOD_DECORATORS)));
    }
  }, {
    key: "exit",
    value: function exit(node) {
      if (numberOfContracts === 0) {
        throw this.buildError('Your smart contract does not have a @contract class.', node);
      }

      if (numberOfContracts > 1) {
        throw this.buildError('Your smart contract has more than one @contract classes.', node);
      }

      var name = contractName;
      var parent = extendData[name];

      while (parent) {
        metadata[contractName] = _objectSpread({}, metadata[parent], {}, metadata[contractName]);
        name = parent;
        parent = extendData[name];
      }

      this.appendNewCommand(node);
      this.appendMetadata(node);
      this.reset();
    }
  }, {
    key: "reset",
    value: function reset() {
      numberOfContracts = 0;
      contractName = '';
      metadata = {};
      extendData = {};
    }
  }, {
    key: "replaceSuper",
    value: function replaceSuper(ctor) {
      ctor.body.body = ctor.body.body.map(function (body) {
        if (!body.expression || body.expression.type !== 'CallExpression') {
          return body;
        }

        if (body.expression.callee.type === 'Super') {
          var superTemplate = template.smart("\n          super.__on_deployed(ARGUMENTS)\n        ");
          body = superTemplate({
            ARGUMENTS: body.expression.arguments
          });
        }

        return body;
      });
    }
  }, {
    key: "wrapState",
    value: function wrapState(path) {
      var node = path.node;
      var name = node.key.name || '#' + node.key.id.name;
      var wrap = template.smart("\n      class noname {\n        get NAME() {\n          const state = this.getState(\"NAME\", DEFAULT);\n          if(typeof state !== 'object') {\n            return state;\n          }\n          return new Proxy(state, {\n            set: (target, prop, value) => {\n              target[prop] = value;\n              this.setState(\"NAME\", target);\n              return true;\n            }\n          })\n        }\n        set NAME(value) {\n          this.setState(\"NAME\", value);\n        }\n      }\n    ");
      path.replaceWithMultiple(wrap({
        NAME: name,
        DEFAULT: node.value
      }).body.body);
    }
  }, {
    key: "appendNewCommand",
    value: function appendNewCommand(node) {
      var append = template.smart("\n      const __contract = new NAME();\n    ");
      node.body.push(append({
        NAME: contractName
      }));
    }
  }, {
    key: "appendMetadata",
    value: function appendMetadata(node) {
      var meta = template.smart("\n      const __metadata = META\n    ");
      node.body.push(meta({
        META: this.types.valueToNode(metadata[contractName])
      }));
    }
  }, {
    key: "findConstructor",
    value: function findConstructor(klass) {
      return klass.body.body.filter(function (body) {
        return body.kind === 'constructor';
      })[0];
    }
  }, {
    key: "findMethodDefinition",
    value: function findMethodDefinition(klass, name) {
      return klass.body.body.filter(function (body) {
        return ['MethodDefinition', 'ClassMethod'].includes(body.type) && body.key.name === name && ['get', 'set'].includes(body.kind);
      });
    }
  }, {
    key: "findMethod",
    value: function findMethod(klass) {
      for (var _len = arguments.length, names = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        names[_key - 1] = arguments[_key];
      }

      return klass.body.body.filter(function (body) {
        return body.type === 'ClassMethod' && names.includes(body.key.name);
      })[0];
    }
  }, {
    key: "buildError",
    value: function buildError(message, nodePath) {
      this.reset();

      if (nodePath && nodePath.buildCodeFrameError) {
        return nodePath.buildCodeFrameError(message);
      }

      return new SyntaxError(message);
    }
  }, {
    key: "findDecorators",
    value: function findDecorators(klass) {
      for (var _len2 = arguments.length, names = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        names[_key2 - 1] = arguments[_key2];
      }

      return (klass.decorators || []).filter(function (decorator) {
        return names.includes(decorator.expression.name);
      });
    }
  }, {
    key: "deleteDecorators",
    value: function deleteDecorators(klass, decorators) {
      decorators.forEach(function (decorator) {
        var index = klass.decorators.indexOf(decorator);

        if (index >= 0) {
          klass.decorators.splice(index, 1);
        }
      });
    }
  }, {
    key: "isConstant",
    value: function isConstant(value) {
      var _this2 = this;

      var types = this.types;

      if (types.isLiteral(value) && value.type !== 'TemplateLiteral') {
        return true;
      }

      if (value.type === 'ArrayExpression') {
        return value.elements && value.elements.every(function (element) {
          return _this2.isConstant(element);
        });
      }

      if (value.type === 'BinaryExpression') {
        return value.left && value.right && this.isConstant(value.left) && this.isConstant(value.right);
      }

      if (value.type === 'ObjectExpression') {
        return value.properties && value.properties.every(function (property) {
          return property.key.type !== 'TemplateLiteral' && _this2.isConstant(property.value);
        });
      }

      return false;
    }
  }]);
  return IceTea;
}();