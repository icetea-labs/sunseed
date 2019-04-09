"use strict";

var fs = require('fs');

var path = require('path');

var header = fs.readFileSync(path.resolve(__dirname, 'header.js')).toString();
var footer = fs.readFileSync(path.resolve(__dirname, 'footer.js')).toString();

module.exports = function (src) {
  return "\n".concat(header, "\n").concat(src, "\n").concat(footer, "\n");
};