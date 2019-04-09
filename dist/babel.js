"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

/*
function isPublic(type) {
    return ["ClassMethod", "ClassProperty"].includes(type);
}
function isPrivate(type) {
    return ["ClassPrivateMethod", "ClassPrivateProperty"].includes(type);
}
function isClassProperty(type) {
  return ["ClassProperty", "ClassPrivateProperty"].includes(type);
}
*/
var numberOfContracts = 0;

function isMethod(node) {
  // console.log(mp);
  if (!node) return false;
  var type = node.type;

  if (type === 'ClassMethod' || type === 'ClassPrivateMethod') {
    return true;
  } // check if value is a function or arrow function


  var valueType = node.value && node.value.type;
  return valueType === 'FunctionExpression' || valueType === 'ArrowFunctionExpression';
}

function buildError(message, nodePath) {
  if (nodePath && nodePath.buildCodeFrameError) {
    throw nodePath.buildCodeFrameError(message);
  }

  throw new SyntaxError(message);
}

var SUPPORTED_TYPES = ['number', 'string', 'boolean', 'bigint', 'null', 'undefined', 'function', 'array', 'map', 'set', 'date', 'regexp', 'promise'];

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

function wrapState(t, item, memberMeta) {
  var name = item.node.key.name || '#' + item.node.key.id.name;
  var initVal = item.node.value;
  var initValIsLiteral = initVal && t.isLiteral(initVal);
  var getState = t.identifier('getState');
  var thisExp = t.thisExpression();
  var memExp = t.memberExpression(thisExp, getState);
  var callExpParams = [t.stringLiteral(name)];
  if (initVal) callExpParams.push(initVal);
  var callExp = t.callExpression(memExp, callExpParams);
  var getter = t.classMethod('get', t.identifier(name), [], t.blockStatement([t.returnStatement(callExp)]));
  var setMemExp = t.memberExpression(thisExp, t.identifier('setState'));
  var setCallExp = t.callExpression(setMemExp, [t.stringLiteral(name), t.identifier('value')]);
  var setter = t.classMethod('set', t.identifier(name), [t.identifier('value')], t.blockStatement([t.expressionStatement(setCallExp)])); // replace @state instance variable with a pair of getter and setter

  item.replaceWithMultiple([getter, setter]); // if there's initializer, move it into constructor

  if (initVal && !initValIsLiteral) {
    var deployer = item.parent.body.find(function (p) {
      return p.key.name === '__on_deployed';
    }); // if no constructor, create one

    if (!deployer) {
      deployer = t.classMethod('method', t.identifier('__on_deployed'), [], t.blockStatement([]));
      item.parent.body.unshift(deployer);
      memberMeta['__on_deployed'] = {
        mp: {
          node: deployer
        },
        type: deployer.type,
        decorators: ['payable']
      };
    } // create a this.item = initVal;


    var setExp = t.memberExpression(thisExp, t.identifier(name));
    var assignState = t.expressionStatement(t.assignmentExpression('=', setExp, initVal));
    deployer.body.body.unshift(assignState);
  }
}

function astify(t, literal) {
  if (literal === null) {
    return t.nullLiteral();
  }

  switch ((0, _typeof2["default"])(literal)) {
    case 'function':
      throw new Error('Not support function');

    case 'number':
      return t.numericLiteral(literal);

    case 'string':
      return t.stringLiteral(literal);

    case 'boolean':
      return t.booleanLiteral(literal);

    case 'undefined':
      return t.unaryExpression('void', t.numericLiteral(0), true);

    default:
      if (Array.isArray(literal)) {
        return t.arrayExpression(literal.map(function (m) {
          return astify(t, m);
        }));
      }

      return t.objectExpression(Object.keys(literal).filter(function (k) {
        return (
          /* !SPECIAL_MEMBERS.includes(k) && !k.startsWith('#') && */
          typeof literal[k] !== 'undefined'
        );
      }).map(function (k) {
        return t.objectProperty(t.stringLiteral(k), astify(t, literal[k]));
      }));
  }
}

var SYSTEM_DECORATORS = ['state', 'onReceived', 'transaction', 'view', 'pure', 'payable'];
var STATE_CHANGE_DECORATORS = ['transaction', 'view', 'pure', 'payable']; // const SPECIAL_MEMBERS = ['constructor', '__on_deployed', '__on_received']

