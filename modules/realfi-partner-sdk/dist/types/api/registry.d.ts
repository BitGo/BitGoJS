export type TApiNetwork = "mainnet" | "preprod" | "preview";
export interface IApiEndpoints {
    /** Main RealFi GraphQL API — orders, stake times, yield, fees, wallet status. */
    realfiUrl: string;
    /** Asset-transparency GraphQL API — points and referral reads. */
    assetTransparencyUrl: string;
    /**
     * Sanitized partner runtime configuration. Optional only for backwards
     * compatibility with custom endpoint objects created before this read was
     * added; `getPartnerConfig()` requires it.
     */
    partnerConfigUrl?: string;
}
export declare const API_REGISTRY: Record<TApiNetwork, IApiEndpoints>;
//# sourceMappingURL=registry.d.ts.map