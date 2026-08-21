import {
  addressFromValidator,
  blake2b_256,
  Ed25519KeyHashHex,
  HexBlob,
  PlutusData,
  toHex,
} from "@blaze-cardano/core";
import * as Data from "@blaze-cardano/data";
import { parse } from "@blaze-cardano/data";
import type { Provider } from "@blaze-cardano/query";
import {
  type Blaze,
  Core,
  makeValue,
  TxBuilder,
  Value,
  type Wallet,
} from "@blaze-cardano/sdk";

import {
  BaseTypes,
  V0_1Types,
  V0_4Types,
} from "../../generated-types/index.js";
import { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import type {
  Destination,
  MultisigScript,
  OrderDatum,
  ProxyDatum,
  Settings,
  VaultDatum,
} from "../../generated-types/v0_4/index.js";
import {
  addDirectOutput,
  addDestinationOutput,
  buildNonceFromUtxo,
  buildTimelockAddress,
  buildTimelockDestination,
  buildTimelockNativeScript,
  buildUnstakeMetadatum,
  UNSTAKE_METADATA_LABEL,
  deployScript,
  destinationToAddress,
  findReserveAsset,
  getDatumFromNFT,
  getSignatureKeyHashesFromMultisigScript,
  usdrToReserve,
  usdrToReserveCeil,
  computeReserveDeltas,
  parseCancelOwner,
  resolveOrderReferenceInputs,
  type ICachedReferenceInputs,
  type IProxyDatumResult,
  type IRealfiSDKWithTreasury,
  type ITreasuryDatumResult,
  type IVaultDatumResult,
  type TClientSource,
  type TProtocolVersion,
  lockOrPayAssets,
  RealfiSDKBase,
  sortOrderInputs,
} from "../shared/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsed order information extracted from a UTXO.
 */
interface IOrderInfo {
  utxo: Core.TransactionUnspentOutput;
  datum: OrderDatum;
  actionType: TOrderActionType;
  amount: bigint;
  /** Yield amount for deposit actions */
  yield?: bigint;
  /** Reserve asset for treasury actions, undefined for stake/unstake */
  reserveAsset?: [string, string];
}

type TOrderActionType =
  | "mint"
  | "burn"
  | "deposit"
  | "withdraw"
  | "stake"
  | "unstake";

interface ITxBuilderWithInternals {
  body: Core.TransactionBody;
  redeemers: Core.Redeemers;
}

const MIN_LOVELACE = 2000000n;

/**
 * Floor division for BigInt (rounds toward negative infinity).
 * JavaScript BigInt `/` truncates toward zero, but Aiken (Plutus)
 * uses floor division. These differ for negative dividends.
 */
/**
 * Extract the requests list from a signed payload action, regardless of action type.
 * Both TreasuryRequest and Request have `origin: { transaction_id, output_index }`.
 */
function getRequestsFromAction(
  action: V0_4Types.ProtocolRedeemer,
): Array<{ origin: { transaction_id: string; output_index: bigint } }> {
  if ("Mint" in action) return action.Mint.requests;
  if ("Burn" in action) return action.Burn.requests;
  if ("Withdraw" in action) return action.Withdraw.requests;
  if ("Deposit" in action) return action.Deposit.requests;
  if ("Stake" in action) return action.Stake.requests;
  if ("Unstake" in action) return action.Unstake.requests;
  throw new Error("Unknown action type in signed payload");
}

function floorDiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  // Adjust if signs differ and there's a remainder
  if ((a ^ b) < 0n && q * b !== a) {
    return q - 1n;
  }
  return q;
}

/**
 * Calculate yield split between staked and unstaked portions.
 * Matches on-chain deposit.ak logic: staked_yield_share = total_yield * vault_usdr / treasury_circulating
 */
function calculateYieldShares(
  totalYield: bigint,
  vaultUSDr: bigint,
  treasuryCirculating: bigint,
): { stakedYieldShare: bigint; unstakedYieldShare: bigint } {
  const stakedYieldShare =
    treasuryCirculating > 0n
      ? floorDiv(totalYield * vaultUSDr, treasuryCirculating)
      : 0n;
  const unstakedYieldShare = totalYield - stakedYieldShare;
  return { stakedYieldShare, unstakedYieldShare };
}

