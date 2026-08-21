function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { addressFromCredential, addressFromValidator, Hash28ByteBase16, toHex } from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse, Void } from "@blaze-cardano/data";
import { Core, makeValue, Value } from "@blaze-cardano/sdk";
import { BaseTypes, V0_1Types } from "../../generated-types/index.js";
import { addDirectOutput, credentialFromScriptHash, deployScript, getDatumFromNFT, getSignatureKeyHashesFromMultisigScript, lockOrPayAssets, RealfiSDKBase } from "../shared/index.js";

// eslint-disable-next-line @typescript-eslint/naming-convention

/**
 * V0_1 SDK implementation.
 *
 * Includes treasury management, reserve backing, and circulating supply tracking.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export class RealfiSDKV0_1 extends RealfiSDKBase {
  constructor(blaze, params, scripts, treasuryNFTAssetId, cachedReferenceInputs) {
    super(blaze, params, cachedReferenceInputs);
    _defineProperty(this, "version", "V0_1");
    // Script hashes and policy IDs
    _defineProperty(this, "stablecoinPolicyId", void 0);
    _defineProperty(this, "oneShotPolicyId", void 0);
    _defineProperty(this, "protocolScriptHash", void 0);
    _defineProperty(this, "treasuryScriptHash", void 0);
    _defineProperty(this, "treasuryNFTAssetId", void 0);
    // Scripts
    _defineProperty(this, "oneShotScript", void 0);
    _defineProperty(this, "protocolScript", void 0);
    _defineProperty(this, "mintProxyScript", void 0);
    _defineProperty(this, "treasuryScript", void 0);
    this.oneShotScript = scripts.oneShotScript;
    this.protocolScript = scripts.protocolScript;
    this.mintProxyScript = scripts.mintProxyScript;
    this.treasuryScript = scripts.treasuryScript;
    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
    this.treasuryScriptHash = this.treasuryScript.hash();
    this.treasuryNFTAssetId = treasuryNFTAssetId;
  }

  /**
   * Create a V0_1 SDK instance.
   */
  static create(blaze, params) {
    const enableTrace = params.enableTrace ?? false;

    // Instantiate one-shot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint({
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex
    }, enableTrace).Script;
    const oneShotPolicyId = oneShotScript.hash();

    // Instantiate protocol script (V0_1 parameterized by one-shot policy ID)
    const protocolScript = new V0_1Types.V0_1ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script;

    // Instantiate mint proxy script (parameterized by one-shot policy ID)
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;

    // Instantiate treasury script (parameterized by UTXO ref and one-shot policy ID)
    const treasuryScript = new V0_1Types.V0_1TreasuryTreasurySpend({
      transaction_id: params.treasuryBootstrap.txHash,
      output_index: params.treasuryBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;

    // Derive treasury NFT asset ID from treasury script hash
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const treasuryNFTAssetId = Core.AssetId(treasuryScript.hash() + treasuryAssetName.toString());
    return new RealfiSDKV0_1(blaze, {
      version: "V0_1",
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      enableTrace,
      scriptDeploymentAddress: params.scriptDeploymentAddress
    }, {
      oneShotScript,
      protocolScript,
      mintProxyScript,
      treasuryScript
    }, treasuryNFTAssetId, {
      protocolRefInput: params.referenceInputs?.protocolRefInput,
      proxyRefInput: params.referenceInputs?.proxyRefInput,
      treasuryRefInput: params.referenceInputs?.treasuryRefInput
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Treasury Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the treasury NFT.
   * This creates a new treasury with an initial datum.
   * Uses the treasury bootstrap UTXO that was provided when creating the SDK.
   */
  async mintTreasuryNFT(treasuryBootstrapUtxo, initialDatum = {
    circulating_supply: 0n
  }) {
    const treasuryPolicyId = Core.PolicyId(this.treasuryScript.hash());
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const treasuryAddress = addressFromValidator(this.network, this.treasuryScript);
    const datum = Data.serialize(V0_1Types.TreasuryDatum, initialDatum);
    const tx = this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(treasuryAddress, makeValue(1000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
    return {
      tx,
      nftAssetId: this.treasuryNFTAssetId
    };
  }

  /**
   * Deploy the treasury script as a reference script.
   */
  async deployTreasury() {
    return deployScript(this.blaze, this.treasuryScript, this.scriptDeploymentAddress);
  }

  /**
   * Get the treasury datum.
   */
  async getTreasuryDatum() {
    const {
      utxo: treasuryUtxo,
      datum: treasuryDatum,
      parsedDatum: parsedTreasuryDatum
    } = await getDatumFromNFT(this.blaze, this.treasuryNFTAssetId, V0_1Types.TreasuryDatum);
    if (!treasuryUtxo) {
      throw new Error("No UTXO found with the treasury NFT");
    }
    if (!treasuryDatum) {
      throw new Error("No treasury datum found");
    }
    return {
      treasuryUtxo,
      treasuryDatum,
      parsedTreasuryDatum: parsedTreasuryDatum
    };
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
    const serializedDatum = Data.serialize(V0_1Types.ProxyDatum, {
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
    const serializedDatum = Data.serialize(V0_1Types.ProxyDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings
    });
    const tx = lockOrPayAssets(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, makeValue(1000000n, [this.oneShotPolicyId, 1n]), serializedDatum);
    return tx;
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
    const parsedProxyDatum = parse(V0_1Types.ProxyDatum, proxyDatum);
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
   * V0_1 minting includes treasury update for circulating supply tracking.
   */
  async buildMintTx(assetAmount) {
    const isBurn = assetAmount.amount < 0n;
    const rewardAccount = this.getProtocolRewardAccount();
    const {
      proxyUtxo,
      parsedProxyDatum
    } = await this.getParsedProxyDatum();
    const treasuryScriptHash = Hash28ByteBase16(parsedProxyDatum.settings.registry.treasury);

    // Get all reference inputs in one call (cached after first fetch)
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
      treasury: treasuryScriptHash
    });
    const {
      utxo: treasuryUtxo,
      parsedDatum: parsedTreasuryDatum
    } = await getDatumFromNFT(this.blaze, this.treasuryNFTAssetId, V0_1Types.TreasuryDatum);
    const circulatingSupply = parsedTreasuryDatum.circulating_supply;
    const newCirculatingSupply = circulatingSupply + assetAmount.amount;
    const newTreasuryDatum = Data.serialize(V0_1Types.TreasuryDatum, {
      circulating_supply: newCirculatingSupply
    });
    const reserveToken = parsedProxyDatum.settings.reserve_token.join("");
    const treasuryAddress = addressFromCredential(this.network, credentialFromScriptHash(treasuryScriptHash));
    const redeemer = isBurn ? Data.serialize(V0_1Types.ProtocolRedeemer, "Burn") : Data.serialize(V0_1Types.ProtocolRedeemer, "Mint");
    const assetName = Core.AssetName(this.assetNameHex);
    const initialTreasuryValue = treasuryUtxo.output().amount();
    const valueToAdd = makeValue(0n, [reserveToken, assetAmount.amount]);
    const updatedTreasuryValue = Value.merge(initialTreasuryValue, valueToAdd);
    const tx = this.blaze.newTransaction().addReferenceInput(proxyUtxo).addWithdrawal(rewardAccount, 0n, redeemer).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addReferenceInput(refInputs.treasury).addInput(treasuryUtxo, Void()).addMint(this.stablecoinPolicyId, new Map([[assetName, assetAmount.amount]]), Void()).lockAssets(treasuryAddress, updatedTreasuryValue, newTreasuryDatum);
    if (isBurn) {
      const requiredSigners = getSignatureKeyHashesFromMultisigScript(parsedProxyDatum.settings.burn_permission).map(key => Core.Ed25519KeyHashHex(key));
      for (const signer of requiredSigners) {
        tx.addRequiredSigner(signer);
      }
      const receiverAddress = await this.blaze.wallet.getChangeAddress();
      addDirectOutput(tx, receiverAddress, makeValue(0n, [reserveToken, -assetAmount.amount]));
    } else {
      const requiredSigners = getSignatureKeyHashesFromMultisigScript(parsedProxyDatum.settings.mint_permission).map(key => Core.Ed25519KeyHashHex(key));
      for (const signer of requiredSigners) {
        tx.addRequiredSigner(signer);
      }
    }
    return tx;
  }
}
//# sourceMappingURL=index.js.map