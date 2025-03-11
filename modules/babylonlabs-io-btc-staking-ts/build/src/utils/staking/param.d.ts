import { StakingParams, VersionedStakingParams } from "../../types/params";
export declare const getBabylonParamByBtcHeight: (height: number, babylonParamsVersions: VersionedStakingParams[]) => StakingParams;
export declare const getBabylonParamByVersion: (version: number, babylonParams: VersionedStakingParams[]) => StakingParams;
