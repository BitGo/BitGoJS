import { ObservableVersionedStakingParams } from "../../types/params";
import { UTXO } from "../../types/UTXO";
import { StakingError, StakingErrorCode } from "../../error";
import { stakingTransaction } from "../transactions";
import { isTaproot } from "../../utils/btc";
import { toBuffers, validateStakingTxInputData } from "../../utils/staking";
import { TransactionResult } from "../../types/transaction";
import { ObservableStakingScriptData, ObservableStakingScripts } from "./observableStakingScript";
import { StakerInfo, Staking } from "..";
import { networks, Psbt, Transaction } from "bitcoinjs-lib";
import { stakingPsbt } from "../psbt";
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
export class ObservableStaking extends Staking {
  params: ObservableVersionedStakingParams;
  constructor(
    network: networks.Network,
    stakerInfo: StakerInfo,
    params: ObservableVersionedStakingParams,
    finalityProviderPkNoCoordHex: string,
    stakingTimelock: number,
  ) {
    super(
      network,
      stakerInfo,
      params,
      finalityProviderPkNoCoordHex,
      stakingTimelock,
    );
    if (!params.tag) {
      throw new StakingError(
        StakingErrorCode.INVALID_INPUT, 
        "Observable staking parameters must include tag",
      );
    }
    if (!params.btcActivationHeight) {
      throw new StakingError(
        StakingErrorCode.INVALID_INPUT,
        "Observable staking parameters must include a positive activation height",
      );
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
  buildScripts(): ObservableStakingScripts {
    const { covenantQuorum, covenantNoCoordPks, unbondingTime, tag } = this.params;
    // Create staking script data
    let stakingScriptData;
    try {
      stakingScriptData = new ObservableStakingScriptData(
        Buffer.from(this.stakerInfo.publicKeyNoCoordHex, "hex"),
        [Buffer.from(this.finalityProviderPkNoCoordHex, "hex")],
        toBuffers(covenantNoCoordPks),
        covenantQuorum,
        this.stakingTimelock,
        unbondingTime,
        Buffer.from(tag, "hex"),
      );
    } catch (error: unknown) {
      throw StakingError.fromUnknown(
        error, StakingErrorCode.SCRIPT_FAILURE, 
        "Cannot build staking script data",
      );
    }

    // Build scripts
    let scripts;
    try {
      scripts = stakingScriptData.buildScripts();
    } catch (error: unknown) {
      throw StakingError.fromUnknown(
        error, StakingErrorCode.SCRIPT_FAILURE,
        "Cannot build staking scripts",
      );
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
  public createStakingTransaction(
    stakingAmountSat: number,
    inputUTXOs: UTXO[],
    feeRate: number,
  ): TransactionResult {
    validateStakingTxInputData(
      stakingAmountSat,
      this.stakingTimelock,
      this.params,
      inputUTXOs,
      feeRate,
    );

    const scripts = this.buildScripts();

    // Create the staking transaction
    try {
      const { transaction, fee } = stakingTransaction(
        scripts,
        stakingAmountSat,
        this.stakerInfo.address,
        inputUTXOs,
        this.network,
        feeRate,
        // `lockHeight` is exclusive of the provided value.
        // For example, if a Bitcoin height of X is provided,
        // the transaction will be included starting from height X+1.
        // https://learnmeabitcoin.com/technical/transaction/locktime/
        this.params.btcActivationHeight - 1,
      );
      
      return {
        transaction,
        fee,
      };
    } catch (error: unknown) {
      throw StakingError.fromUnknown(
        error, StakingErrorCode.BUILD_TRANSACTION_FAILURE,
        "Cannot build unsigned staking transaction",
      );
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
  public toStakingPsbt(
    stakingTx: Transaction,
    inputUTXOs: UTXO[],
  ): Psbt {
    return stakingPsbt(
      stakingTx,
      this.network,
      inputUTXOs,
      isTaproot(
        this.stakerInfo.address, this.network
      ) ? Buffer.from(this.stakerInfo.publicKeyNoCoordHex, "hex") : undefined,
    );
  }
}
