import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, TxBuilder, type Wallet } from "@blaze-cardano/sdk";

import {
  DEFAULT_CLIENT_SOURCE,
  SDK_VERSION,
  type TClientSource,
} from "./client-id.js";
import {
  buildOrderOriginMetadatum,
  ORDER_ORIGIN_METADATA_LABEL,
  resolveTimelockNativeScript,
} from "./timelock.js";
import type {
  IBaseSDKParams,
  ICachedReferenceInputs,
  IOutputReference,
  IProxyDatumResult,
  IProxySettings,
  IRawProxyDatumResult,
  ITreasuryDatumResult,
  TProtocolVersion,
} from "./types.js";
import {
  addDirectOutput,
  credentialFromScript,
  deployScript,
  getReferenceInputs,
  readSingletonDatum,
  rewardAccountFromScript,
} from "./utils.js";

/**
 * Base interface for SDK version implementations.
 * Each version implements this with version-specific logic.
 */
export interface IRealfiSDK {
  /** Protocol version */
  readonly version: TProtocolVersion;

  /** Stablecoin policy ID (mint proxy) */
  readonly stablecoinPolicyId: Core.PolicyId;

  /** One-shot NFT policy ID */
  readonly oneShotPolicyId: Core.PolicyId;

  /** Protocol script hash */
  readonly protocolScriptHash: Core.Hash28ByteBase16;

  /** Get the raw proxy UTxO + inline datum from the one-shot token UTXO */
  getRawProxyDatum(): Promise<IRawProxyDatumResult>;

  /** Get and parse the proxy datum using this SDK version's schema */
  getParsedProxyDatum(): Promise<IProxyDatumResult<unknown>>;

  /** @deprecated Use getParsedProxyDatum() or getRawProxyDatum() */
  getProxyDatum(): Promise<IProxyDatumResult<unknown>>;

  /** Deploy the protocol script */
  deployProtocol(): Promise<TxBuilder>;

  /** Deploy the mint proxy script */
  deployMintProxy(): Promise<TxBuilder>;

  /** Register the protocol stake credential */
  registerProtocolStake(): TxBuilder;

  /** Get the protocol reward account */
  getProtocolRewardAccount(): Core.RewardAccount;

  /** Mint the one-shot NFT with initial datum */
  mintOneShot(
    receiverAddress: Core.Address,
    datum: unknown,
  ): Promise<{
    tx: TxBuilder;
    policyId: Core.PolicyId;
  }>;

  /** Update the one-shot datum */
  updateOneShotDatum(
    receiverAddress: Core.Address,
    newDatum: unknown,
  ): Promise<TxBuilder>;

  /** Get version-agnostic proxy settings (common fields only) */
  getSettings(): Promise<IProxySettings>;
}

/**
 * Extended interface for SDK versions with treasury support (V0_1+)
 */
