'use strict';
const revert = text => {throw new Error(text || "Transaction reverted.")};
const expect = (condition, text) => {if (!condition) revert(text)}
const assert = expect;

const {msg, block, tags: __tags, balanceOf, loadContract} = this.getEnv();
const now = block ? block.timestamp : 0;

assert(typeof msg !== "undefined" && msg, "Invalid or corrupt transaction data.");
expect(msg.name, "Method name not specified.");
