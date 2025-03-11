"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBuffers = exports.validateStakingTimelock = exports.validateParams = exports.validateStakingTxInputData = exports.findMatchingTxOutputIndex = exports.deriveSlashingOutput = exports.deriveUnbondingOutputInfo = exports.deriveStakingOutputInfo = exports.buildStakingTransactionOutputs = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const internalPubkey_1 = require("../../constants/internalPubkey");
const error_1 = require("../../error");
const btc_1 = require("../btc");
const unbonding_1 = require("../../constants/unbonding");
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
const buildStakingTransactionOutputs = (scripts, network, amount) => {
    const stakingOutputInfo = (0, exports.deriveStakingOutputInfo)(scripts, network);
    const transactionOutputs = [
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
exports.buildStakingTransactionOutputs = buildStakingTransactionOutputs;
/**
 * Derive the staking output address from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {StakingOutput} - The staking output address and scriptPubKey.
 * @throws {StakingError} - If the staking output address cannot be derived.
 */
const deriveStakingOutputInfo = (scripts, network) => {
    // Build outputs
    const scriptTree = [
        {
            output: scripts.slashingScript,
        },
        [{ output: scripts.unbondingScript }, { output: scripts.timelockScript }],
    ];
    // Create an pay-2-taproot (p2tr) output using the staking script
    const stakingOutput = bitcoinjs_lib_1.payments.p2tr({
        internalPubkey: internalPubkey_1.internalPubkey,
        scriptTree,
        network,
    });
    if (!stakingOutput.address) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_OUTPUT, "Failed to build staking output");
    }
    return {
        outputAddress: stakingOutput.address,
        scriptPubKey: bitcoinjs_lib_1.address.toOutputScript(stakingOutput.address, network),
    };
};
exports.deriveStakingOutputInfo = deriveStakingOutputInfo;
/**
 * Derive the unbonding output address and scriptPubKey from the staking scripts.
 *
 * @param {StakingScripts} scripts - The staking scripts.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {OutputInfo} - The unbonding output address and scriptPubKey.
 * @throws {StakingError} - If the unbonding output address cannot be derived.
 */
const deriveUnbondingOutputInfo = (scripts, network) => {
    const outputScriptTree = [
        {
            output: scripts.slashingScript,
        },
        { output: scripts.unbondingTimelockScript },
    ];
    const unbondingOutput = bitcoinjs_lib_1.payments.p2tr({
        internalPubkey: internalPubkey_1.internalPubkey,
        scriptTree: outputScriptTree,
        network,
    });
    if (!unbondingOutput.address) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_OUTPUT, "Failed to build unbonding output");
    }
    return {
        outputAddress: unbondingOutput.address,
        scriptPubKey: bitcoinjs_lib_1.address.toOutputScript(unbondingOutput.address, network),
    };
};
exports.deriveUnbondingOutputInfo = deriveUnbondingOutputInfo;
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
const deriveSlashingOutput = (scripts, network) => {
    const slashingOutput = bitcoinjs_lib_1.payments.p2tr({
        internalPubkey: internalPubkey_1.internalPubkey,
        scriptTree: { output: scripts.unbondingTimelockScript },
        network,
    });
    const slashingOutputAddress = slashingOutput.address;
    if (!slashingOutputAddress) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_OUTPUT, "Failed to build slashing output address");
    }
    return {
        outputAddress: slashingOutputAddress,
        scriptPubKey: bitcoinjs_lib_1.address.toOutputScript(slashingOutputAddress, network),
    };
};
exports.deriveSlashingOutput = deriveSlashingOutput;
/**
 * Find the matching output index for the given transaction.
 *
 * @param {Transaction} tx - The transaction.
 * @param {string} outputAddress - The output address.
 * @param {networks.Network} network - The Bitcoin network.
 * @returns {number} - The output index.
 * @throws {Error} - If the matching output is not found.
 */
