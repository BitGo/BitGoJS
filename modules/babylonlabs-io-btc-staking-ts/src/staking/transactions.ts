import { Psbt, Transaction, networks, payments, script, address } from "bitcoinjs-lib";
import { Taptree } from "bitcoinjs-lib/src/types";

import { BTC_DUST_SAT } from "../constants/dustSat";
import { internalPubkey } from "../constants/internalPubkey";
import { UTXO } from "../types/UTXO";
import { PsbtResult, TransactionResult } from "../types/transaction";
import { isValidBitcoinAddress, transactionIdToHash } from "../utils/btc";
import { getStakingTxInputUTXOsAndFees, getWithdrawTxFee } from "../utils/fee";
import { inputValueSum } from "../utils/fee/utils";
import { buildStakingTransactionOutputs, deriveUnbondingOutputInfo } from "../utils/staking";
import { NON_RBF_SEQUENCE, TRANSACTION_VERSION } from "../constants/psbt";
import { CovenantSignature } from "../types/covenantSignatures";
import { REDEEM_VERSION } from "../constants/transaction";

// https://bips.xyz/370
const BTC_LOCKTIME_HEIGHT_TIME_CUTOFF = 500000000;

/**
 * Constructs an unsigned BTC Staking transaction in psbt format.
 *
 * Outputs:
 * - psbt:
 *   - The first output corresponds to the staking script with the specified amount.
 *   - The second output corresponds to the change from spending the amount and the transaction fee.
 *   - If a data embed script is provided, it will be added as the second output, and the fee will be the third output.
 * - fee: The total fee amount for the transaction.
 *
 * Inputs:
 * - scripts:
 *   - timelockScript, unbondingScript, slashingScript: Scripts for different transaction types.
 *   - dataEmbedScript: Optional data embed script.
 * - amount: Amount to stake.
 * - changeAddress: Address to send the change to.
 * - inputUTXOs: All available UTXOs from the wallet.
 * - network: Bitcoin network.
 * - feeRate: Fee rate in satoshis per byte.
 * - publicKeyNoCoord: Public key if the wallet is in taproot mode.
 * - lockHeight: Optional block height locktime to set for the transaction (i.e., not mined until the block height).
 *
 * @param {Object} scripts - Scripts used to construct the taproot output.
 * such as timelockScript, unbondingScript, slashingScript, and dataEmbedScript.
 * @param {number} amount - The amount to stake.
 * @param {string} changeAddress - The address to send the change to.
 * @param {UTXO[]} inputUTXOs - All available UTXOs from the wallet.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} feeRate - The fee rate in satoshis per byte.
 * @param {number} [lockHeight] - The optional block height locktime.
 * @returns {TransactionResult} - An object containing the unsigned transaction and fee
 * @throws Will throw an error if the amount or fee rate is less than or equal
 * to 0, if the change address is invalid, or if the public key is invalid.
 */
export function stakingTransaction(
  scripts: {
    timelockScript: Buffer;
    unbondingScript: Buffer;
    slashingScript: Buffer;
    dataEmbedScript?: Buffer;
  },
  amount: number,
  changeAddress: string,
  inputUTXOs: UTXO[],
  network: networks.Network,
  feeRate: number,
  lockHeight?: number,
): TransactionResult {
  // Check that amount and fee are bigger than 0
  if (amount <= 0 || feeRate <= 0) {
    throw new Error("Amount and fee rate must be bigger than 0");
  }

  // Check whether the change address is a valid Bitcoin address.
  if (!isValidBitcoinAddress(changeAddress, network)) {
    throw new Error("Invalid change address");
  }

  // Build outputs and estimate the fee
  const stakingOutputs = buildStakingTransactionOutputs(scripts, network, amount);
  const { selectedUTXOs, fee } = getStakingTxInputUTXOsAndFees(
    inputUTXOs,
    amount,
    feeRate,
    stakingOutputs,
  );

  const tx = new Transaction();
  tx.version = TRANSACTION_VERSION;
  
  for (let i = 0; i < selectedUTXOs.length; ++i) {
    const input = selectedUTXOs[i];
    tx.addInput(
      transactionIdToHash(input.txid),
      input.vout,
      NON_RBF_SEQUENCE,
    );
  }

  stakingOutputs.forEach((o) => {
    tx.addOutput(o.scriptPubKey, o.value);
  });

  // Add a change output only if there's any amount leftover from the inputs
  const inputsSum = inputValueSum(selectedUTXOs);
  // Check if the change amount is above the dust limit, and if so, add it as a change output
  if (inputsSum - (amount + fee) > BTC_DUST_SAT) {
    tx.addOutput(
      address.toOutputScript(changeAddress, network),
      inputsSum - (amount + fee),
    );
  }

  // Set the locktime field if provided. If not provided, the locktime will be set to 0 by default
  // Only height based locktime is supported
  if (lockHeight) {
    if (lockHeight >= BTC_LOCKTIME_HEIGHT_TIME_CUTOFF) {
      throw new Error("Invalid lock height");
    }
    tx.locktime = lockHeight;
  }

  return {
    transaction: tx,
    fee,
  };
}

