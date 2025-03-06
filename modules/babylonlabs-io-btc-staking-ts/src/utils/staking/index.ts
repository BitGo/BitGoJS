import { address, networks, payments, Transaction } from "bitcoinjs-lib";
import { Taptree } from "bitcoinjs-lib/src/types";
import { internalPubkey } from "../../constants/internalPubkey";
import { TransactionOutput } from "../../types/psbtOutputs";
import { StakingError, StakingErrorCode } from "../../error";
import { UTXO } from "../../types/UTXO";
import { isValidNoCoordPublicKey } from "../btc";
import { StakingParams } from "../../types/params";
import { MIN_UNBONDING_OUTPUT_VALUE } from "../../constants/unbonding";

export interface OutputInfo {
  scriptPubKey: Buffer;
  outputAddress: string;
}

/**
 * Build the staking output for the transaction which contains p2tr output 
 * with staking scripts.
 * 
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} amount - The amount to stake.
 * @returns {TransactionOutput[]} - The staking transaction outputs.
 * @throws {Error} - If the staking output cannot be built.
 */
export const buildStakingTransactionOutputs = (
  scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
    dataEmbedScript?: Buffer;
  },
  network: networks.Network,
  amount: number,
): TransactionOutput[] => {
  const stakingOutputInfo = deriveStakingOutputInfo(scripts, network);
  const transactionOutputs: {scriptPubKey: Buffer, value: number}[] = [
    {
      scriptPubKey: stakingOutputInfo.scriptPubKey,
      value: amount,
    },
  ];
  if (scripts.dataEmbedScript) {
    // Add the data embed output to the transaction
    transactionOutputs.push({
      scriptPubKey: scripts.dataEmbedScript,
      value: 0,
    });
  }
  return transactionOutputs;
};

/**
 * Derive the staking output address from the staking scripts.
 * 
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {StakingOutput} - The staking output address and scriptPubKey.
 * @throws {StakingError} - If the staking output address cannot be derived.
 */
export const deriveStakingOutputInfo = (
  scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
  },
  network: networks.Network,
) => {
  // Build outputs
  const scriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];

  // Create an pay-2-taproot (p2tr) output using the staking script
  const stakingOutput = payments.p2tr({
    internalPubkey,
    scriptTree,
    network,
  });

  if (!stakingOutput.address) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      "Failed to build staking output",
    );
  }
  
  return {
    outputAddress: stakingOutput.address,
    scriptPubKey: address.toOutputScript(stakingOutput.address, network),
  };
};

/**
 * Derive the unbonding output address and scriptPubKey from the staking scripts.
 * 
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The unbonding output address and scriptPubKey.
 * @throws {StakingError} - If the unbonding output address cannot be derived.
 */
export const deriveUnbondingOutputInfo = (
  scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
  },
  network: networks.Network,
) => {
  const outputScriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    { output: scripts.unbondingTimelockScript },
  ];

  const unbondingOutput = payments.p2tr({
    internalPubkey,
    scriptTree: outputScriptTree,
    network,
  });

  if (!unbondingOutput.address) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      "Failed to build unbonding output",
    );
  }

  return {
    outputAddress: unbondingOutput.address,
    scriptPubKey: address.toOutputScript(unbondingOutput.address, network),
  };
}

/**
 * Derive the slashing output address and scriptPubKey from the staking scripts.
 * 
 * @param {StakingScripts} scripts - The unbonding timelock scripts, we use the
 * unbonding timelock script as the timelock of the slashing transaction.
 * This is due to slashing tx timelock is the same as the unbonding timelock.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The slashing output address and scriptPubKey.
 * @throws {StakingError} - If the slashing output address cannot be derived.
 */
export const deriveSlashingOutput = (
  scripts: {
    unbondingTimelockScript: Buffer;
  },
  network: networks.Network,
) => {
  const slashingOutput = payments.p2tr({
    internalPubkey,
    scriptTree: { output: scripts.unbondingTimelockScript },
    network,
  });
  const slashingOutputAddress = slashingOutput.address;

  if (!slashingOutputAddress) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      "Failed to build slashing output address",
    );
  }
  
  return {
    outputAddress: slashingOutputAddress,
    scriptPubKey: address.toOutputScript(slashingOutputAddress, network),
  };
}

/**
 * Find the matching output index for the given transaction.
 * 
 * @param {Transaction} tx - The transaction.
 * @param {string} outputAddress - The output address.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {number} - The output index.
 * @throws {Error} - If the matching output is not found.
 */
export const findMatchingTxOutputIndex = (
  tx: Transaction,
  outputAddress: string,
  network: networks.Network,
) => {
  const index = tx.outs.findIndex(output => {
    return address.fromOutputScript(output.script, network) === outputAddress;
  });

  if (index === -1) {
    throw new StakingError(
      StakingErrorCode.INVALID_OUTPUT,
      `Matching output not found for address: ${outputAddress}`,
    );
  }

  return index;
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
      StakingErrorCode.INVALID_INPUT, "Invalid staking amount",
    );
  }

  if (
    timelock < params.minStakingTimeBlocks ||
    timelock > params.maxStakingTimeBlocks
  ) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT, "Invalid timelock",
    );
  }

  if (inputUTXOs.length == 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT, "No input UTXOs provided",
    );
  }
  if (feeRate <= 0) {
    throw new StakingError(
      StakingErrorCode.INVALID_INPUT, "Invalid fee rate",
    );
  }
}

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
  if (params.minStakingAmountSat < params.unbondingFeeSat + MIN_UNBONDING_OUTPUT_VALUE) {
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
}

/**
 * Validate the staking timelock.
 * 
 * @param {number} stakingTimelock - The staking timelock.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the staking timelock is invalid.
 */
export const validateStakingTimelock = (
  stakingTimelock: number, params: StakingParams,
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
 * toBuffers converts an array of strings to an array of buffers.
 * 
 * @param {string[]} inputs - The input strings.
 * @returns {Buffer[]} - The buffers.
 * @throws {StakingError} - If the values cannot be converted to buffers.
 */
export const toBuffers = (inputs: string[]): Buffer[] => {
  try {
    return inputs.map((i) =>
      Buffer.from(i, "hex")
    );
  } catch (error) {
    throw StakingError.fromUnknown(
      error, StakingErrorCode.INVALID_INPUT,
      "Cannot convert values to buffers",
    );
  }
}
