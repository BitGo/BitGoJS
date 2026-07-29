import { MIN_UNBONDING_OUTPUT_VALUE } from "../../constants/unbonding";
import { StakingError, StakingErrorCode } from "../../error";
import { StakingInputs, StakingParams, UTXO } from "../../types";
import { isValidBabylonAddress } from "../babylon";
import { isValidNoCoordPublicKey } from "../btc";

/**
 * Validates the staking expansion input
 * @param babylonBtcTipHeight - The Babylon BTC tip height
 * @param inputUTXOs - The input UTXOs
 * @param stakingInput - The staking input
 * @param previousStakingInput - The previous staking input
 * @param babylonAddress - The Babylon address
 * @returns true if validation passes, throws error if validation fails
 */
export const validateStakingExpansionInputs = (
  {
    babylonBtcTipHeight,
    inputUTXOs,
    stakingInput,
    previousStakingInput,
    babylonAddress,
  }: {
    babylonBtcTipHeight?: number,
    inputUTXOs: UTXO[],
    stakingInput: StakingInputs,
    previousStakingInput: StakingInputs,
    babylonAddress?: string,
  }
) => {
  if (babylonBtcTipHeight === 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "Babylon BTC tip height cannot be 0",
    );
  }
  if (!inputUTXOs || inputUTXOs.length === 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "No input UTXOs provided",
    );
  }
  if (babylonAddress && !isValidBabylonAddress(babylonAddress)) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "Invalid Babylon address",
    );
  }

  // TODO: We currently don't support increasing the staking amount
  if (stakingInput.stakingAmountSat !== previousStakingInput.stakingAmountSat) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "Staking expansion amount must equal the previous staking amount",
    );
  }
  // Check the previous staking transaction's finality providers
  // are a subset of the new staking input's finality providers
  const currentFPs = stakingInput.finalityProviderPksNoCoordHex;
  const previousFPs = previousStakingInput.finalityProviderPksNoCoordHex;

  // Check if all previous finality providers are included in the current
  // staking
  const missingPreviousFPs = previousFPs.filter(prevFp => !currentFPs.includes(prevFp));
  
  if (missingPreviousFPs.length > 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      `Invalid staking expansion: all finality providers from the previous
      staking must be included. Missing: ${missingPreviousFPs.join(", ")}`,
    );
  }
}

/**
 * Validate the staking transaction input data.
 *
 * @param {number} stakingAmountSat - The staking amount in satoshis.
 * @param {number} timelock - The staking time in blocks.
 * @param {StakingParams} params - The staking parameters.
 * @param {UTXO[]} inputUTXOs - The input UTXOs.
 * @param {number} feeRate - The Bitcoin fee rate in sat/vbyte
 * @throws {StakingError} - If the input data is invalid.
 */
export const validateStakingTxInputData = (
  stakingAmountSat: number,
  timelock: number,
  params: StakingParams,
  inputUTXOs: UTXO[],
  feeRate: number,
) => {
  if (
    stakingAmountSat < params.minStakingAmountSat ||
    stakingAmountSat > params.maxStakingAmountSat
  ) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "Invalid staking amount",
    );
  }

  if (
    timelock < params.minStakingTimeBlocks ||
    timelock > params.maxStakingTimeBlocks
  ) {
    throw new StakingError(StakingErrorCode.INVALID_INPUT, "Invalid timelock");
  }

  if (inputUTXOs.length == 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "No input UTXOs provided",
    );
  }
  if (feeRate <= 0) {
    throw new StakingError(StakingErrorCode.INVALID_INPUT, "Invalid fee rate");
  }
};

/**
 * Validate the staking parameters.
 * Extend this method to add additional validation for staking parameters based
 * on the staking type.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the parameters are invalid.
 */
