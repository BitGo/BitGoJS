"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _destination = require("./destination.js");
Object.keys(_destination).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _destination[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _destination[key];
    }
  });
});
var _flow = require("./flow.js");
Object.keys(_flow).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _flow[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _flow[key];
    }
  });
});
var _registry = require("./registry.js");
Object.keys(_registry).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _registry[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _registry[key];
    }
  });
});
//# sourceMappingURL=index.js.map