module.exports = function (_ref) {
  var t = _ref.types;
  var contractName = null;
  return {
    visitor: {
      Decorator: function Decorator(path) {
        var decoratorName = path.node.expression.name;

        if (decoratorName === 'contract') {
          if (path.parent.type === 'ClassDeclaration') {
            // Why comment it: contractName is not good for detect two decorators, module is load once.
            // if (contractName && contractName !== path.parent.id.name) {
            //   throw buildError('More than one class marked with @contract. Only one is allowed.', path)
            // }
            contractName = path.parent.id.name; // process constructor

            var m = path.parent.body.body.find(function (n) {
              return n.kind === 'constructor';
            });

            if (m) {
              m.kind = 'method';
              m.key.name = '__on_deployed';
            } // Collect member metadata


            var memberMeta = {};
            var members = path.parentPath.get('body.body'); // console.log(members);

            members.forEach(function (mp) {
              var m = mp.node; // console.log(mp);

              var propName = m.key.name || '#' + m.key.id.name;
              memberMeta[propName] = {
                mp: mp,
                type: m.type,
                decorators: [] // process decorators

              };
              var mds = mp.get('decorators');

              if (mds && mds.length) {
                mds.forEach(function (dp) {
                  var d = dp.node;
                  var dname = d.expression.name;
                  memberMeta[propName].decorators.push(dname);

                  if (dname === 'state') {
                    if (isMethod(m)) {
                      throw buildError('Class method cannot be decorated as @state', mp);
                    }

                    wrapState(t, mp, memberMeta);
                  } else if (dname === 'onReceived') {
                    // const newNode = t.classProperty(t.identifier('__on_received'),
                    //   t.memberExpression(t.thisExpression(), t.identifier(propName)))
                    // path.parent.body.body.push(newNode)
                    // memberMeta['__on_received'] = {
                    //   mp: {node: newNode},
                    //   type: newNode.type,
                    //   decorators: []
                    // }
                    memberMeta['__on_received'] = propName;
                  }

                  if (SYSTEM_DECORATORS.includes(dname)) dp.remove();
                });
              } // process type annotation


              if (typeof memberMeta[propName] === 'string') {// link to other method, like __on_received => @onReceived. No handle.
              }

              if (!isMethod(m)) {
                memberMeta[propName].fieldType = getTypeName(m.typeAnnotation);
              } else {
                var fn = m.value || m;
                memberMeta[propName].returnType = getTypeName(fn.returnType);
                memberMeta[propName].params = []; // process parameters

                fn.params.forEach(function (p) {
                  var item = p.left || p;
                  var param = {
                    name: item.name,
                    type: getTypeName(item.typeAnnotation)
                  };

                  if (p.right) {
                    if (t.isNullLiteral(p.right)) {
                      param.defaultValue = null;
                    } else if (t.isLiteral(p.right)) {
                      param.defaultValue = p.right.value;
                    }
                  }

                  memberMeta[propName].params.push(param);
                });
              }
            }); // console.log(memberMeta)
            // validate metadata

            Object.keys(memberMeta).forEach(function (key) {
              if (typeof memberMeta[key] !== 'string') {
                var stateDeco = memberMeta[key].decorators.filter(function (e) {
                  return STATE_CHANGE_DECORATORS.includes(e);
                }); // const isState = memberMeta[key].decorators.includes("state");

                var mp = memberMeta[key].mp;
                delete memberMeta[key].mp;

                if (!isMethod(mp.node)) {
                  if (stateDeco.length) {
                    console.log(key);
                    throw buildError('State mutability decorators cannot be attached to variables', mp);
                  } else {
                    if (memberMeta[key].decorators.includes('state')) {
                      memberMeta[key].decorators.push('view');
                    } else {
                      memberMeta[key].decorators.push('pure');
                    }
                  }
                } else if (key.startsWith('#') && stateDeco.includes('payable')) {
                  throw buildError('Private function cannot be payable', mp);
                } else {
                  if (!stateDeco.length) {
                    // default to view
                    memberMeta[key].decorators.push('view');
                  } else if (stateDeco.length > 1) {
                    throw buildError("Could not define multiple state mutablility decorators: ".concat(stateDeco.join(', ')), mp);
                  }
                }
              }
            }); // add to __metadata
            // console.log(astify(t, memberMeta))

            var program = path.findParent(function (p) {
              return p.isProgram();
            });
            var metaDeclare = program.get('body').find(function (p) {
              return p.isVariableDeclaration() && p.node.declarations[0].id.name === '__metadata';
            });

            if (metaDeclare) {
              metaDeclare.node.declarations[0].init = astify(t, memberMeta);
            }
          }

          path.remove();
        }
      },
      Identifier: function Identifier(path) {
        if (path.node.name === '__contract_name') {
          if (!contractName) {
            throw buildError('Must have one class marked @contract.', path);
          }

          path.node.name = contractName;
        } else if (path.node.name === '__on_deployed' || path.node.name === '__on_received') {
          throw buildError('__on_deployed and __on_received cannot be specified directly.', path);
        }
      },
      ClassDeclaration: function ClassDeclaration(node) {
        new IceTea(t).run(node.node);
      },
      Program: {
        exit: function exit(node) {
          new IceTea(t).checkValid(node.node);
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
  }

  (0, _createClass2["default"])(IceTea, [{
    key: "run",
    value: function run(klass) {
      var decorators = this.findDecorators(klass, "contract");
      numberOfContracts += decorators.length;
    }
  }, {
    key: "checkValid",
    value: function checkValid(klass) {
      if (numberOfContracts > 1) {
        this.buildError("Your smart contract does not have @contract.", klass);
      }

      numberOfContracts = 0;
    }
  }, {
    key: "buildError",
    value: function buildError(message, nodePath) {
      if (nodePath && nodePath.buildCodeFrameError) {
        throw nodePath.buildCodeFrameError(message);
      }

      throw new SyntaxError(message);
    }
  }, {
    key: "findDecorators",
    value: function findDecorators(klass, name) {
      return (klass.decorators || []).filter(function (decorator) {
        return decorator.expression.name === name;
      });
    }
  }]);
  return IceTea;
}();