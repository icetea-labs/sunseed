'use strict';

var revert = function revert(text) {
  throw new Error(text || "Transaction reverted.");
};

var expect = function expect(condition, text) {
  if (!condition) revert(text);
};

var assert = expect;

var _this$getEnv = (void 0).getEnv(),
    msg = _this$getEnv.msg,
    block = _this$getEnv.block,
    __tags = _this$getEnv.tags,
    balanceOf = _this$getEnv.balanceOf,
    loadContract = _this$getEnv.loadContract;

var now = block ? block.timestamp : 0;
assert(typeof msg !== "undefined" && msg, "Invalid or corrupt transaction data.");
expect(msg.name, "Method name not specified.");