export const validateParams = (params: StakingParams) => {
  // Check covenant public keys
  if (params.covenantNoCoordPks.length == 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Could not find any covenant public keys",
    );
  }
  if (params.covenantNoCoordPks.length < params.covenantQuorum) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Covenant public keys must be greater than or equal to the quorum",
    );
  }
  params.covenantNoCoordPks.forEach((pk) => {
    if (!isValidNoCoordPublicKey(pk)) {
      throw new StakingError(
        StakingErrorCode.INVALID_PARAMS,
        "Covenant public key should contains no coordinate",
      );
    }
  });
  // Check other parameters
  if (params.unbondingTime <= 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Unbonding time must be greater than 0",
    );
  }
  if (params.unbondingFeeSat <= 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Unbonding fee must be greater than 0",
    );
  }
  if (params.maxStakingAmountSat < params.minStakingAmountSat) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Max staking amount must be greater or equal to min staking amount",
    );
  }
  if (
    params.minStakingAmountSat <
    params.unbondingFeeSat + MIN_UNBONDING_OUTPUT_VALUE
  ) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      `Min staking amount must be greater than unbonding fee plus ${MIN_UNBONDING_OUTPUT_VALUE}`,
    );
  }
  if (params.maxStakingTimeBlocks < params.minStakingTimeBlocks) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Max staking time must be greater or equal to min staking time",
    );
  }
  if (params.minStakingTimeBlocks <= 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Min staking time must be greater than 0",
    );
  }
  if (params.covenantQuorum <= 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_PARAMS,
      "Covenant quorum must be greater than 0",
    );
  }
  if (params.slashing) {
    if (params.slashing.slashingRate <= 0) {
      throw new StakingError(
        StakingErrorCode.INVALID_PARAMS,
        "Slashing rate must be greater than 0",
      );
    }
    if (params.slashing.slashingRate > 1) {
      throw new StakingError(
        StakingErrorCode.INVALID_PARAMS,
        "Slashing rate must be less or equal to 1",
      );
    }
    if (params.slashing.slashingPkScriptHex.length == 0) {
      throw new StakingError(
        StakingErrorCode.INVALID_PARAMS,
        "Slashing public key script is missing",
      );
    }
    if (params.slashing.minSlashingTxFeeSat <= 0) {
      throw new StakingError(
        StakingErrorCode.INVALID_PARAMS,
        "Minimum slashing transaction fee must be greater than 0",
      );
    }
  }
};

/**
 * Validate the staking timelock.
 *
 * @param {number} stakingTimelock - The staking timelock.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the staking timelock is invalid.
 */
export const validateStakingTimelock = (
  stakingTimelock: number,
  params: StakingParams,
) => {
  if (
    stakingTimelock < params.minStakingTimeBlocks ||
    stakingTimelock > params.maxStakingTimeBlocks
  ) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      "Staking transaction timelock is out of range",
    );
  }
};

/**
 * Validate the staking expansion covenant quorum.
 * 
 * The quorum is the number of covenant members that must be active in the
 * previous staking transaction in order to expand the staking.
 * 
 * If the quorum is not met, the staking expansion will fail.
 *
 * @param {StakingParams} paramsForPreviousStakingTx - The staking parameters
 * for the previous staking transaction.
 * @param {StakingParams} paramsForCurrentStakingTx - The staking parameters
 * for the current staking transaction.
 * @throws {StakingError} - If the staking expansion covenant quorum is invalid.
 */
export const validateStakingExpansionCovenantQuorum = (
  paramsForPreviousStakingTx: StakingParams,
  paramsForCurrentStakingTx: StakingParams,
) => {
  const previousCovenantMembers = paramsForPreviousStakingTx.covenantNoCoordPks;
  const currentCovenantMembers = paramsForCurrentStakingTx.covenantNoCoordPks;
  const requiredQuorum = paramsForPreviousStakingTx.covenantQuorum;

  // Count how many previous covenant members are still active
  const activePreviousMembers = previousCovenantMembers.filter(
    prevMember => currentCovenantMembers.includes(prevMember)
  ).length;

  if (activePreviousMembers < requiredQuorum) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT,
      `Staking expansion failed: insufficient covenant quorum. ` +
      `Required: ${requiredQuorum}, Available: ${activePreviousMembers}. ` +
      `Too many covenant members have rotated out.`
    );
  }
}