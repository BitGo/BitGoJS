import { DEFAULT_CLIENT_SOURCE, SDK_VERSION } from "../sdk/shared/client-id.js";
import { gqlRequest, ownerKeyHashes } from "./client.js";
import { parsePartnerConfig } from "./partner-config.js";
import { INVITED_COUNT_QUERY, ORDER_FEES_QUERY, ORDERS_BY_OWNER_QUERY, POINTS_BALANCE_QUERY, REFERRAL_REWARDS_QUERY, REFERRER_CODE_QUERY, STAKE_TIMES_QUERY, SUSDR_EXCHANGE_RATE_INPUTS_QUERY, YIELD_BREAKDOWN_QUERY } from "./queries.js";
import { API_REGISTRY } from "./registry.js";
const DEFAULT_ORDER_STATUSES = ["Open", "Validating", "Canceled", "Executed", "Invalidated", "InvalidMinReceived"];

/** Off-chain RealFi data: order status, stake times, yield, fees, points, referrals. */

function mapOrder(status, order) {
  return {
    owner: order.Owner,
    action: order.Action,
    status,
    amount: BigInt(order.Amount),
    slot: BigInt(order.Slot),
    forfeit: BigInt(order.Forfeit),
    version: order.Version,
    utxo: {
      txHash: order.utxo.txHash,
      outputIndex: order.utxo.index
    },
    resultUtxo: order.resultUtxo ? {
      txHash: order.resultUtxo.txHash,
      outputIndex: order.resultUtxo.index
    } : undefined,
    unlockSlot: order.UnlockSlot == null ? undefined : BigInt(order.UnlockSlot),
    matureSlot: order.MatureSlot == null ? undefined : BigInt(order.MatureSlot),
    principal: order.Principal == null ? undefined : BigInt(order.Principal),
    yield: order.Yield == null ? undefined : BigInt(order.Yield),
    claimTxHash: order.ClaimTxHash ?? undefined
  };
}

/**
 * Off-chain GraphQL reads. Construct with {@link RealfiApi.forNetwork} or
 * {@link RealfiApi.create}; no Blaze instance required.
 */
export class RealfiApi {
  constructor(endpoints, clientId = `${DEFAULT_CLIENT_SOURCE}/${SDK_VERSION}`) {
    this.endpoints = endpoints;
    this.clientId = clientId;
  }
  request(url, query, variables) {
    return gqlRequest(url, query, variables, this.clientId);
  }
  static forNetwork(network, clientId) {
    return new RealfiApi(API_REGISTRY[network], clientId);
  }
  static create(endpoints, clientId) {
    return new RealfiApi(endpoints, clientId);
  }
  async getPartnerConfig() {
    const url = this.endpoints.partnerConfigUrl;
    if (!url) {
      throw new Error("partnerConfigUrl is required to read partner runtime configuration");
    }
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`Partner configuration request failed: ${response.status} ${response.statusText}`);
    }
    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new Error("invalid partner configuration: response is not JSON", {
        cause: error
      });
    }
    return parsePartnerConfig(body);
  }
  async getStakeTimes() {
    const data = await this.request(this.endpoints.realfiUrl, STAKE_TIMES_QUERY);
    return {
      currentCooldownSlot: BigInt(data.stakeTimes.CurrentCooldownPeriodEnd.slot),
      nextCooldownSlot: BigInt(data.stakeTimes.NextCooldownPeriodEnd.slot)
    };
  }
  async getCooldownUnlockSlot() {
    return (await this.getStakeTimes()).nextCooldownSlot;
  }
  async getOrdersByOwner(address, statuses = DEFAULT_ORDER_STATUSES) {
    const owners = ownerKeyHashes(address);
    const batches = await Promise.all(owners.flatMap(owner => statuses.map(status => this.request(this.endpoints.realfiUrl, ORDERS_BY_OWNER_QUERY, {
      owner,
      status
    }).then(data => data.ordersByOwner))));
    const seen = new Set();
    return batches.flat().map(result => mapOrder(result.status, result.order)).filter(order => {
      const key = `${order.utxo.txHash}#${order.utxo.outputIndex}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => Number(b.slot - a.slot));
  }
  async getOrderFees() {
    const data = await this.request(this.endpoints.realfiUrl, ORDER_FEES_QUERY);
    return data.orderFees;
  }
  async getSusdrExchangeRateInputs() {
    const data = await this.request(this.endpoints.realfiUrl, SUSDR_EXCHANGE_RATE_INPUTS_QUERY);
    const inputs = data.susdrExchangeRateInputs;
    return {
      circulatingSusdr: BigInt(inputs.circulatingSusdr),
      vaultUsdr: BigInt(inputs.vaultUsdr),
      pendingYield: BigInt(inputs.pendingYield),
      diffusionStartUnixMilli: BigInt(inputs.diffusionStartUnixMilli),
      diffusionEndUnixMilli: BigInt(inputs.diffusionEndUnixMilli)
    };
  }
  async getYieldBreakdown(address) {
    const [owner] = ownerKeyHashes(address);
    if (!owner) {
      throw new Error("address has no payment credential");
    }
    const data = await this.request(this.endpoints.realfiUrl, YIELD_BREAKDOWN_QUERY, {
      owner
    });
    const breakdown = data.susdrYieldBreakdown;
    return {
      totalSUSDr: BigInt(breakdown.totalSUSDr),
      totalUSDrValue: BigInt(breakdown.totalUSDrValue),
      principal: BigInt(breakdown.principal),
      yield: BigInt(breakdown.yield),
      yieldPercent: breakdown.yieldPercent
    };
  }
  async getPointsBalance(address) {
    const value = ownerKeyHashes(address).join(",");
    const data = await this.request(this.endpoints.assetTransparencyUrl, POINTS_BALANCE_QUERY, {
      value
    });
    const raw = data.V_WALLET_POINTS_BALANCE.nodes[0]?.WALLET_POINTS_BALANCE;
    if (!raw) {
      return {
        pointsBalance: null,
        potentialPoints: null,
        multiplier: null
      };
    }
    const parsed = JSON.parse(raw);
    return {
      pointsBalance: parsed.current_balance ?? null,
      potentialPoints: parsed.potential_points ?? null,
      multiplier: parsed.day_multiplier ?? null
    };
  }
  async getReferrerCode(address) {
    const data = await this.request(this.endpoints.assetTransparencyUrl, REFERRER_CODE_QUERY, {
      walletAddress: ownerKeyHashes(address).join(",")
    });
    return data.referrerCode;
  }
  async getReferralRewards(address) {
    const data = await this.request(this.endpoints.assetTransparencyUrl, REFERRAL_REWARDS_QUERY, {
      walletAddress: ownerKeyHashes(address).join(",")
    });
    return data.referralRewards;
  }
  async getInvitedCount(address) {
    const data = await this.request(this.endpoints.assetTransparencyUrl, INVITED_COUNT_QUERY, {
      walletAddress: ownerKeyHashes(address).join(",")
    });
    return data.invitedCount;
  }
}
//# sourceMappingURL=realfi-api.js.map