/**
 * Constructs a withdrawal transaction for manually unbonded delegation.
 *
 * This transaction spends the unbonded output from the staking transaction.
 *
 * Inputs:
 * - scripts: Scripts used to construct the taproot output.
 *   - unbondingTimelockScript: Script for the unbonding timelock condition.
 *   - slashingScript: Script for the slashing condition.
 * - unbondingTx: The unbonding transaction.
 * - withdrawalAddress: The address to send the withdrawn funds to.
 * - network: The Bitcoin network.
 * - feeRate: The fee rate for the transaction in satoshis per byte.
 *
 * Returns:
 * - psbt: The partially signed transaction (PSBT).
 *
 * @param {Object} scripts - The scripts used in the transaction.
 * @param {Transaction} unbondingTx - The unbonding transaction.
 * @param {string} withdrawalAddress - The address to send the withdrawn funds to.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
 * @returns {PsbtResult} An object containing the partially signed transaction (PSBT).
 */
export function withdrawEarlyUnbondedTransaction(
  scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
  },
  unbondingTx: Transaction,
  withdrawalAddress: string,
  network: networks.Network,
  feeRate: number,
): PsbtResult {
  const scriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    { output: scripts.unbondingTimelockScript },
  ];

  return withdrawalTransaction(
    {
      timelockScript: scripts.unbondingTimelockScript,
    },
    scriptTree,
    unbondingTx,
    withdrawalAddress,
    network,
    feeRate,
    0, // unbonding always has a single output
  );
}

/**
 * Constructs a withdrawal transaction for naturally unbonded delegation.
 *
 * This transaction spends the unbonded output from the staking transaction when the timelock has expired.
 *
 * Inputs:
 * - scripts: Scripts used to construct the taproot output.
 *   - timelockScript: Script for the timelock condition.
 *   - slashingScript: Script for the slashing condition.
 *   - unbondingScript: Script for the unbonding condition.
 * - tx: The original staking transaction.
 * - withdrawalAddress: The address to send the withdrawn funds to.
 * - network: The Bitcoin network.
 * - feeRate: The fee rate for the transaction in satoshis per byte.
 * - outputIndex: The index of the output to be spent in the original transaction (default is 0).
 *
 * Returns:
 * - psbt: The partially signed transaction (PSBT).
 *
 * @param {Object} scripts - The scripts used in the transaction.
 * @param {Transaction} tx - The original staking transaction.
 * @param {string} withdrawalAddress - The address to send the withdrawn funds to.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
 * @param {number} [outputIndex=0] - The index of the output to be spent in the original transaction.
 * @returns {PsbtResult} An object containing the partially signed transaction (PSBT).
 */
export function withdrawTimelockUnbondedTransaction(
  scripts: {
    timelockScript: Buffer;
    slashingScript: Buffer;
    unbondingScript: Buffer;
  },
  tx: Transaction,
  withdrawalAddress: string,
  network: networks.Network,
  feeRate: number,
  outputIndex: number = 0,
): PsbtResult {
  const scriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];

  return withdrawalTransaction(
    scripts,
    scriptTree,
    tx,
    withdrawalAddress,
    network,
    feeRate,
    outputIndex,
  );
}

