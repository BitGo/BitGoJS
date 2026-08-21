import type { ISusdrExchangeRateInputs } from "../sdk/v1_1_rc1/diffusion.js";
import { type IApiEndpoints, type TApiNetwork } from "./registry.js";
import type { IOrderFees, IOrderInfo, IPartnerConfig, IPointsBalance, IReferrerCode, IStakeTimes, IYieldBreakdown, TOrderStatus } from "./types.js";
/** Off-chain RealFi data: order status, stake times, yield, fees, points, referrals. */
export interface IRealfiApiSDK {
    /** Product-curated swap lists and USD UX limits from deployed runtime config. */
    getPartnerConfig(): Promise<IPartnerConfig>;
    /** Cooldown boundary slots for unstaking. */
    getStakeTimes(): Promise<IStakeTimes>;
    /** The slot to pass as an unstake `unlockSlot` (the next cooldown boundary). */
    getCooldownUnlockSlot(): Promise<bigint>;
    /** Orders owned by `address` across the given statuses (default: all tracked). */
    getOrdersByOwner(address: string, statuses?: TOrderStatus[]): Promise<IOrderInfo[]>;
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
/**
 * Off-chain GraphQL reads. Construct with {@link RealfiApi.forNetwork} or
 * {@link RealfiApi.create}; no Blaze instance required.
 */
export declare class RealfiApi implements IRealfiApiSDK {
    private readonly endpoints;
    private readonly clientId;
    private constructor();
    private request;
    static forNetwork(network: TApiNetwork, clientId?: string): IRealfiApiSDK;
    static create(endpoints: IApiEndpoints, clientId?: string): IRealfiApiSDK;
    getPartnerConfig(): Promise<IPartnerConfig>;
    getStakeTimes(): Promise<IStakeTimes>;
    getCooldownUnlockSlot(): Promise<bigint>;
    getOrdersByOwner(address: string, statuses?: TOrderStatus[]): Promise<IOrderInfo[]>;
    getOrderFees(): Promise<IOrderFees>;
    getSusdrExchangeRateInputs(): Promise<ISusdrExchangeRateInputs>;
    getYieldBreakdown(address: string): Promise<IYieldBreakdown>;
    getPointsBalance(address: string): Promise<IPointsBalance>;
    getReferrerCode(address: string): Promise<IReferrerCode | null>;
    getReferralRewards(address: string): Promise<number | null>;
    getInvitedCount(address: string): Promise<number | null>;
}
//# sourceMappingURL=realfi-api.d.ts.map