/**
 * Base interface for staking parameters that define the rules and constraints
 * for staking operations.
 */
export interface StakingParams {
  covenantNoCoordPks: string[];
  covenantQuorum: number;
  unbondingTime: number;
  unbondingFeeSat: number;
  maxStakingAmountSat: number;
  minStakingAmountSat: number;
  maxStakingTimeBlocks: number;
  minStakingTimeBlocks: number;
  slashing?: {
    slashingPkScriptHex: string;
    slashingRate: number;
    minSlashingTxFeeSat: number;
  }
}

/**
 * Extension of StakingParams that includes activation height and version information.
 * These parameters are used to identify and select the appropriate staking rules at
 * different blockchain heights, but do not affect the actual staking transaction content.
 */
export interface VersionedStakingParams extends StakingParams {
  btcActivationHeight: number;
  version: number;
}

/**
 * Extension of VersionedStakingParams that includes a tag field for observability.
 */
export interface ObservableVersionedStakingParams extends VersionedStakingParams {
  tag: string;
}