/**
 * Constructs a withdrawal transaction for a slashing transaction.
 *
 * This transaction spends the output from the slashing transaction.
 *
 * @param {Object} scripts - The unbondingTimelockScript
 * We use the unbonding timelock script as the timelock of the slashing transaction.
 * This is due to slashing tx timelock is the same as the unbonding timelock.
 * @param {Transaction} slashingTx - The slashing transaction.
 * @param {string} withdrawalAddress - The address to send the withdrawn funds to.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
 * @param {number} outputIndex - The index of the output to be spent in the original transaction.
 * @returns {PsbtResult} An object containing the partially signed transaction (PSBT).
 */
export function withdrawSlashingTransaction(
  scripts: {
    unbondingTimelockScript: Buffer;
  },
  slashingTx: Transaction,
  withdrawalAddress: string,
  network: networks.Network,
  feeRate: number,
  outputIndex: number,
): PsbtResult {
  const scriptTree: Taptree = { output: scripts.unbondingTimelockScript };

  return withdrawalTransaction(
    {
      timelockScript: scripts.unbondingTimelockScript,
    },
    scriptTree,
    slashingTx,
    withdrawalAddress,
    network,
    feeRate,
    outputIndex,
  );
}

// withdrawalTransaction generates a transaction that
// spends the staking output of the staking transaction
function withdrawalTransaction(
  scripts: {
    timelockScript: Buffer;
  },
  scriptTree: Taptree,
  tx: Transaction,
  withdrawalAddress: string,
  network: networks.Network,
  feeRate: number,
  outputIndex: number = 0,
): PsbtResult {
  // Check that withdrawal feeRate is bigger than 0
  if (feeRate <= 0) {
    throw new Error("Withdrawal feeRate must be bigger than 0");
  }

  // Check that outputIndex is bigger or equal to 0
  if (outputIndex < 0) {
    throw new Error("Output index must be bigger or equal to 0");
  }

  // position of time in the timelock script
  const timePosition = 2;
  const decompiled = script.decompile(scripts.timelockScript);

  if (!decompiled) {
    throw new Error("Timelock script is not valid");
  }

  let timelock = 0;

  // if the timelock is a buffer, it means it's a number bigger than 16 blocks
  if (typeof decompiled[timePosition] !== "number") {
    const timeBuffer = decompiled[timePosition] as Buffer;
    timelock = script.number.decode(timeBuffer);
  } else {
    // in case timelock is <= 16 it will be a number, not a buffer
    const wrap = decompiled[timePosition] % 16;
    timelock = wrap === 0 ? 16 : wrap;
  }

  const redeem = {
    output: scripts.timelockScript,
    redeemVersion: REDEEM_VERSION,
  };

  const p2tr = payments.p2tr({
    internalPubkey,
    scriptTree,
    redeem,
    network,
  });

  const tapLeafScript = {
    leafVersion: redeem.redeemVersion,
    script: redeem.output,
    controlBlock: p2tr.witness![p2tr.witness!.length - 1],
  };

  const psbt = new Psbt({ network });

  // only transactions with version 2 can trigger OP_CHECKSEQUENCEVERIFY
  // https://github.com/btcsuite/btcd/blob/master/txscript/opcode.go#L1174
  psbt.setVersion(TRANSACTION_VERSION);

  psbt.addInput({
    hash: tx.getHash(),
    index: outputIndex,
    tapInternalKey: internalPubkey,
    witnessUtxo: {
      value: tx.outs[outputIndex].value,
      script: tx.outs[outputIndex].script,
    },
    tapLeafScript: [tapLeafScript],
    sequence: timelock,
  });

  const estimatedFee = getWithdrawTxFee(feeRate);
  const outputValue = tx.outs[outputIndex].value - estimatedFee;
  if (outputValue < 0) {
    throw new Error(
      "Not enough funds to cover the fee for withdrawal transaction",
    );
  }
  if (outputValue < BTC_DUST_SAT) {
    throw new Error("Output value is less than dust limit");
  }
  psbt.addOutput({
    address: withdrawalAddress,
    value: outputValue,
  });

  // Withdraw transaction has no time-based restrictions and can be included 
  // in the next block immediately.
  psbt.setLocktime(0);

  return {
    psbt,
    fee: estimatedFee,
  };
}

