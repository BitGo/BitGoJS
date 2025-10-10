import { script as bitcoinScript } from "bitcoinjs-lib";
import { BTC_DUST_SAT } from "../../constants/dustSat";
import {
  LOW_RATE_ESTIMATION_ACCURACY_BUFFER,
  MAX_NON_LEGACY_OUTPUT_SIZE,
  OP_RETURN_OUTPUT_VALUE_SIZE,
  OP_RETURN_VALUE_SERIALIZE_SIZE,
  P2TR_INPUT_SIZE,
  P2TR_STAKING_EXPANSION_INPUT_SIZE,
  TX_BUFFER_SIZE_OVERHEAD,
  WALLET_RELAY_FEE_RATE_THRESHOLD,
  WITHDRAW_TX_BUFFER_SIZE,
} from "../../constants/fee";
import { UTXO } from "../../types/UTXO";
import {
  TransactionOutput,
} from "../../types/psbtOutputs";
import {
  getEstimatedChangeOutputSize,
  getInputSizeByScript,
  isOP_RETURN,
} from "./utils";

/**
 * Selects UTXOs and calculates the fee for a staking transaction.
 * This method selects the highest value UTXOs from all available UTXOs to
 * cover the staking amount and the transaction fees.
 * The formula used is:
 *
 * totalFee = (inputSize + outputSize) * feeRate + buffer
 * where outputSize may or may not include the change output size depending on the remaining value.
 *
 * @param availableUTXOs - All available UTXOs from the wallet.
 * @param stakingAmount - The amount to stake.
 * @param feeRate - The fee rate in satoshis per byte.
 * @param outputs - The outputs in the transaction.
 * @returns An object containing the selected UTXOs and the fee.
 * @throws Will throw an error if there are insufficient funds or if the fee cannot be calculated.
 */
export const getStakingTxInputUTXOsAndFees = (
  availableUTXOs: UTXO[],
  stakingAmount: number,
  feeRate: number,
  outputs: TransactionOutput[],
): {
  selectedUTXOs: UTXO[];
  fee: number;
} => {
  if (availableUTXOs.length === 0) {
    throw new Error("Insufficient funds");
  }

  const validUTXOs = availableUTXOs.filter((utxo) => {
    const script = Buffer.from(utxo.scriptPubKey, "hex");
    return !!bitcoinScript.decompile(script);
  });

  if (validUTXOs.length === 0) {
    throw new Error("Insufficient funds: no valid UTXOs available for staking");
  }

  // Sort available UTXOs from highest to lowest value
  const sortedUTXOs = validUTXOs.sort((a, b) => b.value - a.value);

  const selectedUTXOs: UTXO[] = [];
  let accumulatedValue = 0;
  let estimatedFee = 0;

  for (const utxo of sortedUTXOs) {
    selectedUTXOs.push(utxo);
    accumulatedValue += utxo.value;

    // Calculate the fee for the current set of UTXOs and outputs
    const estimatedSize = getEstimatedSize(selectedUTXOs, outputs);
    estimatedFee = estimatedSize * feeRate + rateBasedTxBufferFee(feeRate);
    // Check if there will be any change left after the staking amount and fee.
    // If there is, a change output needs to be added, which also comes with an additional fee.
    if (accumulatedValue - (stakingAmount + estimatedFee) > BTC_DUST_SAT) {
      estimatedFee += getEstimatedChangeOutputSize() * feeRate;
    }
    if (accumulatedValue >= stakingAmount + estimatedFee) {
      break;
    }
  }

  if (accumulatedValue < stakingAmount + estimatedFee) {
    throw new Error(
      "Insufficient funds: unable to gather enough UTXOs to cover the staking amount and fees",
    );
  }

  return {
    selectedUTXOs,
    fee: estimatedFee,
  };
};

/**
 * Calculates the required funding UTXO and fees for a staking expansion transaction.
 * 
 * This function selects a single UTXO from available UTXOs to cover:
 * 1. Transaction fees for the expansion
 * 2. Any additional staking amount beyond the previous stake
 * 
 * @param availableUTXOs - List of available UTXOs to choose from for funding
 * @param previousStakingTx - Details of the previous staking transaction being expanded
 * @param stakingAmount - Total staking amount for the expansion (includes previous + additional)
 * @param feeRate - Fee rate in satoshis per byte
 * @param outputs - Transaction outputs for the expansion
 * @returns Object containing the selected funding UTXO and calculated fee
 */
