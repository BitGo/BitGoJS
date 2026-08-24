import { DEFAULT_CLIENT_SOURCE, SDK_VERSION } from "../sdk/shared/client-id.js";
import type { ISusdrExchangeRateInputs } from "../sdk/v1_1_rc1/diffusion.js";
import { gqlRequest, ownerKeyHashes } from "./client.js";
import { parsePartnerConfig } from "./partner-config.js";
import {
  INVITED_COUNT_QUERY,
  ORDER_FEES_QUERY,
  ORDERS_BY_OWNER_QUERY,
  POINTS_BALANCE_QUERY,
  REFERRAL_REWARDS_QUERY,
  REFERRER_CODE_QUERY,
  STAKE_TIMES_QUERY,
  SUSDR_EXCHANGE_RATE_INPUTS_QUERY,
  YIELD_BREAKDOWN_QUERY,
  type IRawInvitedCount,
  type IRawOrder,
  type IRawOrderFees,
  type IRawOrdersByOwner,
  type IRawPointsBalance,
  type IRawPointsBalanceData,
  type IRawReferralRewards,
  type IRawReferrerCode,
  type IRawStakeTimes,
  type IRawSusdrExchangeRateInputs,
  type IRawYieldBreakdown,
} from "./queries.js";
import {
  API_REGISTRY,
  type IApiEndpoints,
  type TApiNetwork,
} from "./registry.js";
import type {
  IOrderFees,
  IOrderInfo,
  IPartnerConfig,
  IPointsBalance,
  IReferrerCode,
  IStakeTimes,
  IYieldBreakdown,
  TOrderStatus,
} from "./types.js";

const DEFAULT_ORDER_STATUSES: TOrderStatus[] = [
  "Open",
  "Validating",
  "Canceled",
  "Executed",
  "Invalidated",
  "InvalidMinReceived",
];

/** Off-chain RealFi data: order status, stake times, yield, fees, points, referrals. */
export interface IRealfiApiSDK {
  /** Product-curated swap lists and USD UX limits from deployed runtime config. */
  getPartnerConfig(): Promise<IPartnerConfig>;
  /** Cooldown boundary slots for unstaking. */
  getStakeTimes(): Promise<IStakeTimes>;
  /** The slot to pass as an unstake `unlockSlot` (the next cooldown boundary). */
  getCooldownUnlockSlot(): Promise<bigint>;
  /** Orders owned by `address` across the given statuses (default: all tracked). */
  getOrdersByOwner(
    address: string,
    statuses?: TOrderStatus[],
  ): Promise<IOrderInfo[]>;
  /** Per-action minimum-fee policy (basis points). */
  getOrderFees(): Promise<IOrderFees>;
  /** Inputs for calculating the diffusion-aware USDr-per-sUSDr rate. */
  getSusdrExchangeRateInputs(): Promise<ISusdrExchangeRateInputs>;
  /** Yield owed on a wallet's sUSDr holdings. */
  getYieldBreakdown(address: string): Promise<IYieldBreakdown>;
  /** A wallet's points balance. */
  getPointsBalance(address: string): Promise<IPointsBalance>;
  /** A wallet's referral code, or null if none. */
  getReferrerCode(address: string): Promise<IReferrerCode | null>;
  /** Cumulative referral-bonus points credited to a wallet. */
  getReferralRewards(address: string): Promise<number | null>;
  /** Number of referees a wallet has invited. */
  getInvitedCount(address: string): Promise<number | null>;
}

function mapOrder(status: TOrderStatus, order: IRawOrder): IOrderInfo {
  return {
    owner: order.Owner,
    action: order.Action,
    status,
    amount: BigInt(order.Amount),
    slot: BigInt(order.Slot),
    forfeit: BigInt(order.Forfeit),
    version: order.Version,
    utxo: { txHash: order.utxo.txHash, outputIndex: order.utxo.index },
    resultUtxo: order.resultUtxo
      ? { txHash: order.resultUtxo.txHash, outputIndex: order.resultUtxo.index }
      : undefined,
    unlockSlot: order.UnlockSlot == null ? undefined : BigInt(order.UnlockSlot),
    matureSlot: order.MatureSlot == null ? undefined : BigInt(order.MatureSlot),
    principal: order.Principal == null ? undefined : BigInt(order.Principal),
    yield: order.Yield == null ? undefined : BigInt(order.Yield),
    claimTxHash: order.ClaimTxHash ?? undefined,
  };
}

/**
 * Off-chain GraphQL reads. Construct with {@link RealfiApi.forNetwork} or
 * {@link RealfiApi.create}; no Blaze instance required.
 */
export class RealfiApi implements IRealfiApiSDK {
  private constructor(
    private readonly endpoints: IApiEndpoints,
    private readonly clientId: string = `${DEFAULT_CLIENT_SOURCE}/${SDK_VERSION}`,
  ) {}

  private request<T>(
    url: string,
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return gqlRequest<T>(url, query, variables, this.clientId);
  }

  static forNetwork(network: TApiNetwork, clientId?: string): IRealfiApiSDK {
    return new RealfiApi(API_REGISTRY[network], clientId);
  }

  static create(endpoints: IApiEndpoints, clientId?: string): IRealfiApiSDK {
    return new RealfiApi(endpoints, clientId);
  }

