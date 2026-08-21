function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { addressFromCredentials, addressFromValidator, blake2b_256, Ed25519KeyHashHex, HexBlob, PlutusData, toHex } from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse } from "@blaze-cardano/data";
import { calculateMinAda, Core, makeValue, Value } from "@blaze-cardano/sdk";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import { addDirectOutput, addDestinationOutput, buildNonceFromUtxo, buildMultisigTimelockNativeScript, buildTimelockAddress, buildTimelockDestination, buildTimelockNativeScript, buildUnstakeMetadatum, UNSTAKE_METADATA_LABEL, credentialFromScript, deployScript, findReserveAsset, getDatumFromNFT, getSignatureKeyHashesFromMultisigScript, usdrToReserve, usdrToReserveCeil, computeReserveDeltas, lockOrPayAssets, sortOrderInputs, RealfiSDKBase, resolveOrderReferenceInputs, parseCancelOwner } from "../shared/index.js";
import { screenOrderAction, screenDepositBatch, screenOrderUtxoFacts } from "./order-sanity.js";
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sentinel `reserve_asset` used in V1_0 TreasuryRequestV1 redeemers for
 * DirectMint and DirectBurn actions, which have no real reserve asset in
 * their order datum. The on-chain validators `direct_mint_logic` and
 * `direct_burn_logic` do not inspect this field; this sentinel makes the
 * intent explicit both in code and when inspecting on-chain redeemers.
 *
 * - `policy_id`: 28 zero bytes (standard policy-ID length, chosen as a
 *   sentinel and extremely unlikely to occur as a real script hash)
 * - `asset_name`: "unused" (ASCII)
 *
 * Keep in sync with backend `contract.DirectActionPaddingAsset`.
 */
export const DIRECT_ACTION_PADDING_ASSET = ["00".repeat(28), toHex(new TextEncoder().encode("unused"))];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsed order information extracted from a UTXO.
 */

/** Minimal completed-swap shape accepted by the stake continuation builder. */

/** Parameters for building a RealFi stake order as another order's destination. */

/** Address and inline datum a preceding protocol should pay its result to. */

/** Result of {@link RealfiSDKV1Family.classifyOrderAction}. */

/** Result of {@link RealfiSDKV1Family.classifyOrderUtxo}. */

/** The `origin` field shared by every request kind — the consumed order UTxO. */

/**
 * Context handed to {@link RealfiSDKV1Family.applyExecutionValidityBounds}
 * at the end of `buildExecuteOrdersTx`. The vault fields are set only when
 * the executed action consumed the staking vault (stake/unstake/deposit).
 */

/**
 * Version-agnostic constructor parameters for the V1 family. Each version's
 * `static create` assembles this from its own public params interface.
 */

/** Blueprint validator key (within a version slot) -> SDK identity field. */
const DEPLOYED_VALIDATOR_FIELDS = [["protocol_orchestrator.protocol_orchestrator.withdraw", "protocolScriptHash"], ["protocol_mint.protocol_mint.withdraw", "protocolMintScriptHash"], ["protocol_stake.protocol_stake.withdraw", "protocolStakeScriptHash"], ["protocol_management.protocol_management.withdraw", "protocolManagementScriptHash"], ["order.order.spend", "orderScriptHash"], ["treasury.treasury.spend", "treasuryScriptHash"], ["staking_vault.staking_vault.spend", "stakingVaultScriptHash"]];
const DEPLOYED_VALIDATOR_PREFIXES = {
  V1_0: "v1_0/",
  V1_0_Rc1: "v1_0_rc1/",
  V1_1_Rc1: "v1_1_rc1/"
};
const COMPATIBLE_STATE_VALIDATOR_FIELDS = new Set(["treasuryScriptHash", "stakingVaultScriptHash"]);

/** Hash fields whose address must move with them. */
const DEPLOYED_ADDRESS_FIELDS = {
  orderScriptHash: "orderScriptAddress",
  treasuryScriptHash: "treasuryAddress",
  stakingVaultScriptHash: "stakingVaultAddress"
};
export const MIN_LOVELACE = 2000000n;

/**
 * Calculate yield split between staked and unstaked portions.
 * Matches on-chain deposit.ak logic: staked_yield_share = total_yield * vault_usdr / treasury_circulating
 *
 * IMPORTANT: Uses truncation toward zero (BigInt default `/` operator) to match
 * Aiken's builtin.quotient_integer. Do NOT use floor division here, as it
 * rounds toward negative infinity which gives different results for negative yields.
 * Example: floor(-165/90) = -2, but trunc(-165/90) = -1.
 */
/**
 * Extract the requests list from a signed payload action, regardless of action type.
 * Both TreasuryRequestV1 and RequestV1 have `origin: { transaction_id, output_index }`.
 */
function getRequestsFromAction(action) {
  if ("Mint" in action) return action.Mint.requests;
  if ("Burn" in action) return action.Burn.requests;
  if ("Withdraw" in action) return action.Withdraw.requests;
  if ("Deposit" in action) return action.Deposit.requests;
  if ("Stake" in action) return action.Stake.requests;
  if ("Unstake" in action) return action.Unstake.requests;
  if ("DirectMint" in action) return action.DirectMint.requests;
  if ("DirectBurn" in action) return action.DirectBurn.requests;
  throw new Error("Unknown action type in signed payload");
}
export function calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating) {
  // Note: BigInt / truncates toward zero, matching Aiken's quotient_integer
  const stakedYieldShare = treasuryCirculating > 0n ? totalYield * vaultUSDr / treasuryCirculating : 0n;
  const unstakedYieldShare = totalYield - stakedYieldShare;
  return {
    stakedYieldShare,
    unstakedYieldShare
  };
}

/**
 * Refuse to create an order whose `min_received` floor is not strictly
 * positive (WTB-1764).
 *
 * Every v1-family validator predicate that reads `min_received` requires it to
 * be > 0, and those predicates run inside a `zip_fold` that `expect`s each
 * request in turn — so one order with a zero floor crashes the ENTIRE execution
 * transaction, killing every valid order batched alongside it. Such an order can
 * never execute; creating it only plants a landmine at the order script address.
 *
 * This guards both an explicit caller-supplied floor and a computed one that
 * rounds or nets down to zero (a dust stake at a high exchange rate, or a
 * full-forfeit unstake).
 */