type TNestedProxySettings = {
  permissions: {
    mint: IProxySettings["mint_permission"];
    burn: IProxySettings["burn_permission"];
    withdraw: IProxySettings["withdraw_permission"];
    deposit: IProxySettings["deposit_permission"];
    stake: IProxySettings["stake_permission"];
    unstake: IProxySettings["unstake_permission"];
  };
  config: { reserve_assets: IProxySettings["reserve_assets"] };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFlatProxySettings = (value: unknown): value is IProxySettings =>
  isRecord(value) &&
  "mint_permission" in value &&
  "burn_permission" in value &&
  "withdraw_permission" in value &&
  "deposit_permission" in value &&
  "stake_permission" in value &&
  "unstake_permission" in value &&
  Array.isArray(value.reserve_assets);

const isNestedProxySettings = (value: unknown): value is TNestedProxySettings =>
  isRecord(value) &&
  isRecord(value.permissions) &&
  "mint" in value.permissions &&
  "burn" in value.permissions &&
  "withdraw" in value.permissions &&
  "deposit" in value.permissions &&
  "stake" in value.permissions &&
  "unstake" in value.permissions &&
  isRecord(value.config) &&
  Array.isArray(value.config.reserve_assets);

export interface IRealfiSDKWithTreasury extends IRealfiSDK {
  /** Treasury NFT asset ID */
  readonly treasuryNFTAssetId: Core.AssetId;

  /** Treasury script hash */
  readonly treasuryScriptHash: Core.Hash28ByteBase16;

  /** Mint the treasury NFT */
  mintTreasuryNFT(
    utxo?: Core.TransactionUnspentOutput,
  ): Promise<{ tx: TxBuilder; nftAssetId: Core.AssetId }>;

  /** Deploy the treasury script (requires original UTXO for script instantiation) */
  deployTreasury(utxo: Core.TransactionUnspentOutput): Promise<TxBuilder>;

  /** Get the treasury datum */
  getTreasuryDatum(): Promise<ITreasuryDatumResult<unknown>>;
}

/**
 * Abstract base class for SDK versions.
 * Provides common implementation and utilities.
 */
export abstract class RealfiSDKBase<
  P extends Provider,
  W extends Wallet,
> implements IRealfiSDK {
  /** Blaze instance for blockchain interactions */
  protected readonly blaze: Blaze<P, W>;

  /** Bootstrap parameters */
  protected readonly proxyBootstrap: IBaseSDKParams["proxyBootstrap"];

  /** Asset name hex for the stablecoin */
  protected readonly assetNameHex: string;

  /** Cached reference inputs for performance (populated on first fetch) */
  protected cachedReferenceInputs: ICachedReferenceInputs;

  /**
   * Address used to deploy reference scripts and to resolve them from.
   * When undefined, Blaze's burn address is used for both.
   */
  protected readonly scriptDeploymentAddress?: Core.Address;

  /** Cached raw proxy datum result (populated on first fetch) */
  protected cachedRawProxyDatumResult?: IRawProxyDatumResult;

  /** Cached parsed proxy datum result (populated on first fetch) */
  protected cachedProxyDatumResult?: IProxyDatumResult<unknown>;

  /** One-shot output reference (derived from bootstrap) */
  protected readonly oneShotTxoRef: IOutputReference;

  /** Enable trace output in Plutus scripts */
  readonly enableTrace: boolean;

  /** Origin attached to all built order transactions. */
  readonly clientSource: TClientSource;

  /** SDK version attached to all built order transactions. */
  readonly sdkVersion: string;

  // Abstract properties - each version must provide these
  abstract readonly version: TProtocolVersion;
  abstract readonly stablecoinPolicyId: Core.PolicyId;
  abstract readonly oneShotPolicyId: Core.PolicyId;
  abstract readonly protocolScriptHash: Core.Hash28ByteBase16;

  // Scripts - each version stores its own instantiated scripts
  protected abstract readonly oneShotScript: Core.Script;
  protected abstract readonly protocolScript: Core.Script;
  protected abstract readonly mintProxyScript: Core.Script;

  protected constructor(
    blaze: Blaze<P, W>,
    params: IBaseSDKParams & { clientSource?: TClientSource },
    cachedReferenceInputs?: ICachedReferenceInputs,
  ) {
    this.blaze = blaze;
    this.proxyBootstrap = params.proxyBootstrap;
    this.assetNameHex = params.assetNameHex;
    this.enableTrace = params.enableTrace ?? false;
    this.cachedReferenceInputs = cachedReferenceInputs ?? {};
    this.scriptDeploymentAddress = params.scriptDeploymentAddress;
    this.clientSource = params.clientSource ?? DEFAULT_CLIENT_SOURCE;
    this.sdkVersion = SDK_VERSION;
    this.oneShotTxoRef = {
      transaction_id: params.proxyBootstrap.txHash,
      output_index: params.proxyBootstrap.outputIndex,
    };
  }

  /** Get the network from blaze */
  protected get network(): Core.NetworkId {
    return this.blaze.provider.network;
  }

  /**
   * Start a transaction with a single setMetadata call. Origin label (55534473) is always
   * present and not overridable; extra labels are merged in before the origin is set.
   */
  protected newOrderTransaction(
    extraLabels?: Map<bigint, Core.Metadatum>,
  ): TxBuilder {
    const map = new Map<bigint, Core.Metadatum>(extraLabels ?? []);
    map.set(
      ORDER_ORIGIN_METADATA_LABEL,
      buildOrderOriginMetadatum(this.clientSource, this.sdkVersion),
    );
    return this.blaze.newTransaction().setMetadata(new Core.Metadata(map));
  }

  /**
   * Helper to get reference inputs for scripts.
   * Fetched values are cached for subsequent calls.
   */
  async getScriptReferenceInputs(
    scriptHashes: Record<string, Core.Hash28ByteBase16>,
  ): Promise<Record<string, Core.TransactionUnspentOutput>> {
    const cached: Partial<Record<string, Core.TransactionUnspentOutput>> = {};

    if (this.cachedReferenceInputs.protocolRefInput) {
      cached.protocol = this.cachedReferenceInputs.protocolRefInput;
    }
    if (this.cachedReferenceInputs.proxyRefInput) {
      cached.proxy = this.cachedReferenceInputs.proxyRefInput;
    }
    if (this.cachedReferenceInputs.treasuryRefInput) {
      cached.treasury = this.cachedReferenceInputs.treasuryRefInput;
    }
    if (this.cachedReferenceInputs.orderRefInput) {
      cached.order = this.cachedReferenceInputs.orderRefInput;
    }
    if (this.cachedReferenceInputs.stakingVaultRefInput) {
      cached.stakingVault = this.cachedReferenceInputs.stakingVaultRefInput;
    }
    // V1.0 additional protocol scripts
    if (this.cachedReferenceInputs.protocolMintRefInput) {
      cached.protocolMint = this.cachedReferenceInputs.protocolMintRefInput;
    }
    if (this.cachedReferenceInputs.protocolStakeRefInput) {
      cached.protocolStake = this.cachedReferenceInputs.protocolStakeRefInput;
    }
    if (this.cachedReferenceInputs.protocolManagementRefInput) {
      cached.protocolManagement =
        this.cachedReferenceInputs.protocolManagementRefInput;
    }
    const result = await getReferenceInputs(
      this.blaze,
      scriptHashes,
      cached,
      this.scriptDeploymentAddress,
    );
    // Cache fetched values for subsequent calls
    if (result.protocol && !this.cachedReferenceInputs.protocolRefInput) {
      this.cachedReferenceInputs.protocolRefInput = result.protocol;
    }
    if (result.proxy && !this.cachedReferenceInputs.proxyRefInput) {
      this.cachedReferenceInputs.proxyRefInput = result.proxy;
    }
    if (result.treasury && !this.cachedReferenceInputs.treasuryRefInput) {
      this.cachedReferenceInputs.treasuryRefInput = result.treasury;
    }
    if (result.order && !this.cachedReferenceInputs.orderRefInput) {
      this.cachedReferenceInputs.orderRefInput = result.order;
    }
    if (
      result.stakingVault &&
      !this.cachedReferenceInputs.stakingVaultRefInput
    ) {
      this.cachedReferenceInputs.stakingVaultRefInput = result.stakingVault;
    }
    // V1.0 additional protocol scripts caching
    if (
      result.protocolMint &&
      !this.cachedReferenceInputs.protocolMintRefInput
    ) {
      this.cachedReferenceInputs.protocolMintRefInput = result.protocolMint;
    }
    if (
      result.protocolStake &&
      !this.cachedReferenceInputs.protocolStakeRefInput
    ) {
      this.cachedReferenceInputs.protocolStakeRefInput = result.protocolStake;
    }
    if (
      result.protocolManagement &&
      !this.cachedReferenceInputs.protocolManagementRefInput
    ) {
      this.cachedReferenceInputs.protocolManagementRefInput =
        result.protocolManagement;
    }
    return result;
  }

  /**
   * Resolve the bootstrap UTXO from the provider.
   * This will fail if the UTXO has already been consumed (i.e., the one-shot token was minted).
   */
  protected async resolveBootstrapUtxo(): Promise<Core.TransactionUnspentOutput> {
    const utxos = await this.blaze.provider.resolveUnspentOutputs([
      new Core.TransactionInput(
        this.oneShotTxoRef.transaction_id,
        this.oneShotTxoRef.output_index,
      ),
    ]);
    const utxo = utxos[0];
    if (!utxo) {
      throw new Error(
        "Bootstrap UTXO not found. It may have already been consumed (one-shot token already minted).",
      );
    }
    return utxo;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Common Protocol Operations (shared across all versions)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Deploy the protocol script as a reference script.
   */
  async deployProtocol(): Promise<TxBuilder> {
    return deployScript(
      this.blaze,
      this.protocolScript,
      this.scriptDeploymentAddress,
    );
  }

  /**
   * Deploy the mint proxy script as a reference script.
   */
  async deployMintProxy(): Promise<TxBuilder> {
    return deployScript(
      this.blaze,
      this.mintProxyScript,
      this.scriptDeploymentAddress,
    );
  }

  /**
   * Register the protocol stake credential.
   */
  registerProtocolStake(): TxBuilder {
    const stakeCredential = credentialFromScript(this.protocolScript);
    const registerTx = this.blaze
      .newTransaction()
      .addRegisterStake(stakeCredential);
    return registerTx;
  }

  /**
   * Get the protocol reward account.
   */
  getProtocolRewardAccount(): Core.RewardAccount {
    return rewardAccountFromScript(this.protocolScript, this.network);
  }

  /**
   * Get version-agnostic proxy settings.
   * Extracts only the common fields shared across V0_2+ protocol versions.
   */
  async getSettings(): Promise<IProxySettings> {
    const { parsedProxyDatum } = await this.getParsedProxyDatum();
    const settings = (parsedProxyDatum as { settings?: unknown }).settings;

    if (isFlatProxySettings(settings)) {
      return {
        mint_permission: settings.mint_permission,
        burn_permission: settings.burn_permission,
        withdraw_permission: settings.withdraw_permission,
        deposit_permission: settings.deposit_permission,
        stake_permission: settings.stake_permission,
        unstake_permission: settings.unstake_permission,
        reserve_assets: settings.reserve_assets,
      };
    }

    if (isNestedProxySettings(settings)) {
      return {
        mint_permission: settings.permissions.mint,
        burn_permission: settings.permissions.burn,
        withdraw_permission: settings.permissions.withdraw,
        deposit_permission: settings.permissions.deposit,
        stake_permission: settings.permissions.stake,
        unstake_permission: settings.permissions.unstake,
        reserve_assets: settings.config.reserve_assets,
      };
    }

    throw new Error(
      `getSettings() is not supported for protocol version ${this.version}`,
    );
  }

  /** The USDr asset ID (stablecoin policy + USDr asset name). */
  getUsdrAssetId(): Core.AssetId {
    return Core.AssetId(this.stablecoinPolicyId + this.assetNameHex);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Timelock Operations (shared across versions with staking support)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a transaction that claims USDr locked in a timelock address after
   * the unstake cooldown has expired.
   *
   * Reconstructs the timelock native script for the owner's key hash and the
   * original unlock slot, then spends the UTxO. `owner` is the timelock owner
   * (defaults to the connected wallet) and is set as the required signer, so a
   * custodian holding the user's key can claim. The released USDr goes to
   * `destination`, or to `owner` when only an owner is given; with neither it
   * returns to the connected wallet.
   *
   * A single owner key has two timelock shapes in the protocol, differing only
   * in element order: `buildUnstakeOrderTx` locks to
   * `AllOf { Signature, After }` and the treasury/multisig unstake path to
   * `AllOf { After, Signature }`. They hash differently, so which one applies
   * is read off the UTxO's own locking address rather than assumed.
   */
  async buildClaimTimelockTx(params: {
    resultUtxo: { txHash: string; index: number };
    unlockSlot: bigint;
    owner?: Core.Address;
    destination?: Core.Address;
  }): Promise<TxBuilder> {
    const ownerAddress =
      params.owner ?? (await this.blaze.wallet.getChangeAddress());
    const ownerKeyHash = ownerAddress.getProps().paymentPart?.hash;
    if (!ownerKeyHash) {
      throw new Error("Timelock owner address has no payment key credential");
    }

    const input = new Core.TransactionInput(
      Core.TransactionId(params.resultUtxo.txHash),
      BigInt(params.resultUtxo.index),
    );
    const [utxo] = await this.blaze.provider.resolveUnspentOutputs([input]);
    if (!utxo) {
      throw new Error(
        `Could not resolve UTxO ${params.resultUtxo.txHash}#${params.resultUtxo.index}`,
      );
    }

    const nativeScript = resolveTimelockNativeScript(
      utxo.output().address(),
      ownerKeyHash,
      params.unlockSlot,
    );
    const scriptWrapped = Core.Script.newNativeScript(nativeScript);

    const tx = this.newOrderTransaction()
      .setValidFrom(Core.Slot(Number(params.unlockSlot)))
      .provideScript(scriptWrapped)
      .addRequiredSigner(Core.Ed25519KeyHashHex(ownerKeyHash))
      .addInput(utxo);

    // Route funds to `destination`, else to an explicit `owner` (so a custodial
    // claim reaches the user); with neither, value returns to the connected
    // wallet as change.
    const recipient = params.destination ?? params.owner;
    if (recipient) {
      addDirectOutput(tx, recipient, utxo.output().amount());
    }

    return tx;
  }

  /**
   * Fetch the live proxy UTxO and inline datum without attempting a
   * version-specific parse. Cached after first fetch.
   *
   * `readSingletonDatum` both retries the lookup (a not-found answer is the
   * provider's index lagging the UTxO's latest move, not a missing proxy —
   * Blockfrost returns HTTP 404 in that window, Sentry TREASURY-ADMIN-API-G)
   * and repairs a datum the provider reports as a hash.
   */
  async getRawProxyDatum(): Promise<IRawProxyDatumResult> {
    if (this.cachedRawProxyDatumResult) {
      return this.cachedRawProxyDatumResult;
    }
    if (this.cachedProxyDatumResult) {
      const { proxyUtxo, proxyDatum } = this.cachedProxyDatumResult;
      this.cachedRawProxyDatumResult = { proxyUtxo, proxyDatum };
      return this.cachedRawProxyDatumResult;
    }

    const { utxo: proxyUtxo, datum: proxyDatum } = await readSingletonDatum(
      this.blaze.provider,
      Core.AssetId(this.oneShotPolicyId),
    );

    const result = { proxyUtxo, proxyDatum };
    this.cachedRawProxyDatumResult = result;
    return result;
  }

  /**
   * @deprecated Use getParsedProxyDatum() or getRawProxyDatum() depending on
   * whether the caller needs a version-specific schema parse.
   */
  async getProxyDatum(): Promise<IProxyDatumResult<unknown>> {
    return this.getParsedProxyDatum();
  }

  // Abstract methods - each version must implement these
  abstract getParsedProxyDatum(): Promise<IProxyDatumResult<unknown>>;
  abstract mintOneShot(
    receiverAddress: Core.Address,
    datum: unknown,
  ): Promise<{
    tx: TxBuilder;
    policyId: Core.PolicyId;
  }>;
  abstract updateOneShotDatum(
    receiverAddress: Core.Address,
    newDatum: unknown,
  ): Promise<TxBuilder>;
}
