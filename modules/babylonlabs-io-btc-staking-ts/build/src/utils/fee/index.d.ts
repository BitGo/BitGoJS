import { UTXO } from "../../types/UTXO";
import { TransactionOutput } from "../../types/psbtOutputs";
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
export declare const getStakingTxInputUTXOsAndFees: (availableUTXOs: UTXO[], stakingAmount: number, feeRate: number, outputs: TransactionOutput[]) => {
    selectedUTXOs: UTXO[];
    fee: number;
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
export declare const getWithdrawTxFee: (feeRate: number) => number;
