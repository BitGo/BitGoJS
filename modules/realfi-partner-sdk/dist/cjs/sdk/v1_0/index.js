"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "DIRECT_ACTION_PADDING_ASSET", {
  enumerable: true,
  get: function get() {
    return _family.DIRECT_ACTION_PADDING_ASSET;
  }
});
exports.RealfiSDKV1_0 = void 0;
var _index = require("../../generated-types/index.js");
var _family = require("../v1/family.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// eslint-disable-next-line @typescript-eslint/naming-convention
// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────
/**
 * V1_0 SDK implementation.
 *
 * Extends V0_4 with:
 * - DirectMint/DirectBurn: Mint/burn USDr without reserve asset flow (for fiat wire scenarios)
 * - Invalidated redeemer: Allow order owners to recover funds when protocol is upgraded
 * - Forfeit parameter: Support yield forfeiture during unstake operations
 * - New Settings fields: direct_mint_permission, direct_burn_permission
 *
 * All transaction-building logic lives in {@link RealfiSDKV1Family}; this
 * class instantiates the V1_0 scripts and implements the version seams
 * (flat settings, 1-field vault datum).
 */
var RealfiSDKV1_0 = exports.RealfiSDKV1_0 = /*#__PURE__*/function (_RealfiSDKV1Family) {
  function RealfiSDKV1_0() {
    var _this;
    _classCallCheck(this, RealfiSDKV1_0);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, RealfiSDKV1_0, [].concat(args));
    _defineProperty(_this, "version", "V1_0");
    return _this;
  }
  _inherits(RealfiSDKV1_0, _RealfiSDKV1Family);
  return _createClass(RealfiSDKV1_0, [{
    key: "settingsConfig",
    value:
    // ─────────────────────────────────────────────────────────────────────────────
    // Version Seams
    // ─────────────────────────────────────────────────────────────────────────────

    function settingsConfig(settings) {
      // V1_0 settings are flat: the settings object IS the config.
      return settings;
    }
  }, {
    key: "settingsRegistry",
    value: function settingsRegistry(settings) {
      return settings.registry;
    }
  }, {
    key: "buildInitialVaultDatum",
    value: function buildInitialVaultDatum() {
      return {
        circulating_susdr: 0n
      };
    }
  }, {
    key: "buildUpdatedVaultDatum",
    value: function buildUpdatedVaultDatum(previous, sUSDrDelta) {
      return {
        circulating_susdr: previous.circulating_susdr + sUSDrDelta
      };
    }
  }], [{
    key: "create",
    value:
    /**
     * Create a V1_0 SDK instance.
     */
    function create(blaze, params) {
      var _params$enableTrace, _params$referenceInpu, _params$referenceInpu2, _params$referenceInpu3, _params$referenceInpu4, _params$referenceInpu5;
      var enableTrace = (_params$enableTrace = params.enableTrace) !== null && _params$enableTrace !== void 0 ? _params$enableTrace : false;

      // 1. Create oneshot script
      var oneShotScript = new _index.BaseTypes.BaseOneshotOneshotMint({
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex
      }, enableTrace).Script;
      var oneShotPolicyId = oneShotScript.hash();

      // 2. Create sub-validator scripts first (they only need proxy policy)
      var protocolMintScript = new _index.V1_0Types.V1_0ProtocolMintProtocolMintWithdraw(oneShotPolicyId, enableTrace).Script;
      var protocolStakeScript = new _index.V1_0Types.V1_0ProtocolStakeProtocolStakeWithdraw(oneShotPolicyId, enableTrace).Script;
      var protocolManagementScript = new _index.V1_0Types.V1_0ProtocolManagementProtocolManagementWithdraw(oneShotPolicyId, enableTrace).Script;

      // 3. Create orchestrator with sub-validator hashes
      var protocolOrchestratorScript = new _index.V1_0Types.V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw(oneShotPolicyId, protocolMintScript.hash(), protocolStakeScript.hash(), protocolManagementScript.hash(), enableTrace).Script;
      var mintProxyScript = new _index.BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

      // Use V0.1 or V1.0 treasury script based on option
      // V0.1 is needed for protocol-only upgrades where treasury stays at V0.1 address
      var treasuryScript = params.useV0_1Treasury ? new _index.V0_1Types.V0_1TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script : new _index.V1_0Types.V1_0TreasuryTreasurySpend({
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;

      // 4. Create order script with orchestrator hash (order needs to know the protocol)
      var orderScript = new _index.V1_0Types.V1_0OrderOrderSpend(oneShotPolicyId, protocolOrchestratorScript.hash(), enableTrace).Script;

      // Use V0.4 or V1.0 staking vault script based on option
      // V0.4 is needed for protocol-only upgrades where vault stays at V0.4 address
      var stakingVaultScript = params.useV0_4StakingVault ? new _index.V0_4Types.V0_4StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script : new _index.V1_0Types.V1_0StakingVaultStakingVaultSpend({
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex
      }, oneShotPolicyId, enableTrace).Script;
      return new RealfiSDKV1_0(blaze, {
        version: "V1_0",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace: enableTrace,
        defaultSlippageToleranceBps: params.defaultSlippageToleranceBps,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource,
        deployedValidators: params.deployedValidators
      }, _index.V1_0Types, {
        oneShotScript: oneShotScript,
        protocolOrchestratorScript: protocolOrchestratorScript,
        protocolMintScript: protocolMintScript,
        protocolStakeScript: protocolStakeScript,
        protocolManagementScript: protocolManagementScript,
        mintProxyScript: mintProxyScript,
        treasuryScript: treasuryScript,
        orderScript: orderScript,
        stakingVaultScript: stakingVaultScript
      }, {
        protocolRefInput: (_params$referenceInpu = params.referenceInputs) === null || _params$referenceInpu === void 0 ? void 0 : _params$referenceInpu.protocolRefInput,
        proxyRefInput: (_params$referenceInpu2 = params.referenceInputs) === null || _params$referenceInpu2 === void 0 ? void 0 : _params$referenceInpu2.proxyRefInput,
        treasuryRefInput: (_params$referenceInpu3 = params.referenceInputs) === null || _params$referenceInpu3 === void 0 ? void 0 : _params$referenceInpu3.treasuryRefInput,
        orderRefInput: (_params$referenceInpu4 = params.referenceInputs) === null || _params$referenceInpu4 === void 0 ? void 0 : _params$referenceInpu4.orderRefInput,
        stakingVaultRefInput: (_params$referenceInpu5 = params.referenceInputs) === null || _params$referenceInpu5 === void 0 ? void 0 : _params$referenceInpu5.stakingVaultRefInput
      }, _index.V1_0Types);
    }
  }]);
}(_family.RealfiSDKV1Family);
//# sourceMappingURL=index.js.map