/**
 * Constructs a slashing transaction for a staking output without prior unbonding.
 *
 * This transaction spends the staking output of the staking transaction and distributes the funds
 * according to the specified slashing rate.
 *
 * Outputs:
 * - The first output sends `input * slashing_rate` funds to the slashing address.
 * - The second output sends `input * (1 - slashing_rate) - fee` funds back to the user's address.
 *
 * Inputs:
 * - scripts: Scripts used to construct the taproot output.
 *   - slashingScript: Script for the slashing condition.
 *   - timelockScript: Script for the timelock condition.
 *   - unbondingScript: Script for the unbonding condition.
 *   - unbondingTimelockScript: Script for the unbonding timelock condition.
 * - transaction: The original staking transaction.
 * - slashingAddress: The address to send the slashed funds to.
 * - slashingRate: The rate at which the funds are slashed (0 < slashingRate < 1).
 * - minimumFee: The minimum fee for the transaction in satoshis.
 * - network: The Bitcoin network.
 * - outputIndex: The index of the output to be spent in the original transaction (default is 0).
 *
 * @param {Object} scripts - The scripts used in the transaction.
 * @param {Transaction} stakingTransaction - The original staking transaction.
 * @param {string} slashingPkScriptHex - The public key script to send the slashed funds to.
 * @param {number} slashingRate - The rate at which the funds are slashed.
 * @param {number} minimumFee - The minimum fee for the transaction in satoshis.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} [outputIndex=0] - The index of the output to be spent in the original transaction.
 * @returns {{ psbt: Psbt }} An object containing the partially signed transaction (PSBT).
 */
export function slashTimelockUnbondedTransaction(
  scripts: {
    slashingScript: Buffer;
    timelockScript: Buffer;
    unbondingScript: Buffer;
    unbondingTimelockScript: Buffer;
  },
  stakingTransaction: Transaction,
  slashingPkScriptHex: string,
  slashingRate: number,
  minimumFee: number,
  network: networks.Network,
  outputIndex: number = 0,
): { psbt: Psbt } {
  const slashingScriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
  ];
  return slashingTransaction(
    {
      unbondingTimelockScript: scripts.unbondingTimelockScript,
      slashingScript: scripts.slashingScript,
    },
    slashingScriptTree,
    stakingTransaction,
    slashingPkScriptHex,
    slashingRate,
    minimumFee,
    network,
    outputIndex,
  );
}

/**
 * Constructs a slashing transaction for an early unbonded transaction.
 *
 * This transaction spends the staking output of the staking transaction and distributes the funds
 * according to the specified slashing rate.
 *
 * Transaction outputs:
 * - The first output sends `input * slashing_rate` funds to the slashing address.
 * - The second output sends `input * (1 - slashing_rate) - fee` funds back to the user's address.
 *
 * @param {Object} scripts - The scripts used in the transaction. e.g slashingScript, unbondingTimelockScript
 * @param {Transaction} unbondingTx - The unbonding transaction.
 * @param {string} slashingPkScriptHex - The public key script to send the slashed funds to.
 * @param {number} slashingRate - The rate at which the funds are slashed.
 * @param {number} minimumSlashingFee - The minimum fee for the transaction in satoshis.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {{ psbt: Psbt }} An object containing the partially signed transaction (PSBT).
 */
export function slashEarlyUnbondedTransaction(
  scripts: {
    slashingScript: Buffer;
    unbondingTimelockScript: Buffer;
  },
  unbondingTx: Transaction,
  slashingPkScriptHex: string,
  slashingRate: number,
  minimumSlashingFee: number,
  network: networks.Network,
): { psbt: Psbt } {
  const unbondingScriptTree: Taptree = [
    {
      output: scripts.slashingScript,
    },
    {
      output: scripts.unbondingTimelockScript,
    },
  ];
  return slashingTransaction(
    {
      unbondingTimelockScript: scripts.unbondingTimelockScript,
      slashingScript: scripts.slashingScript,
    },
    unbondingScriptTree,
    unbondingTx,
    slashingPkScriptHex,
    slashingRate,
    minimumSlashingFee,
    network,
    0, // unbonding always has a single output
  );
}

