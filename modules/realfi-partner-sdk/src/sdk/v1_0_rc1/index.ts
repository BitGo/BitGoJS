import {
  addressFromValidator,
  blake2b_256,
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
  type Wallet,
} from "@blaze-cardano/sdk";

import {
  BaseTypes,
  V0_1Types,
  V0_4Types,
  V1_0Rc1Types,
} from "../../generated-types/index.js";
import type { TreasuryDatum as V0_1TreasuryDatum } from "../../generated-types/v0_1/index.js";
import type {
  Destination,
  MultisigScript,
  OrderDatumV1,
  RegistryV1,
  SettingsV1,
  VaultDatumV1,
} from "../../generated-types/v1_0_rc1/index.js";

import {
  addDirectOutput,
  buildNonceFromUtxo,
  buildMultisigTimelockNativeScript,
  buildTimelockDestination,
  buildUnstakeMetadatum,
  UNSTAKE_METADATA_LABEL,
  destinationToAddress,
  findReserveAsset,
  usdrToReserve,
  usdrToReserveCeil,
  computeReserveDeltas,
  sortOrderInputs,
} from "../shared/index.js";
import {
  calculateYieldShares,
  MIN_LOVELACE,
  RealfiSDKV1Family,
  type IBuildStakeContinuationParams,
  type IStakeContinuation,
  type IOrderInfo,
  type TOrderActionType,
} from "../v1/family.js";
import { screenDepositBatch } from "../v1/order-sanity.js";
import type { TV1SettingsConfig } from "../v1/types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sentinel `reserve_asset` used in V1_0_Rc1 TreasuryRequestV1 redeemers for
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
export const DIRECT_ACTION_PADDING_ASSET: V1_0Rc1Types.Asset = [
  "00".repeat(28),
  toHex(new TextEncoder().encode("unused")),
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ITreasuryUnstakeOrderTxResultRc1 {
  /** Transaction builder for the treasury unstake order. */
  tx: TxBuilder;
  /**
   * Native script used as the unstake output destination:
   * AllOf { After(unlockSlot), owner }.
   */
  nativeScript: Core.NativeScript;
}

/**
 * Extract the requests list from a signed payload action, regardless of action type.
 * Both TreasuryRequestV1 and RequestV1 have `origin: { transaction_id, output_index }`.
 */
function getRequestsFromAction(
  action: V1_0Rc1Types.ProtocolRedeemerV1,
): Array<{ origin: { transaction_id: string; output_index: bigint } }> {
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IRealfiSDKParamsV1_0Rc1 {
  version: "V1_0_Rc1";
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
   * Use V0.1 treasury script instead of V1.0.
   * This is needed for protocol-only upgrades where the treasury NFT
   * remains at the V0.1 treasury address. Default: false
   */
  useV0_1Treasury?: boolean;
  /**
   * Use V0.4 staking vault script instead of V1.0.
   * This is needed for protocol-only upgrades where the vault NFT
   * remains at the V0.4 vault address. Default: false
   */
  useV0_4StakingVault?: boolean;
  /**
   * Hashes of the validators this deployment actually runs. See
   * IV1FamilyConstructorParams.deployedValidators.
   */
  deployedValidators?: Readonly<Record<string, string>>;
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
  clientSource?: import("../shared/client-id.js").TClientSource;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * V1_0Rc1 SDK implementation.
 *
 * Extends V0_4 with:
 * - DirectMint/DirectBurn: Mint/burn USDr without reserve asset flow (for fiat wire scenarios)
 * - Invalidated redeemer: Allow order owners to recover funds when protocol is upgraded
 * - Forfeit parameter: Support yield forfeiture during unstake operations
 * - New Settings fields: direct_mint_permission, direct_burn_permission
 *
 * Scaffolding (scripts, deploy/register, treasury, vault, one-shot, cancel,
 * invalidate) is inherited from {@link RealfiSDKV1Family}. The release
 * candidate's protocol redeemer schema is structurally different from v1_0
 * (`TreasuryRequestV1[]` + `RequestV1[]`, no fees, no `min_received`), so the
 * order builders, signed-payload construction, and execute builders override
 * the family's v1_0-semantics defaults with the rc1 behavior verbatim. No
 * signing schemas are passed to the family constructor — both consumers are
 * overridden here.
 */
export class RealfiSDKV1_0Rc1<
  P extends Provider,
  W extends Wallet,
> extends RealfiSDKV1Family<P, W, SettingsV1, VaultDatumV1> {
  readonly version = "V1_0_Rc1" as const;

  /**
   * Create a V1_0Rc1 SDK instance.
   */
  static create<P extends Provider, W extends Wallet>(
    blaze: Blaze<P, W>,
    params: IRealfiSDKParamsV1_0Rc1,
  ): RealfiSDKV1_0Rc1<P, W> {
    const enableTrace = params.enableTrace ?? false;

    // 1. Create oneshot script
    const oneShotScript = new BaseTypes.BaseOneshotOneshotMint(
      {
        transaction_id: params.proxyBootstrap.txHash,
        output_index: params.proxyBootstrap.outputIndex,
      },
      enableTrace,
    ).Script;
    const oneShotPolicyId = oneShotScript.hash();

    // 2. Create sub-validator scripts first (they only need proxy policy)
    const protocolMintScript =
      new V1_0Rc1Types.V1_0Rc1ProtocolMintProtocolMintWithdraw(
        oneShotPolicyId,
        enableTrace,
      ).Script;

    const protocolStakeScript =
      new V1_0Rc1Types.V1_0Rc1ProtocolStakeProtocolStakeWithdraw(
        oneShotPolicyId,
        enableTrace,
      ).Script;

    const protocolManagementScript =
      new V1_0Rc1Types.V1_0Rc1ProtocolManagementProtocolManagementWithdraw(
        oneShotPolicyId,
        enableTrace,
      ).Script;

    // 3. Create orchestrator with sub-validator hashes
    const protocolOrchestratorScript =
      new V1_0Rc1Types.V1_0Rc1ProtocolOrchestratorProtocolOrchestratorWithdraw(
        oneShotPolicyId,
        protocolMintScript.hash(),
        protocolStakeScript.hash(),
        protocolManagementScript.hash(),
        enableTrace,
      ).Script;

    const mintProxyScript = new BaseTypes.BaseMintProxyMintProxyMint(
      oneShotPolicyId,
      enableTrace,
    ).Script;

    // Use V0.1 or V1.0 treasury script based on option
    // V0.1 is needed for protocol-only upgrades where treasury stays at V0.1 address
    const treasuryScript = params.useV0_1Treasury
      ? new V0_1Types.V0_1TreasuryTreasurySpend(
          {
            transaction_id: params.treasuryBootstrap.txHash,
            output_index: params.treasuryBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script
      : new V1_0Rc1Types.V1_0Rc1TreasuryTreasurySpend(
          {
            transaction_id: params.treasuryBootstrap.txHash,
            output_index: params.treasuryBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script;

    // 4. Create order script with orchestrator hash (order needs to know the protocol)
    const orderScript = new V1_0Rc1Types.V1_0Rc1OrderOrderSpend(
      oneShotPolicyId,
      protocolOrchestratorScript.hash(),
      enableTrace,
    ).Script;

    // Use V0.4 or V1.0 staking vault script based on option
    // V0.4 is needed for protocol-only upgrades where vault stays at V0.4 address
    const stakingVaultScript = params.useV0_4StakingVault
      ? new V0_4Types.V0_4StakingVaultStakingVaultSpend(
          {
            transaction_id: params.stakingVaultBootstrap.txHash,
            output_index: params.stakingVaultBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script
      : new V1_0Rc1Types.V1_0Rc1StakingVaultStakingVaultSpend(
          {
            transaction_id: params.stakingVaultBootstrap.txHash,
            output_index: params.stakingVaultBootstrap.outputIndex,
          },
          oneShotPolicyId,
          enableTrace,
        ).Script;

    return new RealfiSDKV1_0Rc1(
      blaze,
      {
        version: "V1_0_Rc1",
        proxyBootstrap: params.proxyBootstrap,
        assetNameHex: params.assetNameHex,
        sUSDrAssetNameHex: params.sUSDrAssetNameHex,
        enableTrace,
        scriptDeploymentAddress: params.scriptDeploymentAddress,
        clientSource: params.clientSource,
        deployedValidators: params.deployedValidators,
      },
      V1_0Rc1Types,
      {
        oneShotScript,
        protocolOrchestratorScript,
        protocolMintScript,
        protocolStakeScript,
        protocolManagementScript,
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
  // Version Seams
  // ─────────────────────────────────────────────────────────────────────────────

  protected settingsConfig(settings: SettingsV1): TV1SettingsConfig {
    // V1_0_Rc1 settings are flat: the settings object IS the config.
    return settings;
  }

  protected settingsRegistry(settings: SettingsV1): RegistryV1 {
    return settings.registry;
  }

  protected buildInitialVaultDatum(): VaultDatumV1 {
    return { circulating_susdr: 0n };
  }

  protected buildUpdatedVaultDatum(
    previous: VaultDatumV1,
    sUSDrDelta: bigint,
  ): VaultDatumV1 {
    return { circulating_susdr: previous.circulating_susdr + sUSDrDelta };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Order Builder Methods (rc1 order datums carry no min_received)
  // ─────────────────────────────────────────────────────────────────────────────

  override async buildStakeContinuation(
    _params: IBuildStakeContinuationParams,
  ): Promise<IStakeContinuation> {
    throw new Error(
      "Stake continuations are not supported on V1_0_Rc1 because its order schema has no min_received",
    );
  }

  /**
   * Internal helper to build an order transaction.
   */
  protected override async _buildOrderTx(params: {
    action: V1_0Rc1Types.OrderActionV1;
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
      owner = {
        Signature: {
          key_hash: (await this.blaze.wallet.getChangeAddress())
            .getProps()
            .paymentPart!.hash!.toString(),
        },
      };
    }

    const orderDatum: OrderDatumV1 = {
      action: params.action,
      owner,
      destination: params.destination,
      data: params.data ?? Data.Void(),
    };
    const serializedDatum = Data.serialize(
      V1_0Rc1Types.OrderDatumV1,
      orderDatum,
    );

    const tx = this.newOrderTransaction(params.extraLabels);
    tx.lockAssets(orderContractAddress, params.valueToLock, serializedDatum);
    return tx;
  }

  /**
   * Build a mint order: lock reserve tokens, request USDr minting.
   */
  override async buildMintOrderTx(params: {
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
  override async buildRedeemOrderTx(params: {
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
   * Build a stake order: lock USDr, request sUSDr minting.
   */
  override async buildStakeOrderTx(params: {
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

  protected override async _buildUnstakeOrderTx(params: {
    amount: bigint;
    destination: Destination;
    forfeit?: bigint;
    owner?: MultisigScript;
    data?: PlutusData;
    extraLabels?: Map<bigint, Core.Metadatum>;
  }): Promise<TxBuilder> {
    if (params.amount <= 0n) {
      throw new Error("Unstake amount must be positive");
    }
    const forfeit = params.forfeit ?? 0n;
    if (forfeit < 0n) {
      throw new Error("Forfeit amount cannot be negative");
    }

    const sUSDrAssetId = Core.AssetId(
      this.stablecoinPolicyId + this.sUSDrAssetNameHex,
    );

    return this._buildOrderTx({
      action: { OUnstake: { amount: params.amount, forfeit } },
      valueToLock: makeValue(MIN_LOVELACE, [sUSDrAssetId, params.amount]),
      owner: params.owner,
      destination: params.destination,
      data: params.data,
      extraLabels: params.extraLabels,
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
   */
  override async buildUnstakeOrderTx(params: {
    amount: bigint;
    destination: Destination;
    unlockSlot: bigint;
    forfeit?: bigint;
    owner?: MultisigScript;
    data?: PlutusData;
  }): Promise<TxBuilder> {
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

    return this._buildUnstakeOrderTx({
      amount: params.amount,
      destination: timelockDestination,
      forfeit: params.forfeit,
      owner: params.owner,
      data: params.data,
      extraLabels,
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
  override async buildTreasuryUnstakeOrderTx(params: {
    amount: bigint;
    destination: Destination;
    unlockSlot: bigint;
    forfeit?: bigint;
    owner: MultisigScript;
    data?: PlutusData;
  }): Promise<ITreasuryUnstakeOrderTxResultRc1> {
    const nativeScript = buildMultisigTimelockNativeScript(
      params.owner,
      params.unlockSlot,
    );
    const timelockDestination: Destination = {
      address: {
        payment_credential: { Script: [nativeScript.hash()] },
        stake_credential: params.destination.address.stake_credential,
      },
      datum: "NoDatum",
    };

    // Attach the unstake metadata (label 55534472) exactly like the retail
    // path (buildUnstakeOrderTx). track-chain requires this label to index the
    // order; without it the confirmed unstake output is silently dropped
    // (WTB-1466). Mirror retail precisely: the metadatum is built from the
    // user-supplied destination (params.destination), not the derived timelock
    // destination, and carries the same unlock_time.
    const extraLabels = new Map<bigint, Core.Metadatum>([
      [
        UNSTAKE_METADATA_LABEL,
        buildUnstakeMetadatum(params.destination, params.unlockSlot),
      ],
    ]);

    const tx = await this._buildUnstakeOrderTx({
      amount: params.amount,
      destination: timelockDestination,
      forfeit: params.forfeit,
      owner: params.owner,
      data: params.data,
      extraLabels,
    });

    return { tx, nativeScript };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Signed Payload and Signing
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Build the V1_0Rc1 SignedPayload_ProtocolRedeemer from order inputs.
   * Returns both the CBOR hex string (for buildExecuteOrdersTx) and
   * the blake2b_256 hash (for CIP-30 signing).
   */
  override async getSignedPayloadFromOrderInputs(
    orderInputs: Core.TransactionInput[],
  ): Promise<{ signedPayload: string; payloadHash: string }> {
    if (orderInputs.length === 0) {
      throw new Error("At least one order input is required");
    }

    const sortedInputs = sortOrderInputs(orderInputs);
    const nonce = buildNonceFromUtxo(sortedInputs[0]!) as V1_0Rc1Types.Nonce;

    const resolvedUtxos =
      await this.blaze.provider.resolveUnspentOutputs(sortedInputs);

    let actionType: TOrderActionType | null = null;
    const treasuryRequests: V1_0Rc1Types.TreasuryRequestV1[] = [];
    const requests: V1_0Rc1Types.RequestV1[] = [];

    for (const utxo of resolvedUtxos) {
      const datumData = utxo.output().datum()?.asInlineData();
      if (!datumData) {
        throw new Error("Order UTXO has no inline datum");
      }
      const datum = parse(V1_0Rc1Types.OrderDatumV1, datumData) as OrderDatumV1;
      const origin = {
        transaction_id: utxo.input().transactionId().toString(),
        output_index: utxo.input().index(),
      };

      const parsed = this.classifyOrderAction(datum);

      // WTB-1764: same screen the family applies. rc1 has no min_received, but
      // its predicates still demand an amount sign (`v1_0_rc1/stake.ak:64`,
      // `unstake.ak:64`) and every one of them is an `expect` inside a single
      // fold, so a request that fails takes the whole transaction with it.
      const screened = await this.screenOrderForExecution(utxo, parsed);
      if (!screened.ok) {
        throw new Error(
          `Order ${origin.transaction_id}#${origin.output_index} cannot be executed: ` +
            `${screened.reason}. Every order batched with it would crash on-chain.`,
        );
      }

      if (actionType === null) {
        actionType = parsed.actionType;
      } else if (actionType !== parsed.actionType) {
        throw new Error(
          "Mixed order types in inputs. All orders must be of the same type.",
        );
      }

      if (parsed.isTreasuryAction) {
        // DirectMint/DirectBurn datums have no reserve_asset; the redeemer
        // struct requires one but the on-chain validator ignores it for
        // direct actions, so we pad with DIRECT_ACTION_PADDING_ASSET.
        const reserveAsset = parsed.reserveAsset ?? DIRECT_ACTION_PADDING_ASSET;
        treasuryRequests.push({
          destination: datum.destination,
          amount: parsed.amount,
          yield: parsed.yield ?? 0n,
          origin,
          reserve_asset: reserveAsset,
        });
      } else {
        requests.push({
          destination: datum.destination,
          amount: parsed.amount,
          origin,
          forfeit: parsed.forfeit ?? 0n,
        });
      }
    }

    if (actionType === "deposit") {
      const batchVerdict = screenDepositBatch(
        treasuryRequests.map((request) => ({
          actionType: "deposit",
          amount: request.amount,
          yield: request.yield,
        })),
      );
      if (!batchVerdict.ok) {
        throw new Error(
          `${batchVerdict.reason}. Every order batched with it would crash on-chain.`,
        );
      }
    }

    let action: V1_0Rc1Types.ProtocolRedeemerV1;
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
      case "direct_mint":
        action = { DirectMint: { requests: treasuryRequests } };
        break;
      case "direct_burn":
        action = { DirectBurn: { requests: treasuryRequests } };
        break;
      default:
        throw new Error("No orders to process");
    }

    const payload: V1_0Rc1Types.SignedPayload_v1_0_ProtocolRedeemerV1 = {
      action,
      nonce,
    };
    const serialized = Data.serialize(
      V1_0Rc1Types.SignedPayload_v1_0_ProtocolRedeemerV1,
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
   * Handles all 8 action types: mint, burn, deposit, withdraw, stake, unstake,
   * direct_mint, direct_burn.
   */
  override async buildExecuteOrdersTx(params: {
    orderInputs: Core.TransactionInput[];
    signedPayload: string;
    signatures: V1_0Rc1Types.Tuple_VerificationKey_COSESign1[];
  }): Promise<TxBuilder> {
    const {
      orderInputs,
      signedPayload: signedPayloadCbor,
      signatures,
    } = params;

    // Deserialize CBOR hex to object for internal use
    const signedPayload = parse(
      V1_0Rc1Types.SignedPayload_v1_0_ProtocolRedeemerV1,
      PlutusData.fromCbor(HexBlob(signedPayloadCbor)),
    ) as V1_0Rc1Types.SignedPayload_v1_0_ProtocolRedeemerV1;

    // 1. Sort and resolve order UTxOs
    const sortedOrderInputs = sortOrderInputs(orderInputs);
    const orderUtxos =
      await this.blaze.provider.resolveUnspentOutputs(sortedOrderInputs);

    // 2. Parse orders and validate same type
    const orderInfos = this.parseOrderInfos(orderUtxos);
    const actionType = orderInfos[0]!.actionType;

    // 3. Get protocol settings
    const { proxyUtxo, parsedProxyDatum } = await this.getParsedProxyDatum();
    const settings = parsedProxyDatum.settings as SettingsV1;

    // 4. Determine what we need
    const needsTreasury = [
      "mint",
      "burn",
      "withdraw",
      "deposit",
      "direct_mint",
      "direct_burn",
    ].includes(actionType);
    const needsVault = ["stake", "unstake", "deposit"].includes(actionType);

    // 5. Get script reference inputs
    // V1.0 requires the orchestrator and the relevant sub-validator script
    const isMintAction = [
      "mint",
      "burn",
      "direct_mint",
      "direct_burn",
    ].includes(actionType);
    const isStakeAction = ["stake", "unstake"].includes(actionType);

    const scriptHashesNeeded: Record<string, Core.Hash28ByteBase16> = {
      protocol: this.protocolScriptHash,
      order: this.orderScriptHash,
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
    let treasuryUtxo: Core.TransactionUnspentOutput | undefined;
    let parsedTreasuryDatum: V0_1TreasuryDatum | undefined;
    if (needsTreasury) {
      const treasuryResult = await this.getTreasuryDatum();
      treasuryUtxo = treasuryResult.treasuryUtxo;
      parsedTreasuryDatum = treasuryResult.parsedTreasuryDatum;
    }

    let vaultUtxo: Core.TransactionUnspentOutput | undefined;
    let parsedVaultDatum: VaultDatumV1 | undefined;
    if (needsVault) {
      const vaultResult = await this.getVaultDatum();
      vaultUtxo = vaultResult.vaultUtxo;
      parsedVaultDatum = vaultResult.parsedVaultDatum;
    }

    // 7. Gather wallet UTxOs so we can include them in index calculations.
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
    const numDestOutputs = orderInfos.length;

    // For deposit with positive yield, the yield pot output is inserted after destinations
    let numExtraOutputs = 0;
    if (actionType === "deposit") {
      const totalYield = orderInfos.reduce(
        (sum, o) => sum + (o.yield ?? 0n),
        0n,
      );
      if (totalYield > 0n) {
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

    // For unstake with forfeit, add yield pot output
    if (actionType === "unstake") {
      const totalForfeit = orderInfos.reduce(
        (sum, o) => sum + (o.forfeit ?? 0n),
        0n,
      );
      if (totalForfeit > 0n) {
        numExtraOutputs = 1;
      }
    }

    const treasuryOutputIdx = needsTreasury
      ? BigInt(numDestOutputs + numExtraOutputs)
      : 0n;
    const vaultOutputIdx = needsVault
      ? BigInt(numDestOutputs + numExtraOutputs + (needsTreasury ? 1 : 0))
      : undefined;

    // 10. Build ExtraProtocolRedeemer
    const extra: V1_0Rc1Types.ExtraProtocolRedeemerV1 = {
      request_to_outputs: requestToOutputs,
      input_to_requests: inputToRequests,
      treasury_input_idx: treasuryInputIdx,
      treasury_output_idx: treasuryOutputIdx,
      vault_input_idx: vaultInputIdx,
      vault_output_idx: vaultOutputIdx,
    };

    // 11. Build SignedRedeemer
    const serializedSignedRedeemer = Data.serialize(
      V1_0Rc1Types.SignedRedeemer_v1_0_ExtraProtocolRedeemerV1,
      {
        extra,
        payload: signedPayload,
        signatures,
      },
    );

    const executeRedeemer = Data.serialize(
      V1_0Rc1Types.OrderRedeemerV1,
      "Execute",
    );

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
    tx.addReferenceInput(refInputs.protocol!);
    tx.addReferenceInput(refInputs.order!);
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
    const orchestratorRewardAccount = Core.RewardAccount.fromCredential(
      {
        type: Core.CredentialType.ScriptHash,
        hash: this.protocolScriptHash,
      },
      this.network,
    );
    tx.addWithdrawal(orchestratorRewardAccount, 0n, serializedSignedRedeemer);

    // Determine which sub-validator to use based on action type
    const subValidatorHash =
      actionType === "mint" ||
      actionType === "burn" ||
      actionType === "direct_mint" ||
      actionType === "direct_burn"
        ? this.protocolMintScriptHash
        : actionType === "stake" || actionType === "unstake"
          ? this.protocolStakeScriptHash
          : this.protocolManagementScriptHash; // deposit, withdraw

    // Add sub-validator withdrawal with void redeemer
    const subValidatorRewardAccount = Core.RewardAccount.fromCredential(
      {
        type: Core.CredentialType.ScriptHash,
        hash: subValidatorHash,
      },
      this.network,
    );
    const voidRedeemer = Data.Void();
    tx.addWithdrawal(subValidatorRewardAccount, 0n, voidRedeemer);

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
          settings,
        );
        break;
      case "direct_mint":
        this.buildDirectMintExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          treasuryUtxo!,
          parsedTreasuryDatum!,
        );
        break;
      case "direct_burn":
        this.buildDirectBurnExecute(
          tx,
          orderInfos,
          stablecoinAssetId,
          treasuryUtxo!,
          parsedTreasuryDatum!,
        );
        break;
    }

    // Provide the mint proxy script for minting
    tx.provideScript(this.mintProxyScript);

    return tx;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-Action Execute Builders (rc1: no fees, plain min-ADA destination outputs)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mint: reserve goes to treasury, USDr minted to destinations.
   */
  protected override buildMintExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    settings: SettingsV1,
  ): void {
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send USDr to each destination
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      addDirectOutput(
        tx,
        destAddress,
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
  protected override buildBurnExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    settings: SettingsV1,
  ): void {
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send reserve tokens to each destination
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      const ra = findReserveAsset(settings, orderInfo.reserveAsset!);
      const reserveAssetId = Core.AssetId(
        orderInfo.reserveAsset![0] + orderInfo.reserveAsset![1],
      );
      const reserveAmount = usdrToReserve(-orderInfo.amount, ra);
      addDirectOutput(
        tx,
        destAddress,
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
  protected override buildWithdrawExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    settings: SettingsV1,
  ): void {
    // Destination outputs: send reserve tokens to each destination
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      const ra = findReserveAsset(settings, orderInfo.reserveAsset!);
      const reserveAssetId = Core.AssetId(
        orderInfo.reserveAsset![0] + orderInfo.reserveAsset![1],
      );
      const reserveAmount = usdrToReserve(orderInfo.amount, ra);
      addDirectOutput(
        tx,
        destAddress,
        makeValue(MIN_LOVELACE, [reserveAssetId, reserveAmount]),
      );
    }

    // Update treasury: reserve decreases, no circulating_supply change
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
  protected override buildDepositExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatumV1,
    settings: SettingsV1,
  ): void {
    const totalYield = orderInfos.reduce((sum, o) => sum + (o.yield ?? 0n), 0n);

    // Destination outputs: min ADA to each destination
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      addDirectOutput(tx, destAddress, makeValue(MIN_LOVELACE));
    }

    // Calculate yield split
    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const treasuryCirculating = parsedTreasuryDatum.circulating_supply;

    const { stakedYieldShare, unstakedYieldShare } = calculateYieldShares(
      totalYield,
      vaultUSDr,
      treasuryCirculating,
    );

    if (totalYield > 0n) {
      tx.addMint(
        this.stablecoinPolicyId,
        new Map([[Core.AssetName(this.assetNameHex), totalYield]]),
        Data.Void(),
      );

      if (unstakedYieldShare > 0n) {
        const yieldPotAddress = destinationToAddress(this.network, {
          address: settings.unstaked_yield_pot,
          datum: "NoDatum",
        });
        addDirectOutput(
          tx,
          yieldPotAddress,
          makeValue(MIN_LOVELACE, [stablecoinAssetId, unstakedYieldShare]),
        );
      }
    } else if (totalYield < 0n) {
      tx.addMint(
        this.stablecoinPolicyId,
        new Map([[Core.AssetName(this.assetNameHex), totalYield]]),
        Data.Void(),
      );
    }

    // Update treasury
    const reserveDeltas = new Map<string, bigint>();
    for (const orderInfo of orderInfos) {
      const assetId = orderInfo.reserveAsset![0] + orderInfo.reserveAsset![1];
      const ra = findReserveAsset(settings, orderInfo.reserveAsset!);
      const yieldValue = orderInfo.yield ?? 0n;

      const usdrBacking =
        yieldValue >= 0n ? orderInfo.amount + yieldValue : orderInfo.amount;

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

    // Update vault
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
  protected override buildStakeExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    sUSDrAssetId: Core.AssetId,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatumV1,
  ): void {
    const totalUSDrStaked = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const circulatingSUSDr = parsedVaultDatum.circulating_susdr;

    let totalSUSDrMinted: bigint;
    if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
      totalSUSDrMinted = totalUSDrStaked;
    } else {
      totalSUSDrMinted = (totalUSDrStaked * circulatingSUSDr) / vaultUSDr;
    }

    for (const orderInfo of orderInfos) {
      let sUSDrAmount: bigint;
      if (circulatingSUSDr === 0n || vaultUSDr === 0n) {
        sUSDrAmount = orderInfo.amount;
      } else {
        sUSDrAmount = (orderInfo.amount * circulatingSUSDr) / vaultUSDr;
      }

      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      addDirectOutput(
        tx,
        destAddress,
        makeValue(MIN_LOVELACE, [sUSDrAssetId, sUSDrAmount]),
      );
    }

    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.sUSDrAssetNameHex), totalSUSDrMinted]]),
      Data.Void(),
    );

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
   * V1_0Rc1: Supports forfeit parameter - forfeited USDr goes to yield pot.
   */
  protected override buildUnstakeExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    sUSDrAssetId: Core.AssetId,
    vaultUtxo: Core.TransactionUnspentOutput,
    parsedVaultDatum: VaultDatumV1,
    settings: SettingsV1,
  ): void {
    const totalSUSDrBurned = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    const vaultValue = vaultUtxo.output().amount();
    const vaultUSDr = vaultValue.multiasset()?.get(stablecoinAssetId) ?? 0n;
    const circulatingSUSDr = parsedVaultDatum.circulating_susdr;

    if (circulatingSUSDr === 0n) {
      throw new Error("Cannot unstake: no sUSDr in circulation");
    }

    let totalUSDrReleased = 0n;
    let totalForfeit = 0n;

    for (const orderInfo of orderInfos) {
      const uSDrEntitled = (orderInfo.amount * vaultUSDr) / circulatingSUSDr;
      const forfeit = orderInfo.forfeit ?? 0n;
      const uSDrAmount = uSDrEntitled - forfeit;

      totalUSDrReleased += uSDrEntitled;
      totalForfeit += forfeit;

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

    // Send forfeited USDr to yield pot if any
    if (totalForfeit > 0n) {
      const yieldPotAddress = destinationToAddress(this.network, {
        address: settings.unstaked_yield_pot,
        datum: "NoDatum",
      });
      addDirectOutput(
        tx,
        yieldPotAddress,
        makeValue(MIN_LOVELACE, [stablecoinAssetId, totalForfeit]),
      );
    }

    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.sUSDrAssetNameHex), -totalSUSDrBurned]]),
      Data.Void(),
    );

    this.updateVaultOutput(
      tx,
      vaultUtxo,
      parsedVaultDatum,
      -totalSUSDrBurned,
      -totalUSDrReleased,
    );
  }

  /**
   * DirectMint: Mint USDr without reserve asset flow.
   * USDr is minted to destinations, treasury circulating_supply increases.
   * NO reserve asset changes.
   */
  protected override buildDirectMintExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
  ): void {
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // Destination outputs: send USDr to each destination
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      addDirectOutput(
        tx,
        destAddress,
        makeValue(MIN_LOVELACE, [stablecoinAssetId, orderInfo.amount]),
      );
    }

    // Mint USDr
    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.assetNameHex), totalAmount]]),
      Data.Void(),
    );

    // Update treasury: circulating_supply increases, NO reserve changes
    this.updateTreasuryOutputNoReserve(
      tx,
      treasuryUtxo,
      parsedTreasuryDatum,
      totalAmount,
    );
  }

  /**
   * DirectBurn: Burn USDr without reserve asset flow.
   * USDr is burned, treasury circulating_supply decreases.
   * NO reserve asset changes, NO destination outputs (fiat sent off-chain).
   *
   * The `_stablecoinAssetId` parameter exists only to keep the override
   * signature compatible with the family's; rc1's direct-burn output is
   * min-ADA only and does not touch the stablecoin asset.
   */
  protected override buildDirectBurnExecute(
    tx: TxBuilder,
    orderInfos: IOrderInfo[],
    _stablecoinAssetId: Core.AssetId,
    treasuryUtxo: Core.TransactionUnspentOutput,
    parsedTreasuryDatum: V0_1TreasuryDatum,
  ): void {
    // totalAmount is negative for burns (from classifyOrderAction)
    const totalAmount = orderInfos.reduce((sum, o) => sum + o.amount, 0n);

    // CRITICAL: No destination outputs for DirectBurn
    // USDr is burned, fiat is sent off-chain. Nothing goes to user on-chain.
    // We just need to return min ADA to the destination (contract may require this)
    for (const orderInfo of orderInfos) {
      const destAddress = destinationToAddress(
        this.network,
        orderInfo.datum.destination,
      );
      addDirectOutput(tx, destAddress, makeValue(MIN_LOVELACE));
    }

    // Burn USDr (totalAmount is negative)
    tx.addMint(
      this.stablecoinPolicyId,
      new Map([[Core.AssetName(this.assetNameHex), totalAmount]]),
      Data.Void(),
    );

    // Update treasury: circulating_supply decreases, NO reserve changes
    this.updateTreasuryOutputNoReserve(
      tx,
      treasuryUtxo,
      parsedTreasuryDatum,
      totalAmount,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Protected Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Classify an order action from its datum (rc1 actions carry no min_received).
   */
  protected override classifyOrderAction(datum: OrderDatumV1): {
    actionType: TOrderActionType;
    amount: bigint;
    yield?: bigint;
    forfeit?: bigint;
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
        forfeit: action.OUnstake.forfeit,
        isTreasuryAction: false,
      };
    } else if ("ODirectMint" in action) {
      return {
        actionType: "direct_mint",
        amount: action.ODirectMint.amount,
        isTreasuryAction: true,
      };
    } else if ("ODirectBurn" in action) {
      return {
        actionType: "direct_burn",
        amount: -action.ODirectBurn.amount,
        isTreasuryAction: true,
      };
    }
    throw new Error("Unknown order action type");
  }
}
