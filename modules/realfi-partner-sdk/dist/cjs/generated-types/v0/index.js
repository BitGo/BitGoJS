"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.V0ProtocolProtocolWithdraw = exports.V0ProtocolProtocolElse = void 0;
var _uplc = require("@blaze-cardano/uplc");
var _data = require("@blaze-cardano/data");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /* eslint-disable */ // @ts-nocheck
var PolicyId = _data.Type.String();
var Contracts = _data.Type.Module({});
var V0ProtocolProtocolWithdraw = exports.V0ProtocolProtocolWithdraw = /*#__PURE__*/_createClass(function V0ProtocolProtocolWithdraw() {
  var trace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  _classCallCheck(this, V0ProtocolProtocolWithdraw);
  _defineProperty(this, "Script", void 0);
  this.Script = (0, _uplc.cborToScript)(trace ? "58b601010029800aba4aba2aba1aab9faab9eaab9dab9cab9a488888888c96600264653001300900198049805000cc0240092225980099b8748010c024dd500144c96600200915980099b8748000c028dd5002456600260166ea8012294600e806200e804200f007803c01d00f180618051baa0028b200e180480098029baa00a8a4d153300349011856616c696461746f722072657475726e65642066616c7365001365640082a660049201085f723a20566f6964001601" : "587401010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748010c01cdd500144cc8928980518041baa0025980099b8748000c01cdd5001c56600260106ea800e2934590094590064590060c01c004c00cdd5003c52689b2b200201", "PlutusV3");
});
var V0ProtocolProtocolElse = exports.V0ProtocolProtocolElse = /*#__PURE__*/_createClass(function V0ProtocolProtocolElse() {
  var trace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  _classCallCheck(this, V0ProtocolProtocolElse);
  _defineProperty(this, "Script", void 0);
  this.Script = (0, _uplc.cborToScript)(trace ? "58b601010029800aba4aba2aba1aab9faab9eaab9dab9cab9a488888888c96600264653001300900198049805000cc0240092225980099b8748010c024dd500144c96600200915980099b8748000c028dd5002456600260166ea8012294600e806200e804200f007803c01d00f180618051baa0028b200e180480098029baa00a8a4d153300349011856616c696461746f722072657475726e65642066616c7365001365640082a660049201085f723a20566f6964001601" : "587401010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748010c01cdd500144cc8928980518041baa0025980099b8748000c01cdd5001c56600260106ea800e2934590094590064590060c01c004c00cdd5003c52689b2b200201", "PlutusV3");
});
//# sourceMappingURL=index.js.map