"use strict";

var validate = require('validate-npm-package-name');

exports.plugins = ['decorators-legacy', 'classProperties', 'flow', 'flowComments', 'asyncGenerators', 'bigInt', 'classPrivateMethods', 'classPrivateProperties', 'classProperties', 'doExpressions', 'flow', 'flowComments', 'functionBind', 'functionSent', 'jsx', 'logicalAssignment', 'nullishCoalescingOperator', 'numericSeparator', 'objectRestSpread', 'optionalCatchBinding', 'optionalChaining', ['pipelineOperator', {
  proposal: 'minimal'
}], 'throwExpressions'];

exports.isHttp = function (value) {
  return value.startsWith('http://') || value.startsWith('https://');
};

exports.isNodeModule = function (value) {
  var _validate = validate(value),
      validForNewPackages = _validate.validForNewPackages,
      validForOldPackages = _validate.validForOldPackages;

  return validForNewPackages || validForOldPackages;
};

var builtin = ['_http_agent', '_http_client', '_http_common', '_http_incoming', '_http_outgoing', '_http_server', '_stream_duplex', '_stream_passthrough', '_stream_readable', '_stream_transform', '_stream_wrap', '_stream_writable', '_tls_common', '_tls_wrap', 'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2', 'https', 'inspector', 'module', 'net', 'node-inspect/lib/_inspect', 'node-inspect/lib/internal/inspect_client', 'node-inspect/lib/internal/inspect_repl', 'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util', 'v8', 'v8/tools/SourceMap', 'v8/tools/arguments', 'v8/tools/codemap', 'v8/tools/consarray', 'v8/tools/csvparser', 'v8/tools/logreader', 'v8/tools/profile', 'v8/tools/profile_view', 'v8/tools/splaytree', 'v8/tools/tickprocessor', 'v8/tools/tickprocessor-driver', 'vm', 'worker_threads', 'zlib'];
var whiteListModules = [].concat(builtin);

exports.isWhitelistModule = function (value) {
  return whiteListModules.includes(value);
};