function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { addressFromCredential, addressFromValidator, AssetId, Ed25519KeyHashHex, Hash28ByteBase16, toHex } from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse } from "@blaze-cardano/data";
import { Core, makeValue, Value } from "@blaze-cardano/sdk";
import { BaseTypes, V0_1Types, V0_3Types } from "../../generated-types/index.js";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import { addDirectOutput, buildNonceFromUtxo, credentialFromScriptHash, deployScript, destinationToAddress, getDatumFromNFT, getSignatureKeyHashesFromMultisigScript, getSignedPayloadForDeposit, getSignedPayloadForWithdraw, parseCancelOwner, resolveOrderReferenceInputs, lockOrPayAssets, RealfiSDKBase, sortOrderInputs } from "../shared/index.js";

/**
 * Parsed order information extracted from a UTXO.
 */

/**
 * Treasury state for order execution.
 */

// eslint-disable-next-line @typescript-eslint/naming-convention

/**
 * V0_3 SDK implementation.
 *
 * Extends V0_1 with deposit and withdraw operations for treasury management.
 * All operations (oneshot, protocol, mint proxy, treasury) are consolidated here.
 */
export class RealfiSDKV0_3 extends RealfiSDKBase {
  constructor(blaze, params, scripts, cachedReferenceInputs) {
    super(blaze, params, cachedReferenceInputs);
    _defineProperty(this, "version", "V0_3");
    // Script hashes and policy IDs
    _defineProperty(this, "stablecoinPolicyId", void 0);
    _defineProperty(this, "oneShotPolicyId", void 0);
    _defineProperty(this, "protocolScriptHash", void 0);
    _defineProperty(this, "treasuryScriptHash", void 0);
    _defineProperty(this, "treasuryNFTAssetId", void 0);
    _defineProperty(this, "orderScriptHash", void 0);
    _defineProperty(this, "orderScriptAddress", void 0);
    _defineProperty(this, "treasuryAddress", void 0);
    // Scripts
    _defineProperty(this, "oneShotScript", void 0);
    _defineProperty(this, "protocolScript", void 0);
    _defineProperty(this, "mintProxyScript", void 0);
    _defineProperty(this, "treasuryScript", void 0);
    _defineProperty(this, "orderScript", void 0);
    this.oneShotScript = scripts.oneShotScript;
    this.protocolScript = scripts.protocolScript;
    this.mintProxyScript = scripts.mintProxyScript;
    this.treasuryScript = scripts.treasuryScript;
    this.orderScript = scripts.orderScript;
    this.treasuryAddress = addressFromValidator(this.network, this.treasuryScript);
    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
    this.treasuryScriptHash = this.treasuryScript.hash();
    this.orderScriptHash = this.orderScript.hash();
    this.orderScriptAddress = addressFromValidator(this.network, this.orderScript);

    // Derive treasury NFT asset ID from treasury script hash
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    this.treasuryNFTAssetId = Core.AssetId(this.treasuryScriptHash + treasuryAssetName.toString());
  }

