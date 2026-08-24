function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import * as Data from "@blaze-cardano/data";
import { parse, Void } from "@blaze-cardano/data";
import { Core, makeValue } from "@blaze-cardano/sdk";
import { BaseTypes, V0Types } from "../../generated-types/index.js";
import { lockOrPayAssets, RealfiSDKBase } from "../shared/index.js";

/**
 * V0 datum type - simple datum with logic hash and no settings
 */
export const AdminDatum = Data.Type.Object({
  logic: Data.Type.String(),
  settings: Data.Type.Void()
}, {
  ctor: 0n
});
/**
 * V0 SDK implementation.
 *
 * Simple minting without treasury management.
 * All operations (oneshot, protocol, mint proxy) are consolidated here.
 */
export class RealfiSDKV0 extends RealfiSDKBase {
  constructor(blaze, params, scripts, cachedReferenceInputs) {
    super(blaze, params, cachedReferenceInputs);
    _defineProperty(this, "version", "V0");
    // Script hashes and policy IDs
    _defineProperty(this, "stablecoinPolicyId", void 0);
    _defineProperty(this, "oneShotPolicyId", void 0);
    _defineProperty(this, "protocolScriptHash", void 0);
    // Scripts
    _defineProperty(this, "oneShotScript", void 0);
    _defineProperty(this, "protocolScript", void 0);
    _defineProperty(this, "mintProxyScript", void 0);
    this.oneShotScript = scripts.oneShotScript;
    this.protocolScript = scripts.protocolScript;
    this.mintProxyScript = scripts.mintProxyScript;
    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
  }

  /**
   * Create a V0 SDK instance.
   */
  static create(blaze, params) {
    const enableTrace = params.enableTrace ?? false;

    // Instantiate one-shot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint({
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex
    }, enableTrace).Script;

    // Instantiate protocol script (V0 uses no parameters)
    const protocolScript = new V0Types.V0ProtocolProtocolWithdraw(enableTrace).Script;

    // Instantiate mint proxy script (parameterized by one-shot policy ID)
    const oneShotPolicyId = oneShotScript.hash();
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;
    return new RealfiSDKV0(blaze, {
      version: "V0",
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      enableTrace,
      scriptDeploymentAddress: params.scriptDeploymentAddress
    }, {
      oneShotScript,
      protocolScript,
      mintProxyScript
    }, {
      protocolRefInput: params.referenceInputs?.protocolRefInput,
      proxyRefInput: params.referenceInputs?.proxyRefInput
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // One-Shot Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the one-shot NFT with the initial datum.
   * This consumes the bootstrap UTXO and can only be done once.
   */
  async mintOneShot(receiverAddress, datum) {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(AdminDatum, {
      logic: datum.logic,
      settings: datum.settings
    });
    const baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[Core.AssetName(""), 1n]]), Data.Void());
    const tx = lockOrPayAssets(baseTx, receiverAddress, makeValue(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
    return {
      tx,
      policyId: this.oneShotPolicyId
    };
  }

  /**
   * Update the one-shot datum.
   * This spends the one-shot UTXO and sends it back to the receiver with new datum.
   */
  async updateOneShotDatum(receiverAddress, newDatum) {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(Core.AssetId(this.oneShotPolicyId));
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }
    const serializedDatum = Data.serialize(AdminDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings
    });
    return lockOrPayAssets(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, makeValue(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum);
  }

  /**
   * Get the proxy datum from the one-shot token UTXO.
   * Result is cached after first fetch.
   */
  async getParsedProxyDatum() {
    if (this.cachedProxyDatumResult) {
      return this.cachedProxyDatumResult;
    }
    const {
      proxyUtxo,
      proxyDatum
    } = await this.getRawProxyDatum();
    const parsedProxyDatum = parse(AdminDatum, proxyDatum);
    const result = {
      proxyUtxo,
      proxyDatum,
      parsedProxyDatum
    };
    this.cachedProxyDatumResult = result;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Minting Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a mint (positive amount) or burn (negative amount) transaction.
   * V0 minting is simple - no treasury involvement.
   */
  async buildMintTx(amount) {
    const rewardAccount = this.getProtocolRewardAccount();
    const utxo = await this.blaze.provider.getUnspentOutputByNFT(Core.AssetId(this.oneShotPolicyId));
    if (!utxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash()
    });
    const tx = this.blaze.newTransaction().addReferenceInput(utxo).addWithdrawal(rewardAccount, 0n, Void()).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), amount.amount]]), Void());
    return tx;
  }
}
//# sourceMappingURL=index.js.map