const findMatchingTxOutputIndex = (tx, outputAddress, network) => {
    const index = tx.outs.findIndex(output => {
        return bitcoinjs_lib_1.address.fromOutputScript(output.script, network) === outputAddress;
    });
    if (index === -1) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_OUTPUT, `Matching output not found for address: ${outputAddress}`);
    }
    return index;
};
exports.findMatchingTxOutputIndex = findMatchingTxOutputIndex;
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
const validateStakingTxInputData = (stakingAmountSat, timelock, params, inputUTXOs, feeRate) => {
    if (stakingAmountSat < params.minStakingAmountSat ||
        stakingAmountSat > params.maxStakingAmountSat) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Invalid staking amount");
    }
    if (timelock < params.minStakingTimeBlocks ||
        timelock > params.maxStakingTimeBlocks) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Invalid timelock");
    }
    if (inputUTXOs.length == 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "No input UTXOs provided");
    }
    if (feeRate <= 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Invalid fee rate");
    }
};
exports.validateStakingTxInputData = validateStakingTxInputData;
/**
 * Validate the staking parameters.
 * Extend this method to add additional validation for staking parameters based
 * on the staking type.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the parameters are invalid.
 */
const validateParams = (params) => {
    // Check covenant public keys
    if (params.covenantNoCoordPks.length == 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Could not find any covenant public keys");
    }
    if (params.covenantNoCoordPks.length < params.covenantQuorum) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Covenant public keys must be greater than or equal to the quorum");
    }
    params.covenantNoCoordPks.forEach((pk) => {
        if (!(0, btc_1.isValidNoCoordPublicKey)(pk)) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Covenant public key should contains no coordinate");
        }
    });
    // Check other parameters
    if (params.unbondingTime <= 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Unbonding time must be greater than 0");
    }
    if (params.unbondingFeeSat <= 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Unbonding fee must be greater than 0");
    }
    if (params.maxStakingAmountSat < params.minStakingAmountSat) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Max staking amount must be greater or equal to min staking amount");
    }
    if (params.minStakingAmountSat < params.unbondingFeeSat + unbonding_1.MIN_UNBONDING_OUTPUT_VALUE) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, `Min staking amount must be greater than unbonding fee plus ${unbonding_1.MIN_UNBONDING_OUTPUT_VALUE}`);
    }
    if (params.maxStakingTimeBlocks < params.minStakingTimeBlocks) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Max staking time must be greater or equal to min staking time");
    }
    if (params.minStakingTimeBlocks <= 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Min staking time must be greater than 0");
    }
    if (params.covenantQuorum <= 0) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Covenant quorum must be greater than 0");
    }
    if (params.slashing) {
        if (params.slashing.slashingRate <= 0) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Slashing rate must be greater than 0");
        }
        if (params.slashing.slashingRate > 1) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Slashing rate must be less or equal to 1");
        }
        if (params.slashing.slashingPkScriptHex.length == 0) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Slashing public key script is missing");
        }
        if (params.slashing.minSlashingTxFeeSat <= 0) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Minimum slashing transaction fee must be greater than 0");
        }
    }
};
exports.validateParams = validateParams;
/**
 * Validate the staking timelock.
 *
 * @param {number} stakingTimelock - The staking timelock.
 * @param {StakingParams} params - The staking parameters.
 * @throws {StakingError} - If the staking timelock is invalid.
 */
const validateStakingTimelock = (stakingTimelock, params) => {
    if (stakingTimelock < params.minStakingTimeBlocks ||
        stakingTimelock > params.maxStakingTimeBlocks) {
        throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Staking transaction timelock is out of range");
    }
};
exports.validateStakingTimelock = validateStakingTimelock;
/**
 * toBuffers converts an array of strings to an array of buffers.
 *
 * @param {string[]} inputs - The input strings.
 * @returns {Buffer[]} - The buffers.
 * @throws {StakingError} - If the values cannot be converted to buffers.
 */
const toBuffers = (inputs) => {
    try {
        return inputs.map((i) => Buffer.from(i, "hex"));
    }
    catch (error) {
        throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.INVALID_INPUT, "Cannot convert values to buffers");
    }
};
exports.toBuffers = toBuffers;
