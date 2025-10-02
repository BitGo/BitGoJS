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
exports.ObservableStaking = void 0;
const error_1 = require("../../error");
const transactions_1 = require("../transactions");
const btc_1 = require("../../utils/btc");
const staking_1 = require("../../utils/staking");
const observableStakingScript_1 = require("./observableStakingScript");
const __1 = require("..");
const psbt_1 = require("../psbt");
__exportStar(require("./observableStakingScript"), exports);
/**
 * ObservableStaking is a class that provides an interface to create observable
 * staking transactions for the Babylon Staking protocol.
 *
 * The class requires a network and staker information to create staking
 * transactions.
 * The staker information includes the staker's address and
 * public key(without coordinates).
 */
class ObservableStaking extends __1.Staking {
    constructor(network, stakerInfo, params, finalityProviderPkNoCoordHex, stakingTimelock) {
        super(network, stakerInfo, params, finalityProviderPkNoCoordHex, stakingTimelock);
        if (!params.tag) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Observable staking parameters must include tag");
        }
        if (!params.btcActivationHeight) {
            throw new error_1.StakingError(error_1.StakingErrorCode.INVALID_INPUT, "Observable staking parameters must include a positive activation height");
        }
        // Override the staking parameters type to ObservableStakingParams
        this.params = params;
    }
    /**
     * Build the staking scripts for observable staking.
     * This method overwrites the base method to include the OP_RETURN tag based
     * on the tag provided in the parameters.
     *
     * @returns {ObservableStakingScripts} - The staking scripts for observable staking.
     * @throws {StakingError} - If the scripts cannot be built.
     */
    buildScripts() {
        const { covenantQuorum, covenantNoCoordPks, unbondingTime, tag } = this.params;
        // Create staking script data
        let stakingScriptData;
        try {
            stakingScriptData = new observableStakingScript_1.ObservableStakingScriptData(Buffer.from(this.stakerInfo.publicKeyNoCoordHex, "hex"), [Buffer.from(this.finalityProviderPkNoCoordHex, "hex")], (0, staking_1.toBuffers)(covenantNoCoordPks), covenantQuorum, this.stakingTimelock, unbondingTime, Buffer.from(tag, "hex"));
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
     * Create a staking transaction for observable staking.
     * This overwrites the method from the Staking class with the addtion
     * of the
     * 1. OP_RETURN tag in the staking scripts
     * 2. lockHeight parameter
     *
     * @param {number} stakingAmountSat - The amount to stake in satoshis.
     * @param {UTXO[]} inputUTXOs - The UTXOs to use as inputs for the staking
     * transaction.
     * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
     * @returns {TransactionResult} - An object containing the unsigned transaction,
     * and fee
     */
    createStakingTransaction(stakingAmountSat, inputUTXOs, feeRate) {
        (0, staking_1.validateStakingTxInputData)(stakingAmountSat, this.stakingTimelock, this.params, inputUTXOs, feeRate);
        const scripts = this.buildScripts();
        // Create the staking transaction
        try {
            const { transaction, fee } = (0, transactions_1.stakingTransaction)(scripts, stakingAmountSat, this.stakerInfo.address, inputUTXOs, this.network, feeRate, 
            // `lockHeight` is exclusive of the provided value.
            // For example, if a Bitcoin height of X is provided,
            // the transaction will be included starting from height X+1.
            // https://learnmeabitcoin.com/technical/transaction/locktime/
            this.params.btcActivationHeight - 1);
            return {
                transaction,
                fee,
            };
        }
        catch (error) {
            throw error_1.StakingError.fromUnknown(error, error_1.StakingErrorCode.BUILD_TRANSACTION_FAILURE, "Cannot build unsigned staking transaction");
        }
    }
    /**
     * Create a staking psbt for observable staking.
     *
     * @param {Transaction} stakingTx - The staking transaction.
     * @param {UTXO[]} inputUTXOs - The UTXOs to use as inputs for the staking
     * transaction.
     * @returns {Psbt} - The psbt.
     */
    toStakingPsbt(stakingTx, inputUTXOs) {
        return (0, psbt_1.stakingPsbt)(stakingTx, this.network, inputUTXOs, (0, btc_1.isTaproot)(this.stakerInfo.address, this.network) ? Buffer.from(this.stakerInfo.publicKeyNoCoordHex, "hex") : undefined);
    }
}
exports.ObservableStaking = ObservableStaking;
