"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staking = void 0;
const stakingScript_1 = require("./stakingScript");
const error_1 = require("../error");
const transactions_1 = require("./transactions");
const btc_1 = require("../utils/btc");
const staking_1 = require("../utils/staking");
const staking_2 = require("../utils/staking");
const psbt_1 = require("./psbt");
__exportStar(require("./stakingScript"), exports);
class Staking {
    constructor(network, stakerInfo, params, finalityProviderPkNoCoordHex, stakingTimelock) {
        // Perform validations
        if (!(0, btc_1.isValidBitcoinAddress)(stakerInfo.address, network)) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Invalid staker bitcoin address");
        }
        if (!(0, btc_1.isValidNoCoordPublicKey)(stakerInfo.publicKeyNoCoordHex)) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Invalid staker public key");
        }
        if (!(0, btc_1.isValidNoCoordPublicKey)(finalityProviderPkNoCoordHex)) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Invalid finality provider public key");
        }
        (0, staking_1.validateParams)(params);
        (0, staking_1.validateStakingTimelock)(stakingTimelock, params);
        this.network = network;
        this.stakerInfo = stakerInfo;
        this.params = params;
        this.finalityProviderPkNoCoordHex = finalityProviderPkNoCoordHex;
        this.stakingTimelock = stakingTimelock;
    }
    /**
     * buildScripts builds the staking scripts for the staking transaction.
     * Note: different staking types may have different scripts.
     * e.g the observable staking script has a data embed script.
     *
     * @returns {StakingScripts} - The staking scripts.
     */
    buildScripts() {
        const { covenantQuorum, covenantNoCoordPks, unbondingTime } = this.params;
        // Create staking script data
        let stakingScriptData;
        try {
            stakingScriptData = new stakingScript_1.StakingScriptData(Buffer.from(this.stakerInfo.publicKeyNoCoordHex, "hex"), [Buffer.from(this.finalityProviderPkNoCoordHex, "hex")], (0, staking_2.toBuffers)(covenantNoCoordPks), covenantQuorum, this.stakingTimelock, unbondingTime);
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.SCRIPT_FAILURE, "Cannot build staking script data");
        }
        // Build scripts
        let scripts;
        try {
            scripts = stakingScriptData.buildScripts();
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.SCRIPT_FAILURE, "Cannot build staking scripts");
        }
        return scripts;
    }
    /**
     * Create a staking transaction for staking.
     *
     * @param {number} stakingAmountSat - The amount to stake in satoshis.
     * @param {UTXO[]} inputUTXOs - The UTXOs to use as inputs for the staking
     * transaction.
     * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
     * @returns {TransactionResult} - An object containing the unsigned
     * transaction, and fee
     * @throws {StakingError} - If the transaction cannot be built
     */
    createStakingTransaction(stakingAmountSat, inputUTXOs, feeRate) {
        (0, staking_1.validateStakingTxInputData)(stakingAmountSat, this.stakingTimelock, this.params, inputUTXOs, feeRate);
        const scripts = this.buildScripts();
        try {
            const { transaction, fee } = (0, transactions_1.stakingTransaction)(scripts, stakingAmountSat, this.stakerInfo.address, inputUTXOs, this.network, feeRate);
            return {
                transaction,
                fee,
            };
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build unsigned staking transaction");
        }
    }
    ;
    /**
     * Create a staking psbt based on the existing staking transaction.
     *
     * @param {Transaction} stakingTx - The staking transaction.
     * @param {UTXO[]} inputUTXOs - The UTXOs to use as inputs for the staking
     * transaction. The UTXOs that were used to create the staking transaction should
     * be included in this array.
     * @returns {Psbt} - The psbt.
     */
    toStakingPsbt(stakingTx, inputUTXOs) {
        // Check the staking output index can be found
        const scripts = this.buildScripts();
        const stakingOutputInfo = (0, staking_1.deriveStakingOutputInfo)(scripts, this.network);
        (0, staking_1.findMatchingTxOutputIndex)(stakingTx, stakingOutputInfo.outputAddress, this.network);
        return (0, psbt_1.stakingPsbt)(stakingTx, this.network, inputUTXOs, (0, btc_1.isTaproot)(this.stakerInfo.address, this.network) ? Buffer.from(this.stakerInfo.publicKeyNoCoordHex, "hex") : undefined);
    }
    /**
     * Create an unbonding transaction for staking.
     *
     * @param {Transaction} stakingTx - The staking transaction to unbond.
     * @returns {TransactionResult} - An object containing the unsigned
     * transaction, and fee
     * @throws {StakingError} - If the transaction cannot be built
     */
    createUnbondingTransaction(stakingTx) {
        // Build scripts
        const scripts = this.buildScripts();
        const { outputAddress } = (0, staking_1.deriveStakingOutputInfo)(scripts, this.network);
        // Reconstruct the stakingOutputIndex
        const stakingOutputIndex = (0, staking_1.findMatchingTxOutputIndex)(stakingTx, outputAddress, this.network);
        // Create the unbonding transaction
        try {
            const { transaction } = (0, transactions_1.unbondingTransaction)(scripts, stakingTx, this.params.unbondingFeeSat, this.network, stakingOutputIndex);
            return {
                transaction,
                fee: this.params.unbondingFeeSat,
            };
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build the unbonding transaction");
        }
    }
    /**
     * Create an unbonding psbt based on the existing unbonding transaction and
     * staking transaction.
     *
     * @param {Transaction} unbondingTx - The unbonding transaction.
     * @param {Transaction} stakingTx - The staking transaction.
     *
     * @returns {Psbt} - The psbt.
     */
    toUnbondingPsbt(unbondingTx, stakingTx) {
        return (0, psbt_1.unbondingPsbt)(this.buildScripts(), unbondingTx, stakingTx, this.network);
    }
    /**
     * Creates a withdrawal transaction that spends from an unbonding or slashing
     * transaction. The timelock on the input transaction must have expired before
     * this withdrawal can be valid.
     *
     * @param {Transaction} earlyUnbondedTx - The unbonding or slashing
     * transaction to withdraw from
     * @param {number} feeRate - Fee rate in satoshis per byte for the withdrawal
     * transaction
     * @returns {PsbtResult} - Contains the unsigned PSBT and fee amount
     * @throws {StakingError} - If the input transaction is invalid or withdrawal
     * transaction cannot be built
     */
    createWithdrawEarlyUnbondedTransaction(earlyUnbondedTx, feeRate) {
        // Build scripts
        const scripts = this.buildScripts();
        // Create the withdraw early unbonded transaction
        try {
            return (0, transactions_1.withdrawEarlyUnbondedTransaction)(scripts, earlyUnbondedTx, this.stakerInfo.address, this.network, feeRate);
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build unsigned withdraw early unbonded transaction");
        }
    }
    /**
     * Create a withdrawal psbt that spends a naturally expired staking
     * transaction.
     *
     * @param {Transaction} stakingTx - The staking transaction to withdraw from.
     * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createWithdrawStakingExpiredPsbt(stakingTx, feeRate) {
        // Build scripts
        const scripts = this.buildScripts();
        const { outputAddress } = (0, staking_1.deriveStakingOutputInfo)(scripts, this.network);
        // Reconstruct the stakingOutputIndex
        const stakingOutputIndex = (0, staking_1.findMatchingTxOutputIndex)(stakingTx, outputAddress, this.network);
        // Create the timelock unbonded transaction
        try {
            return (0, transactions_1.withdrawTimelockUnbondedTransaction)(scripts, stakingTx, this.stakerInfo.address, this.network, feeRate, stakingOutputIndex);
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build unsigned timelock unbonded transaction");
        }
    }
    /**
     * Create a slashing psbt spending from the staking output.
     *
     * @param {Transaction} stakingTx - The staking transaction to slash.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createStakingOutputSlashingPsbt(stakingTx) {
        if (!this.params.slashing) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Slashing parameters are missing");
        }
        // Build scripts
        const scripts = this.buildScripts();
        // create the slash timelock unbonded transaction
        try {
            const { psbt } = (0, transactions_1.slashTimelockUnbondedTransaction)(scripts, stakingTx, this.params.slashing.slashingPkScriptHex, this.params.slashing.slashingRate, this.params.slashing.minSlashingTxFeeSat, this.network);
            return {
                psbt,
                fee: this.params.slashing.minSlashingTxFeeSat,
            };
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build the slash timelock unbonded transaction");
        }
    }
    /**
     * Create a slashing psbt for an unbonding output.
     *
     * @param {Transaction} unbondingTx - The unbonding transaction to slash.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createUnbondingOutputSlashingPsbt(unbondingTx) {
        if (!this.params.slashing) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_PARAMS, "Slashing parameters are missing");
        }
        // Build scripts
        const scripts = this.buildScripts();
        // create the slash timelock unbonded transaction
        try {
            const { psbt } = (0, transactions_1.slashEarlyUnbondedTransaction)(scripts, unbondingTx, this.params.slashing.slashingPkScriptHex, this.params.slashing.slashingRate, this.params.slashing.minSlashingTxFeeSat, this.network);
            return {
                psbt,
                fee: this.params.slashing.minSlashingTxFeeSat,
            };
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build the slash early unbonded transaction");
        }
    }
    /**
     * Create a withdraw slashing psbt that spends a slashing transaction from the
     * staking output.
     *
     * @param {Transaction} slashingTx - The slashing transaction.
     * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createWithdrawSlashingPsbt(slashingTx, feeRate) {
        // Build scripts
        const scripts = this.buildScripts();
        const slashingOutputInfo = (0, staking_1.deriveSlashingOutput)(scripts, this.network);
        // Reconstruct and validate the slashingOutputIndex
        const slashingOutputIndex = (0, staking_1.findMatchingTxOutputIndex)(slashingTx, slashingOutputInfo.outputAddress, this.network);
        // Create the withdraw slashed transaction
        try {
            return (0, transactions_1.withdrawSlashingTransaction)(scripts, slashingTx, this.stakerInfo.address, this.network, feeRate, slashingOutputIndex);
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build withdraw slashing transaction");
        }
    }
}
exports.Staking = Staking;
