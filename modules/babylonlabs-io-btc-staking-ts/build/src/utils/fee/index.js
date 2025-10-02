"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWithdrawTxFee = exports.getStakingTxInputUTXOsAndFees = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const dustSat_1 = require("../../constants/dustSat");
const fee_1 = require("../../constants/fee");
const utils_1 = require("./utils");
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
const getStakingTxInputUTXOsAndFees = (availableUTXOs, stakingAmount, feeRate, outputs) => {
    if (availableUTXOs.length === 0) {
        throw new Error("Insufficient funds");
    }
    const validUTXOs = availableUTXOs.filter((utxo) => {
        const script = Buffer.from(utxo.scriptPubKey, "hex");
        return !!bitcoinjs_lib_1.script.decompile(script);
    });
    if (validUTXOs.length === 0) {
        throw new Error("Insufficient funds: no valid UTXOs available for staking");
    }
    // Sort available UTXOs from highest to lowest value
    const sortedUTXOs = validUTXOs.sort((a, b) => b.value - a.value);
    const selectedUTXOs = [];
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
        if (accumulatedValue - (stakingAmount + estimatedFee) > dustSat_1.BTC_DUST_SAT) {
            estimatedFee += (0, utils_1.getEstimatedChangeOutputSize)() * feeRate;
        }
        if (accumulatedValue >= stakingAmount + estimatedFee) {
            break;
        }
    }
    if (accumulatedValue < stakingAmount + estimatedFee) {
        throw new Error("Insufficient funds: unable to gather enough UTXOs to cover the staking amount and fees");
    }
    return {
        selectedUTXOs,
        fee: estimatedFee,
    };
};
exports.getStakingTxInputUTXOsAndFees = getStakingTxInputUTXOsAndFees;
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
const getWithdrawTxFee = (feeRate) => {
    const inputSize = fee_1.P2TR_INPUT_SIZE;
    const outputSize = (0, utils_1.getEstimatedChangeOutputSize)();
    return (feeRate *
        (inputSize +
            outputSize +
            fee_1.TX_BUFFER_SIZE_OVERHEAD +
            fee_1.WITHDRAW_TX_BUFFER_SIZE) +
        rateBasedTxBufferFee(feeRate));
};
exports.getWithdrawTxFee = getWithdrawTxFee;
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
const getEstimatedSize = (inputUtxos, outputs) => {
    // Estimate the input size
    const inputSize = inputUtxos.reduce((acc, u) => {
        const script = Buffer.from(u.scriptPubKey, "hex");
        const decompiledScript = bitcoinjs_lib_1.script.decompile(script);
        if (!decompiledScript) {
            // Skip UTXOs with scripts that cannot be decompiled
            return acc;
        }
        return acc + (0, utils_1.getInputSizeByScript)(script);
    }, 0);
    // Estimate the output size
    const outputSize = outputs.reduce((acc, output) => {
        if ((0, utils_1.isOP_RETURN)(output.scriptPubKey)) {
            return (acc +
                output.scriptPubKey.length +
                fee_1.OP_RETURN_OUTPUT_VALUE_SIZE +
                fee_1.OP_RETURN_VALUE_SERIALIZE_SIZE);
        }
        return acc + fee_1.MAX_NON_LEGACY_OUTPUT_SIZE;
    }, 0);
    return inputSize + outputSize + fee_1.TX_BUFFER_SIZE_OVERHEAD;
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
const rateBasedTxBufferFee = (feeRate) => {
    return feeRate <= fee_1.WALLET_RELAY_FEE_RATE_THRESHOLD
        ? fee_1.LOW_RATE_ESTIMATION_ACCURACY_BUFFER
        : 0;
};
