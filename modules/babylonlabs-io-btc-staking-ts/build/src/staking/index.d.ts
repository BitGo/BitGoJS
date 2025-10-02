import { networks, Psbt, Transaction } from "bitcoinjs-lib";
import { StakingParams } from "../types/params";
import { UTXO } from "../types/UTXO";
import { StakingScripts } from "./stakingScript";
import { PsbtResult, TransactionResult } from "../types/transaction";
export * from "./stakingScript";
export interface StakerInfo {
    address: string;
    publicKeyNoCoordHex: string;
}
export declare class Staking {
    network: networks.Network;
    stakerInfo: StakerInfo;
    params: StakingParams;
    finalityProviderPkNoCoordHex: string;
    stakingTimelock: number;
    constructor(network: networks.Network, stakerInfo: StakerInfo, params: StakingParams, finalityProviderPkNoCoordHex: string, stakingTimelock: number);
    /**
     * buildScripts builds the staking scripts for the staking transaction.
     * Note: different staking types may have different scripts.
     * e.g the observable staking script has a data embed script.
     *
     * @returns {StakingScripts} - The staking scripts.
     */
    buildScripts(): StakingScripts;
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
    createStakingTransaction(stakingAmountSat: number, inputUTXOs: UTXO[], feeRate: number): TransactionResult;
    /**
     * Create a staking psbt based on the existing staking transaction.
     *
     * @param {Transaction} stakingTx - The staking transaction.
     * @param {UTXO[]} inputUTXOs - The UTXOs to use as inputs for the staking
     * transaction. The UTXOs that were used to create the staking transaction should
     * be included in this array.
     * @returns {Psbt} - The psbt.
     */
    toStakingPsbt(stakingTx: Transaction, inputUTXOs: UTXO[]): Psbt;
    /**
     * Create an unbonding transaction for staking.
     *
     * @param {Transaction} stakingTx - The staking transaction to unbond.
     * @returns {TransactionResult} - An object containing the unsigned
     * transaction, and fee
     * @throws {StakingError} - If the transaction cannot be built
     */
    createUnbondingTransaction(stakingTx: Transaction): TransactionResult;
    /**
     * Create an unbonding psbt based on the existing unbonding transaction and
     * staking transaction.
     *
     * @param {Transaction} unbondingTx - The unbonding transaction.
     * @param {Transaction} stakingTx - The staking transaction.
     *
     * @returns {Psbt} - The psbt.
     */
    toUnbondingPsbt(unbondingTx: Transaction, stakingTx: Transaction): Psbt;
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
    createWithdrawEarlyUnbondedTransaction(earlyUnbondedTx: Transaction, feeRate: number): PsbtResult;
    /**
     * Create a withdrawal psbt that spends a naturally expired staking
     * transaction.
     *
     * @param {Transaction} stakingTx - The staking transaction to withdraw from.
     * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createWithdrawStakingExpiredPsbt(stakingTx: Transaction, feeRate: number): PsbtResult;
    /**
     * Create a slashing psbt spending from the staking output.
     *
     * @param {Transaction} stakingTx - The staking transaction to slash.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createStakingOutputSlashingPsbt(stakingTx: Transaction): PsbtResult;
    /**
     * Create a slashing psbt for an unbonding output.
     *
     * @param {Transaction} unbondingTx - The unbonding transaction to slash.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createUnbondingOutputSlashingPsbt(unbondingTx: Transaction): PsbtResult;
    /**
     * Create a withdraw slashing psbt that spends a slashing transaction from the
     * staking output.
     *
     * @param {Transaction} slashingTx - The slashing transaction.
     * @param {number} feeRate - The fee rate for the transaction in satoshis per byte.
     * @returns {PsbtResult} - An object containing the unsigned psbt and fee
     * @throws {StakingError} - If the delegation is invalid or the transaction cannot be built
     */
    createWithdrawSlashingPsbt(slashingTx: Transaction, feeRate: number): PsbtResult;
}