  async getPartnerConfig(): Promise<IPartnerConfig> {
    const url = this.endpoints.partnerConfigUrl;
    if (!url) {
      throw new Error(
        "partnerConfigUrl is required to read partner runtime configuration",
      );
    }
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `Partner configuration request failed: ${response.status} ${response.statusText}`,
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new Error("invalid partner configuration: response is not JSON", {
        cause: error,
      });
    }
    return parsePartnerConfig(body);
  }

  async getStakeTimes(): Promise<IStakeTimes> {
    const data = await this.request<IRawStakeTimes>(
      this.endpoints.realfiUrl,
      STAKE_TIMES_QUERY,
    );
    return {
      currentCooldownSlot: BigInt(
        data.stakeTimes.CurrentCooldownPeriodEnd.slot,
      ),
      nextCooldownSlot: BigInt(data.stakeTimes.NextCooldownPeriodEnd.slot),
    };
  }

  async getCooldownUnlockSlot(): Promise<bigint> {
    return (await this.getStakeTimes()).nextCooldownSlot;
  }

  async getOrdersByOwner(
    address: string,
    statuses: TOrderStatus[] = DEFAULT_ORDER_STATUSES,
  ): Promise<IOrderInfo[]> {
    const owners = ownerKeyHashes(address);
    const batches = await Promise.all(
      owners.flatMap((owner) =>
        statuses.map((status) =>
          this.request<IRawOrdersByOwner>(
            this.endpoints.realfiUrl,
            ORDERS_BY_OWNER_QUERY,
            { owner, status },
          ).then((data) => data.ordersByOwner),
        ),
      ),
    );
    const seen = new Set<string>();
    return batches
      .flat()
      .map((result) => mapOrder(result.status, result.order))
      .filter((order) => {
        const key = `${order.utxo.txHash}#${order.utxo.outputIndex}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Number(b.slot - a.slot));
  }

  async getOrderFees(): Promise<IOrderFees> {
    const data = await this.request<IRawOrderFees>(
      this.endpoints.realfiUrl,
      ORDER_FEES_QUERY,
    );
    return data.orderFees;
  }

  async getSusdrExchangeRateInputs(): Promise<ISusdrExchangeRateInputs> {
    const data = await this.request<IRawSusdrExchangeRateInputs>(
      this.endpoints.realfiUrl,
      SUSDR_EXCHANGE_RATE_INPUTS_QUERY,
    );
    const inputs = data.susdrExchangeRateInputs;
    return {
      circulatingSusdr: BigInt(inputs.circulatingSusdr),
      vaultUsdr: BigInt(inputs.vaultUsdr),
      pendingYield: BigInt(inputs.pendingYield),
      diffusionStartUnixMilli: BigInt(inputs.diffusionStartUnixMilli),
      diffusionEndUnixMilli: BigInt(inputs.diffusionEndUnixMilli),
    };
  }

  async getYieldBreakdown(address: string): Promise<IYieldBreakdown> {
    const [owner] = ownerKeyHashes(address);
    if (!owner) {
      throw new Error("address has no payment credential");
    }
    const data = await this.request<IRawYieldBreakdown>(
      this.endpoints.realfiUrl,
      YIELD_BREAKDOWN_QUERY,
      { owner },
    );
    const breakdown = data.susdrYieldBreakdown;
    return {
      totalSUSDr: BigInt(breakdown.totalSUSDr),
      totalUSDrValue: BigInt(breakdown.totalUSDrValue),
      principal: BigInt(breakdown.principal),
      yield: BigInt(breakdown.yield),
      yieldPercent: breakdown.yieldPercent,
    };
  }

  async getPointsBalance(address: string): Promise<IPointsBalance> {
    const value = ownerKeyHashes(address).join(",");
    const data = await this.request<IRawPointsBalance>(
      this.endpoints.assetTransparencyUrl,
      POINTS_BALANCE_QUERY,
      { value },
    );
    const raw = data.V_WALLET_POINTS_BALANCE.nodes[0]?.WALLET_POINTS_BALANCE;
    if (!raw) {
      return { pointsBalance: null, potentialPoints: null, multiplier: null };
    }
    const parsed = JSON.parse(raw) as IRawPointsBalanceData;
    return {
      pointsBalance: parsed.current_balance ?? null,
      potentialPoints: parsed.potential_points ?? null,
      multiplier: parsed.day_multiplier ?? null,
    };
  }

  async getReferrerCode(address: string): Promise<IReferrerCode | null> {
    const data = await this.request<IRawReferrerCode>(
      this.endpoints.assetTransparencyUrl,
      REFERRER_CODE_QUERY,
      { walletAddress: ownerKeyHashes(address).join(",") },
    );
    return data.referrerCode;
  }

  async getReferralRewards(address: string): Promise<number | null> {
    const data = await this.request<IRawReferralRewards>(
      this.endpoints.assetTransparencyUrl,
      REFERRAL_REWARDS_QUERY,
      { walletAddress: ownerKeyHashes(address).join(",") },
    );
    return data.referralRewards;
  }

  async getInvitedCount(address: string): Promise<number | null> {
    const data = await this.request<IRawInvitedCount>(
      this.endpoints.assetTransparencyUrl,
      INVITED_COUNT_QUERY,
      { walletAddress: ownerKeyHashes(address).join(",") },
    );
    return data.invitedCount;
  }
}
