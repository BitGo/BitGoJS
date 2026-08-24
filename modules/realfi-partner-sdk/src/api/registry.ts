// Per-network GraphQL endpoints for the RealFi off-chain API.

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

export const API_REGISTRY: Record<TApiNetwork, IApiEndpoints> = {
  mainnet: {
    realfiUrl: "https://api.app.realfi.co/graphql",
    assetTransparencyUrl: "https://api.app.realfi.co/api/v1/asset-transparency",
    partnerConfigUrl: "https://app.realfi.co/partner-config.json",
  },
  preprod: {
    realfiUrl: "https://api.preprod.realfi.co/graphql",
    assetTransparencyUrl:
      "https://api.preprod.realfi.co/api/v1/asset-transparency",
    partnerConfigUrl: "https://preprod.realfi.co/partner-config.json",
  },
  preview: {
    realfiUrl: "https://api.preview.realfi.co/graphql",
    assetTransparencyUrl:
      "https://api.preview.realfi.co/api/v1/asset-transparency",
    partnerConfigUrl: "https://preview.realfi.co/partner-config.json",
  },
};
