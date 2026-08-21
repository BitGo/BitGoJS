function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* eslint-disable */
// @ts-nocheck
import { cborToScript } from "@blaze-cardano/uplc";
import { Type } from "@blaze-cardano/data";
const PolicyId = Type.String();
const Contracts = Type.Module({});
export class V0ProtocolProtocolWithdraw {
  constructor(trace = false) {
    _defineProperty(this, "Script", void 0);
    this.Script = cborToScript(trace ? "58b601010029800aba4aba2aba1aab9faab9eaab9dab9cab9a488888888c96600264653001300900198049805000cc0240092225980099b8748010c024dd500144c96600200915980099b8748000c028dd5002456600260166ea8012294600e806200e804200f007803c01d00f180618051baa0028b200e180480098029baa00a8a4d153300349011856616c696461746f722072657475726e65642066616c7365001365640082a660049201085f723a20566f6964001601" : "587401010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748010c01cdd500144cc8928980518041baa0025980099b8748000c01cdd5001c56600260106ea800e2934590094590064590060c01c004c00cdd5003c52689b2b200201", "PlutusV3");
  }
}
export class V0ProtocolProtocolElse {
  constructor(trace = false) {
    _defineProperty(this, "Script", void 0);
    this.Script = cborToScript(trace ? "58b601010029800aba4aba2aba1aab9faab9eaab9dab9cab9a488888888c96600264653001300900198049805000cc0240092225980099b8748010c024dd500144c96600200915980099b8748000c028dd5002456600260166ea8012294600e806200e804200f007803c01d00f180618051baa0028b200e180480098029baa00a8a4d153300349011856616c696461746f722072657475726e65642066616c7365001365640082a660049201085f723a20566f6964001601" : "587401010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748010c01cdd500144cc8928980518041baa0025980099b8748000c01cdd5001c56600260106ea800e2934590094590064590060c01c004c00cdd5003c52689b2b200201", "PlutusV3");
  }
}
//# sourceMappingURL=index.js.map