function assertPositiveMinReceived(label, minReceived) {
  if (minReceived <= 0n) {
    throw new Error(`${label} minReceived must be positive (got ${minReceived}); an order with a ` + "non-positive min_received can never execute and crashes every batch it joins");
  }
}
function buildOrderDestinationValue(orderInfo, consumedAssets, deliveredAssets = []) {
  let value = orderInfo.utxo.output().amount();
  for (const [assetId, amount] of consumedAssets) {
    if (amount !== 0n) {
      value = Value.merge(value, makeValue(0n, [assetId, -amount]));
    }
  }
  for (const [assetId, amount] of deliveredAssets) {
    if (amount !== 0n) {
      value = Value.merge(value, makeValue(0n, [assetId, amount]));
    }
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Family Base Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared implementation for the V1 protocol family (v1_0, v1_0_rc1, v1_1+).
 *
 * The family is generic over the two datum shapes that differ across
 * versions — `TSettings` (the proxy settings static) and `TVaultDatum` (the
 * staking-vault datum static) — and receives all generated artifacts from the
 * subclass: schema VALUES via {@link IV1FamilySchemas} (plus, optionally,
 * {@link IV1SigningSchemas}) and instantiated scripts via
 * {@link IV1FamilyScripts}. Method bodies never touch a version's generated
 * module directly, so this chunk adds no runtime import edge to any
 * `generated-types/v1_x` module and per-version code-splitting is preserved.
 *
 * Method defaults implement v1_0 semantics (fees, min_received, the v1_0
 * protocol-redeemer schema). Versions that diverge override the affected
 * members:
 * - vault datum construction is NEVER done inline — it goes through the
 *   abstract `buildInitialVaultDatum` / `buildUpdatedVaultDatum` seam so
 *   versions with additional vault fields cannot be silently truncated;
 * - settings access goes through the abstract `settingsConfig` /
 *   `settingsRegistry` adapters;
 * - `applyExecutionValidityBounds` lets a version constrain the validity
 *   interval of execution transactions (no-op by default).
 */
export class RealfiSDKV1Family extends RealfiSDKBase {
  constructor(blaze, params, schemas, scripts, cachedReferenceInputs, signingSchemas) {
    super(blaze, {
      version: params.version,
      proxyBootstrap: params.proxyBootstrap,
      assetNameHex: params.assetNameHex,
      enableTrace: params.enableTrace,
      scriptDeploymentAddress: params.scriptDeploymentAddress,
      clientSource: params.clientSource
    }, cachedReferenceInputs);
    // Script hashes and policy IDs
    _defineProperty(this, "stablecoinPolicyId", void 0);
    _defineProperty(this, "oneShotPolicyId", void 0);
    _defineProperty(this, "protocolScriptHash", void 0);
    _defineProperty(this, "protocolMintScriptHash", void 0);
    _defineProperty(this, "protocolStakeScriptHash", void 0);
    _defineProperty(this, "protocolManagementScriptHash", void 0);
    _defineProperty(this, "treasuryScriptHash", void 0);
    _defineProperty(this, "treasuryNFTAssetId", void 0);
    _defineProperty(this, "orderScriptHash", void 0);
    _defineProperty(this, "orderScriptAddress", void 0);
    _defineProperty(this, "treasuryAddress", void 0);
    _defineProperty(this, "stakingVaultScriptHash", void 0);
    _defineProperty(this, "stakingVaultAddress", void 0);
    _defineProperty(this, "stakingVaultNFTAssetId", void 0);
    _defineProperty(this, "sUSDrAssetNameHex", void 0);
    // Scripts
    _defineProperty(this, "oneShotScript", void 0);
    _defineProperty(this, "protocolScript", void 0);
    // Alias for orchestrator (base class compatibility)
    _defineProperty(this, "protocolOrchestratorScript", void 0);
    _defineProperty(this, "protocolMintScript", void 0);
    _defineProperty(this, "protocolStakeScript", void 0);
    _defineProperty(this, "protocolManagementScript", void 0);
    _defineProperty(this, "mintProxyScript", void 0);
    _defineProperty(this, "treasuryScript", void 0);
    _defineProperty(this, "orderScript", void 0);
    _defineProperty(this, "stakingVaultScript", void 0);
    _defineProperty(this, "defaultSlippageToleranceBps", void 0);
    /** Schema values used by every shared serialize/parse site. */
    _defineProperty(this, "schemas", void 0);
    _defineProperty(this, "signingSchemas", void 0);
    this.schemas = schemas;
    this.signingSchemas = signingSchemas;
    this.sUSDrAssetNameHex = params.sUSDrAssetNameHex;
    this.defaultSlippageToleranceBps = params.defaultSlippageToleranceBps;
    this.oneShotScript = scripts.oneShotScript;
    this.protocolOrchestratorScript = scripts.protocolOrchestratorScript;
    this.protocolScript = scripts.protocolOrchestratorScript; // Alias for base class
    this.protocolMintScript = scripts.protocolMintScript;
    this.protocolStakeScript = scripts.protocolStakeScript;
    this.protocolManagementScript = scripts.protocolManagementScript;
    this.mintProxyScript = scripts.mintProxyScript;
    this.treasuryScript = scripts.treasuryScript;
    this.orderScript = scripts.orderScript;
    this.stakingVaultScript = scripts.stakingVaultScript;
    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolOrchestratorScript.hash();
    this.protocolMintScriptHash = this.protocolMintScript.hash();
    this.protocolStakeScriptHash = this.protocolStakeScript.hash();
    this.protocolManagementScriptHash = this.protocolManagementScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
    this.treasuryScriptHash = this.treasuryScript.hash();
    this.orderScriptHash = this.orderScript.hash();
    this.stakingVaultScriptHash = this.stakingVaultScript.hash();
    this.treasuryAddress = addressFromValidator(this.network, this.treasuryScript);
    this.orderScriptAddress = addressFromValidator(this.network, this.orderScript);
    this.stakingVaultAddress = addressFromValidator(this.network, this.stakingVaultScript);

    // Every identity above is derived from this package's own artifacts, which
    // only describes a deployment running those exact bytes. Where the caller
    // knows what the chain actually runs, that wins — otherwise the derived
    // order address is one nothing watches, and an order (lockAssets, no
    // on-chain validation) would submit successfully into it.
    this.applyDeployedValidators(params.deployedValidators, params.version);

    // Treasury NFT: policy = treasury script hash, name = "treasury"
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    this.treasuryNFTAssetId = Core.AssetId(this.treasuryScriptHash + treasuryAssetName.toString());

    // Staking vault NFT: policy = staking vault script hash, name = "staking_vault"
    const vaultAssetName = Core.AssetName(toHex(Buffer.from("staking_vault")));
    this.stakingVaultNFTAssetId = Core.AssetId(this.stakingVaultScriptHash + vaultAssetName.toString());
  }

  /**
   * Replace derived script identity with the deployment's own hashes.
   *
   * Version-owned validators are selected only from this SDK's exact version
   * slot. Treasury and staking-vault validators can deliberately survive a
   * protocol-only upgrade, so their unversioned entries are used as the
   * authoritative active-state fallback.
   *
   * Unrecognised keys are ignored: a blueprint legitimately carries validators
   * outside this family (oneshot, mint_proxy) and future ones this build has
   * never heard of.
   */
  applyDeployedValidators(deployed, version) {
    if (!deployed) return;
    if (!(version in DEPLOYED_VALIDATOR_PREFIXES)) return;
    const prefix = DEPLOYED_VALIDATOR_PREFIXES[version];
    const mutable = this;
    for (const [suffix, field] of DEPLOYED_VALIDATOR_FIELDS) {
      const versionedHash = deployed[`${prefix}${suffix}`];
      const activeStateHash = COMPATIBLE_STATE_VALIDATOR_FIELDS.has(field) ? deployed[suffix] : undefined;
      const deployedHash = activeStateHash ?? versionedHash;
      if (!deployedHash) continue;
      const hash = Core.Hash28ByteBase16(deployedHash.toLowerCase());
      mutable[field] = hash;
      const addressField = DEPLOYED_ADDRESS_FIELDS[field];
      if (addressField) {
        mutable[addressField] = addressFromCredentials(this.network, Core.Credential.fromCore({
          type: Core.CredentialType.ScriptHash,
          hash
        }));
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Version Seams
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Schemas for the v1_0-semantics signing/execute defaults. Throws for
   * versions that neither supplied {@link IV1SigningSchemas} nor overrode
   * the two consumers (`getSignedPayloadFromOrderInputs`,
   * `buildExecuteOrdersTx`).
   */
  get signing() {
    if (!this.signingSchemas) {
      throw new Error(`${this.version}: no signing schemas supplied — pass signingSchemas to the family constructor or override getSignedPayloadFromOrderInputs and buildExecuteOrdersTx`);
    }
    return this.signingSchemas;
  }

  /**
   * Project the version's settings onto the fields the shared tx-builders
   * read. v1_0/v1_0_rc1: the settings object itself; v1_1+: `settings.config`.
   */

  /**
   * Extract the validator registry (the fields the family reads) from the
   * version's settings.
   */

  /**
   * Build the vault datum used when bootstrapping the staking vault.
   * This is the ONLY place (together with `buildUpdatedVaultDatum`) that
   * knows the version's full vault-datum shape.
   */

  /**
   * Build the vault datum that replaces `previous` after an execution that
   * changes circulating sUSDr by `sUSDrDelta`. Versions with additional
   * vault fields decide here how each field carries over.
   */

  /**
   * Version hook: the USDr backing the stake/unstake exchange rate is
   * computed against. Defaults to the vault's full USDr balance (v1_0 /
   * v1_0_rc1 semantics). Versions with time-diffused yield (v1_1_rc1+)
   * override this to exclude the not-yet-diffused pending yield
   * (`settled_backing` in utilities.ak).
   */
  settledVaultBacking(_parsedVaultDatum, vaultUSDr) {
    return vaultUSDr;
  }

  /**
   * Version hook: constrain the transaction validity interval on order
   * executions. Called once at the end of `buildExecuteOrdersTx`, right
   * before the builder is returned.
   *
   * No-op by default: v1_0 / v1_0_rc1 executions carry no validity
   * constraints. Versions with time-diffused yield (v1_1_rc1+) override this
   * to attach validFrom/validTo bounds on vault-touching executions.
   */
  async applyExecutionValidityBounds(_tx, _context) {
    // no-op by default
  }

  /**
   * Version hook: build the `Deposit` protocol action that goes into the
   * COSE-signed payload. v1_0 / v1_0_rc1 have no yield split — the validator
   * recomputes it from live state — so they take no `alpha` and reject one.
   * Versions that carry a signed `alpha` (v1_1_rc1+) override this and require
   * it: it is the batch's parameter, never something a signer derives.
   */
  async buildDepositAction(requests, alpha) {
    if (alpha) {
      throw new Error(`${this.version}: a deposit batch takes no yield-split alpha (the validator recomputes the split from live state)`);
    }
    return {
      Deposit: {
        requests
      }
    };
  }

  /**
   * Version hook: split a deposit's total yield between the staked vault and
   * the unstaked pot at EXECUTION time.
   *
   * v1_0 / v1_0_rc1 (default): the on-chain validator recomputes the split from
   * live vault/treasury state, so recomputing it here from the same state
   * matches. v1_1_rc1+ carry a COSE-signed `alpha` in the Deposit action and
   * the validator splits against THAT — so those versions override this to echo
   * the signed alpha, never a second live read (which would diverge if state
   * moved between signing and execution). `action` is the signed action being
   * executed; the default ignores it.
   */
  resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, _action) {
    return calculateYieldShares(totalYield, vaultUSDr, treasuryCirculating);
  }

  /**
   * Version hook: serialize the redeemer attached to the orchestrator
   * withdrawal. Defaults to the bare `SignedRedeemer<ExtraProtocolRedeemerV1>`
   * (v1_0 / v1_0_rc1). Versions whose orchestrator wraps execution in a
   * top-level dispatch enum (v1_1_rc1+: `ExecuteOrders(...)`/`PublishYieldOracle`)
   * override this to nest the signed redeemer inside that wrapper.
   */
  serializeOrchestratorWithdrawalRedeemer(redeemer) {
    return Data.serialize(this.signing.SignedRedeemer_ExtraProtocolRedeemerV1, redeemer);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Treasury Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the treasury NFT.
   */
  async mintTreasuryNFT(treasuryBootstrapUtxo, initialDatum = {
    circulating_supply: 0n
  }) {
    const treasuryPolicyId = Core.PolicyId(this.treasuryScriptHash);
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    const datum = Data.serialize(V0_1TreasuryDatum, initialDatum);
    const tx = await this.blaze.newTransaction().addInput(treasuryBootstrapUtxo).addMint(treasuryPolicyId, new Map([[treasuryAssetName, 1n]]), Data.Void()).lockAssets(this.treasuryAddress, makeValue(10000000n, [this.treasuryNFTAssetId, 1n]), datum).provideScript(this.treasuryScript);
    return {
      tx,
      nftAssetId: this.treasuryNFTAssetId
    };
  }
  async deployTreasury() {
    return deployScript(this.blaze, this.treasuryScript, this.scriptDeploymentAddress);
  }
  async deployOrderContract() {
    return deployScript(this.blaze, this.orderScript, this.scriptDeploymentAddress);
  }
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
  // Staking Vault Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the staking vault NFT and create initial vault UTxO.
   */
  async mintStakingVaultNFT(stakingVaultBootstrapUtxo, initialDatum) {
    const vaultPolicyId = Core.PolicyId(this.stakingVaultScriptHash);
    const vaultAssetName = Core.AssetName(toHex(Buffer.from("staking_vault")));
    const datum = Data.serialize(this.schemas.VaultDatumV1, initialDatum ?? this.buildInitialVaultDatum());
    const tx = await this.blaze.newTransaction().addInput(stakingVaultBootstrapUtxo).addMint(vaultPolicyId, new Map([[vaultAssetName, 1n]]), Data.Void()).lockAssets(this.stakingVaultAddress, makeValue(10000000n, [this.stakingVaultNFTAssetId, 1n]), datum).provideScript(this.stakingVaultScript);
    return {
      tx,
      nftAssetId: this.stakingVaultNFTAssetId
    };
  }
  async deployStakingVault() {
    return deployScript(this.blaze, this.stakingVaultScript, this.scriptDeploymentAddress);
  }

  /**
   * Deploy the protocol mint script as a reference script (V1.0 only).
   */
  async deployProtocolMint() {
    return deployScript(this.blaze, this.protocolMintScript, this.scriptDeploymentAddress);
  }

  /**
   * Deploy the protocol stake script as a reference script (V1.0 only).
   */
  async deployProtocolStake() {
    return deployScript(this.blaze, this.protocolStakeScript, this.scriptDeploymentAddress);
  }

  /**
   * Deploy the protocol management script as a reference script (V1.0 only).
   */
  async deployProtocolManagement() {
    return deployScript(this.blaze, this.protocolManagementScript, this.scriptDeploymentAddress);
  }

  /**
   * Register the protocol mint stake credential (V1.0 sub-validator).
   */
  registerProtocolMintStake() {
    const stakeCredential = credentialFromScript(this.protocolMintScript);
    return this.blaze.newTransaction().addRegisterStake(stakeCredential);
  }

  /**
   * Register the protocol stake stake credential (V1.0 sub-validator).
   */
  registerProtocolStakeStake() {
    const stakeCredential = credentialFromScript(this.protocolStakeScript);
    return this.blaze.newTransaction().addRegisterStake(stakeCredential);
  }

  /**
   * Register the protocol management stake credential (V1.0 sub-validator).
   */
  registerProtocolManagementStake() {
    const stakeCredential = credentialFromScript(this.protocolManagementScript);
    return this.blaze.newTransaction().addRegisterStake(stakeCredential);
  }

  /**
   * Register the staking vault stake credential (for stake/unstake operations).
   */
  registerStakingVaultStake() {
    const stakeCredential = credentialFromScript(this.stakingVaultScript);
    return this.blaze.newTransaction().addRegisterStake(stakeCredential);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Batched bootstrap helpers (fast fresh-deploy path)
  //
  // The NFT mints CANNOT be batched: each one-shot mint validator runs
  // `mint_oneshots_strict`, which flattens the transaction's ENTIRE mint field
  // and fails unless it equals exactly that validator's single token. So a tx
  // minting more than one NFT fails phase-2 for all of them — the mints stay
  // one-tx-each. Deploys and stake registrations have no such constraint and
  // batch freely.
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Register all five protocol stake credentials (orchestrator + mint / stake /
   * management sub-validators + staking vault) in a SINGLE transaction.
   * Certificates are tiny, so there is no size constraint. Replaces five
   * `register*Stake` calls (and, for a cold wallet, five sign/submit cycles).
   */
  registerAllStakes() {
    return this.blaze.newTransaction().addRegisterStake(credentialFromScript(this.protocolScript)).addRegisterStake(credentialFromScript(this.protocolMintScript)).addRegisterStake(credentialFromScript(this.protocolStakeScript)).addRegisterStake(credentialFromScript(this.protocolManagementScript)).addRegisterStake(credentialFromScript(this.stakingVaultScript));
  }

  /**
   * Pack the eight protocol reference-script deployments into as few
   * transactions as fit under `budgetBytes` of script payload each, returning
   * one TxBuilder per batch in deploy order.
   *
   * Batches by measured script size (`script.toCbor()` bytes) rather than a
   * fixed count, because the validators are wildly uneven (~0.5–11 KB) and two
   * of the ~10 KB sub-validators cannot share a transaction. The default budget
   * (13 000) leaves headroom under the 16 384-byte tx limit for tx overhead and
   * future script growth; callers can lower it if a validator grows.
   *
   * Fresh-deploy only: it does NOT skip already-deployed scripts. To resume a
   * partial deploy, use the granular `deploy*` methods (which throw
   * `ScriptAlreadyDeployedError` for idempotent reruns).
   */
  deployScriptsBatched(budgetBytes = 13_000) {
    const scripts = [this.treasuryScript, this.protocolScript, this.protocolMintScript, this.protocolStakeScript, this.protocolManagementScript, this.mintProxyScript, this.orderScript, this.stakingVaultScript];
    const batches = [];
    let current = [];
    let currentBytes = 0;
    for (const script of scripts) {
      const size = script.toCbor().length / 2;
      if (current.length > 0 && currentBytes + size > budgetBytes) {
        batches.push(current);
        current = [];
        currentBytes = 0;
      }
      current.push(script);
      currentBytes += size;
    }
    if (current.length > 0) batches.push(current);
    return batches.map(batch => {
      let tx = this.blaze.newTransaction();
      for (const script of batch) {
        tx = tx.deployScript(script, this.scriptDeploymentAddress);
      }
      return tx;
    });
  }

  /** The sUSDr asset ID (stablecoin policy + staked-USDr asset name). */
  getSusdrAssetId() {
    return Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
  }
  async getVaultDatum() {
    const {
      utxo: vaultUtxo,
      datum: vaultDatum,
      parsedDatum: parsedVaultDatum
    } = await getDatumFromNFT(this.blaze, this.stakingVaultNFTAssetId, this.schemas.VaultDatumV1);
    if (!vaultUtxo) {
      throw new Error("No UTXO found with the staking vault NFT");
    }
    if (!vaultDatum) {
      throw new Error("No vault datum found");
    }
    return {
      vaultUtxo,
      vaultDatum,
      parsedVaultDatum: parsedVaultDatum
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // One-Shot Operations
  // ─────────────────────────────────────────────────────────────────────────────

  async mintOneShot(receiverAddress, datum) {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(this.schemas.ProxyDatumV1, {
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
  async updateOneShotDatum(receiverAddress, newDatum) {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(Core.AssetId(this.oneShotPolicyId));
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }
    const serializedDatum = Data.serialize(this.schemas.ProxyDatumV1, {
      logic: newDatum.logic,
      settings: newDatum.settings
    });
    return lockOrPayAssets(this.blaze.newTransaction().addInput(oneshotUtxo), receiverAddress, makeValue(10000000n, [this.oneShotPolicyId, 1n]), serializedDatum);
  }
  async getParsedProxyDatum() {
    if (this.cachedProxyDatumResult) {
      return this.cachedProxyDatumResult;
    }
    const {
      proxyUtxo,
      proxyDatum
    } = await this.getRawProxyDatum();
    const parsedProxyDatum = parse(this.schemas.ProxyDatumV1, proxyDatum);
    const result = {
      proxyUtxo,
      proxyDatum,
      parsedProxyDatum
    };
    this.cachedProxyDatumResult = result;
    return result;
  }

  /**
   * Check if the protocol has been upgraded past this SDK version.
   *
   * Returns true if either:
   * - The order script hash no longer matches registry.order (order validator upgraded)
   * - The protocol logic no longer matches this SDK's protocol script hash (protocol upgraded)
   *
   * When this returns true, orders created with this SDK version can use the
   * `Invalidated` redeemer to recover funds via `buildInvalidatedOrdersTx`.
   */
  async isProtocolUpgraded() {
    const {
      parsedProxyDatum
    } = await this.getParsedProxyDatum();
    const registry = this.settingsRegistry(parsedProxyDatum.settings);
    const orderUpgraded = registry.order !== this.orderScriptHash;
    const protocolUpgraded = parsedProxyDatum.logic !== this.protocolScriptHash;
    return orderUpgraded || protocolUpgraded;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Order-Scan / Settings Accessors
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Read the version-agnostic settings config (`reserve_assets`,
   * `unstaked_yield_pot`) off the live proxy datum. Public accessor over the
   * `settingsConfig` / `getVersionSettings` seam so consumers read the shared
   * fields without casting a version-specific settings shape: v1_0 / v1_0_rc1
   * project the flat settings, v1_1+ project `settings.config`.
   */
  async getSettingsConfig() {
    return this.settingsConfig(await this.getVersionSettings());
  }

  /**
   * Whether the batch covering these orders needs a yield-split alpha, i.e. it is
   * a deposit on a version that splits yield. Callers that both create and sign a
   * batch use it to decide whether to pick one (computeDepositAlpha); a co-signer
   * has no use for it — it reads the batch's stored alpha either way.
   */
  async batchNeedsAlpha(orderInputs) {
    if (orderInputs.length === 0) {
      return false;
    }
    const [utxo] = await this.blaze.provider.resolveUnspentOutputs([orderInputs[0]]);
    return this.classifyOrderUtxo(utxo).action.actionType === "deposit" && this.splitsYield;
  }

  /**
   * Whether this version's Deposit action carries a signed yield split. False for
   * v1_0 / v1_0_rc1, whose validator recomputes the split from live state;
   * v1_1_rc1+ override it.
   */
  get splitsYield() {
    return false;
  }

  /**
   * Decode and classify a single open order UTxO with this version's schema.
   *
   * Parses the UTxO's inline datum via `this.schemas.OrderDatumV1` — exactly
   * the way {@link parseOrderInfos} does — then classifies the action. Unlike
   * {@link parseOrders}, this imposes NO same-action-type constraint, so it is
   * the per-UTxO primitive for scanning a MIXED batch of open orders at the
   * order script address and handling each by its action type.
   *
   * @throws if the UTxO carries no inline datum, or the datum fails to decode
   *   under this version's order schema (e.g. a V1.1 order read by a V1.0 SDK).
   */
  classifyOrderUtxo(utxo) {
    const datumData = utxo.output().datum()?.asInlineData();
    if (!datumData) {
      throw new Error("Order UTXO has no inline datum");
    }
    const datum = parse(this.schemas.OrderDatumV1, datumData);
    return {
      datum,
      action: this.classifyOrderAction(datum)
    };
  }

  /**
   * Decode a batch of order UTxOs into {@link IOrderInfo} objects, validating
   * they are ALL the same action type (throws on a mixed batch). Public
   * wrapper over {@link parseOrderInfos}; use it to prepare inputs for the
   * same-type execute builders. To scan a mixed batch, classify each UTxO
   * individually with {@link classifyOrderUtxo} instead.
   *
   * The optional `fees` map (keyed by `${txHash}#${outputIndex}`) stamps each
   * order with its locked fee in the action's output unit; missing entries
   * default to 0 (no fee retained).
   */
  parseOrders(orderUtxos, fees) {
    return this.parseOrderInfos(orderUtxos, fees);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Order Builder Methods (8 methods: 6 from V0_4 + DirectMint + DirectBurn)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Internal helper to build an order transaction.
   */
  async _buildOrderTx(params) {
    const owner = await this.resolveOrderOwner(params.owner);
    const serializedDatum = this.serializeOrderDatum(params.action, params.destination, owner, params.data);
    const tx = this.newOrderTransaction(params.extraLabels);
    tx.lockAssets(this.orderScriptAddress, params.valueToLock, serializedDatum);
    return tx;
  }

  /** Resolve the order owner exactly once for transaction and continuation builders. */
  async resolveOrderOwner(owner) {
    if (owner) return owner;
    return {
      Signature: {
        key_hash: (await this.blaze.wallet.getChangeAddress()).getProps().paymentPart.hash.toString()
      }
    };
  }

  /** Serialize an order datum through the live version instance's schema seam. */
  serializeOrderDatum(action, destination, owner, data) {
    const orderDatum = {
      action,
      owner,
      destination,
      data: data ?? Data.Void()
    };
    return Data.serialize(this.schemas.OrderDatumV1, orderDatum);
  }

  /**
   * Build a mint order: lock reserve tokens, request USDr minting.
   */
  async buildMintOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Mint amount must be positive");
    }
    const orderLovelace = params.orderLovelace ?? MIN_LOVELACE;
    if (orderLovelace < MIN_LOVELACE) {
      throw new Error("Mint order lovelace cannot be less than MIN_LOVELACE");
    }
    const reserveAssetId = Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]);
    // Convert USDr amount to reserve amount using ceiling division
    // to ensure enough reserve is locked for on-chain validation
    const settings = this.settingsConfig(await this.getVersionSettings());
    const ra = findReserveAsset(settings, params.reserveAsset);
    const reserveAmount = usdrToReserveCeil(params.amount, ra);
    // Mint is 1:1 reserve→USDR with no protocol fee in v1_0, so the user
    // receives exactly `amount`. Default the floor to `amount`; callers can
    // lower it if a future fee makes that too tight.
    const minReceived = params.minReceived ?? params.amount;
    assertPositiveMinReceived("Mint", minReceived);
    return this._buildOrderTx({
      action: {
        OMint: {
          amount: params.amount,
          min_received: minReceived,
          reserve_asset: params.reserveAsset
        }
      },
      valueToLock: makeValue(orderLovelace, [reserveAssetId, reserveAmount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  /**
   * Build a redeem (burn) order: lock USDr, request reserve token redemption.
   */
  async buildRedeemOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Redeem amount must be positive");
    }
    const settings = this.settingsConfig(await this.getVersionSettings());
    const ra = findReserveAsset(settings, params.reserveAsset);
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    // burn.ak caps delivery at usdr_to_reserve(amount, ra), so the default
    // floor must use the configured reserve multiplier rather than assume 1:1.
    const minReceived = params.minReceived ?? usdrToReserve(params.amount, ra);
    assertPositiveMinReceived("Redeem", minReceived);
    return this._buildOrderTx({
      action: {
        ORedeem: {
          amount: params.amount,
          min_received: minReceived,
          reserve_asset: params.reserveAsset
        }
      },
      valueToLock: makeValue(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  /**
   * Build a deposit order: lock reserve tokens, request treasury deposit.
   */
  async buildDepositOrderTx(params) {
    if (params.principal < 0n) {
      throw new Error("Deposit principal must be non-negative");
    }
    if (params.principal === 0n && params.yield === 0n) {
      throw new Error("Deposit must have non-zero principal or yield");
    }
    const settings = this.settingsConfig(await this.getVersionSettings());
    const ra = findReserveAsset(settings, params.reserveAsset);
    const reserveAssetId = Core.AssetId(params.reserveAsset[0] + params.reserveAsset[1]);
    let valueToLock;
    if (params.yield >= 0n) {
      // POSITIVE YIELD: need reserve backing for BOTH principal AND yield.
      // Contract validates: reserve_to_usdr(treasury_delta) >= principal + yield
      // So we must lock: usdrToReserveCeil(principal + yield) reserve tokens
      const totalUSDrBacking = params.principal + params.yield;
      if (totalUSDrBacking > 0n) {
        const reserveAmount = usdrToReserveCeil(totalUSDrBacking, ra);
        valueToLock = makeValue(MIN_LOVELACE, [reserveAssetId, reserveAmount]);
      } else {
        valueToLock = makeValue(MIN_LOVELACE);
      }
    } else {
      // NEGATIVE YIELD: lock principal (in reserve) + unstaked yield share (in USDr).
      // The staked share comes from the vault (validated on-chain via vault USDr change).
      const principalReserve = params.principal > 0n ? usdrToReserveCeil(params.principal, ra) : 0n;
      valueToLock = principalReserve > 0n ? makeValue(MIN_LOVELACE, [reserveAssetId, principalReserve]) : makeValue(MIN_LOVELACE);
      const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);

      // Fetch current state to calculate yield split
      const {
        parsedTreasuryDatum
      } = await this.getTreasuryDatum();
      const vaultUtxo = (await this.getVaultDatum()).vaultUtxo;
      const vaultValue = vaultUtxo.output().amount();
      const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
      const treasuryCirculating = parsedTreasuryDatum.circulating_supply;
      const {
        unstakedYieldShare
      } = calculateYieldShares(params.yield, vaultUSDr, treasuryCirculating);

      // Lock only the unstaked portion (negated since unstakedYieldShare is negative)
      if (unstakedYieldShare < 0n) {
        valueToLock = Value.merge(valueToLock, makeValue(0n, [stablecoinAssetId, -unstakedYieldShare]));
      }
    }
    return this._buildOrderTx({
      action: {
        ODeposit: {
          principal: params.principal,
          yield: params.yield,
          reserve_asset: params.reserveAsset
        }
      },
      valueToLock,
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  /**
   * Build a withdraw order: lock min ADA, request reserve token withdrawal.
   */
  async buildWithdrawOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Withdraw amount must be positive");
    }
    const settings = this.settingsConfig(await this.getVersionSettings());
    findReserveAsset(settings, params.reserveAsset);
    return this._buildOrderTx({
      action: {
        OWithdraw: {
          amount: params.amount,
          reserve_asset: params.reserveAsset
        }
      },
      valueToLock: makeValue(MIN_LOVELACE),
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  /**
   * Build a stake order: lock USDr, request sUSDr minting.
   */
  async buildStakeOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Stake amount must be positive");
    }
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    const minReceived = params.minReceived ?? (await this.computeStakeMinReceived(params.amount, params.slippageToleranceBps));
    assertPositiveMinReceived("Stake", minReceived);
    return this._buildOrderTx({
      action: {
        OStake: {
          amount: params.amount,
          min_received: minReceived
        }
      },
      valueToLock: makeValue(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  /**
   * Build a stake-order continuation from a completed swap's guaranteed USDr
   * output. The swap quote remains observable to the caller, while the SDK
   * owns the RealFi amount, exchange-rate quote, schema, and request address.
   */
  async buildStakeContinuation(params) {
    const amount = params.swap.minReceived.amount;
    if (amount <= 0n) {
      throw new Error("Swap minReceived amount must be positive");
    }
    const expectedSundaeAssetId = `${this.stablecoinPolicyId}.${this.assetNameHex}`;
    if (params.swap.minReceived.metadata.assetId !== expectedSundaeAssetId) {
      throw new Error(`Swap minReceived must be USDr (${expectedSundaeAssetId}), got ${params.swap.minReceived.metadata.assetId}`);
    }
    const minReceived = await this.computeStakeMinReceived(amount, params.slippageToleranceBps);
    assertPositiveMinReceived("Stake", minReceived);
    const owner = await this.resolveOrderOwner(params.owner);
    return {
      address: this.orderScriptAddress,
      datum: this.serializeOrderDatum({
        OStake: {
          amount,
          min_received: minReceived
        }
      }, params.destination, owner, params.data)
    };
  }
  async _buildUnstakeOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Unstake amount must be positive");
    }
    const forfeit = params.forfeit ?? 0n;
    if (forfeit < 0n) {
      throw new Error("Forfeit amount cannot be negative");
    }
    const sUSDrAssetId = Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
    const minReceived = params.minReceived ?? (await this.computeUnstakeMinReceived(params.amount, forfeit, params.slippageToleranceBps));
    // Also catches a full forfeit, where computeUnstakeMinReceived nets to 0:
    // unstake.ak's own comment defers that case to `min_received > 0`, i.e. the
    // batch-wide crash. Refuse to create the order instead.
    assertPositiveMinReceived("Unstake", minReceived);
    return this._buildOrderTx({
      action: {
        OUnstake: {
          amount: params.amount,
          min_received: minReceived,
          forfeit
        }
      },
      valueToLock: makeValue(MIN_LOVELACE, [sUSDrAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data,
      extraLabels: params.extraLabels
    });
  }

  /**
   * Build an unstake order: lock sUSDr, request USDr release.
   *
   * The destination is automatically set to a native script address that
   * enforces a timelock: AllOf { Signature(user), After(unlockSlot) }.
   * This means the released USDr can only be spent by the user after the
   * unlock time has passed.
   *
   * @param params.amount - Amount of sUSDr to unstake
   * @param params.destination - The user's actual destination (used to extract payment key hash)
   * @param params.unlockSlot - Slot number after which the user can spend the released USDr
   * @param params.forfeit - Optional amount of USDr to forfeit to yield pot (default: 0)
   * @param params.slippageToleranceBps - Optional min-received tolerance override in basis points
   */
  async buildUnstakeOrderTx(params) {
    const timelockDestination = buildTimelockDestination(params.destination, params.unlockSlot);
    const extraLabels = new Map([[UNSTAKE_METADATA_LABEL, buildUnstakeMetadatum(params.destination, params.unlockSlot)]]);
    return this._buildUnstakeOrderTx({
      amount: params.amount,
      destination: timelockDestination,
      forfeit: params.forfeit,
      minReceived: params.minReceived,
      slippageToleranceBps: params.slippageToleranceBps,
      owner: params.owner,
      data: params.data,
      extraLabels
    });
  }

  /**
   * Build a treasury-managed unstake order that wraps the destination in a
   * native timelock script controlled by the order owner.
   *
   * The destination is set to: AllOf { After(unlockSlot), owner }. This keeps
   * treasury multisig ownership on the released USDr while enforcing the same
   * unlock slot used by the retail unstake helper. The owner must be convertible
   * to a Cardano native script.
   */
  async buildTreasuryUnstakeOrderTx(params) {
    const nativeScript = buildMultisigTimelockNativeScript(params.owner, params.unlockSlot);
    const timelockDestination = {
      address: {
        payment_credential: {
          Script: [nativeScript.hash()]
        },
        stake_credential: params.destination.address.stake_credential
      },
      datum: "NoDatum"
    };

    // Attach the unstake metadata (label 55534472) exactly like the retail
    // path (buildUnstakeOrderTx). track-chain requires this label to index the
    // order; without it the confirmed unstake output is silently dropped
    // (WTB-1466). Mirror retail precisely: the metadatum is built from the
    // user-supplied destination (params.destination), not the derived timelock
    // destination, and carries the same unlock_time.
    const extraLabels = new Map([[UNSTAKE_METADATA_LABEL, buildUnstakeMetadatum(params.destination, params.unlockSlot)]]);
    const tx = await this._buildUnstakeOrderTx({
      amount: params.amount,
      destination: timelockDestination,
      forfeit: params.forfeit,
      minReceived: params.minReceived,
      slippageToleranceBps: params.slippageToleranceBps,
      owner: params.owner,
      data: params.data,
      extraLabels
    });
    return {
      tx,
      nativeScript
    };
  }

  /**
   * Compute the default `min_received` (output sUSDR floor) for a stake order
   * by reading the current staking-vault exchange rate and applying a
   * slippage tolerance buffer.
   *
   * Tolerance resolution: per-call > SDK-level (defaultSlippageToleranceBps)
   * > built-in 50bps (0.5%).
   *
   * Yield accrual moves `vault_usdr` up over time, so shares-per-USDR shrinks
   * between order placement and execution. The buffer protects the user from
   * receiving fewer shares than they expected at sign time.
   *
   * Bootstrap edge case: when the vault is empty (no USDR locked or no sUSDR
   * circulating), the rate is treated as 1:1 and the buffer is skipped.
   */
  async computeStakeMinReceived(amount, perCallToleranceBps) {
    const toleranceBps = this.resolveStakeSlippageToleranceBps(perCallToleranceBps);
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    const {
      vaultUtxo,
      parsedVaultDatum
    } = await this.getVaultDatum();
    const vaultUsdr = this.settledVaultBacking(parsedVaultDatum, vaultUtxo.output().amount().multiasset()?.get(stablecoinAssetId) ?? 0n);
    const circulatingSusdr = parsedVaultDatum.circulating_susdr;
    if (vaultUsdr === 0n || circulatingSusdr === 0n) {
      return amount;
    }
    const expected = amount * circulatingSusdr / vaultUsdr;
    return expected * (10000n - toleranceBps) / 10000n;
  }
  resolveStakeSlippageToleranceBps(perCallToleranceBps) {
    const toleranceBps = perCallToleranceBps ?? this.defaultSlippageToleranceBps ?? 50n;
    if (toleranceBps < 0n || toleranceBps > 10_000n) {
      throw new Error("Slippage tolerance must be between 0 and 10000 bps");
    }
    return toleranceBps;
  }

  /**
   * Compute the default `min_received` (output USDR floor) for an unstake
   * order by reading the current staking-vault exchange rate.
   *
   * `forfeit` is subtracted from the gross expected USDR, then a slippage
   * tolerance protects the order from quote/provider drift. Tolerance
   * resolution is per-call > SDK-level > built-in 50bps (0.5%).
   *
   * Bootstrap edge case: when the vault is empty, the rate is treated as 1:1.
   */
  async computeUnstakeMinReceived(amount, forfeit, perCallToleranceBps) {
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    const {
      vaultUtxo,
      parsedVaultDatum
    } = await this.getVaultDatum();
    const vaultUsdr = this.settledVaultBacking(parsedVaultDatum, vaultUtxo.output().amount().multiasset()?.get(stablecoinAssetId) ?? 0n);
    const circulatingSusdr = parsedVaultDatum.circulating_susdr;
    const expectedGross = vaultUsdr === 0n || circulatingSusdr === 0n ? amount : amount * vaultUsdr / circulatingSusdr;
    const expectedNet = expectedGross > forfeit ? expectedGross - forfeit : 0n;
    const toleranceBps = this.resolveStakeSlippageToleranceBps(perCallToleranceBps);
    return expectedNet * (10000n - toleranceBps) / 10000n;
  }

  /**
   * Build a direct mint order: mint USDr without reserve asset backing.
   * Used for fiat wire scenarios where reserve arrives off-chain.
   */
  async buildDirectMintOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Direct mint amount must be positive");
    }
    // DirectMint orders only need min ADA - no reserve tokens
    return this._buildOrderTx({
      action: {
        ODirectMint: {
          amount: params.amount
        }
      },
      valueToLock: makeValue(MIN_LOVELACE),
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }

  /**
   * Build a direct burn order: burn USDr without reserve asset redemption.
   * Used for fiat wire scenarios where reserve is sent off-chain.
   */
  async buildDirectBurnOrderTx(params) {
    if (params.amount <= 0n) {
      throw new Error("Direct burn amount must be positive");
    }
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    // DirectBurn orders must lock the USDr being burned
    return this._buildOrderTx({
      action: {
        ODirectBurn: {
          amount: params.amount
        }
      },
      valueToLock: makeValue(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Signed Payload and Signing
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build the V1_0 SignedPayload_ProtocolRedeemer from order inputs.
   * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
   * the blake2b_256 hash (for CIP-30 signing).
   *
   * `alpha` is the batch's yield split, required by versions whose Deposit
   * action carries one (v1_1_rc1+) and rejected everywhere else. It is a
   * parameter of the batch, chosen once by whoever created it and read back from
   * the backend by every co-signer: on-chain, all signatures of a batch are
   * checked against ONE payload hash, so a signer that derived its own value
   * would produce bytes nobody else can co-sign.
   */
  async getSignedPayloadFromOrderInputs(orderInputs, alpha) {
    if (orderInputs.length === 0) {
      throw new Error("At least one order input is required");
    }
    const sortedInputs = sortOrderInputs(orderInputs);
    const nonce = buildNonceFromUtxo(sortedInputs[0]);
    const resolvedUtxos = await this.blaze.provider.resolveUnspentOutputs(sortedInputs);
    let actionType = null;
    const exchangeRequests = [];
    const treasuryRequests = [];
    const stakeRequests = [];
    const directRequests = [];
    for (const utxo of resolvedUtxos) {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(this.schemas.OrderDatumV1, datumData);
      const origin = {
        transaction_id: utxo.input().transactionId().toString(),
        output_index: utxo.input().index()
      };
      const parsed = this.classifyOrderAction(datum);

      // WTB-1764: the validators check each request inside one zip_fold via
      // `expect validation(request)`, so a request that fails its predicate
      // crashes the WHOLE execution transaction — every valid order batched
      // alongside it dies too, with only an opaque "the validator crashed"
      // to go on. Refuse to package it, and say which order it was.
      const screened = await this.screenOrderForExecution(utxo, parsed);
      if (!screened.ok) {
        throw new Error(`Order ${origin.transaction_id}#${origin.output_index} cannot be executed: ` + `${screened.reason}. Every order batched with it would crash on-chain.`);
      }
      if (actionType === null) {
        actionType = parsed.actionType;
      } else if (actionType !== parsed.actionType) {
        throw new Error("Mixed order types in inputs. All orders must be of the same type.");
      }
      if (parsed.actionType === "mint" || parsed.actionType === "burn") {
        exchangeRequests.push({
          destination: datum.destination,
          amount: parsed.amount,
          min_received: parsed.minReceived ?? 0n,
          origin,
          reserve_asset: parsed.reserveAsset
        });
      } else if (parsed.actionType === "deposit" || parsed.actionType === "withdraw") {
        treasuryRequests.push(this.buildTreasuryRequest(datum, parsed, origin));
      } else if (parsed.actionType === "stake" || parsed.actionType === "unstake") {
        stakeRequests.push({
          destination: datum.destination,
          amount: parsed.amount,
          min_received: parsed.minReceived ?? 0n,
          origin,
          forfeit: parsed.forfeit ?? 0n
        });
      } else {
        directRequests.push({
          destination: datum.destination,
          amount: parsed.amount,
          origin
        });
      }
    }

    // Only a deposit splits yield. Silently dropping an alpha here would let a
    // caller believe it had parameterised a batch that ignores the value.
    if (alpha && actionType !== "deposit") {
      throw new Error(`a ${actionType} batch takes no yield-split alpha (only a deposit splits yield)`);
    }
    if (actionType === "deposit") {
      const batchVerdict = screenDepositBatch(treasuryRequests.map(request => ({
        actionType: "deposit",
        amount: request.amount,
        yield: request.yield
      })));
      if (!batchVerdict.ok) {
        throw new Error(`${batchVerdict.reason}. Every order batched with it would crash on-chain.`);
      }
    }
    let action;
    switch (actionType) {
      case "mint":
        action = {
          Mint: {
            requests: exchangeRequests
          }
        };
        break;
      case "burn":
        action = {
          Burn: {
            requests: exchangeRequests
          }
        };
        break;
      case "withdraw":
        action = {
          Withdraw: {
            requests: treasuryRequests
          }
        };
        break;
      case "deposit":
        action = await this.buildDepositAction(treasuryRequests, alpha);
        break;
      case "stake":
        action = {
          Stake: {
            requests: stakeRequests
          }
        };
        break;
      case "unstake":
        action = {
          Unstake: {
            requests: stakeRequests
          }
        };
        break;
      case "direct_mint":
        action = {
          DirectMint: {
            requests: directRequests
          }
        };
        break;
      case "direct_burn":
        action = {
          DirectBurn: {
            requests: directRequests
          }
        };
        break;
      default:
        throw new Error("No orders to process");
    }
    const payload = {
      action,
      nonce
    };
    const serialized = Data.serialize(this.signing.SignedPayload_ProtocolRedeemerV1, payload);
    const signedPayload = serialized.toCbor().toString();
    const payloadHash = blake2b_256(HexBlob(signedPayload));
    return {
      signedPayload,
      payloadHash
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Execute Orders
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a transaction to execute orders.
   *
   * Handles all 8 action types: mint, burn, deposit, withdraw, stake, unstake,
   * direct_mint, direct_burn.
   */
  async buildExecuteOrdersTx(params) {
    const {
      orderInputs,
      signedPayload: signedPayloadCbor,
      signatures,
      fees
    } = params;

    // Deserialize CBOR hex to object for internal use
    const signedPayload = parse(this.signing.SignedPayload_ProtocolRedeemerV1, PlutusData.fromCbor(HexBlob(signedPayloadCbor)));

    // 1. Sort and resolve order UTxOs
    const sortedOrderInputs = sortOrderInputs(orderInputs);
    const orderUtxos = await this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);

    // 2. Parse orders and validate same type. The fees map (if any) stamps
    // each IOrderInfo with the locked fee that buildXxxExecute will subtract.
    const orderInfos = this.parseOrderInfos(orderUtxos, fees);
    const actionType = orderInfos[0].actionType;

    // 3. Get protocol settings
    const {
      proxyUtxo,
      parsedProxyDatum
    } = await this.getParsedProxyDatum();
    const settings = this.settingsConfig(parsedProxyDatum.settings);

    // 4. Determine what we need
    const needsTreasury = ["mint", "burn", "withdraw", "deposit", "direct_mint", "direct_burn"].includes(actionType);
    const needsVault = ["stake", "unstake", "deposit"].includes(actionType);

    // 5. Get script reference inputs
    // V1.0 requires the orchestrator and the relevant sub-validator script
    const isMintAction = ["mint", "burn", "direct_mint", "direct_burn"].includes(actionType);
    const isStakeAction = ["stake", "unstake"].includes(actionType);
    const scriptHashesNeeded = {
      protocol: this.protocolScriptHash,
      order: this.orderScriptHash
    };
    if (isMintAction) {
      scriptHashesNeeded.protocolMint = this.protocolMintScriptHash;
    } else if (isStakeAction) {
      scriptHashesNeeded.protocolStake = this.protocolStakeScriptHash;
    } else {
      scriptHashesNeeded.protocolManagement = this.protocolManagementScriptHash;
    }
    if (needsTreasury) {
      scriptHashesNeeded.treasury = this.treasuryScriptHash;
    }
    if (needsVault) {
      scriptHashesNeeded.stakingVault = this.stakingVaultScriptHash;
    }
    const refInputs = await this.getScriptReferenceInputs(scriptHashesNeeded);

    // 6. Fetch treasury and vault if needed
    let treasuryUtxo;
    let parsedTreasuryDatum;
    if (needsTreasury) {
      const treasuryResult = await this.getTreasuryDatum();
      treasuryUtxo = treasuryResult.treasuryUtxo;
      parsedTreasuryDatum = treasuryResult.parsedTreasuryDatum;
    }
    let vaultUtxo;
    let parsedVaultDatum;
    if (needsVault) {
      const vaultResult = await this.getVaultDatum();
      vaultUtxo = vaultResult.vaultUtxo;
      parsedVaultDatum = vaultResult.parsedVaultDatum;
    }

    // 7. Gather wallet UTxOs so we can include them in index calculations.
    const walletUtxos = await this.blaze.wallet.getUnspentOutputs();
    const excludedInputIds = new Set();
    const utxoKey = inp => `${inp.transactionId().toString()}#${inp.index().toString()}`;
    // Exclude script inputs (order, treasury, vault)
    for (const orderInfo of orderInfos) {
      excludedInputIds.add(utxoKey(orderInfo.utxo.input()));
    }
    if (treasuryUtxo) {
      excludedInputIds.add(utxoKey(treasuryUtxo.input()));
    }
    if (vaultUtxo) {
      excludedInputIds.add(utxoKey(vaultUtxo.input()));
    }
    // Exclude reference inputs (must be disjoint from regular inputs)
    excludedInputIds.add(utxoKey(proxyUtxo.input()));
    for (const refUtxo of Object.values(refInputs)) {
      if (refUtxo) {
        excludedInputIds.add(utxoKey(refUtxo.input()));
      }
    }
    const feeUtxos = walletUtxos.filter(utxo => !excludedInputIds.has(utxoKey(utxo.input())));

    // 8. Compute input indices (ledger sorts inputs by txHash + outputIndex).
    const allInputRefs = orderInfos.map(o => o.utxo.input());
    if (treasuryUtxo) {
      allInputRefs.push(treasuryUtxo.input());
    }
    if (vaultUtxo) {
      allInputRefs.push(vaultUtxo.input());
    }
    for (const feeUtxo of feeUtxos) {
      allInputRefs.push(feeUtxo.input());
    }
    const sortedAllInputRefs = [...allInputRefs].sort((a, b) => {
      const txA = a.transactionId().toString();
      const txB = b.transactionId().toString();
      if (txA < txB) return -1;
      if (txA > txB) return 1;
      return Number(a.index()) - Number(b.index());
    });
    const findInputIdx = input => {
      const idx = sortedAllInputRefs.findIndex(r => r.transactionId().toString() === input.transactionId().toString() && r.index() === input.index());
      return BigInt(idx);
    };
    const treasuryInputIdx = treasuryUtxo ? findInputIdx(treasuryUtxo.input()) : 0n;
    const vaultInputIdx = vaultUtxo ? findInputIdx(vaultUtxo.input()) : undefined;

    // 8a. Correlate order inputs to signed request indices via origin fields.
    // When all orders are present this produces the same identity mapping as before.
    // When a subset is passed (partial execution), it maps each input to the
    // correct request index in the signed payload.
    const signedRequests = getRequestsFromAction(signedPayload.action);
    const originToRequestIdx = new Map();
    for (let i = 0; i < signedRequests.length; i++) {
      const o = signedRequests[i].origin;
      originToRequestIdx.set(`${o.transaction_id}#${o.output_index}`, i);
    }
    const inputToRequests = [];
    const requestToOutputs = [];
    for (let outputIdx = 0; outputIdx < orderInfos.length; outputIdx++) {
      const input = orderInfos[outputIdx].utxo.input();
      const key = `${input.transactionId()}#${input.index()}`;
      const requestIdx = originToRequestIdx.get(key);
      if (requestIdx === undefined) {
        throw new Error(`Order input ${key} not found in signed payload`);
      }
      inputToRequests.push(BigInt(requestIdx));
      requestToOutputs.push(BigInt(outputIdx));
    }

    // 9. Build outputs and compute output indices
    const numDestOutputs = orderInfos.length;

    // For deposit with positive yield, the yield pot output is inserted after destinations
    let numExtraOutputs = 0;
    if (actionType === "deposit") {
      const totalYield = orderInfos.reduce((sum, o) => sum + (o.yield ?? 0n), 0n);
      if (totalYield > 0n) {
        const vaultValue = vaultUtxo.output().amount();
        const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
        const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
        const treasuryCirculating = parsedTreasuryDatum.circulating_supply;
        // Use the signed split (rc1 echoes alpha; v1_0 recomputes) so pot-output
        // existence/indexing agrees with buildDepositExecute and the validator.
        const {
          unstakedYieldShare
        } = this.resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, signedPayload.action);
        if (unstakedYieldShare > 0n) {
          numExtraOutputs = 1;
        }
      }
    }

    // For unstake, add yield pot output if forfeit is non-zero.
    if (actionType === "unstake") {
      const totalForfeit = orderInfos.reduce((sum, o) => sum + (o.forfeit ?? 0n), 0n);
      if (totalForfeit > 0n) {
        numExtraOutputs = 1;
      }
    }
    const treasuryOutputIdx = needsTreasury ? BigInt(numDestOutputs + numExtraOutputs) : 0n;
    const vaultOutputIdx = needsVault ? BigInt(numDestOutputs + numExtraOutputs + (needsTreasury ? 1 : 0)) : undefined;

    // 10. Build ExtraProtocolRedeemer
    const extra = {
      request_to_outputs: requestToOutputs,
      input_to_requests: inputToRequests,
      treasury_input_idx: treasuryInputIdx,
      treasury_output_idx: treasuryOutputIdx,
      vault_input_idx: vaultInputIdx,
      vault_output_idx: vaultOutputIdx
    };

    // 11. Build SignedRedeemer (versions may wrap it in a dispatch enum)
    const serializedSignedRedeemer = this.serializeOrchestratorWithdrawalRedeemer({
      extra,
      payload: signedPayload,
      signatures
    });
    const executeRedeemer = Data.serialize(this.schemas.OrderRedeemerV1, "Execute");

    // 12. Build the transaction
    const tx = this.newOrderTransaction();

    // Add order inputs with Execute redeemer
    for (const orderInfo of orderInfos) {
      tx.addInput(orderInfo.utxo, executeRedeemer);
    }

    // Add wallet fee inputs explicitly
    for (const feeUtxo of feeUtxos) {
      tx.addInput(feeUtxo);
    }

    // Add reference inputs
    tx.addReferenceInput(refInputs.protocol);
    tx.addReferenceInput(refInputs.order);
    tx.addReferenceInput(proxyUtxo);
    // V1.0 sub-validator reference inputs
    if (refInputs.protocolMint) {
      tx.addReferenceInput(refInputs.protocolMint);
    }
    if (refInputs.protocolStake) {
      tx.addReferenceInput(refInputs.protocolStake);
    }
    if (refInputs.protocolManagement) {
      tx.addReferenceInput(refInputs.protocolManagement);
    }
    if (refInputs.treasury) {
      tx.addReferenceInput(refInputs.treasury);
    }
    if (refInputs.stakingVault) {
      tx.addReferenceInput(refInputs.stakingVault);
    }

    // Add orchestrator withdrawal with signed redeemer
    const orchestratorRewardAccount = Core.RewardAccount.fromCredential({
      type: Core.CredentialType.ScriptHash,
      hash: this.protocolScriptHash
    }, this.network);
    tx.addWithdrawal(orchestratorRewardAccount, 0n, serializedSignedRedeemer);

    // Determine which sub-validator to use based on action type
    const subValidatorHash = actionType === "mint" || actionType === "burn" || actionType === "direct_mint" || actionType === "direct_burn" ? this.protocolMintScriptHash : actionType === "stake" || actionType === "unstake" ? this.protocolStakeScriptHash : this.protocolManagementScriptHash; // deposit, withdraw

    // Add sub-validator withdrawal with void redeemer
    const subValidatorRewardAccount = Core.RewardAccount.fromCredential({
      type: Core.CredentialType.ScriptHash,
      hash: subValidatorHash
    }, this.network);
    const voidRedeemer = Data.Void();
    tx.addWithdrawal(subValidatorRewardAccount, 0n, voidRedeemer);

    // Build per-action-type outputs, minting, and state updates
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    const sUSDrAssetId = Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
    switch (actionType) {
      case "mint":
        this.buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
        break;
      case "burn":
        this.buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings);
        break;
      case "withdraw":
        this.buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings);
        break;
      case "deposit":
        this.buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings, signedPayload.action);
        break;
      case "stake":
        this.buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum);
        break;
      case "unstake":
        this.buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum, settings);
        break;
      case "direct_mint":
        this.buildDirectMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum);
        break;
      case "direct_burn":
        this.buildDirectBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum);
        break;
    }

    // Provide the mint proxy script for minting
    tx.provideScript(this.mintProxyScript);
    await this.applyExecutionValidityBounds(tx, {
      actionType,
      vaultUtxo,
      parsedVaultDatum
    });
    return tx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-Action Execute Builders
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint: reserve goes to treasury, USDr minted to destinations.
   *
   * The per-order fee (in USDr, locked at index time) is retained by the
   * treasury: the user receives `amount − fee` USDr while `amount` is still
   * minted, so the protocol pockets the difference via the treasury balance.
   */
  buildMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
    // The audited mint contract enforces `mint_amount == total_delivered`
    // and `circulating_supply` increases by `total_delivered` (cf.
    // utilities.ak::maintain_treasury_mint). So we mint and credit the
    // treasury for what users actually receive — `amount − fee` per order —
    // while the reserve consumed per request stays based on the full
    // signed `amount` (the user paid in reserve for the whole `amount`,
    // even though they receive less; the protocol keeps the spread in
    // reserve worth — this is the locked fee).
    const totalDelivered = orderInfos.reduce((sum, o) => sum + (o.amount - o.fee), 0n);

    // Destination outputs: send `amount − fee` USDr to each destination.
    for (const orderInfo of orderInfos) {
      const ra = findReserveAsset(settings, orderInfo.reserveAsset);
      const reserveAssetId = Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
      const reserveAmount = usdrToReserveCeil(orderInfo.amount, ra);
      const userAmount = orderInfo.amount - orderInfo.fee;
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[reserveAssetId, reserveAmount]], [[stablecoinAssetId, userAmount]]));
    }

    // Mint USDr — exactly what was delivered (contract invariant).
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalDelivered]]), Data.Void());

    // Reserve deltas: based on the full signed amounts (unchanged by fees).
    const reserveDeltas = computeReserveDeltas(orderInfos, settings);
    this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalDelivered);
  }

  /**
   * Burn: USDr burned, reserve sent to destinations.
   *
   * The audited contract decreases circulating_supply by the FULL signed
   * `amount` (the user burns the whole `amount` of USDr) and the reserve
   * outflow per asset equals what the user actually receives. The locked
   * fee (in reserve units) stays in the treasury — by paying out
   * `usdr_to_reserve(amount, ra) − fee` instead of the full natural
   * amount, the protocol pockets the difference.
   */
  buildBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, settings) {
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send `usdr_to_reserve(amount, ra) − fee` reserve
    // to each destination. Track the actually-delivered amount per reserve
    // asset so we can subtract the fee from the treasury reserve outflow.
    const deliveredByAsset = new Map();
    for (const orderInfo of orderInfos) {
      const ra = findReserveAsset(settings, orderInfo.reserveAsset);
      const reserveAssetId = Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
      const naturalReserve = usdrToReserve(-orderInfo.amount, ra);
      const reserveAmount = naturalReserve - orderInfo.fee;
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[stablecoinAssetId, -orderInfo.amount]], [[reserveAssetId, reserveAmount]]));
      const assetKey = orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1];
      deliveredByAsset.set(assetKey, (deliveredByAsset.get(assetKey) ?? 0n) + reserveAmount);
    }

    // Burn USDr — full signed amount per request (totalAmount is negative).
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

    // Reserve deltas: out by what we actually delivered (negated). The
    // protocol keeps the per-order fee inside the treasury balance.
    const reserveDeltas = new Map();
    for (const [assetKey, delivered] of deliveredByAsset.entries()) {
      reserveDeltas.set(assetKey, -delivered);
    }
    this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalAmount);
  }

  /**
   * Withdraw: reserve sent to destinations, no mint/burn.
   */
  buildWithdrawExecute(tx, orderInfos, treasuryUtxo, parsedTreasuryDatum, settings) {
    // Destination outputs: send reserve tokens to each destination
    for (const orderInfo of orderInfos) {
      const ra = findReserveAsset(settings, orderInfo.reserveAsset);
      const reserveAssetId = Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
      const reserveAmount = usdrToReserve(orderInfo.amount, ra);
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [], [[reserveAssetId, reserveAmount]]));
    }

    // Update treasury: reserve decreases, no circulating_supply change
    const reserveDeltas = computeReserveDeltas(orderInfos, settings, true);
    this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, 0n);
  }

  /**
   * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
   */
  buildDepositExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum, vaultUtxo, parsedVaultDatum, settings, action) {
    const totalYield = orderInfos.reduce((sum, o) => sum + (o.yield ?? 0n), 0n);

    // Calculate yield split. rc1 echoes the COSE-signed alpha; v1_0 recomputes
    // from live state. Must NOT re-derive independently from vault/treasury —
    // the validator checks the split against the signed action.
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const treasuryCirculating = parsedTreasuryDatum.circulating_supply;
    const {
      stakedYieldShare,
      unstakedYieldShare
    } = this.resolveDepositYieldShares(totalYield, vaultUSDr, treasuryCirculating, action);
    let remainingOrderUSDrToBurn = unstakedYieldShare < 0n ? -unstakedYieldShare : 0n;

    // Destination outputs: return any order surplus after protocol consumption.
    for (const orderInfo of orderInfos) {
      const reserveAssetId = Core.AssetId(orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1]);
      const ra = findReserveAsset(settings, orderInfo.reserveAsset);
      const yieldValue = orderInfo.yield ?? 0n;
      const usdrBacking = yieldValue >= 0n ? orderInfo.amount + yieldValue : orderInfo.amount;
      const reserveAmount = usdrToReserve(usdrBacking, ra);
      const consumedAssets = [[reserveAssetId, reserveAmount]];
      if (remainingOrderUSDrToBurn > 0n) {
        const orderUSDr = orderInfo.utxo.output().amount().multiasset()?.get(stablecoinAssetId) ?? 0n;
        const consumedUSDr = orderUSDr < remainingOrderUSDrToBurn ? orderUSDr : remainingOrderUSDrToBurn;
        if (consumedUSDr > 0n) {
          consumedAssets.push([stablecoinAssetId, consumedUSDr]);
          remainingOrderUSDrToBurn -= consumedUSDr;
        }
      }
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, consumedAssets));
    }
    if (totalYield > 0n) {
      tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
      if (unstakedYieldShare > 0n) {
        // The yield pot is a script address in production (WTB-1172), so
        // build the output directly with NoDatum.
        addDestinationOutput(tx, this.network, {
          address: settings.unstaked_yield_pot,
          datum: "NoDatum"
        }, makeValue(MIN_LOVELACE, [stablecoinAssetId, unstakedYieldShare]));
      }
    } else if (totalYield < 0n) {
      tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalYield]]), Data.Void());
    }

    // Update treasury
    const reserveDeltas = new Map();
    for (const orderInfo of orderInfos) {
      const assetId = orderInfo.reserveAsset[0] + orderInfo.reserveAsset[1];
      const ra = findReserveAsset(settings, orderInfo.reserveAsset);
      const yieldValue = orderInfo.yield ?? 0n;
      const usdrBacking = yieldValue >= 0n ? orderInfo.amount + yieldValue : orderInfo.amount;
      const reserveAmount = usdrToReserve(usdrBacking, ra);
      reserveDeltas.set(assetId, (reserveDeltas.get(assetId) ?? 0n) + reserveAmount);
    }
    this.updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, totalYield);

    // Update vault. Datum construction is delegated so versions with a
    // yield-diffusion window (v1_1_rc1) can set it from the batch's requests;
    // the v1_0 default just moves the vault USDr by the staked share.
    this.updateDepositVaultOutput(tx, vaultUtxo, parsedVaultDatum, {
      stakedYieldShare,
      totalYield,
      orderInfos
    });
  }

  /**
   * Version hook: lock the post-deposit vault output. v1_0 / v1_0_rc1 keep the
   * one-field datum and simply add `stakedYieldShare` USDr to the vault.
   * Versions with time-diffused yield override this to roll the staked share
   * into the diffusion window (`validate_deposit_diffusion` in deposit.ak).
   */
  updateDepositVaultOutput(tx, vaultUtxo, parsedVaultDatum, ctx) {
    this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, 0n, ctx.stakedYieldShare);
  }

  /**
   * Stake: USDr locked in vault, sUSDr minted to destinations.
   *
   * Stake is not fee-filtered (no protocol fee retained on stake), so the
   * vault receives the full `amount` USDr and mints sUSDr at the natural
   * rate.
   */
  buildStakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum) {
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    // Rate is quoted against settled backing (v1_0: full balance; v1_1_rc1:
    // balance minus not-yet-diffused pending yield).
    const settledBacking = this.settledVaultBacking(parsedVaultDatum, vaultUSDr);
    const circulatingSUSDr = parsedVaultDatum.circulating_susdr;
    let totalUSDrToVault = 0n;
    let totalSUSDrMinted = 0n;
    for (const orderInfo of orderInfos) {
      const usDrToVault = orderInfo.amount;
      totalUSDrToVault += usDrToVault;
      let sUSDrAmount;
      if (circulatingSUSDr === 0n || settledBacking === 0n) {
        // Bootstrap rate is 1:1 (cf. stake.ak).
        sUSDrAmount = usDrToVault;
      } else {
        sUSDrAmount = usDrToVault * circulatingSUSDr / settledBacking;
      }
      totalSUSDrMinted += sUSDrAmount;
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[stablecoinAssetId, usDrToVault]], [[sUSDrAssetId, sUSDrAmount]]));
    }
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.sUSDrAssetNameHex), totalSUSDrMinted]]), Data.Void());
    this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, totalSUSDrMinted, totalUSDrToVault);
  }

  /**
   * Unstake: sUSDr burned, USDr sent to user's destination address.
   * V1_0: Supports forfeit parameter - forfeited USDr goes to yield pot.
   */
  buildUnstakeExecute(tx, orderInfos, stablecoinAssetId, sUSDrAssetId, vaultUtxo, parsedVaultDatum, settings) {
    const totalSUSDrBurned = orderInfos.reduce((sum, o) => sum + o.amount, 0n);
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    // Entitlement is quoted against settled backing (v1_0: full balance;
    // v1_1_rc1: balance minus not-yet-diffused pending yield).
    const settledBacking = this.settledVaultBacking(parsedVaultDatum, vaultUSDr);
    const circulatingSUSDr = parsedVaultDatum.circulating_susdr;
    if (circulatingSUSDr === 0n) {
      throw new Error("Cannot unstake: no sUSDr in circulation");
    }

    // The user receives `entitled − forfeit` USDr. Forfeit goes to the
    // unstaked yield pot; the vault decreases by the full natural entitlement
    // for each order. (Unstake is not fee-filtered.)
    let totalUSDrLeavingVault = 0n;
    let totalForfeit = 0n;
    for (const orderInfo of orderInfos) {
      const uSDrEntitled = orderInfo.amount * settledBacking / circulatingSUSDr;
      const forfeit = orderInfo.forfeit ?? 0n;
      const uSDrAmount = uSDrEntitled - forfeit;
      totalUSDrLeavingVault += uSDrEntitled;
      totalForfeit += forfeit;
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[sUSDrAssetId, orderInfo.amount]], [[stablecoinAssetId, uSDrAmount]]));
    }

    // Send forfeited USDr to yield pot if any
    const totalYieldPot = totalForfeit;
    if (totalYieldPot > 0n) {
      // Script pot in production (WTB-1172) — see buildDepositExecute.
      addDestinationOutput(tx, this.network, {
        address: settings.unstaked_yield_pot,
        datum: "NoDatum"
      }, makeValue(MIN_LOVELACE, [stablecoinAssetId, totalYieldPot]));
    }
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.sUSDrAssetNameHex), -totalSUSDrBurned]]), Data.Void());
    this.updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, -totalSUSDrBurned, -totalUSDrLeavingVault);
  }

  /**
   * DirectMint: Mint USDr without reserve asset flow.
   * USDr is minted to destinations, treasury circulating_supply increases.
   * NO reserve asset changes.
   */
  buildDirectMintExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum) {
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send USDr to each destination
    for (const orderInfo of orderInfos) {
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [], [[stablecoinAssetId, orderInfo.amount]]));
    }

    // Mint USDr
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

    // Update treasury: circulating_supply increases, NO reserve changes
    this.updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, totalAmount);
  }

  /**
   * DirectBurn: Burn USDr without reserve asset flow.
   * USDr is burned, treasury circulating_supply decreases.
   * NO reserve asset changes, NO destination outputs (fiat sent off-chain).
   */
  buildDirectBurnExecute(tx, orderInfos, stablecoinAssetId, treasuryUtxo, parsedTreasuryDatum) {
    // totalAmount is negative for burns (from classifyOrderAction)
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Fiat is sent off-chain. On-chain, return the order value minus the
    // burned USDr to the destination.
    for (const orderInfo of orderInfos) {
      addDestinationOutput(tx, this.network, orderInfo.datum.destination, buildOrderDestinationValue(orderInfo, [[stablecoinAssetId, -orderInfo.amount]]));
    }

    // Burn USDr (totalAmount is negative)
    tx.addMint(this.stablecoinPolicyId, new Map([[Core.AssetName(this.assetNameHex), totalAmount]]), Data.Void());

    // Update treasury: circulating_supply decreases, NO reserve changes
    this.updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, totalAmount);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Cancel Orders
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a transaction to cancel orders.
   */
  async buildCancelOrdersTx(params) {
    const {
      orderInputs,
      destination,
      availableSigners,
      versionHint
    } = params;
    const orderUtxos = await this.blaze.provider.resolveUnspentOutputs(orderInputs);
    if (orderUtxos.length === 0) {
      throw new Error("No orders to cancel");
    }
    const cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
    const orderRefInputs = await resolveOrderReferenceInputs(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);
    const cancelRedeemer = Data.serialize(this.schemas.OrderRedeemerV1, "Cancel");
    const destAddress = destination ?? (await this.blaze.wallet.getChangeAddress());
    const tx = this.newOrderTransaction();
    for (const orderRefInput of orderRefInputs.values()) {
      tx.addReferenceInput(orderRefInput);
    }

    // cache current version of order script reference input
    const currentOrderRefInput = orderRefInputs.get(this.orderScriptHash);
    if (currentOrderRefInput && !this.cachedReferenceInputs.orderRefInput) {
      this.cachedReferenceInputs.orderRefInput = currentOrderRefInput;
    }
    const requiredSigners = new Set();
    for (const utxo of orderUtxos) {
      const owner = await parseCancelOwner(utxo, versionHint);
      for (const keyHash of getSignatureKeyHashesFromMultisigScript(owner)) {
        requiredSigners.add(keyHash);
      }
      tx.addInput(utxo, cancelRedeemer);
      const outputValue = utxo.output().amount();
      addDirectOutput(tx, destAddress, outputValue);
    }
    const effectiveSigners = availableSigners ? new Set([...requiredSigners].filter(k => availableSigners.has(k))) : requiredSigners;
    for (const keyHash of effectiveSigners) {
      tx.addRequiredSigner(Ed25519KeyHashHex(keyHash));
    }
    return tx;
  }

  /**
   * Build a transaction to recover funds from invalidated orders.
   * Only works when the protocol has been upgraded and the order validator
   * no longer matches the current protocol logic.
   *
   * IMPORTANT: Only works for orders with simple Signature owners.
   *
   * Output-at-same-index constraint: Each output must be at the same
   * transaction index as its corresponding input.
   */
  async buildInvalidatedOrdersTx(params) {
    const {
      orderInputs
    } = params;
    const orderUtxos = await this.blaze.provider.resolveUnspentOutputs(orderInputs);
    if (orderUtxos.length === 0) {
      throw new Error("No orders to invalidate");
    }

    // Resolve references from the validators that actually hold the supplied
    // orders. A current SDK instance may be recovering same-schema orders left
    // at a superseded validator, so its own orderScriptHash is not necessarily
    // the script needed to spend these inputs.
    const cachedOrderRefs = this.cachedReferenceInputs.orderRefInput ? new Map([[this.orderScriptHash, this.cachedReferenceInputs.orderRefInput]]) : undefined;
    const orderRefInputs = await resolveOrderReferenceInputs(this.blaze, orderUtxos, cachedOrderRefs, this.scriptDeploymentAddress);

    // The proxy UTxO is always required as a reference input. If the live
    // proxy datum no longer matches this SDK's schema, skip the client-side
    // upgrade check and rely on the validator's on-chain check instead.
    const {
      proxyUtxo,
      proxyDatum
    } = await this.getRawProxyDatum();
    try {
      const parsedProxyDatum = parse(this.schemas.ProxyDatumV1, proxyDatum);
      const registry = this.settingsRegistry(parsedProxyDatum.settings);
      const isProtocolUpgraded = parsedProxyDatum.logic !== this.protocolScriptHash;
      const hasActiveOrder = [...orderRefInputs.keys()].some(orderScriptHash => orderScriptHash === registry.order);
      if (hasActiveOrder && !isProtocolUpgraded) {
        throw new Error("Cannot use Invalidated redeemer: protocol has not been upgraded");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Cannot use Invalidated redeemer: protocol has not been upgraded") {
        throw err;
      }
    }
    const invalidatedRedeemer = Data.serialize(this.schemas.OrderRedeemerV1, "Invalidated");

    // The order validator's Invalidated branch enforces
    // `outputs[index_of(self_input)] == owner_address`. The input index
    // is computed against the *full* canonical input sort, including any
    // wallet fee inputs. To make the alignment deterministic, pre-select
    // a single wallet UTxO to act as the fee input, build the canonical
    // sort across [orders + fee UTxO] up front, and lay outputs at
    // matching positions: owner payouts at order indices, a wallet
    // filler at the fee UTxO's index. Modeled on buildExecuteOrdersTx.
    const walletUtxos = await this.blaze.wallet.getUnspentOutputs();
    const walletAddress = await this.blaze.wallet.getChangeAddress();
    const utxoKey = inp => `${inp.transactionId().toString()}#${inp.index().toString()}`;
    const excludedInputIds = new Set([utxoKey(proxyUtxo.input()), ...[...orderRefInputs.values()].map(refInput => utxoKey(refInput.input())), ...orderUtxos.map(u => utxoKey(u.input()))]);
    // 5 ADA buffer comfortably covers tx fees for any realistic invalidate
    // batch (1-20 inputs) plus min-UTxO for the change output Blaze appends.
    // Prefer an ADA-only input, but safely support a token-bearing one when
    // its explicit filler output still satisfies the ledger's min-ADA rule.
    const FEE_BUFFER = 5_000_000n;
    const feeCandidates = walletUtxos.filter(u => !excludedInputIds.has(utxoKey(u.input()))).sort((a, b) => {
      const aHasAssets = (a.output().amount().multiasset()?.size ?? 0) > 0;
      const bHasAssets = (b.output().amount().multiasset()?.size ?? 0) > 0;
      return Number(aHasAssets) - Number(bHasAssets);
    });
    const feeUtxo = feeCandidates.find(u => {
      const inputValue = u.output().amount();
      if (inputValue.coin() < FEE_BUFFER) return false;
      const fillerValue = new Core.Value(inputValue.coin() - FEE_BUFFER, inputValue.multiasset());
      const fillerOutput = new Core.TransactionOutput(walletAddress, fillerValue);
      return fillerValue.coin() >= calculateMinAda(fillerOutput, this.blaze.params.coinsPerUtxoByte);
    });
    if (!feeUtxo) {
      throw new Error("buildInvalidatedOrdersTx: no wallet UTxO can cover fees while retaining its minimum ADA");
    }
    const items = orderUtxos.map(utxo => {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(this.schemas.OrderDatumV1, datumData);
      if (!("Signature" in datum.owner)) {
        throw new Error("Invalidated redeemer only supports simple Signature owners");
      }
      return {
        kind: "order",
        utxo,
        ownerKeyHash: datum.owner.Signature.key_hash
      };
    });
    items.push({
      kind: "fee",
      utxo: feeUtxo
    });
    items.sort((a, b) => {
      const txA = a.utxo.input().transactionId().toString();
      const txB = b.utxo.input().transactionId().toString();
      if (txA < txB) return -1;
      if (txA > txB) return 1;
      return Number(a.utxo.input().index()) - Number(b.utxo.input().index());
    });
    const tx = this.newOrderTransaction();
    for (const orderRefInput of orderRefInputs.values()) {
      tx.addReferenceInput(orderRefInput);
    }
    tx.addReferenceInput(proxyUtxo);
    for (const item of items) {
      if (item.kind === "order") {
        const ownerCredential = Core.Credential.fromCore({
          type: Core.CredentialType.KeyHash,
          hash: Core.Hash28ByteBase16(item.ownerKeyHash)
        });
        const ownerAddress = addressFromCredentials(this.network, ownerCredential);
        tx.addInput(item.utxo, invalidatedRedeemer);
        // Owner gets back the order's full value at the matching output
        // index. Per-input check `output_ada >= input_ada - tx.fee` holds
        // trivially because output == input here; the tx fee is absorbed
        // by the filler+change pair coming out of the wallet fee input.
        addDirectOutput(tx, ownerAddress, item.utxo.output().amount());
      } else {
        tx.addInput(item.utxo);
        // Wallet filler at the fee UTxO's canonical index. Sends value
        // back to the wallet minus FEE_BUFFER, which Blaze then splits
        // into the tx fee and an automatic change output (appended after
        // all explicit outputs, beyond any script-input index — so no
        // validator ever reads it).
        const inputValue = item.utxo.output().amount();
        const fillerValue = new Core.Value(inputValue.coin() - FEE_BUFFER, inputValue.multiasset());
        addDirectOutput(tx, walletAddress, fillerValue);
      }
    }
    return tx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Protected Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Parse order UTxOs into IOrderInfo objects and validate they are all the
   * same type. The optional `fees` map (keyed by `${txHash}#${outputIndex}`)
   * stamps each order with its locked fee in the action's output unit.
   * Missing entries default to 0 (no fee retained).
   */
  parseOrderInfos(orderUtxos, fees) {
    const orderInfos = [];
    let expectedActionType = null;
    for (const utxo of orderUtxos) {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(this.schemas.OrderDatumV1, datumData);
      const classified = this.classifyOrderAction(datum);
      if (expectedActionType === null) {
        expectedActionType = classified.actionType;
      } else if (expectedActionType !== classified.actionType) {
        throw new Error("Mixed order types in inputs. All orders must be of the same type.");
      }
      const input = utxo.input();
      const key = `${input.transactionId().toString()}#${input.index().toString()}`;
      const fee = fees?.get(key) ?? 0n;
      orderInfos.push({
        utxo,
        datum,
        actionType: classified.actionType,
        amount: classified.amount,
        yield: classified.yield,
        forfeit: classified.forfeit,
        minReceived: classified.minReceived,
        reserveAsset: classified.reserveAsset,
        fee
      });
    }
    if (orderInfos.length === 0) {
      throw new Error("No orders to execute");
    }
    return orderInfos;
  }

  /**
   * Full executability screen for one open order (WTB-1764): the datum
   * predicates plus the two value-dependent aborts (input funding, unsatisfiable
   * `min_received`). Every consumer that decides whether an order may join a
   * batch should call this rather than `screenOrderAction` alone — the datum-only
   * screen cannot see an underfunded UTxO, which is the cheapest batch-killer.
   *
   * Reads settings for the reserve multiplier on mint/burn. `getParsedProxyDatum`
   * memoises, so the per-order cost after the first call is local arithmetic —
   * safe for the approvals cron's whole-address sweep.
   */
  async screenOrderForExecution(utxo, action) {
    const datumVerdict = screenOrderAction(action);
    if (!datumVerdict.ok) {
      return datumVerdict;
    }
    const settings = await this.getValidatedScreeningSettings();
    return screenOrderUtxoFacts(action, await this.deriveOrderUtxoFacts(utxo, action, settings));
  }

  /**
   * Derive the value-dependent facts {@link screenOrderUtxoFacts} needs. Mirrors
   * the per-action consumed asset and ceiling the validators use; see that
   * function's doc comment for the `.ak` line references.
   */
  async deriveOrderUtxoFacts(utxo, action, settings) {
    const multiasset = utxo.output().amount().multiasset();
    const quantityOf = assetId => multiasset?.get(assetId) ?? 0n;
    // These are deployment settings, not datum fields. Let invalid trusted
    // configuration and provider failures propagate to the caller instead of
    // hiding an operational outage as a poisoned order.
    const usdrAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);

    // Only deterministic datum-derived errors are a rejection: an unknown
    // reserve asset or an invalid asset id carried by the order datum.
    try {
      return this.deriveOrderUtxoFactsUnsafe(action, settings, quantityOf, usdrAssetId);
    } catch (error) {
      return {
        consumedRequired: 0n,
        consumedLocked: 0n,
        unresolvable: error instanceof Error ? error.message : String(error)
      };
    }
  }
  deriveOrderUtxoFactsUnsafe(action, settings, quantityOf, usdrAssetId) {
    switch (action.actionType) {
      case "stake":
        return {
          consumedRequired: action.amount,
          consumedLocked: quantityOf(usdrAssetId)
        };
      case "unstake":
        return {
          consumedRequired: action.amount,
          consumedLocked: quantityOf(Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex))
        };
      case "mint":
        {
          if (!action.reserveAsset) {
            return {
              consumedRequired: 0n,
              consumedLocked: 0n
            };
          }
          const ra = findReserveAsset(settings, action.reserveAsset);
          return {
            consumedRequired: usdrToReserveCeil(action.amount, ra),
            consumedLocked: quantityOf(Core.AssetId(action.reserveAsset[0] + action.reserveAsset[1])),
            // mint.ak:140 passes request.amount as max_delivered.
            maxDelivered: action.amount
          };
        }
      case "burn":
        {
          // classifyOrderAction negates ORedeem.amount; the validator compares the
          // raw datum amount against the locked USDr.
          const rawAmount = -action.amount;
          if (!action.reserveAsset) {
            return {
              consumedRequired: rawAmount,
              consumedLocked: quantityOf(usdrAssetId)
            };
          }
          const ra = findReserveAsset(settings, action.reserveAsset);
          return {
            consumedRequired: rawAmount,
            consumedLocked: quantityOf(usdrAssetId),
            // burn.ak:136 passes usdr_to_reserve(|amount|, ra) as max_delivered.
            maxDelivered: usdrToReserve(rawAmount, ra)
          };
        }
      case "direct_burn":
        // direct_burn DOES have a per-order funding predicate
        // (`v1_0/direct_burn.ak:50`), unlike direct_mint. Same sign flip as burn.
        // Unreachable from the approvals cron, which routes direct actions
        // out-of-scope, but getSignedPayloadFromOrderInputs builds direct-burn
        // batches for the treasury-admin flow.
        return {
          consumedRequired: -action.amount,
          consumedLocked: quantityOf(usdrAssetId)
        };
      case "deposit":
        {
          if (!action.reserveAsset) {
            return {
              consumedRequired: 0n,
              consumedLocked: 0n
            };
          }
          const ra = findReserveAsset(settings, action.reserveAsset);
          const usdrBacking = (action.yield ?? 0n) >= 0n ? action.amount + (action.yield ?? 0n) : action.amount;
          return {
            consumedRequired: usdrToReserve(usdrBacking, ra),
            consumedLocked: quantityOf(Core.AssetId(action.reserveAsset[0] + action.reserveAsset[1]))
          };
        }
      case "withdraw":
        if (action.reserveAsset) {
          // Withdrawal consumes treasury funds, but the order's asset must be
          // registered or buildWithdrawExecute will fail after signing.
          findReserveAsset(settings, action.reserveAsset);
        }
        return {
          consumedRequired: 0n,
          consumedLocked: 0n
        };
      default:
        // direct_mint has no per-order funding predicate.
        return {
          consumedRequired: 0n,
          consumedLocked: 0n
        };
    }
  }
  async getValidatedScreeningSettings() {
    const settings = this.settingsConfig(await this.getVersionSettings());
    for (const reserveAsset of settings.reserve_assets) {
      if (reserveAsset.numerator === 0n) {
        throw new Error("Reserve asset numerator must be non-zero");
      }
      if (reserveAsset.denominator === 0n) {
        throw new Error("Reserve asset denominator must be non-zero");
      }
      Core.AssetId(reserveAsset.asset[0] + reserveAsset.asset[1]);
    }
    return settings;
  }

  /**
   * Classify an order action from its datum.
   */
  classifyOrderAction(datum) {
    const action = datum.action;
    if ("OMint" in action) {
      return {
        actionType: "mint",
        amount: action.OMint.amount,
        minReceived: action.OMint.min_received,
        reserveAsset: action.OMint.reserve_asset,
        isTreasuryAction: true
      };
    } else if ("ORedeem" in action) {
      return {
        actionType: "burn",
        amount: -action.ORedeem.amount,
        minReceived: action.ORedeem.min_received,
        reserveAsset: action.ORedeem.reserve_asset,
        isTreasuryAction: true
      };
    } else if ("ODeposit" in action) {
      return {
        actionType: "deposit",
        amount: action.ODeposit.principal,
        yield: action.ODeposit.yield,
        reserveAsset: action.ODeposit.reserve_asset,
        isTreasuryAction: true
      };
    } else if ("OWithdraw" in action) {
      return {
        actionType: "withdraw",
        amount: action.OWithdraw.amount,
        reserveAsset: action.OWithdraw.reserve_asset,
        isTreasuryAction: true
      };
    } else if ("OStake" in action) {
      return {
        actionType: "stake",
        amount: action.OStake.amount,
        minReceived: action.OStake.min_received,
        isTreasuryAction: false
      };
    } else if ("OUnstake" in action) {
      return {
        actionType: "unstake",
        amount: action.OUnstake.amount,
        forfeit: action.OUnstake.forfeit,
        minReceived: action.OUnstake.min_received,
        isTreasuryAction: false
      };
    } else if ("ODirectMint" in action) {
      return {
        actionType: "direct_mint",
        amount: action.ODirectMint.amount,
        isTreasuryAction: true
      };
    } else if ("ODirectBurn" in action) {
      return {
        actionType: "direct_burn",
        amount: -action.ODirectBurn.amount,
        isTreasuryAction: true
      };
    }
    throw new Error("Unknown order action type");
  }

  /**
   * Build the signed-payload treasury request for a deposit/withdraw order.
   *
   * v1_0 / v1_0_rc1 emit the four-field request. Versions whose on-chain
   * `TreasuryRequestV1` carries extra fields (v1_1_rc1's `diffusion_end`, which
   * the validator requires the signed request to echo from the order datum)
   * override this to add them; the return stays assignable to the v1_0 shape,
   * and the extra fields are encoded by the version's own payload schema value.
   */
  buildTreasuryRequest(datum, parsed, origin) {
    return {
      destination: datum.destination,
      amount: parsed.amount,
      yield: parsed.yield ?? 0n,
      origin,
      reserve_asset: parsed.reserveAsset
    };
  }

  /**
   * Update treasury output with new reserve and circulating supply.
   */
  updateTreasuryOutput(tx, treasuryUtxo, parsedTreasuryDatum, reserveDeltas, circulatingSupplyDelta) {
    const newTreasuryDatum = {
      circulating_supply: parsedTreasuryDatum.circulating_supply + circulatingSupplyDelta
    };
    const serializedTreasuryDatum = Data.serialize(V0_1TreasuryDatum, newTreasuryDatum);
    tx.addInput(treasuryUtxo, Data.Void());
    const treasuryValue = treasuryUtxo.output().amount();
    let newTreasuryValue = makeValue(treasuryValue.coin(), [this.treasuryNFTAssetId, 1n]);
    const modifiedAssetIds = new Set([this.treasuryNFTAssetId.toString()]);
    for (const [reserveAssetId, delta] of reserveDeltas.entries()) {
      const currentReserve = treasuryValue.multiasset()?.get(Core.AssetId(reserveAssetId)) ?? 0n;
      const newReserve = currentReserve + delta;
      newTreasuryValue = Value.merge(newTreasuryValue, makeValue(0n, [Core.AssetId(reserveAssetId), newReserve]));
      modifiedAssetIds.add(reserveAssetId);
    }
    const existingMultiasset = treasuryValue.multiasset();
    if (existingMultiasset) {
      for (const [assetId, amount] of existingMultiasset.entries()) {
        if (!modifiedAssetIds.has(assetId)) {
          newTreasuryValue = Value.merge(newTreasuryValue, makeValue(0n, [Core.AssetId(assetId), amount]));
        }
      }
    }
    tx.lockAssets(this.treasuryAddress, newTreasuryValue, serializedTreasuryDatum);
  }

  /**
   * Update treasury output without reserve changes (for DirectMint/DirectBurn).
   */
  updateTreasuryOutputNoReserve(tx, treasuryUtxo, parsedTreasuryDatum, circulatingSupplyDelta) {
    const newTreasuryDatum = {
      circulating_supply: parsedTreasuryDatum.circulating_supply + circulatingSupplyDelta
    };
    const serializedTreasuryDatum = Data.serialize(V0_1TreasuryDatum, newTreasuryDatum);
    tx.addInput(treasuryUtxo, Data.Void());

    // Preserve exact treasury value (no reserve changes)
    const treasuryValue = treasuryUtxo.output().amount();
    tx.lockAssets(this.treasuryAddress, treasuryValue, serializedTreasuryDatum);
  }

  /**
   * Update vault output with new circulating_susdr and USDr balance.
   *
   * The datum construction is delegated to the version's
   * `buildUpdatedVaultDatum` seam; the value rebuild below is
   * datum-shape-agnostic and shared by all versions.
   */
  updateVaultOutput(tx, vaultUtxo, parsedVaultDatum, sUSDrDelta, uSDrDelta = 0n) {
    this.updateVaultOutputWithDatum(tx, vaultUtxo, this.buildUpdatedVaultDatum(parsedVaultDatum, sUSDrDelta), uSDrDelta);
  }

  /**
   * Lock the vault output with an already-constructed datum, rebuilding its
   * USDr balance by `uSDrDelta`. The value rebuild is datum-shape-agnostic;
   * versions whose datum update needs more than `sUSDrDelta` (v1_1_rc1's
   * deposit diffusion window) build the datum themselves and call this.
   */
  updateVaultOutputWithDatum(tx, vaultUtxo, newVaultDatum, uSDrDelta = 0n) {
    const serializedVaultDatum = Data.serialize(this.schemas.VaultDatumV1, newVaultDatum);
    tx.addInput(vaultUtxo, Data.Void());
    const stablecoinAssetId = Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
    let newVaultValue = vaultUtxo.output().amount();
    if (uSDrDelta !== 0n) {
      const currentUSDr = newVaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
      const newUSDr = currentUSDr + uSDrDelta;
      newVaultValue = makeValue(newVaultValue.coin(), [this.stakingVaultNFTAssetId, 1n]);
      if (newUSDr > 0n) {
        newVaultValue = Value.merge(newVaultValue, makeValue(0n, [stablecoinAssetId, newUSDr]));
      }
      const existingMultiasset = vaultUtxo.output().amount().multiasset();
      if (existingMultiasset) {
        for (const [assetId, amount] of existingMultiasset.entries()) {
          if (assetId !== this.stakingVaultNFTAssetId.toString() && assetId !== stablecoinAssetId.toString()) {
            newVaultValue = Value.merge(newVaultValue, makeValue(0n, [Core.AssetId(assetId), amount]));
          }
        }
      }
    }
    tx.lockAssets(this.stakingVaultAddress, newVaultValue, serializedVaultDatum);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reserve Asset Conversion Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  async getVersionSettings() {
    const {
      parsedProxyDatum
    } = await this.getParsedProxyDatum();
    return parsedProxyDatum.settings;
  }
}
_defineProperty(RealfiSDKV1Family, "buildTimelockNativeScript", buildTimelockNativeScript);
_defineProperty(RealfiSDKV1Family, "buildTimelockAddress", buildTimelockAddress);
_defineProperty(RealfiSDKV1Family, "buildMultisigTimelockNativeScript", buildMultisigTimelockNativeScript);
//# sourceMappingURL=family.js.map