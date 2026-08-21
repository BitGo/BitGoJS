"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "NETWORK_REGISTRY", {
  enumerable: true,
  get: function get() {
    return _detectParams.NETWORK_REGISTRY;
  }
});
exports.RealfiSDK = exports.RealfiApi = void 0;
Object.defineProperty(exports, "SUSDR_EXCHANGE_RATE_PRECISION", {
  enumerable: true,
  get: function get() {
    return _diffusion.SUSDR_EXCHANGE_RATE_PRECISION;
  }
});
exports.TxBuilder = exports.SundaeSwap = void 0;
Object.defineProperty(exports, "UnknownProtocolVersionError", {
  enumerable: true,
  get: function get() {
    return _detectParams.UnknownProtocolVersionError;
  }
});
exports.Utils = void 0;
Object.defineProperty(exports, "V0_4Types", {
  enumerable: true,
  get: function get() {
    return _index4.V0_4Types;
  }
});
Object.defineProperty(exports, "V1_0Rc1Types", {
  enumerable: true,
  get: function get() {
    return _index4.V1_0Rc1Types;
  }
});
Object.defineProperty(exports, "V1_0Types", {
  enumerable: true,
  get: function get() {
    return _index4.V1_0Types;
  }
});
Object.defineProperty(exports, "V1_1Rc1Types", {
  enumerable: true,
  get: function get() {
    return _index4.V1_1Rc1Types;
  }
});
Object.defineProperty(exports, "YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER", {
  enumerable: true,
  get: function get() {
    return _detectParams.YIELD_ORACLE_BOOTSTRAP_PLACEHOLDER;
  }
});
Object.defineProperty(exports, "calculateSusdrExchangeRate", {
  enumerable: true,
  get: function get() {
    return _diffusion.calculateSusdrExchangeRate;
  }
});
Object.defineProperty(exports, "detectSDKParams", {
  enumerable: true,
  get: function get() {
    return _detectParams.detectSDKParams;
  }
});
var _index = require("./api/index.js");
var _clientId = require("./sdk/shared/client-id.js");
var _index2 = require("./sdk/index.js");
var _partnerDispatcher = require("./sdk/partner-dispatcher.js");
var SundaeSwapSDK = _interopRequireWildcard(require("./sundae/index.js"));
var _SundaeSwap = SundaeSwapSDK;
exports.SundaeSwap = SundaeSwapSDK;
var _detectParams = require("./sdk/shared/detect-params.js");
var _index4 = require("./generated-types/index.js");
var _diffusion = require("./sdk/v1_1_rc1/diffusion.js");
var _Utils = _interopRequireWildcard(require("./sdk/shared/public.js"));
exports.Utils = _Utils;
var _TxBuilder = _interopRequireWildcard(require("./tx-builder/index.js"));
exports.TxBuilder = _TxBuilder;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
// Partner-facing entry point. First-party consumers use "./internal".

var PARTNER_CLIENT_ID = "partner-sdk/".concat(_clientId.SDK_VERSION);

// On-chain Cardano part — the facade narrowed to the partner surface (order
// builders + read helpers). Deploy/operator methods and concrete version
// classes are reachable only via "./internal".
//
// `create` returns a version dispatcher: by default it re-resolves the live
// protocol version before each order build (one provider lookup) and swaps to
// the matching version instance; read helpers never re-detect. All built
// orders are tagged with source="partner-sdk", surviving version switches.
// The `detectParams` method is forwarded unchanged.
/* eslint-disable @typescript-eslint/no-explicit-any */
var cardano = {
  create: function create(blaze, params, options) {
    return (0, _partnerDispatcher.createPartnerCardanoSDK)(blaze, params, "partner-sdk", options);
  },
  detectParams: _index2.RealfiSDK.detectParams.bind(_index2.RealfiSDK)
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// Off-chain API — wrap factory methods to inject the partner client-id so
// every request body carries extensions.clientId = "partner-sdk/<version>".
var PartnerRealfiApi = exports.RealfiApi = {
  forNetwork: function forNetwork(network) {
    return _index.RealfiApi.forNetwork(network, PARTNER_CLIENT_ID);
  },
  create: function create(endpoints) {
    return _index.RealfiApi.create(endpoints, PARTNER_CLIENT_ID);
  }
};

// Partner SDK, namespaced by part.
var RealfiSDK = exports.RealfiSDK = {
  cardano: cardano,
  api: PartnerRealfiApi,
  sundae: SundaeSwapSDK
};

// Partner-facing Cardano SDK instance types + create options

// Params + detection result

// Protocol-version detection

// Partner-facing shared types

// Current-line generated type namespaces

// Curated helpers + transaction builder

// Off-chain API part. `RealfiApi` here is the partner-tagged factory, not the
// raw class — direct imports get the same partner client-id as RealfiSDK.api.
//# sourceMappingURL=index.js.map