/**
 * Constructs a slashing transaction for an on-demand unbonding.
 *
 * This transaction spends the staking output of the staking transaction and distributes the funds
 * according to the specified slashing rate.
 *
 * Transaction outputs:
 * - The first output sends `input * slashing_rate` funds to the slashing address.
 * - The second output sends `input * (1 - slashing_rate) - fee` funds back to the user's address.
 *
 * @param {Object} scripts - The scripts used in the transaction. e.g slashingScript, unbondingTimelockScript
 * @param {Transaction} transaction - The original staking/unbonding transaction.
 * @param {string} slashingPkScriptHex - The public key script to send the slashed funds to.
 * @param {number} slashingRate - The rate at which the funds are slashed. Two decimal places, otherwise it will be rounded down.
 * @param {number} minimumFee - The minimum fee for the transaction in satoshis.
 * @param {networks.Network} network - The Bitcoin network.
 * @param {number} [outputIndex=0] - The index of the output to be spent in the original transaction.
 * @returns {{ psbt: Psbt }} An object containing the partially signed transaction (PSBT).
 */
function slashingTransaction(
  scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
  },
  scriptTree: Taptree,
  transaction: Transaction,
  slashingPkScriptHex: string,
  slashingRate: number,
  minimumFee: number,
  network: networks.Network,
  outputIndex: number = 0,
): {
  psbt: Psbt;
} {
  // Check that slashing rate and minimum fee are bigger than 0
  if (slashingRate <= 0 || slashingRate >= 1) {
    throw new Error("Slashing rate must be between 0 and 1");
  }
  // Round the slashing rate to two decimal places
  slashingRate = parseFloat(slashingRate.toFixed(2));
  // Minimum fee must be a postive integer
  if (minimumFee <= 0 || !Number.isInteger(minimumFee)) {
    throw new Error("Minimum fee must be a positve integer");
  }

  // Check that outputIndex is bigger or equal to 0
  if (outputIndex < 0 || !Number.isInteger(outputIndex)) {
    throw new Error("Output index must be an integer bigger or equal to 0");
  }

  // Check that outputIndex is within the bounds of the transaction
  if (!transaction.outs[outputIndex]) {
    throw new Error("Output index is out of range");
  }

  const redeem = {
    output: scripts.slashingScript,
    redeemVersion: REDEEM_VERSION,
  };

  const p2tr = payments.p2tr({
    internalPubkey,
    scriptTree,
    redeem,
    network,
  });

  const tapLeafScript = {
    leafVersion: redeem.redeemVersion,
    script: redeem.output,
    controlBlock: p2tr.witness![p2tr.witness!.length - 1],
  };

  const stakingAmount = transaction.outs[outputIndex].value;
  // Slashing rate is a percentage of the staking amount, rounded down to
  // the nearest integer to avoid sending decimal satoshis
  const slashingAmount = Math.floor(stakingAmount * slashingRate);
  if (slashingAmount <= BTC_DUST_SAT) {
    throw new Error("Slashing amount is less than dust limit");
  }

  const userFunds = stakingAmount - slashingAmount - minimumFee;
  if (userFunds <= BTC_DUST_SAT) {
    throw new Error("User funds are less than dust limit");
  }
 
  const psbt = new Psbt({ network });
  psbt.setVersion(TRANSACTION_VERSION);

  psbt.addInput({
    hash: transaction.getHash(),
    index: outputIndex,
    tapInternalKey: internalPubkey,
    witnessUtxo: {
      value: stakingAmount,
      script: transaction.outs[outputIndex].script,
    },
    tapLeafScript: [tapLeafScript],
    // not RBF-able
    sequence: NON_RBF_SEQUENCE,
  });

  // Add the slashing output
  psbt.addOutput({
    script: Buffer.from(slashingPkScriptHex, "hex"),
    value: slashingAmount,
  });

  // Change output contains unbonding timelock script
  const changeOutput = payments.p2tr({
    internalPubkey,
    scriptTree: { output: scripts.unbondingTimelockScript },
    network,
  });
  // Add the change output
  psbt.addOutput({
    address: changeOutput.address!,
    value: userFunds,
  });

  // Slashing transaction has no time-based restrictions and can be included 
  // in the next block immediately.
  psbt.setLocktime(0);

  return { psbt };
}

