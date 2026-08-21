// GraphQL operations + their raw response shapes (field names match the schema).
// The clean SDK-facing types live in ./types; the API class maps raw -> clean.

import type { TOrderAction, TOrderStatus } from "./types.js";

export const STAKE_TIMES_QUERY = `{
  stakeTimes {
    CurrentCooldownPeriodEnd { slot }
    NextCooldownPeriodEnd { slot }
  }
}`;

export interface IRawStakeTimes {
  stakeTimes: {
    CurrentCooldownPeriodEnd: { slot: number };
    NextCooldownPeriodEnd: { slot: number };
  };
}

export const ORDER_FEES_QUERY = `{ orderFees { mintBps redeemBps } }`;

export interface IRawOrderFees {
  orderFees: { mintBps: number; redeemBps: number };
}

export const SUSDR_EXCHANGE_RATE_INPUTS_QUERY = `{
  susdrExchangeRateInputs {
    circulatingSusdr
    vaultUsdr
    pendingYield
    diffusionStartUnixMilli
    diffusionEndUnixMilli
  }
}`;

export interface IRawSusdrExchangeRateInputs {
  susdrExchangeRateInputs: {
    circulatingSusdr: string;
    vaultUsdr: string;
    pendingYield: string;
    diffusionStartUnixMilli: string;
    diffusionEndUnixMilli: string;
  };
}

export const YIELD_BREAKDOWN_QUERY = `query ($owner: String!) {
  susdrYieldBreakdown(owner: $owner) {
    totalSUSDr
    totalUSDrValue
    principal
    yield
    yieldPercent
  }
}`;

export interface IRawYieldBreakdown {
  susdrYieldBreakdown: {
    totalSUSDr: string;
    totalUSDrValue: string;
    principal: string;
    yield: string;
    yieldPercent: number;
  };
}

export const ORDERS_BY_OWNER_QUERY = `query ($owner: String!, $status: OrderStatus!) {
  ordersByOwner(owner: $owner, status: $status) {
    status
    order {
      Owner
      Action
      Amount
      Principal
      Yield
      Slot
      Forfeit
      UnlockSlot
      MatureSlot
      ClaimTxHash
      Version
      utxo { txHash index }
      resultUtxo { txHash index }
    }
  }
}`;

export interface IRawUtxo {
  txHash: string;
  index: number;
}

export interface IRawOrder {
  Owner: string;
  Action: TOrderAction;
  Amount: string;
  Principal: string | null;
  Yield: string | null;
  Slot: string;
  Forfeit: string;
  UnlockSlot: string | null;
  MatureSlot: string | null;
  ClaimTxHash: string | null;
  Version: string;
  utxo: IRawUtxo;
  resultUtxo: IRawUtxo | null;
}

export interface IRawOrdersByOwner {
  ordersByOwner: { status: TOrderStatus; order: IRawOrder }[];
}

export const POINTS_BALANCE_QUERY = `query ($value: String!) {
  V_WALLET_POINTS_BALANCE(
    filters: [{ field: "WALLET_ADDRESS", operator: IN, value: $value }]
  ) {
    nodes { WALLET_POINTS_BALANCE }
  }
}`;

export interface IRawPointsBalance {
  V_WALLET_POINTS_BALANCE: {
    nodes: { WALLET_POINTS_BALANCE: string | null }[];
  };
}

export interface IRawPointsBalanceData {
  current_balance?: number;
  potential_points?: number;
  day_multiplier?: number;
}

export const REFERRER_CODE_QUERY = `query ($walletAddress: String!) {
  referrerCode(walletAddress: $walletAddress) { code createdAt }
}`;

export interface IRawReferrerCode {
  referrerCode: { code: string; createdAt: string } | null;
}

export const REFERRAL_REWARDS_QUERY = `query ($walletAddress: String!) {
  referralRewards(walletAddress: $walletAddress)
}`;

export interface IRawReferralRewards {
  referralRewards: number | null;
}

export const INVITED_COUNT_QUERY = `query ($walletAddress: String!) {
  invitedCount(walletAddress: $walletAddress)
}`;

export interface IRawInvitedCount {
  invitedCount: number | null;
}
