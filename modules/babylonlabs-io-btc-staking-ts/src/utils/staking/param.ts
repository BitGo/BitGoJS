import { StakingParams, VersionedStakingParams } from "../../types/params";

/*
  Get the Babylon params version by BTC height
  @param height - The BTC height
  @param babylonParamsVersions - The Babylon params versions
  @returns The Babylon params
*/
export const getBabylonParamByBtcHeight = (
  height: number,
  babylonParamsVersions: VersionedStakingParams[],
): StakingParams => {
  // Sort by btcActivationHeight in ascending order
  const sortedParams = [...babylonParamsVersions].sort(
    (a, b) => b.btcActivationHeight - a.btcActivationHeight,
  );

  // Find first params where height is >= btcActivationHeight
  const params = sortedParams.find(
    (p) => height >= p.btcActivationHeight,
  );
  if (!params) throw new Error(`Babylon params not found for height ${height}`);
  return params;
};

/*
  Get the Babylon params by version
  @param version - The Babylon params version
  @param babylonParams - The Babylon params
  @returns The Babylon params
*/
export const getBabylonParamByVersion = (
  version: number,
  babylonParams: VersionedStakingParams[],
): StakingParams => {
  const params = babylonParams.find((p) => p.version === version);
  if (!params) throw new Error(`Babylon params not found for version ${version}`);
  return params;
};