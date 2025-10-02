import { ObservableVersionedStakingParams } from "../../types/params";
import { UTXO } from "../../types/UTXO";
import { TransactionResult } from "../../types/transaction";
import { ObservableStakingScripts } from "./observableStakingScript";
import { StakerInfo, Staking } from "..";
import { networks, Psbt, Transaction } from "bitcoinjs-lib";
export * from "./observableStakingScript";
/**
 * ObservableStaking is a class that provides an interface to create observable
 * staking transactions for the Babylon Staking protocol.
 *
 * The class requires a network and staker information to create staking
 * transactions.
 * The staker information includes the staker's address and
 * public key(without coordinates).
 */
export declare class ObservableStaking extends Staking {
    params: ObservableVersionedStakingParams;
    constructor(network: networks.Network, stakerInfo: StakerInfo, params: ObservableVersionedStakingParams, finalityProviderPkNoCoordHex: string, stakingTimelock: number);
    /**
     * Build the staking scripts for observable staking.
     * This method overwrites the base method to include the OP_RETURN tag based
     * on the tag provided in the parameters.
     *
     * @returns {ObservableStakingScripts} - The staking scripts for observable staking.
     * @throws {StakingError} - If the scripts cannot be built.
     */
    buildScripts(): ObservableStakingScripts;
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
    createStakingTransaction(stakingAmountSat: number, inputUTXOs: UTXO[], feeRate: number): TransactionResult;
    /**
     * Create a staking psbt for observable staking.
     *
     * @param {Transaction} stakingTx - The staking transaction.
     * @param {UTXO[]} inputUTXOs - The UTXOs to use as inputs for the staking
     * transaction.
     * @returns {Psbt} - The psbt.
     */
    toStakingPsbt(stakingTx: Transaction, inputUTXOs: UTXO[]): Psbt;
}
