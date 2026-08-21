"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.API_REGISTRY = void 0;
// Per-network GraphQL endpoints for the RealFi off-chain API.

var API_REGISTRY = exports.API_REGISTRY = {
  mainnet: {
    realfiUrl: "https://api.app.realfi.co/graphql",
    assetTransparencyUrl: "https://api.app.realfi.co/api/v1/asset-transparency",
    partnerConfigUrl: "https://app.realfi.co/partner-config.json"
  },
  preprod: {
    realfiUrl: "https://api.preprod.realfi.co/graphql",
    assetTransparencyUrl: "https://api.preprod.realfi.co/api/v1/asset-transparency",
    partnerConfigUrl: "https://preprod.realfi.co/partner-config.json"
  },
  preview: {
    realfiUrl: "https://api.preview.realfi.co/graphql",
    assetTransparencyUrl: "https://api.preview.realfi.co/api/v1/asset-transparency",
    partnerConfigUrl: "https://preview.realfi.co/partner-config.json"
  }
};
//# sourceMappingURL=registry.js.map