import { Psbt, Transaction, networks, payments } from "bitcoinjs-lib";
import { Taptree } from "bitcoinjs-lib/src/types";
import { internalPubkey } from "../constants/internalPubkey";
import { NO_COORD_PK_BYTE_LENGTH } from "../constants/keys";
import { REDEEM_VERSION } from "../constants/transaction";
import { UTXO } from "../types/UTXO";
import { deriveUnbondingOutputInfo } from "../utils/staking";
import { findInputUTXO } from "../utils/utxo/findInputUTXO";
import { getPsbtInputFields } from "../utils/utxo/getPsbtInputFields";
import { BitcoinScriptType, getScriptType } from "../utils/utxo/getScriptType";
import { StakingScripts } from "./stakingScript";

/**
 * Convert a staking transaction to a PSBT.
 *
 * @param {Transaction} stakingTx - The staking transaction to convert to PSBT.
 * @param {networks.Network} network - The network to use for the PSBT.
 * @param {UTXO[]} inputUTXOs - The UTXOs to be used as inputs for the staking
 * transaction.
 * @param {Buffer} [publicKeyNoCoord] - The public key of staker (optional)
 * @returns {Psbt} - The PSBT for the staking transaction.
 * @throws {Error} If unable to create PSBT from transaction
 */
export const stakingPsbt = (
  stakingTx: Transaction,
  network: networks.Network,
  inputUTXOs: UTXO[],
  publicKeyNoCoord?: Buffer,
): Psbt => {
  if (publicKeyNoCoord && publicKeyNoCoord.length !== NO_COORD_PK_BYTE_LENGTH) {
    throw new Error("Invalid public key");
  }

  const psbt = new Psbt({ network });

  if (stakingTx.version !== undefined) psbt.setVersion(stakingTx.version);
  if (stakingTx.locktime !== undefined) psbt.setLocktime(stakingTx.locktime);

  stakingTx.ins.forEach((input) => {
    const inputUTXO = findInputUTXO(inputUTXOs, input);
    const psbtInputData = getPsbtInputFields(inputUTXO, publicKeyNoCoord);

    psbt.addInput({
      hash: input.hash,
      index: input.index,
      sequence: input.sequence,
      ...psbtInputData,
    });
  });

  stakingTx.outs.forEach((o) => {
    psbt.addOutput({ script: o.script, value: o.value });
  });

  return psbt;
};

/**
 * Convert a staking expansion transaction to a PSBT.
 *
 * @param {networks.Network} network - The Bitcoin network to use for the PSBT
 * @param {Transaction} stakingTx - The staking expansion transaction to convert
 * @param {Object} previousStakingTxInfo - Information about the previous staking transaction
 * @param {Transaction} previousStakingTxInfo.stakingTx - The previous staking transaction
 * @param {number} previousStakingTxInfo.outputIndex - The index of the staking output in the previous transaction
 * @param {UTXO[]} inputUTXOs - Available UTXOs for the funding input
 * @param {Buffer} [publicKeyNoCoord] - The staker's public key without coordinate (for Taproot)
 * @returns {Psbt} The PSBT for the staking expansion transaction
 * @throws {Error} If validation fails or required data is missing
 */