  /**
   * Create a V0_3 SDK instance.
   */
  static create(blaze, params) {
    const enableTrace = params.enableTrace ?? false;

    // Instantiate one-shot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint({
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex
    }, enableTrace).Script;
    const oneShotPolicyId = oneShotScript.hash();
    // Instantiate protocol script (V0_3 uses V0_3ProtocolProtocolWithdraw)
    const protocolScript = new V0_3Types.V0_3ProtocolProtocolWithdraw(oneShotPolicyId, enableTrace).Script;
    // Instantiate mint proxy script (parameterized by one-shot policy ID)
    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(oneShotPolicyId, enableTrace).Script;
    // Instantiate treasury script from treasury bootstrap
    const treasuryScript = new V0_1Types.V0_1TreasuryTreasurySpend({
      transaction_id: params.treasuryBootstrap.txHash,
      output_index: params.treasuryBootstrap.outputIndex
    }, oneShotPolicyId, enableTrace).Script;
    const orderScript = new V0_3Types.V0_3OrderOrderSpend(oneShotPolicyId, enableTrace).Script;
    return new RealfiSDKV0_3(blaze, {
      version: "V0_3",
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      enableTrace,
      scriptDeploymentAddress: params.scriptDeploymentAddress
    }, {
      oneShotScript,
      protocolScript,
      mintProxyScript,
      treasuryScript,
      orderScript
    }, {
      protocolRefInput: params.referenceInputs?.protocolRefInput,
      proxyRefInput: params.referenceInputs?.proxyRefInput,
      treasuryRefInput: params.referenceInputs?.treasuryRefInput,
      orderRefInput: params.referenceInputs?.orderRefInput
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Treasury Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the treasury NFT.
   * This creates a new treasury with an initial datum.
   * The treasury bootstrap UTxO must be provided to consume it.
   */
  async mintTreasuryNFT(treasuryBootstrapUtxo, initialDatum = {
    circulating_supply: 0n
  }) {
    const treasuryPolicyId = Core.PolicyId(this.treasuryScriptHash);
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const treasuryAddress = addressFromValidator(this.network, this.treasuryScript);
    const datum = Data.serialize(V0_1TreasuryDatum, initialDatum);
    const tx = await this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(treasuryAddress, makeValue(10000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
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
   * Deploy the Orders script as a reference script.
   */
  async deployOrderContract() {
    return deployScript(this.blaze, this.orderScript, this.scriptDeploymentAddress);
  }

  /**
   * Get the treasury datum.
   */
  async getTreasuryDatum() {
    const {
      utxo: treasuryUtxo,
      datum: treasuryDatum,
      parsedDatum: parsedTreasuryDatum
    } = await getDatumFromNFT(this.blaze, this.treasuryNFTAssetId, V0_1TreasuryDatum);
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
   * V0_3 uses ProxyDatum which includes withdraw/deposit permissions.
   */
  async mintOneShot(receiverAddress, datum) {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(V0_3Types.ProxyDatum, {
      logic: datum.logic,
      settings: datum.settings
    });
    const baseTx = this.blaze.newTransaction().addInput(utxo).addMint(this.oneShotPolicyId, new Map([[Core.AssetName(""), 1n]]), Data.Void());
    const tx = lockOrPayAssets(baseTx, receiverAddress, makeValue(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum).provideScript(this.oneShotScript);
    return {
      tx,
      policyId: this.oneShotPolicyId
    };
  }

  /**
   * Update the one-shot datum.
   */
  async updateOneShotDatum(receiverAddress, newDatum) {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(Core.AssetId(this.oneShotPolicyId));
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }
    const serializedDatum = Data.serialize(V0_3Types.ProxyDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings
    });
    return lockOrPayAssets(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, makeValue(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum);
  }

  /**
   * Get the proxy datum from the one-shot token UTXO.
   * V0_3 returns ProxyDatum which includes withdraw/deposit permissions.
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
    const parsedProxyDatum = parse(V0_3Types.ProxyDatum, proxyDatum);
    const result = {
      proxyUtxo,
      proxyDatum,
      parsedProxyDatum
    };
    this.cachedProxyDatumResult = result;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Order Execution Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Parse order UTXOs into IOrderInfo objects and validate they're all the same type.
   * @returns The parsed order infos and the action type (mint or burn)
   */
  parseOrderInfos(orderUtxos) {
    const orderInfos = [];
    let actionType = null;
    for (const utxo of orderUtxos) {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(V0_3Types.OrderDatum, datumData);
      let action;
      let amount;
      if ("OMint" in datum.action) {
        action = "mint";
        amount = datum.action.OMint.amount;
      } else if ("ORedeem" in datum.action) {
        action = "burn";
        amount = datum.action.ORedeem.amount;
      } else {
        throw new Error("Unknown order action type");
      }

      // Verify all orders are the same type
      if (actionType === null) {
        actionType = action;
      } else if (actionType !== action) {
        throw new Error("Mixed order types in inputs. All orders must be of the same type.");
      }
      orderInfos.push({
        utxo,
        datum,
        action,
        amount
      });
    }
    if (!actionType) {
      throw new Error("No orders to execute");
    }
    return {
      orderInfos,
      actionType
    };
  }

  /**
   * Calculate treasury state for order execution.
   * Validates that treasury has sufficient reserve tokens for burn operations.
   */
  async calculateTreasuryState(totalAmount, actionType, reserveTokenAssetId) {
    const {
      treasuryUtxo,
      parsedTreasuryDatum
    } = await this.getTreasuryDatum();
    const treasuryValue = treasuryUtxo.output().amount();
    const treasuryAssets = treasuryValue.multiasset();
    const currentReserve = treasuryAssets?.get(reserveTokenAssetId) ?? 0n;
    const newReserve = currentReserve + totalAmount;

    // For burn operations, validate treasury has enough reserve tokens
    if (actionType === "burn") {
      if (currentReserve === 0n) {
        throw new Error("Treasury has no reserve tokens. Cannot execute burn orders.");
      }
      // totalAmount is negative for burns, so newReserve < 0 means insufficient funds
      if (newReserve < 0n) {
        throw new Error(`Insufficient reserve tokens in treasury. Treasury has ${currentReserve} but burn requires ${-totalAmount}.`);
      }
    }
    return {
      treasuryUtxo,
      treasuryValue,
      parsedTreasuryDatum,
      currentReserve,
      newReserve
    };
  }

  /**
   * Add destination outputs for executed orders.
   * For mints: sends stablecoins to destinations.
   * For burns: sends reserve tokens to destinations.
   */
  addDestinationOutputs(tx, orderInfos, actionType, stablecoinAssetId, reserveTokenAssetId) {
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(this.network, orderInfo.datum.destination);
      if (actionType === "mint") {
        const outputValue = makeValue(2000000n, [stablecoinAssetId, orderInfo.amount]);
        addDirectOutput(tx, destAddress, outputValue);
      } else {
        // For burns, amount is negative in the datum, so negate it for output
        const outputValue = makeValue(2000000n, [reserveTokenAssetId, -orderInfo.amount]);
        console.log(destAddress.toBech32(), orderInfo.amount);
        addDirectOutput(tx, destAddress, outputValue);
      }
    }
  }

  /**
   * Update treasury with new reserve balance and circulating supply.
   */
  updateTreasury(tx, treasuryState, totalAmount, reserveTokenAssetId) {
    const newTreasuryDatum = {
      circulating_supply: treasuryState.parsedTreasuryDatum.circulating_supply + totalAmount
    };
    const serializedTreasuryDatum = Data.serialize(V0_1TreasuryDatum, newTreasuryDatum);
    tx.addInput(treasuryState.treasuryUtxo, Data.Void());
    const newTreasuryValue = Value.merge(makeValue(treasuryState.treasuryValue.coin(), [this.treasuryNFTAssetId, 1n]), makeValue(0n, [reserveTokenAssetId, treasuryState.newReserve]));
    tx.lockAssets(this.treasuryAddress, newTreasuryValue, serializedTreasuryDatum);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Minting Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   *
   * @param action "mint" | "burn"
   * @param amount amount of stablecoin to mint or burn
   * @param owner Optional owner multisig script. Defaults to the wallet's change address.
   * @param destination When minting, where to send the minted stablecoins. When burning, where to send the redeemed assets. A datum can be attached.
   * @param data Optional datum data. Defaults to Data.Void()
   * @returns TxBuilder
   */
  async buildOrderTx({
    action,
    amount,
    owner,
    destination,
    data = Data.Void()
  }) {
    const CONVERTION_RATIO = 1n; // Define conversion ratio between stablecoin and reserve token. Should come from datum/settings
    const stableCoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    const orderContractAddress = addressFromValidator(this.network, this.orderScript);
    if (!owner) {
      owner = {
        Signature: {
          key_hash: (await this.blaze.wallet.getChangeAddress()).getProps().paymentPart.hash.toString()
        }
      };
    } else {
      const scriptTypes = Object.keys(owner);
      if (scriptTypes.length !== 1 || scriptTypes[0] !== "Signature") {
        //TODO: support other multisig types once the backend supports them
        throw new Error("Only Signature multisig script is currently supported for owner");
      }
    }
    const orderAction = action === "mint" ? {
      OMint: {
        amount
      }
    } : {
      ORedeem: {
        amount: -amount
      }
    };
    const orderDatum = {
      action: orderAction,
      owner,
      destination,
      data
    };
    const serializedDatum = Data.serialize(V0_3Types.OrderDatum, orderDatum);
    const proxyDatum = await this.getParsedProxyDatum();
    const reserveTokenAssetId = Core.AssetId(proxyDatum.parsedProxyDatum.settings.reserve_token.join(""));
    const tx = this.blaze.newTransaction();
    let valueToLock;
    //TODO: include fees and min ada for when the order is executed?
    if (action === "mint") {
      // minting stablecoin, lock reserve token
      const reserveTokenAmount = amount * CONVERTION_RATIO;
      valueToLock = makeValue(1000000n, [reserveTokenAssetId, reserveTokenAmount]);
    } else {
      // burning stablecoin, lock stablecoin
      valueToLock = makeValue(1000000n, [stableCoinAssetId, amount]);
    }
    tx.lockAssets(orderContractAddress, valueToLock, serializedDatum);
    return tx;
  }
  /**
   * Build the SignedPayload_ProtocolRedeemer from order inputs.
   * Returns CBOR hex string to be signed and included in SignedMessage.
   */
  async getSignedPayloadFromOrderInputs(orderUtxos) {
    if (orderUtxos.length === 0) {
      throw new Error("At least one order UTxO is required");
    }

    // Sort inputs for deterministic ordering
    const sortedInputs = sortOrderInputs(orderUtxos);

    // Build nonce from first UTxO
    const nonce = buildNonceFromUtxo(sortedInputs[0]);

    // Resolve UTxOs and build request list
    const resolvedUtxos = await this.blaze.provider.resolveUnspentOutputs(sortedInputs);
    const requestList = [];
    let actionType = null;
    for (const utxo of resolvedUtxos) {
      const parsed = this.parseOrderActionForPayload(utxo);

      // Validate all orders are the same type
      if (actionType === null) {
        actionType = parsed.actionType;
      } else if (actionType !== parsed.actionType) {
        throw new Error("Mixed order types in inputs. All orders must be of the same type.");
      }
      requestList.push(this.buildRequestFromUtxo(utxo, parsed.amount, parsed.destination));
    }

    // Build the action (ProtocolRedeemer)
    const action = actionType === "OMint" ? {
      Mint: {
        requests: requestList
      }
    } : {
      Burn: {
        requests: requestList
      }
    };

    // Build and serialize SignedPayload_ProtocolRedeemer
    const signedPayload = {
      action,
      nonce
    };
    const serialized = Data.serialize(V0_3Types.SignedPayload_ProtocolRedeemer, signedPayload);
    return serialized.toCbor().toString();
  }

  /**
   * Parse an order UTxO and extract action type, amount, and destination.
   */
  parseOrderActionForPayload(utxo) {
    const datum = utxo.output().datum()?.asInlineData();
    if (!datum) {
      throw new Error("Order UTXO has no inline datum");
    }
    const parsedDatum = parse(V0_3Types.OrderDatum, datum);
    if ("OMint" in parsedDatum.action) {
      return {
        actionType: "OMint",
        amount: parsedDatum.action.OMint.amount,
        destination: parsedDatum.destination
      };
    } else if ("ORedeem" in parsedDatum.action) {
      return {
        actionType: "ORedeem",
        amount: parsedDatum.action.ORedeem.amount,
        destination: parsedDatum.destination
      };
    }
    throw new Error("Unknown order action type");
  }

  /**
   * Build a Request from an order UTxO.
   * Serializes the origin (OutputReference) as CBOR to match Aiken's format.
   */
  buildRequestFromUtxo(utxo, amount, destination) {
    const input = utxo.input();
    const txId = input.transactionId().toString();
    const outputIndex = input.index();

    // Serialize origin as PlutusData (matching Aiken's cbor.serialise format)
    // OutputReference struct: { transaction_id: ByteArray, output_index: Int }
    const fieldsList = new Core.PlutusList();
    fieldsList.add(Core.PlutusData.newBytes(Buffer.from(txId, "hex")));
    fieldsList.add(Core.PlutusData.newInteger(outputIndex));
    const outputRefData = Core.PlutusData.newConstrPlutusData(new Core.ConstrPlutusData(0n, fieldsList));
    return {
      origin: outputRefData.toCbor(),
      amount,
      destination
    };
  }

  /**
   * Build a transaction to execute orders.
   * This consumes order UTXOs, validates the signed redeemer, mints/burns stablecoins,
   * and sends the results to the destinations specified in the orders.
   *
   * @param params.orderInputs - The order transaction inputs to execute
   * @param params.signedPayload - The signed payload hex string from getSignedPayloadFromOrderInputs
   * @param params.signatures - Array of signatures from each signer
   * @returns TxBuilder ready to be completed and signed
   */
  async buildExecuteOrdersTx(params) {
    const {
      orderInputs,
      signedPayload,
      signatures
    } = params;

    // Sort and resolve order UTXOs
    const sortedOrderInputs = sortOrderInputs(orderInputs);
    const orderUtxos = await this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);

    // Parse orders and validate they're all the same type
    const {
      orderInfos,
      actionType
    } = this.parseOrderInfos(orderUtxos);

    // Get protocol datum for permissions and registry
    const {
      proxyUtxo,
      parsedProxyDatum
    } = await this.getParsedProxyDatum();

    // Get script reference inputs (uses caching from base class)
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      order: this.orderScriptHash,
      treasury: this.treasuryScriptHash
    });
    const protocolRefInput = refInputs.protocol;
    const orderRefInput = refInputs.order;
    const treasuryRefInput = refInputs.treasury;
    if (!protocolRefInput || !orderRefInput || !treasuryRefInput) {
      throw new Error("Missing reference script inputs. Make sure all scripts are deployed.");
    }

    // Calculate total amount and get asset IDs
    const totalAmount = orderInfos.reduce((sum, info) => sum + info.amount, 0n);
    const reserveTokenAssetId = Core.AssetId(parsedProxyDatum.settings.reserve_token.join(""));
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);

    // Calculate treasury state and validate for burns
    const treasuryState = await this.calculateTreasuryState(totalAmount, actionType, reserveTokenAssetId);

    // Build request_to_outputs mapping (1:1 since outputs are in same order as inputs)
    const requestToOutputs = {};
    for (let i = 0; i < orderInfos.length; i++) {
      requestToOutputs[i] = BigInt(i);
    }

    // Serialize redeemers
    const serializedSignedRedeemer = Data.serialize(V0_3Types.SignedRedeemer_ExtraProtocolRedeemer, {
      extra: {
        request_to_outputs: requestToOutputs
      },
      payload: signedPayload,
      signatures: signatures
    });
    const executeRedeemer = Data.serialize(V0_3Types.OrderRedeemer, "Execute");

    // Build the transaction

    const tx = this.blaze.newTransaction();

    // Add order inputs with Execute redeemer
    for (const orderInfo of orderInfos) {
      tx.addInput(orderInfo.utxo, executeRedeemer);
    }

    // Add reference inputs
    tx.addReferenceInput(protocolRefInput);
    tx.addReferenceInput(orderRefInput);
    tx.addReferenceInput(proxyUtxo);
    tx.addReferenceInput(treasuryRefInput);

    // Add protocol withdrawal with signed redeemer
    const protocolRewardAccount = Core.RewardAccount.fromCredential({
      type: Core.CredentialType.ScriptHash,
      hash: this.protocolScriptHash
    }, this.network);
    tx.addWithdrawal(protocolRewardAccount, 0n, serializedSignedRedeemer);

    // Mint/burn stablecoins
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

    // Add destination outputs
    this.addDestinationOutputs(tx, orderInfos, actionType, stablecoinAssetId, reserveTokenAssetId);

    // Update treasury
    this.updateTreasury(tx, treasuryState, totalAmount, reserveTokenAssetId);

    // Provide the mint proxy script for minting
    tx.provideScript(this.mintProxyScript);
    return tx;
  }

  /**
   * Build a transaction to cancel orders.
   * This returns the locked assets to the specified destination address.
   * The transaction must be signed by the owner(s) specified in each order's datum.
   *
   * @param params.orderInputs - The order transaction inputs to cancel
   * @param params.destination - Optional destination address. Defaults to the wallet's change address.
   * @returns TxBuilder ready to be completed and signed
   */
  async buildCancelOrdersTx(params) {
    const {
      orderInputs,
      destination,
      versionHint
    } = params;

    // Resolve order UTXOs
    const orderUtxos = await this.blaze.provider.resolveUnspentOutputs(orderInputs);
    if (orderUtxos.length === 0) {
      throw new Error("No orders to cancel");
    }
    const cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
    const orderRefInputs = await resolveOrderReferenceInputs(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);

    // Build the cancel redeemer
    const cancelRedeemer = Data.serialize(V0_3Types.OrderRedeemer, "Cancel");

    // Determine destination address
    const destAddress = destination ?? (await this.blaze.wallet.getChangeAddress());

    // Build the transaction

    const tx = this.blaze.newTransaction();
    for (const orderRefInput of orderRefInputs.values()) {
      tx.addReferenceInput(orderRefInput);
    }

    // cache current version of order script reference input
    const currentOrderRefInput = orderRefInputs.get(this.orderScriptHash);
    if (currentOrderRefInput && !this.cachedReferenceInputs.orderRefInput) {
      this.cachedReferenceInputs.orderRefInput = currentOrderRefInput;
    }

    // Collect all required signers from order owners
    const requiredSigners = new Set();

    // Process each order
    for (const utxo of orderUtxos) {
      const owner = await parseCancelOwner(utxo, versionHint);

      // Extract required signers from the owner's MultisigScript
      for (const keyHash of getSignatureKeyHashesFromMultisigScript(owner)) {
        requiredSigners.add(keyHash);
      }

      // Add order input with Cancel redeemer
      tx.addInput(utxo, cancelRedeemer);

      // Return the locked assets to destination
      const outputValue = utxo.output().amount();
      addDirectOutput(tx, destAddress, outputValue);
    }

    // Add all required signers to the transaction
    for (const keyHash of requiredSigners) {
      tx.addRequiredSigner(Ed25519KeyHashHex(keyHash));
    }
    return tx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Treasury Operations: Withdraw and Deposit
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a transaction to withdraw reserve tokens from the treasury.
   * The transaction must be signed by the authorized withdraw permission signers.
   *
   * @param params.requests - Array of withdraw requests with destinations and amounts
   * @param params.signedPayload - The signed payload hex string from getSignedPayloadForWithdraw
   * @param params.signatures - Array of KeySignature tuples from authorized signers
   * @returns TxBuilder ready to be completed and signed
   */
  /**
   * Build a withdraw transaction to remove reserve from the treasury.
   * @param amount Amount to withdraw from treasury
   * @param receiverAddress Address to send withdrawn assets to; defaults to wallet address
   */
  async buildWithdrawTx(assetAmount, receiverAddress) {
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
      treasury: this.treasuryScriptHash
    });
    const receiver = receiverAddress ? Core.Address.fromBech32(receiverAddress) : await this.blaze.wallet.getChangeAddress();
    const {
      proxyUtxo,
      parsedProxyDatum
    } = await this.getParsedProxyDatum();
    const {
      treasuryUtxo,
      treasuryDatum
    } = await this.getTreasuryDatum();
    const serializedPayload = getSignedPayloadForWithdraw(assetAmount.amount, treasuryUtxo);
    // Build SignedRedeemer_ExtraProtocolRedeemer
    const serializedSignedRedeemer = Data.serialize(V0_3Types.SignedRedeemer_ExtraProtocolRedeemer, {
      extra: {
        request_to_outputs: {
          0: 0n
        }
      },
      payload: serializedPayload,
      signatures: []
    });
    const rewardAccount = this.getProtocolRewardAccount();
    const requiredSigners = getSignatureKeyHashesFromMultisigScript(parsedProxyDatum.settings.withdraw_permission).map(key => Core.Ed25519KeyHashHex(key));
    const reserveToken = AssetId(assetAmount.id ?? parsedProxyDatum.settings.reserve_token.join(""));
    const treasuryAddress = addressFromCredential(this.network, credentialFromScriptHash(Hash28ByteBase16(parsedProxyDatum.settings.registry.treasury)));
    const inititalTreasuryValue = treasuryUtxo.output().amount();
    const withdrawValue = makeValue(0n, [reserveToken, -assetAmount.amount]);
    const newTreasuryValue = Value.merge(inititalTreasuryValue, withdrawValue);
    const tx = this.blaze.newTransaction().addWithdrawal(rewardAccount, 0n, serializedSignedRedeemer).addReferenceInput(proxyUtxo).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addReferenceInput(refInputs.treasury).addInput(treasuryUtxo, Data.Void());
    addDirectOutput(tx, receiver, makeValue(0n, [reserveToken, assetAmount.amount]));
    tx.lockAssets(treasuryAddress, newTreasuryValue, treasuryDatum);
    for (const signer of requiredSigners) {
      tx.addRequiredSigner(signer);
    }
    return tx;
  }
  async buildDepositTx(assetAmount) {
    const refInputs = await this.getScriptReferenceInputs({
      protocol: this.protocolScriptHash,
      proxy: this.mintProxyScript.hash(),
      treasury: this.treasuryScriptHash
    });
    const {
      proxyUtxo,
      parsedProxyDatum
    } = await this.getParsedProxyDatum();
    const {
      treasuryUtxo,
      treasuryDatum
    } = await this.getTreasuryDatum();
    const serializedPayload = getSignedPayloadForDeposit(assetAmount.amount, treasuryUtxo);
    // Build SignedRedeemer_ExtraProtocolRedeemer
    const serializedSignedRedeemer = Data.serialize(V0_3Types.SignedRedeemer_ExtraProtocolRedeemer, {
      extra: {
        request_to_outputs: {
          0: 0n
        }
      },
      payload: serializedPayload,
      signatures: []
    });
    const rewardAccount = this.getProtocolRewardAccount();
    const requiredSigners = getSignatureKeyHashesFromMultisigScript(parsedProxyDatum.settings.deposit_permission).map(key => Core.Ed25519KeyHashHex(key));
    const reserveToken = AssetId(assetAmount.id ?? parsedProxyDatum.settings.reserve_token.join(""));
    const treasuryAddress = addressFromCredential(this.network, credentialFromScriptHash(Hash28ByteBase16(parsedProxyDatum.settings.registry.treasury)));
    const inititalTreasuryValue = treasuryUtxo.output().amount();
    const depositValue = makeValue(0n, [reserveToken, assetAmount.amount]);
    const newTreasuryValue = Value.merge(inititalTreasuryValue, depositValue);
    const tx = this.blaze.newTransaction().addWithdrawal(rewardAccount, 0n, serializedSignedRedeemer).addReferenceInput(proxyUtxo).addReferenceInput(refInputs.protocol).addReferenceInput(refInputs.proxy).addReferenceInput(refInputs.treasury).addInput(treasuryUtxo, Data.Void()).lockAssets(treasuryAddress, newTreasuryValue, treasuryDatum);
    for (const signer of requiredSigners) {
      tx.addRequiredSigner(signer);
    }
    return tx;
  }
}
//# sourceMappingURL=index.js.map