export const getStakingExpansionTxFundingUTXOAndFees = (
  availableUTXOs: UTXO[],
  feeRate: number,
  outputs: TransactionOutput[],
): {
  selectedUTXO: UTXO;
  fee: number;
} => {
  // Validate that we have UTXOs to work with
  if (availableUTXOs.length === 0) {
    throw new Error("Insufficient funds");
  }

  // Filter out invalid UTXOs by checking if their script can be decompiled
  // This ensures we only work with properly formatted Bitcoin scripts
  const validUTXOs = availableUTXOs.filter((utxo) => {
    const script = Buffer.from(utxo.scriptPubKey, "hex");
    const decompiledScript = bitcoinScript.decompile(script);
    return decompiledScript && decompiledScript.length > 0;
  });

  if (validUTXOs.length === 0) {
    throw new Error("Insufficient funds: no valid UTXOs available for staking");
  }

  // Sort available UTXOs from lowest to highest value for optimal selection
  // This helps us avoid selecting large UTXOs which can be used
  // for other activities.
  const sortedUTXOs = validUTXOs.sort((a, b) => a.value - b.value);

  // Iterate through UTXOs to find one that can cover the required fees
  for (const utxo of sortedUTXOs) {
    // Calculate the estimated transaction size including:
    // - Base transaction size (additional UTXOs + Outputs)
    // - Previous staking transaction output as the input for the expansion tx
    // Note: Staking transactions use P2TR (Taproot) format,
    // hence P2TR_STAKING_EXPANSION_INPUT_SIZE accounts for the witness size
    // including covenant signatures and is calibrated for a typical covenant
    // quorum of 6 signatures.
    const estimatedSize = getEstimatedSize(
      [utxo],
      outputs,
    ) + P2TR_STAKING_EXPANSION_INPUT_SIZE;
    
    // Calculate base fee: size * rate + buffer fee for network congestion
    let estimatedFee = estimatedSize * feeRate + rateBasedTxBufferFee(feeRate);
    
    // Check if this UTXO has enough value to cover the estimated fee
    // We are selecting a UTXO that can only cover the fee as
    // in the case of stake expansion we only want the additional UTXO to cover
    // the staking fee.
    // TODO: In the future, we will want to support selecting a UTXO for an increased
    // staking amount.
    if (utxo.value >= estimatedFee) {
      // Check if there will be change left after paying the fee
      // If change amount is above dust threshold, we need to add a change output
      // which increases the transaction size and fee
      if (utxo.value - estimatedFee > BTC_DUST_SAT) {
        // Add fee for the change output
        estimatedFee += getEstimatedChangeOutputSize() * feeRate;
      }
      // Finally, ensure the estimated fee is not greater than the UTXO value
      if (utxo.value >= estimatedFee) {
        return {
          selectedUTXO: utxo,
          fee: estimatedFee,
        };
      }
      // If the UTXO value is less than the estimated fee, we need to continue
      // searching for a UTXO that can cover the fees.
    }
  }
  
  // If no UTXO can cover the fees, throw an error
  throw new Error(
    "Insufficient funds: unable to find a UTXO to cover the fees for the staking expansion transaction.",
  );
};


/**
 * Calculates the estimated fee for a withdrawal transaction.
 * The fee calculation is based on estimated constants for input size,
 * output size, and additional overhead specific to withdrawal transactions.
 * Due to the slightly larger size of withdrawal transactions, an additional
 * buffer is included to account for this difference.
 *
 * @param feeRate - The fee rate in satoshis per vbyte.
 * @returns The estimated fee for a withdrawal transaction in satoshis.
 */
export const getWithdrawTxFee = (feeRate: number): number => {
  const inputSize = P2TR_INPUT_SIZE;
  const outputSize = getEstimatedChangeOutputSize();
  return (
    feeRate *
      (inputSize +
        outputSize +
        TX_BUFFER_SIZE_OVERHEAD +
        WITHDRAW_TX_BUFFER_SIZE) +
    rateBasedTxBufferFee(feeRate)
  );
};


/**
 * Calculates the estimated transaction size using a heuristic formula which
 * includes the input size, output size, and a fixexd buffer for the transaction size.
 * The formula used is:
 *
 * totalSize = inputSize + outputSize + TX_BUFFER_SIZE_OVERHEAD
 *
 * @param inputUtxos - The UTXOs used as inputs in the transaction.
 * @param outputs - The outputs in the transaction.
 * @returns The estimated transaction size in bytes.
 */
const getEstimatedSize = (
  inputUtxos: UTXO[],
  outputs: TransactionOutput[],
): number => {
  // Estimate the input size
  const inputSize = inputUtxos.reduce((acc: number, u: UTXO): number => {
    const script = Buffer.from(u.scriptPubKey, "hex");
    const decompiledScript = bitcoinScript.decompile(script);
    if (!decompiledScript) {
      // Skip UTXOs with scripts that cannot be decompiled
      return acc;
    }
    return acc + getInputSizeByScript(script);
  }, 0);

  // Estimate the output size
  const outputSize = outputs.reduce((acc, output): number => {
    if (isOP_RETURN(output.scriptPubKey)) {
      return (
        acc +
        output.scriptPubKey.length +
        OP_RETURN_OUTPUT_VALUE_SIZE +
        OP_RETURN_VALUE_SERIALIZE_SIZE
      );
    }
    return acc + MAX_NON_LEGACY_OUTPUT_SIZE;
  }, 0);

  return inputSize + outputSize + TX_BUFFER_SIZE_OVERHEAD;
};

/**
 * Adds a buffer to the transaction size-based fee calculation if the fee rate is low.
 * Some wallets have a relayer fee requirement, which means if the fee rate is
 * less than or equal to WALLET_RELAY_FEE_RATE_THRESHOLD (2 satoshis per byte),
 * there is a risk that the fee might not be sufficient to get the transaction relayed.
 * To mitigate this risk, we add a buffer to the fee calculation to ensure that
 * the transaction can be relayed.
 *
 * If the fee rate is less than or equal to WALLET_RELAY_FEE_RATE_THRESHOLD, a fixed buffer is added
 * (LOW_RATE_ESTIMATION_ACCURACY_BUFFER). If the fee rate is higher, no buffer is added.
 *
 * @param feeRate - The fee rate in satoshis per byte.
 * @returns The buffer amount in satoshis to be added to the transaction fee.
 */
const rateBasedTxBufferFee = (feeRate: number): number => {
  return feeRate <= WALLET_RELAY_FEE_RATE_THRESHOLD
    ? LOW_RATE_ESTIMATION_ACCURACY_BUFFER
    : 0;
};