export const stakingExpansionPsbt = (
  network: networks.Network,
  stakingTx: Transaction,
  previousStakingTxInfo: {
    stakingTx: Transaction,
    outputIndex: number,
  },
  inputUTXOs: UTXO[],
  previousScripts: StakingScripts,
  publicKeyNoCoord?: Buffer,
): Psbt => {
  // Initialize PSBT with the specified network
  const psbt = new Psbt({ network });
  
  // Set transaction version and locktime if provided
  if (stakingTx.version !== undefined) psbt.setVersion(stakingTx.version);
  if (stakingTx.locktime !== undefined) psbt.setLocktime(stakingTx.locktime);

  // Validate the public key format if provided
  if (
    publicKeyNoCoord && publicKeyNoCoord.length !== NO_COORD_PK_BYTE_LENGTH
  ) {
    throw new Error("Invalid public key");
  }

  // Extract the previous staking output from the previous staking transaction
  const previousStakingOutput = previousStakingTxInfo.stakingTx.outs[
    previousStakingTxInfo.outputIndex
  ];
  if (!previousStakingOutput) {
    throw new Error("Previous staking output not found");
  };
  
  // Validate that the previous staking output is a Taproot (P2TR) script
  if (
    getScriptType(previousStakingOutput.script) !== BitcoinScriptType.P2TR
  ) {
    throw new Error("Previous staking output script type is not P2TR");
  }

  // Validate that the staking expansion transaction has exactly 2 inputs
  // Input 0: Previous staking output (existing stake)
  // Input 1: Funding UTXO (additional funds for fees or staking amount)
  if (stakingTx.ins.length !== 2) {
    throw new Error(
      "Staking expansion transaction must have exactly 2 inputs",
    );
  }

  // Validate the first input matches the previous staking transaction
  const txInputs = stakingTx.ins;
  
  // Check that the first input references the correct previous staking
  // transaction
  if (
    Buffer.from(txInputs[0].hash).reverse().toString("hex") !== previousStakingTxInfo.stakingTx.getId()
  ) {
    throw new Error("Previous staking input hash does not match");
  } 
  // Check that the first input references the correct output index
  else if (txInputs[0].index !== previousStakingTxInfo.outputIndex) {
    throw new Error("Previous staking input index does not match");
  }

  // Build input tapleaf script that spends the previous staking output
  const inputScriptTree: Taptree = [
    { output: previousScripts.slashingScript },
    [{ output: previousScripts.unbondingScript }, { output: previousScripts.timelockScript }],
  ];
  const inputRedeem = {
    output: previousScripts.unbondingScript,
    redeemVersion: REDEEM_VERSION,
  };
  const p2tr = payments.p2tr({
    internalPubkey,
    scriptTree: inputScriptTree,
    redeem: inputRedeem,
    network,
  });

  if (!p2tr.witness || p2tr.witness.length === 0) {
    throw new Error(
      "Failed to create P2TR witness for expansion transaction input"
    );
  }

  const inputTapLeafScript = {
    leafVersion: inputRedeem.redeemVersion,
    script: inputRedeem.output,
    controlBlock: p2tr.witness[p2tr.witness.length - 1],
  };

  // Add the previous staking input to the PSBT
  // This input spends the existing staking output
  psbt.addInput({
    hash: txInputs[0].hash,
    index: txInputs[0].index,
    sequence: txInputs[0].sequence,
    witnessUtxo: {
      script: previousStakingOutput.script,
      value: previousStakingOutput.value,
    },
    tapInternalKey: internalPubkey,
    tapLeafScript: [inputTapLeafScript],
  });

  // Add the second input (funding UTXO) to the PSBT
  // This input provides additional funds for fees or staking amount
  const inputUTXO = findInputUTXO(inputUTXOs, txInputs[1]);
  const psbtInputData = getPsbtInputFields(inputUTXO, publicKeyNoCoord);

  psbt.addInput({
    hash: txInputs[1].hash,
    index: txInputs[1].index,
    sequence: txInputs[1].sequence,
    ...psbtInputData,
  });

  // Add all outputs from the staking expansion transaction to the PSBT
  stakingTx.outs.forEach((o) => {
    psbt.addOutput({ script: o.script, value: o.value });
  });

  return psbt;
};

export const unbondingPsbt = (
  scripts: {
    unbondingScript: Buffer;
    timelockScript: Buffer;
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
  },
  unbondingTx: Transaction,
  stakingTx: Transaction,
  network: networks.Network,
): Psbt => {
  if (unbondingTx.outs.length !== 1) {
    throw new Error("Unbonding transaction must have exactly one output");
  }
  if (unbondingTx.ins.length !== 1) {
    throw new Error("Unbonding transaction must have exactly one input");
  }

  validateUnbondingOutput(scripts, unbondingTx, network);

  const psbt = new Psbt({ network });

  if (unbondingTx.version !== undefined) {
    psbt.setVersion(unbondingTx.version);
  }
  if (unbondingTx.locktime !== undefined) {
    psbt.setLocktime(unbondingTx.locktime);
  }

  const input = unbondingTx.ins[0];
  const outputIndex = input.index;

  // Build input tapleaf script
  const inputScriptTree: Taptree = [
    { output: scripts.slashingScript },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];

  // This is the tapleaf we are actually spending
  const inputRedeem = {
    output: scripts.unbondingScript,
    redeemVersion: REDEEM_VERSION,
  };

  // Create a P2TR payment that includes scriptTree + redeem
  const p2tr = payments.p2tr({
    internalPubkey,
    scriptTree: inputScriptTree,
    redeem: inputRedeem,
    network,
  });

  const inputTapLeafScript = {
    leafVersion: inputRedeem.redeemVersion,
    script: inputRedeem.output,
    controlBlock: p2tr.witness![p2tr.witness!.length - 1],
  };

  psbt.addInput({
    hash: input.hash,
    index: input.index,
    sequence: input.sequence,
    tapInternalKey: internalPubkey,
    witnessUtxo: {
      value: stakingTx.outs[outputIndex].value,
      script: stakingTx.outs[outputIndex].script,
    },
    tapLeafScript: [inputTapLeafScript],
  });

  psbt.addOutput({
    script: unbondingTx.outs[0].script,
    value: unbondingTx.outs[0].value,
  });

  return psbt;
};

/**
 * Validate the unbonding output for a given unbonding transaction.
 *
 * @param {Object} scripts - The scripts to use for the unbonding output.
 * @param {Transaction} unbondingTx - The unbonding transaction.
 * @param {networks.Network} network - The network to use for the unbonding output.
 */
const validateUnbondingOutput = (
  scripts: {
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
  },
  unbondingTx: Transaction,
  network: networks.Network,
) => {
  const unbondingOutputInfo = deriveUnbondingOutputInfo(scripts, network);
  if (
    unbondingOutputInfo.scriptPubKey.toString("hex") !==
    unbondingTx.outs[0].script.toString("hex")
  ) {
    throw new Error(
      "Unbonding output script does not match the expected" +
        " script while building psbt",
    );
  }
};