function toSpendOrderingKey(input: Core.TransactionInput): string {
  return `${input.transactionId().toString()}${input.index().toString()}`;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiSDKParamsV0_4 {
  version: "V0_4";
  proxyBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  /** USDr asset name hex */
  assetNameHex: string;
  /** sUSDr asset name hex */
  sUSDrAssetNameHex: string;
  /** The treasury bootstrap UTxO reference */
  treasuryBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  /** The staking vault bootstrap UTxO reference */
  stakingVaultBootstrap: {
    txHash: Core.TransactionId;
    outputIndex: bigint;
  };
  /** Enable trace output in Plutus scripts for debugging. Default: false */
  enableTrace?: boolean;
  /**
   * Address to deploy reference scripts to (and resolve them from). When
   * omitted, Blaze's burn address is used for both deploy and resolve.
   */
  scriptDeploymentAddress?: Core.Address;
  referenceInputs?: {
    protocolRefInput?: Core.TransactionUnspentOutput;
    proxyRefInput?: Core.TransactionUnspentOutput;
    treasuryRefInput?: Core.TransactionUnspentOutput;
    orderRefInput?: Core.TransactionUnspentOutput;
    stakingVaultRefInput?: Core.TransactionUnspentOutput;
  };
  clientSource?: TClientSource;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * V0_4 SDK implementation.
 *
 * Extends the protocol with staking (USDr->sUSDr), unstaking (sUSDr->USDr),
 * multi-reserve assets, deposit with interest splitting, and index-based optimization.
 * All order types (mint, burn, deposit, withdraw, stake, unstake) are request-based.
 */
export class RealfiSDKV0_4<P extends Provider, W extends Wallet>
  extends RealfiSDKBase<P, W>
  implements IRealfiSDKWithTreasury
{
  readonly version = "V0_4" as const;

  // Script hashes and policy IDs
  readonly stablecoinPolicyId: Core.PolicyId;
  readonly oneShotPolicyId: Core.PolicyId;
  readonly protocolScriptHash: Core.Hash28ByteBase16;
  readonly treasuryScriptHash: Core.Hash28ByteBase16;
  readonly treasuryNFTAssetId: Core.AssetId;
  readonly orderScriptHash: Core.Hash28ByteBase16;
  readonly orderScriptAddress: Core.Address;
  readonly treasuryAddress: Core.Address;
  readonly stakingVaultScriptHash: Core.Hash28ByteBase16;
  readonly stakingVaultAddress: Core.Address;
  readonly stakingVaultNFTAssetId: Core.AssetId;
  readonly sUSDrAssetNameHex: string;

  // Scripts
  protected readonly oneShotScript: Core.Script;
  protected readonly protocolScript: Core.Script;
  protected readonly mintProxyScript: Core.Script;
  protected readonly treasuryScript: Core.Script;
  protected readonly orderScript: Core.Script;
  protected readonly stakingVaultScript: Core.Script;

  private constructor(
    blaze: Blaze<P, W>,
    params: {
      version: "V0_4";
      proxyBootstrap: { txHash: Core.TransactionId; outputIndex: bigint };
      assetNameHex: string;
      sUSDrAssetNameHex: string;
      enableTrace?: boolean;
      scriptDeploymentAddress?: Core.Address;
      clientSource?: TClientSource;
    },
    scripts: {
      oneShotScript: Core.Script;
      protocolScript: Core.Script;
      mintProxyScript: Core.Script;
      treasuryScript: Core.Script;
      orderScript: Core.Script;
      stakingVaultScript: Core.Script;
    },
    cachedReferenceInputs?: ICachedReferenceInputs,
  ) {
    super(
      blaze,
      {
        version: "V0_4",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        enableTrace: params.enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource,
      },
      cachedReferenceInputs,
    );

    this.sUSDrAssetNameHex = params.sUSDrAssetNameHex;

    this.oneShotScript = scripts.oneShotScript;
    this.protocolScript = scripts.protocolScript;
    this.mintProxyScript = scripts.mintProxyScript;
    this.treasuryScript = scripts.treasuryScript;
    this.orderScript = scripts.orderScript;
    this.stakingVaultScript = scripts.stakingVaultScript;

    this.oneShotPolicyId = Core.PolicyId(this.oneShotScript.hash());
    this.protocolScriptHash = this.protocolScript.hash();
    this.stablecoinPolicyId = Core.PolicyId(this.mintProxyScript.hash());
    this.treasuryScriptHash = this.treasuryScript.hash();
    this.orderScriptHash = this.orderScript.hash();
    this.stakingVaultScriptHash = this.stakingVaultScript.hash();

    this.treasuryAddress = addressFromValidator(
      this.network,
      this.treasuryScript,
    );
    this.orderScriptAddress = addressFromValidator(
      this.network,
      this.orderScript,
    );
    this.stakingVaultAddress = addressFromValidator(
      this.network,
      this.stakingVaultScript,
    );

    // Treasury NFT: policy = treasury script hash, name = "treasury"
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));
    this.treasuryNFTAssetId = Core.AssetId(
      this.treasuryScriptHash + treasuryAssetName.toString(),
    );

    // Staking vault NFT: policy = staking vault script hash, name = "staking_vault"
    const vaultAssetName = Core.AssetName(toHex(Buffer.from("staking_vault")));
    this.stakingVaultNFTAssetId = Core.AssetId(
      this.stakingVaultScriptHash + vaultAssetName.toString(),
    );
  }

  /**
   * Create a V0_4 SDK instance.
   */
  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV0_4,
  ): RealfiSDKV0_4<P, W> {
    const enableTrace = params.enableTrace ?? false;

    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint(
      {
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex,
      },
      enableTrace,
    ).Script;
    const oneShotPolicyId = oneShotScript.hash();

    const protocolScript = new V0_4Types.V0_4ProtocolProtocolWithdraw(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    const treasuryScript = new V0_1Types.V0_1TreasuryTreasurySpend(
      {
        transaction_id: params.treasuryBootstrap.txHash,
        output_index: params.treasuryBootstrap.outputIndex,
      },
      oneShotPolicyId,
      enableTrace,
    ).Script;

    const orderScript = new V0_4Types.V0_4OrderOrderSpend(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    const stakingVaultScript = new V0_4Types.V0_4StakingVaultStakingVaultSpend(
      {
        transaction_id: params.stakingVaultBootstrap.txHash,
        output_index: params.stakingVaultBootstrap.outputIndex,
      },
      oneShotPolicyId,
      enableTrace,
    ).Script;

    return new RealfiSDKV0_4(
      blaze,
      {
        version: "V0_4",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource,
      },
      {
        oneShotScript,
        protocolScript,
        mintProxyScript,
        treasuryScript,
        orderScript,
        stakingVaultScript,
      },
      {
        protocolRefInput: params.referenceInputs?.protocolRefInput,
        proxyRefInput: params.referenceInputs?.proxyRefInput,
        treasuryRefInput: params.referenceInputs?.treasuryRefInput,
        orderRefInput: params.referenceInputs?.orderRefInput,
        stakingVaultRefInput: params.referenceInputs?.stakingVaultRefInput,
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Treasury Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the treasury NFT.
   */
  async mintTreasuryNFT(
    treasuryBootstrapUtxo: Core.TransactionUnspentOutput,
    initialDatum: V0_1TreasuryDatum = { circulating_supply: 0n },
  ): Promise<{ tx: TxBuilder; nftAssetId: Core.AssetId }> {
    const treasuryPolicyId = Core.PolicyId(this.treasuryScriptHash);
    const treasuryAssetName = Core.AssetName(toHex(Buffer.from("treasury")));

    const datum = Data.serialize(V0_1TreasuryDatum, initialDatum);
    const tx = await this.blaze
      .newTransaction()
      .addInput(treasuryBootstrapUtxo)
      .addMint(
        treasuryPolicyId,
        new Map([[treasuryAssetName, 1n]]),
        Data.Void(),
      )
      .lockAssets(
        this.treasuryAddress,
        makeValue(10000000n, [this.treasuryNFTAssetId, 1n]),
        datum,
      )
      .provideScript(this.treasuryScript);

    return { tx, nftAssetId: this.treasuryNFTAssetId };
  }

  async deployTreasury(): Promise<TxBuilder> {
    return deployScript(
      this.blaze,
      this.treasuryScript,
      this.scriptDeploymentAddress,
    );
  }

  async deployOrderContract(): Promise<TxBuilder> {
    return deployScript(
      this.blaze,
      this.orderScript,
      this.scriptDeploymentAddress,
    );
  }

  async getTreasuryDatum(): Promise<ITreasuryDatumResult<V0_1TreasuryDatum>> {
    const {
      utxo: treasuryUtxo,
      datum: treasuryDatum,
      parsedDatum: parsedTreasuryDatum,
    } = await getDatumFromNFT(
      this.blaze,
      this.treasuryNFTAssetId,
      V0_1TreasuryDatum,
    );

    if (!treasuryUtxo) {
      throw new Error("No UTXO found with the treasury NFT");
    }
    if (!treasuryDatum) {
      throw new Error("No treasury datum found");
    }

    return {
      treasuryUtxo,
      treasuryDatum,
      parsedTreasuryDatum: parsedTreasuryDatum as V0_1TreasuryDatum,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Staking Vault Operations
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint the staking vault NFT and create initial vault UTxO.
   */
  async mintStakingVaultNFT(
    stakingVaultBootstrapUtxo: Core.TransactionUnspentOutput,
    initialDatum: VaultDatum = { circulating_susdr: 0n },
  ): Promise<{ tx: TxBuilder; nftAssetId: Core.AssetId }> {
    const vaultPolicyId = Core.PolicyId(this.stakingVaultScriptHash);
    const vaultAssetName = Core.AssetName(toHex(Buffer.from("staking_vault")));

    const datum = Data.serialize(V0_4Types.VaultDatum, initialDatum);
    const tx = await this.blaze
      .newTransaction()
      .addInput(stakingVaultBootstrapUtxo)
      .addMint(vaultPolicyId, new Map([[vaultAssetName, 1n]]), Data.Void())
      .lockAssets(
        this.stakingVaultAddress,
        makeValue(10000000n, [this.stakingVaultNFTAssetId, 1n]),
        datum,
      )
      .provideScript(this.stakingVaultScript);

    return { tx, nftAssetId: this.stakingVaultNFTAssetId };
  }

  async deployStakingVault(): Promise<TxBuilder> {
    return deployScript(
      this.blaze,
      this.stakingVaultScript,
      this.scriptDeploymentAddress,
    );
  }

  /** The sUSDr asset ID (stablecoin policy + staked-USDr asset name). */
  getSusdrAssetId(): Core.AssetId {
    return Core.AssetId(this.stablecoinPolicyId + this.sUSDrAssetNameHex);
  }

  async getVaultDatum(): Promise<IVaultDatumResult<VaultDatum>> {
    const {
      utxo: vaultUtxo,
      datum: vaultDatum,
      parsedDatum: parsedVaultDatum,
    } = await getDatumFromNFT(
      this.blaze,
      this.stakingVaultNFTAssetId,
      V0_4Types.VaultDatum,
    );

    if (!vaultUtxo) {
      throw new Error("No UTXO found with the staking vault NFT");
    }
    if (!vaultDatum) {
      throw new Error("No vault datum found");
    }

    return {
      vaultUtxo,
      vaultDatum,
      parsedVaultDatum: parsedVaultDatum as VaultDatum,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // One-Shot Operations
  // ─────────────────────────────────────────────────────────────────────────────

  async mintOneShot(
    receiverAddress: Core.Address,
    datum: ProxyDatum,
  ): Promise<{ tx: TxBuilder; policyId: Core.PolicyId }> {
    const utxo = await this.resolveBootstrapUtxo();
    const serializedDatum = Data.serialize(V0_4Types.ProxyDatum, {
      logic: datum.logic,
      settings: datum.settings,
    });

    const baseTx = this.blaze
      .newTransaction()
      .addInput(utxo)
      .addMint(
        this.oneShotPolicyId,
        new Map([[Core.AssetName(""), 1n]]),
        Data.Void(),
      );
    const tx = lockOrPayAssets(
      baseTx,
      receiverAddress,
      makeValue(10000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    ).provideScript(this.oneShotScript);
    return { tx, policyId: this.oneShotPolicyId };
  }

  async updateOneShotDatum(
    receiverAddress: Core.Address,
    newDatum: ProxyDatum,
  ): Promise<TxBuilder> {
    const oneshotUtxo = await this.blaze.provider.getUnspentOutputByNFT(
      Core.AssetId(this.oneShotPolicyId),
    );
    if (!oneshotUtxo) {
      throw new Error("No UTXO found with the one-shot NFT");
    }

    const serializedDatum = Data.serialize(V0_4Types.ProxyDatum, {
      logic: newDatum.logic,
      settings: newDatum.settings,
    });

    return lockOrPayAssets(
      this.blaze.newTransaction().addInput(oneshotUtxo),
      receiverAddress,
      makeValue(10000000n, [this.oneShotPolicyId, 1n]),
      serializedDatum,
    );
  }

  async getParsedProxyDatum(): Promise<IProxyDatumResult<ProxyDatum>> {
    if (this.cachedProxyDatumResult) {
      return this.cachedProxyDatumResult as IProxyDatumResult<ProxyDatum>;
    }

    const { proxyUtxo, proxyDatum } = await this.getRawProxyDatum();
    const parsedProxyDatum = parse(V0_4Types.ProxyDatum, proxyDatum);
    const result = { proxyUtxo, proxyDatum, parsedProxyDatum };

    this.cachedProxyDatumResult = result;
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Order Builder Methods (6 separate methods, shared _buildOrderTx helper)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Internal helper to build an order transaction.
   */
  private async _buildOrderTx(params: {
    action: V0_4Types.OrderAction;
    valueToLock: Core.Value;
    destination: Destination;
    owner?: MultisigScript;
    data?: PlutusData;
    extraLabels?: Map<bigint, Core.Metadatum>;
  }): Promise<TxBuilder> {
    const orderContractAddress = addressFromValidator(
      this.network,
      this.orderScript,
    );

    let owner = params.owner;
    if (!owner) {
      const addressProps = (
        await this.blaze.wallet.getChangeAddress()
      ).getProps();
      const keyHash =
        addressProps.delegationPart?.hash ?? addressProps.paymentPart?.hash;
      if (!keyHash) {
        throw new Error("Could not derive owner key hash from wallet address");
      }
      owner = {
        Signature: { key_hash: keyHash.toString() },
      };
    }

    const orderDatum: OrderDatum = {
      action: params.action,
      owner,
      destination: params.destination,
      data: params.data ?? Data.Void(),
    };
    const serializedDatum = Data.serialize(V0_4Types.OrderDatum, orderDatum);

    const tx = this.newOrderTransaction(params.extraLabels);
    tx.lockAssets(orderContractAddress, params.valueToLock, serializedDatum);
    return tx;
  }

  /**
   * Build a mint order: lock reserve tokens, request USDr minting.
   */
  async buildMintOrderTx(params: {
    amount: bigint;
    reserveAsset: [string, string];
    destination: Destination;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
    if (params.amount <= 0n) {
      throw new Error("Mint amount must be positive");
    }
    const reserveAssetId = Core.AssetId(
      params.reserveAsset[0] + params.reserveAsset[1],
    );
    // Convert USDr amount to reserve amount using ceiling division
    // to ensure enough reserve is locked for on-chain validation
    const settings = await this.getVersionSettings();
    const ra = findReserveAsset(settings, params.reserveAsset);
    const reserveAmount = usdrToReserveCeil(params.amount, ra);
    return this._buildOrderTx({
      action: {
        OMint: { amount: params.amount, reserve_asset: params.reserveAsset },
      },
      valueToLock: makeValue(MIN_LOVELACE, [reserveAssetId, reserveAmount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data,
    });
  }

  /**
   * Build a redeem (burn) order: lock USDr, request reserve token redemption.
   */
  async buildRedeemOrderTx(params: {
    amount: bigint;
    reserveAsset: [string, string];
    destination: Destination;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
    if (params.amount <= 0n) {
      throw new Error("Redeem amount must be positive");
    }
    const settings = await this.getVersionSettings();
    findReserveAsset(settings, params.reserveAsset);
    const stablecoinAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.assetNameHex,
    );
    return this._buildOrderTx({
      action: {
        ORedeem: {
          amount: params.amount,
          reserve_asset: params.reserveAsset,
        },
      },
      valueToLock: makeValue(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data,
    });
  }

  /**
   * Build a deposit order: lock reserve tokens, request treasury deposit.
   */
  async buildDepositOrderTx(params: {
    principal: bigint;
    yield: bigint;
    reserveAsset: [string, string];
    destination: Destination;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
    if (params.principal < 0n) {
      throw new Error("Deposit principal must be non-negative");
    }
    if (params.principal === 0n && params.yield === 0n) {
      throw new Error("Deposit must have non-zero principal or yield");
    }
    const settings = await this.getVersionSettings();
    const ra = findReserveAsset(settings, params.reserveAsset);
    const reserveAssetId = Core.AssetId(
      params.reserveAsset[0] + params.reserveAsset[1],
    );

    let valueToLock: Core.Value;

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
      const principalReserve =
        params.principal > 0n ? usdrToReserveCeil(params.principal, ra) : 0n;

      valueToLock =
        principalReserve > 0n
          ? makeValue(MIN_LOVELACE, [reserveAssetId, principalReserve])
          : makeValue(MIN_LOVELACE);

      const stablecoinAssetId = Core.AssetId(
        this.stablecoinPolicyId + this.assetNameHex,
      );

      // Fetch current state to calculate yield split
      const { parsedTreasuryDatum } = await this.getTreasuryDatum();
      const vaultUtxo = (await this.getVaultDatum()).vaultUtxo;
      const vaultValue = vaultUtxo.output().amount();
      const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
      const treasuryCirculating = parsedTreasuryDatum.circulating_supply;

      const { unstakedYieldShare } = calculateYieldShares(
        params.yield,
        vaultUSDr,
        treasuryCirculating,
      );

      // Lock only the unstaked portion (negated since unstakedYieldShare is negative)
      if (unstakedYieldShare < 0n) {
        valueToLock = Value.merge(
          valueToLock,
          makeValue(0n, [stablecoinAssetId, -unstakedYieldShare]),
        );
      }
    }
    return this._buildOrderTx({
      action: {
        ODeposit: {
          principal: params.principal,
          yield: params.yield,
          reserve_asset: params.reserveAsset,
        },
      },
      valueToLock,
      owner: params.owner,
      destination: params.destination,
      data: params.data,
    });
  }

  /**
   * Build a withdraw order: lock min ADA, request reserve token withdrawal.
   */
  async buildWithdrawOrderTx(params: {
    amount: bigint;
    reserveAsset: [string, string];
    destination: Destination;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
    if (params.amount <= 0n) {
      throw new Error("Withdraw amount must be positive");
    }
    const settings = await this.getVersionSettings();
    findReserveAsset(settings, params.reserveAsset);
    return this._buildOrderTx({
      action: {
        OWithdraw: {
          amount: params.amount,
          reserve_asset: params.reserveAsset,
        },
      },
      valueToLock: makeValue(MIN_LOVELACE),
      owner: params.owner,
      destination: params.destination,
      data: params.data,
    });
  }

  /**
   * Build a stake order: lock USDr, request sUSDr minting.
   */
  async buildStakeOrderTx(params: {
    amount: bigint;
    destination: Destination;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
    if (params.amount <= 0n) {
      throw new Error("Stake amount must be positive");
    }
    const stablecoinAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.assetNameHex,
    );
    return this._buildOrderTx({
      action: { OStake: { amount: params.amount } },
      valueToLock: makeValue(MIN_LOVELACE, [stablecoinAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data,
    });
  }

  /**
   * Build an unstake order: lock sUSDr, request USDr release.
   *
   * The destination is automatically set to a native script address that
   * enforces a timelock: AllOf { Signature(user), After(unlockTime) }.
   * This means the released USDr can only be spent by the user after the
   * unlock time has passed.
   *
   * @param params.amount - Amount of sUSDr to unstake
   * @param params.destination - The user's actual destination (used to extract payment key hash)
   * @param params.unlockTime - Slot number after which the user can spend the released USDr
   */
  async buildUnstakeOrderTx(params: {
    amount: bigint;
    destination: Destination;
    unlockSlot: bigint;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
    if (params.amount <= 0n) {
      throw new Error("Unstake amount must be positive");
    }
    const sUSDrAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.sUSDrAssetNameHex,
    );

    // Build the timelock native script destination from the user's key hash
    const timelockDestination = buildTimelockDestination(
      params.destination,
      params.unlockSlot,
    );
    const extraLabels = new Map<bigint, Core.Metadatum>([
      [
        UNSTAKE_METADATA_LABEL,
        buildUnstakeMetadatum(params.destination, params.unlockSlot),
      ],
    ]);

    return this._buildOrderTx({
      action: { OUnstake: { amount: params.amount } },
      valueToLock: makeValue(MIN_LOVELACE, [sUSDrAssetId, params.amount]),
      owner: params.owner,
      destination: timelockDestination,
      data: params.data,
      extraLabels,
    });
  }

  /**
   * Build a timelock Destination from a user's destination and unlock time.
   *
   * Creates a native script: AllOf { Signature(userKeyHash), After(unlockTime) }
   * and returns a Destination pointing to that script's address.
   */

  static buildTimelockNativeScript = buildTimelockNativeScript;
  static buildTimelockAddress = buildTimelockAddress;

  // ─────────────────────────────────────────────────────────────────────────────
  // Signed Payload and Signing
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build the V0_4 SignedPayload_ProtocolRedeemer from order inputs.
   * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
   * the blake2b_256 hash (for CIP-30 signing).
   *
   * V0.4 contract requires signing the blake2b_256 hash of the payload,
   * not the raw CBOR like V0.3.
   */
  async getSignedPayloadFromOrderInputs(
    orderInputs: Core.TransactionInput[],
  ): Promise<{ signedPayload: string; payloadHash: string }> {
    if (orderInputs.length === 0) {
      throw new Error("At least one order input is required");
    }

    const sortedInputs = sortOrderInputs(orderInputs);
    const nonce = buildNonceFromUtxo(sortedInputs[0]!) as V0_4Types.Nonce;

    const resolvedUtxos =
      await this.blaze.provider.resolveUnspentOutputs(sortedInputs);

    let actionType: TOrderActionType | null = null;
    const treasuryRequests: V0_4Types.TreasuryRequest[] = [];
    const requests: V0_4Types.Request[] = [];

    for (const utxo of resolvedUtxos) {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(V0_4Types.OrderDatum, datumData) as OrderDatum;
      const origin = {
        transaction_id: utxo.input().transactionId().toString(),
        output_index: utxo.input().index(),
      };

      const parsed = this.classifyOrderAction(datum);

      if (actionType === null) {
        actionType = parsed.actionType;
      } else if (actionType !== parsed.actionType) {
        throw new Error(
          "Mixed order types in inputs. All orders must be of the same type.",
        );
      }

      if (parsed.isTreasuryAction) {
        treasuryRequests.push({
          destination: datum.destination,
          amount: parsed.amount,
          yield: parsed.yield ?? 0n,
          origin,
          reserve_asset: parsed.reserveAsset!,
        });
      } else {
        requests.push({
          destination: datum.destination,
          amount: parsed.amount,
          origin,
        });
      }
    }

    let action: V0_4Types.ProtocolRedeemer;
    switch (actionType) {
      case "mint":
        action = { Mint: { requests: treasuryRequests } };
        break;
      case "burn":
        action = { Burn: { requests: treasuryRequests } };
        break;
      case "withdraw":
        action = { Withdraw: { requests: treasuryRequests } };
        break;
      case "deposit":
        action = { Deposit: { requests: treasuryRequests } };
        break;
      case "stake":
        action = { Stake: { requests } };
        break;
      case "unstake":
        action = { Unstake: { requests } };
        break;
      default:
        throw new Error("No orders to process");
    }

    const payload: V0_4Types.SignedPayload_ProtocolRedeemer = {
      action,
      nonce,
    };
    const serialized = Data.serialize(
      V0_4Types.SignedPayload_ProtocolRedeemer,
      payload,
    );
    const signedPayload = serialized.toCbor().toString();
    const payloadHash = blake2b_256(HexBlob(signedPayload));

    return { signedPayload, payloadHash };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Execute Orders
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a transaction to execute orders.
   *
   * Handles all 6 action types: mint, burn, deposit, withdraw, stake, unstake.
   * The signedPayload is a CBOR hex string (matching V0.3 style).
   *
   * NOTE: All wallet fee inputs are pre-added to the transaction so that
   * input indices for the ExtraProtocolRedeemer are stable. Coin selection
   * during complete() should be a no-op since all wallet UTxOs are already
   * included, but it cannot be disabled because Blaze also uses that phase
   * to prepare collateral.
   */
  async buildExecuteOrdersTx(params: {
    orderInputs: Core.TransactionInput[];
    signedPayload: string;
    signatures: V0_4Types.Tuple_VerificationKey_COSESign1[];
  }): Promise<TxBuilder> {
    const {
      orderInputs,
      signedPayload: signedPayloadCbor,
      signatures,
    } = params;

    // Deserialize CBOR hex to object for internal use
    const signedPayload = parse(
      V0_4Types.SignedPayload_ProtocolRedeemer,
      PlutusData.fromCbor(HexBlob(signedPayloadCbor)),
    ) as V0_4Types.SignedPayload_ProtocolRedeemer;

    // 1. Sort and resolve order UTxOs
    const sortedOrderInputs = sortOrderInputs(orderInputs);
    const orderUtxos =
      await this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);

    // 2. Parse orders and validate same type
    const orderInfos = this.parseOrderInfos(orderUtxos);
    const actionType = orderInfos[0]!.actionType;

    // 3. Get protocol settings
    const { proxyUtxo, parsedProxyDatum } = await this.getParsedProxyDatum();
    const settings = parsedProxyDatum.settings as Settings;

    // 4. Determine what we need
    const needsTreasury = ["mint", "burn", "withdraw", "deposit"].includes(
      actionType,
    );
    const needsVault = ["stake", "unstake", "deposit"].includes(actionType);

    // 5. Get script reference inputs
    const scriptHashesNeeded: Record<string, Core.Hash28ByteBase16> = {
      protocol: this.protocolScriptHash,
      order: this.orderScriptHash,
    };
    if (needsTreasury) {
      scriptHashesNeeded.treasury = this.treasuryScriptHash;
    }
    if (needsVault) {
      scriptHashesNeeded.stakingVault = this.stakingVaultScriptHash;
    }
    const refInputs = await this.getScriptReferenceInputs(scriptHashesNeeded);

    // 6. Fetch treasury and vault if needed
    let treasuryUtxo: Core.TransactionUnspentOutput | undefined;
    let parsedTreasuryDatum: V0_1TreasuryDatum | undefined;
    if (needsTreasury) {
      const treasuryResult = await this.getTreasuryDatum();
      treasuryUtxo = treasuryResult.treasuryUtxo;
      parsedTreasuryDatum = treasuryResult.parsedTreasuryDatum;
    }

    let vaultUtxo: Core.TransactionUnspentOutput | undefined;
    let parsedVaultDatum: VaultDatum | undefined;
    if (needsVault) {
      const vaultResult = await this.getVaultDatum();
      vaultUtxo = vaultResult.vaultUtxo;
      parsedVaultDatum = vaultResult.parsedVaultDatum;
    }

    // 7. Gather wallet UTxOs so we can include them in index calculations.
    // Blaze's complete() adds wallet inputs for fees, which shifts the
    // ledger-sorted input indices. By fetching wallet UTxOs upfront and
    // adding them explicitly, we know the full input set before computing
    // indices for the ExtraProtocolRedeemer.
    const walletUtxos = await this.blaze.wallet.getUnspentOutputs();
    const excludedInputIds = new Set<string>();
    const utxoKey = (inp: Core.TransactionInput) =>
      `${inp.transactionId().toString()}#${inp.index().toString()}`;
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
    const feeUtxos = walletUtxos.filter(
      (utxo) => !excludedInputIds.has(utxoKey(utxo.input())),
    );

    // 8. Compute input indices (ledger sorts inputs by txHash + outputIndex).
    // Include ALL inputs: order, treasury, vault, AND wallet fee inputs.
    const allInputRefs: Core.TransactionInput[] = orderInfos.map((o) =>
      o.utxo.input(),
    );
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

    const findInputIdx = (input: Core.TransactionInput): bigint => {
      const idx = sortedAllInputRefs.findIndex(
        (r) =>
          r.transactionId().toString() === input.transactionId().toString() &&
          r.index() === input.index(),
      );
      return BigInt(idx);
    };

    const treasuryInputIdx = treasuryUtxo
      ? findInputIdx(treasuryUtxo.input())
      : 0n;
    const vaultInputIdx = vaultUtxo
      ? findInputIdx(vaultUtxo.input())
      : undefined;

    // 8a. Correlate order inputs to signed request indices via origin fields.
    // When all orders are present this produces the same identity mapping as before.
    // When a subset is passed (partial execution), it maps each input to the
    // correct request index in the signed payload.
    const signedRequests = getRequestsFromAction(signedPayload.action);
    const originToRequestIdx = new Map<string, number>();
    for (let i = 0; i < signedRequests.length; i++) {
      const o = signedRequests[i]!.origin;
      originToRequestIdx.set(`${o.transaction_id}#${o.output_index}`, i);
    }

    const inputToRequests: bigint[] = [];
    const requestToOutputs: bigint[] = [];
    for (let outputIdx = 0; outputIdx < orderInfos.length; outputIdx++) {
      const input = orderInfos[outputIdx]!.utxo.input();
      const key = `${input.transactionId()}#${input.index()}`;
      const requestIdx = originToRequestIdx.get(key);
      if (requestIdx === undefined) {
        throw new Error(`Order input ${key} not found in signed payload`);
      }
      inputToRequests.push(BigInt(requestIdx));
      requestToOutputs.push(BigInt(outputIdx));
    }

    // 9. Build outputs and compute output indices
    // Output layout:
    //   [destination outputs] [extra outputs*] [treasury output if needed] [vault output if needed]
    // *extra outputs: yield pot output for deposit with non-zero positive yield
    const numDestOutputs = orderInfos.length;

    // For deposit with positive yield, the yield pot output is inserted after destinations
    let numExtraOutputs = 0;
    if (actionType === "deposit") {
      const totalYield = orderInfos.reduce(
        (sum, o) => sum + (o.yield ?? 0n),
        0n,
      );
      if (totalYield > 0n) {
        // Check if unstaked yield share is > 0
        const vaultValue = vaultUtxo!.output().amount();
        const stablecoinAssetId = Core.AssetId(
          this.stablecoinPolicyId + this.assetNameHex,
        );
        const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
        const treasuryCirculating = parsedTreasuryDatum!.circulating_supply;
        const { unstakedYieldShare } = calculateYieldShares(
          totalYield,
          vaultUSDr,
          treasuryCirculating,
        );
        if (unstakedYieldShare > 0n) {
          numExtraOutputs = 1;
        }
      }
    }

    const treasuryOutputIdx = needsTreasury
      ? BigInt(numDestOutputs + numExtraOutputs)
      : 0n;
    const vaultOutputIdx = needsVault
      ? BigInt(numDestOutputs + numExtraOutputs + (needsTreasury ? 1 : 0))
      : undefined;

    // 10. Build ExtraProtocolRedeemer
    const extra: V0_4Types.ExtraProtocolRedeemer = {
      request_to_outputs: requestToOutputs,
      input_to_requests: inputToRequests,
      treasury_input_idx: treasuryInputIdx,
      treasury_output_idx: treasuryOutputIdx,
      vault_input_idx: vaultInputIdx,
      vault_output_idx: vaultOutputIdx,
    };

    // 11. Build SignedRedeemer (payload is deserialized object in v0_4)
    const serializedSignedRedeemer = Data.serialize(
      V0_4Types.SignedRedeemer_ExtraProtocolRedeemer,
      {
        extra,
        payload: signedPayload,
        signatures,
      },
    );

    const executeRedeemer = Data.serialize(V0_4Types.OrderRedeemer, "Execute");

    const feeUtxoByKey = new Map(
      feeUtxos.map((utxo) => [utxoKey(utxo.input()), utxo]),
    );
    const orderInfoByKey = new Map(
      orderInfos.map((orderInfo) => [
        utxoKey(orderInfo.utxo.input()),
        orderInfo,
      ]),
    );
    const treasuryInputKey = treasuryUtxo
      ? utxoKey(treasuryUtxo.input())
      : null;
    const vaultInputKey = vaultUtxo ? utxoKey(vaultUtxo.input()) : null;
    const spendRedeemerInputs = [
      ...orderInfos.map((orderInfo) => orderInfo.utxo.input()),
    ];
    if (treasuryUtxo) {
      spendRedeemerInputs.push(treasuryUtxo.input());
    }
    if (vaultUtxo) {
      spendRedeemerInputs.push(vaultUtxo.input());
    }

    // 12. Build the transaction
    const tx = this.newOrderTransaction();

    // Add all spend inputs in ledger order so the generated spend redeemer
    // pointers line up with the final transaction input indices.
    for (const inputRef of sortedAllInputRefs) {
      const inputKey = utxoKey(inputRef);
      const orderInfo = orderInfoByKey.get(inputKey);
      if (orderInfo) {
        tx.addInput(orderInfo.utxo, executeRedeemer);
        continue;
      }

      if (treasuryInputKey && inputKey === treasuryInputKey) {
        tx.addInput(treasuryUtxo!, Data.Void());
        continue;
      }

      if (vaultInputKey && inputKey === vaultInputKey) {
        tx.addInput(vaultUtxo!, Data.Void());
        continue;
      }

      const feeUtxo = feeUtxoByKey.get(inputKey);
      if (feeUtxo) {
        tx.addInput(feeUtxo);
        continue;
      }

      throw new Error(
        `buildExecuteOrdersTx: missing input metadata for ${inputKey}`,
      );
    }

    // Add reference inputs
    tx.addReferenceInput(refInputs.protocol!);
    tx.addReferenceInput(refInputs.order!);
    tx.addReferenceInput(proxyUtxo);
    if (refInputs.treasury) {
      tx.addReferenceInput(refInputs.treasury);
    }
    if (refInputs.stakingVault) {
      tx.addReferenceInput(refInputs.stakingVault);
    }

    // Add protocol withdrawal with signed redeemer
    const protocolRewardAccount = Core.RewardAccount.fromCredential(
      {
        type: Core.CredentialType.ScriptHash,
        hash: this.protocolScriptHash,
      },
      this.network,
    );
    tx.addWithdrawal(protocolRewardAccount, 0n, serializedSignedRedeemer);

    // Build per-action-type outputs, minting, and state updates
    const stablecoinAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.assetNameHex,
    );
    const sUSDrAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.sUSDrAssetNameHex,
    );

    switch (actionType) {
      case "mint":
        this.buildMintExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          treasuryUtxo!,
          parsedTreasuryDatum!,
          settings,
        );
        break;
      case "burn":
        this.buildBurnExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          treasuryUtxo!,
          parsedTreasuryDatum!,
          settings,
        );
        break;
      case "withdraw":
        this.buildWithdrawExecute(
          tx,
          orderInfos,
          treasuryUtxo!,
          parsedTreasuryDatum!,
          settings,
        );
        break;
      case "deposit":
        this.buildDepositExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          treasuryUtxo!,
          parsedTreasuryDatum!,
          vaultUtxo!,
          parsedVaultDatum!,
          settings,
        );
        break;
      case "stake":
        this.buildStakeExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          sUSDrAssetId,
          vaultUtxo!,
          parsedVaultDatum!,
        );
        break;
      case "unstake":
        this.buildUnstakeExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          sUSDrAssetId,
          vaultUtxo!,
          parsedVaultDatum!,
        );
        break;
    }

    // Provide the mint proxy script for minting
    tx.provideScript(this.mintProxyScript);
    this.realignSpendRedeemerIndices(tx, spendRedeemerInputs);

    return tx;
  }

  private realignSpendRedeemerIndices(
    tx: TxBuilder,
    spendRedeemerInputs: Core.TransactionInput[],
  ): void {
    const txInternals = tx as unknown as ITxBuilderWithInternals;
    const bodyInputs = txInternals.body.inputs().values();
    const redeemers = [...txInternals.redeemers.values()];
    const spendRedeemers = redeemers
      .filter((redeemer) => redeemer.tag() === Core.RedeemerTag.Spend)
      .sort((a, b) => Number(a.index() - b.index()));

    if (spendRedeemers.length !== spendRedeemerInputs.length) {
      throw new Error(
        `buildExecuteOrdersTx: spend redeemer count mismatch. inputs=${spendRedeemerInputs.length} redeemers=${spendRedeemers.length}`,
      );
    }

    const expectedOrdering = [...spendRedeemerInputs].sort((a, b) =>
      toSpendOrderingKey(a).localeCompare(toSpendOrderingKey(b)),
    );

    for (let i = 0; i < spendRedeemers.length; i++) {
      const input = expectedOrdering[i]!;
      const actualIndex = bodyInputs.findIndex(
        (bodyInput) =>
          bodyInput.transactionId().toString() ===
            input.transactionId().toString() &&
          bodyInput.index() === input.index(),
      );

      if (actualIndex < 0) {
        throw new Error(
          `buildExecuteOrdersTx: could not find spend input ${input.transactionId().toString()}#${input.index().toString()} in tx body`,
        );
      }

      spendRedeemers[i]!.setIndex(BigInt(actualIndex));
    }

    txInternals.redeemers.setValues(redeemers);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-Action Execute Builders
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint: reserve goes to treasury, USDr minted to destinations.
   */
  private buildMintExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    settings: Settings,
  ): void {
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send USDr to each destination
    for (const orderInfo of orderInfos) {
      addDestinationOutput(
        tx,
        this.network,
        orderInfo.datum.destination,
        makeValue(MIN_LOVELACE, [stablecoinAssetId, orderInfo.amount]),
      );
    }

    // Mint USDr
    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.assetNameHex), totalAmount]]),
      Data.Void(),
    );

    // Compute per-reserve-asset deltas
    const reserveDeltas = computeReserveDeltas(orderInfos, settings);
    this.updateTreasuryOutput(
      tx,
      treasuryUtxo,
      parsedTreasuryDatum,
      reserveDeltas,
      totalAmount,
    );
  }

  /**
   * Burn: USDr burned, reserve sent to destinations.
   */
  private buildBurnExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    settings: Settings,
  ): void {
    // Amount is negative in datum for burns
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send reserve tokens to each destination
    // Convert USDr amount to reserve amount using floor division (protocol-protective)
    for (const orderInfo of orderInfos) {
      const ra = findReserveAsset(settings, orderInfo.reserveAsset!);
      const reserveAssetId = Core.AssetId(
        orderInfo.reserveAsset![0] + orderInfo.reserveAsset![1],
      );
      const reserveAmount = usdrToReserve(-orderInfo.amount, ra);
      addDestinationOutput(
        tx,
        this.network,
        orderInfo.datum.destination,
        makeValue(MIN_LOVELACE, [reserveAssetId, reserveAmount]),
      );
    }

    // Burn USDr (totalAmount is negative)
    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.assetNameHex), totalAmount]]),
      Data.Void(),
    );

    // Compute per-reserve-asset deltas
    const reserveDeltas = computeReserveDeltas(orderInfos, settings);
    this.updateTreasuryOutput(
      tx,
      treasuryUtxo,
      parsedTreasuryDatum,
      reserveDeltas,
      totalAmount,
    );
  }

  /**
   * Withdraw: reserve sent to destinations, no mint/burn.
   */
  private buildWithdrawExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    settings: Settings,
  ): void {
    // Destination outputs: send reserve tokens to each destination
    // Convert USDr amount to reserve amount using floor division
    for (const orderInfo of orderInfos) {
      const ra = findReserveAsset(settings, orderInfo.reserveAsset!);
      const reserveAssetId = Core.AssetId(
        orderInfo.reserveAsset![0] + orderInfo.reserveAsset![1],
      );
      const reserveAmount = usdrToReserve(orderInfo.amount, ra);
      addDestinationOutput(
        tx,
        this.network,
        orderInfo.datum.destination,
        makeValue(MIN_LOVELACE, [reserveAssetId, reserveAmount]),
      );
    }

    // Update treasury: reserve decreases, no circulating_supply change
    // On-chain: amount_sign = -1 for withdraw, expected_delta = usdr_to_reserve(-amount, ra)
    const reserveDeltas = computeReserveDeltas(orderInfos, settings, true);
    this.updateTreasuryOutput(
      tx,
      treasuryUtxo,
      parsedTreasuryDatum,
      reserveDeltas,
      0n,
    );
  }

  /**
   * Deposit: reserve deposited, interest USDr minted and split between vault and yield pot.
   */
  private buildDepositExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatum,
    settings: Settings,
  ): void {
    const totalYield = orderInfos.reduce((sum, o) => sum + (o.yield ?? 0n), 0n);

    // Destination outputs: min ADA to each destination (contract validates via request_to_outputs)
    for (const orderInfo of orderInfos) {
      addDestinationOutput(
        tx,
        this.network,
        orderInfo.datum.destination,
        makeValue(MIN_LOVELACE),
      );
    }

    // Calculate yield split matching on-chain deposit.ak logic
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const treasuryCirculating = parsedTreasuryDatum.circulating_supply;

    const { stakedYieldShare, unstakedYieldShare } = calculateYieldShares(
      totalYield,
      vaultUSDr,
      treasuryCirculating,
    );

    if (totalYield > 0n) {
      // Positive yield: mint USDr for the yield amount
      tx.addMint(
        this.stablecoinPolicyId,
        new Map([[Core.AssetName(this.assetNameHex), totalYield]]),
        Data.Void(),
      );

      // Send unstaked yield share to the yield pot address
      if (unstakedYieldShare > 0n) {
        addDestinationOutput(
          tx,
          this.network,
          {
            address: settings.unstaked_yield_pot,
            datum: "NoDatum",
          },
          makeValue(MIN_LOVELACE, [stablecoinAssetId, unstakedYieldShare]),
        );
      }
    } else if (totalYield < 0n) {
      // Negative yield: burn USDr (sourced from order inputs already consumed)
      tx.addMint(
        this.stablecoinPolicyId,
        new Map([[Core.AssetName(this.assetNameHex), totalYield]]),
        Data.Void(),
      );
    }
    // totalYield === 0n: no mint/burn needed

    // Update treasury: reserve increases, circulating_supply changes by yield.
    // For positive yield, treasury receives reserve backing for BOTH principal AND yield.
    // For negative yield, treasury only receives reserve backing for principal.
    const reserveDeltas = new Map<string, bigint>();
    for (const orderInfo of orderInfos) {
      const assetId = orderInfo.reserveAsset![0] + orderInfo.reserveAsset![1];
      const ra = findReserveAsset(settings, orderInfo.reserveAsset!);
      const yieldValue = orderInfo.yield ?? 0n;

      // Calculate USDr backing needed based on yield sign
      const usdrBacking =
        yieldValue >= 0n
          ? orderInfo.amount + yieldValue // principal + yield for positive yield
          : orderInfo.amount; // just principal for negative yield

      // Convert USDr backing to reserve amount
      const reserveAmount = usdrToReserve(usdrBacking, ra);

      reserveDeltas.set(
        assetId,
        (reserveDeltas.get(assetId) ?? 0n) + reserveAmount,
      );
    }
    this.updateTreasuryOutput(
      tx,
      treasuryUtxo,
      parsedTreasuryDatum,
      reserveDeltas,
      totalYield,
    );

    // Update vault: sUSDr unchanged, USDr changes by staked yield share
    this.updateVaultOutput(
      tx,
      vaultUtxo,
      parsedVaultDatum,
      0n,
      stakedYieldShare,
    );
  }

  /**
   * Stake: USDr locked in vault, sUSDr minted to destinations.
   */
  private buildStakeExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    sUSDrAssetId: Core.AssetId,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatum,
  ): void {
    const totalUSDrStaked = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Calculate vault USDr balance
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const circulatingSUSDr = parsedVaultDatum.circulating_susdr;

    // Calculate total sUSDr to mint using batch formula (matches on-chain stake.ak)
    // On-chain: susdr_to_mint = total_usdr_staked * circulating_susdr_before / vault_usdr_before
    let totalSUSDrMinted: bigint;
    if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
      totalSUSDrMinted = totalUSDrStaked;
    } else {
      totalSUSDrMinted = (totalUSDrStaked * circulatingSUSDr) / vaultUSDr;
    }

    // Calculate per-order sUSDr for destination outputs (matches validate_stake_outputs).
    // Note: sum(per-order floors) may be less than totalSUSDrMinted by at most (n-1) units
    // due to floor(sum) >= sum(floor). The difference ("dust") is minted but not assigned
    // to any destination output — it ends up in the executor's change output. This is an
    // inherent consequence of the on-chain contract requiring both aggregate mint equality
    // and per-request floor equality on outputs.
    for (const orderInfo of orderInfos) {
      let sUSDrAmount: bigint;
      if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
        sUSDrAmount = orderInfo.amount;
      } else {
        sUSDrAmount = (orderInfo.amount * circulatingSUSDr) / vaultUSDr;
      }

      addDestinationOutput(
        tx,
        this.network,
        orderInfo.datum.destination,
        makeValue(MIN_LOVELACE, [sUSDrAssetId, sUSDrAmount]),
      );
    }

    // Mint sUSDr
    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.sUSDrAssetNameHex), totalSUSDrMinted]]),
      Data.Void(),
    );

    // Update vault: USDr increases by staked amount, circulating_susdr increases
    this.updateVaultOutput(
      tx,
      vaultUtxo,
      parsedVaultDatum,
      totalSUSDrMinted,
      totalUSDrStaked,
    );
  }

  /**
   * Unstake: sUSDr burned, USDr sent to user's destination address.
   */
  private buildUnstakeExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    sUSDrAssetId: Core.AssetId,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatum,
  ): void {
    const totalSUSDrBurned = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Calculate vault USDr balance
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const circulatingSUSDr = parsedVaultDatum.circulating_susdr;

    if (circulatingSUSDr === 0n) {
      throw new Error("Cannot unstake: no sUSDr in circulation");
    }

    // Calculate USDr to release for each order
    let totalUSDrReleased = 0n;
    for (const orderInfo of orderInfos) {
      const uSDrAmount = (orderInfo.amount * vaultUSDr) / circulatingSUSDr;
      totalUSDrReleased += uSDrAmount;

      // Send USDr to the destination (native script timelock address).
      // Use an explicit output because lockAssets requires a datum, but the
      // contract expects NoDatum.
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      const output = new Core.TransactionOutput(
        destAddress,
        makeValue(MIN_LOVELACE, [stablecoinAssetId, uSDrAmount]),
      );
      tx.addOutput(output);
    }

    // Burn sUSDr
    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.sUSDrAssetNameHex), -totalSUSDrBurned]]),
      Data.Void(),
    );

    // Update vault: USDr decreases, circulating_susdr decreases
    this.updateVaultOutput(
      tx,
      vaultUtxo,
      parsedVaultDatum,
      -totalSUSDrBurned,
      -totalUSDrReleased,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Cancel Orders
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build a transaction to cancel orders.
   */
  async buildCancelOrdersTx(params: {
    orderInputs: Core.TransactionInput[];
    destination?: Core.Address;
    /**
     * Optional set of key hashes that the caller can sign with.
     * When provided, only these keys are added as required signers —
     * essential for AnyOf/AtLeast multisig owners where not all keys
     * need to sign. When omitted, all extracted key hashes are added
     * (correct for Signature and AllOf owners, but over-constrains
     * AnyOf/AtLeast).
     */
    availableSigners?: Set<string>;
    versionHint?: TProtocolVersion; // version of the orders to cancel. Optional, only to ensure correct datum parsing.
  }): Promise<TxBuilder> {
    const { orderInputs, destination, availableSigners, versionHint } = params;

    const orderUtxos =
      await this.blaze.provider.resolveUnspentOutputs(orderInputs);

    if (orderUtxos.length === 0) {
      throw new Error("No orders to cancel");
    }

    const cachedOrderRefs = this.cachedReferenceInputs.orderRefInput
      ? new Map([
          [this.orderScriptHash, this.cachedReferenceInputs.orderRefInput],
        ])
      : undefined;

    const orderRefInputs = await resolveOrderReferenceInputs(
      this.blaze,
      orderUtxos,
      cachedOrderRefs,
      this.scriptDeploymentAddress,
    );

    const cancelRedeemer = Data.serialize(V0_4Types.OrderRedeemer, "Cancel");
    const destAddress =
      destination ?? (await this.blaze.wallet.getChangeAddress());

    const tx = this.newOrderTransaction();

    for (const orderRefInput of orderRefInputs.values()) {
      tx.addReferenceInput(orderRefInput);
    }

    // cache current version of order script reference input
    const currentOrderRefInput = orderRefInputs.get(this.orderScriptHash);
    if (currentOrderRefInput && !this.cachedReferenceInputs.orderRefInput) {
      this.cachedReferenceInputs.orderRefInput = currentOrderRefInput;
    }

    const requiredSigners = new Set<string>();

    for (const utxo of orderUtxos) {
      const owner = await parseCancelOwner(utxo, versionHint);
      for (const keyHash of getSignatureKeyHashesFromMultisigScript(owner)) {
        requiredSigners.add(keyHash);
      }

      tx.addInput(utxo, cancelRedeemer);
      const outputValue = utxo.output().amount();
      addDirectOutput(tx, destAddress, outputValue);
    }

    const effectiveSigners = availableSigners
      ? new Set([...requiredSigners].filter((k) => availableSigners.has(k)))
      : requiredSigners;

    for (const keyHash of effectiveSigners) {
      tx.addRequiredSigner(Ed25519KeyHashHex(keyHash));
    }

    return tx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Parse order UTxOs into IOrderInfo objects and validate they are all the same type.
   */
  private parseOrderInfos(
    orderUtxos: Core.TransactionUnspentOutput[],
  ): IOrderInfo[] {
    const orderInfos: IOrderInfo[] = [];
    let expectedActionType: TOrderActionType | null = null;

    for (const utxo of orderUtxos) {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(V0_4Types.OrderDatum, datumData) as OrderDatum;
      const classified = this.classifyOrderAction(datum);

      if (expectedActionType === null) {
        expectedActionType = classified.actionType;
      } else if (expectedActionType !== classified.actionType) {
        throw new Error(
          "Mixed order types in inputs. All orders must be of the same type.",
        );
      }

      orderInfos.push({
        utxo,
        datum,
        actionType: classified.actionType,
        amount: classified.amount,
        yield: classified.yield,
        reserveAsset: classified.reserveAsset,
      });
    }

    if (orderInfos.length === 0) {
      throw new Error("No orders to execute");
    }

    return orderInfos;
  }

  /**
   * Classify an order action from its datum.
   */
  private classifyOrderAction(datum: OrderDatum): {
    actionType: TOrderActionType;
    amount: bigint;
    yield?: bigint;
    reserveAsset?: [string, string];
    isTreasuryAction: boolean;
  } {
    const action = datum.action;
    if ("OMint" in action) {
      return {
        actionType: "mint",
        amount: action.OMint.amount,
        reserveAsset: action.OMint.reserve_asset,
        isTreasuryAction: true,
      };
    } else if ("ORedeem" in action) {
      return {
        actionType: "burn",
        // ORedeem.amount is positive (absolute value locked in order UTxO).
        // Negate it so the request.amount is negative for burn (USDr leaving circulation),
        // matching the contract's expectation: ORedeem.amount == -request.amount.
        amount: -action.ORedeem.amount,
        reserveAsset: action.ORedeem.reserve_asset,
        isTreasuryAction: true,
      };
    } else if ("ODeposit" in action) {
      return {
        actionType: "deposit",
        amount: action.ODeposit.principal,
        yield: action.ODeposit.yield,
        reserveAsset: action.ODeposit.reserve_asset,
        isTreasuryAction: true,
      };
    } else if ("OWithdraw" in action) {
      return {
        actionType: "withdraw",
        amount: action.OWithdraw.amount,
        reserveAsset: action.OWithdraw.reserve_asset,
        isTreasuryAction: true,
      };
    } else if ("OStake" in action) {
      return {
        actionType: "stake",
        amount: action.OStake.amount,
        isTreasuryAction: false,
      };
    } else if ("OUnstake" in action) {
      return {
        actionType: "unstake",
        amount: action.OUnstake.amount,
        isTreasuryAction: false,
      };
    }
    throw new Error("Unknown order action type");
  }

  /**
   * Update treasury output with new reserve and circulating supply.
   */
  private updateTreasuryOutput(
    tx: TxBuilder,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    reserveDeltas: Map<string, bigint>,
    circulatingSupplyDelta: bigint,
  ): void {
    const newTreasuryDatum: V0_1TreasuryDatum = {
      circulating_supply:
        parsedTreasuryDatum.circulating_supply + circulatingSupplyDelta,
    };
    const serializedTreasuryDatum = Data.serialize(
      V0_1TreasuryDatum,
      newTreasuryDatum,
    );

    const treasuryValue = treasuryUtxo.output().amount();

    // Start with ADA + treasury NFT
    let newTreasuryValue = makeValue(treasuryValue.coin(), [
      this.treasuryNFTAssetId,
      1n,
    ]);

    // Apply all reserve asset deltas
    const modifiedAssetIds = new Set<string>([
      this.treasuryNFTAssetId.toString(),
    ]);
    for (const [reserveAssetId, delta] of reserveDeltas.entries()) {
      const currentReserve =
        treasuryValue.multiasset()?.get(Core.AssetId(reserveAssetId)) ?? 0n;
      const newReserve = currentReserve + delta;
      newTreasuryValue = Value.merge(
        newTreasuryValue,
        makeValue(0n, [Core.AssetId(reserveAssetId), newReserve]),
      );
      modifiedAssetIds.add(reserveAssetId);
    }

    // Preserve any other assets not modified
    const existingMultiasset = treasuryValue.multiasset();
    if (existingMultiasset) {
      for (const [assetId, amount] of existingMultiasset.entries()) {
        if (!modifiedAssetIds.has(assetId)) {
          newTreasuryValue = Value.merge(
            newTreasuryValue,
            makeValue(0n, [Core.AssetId(assetId), amount]),
          );
        }
      }
    }
    tx.lockAssets(
      this.treasuryAddress,
      newTreasuryValue,
      serializedTreasuryDatum,
    );
  }

  /**
   * Update vault output with new circulating_susdr and USDr balance.
   */
  private updateVaultOutput(
    tx: TxBuilder,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatum,
    sUSDrDelta: bigint,
    uSDrDelta: bigint = 0n,
  ): void {
    const newVaultDatum: VaultDatum = {
      circulating_susdr: parsedVaultDatum.circulating_susdr + sUSDrDelta,
    };
    const serializedVaultDatum = Data.serialize(
      V0_4Types.VaultDatum,
      newVaultDatum,
    );

    const stablecoinAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.assetNameHex,
    );

    // Start with existing vault value, then adjust USDr
    let newVaultValue = vaultUtxo.output().amount();
    if (uSDrDelta !== 0n) {
      const currentUSDr =
        newVaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
      const newUSDr = currentUSDr + uSDrDelta;
      newVaultValue = makeValue(newVaultValue.coin(), [
        this.stakingVaultNFTAssetId,
        1n,
      ]);
      if (newUSDr > 0n) {
        newVaultValue = Value.merge(
          newVaultValue,
          makeValue(0n, [stablecoinAssetId, newUSDr]),
        );
      }
      // Preserve any other assets from the original vault
      const existingMultiasset = vaultUtxo.output().amount().multiasset();
      if (existingMultiasset) {
        for (const [assetId, amount] of existingMultiasset.entries()) {
          if (
            assetId !== this.stakingVaultNFTAssetId.toString() &&
            assetId !== stablecoinAssetId.toString()
          ) {
            newVaultValue = Value.merge(
              newVaultValue,
              makeValue(0n, [Core.AssetId(assetId), amount]),
            );
          }
        }
      }
    }

    tx.lockAssets(
      this.stakingVaultAddress,
      newVaultValue,
      serializedVaultDatum,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reserve Asset Conversion Utilities
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Get protocol settings from proxy datum (cached).
   */
  private async getVersionSettings(): Promise<Settings> {
    const { parsedProxyDatum } = await this.getParsedProxyDatum();
    return parsedProxyDatum.settings as Settings;
  }
}
