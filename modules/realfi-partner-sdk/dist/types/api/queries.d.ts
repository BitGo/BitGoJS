import type { TOrderAction, TOrderStatus } from "./types.js";
export declare const STAKE_TIMES_QUERY = "{\n  stakeTimes {\n    CurrentCooldownPeriodEnd { slot }\n    NextCooldownPeriodEnd { slot }\n  }\n}";
export interface IRawStakeTimes {
    stakeTimes: {
        CurrentCooldownPeriodEnd: {
            slot: number;
        };
        NextCooldownPeriodEnd: {
            slot: number;
        };
    };
}
export declare const ORDER_FEES_QUERY = "{ orderFees { mintBps redeemBps } }";
export interface IRawOrderFees {
    orderFees: {
        mintBps: number;
        redeemBps: number;
    };
}
export declare const SUSDR_EXCHANGE_RATE_INPUTS_QUERY = "{\n  susdrExchangeRateInputs {\n    circulatingSusdr\n    vaultUsdr\n    pendingYield\n    diffusionStartUnixMilli\n    diffusionEndUnixMilli\n  }\n}";
export interface IRawSusdrExchangeRateInputs {
    susdrExchangeRateInputs: {
        circulatingSusdr: string;
        vaultUsdr: string;
        pendingYield: string;
        diffusionStartUnixMilli: string;
        diffusionEndUnixMilli: string;
    };
}
export declare const YIELD_BREAKDOWN_QUERY = "query ($owner: String!) {\n  susdrYieldBreakdown(owner: $owner) {\n    totalSUSDr\n    totalUSDrValue\n    principal\n    yield\n    yieldPercent\n  }\n}";
export interface IRawYieldBreakdown {
    susdrYieldBreakdown: {
        totalSUSDr: string;
        totalUSDrValue: string;
        principal: string;
        yield: string;
        yieldPercent: number;
    };
}
export declare const ORDERS_BY_OWNER_QUERY = "query ($owner: String!, $status: OrderStatus!) {\n  ordersByOwner(owner: $owner, status: $status) {\n    status\n    order {\n      Owner\n      Action\n      Amount\n      Principal\n      Yield\n      Slot\n      Forfeit\n      UnlockSlot\n      MatureSlot\n      ClaimTxHash\n      Version\n      utxo { txHash index }\n      resultUtxo { txHash index }\n    }\n  }\n}";
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
    ordersByOwner: {
        status: TOrderStatus;
        order: IRawOrder;
    }[];
}
export declare const POINTS_BALANCE_QUERY = "query ($value: String!) {\n  V_WALLET_POINTS_BALANCE(\n    filters: [{ field: \"WALLET_ADDRESS\", operator: IN, value: $value }]\n  ) {\n    nodes { WALLET_POINTS_BALANCE }\n  }\n}";
export interface IRawPointsBalance {
    V_WALLET_POINTS_BALANCE: {
        nodes: {
            WALLET_POINTS_BALANCE: string | null;
        }[];
    };
}
export interface IRawPointsBalanceData {
    current_balance?: number;
    potential_points?: number;
    day_multiplier?: number;
}
export declare const REFERRER_CODE_QUERY = "query ($walletAddress: String!) {\n  referrerCode(walletAddress: $walletAddress) { code createdAt }\n}";
export interface IRawReferrerCode {
    referrerCode: {
        code: string;
        createdAt: string;
    } | null;
}
export declare const REFERRAL_REWARDS_QUERY = "query ($walletAddress: String!) {\n  referralRewards(walletAddress: $walletAddress)\n}";
export interface IRawReferralRewards {
    referralRewards: number | null;
}
export declare const INVITED_COUNT_QUERY = "query ($walletAddress: String!) {\n  invitedCount(walletAddress: $walletAddress)\n}";
export interface IRawInvitedCount {
    invitedCount: number | null;
}
//# sourceMappingURL=queries.d.ts.map