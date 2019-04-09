"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var fetch = require('node-fetch');

var PLAIN_IMPORT_REGEX = /^[ \t]*import\s+["'](https?:\/\/.+)["'][ \t]*$/gm;
var REQUIRE_REGEX = /\brequire\s*\(\s*["'](https?:\/\/.+)["']\s*\)/g; // From https://github.com/<owner>/<repo>/<path to the file>
// To https://raw.githubusercontent.com/<owner>/<repo>/master/<path to the file>

function changeGithubPath(src) {
  if (!src.startsWith('https://github.com/')) {
    return src;
  }

  var parts = src.replace('https://github.com/', '').split('/');
  var path = parts.slice(2);
  var repo = parts.slice(0, 2);
  var url = ['https://raw.githubusercontent.com'].concat((0, _toConsumableArray2["default"])(repo), ['master'], (0, _toConsumableArray2["default"])(path)).join('/');
  return url;
}

function preparePromises(src, regex, map) {
  var e = regex.exec(src);

  while (e) {
    var p = e[1];
    var content = fetch(changeGithubPath(p)).then(function (resp) {
      return resp.text();
    });
    map[p] = content;
    e = regex.exec(src);
  }
}

function resolveRegEx(src, regex, wrapFn) {
  var map = {};
  preparePromises(src, regex, map);
  var promises = Object.values(map);
  if (!promises.length) return Promise.resolve(src);
  return Promise.all(promises).then(function (values) {
    var keys = Object.keys(map);

    for (var i = 0; i < keys.length; i++) {
      map[keys[i]] = wrapFn ? wrapFn(values[i]) : values[i];
    }
  }).then(function () {
    return src.replace(regex, function (match, group) {
      return map[group];
    });
  }).then(function (src) {
    return resolveRegEx(src, regex, wrapFn);
  });
}

function resolveImports(src) {
  return resolveRegEx(src, PLAIN_IMPORT_REGEX, function (src) {
    // return '(function(){\n' + src.trim() + '\n}).call(global)'
    return src; // for import, include as is
  });
}

function resolveRequires(src) {
  return resolveRegEx(src, REQUIRE_REGEX, function (src) {
    return '(function(){const module={exports:{}};const exports=module.exports;\n' + src.trim() + ';\nreturn module.exports}).call(global)';
  });
}

exports.resolveExternal = function (src) {
  return resolveImports(src).then(function (src) {
    return resolveRequires(src);
  });
};