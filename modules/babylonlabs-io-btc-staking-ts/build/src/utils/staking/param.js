"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBabylonParamByVersion = exports.getBabylonParamByBtcHeight = void 0;
/*
  Get the Babylon params version by BTC height
  @param height - The BTC height
  @param babylonParamsVersions - The Babylon params versions
  @returns The Babylon params
*/
const getBabylonParamByBtcHeight = (height, babylonParamsVersions) => {
    // Sort by btcActivationHeight in ascending order
    const sortedParams = [...babylonParamsVersions].sort((a, b) => b.btcActivationHeight - a.btcActivationHeight);
    // Find first params where height is >= btcActivationHeight
    const params = sortedParams.find((p) => height >= p.btcActivationHeight);
    if (!params)
        throw new Error(`Babylon params not found for height ${height}`);
    return params;
};
exports.getBabylonParamByBtcHeight = getBabylonParamByBtcHeight;
/*
  Get the Babylon params by version
  @param version - The Babylon params version
  @param babylonParams - The Babylon params
  @returns The Babylon params
*/
const getBabylonParamByVersion = (version, babylonParams) => {
    const params = babylonParams.find((p) => p.version === version);
    if (!params)
        throw new Error(`Babylon params not found for version ${version}`);
    return params;
};
exports.getBabylonParamByVersion = getBabylonParamByVersion;