export function unbondingTransaction(
  scripts: {
    unbondingTimelockScript: Buffer;
    slashingScript: Buffer;
  },
  stakingTx: Transaction,
  unbondingFee: number,
  network: networks.Network,
  outputIndex: number = 0,
): TransactionResult {
  // Check that transaction fee is bigger than 0
  if (unbondingFee <= 0) {
    throw new Error("Unbonding fee must be bigger than 0");
  }

  // Check that outputIndex is bigger or equal to 0
  if (outputIndex < 0) {
    throw new Error("Output index must be bigger or equal to 0");
  }

  const tx = new Transaction();
  tx.version = TRANSACTION_VERSION;

  tx.addInput(
    stakingTx.getHash(),
    outputIndex,
    NON_RBF_SEQUENCE, // not RBF-able
  );

  const unbondingOutputInfo = deriveUnbondingOutputInfo(scripts, network);

  const outputValue = stakingTx.outs[outputIndex].value - unbondingFee;
  if (outputValue < BTC_DUST_SAT) {
    throw new Error("Output value is less than dust limit for unbonding transaction");
  }
  // Add the unbonding output
  if (!unbondingOutputInfo.outputAddress) {
    throw new Error("Unbonding output address is not defined");
  }
  tx.addOutput(
    unbondingOutputInfo.scriptPubKey,
    outputValue,
  );

  // Unbonding transaction has no time-based restrictions and can be included 
  // in the next block immediately.
  tx.locktime = 0;

  return {
    transaction: tx,
    fee: unbondingFee,
  };
}

// This function attaches covenant signatures as the transaction's witness
// Note that the witness script expects exactly covenantQuorum number of signatures
// to match the covenant parameters.
export const createCovenantWitness = (
  originalWitness: Buffer[],
  paramsCovenants: Buffer[],
  covenantSigs: CovenantSignature[],
  covenantQuorum: number,
) => {
  if (covenantSigs.length < covenantQuorum) {
    throw new Error(
      `Not enough covenant signatures. Required: ${covenantQuorum}, `
      + `got: ${covenantSigs.length}`
    );
  }
  // Verify all btcPkHex from covenantSigs exist in paramsCovenants
  for (const sig of covenantSigs) {
    const btcPkHexBuf = Buffer.from(sig.btcPkHex, "hex");
    if (!paramsCovenants.some(covenant => covenant.equals(btcPkHexBuf))) {
      throw new Error(
        `Covenant signature public key ${sig.btcPkHex} not found in params covenants`
      );
    }
  }
  // We only take exactly covenantQuorum number of signatures, even if more are provided.
  // Including extra signatures will cause the unbonding transaction to fail validation.
  // This is because the witness script expects exactly covenantQuorum number of signatures
  // to match the covenant parameters.
  const covenantSigsBuffers = covenantSigs
    .slice(0, covenantQuorum)
    .map((sig) => ({
      btcPkHex: Buffer.from(sig.btcPkHex, "hex"),
      sigHex: Buffer.from(sig.sigHex, "hex"),
    }));

  // we need covenant from params to be sorted in reverse order
  const paramsCovenantsSorted = [...paramsCovenants]
    .sort(Buffer.compare)
    .reverse();

  const composedCovenantSigs = paramsCovenantsSorted.map((covenant) => {
    // in case there's covenant with this btc_pk_hex we return the sig
    // otherwise we return empty Buffer
    const covenantSig = covenantSigsBuffers.find(
      (sig) => sig.btcPkHex.compare(covenant) === 0,
    );
    return covenantSig?.sigHex || Buffer.alloc(0);
  });

  return [...composedCovenantSigs, ...originalWitness];
};
