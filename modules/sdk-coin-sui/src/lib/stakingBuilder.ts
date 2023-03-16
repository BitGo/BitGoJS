import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotImplementedError, TransactionType } from '@bitgo/sdk-core';
import { BitGoSuiTransaction, MethodNames, RequestAddStake, RequestWithdrawStake, SuiTransactionType } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { StakingTransaction } from './stakingTransaction';
import { Transaction } from './transaction';
import BigNumber from 'bignumber.js';
import utils from './utils';
import { Transaction as ProgrammableTransaction } from './mystenlab/builder';
import { SuiSystemStateUtil } from './mystenlab/framework';

export class StakingBuilder extends TransactionBuilder<ProgrammableTransaction> {
  protected _moveCallTx: ProgrammableTransaction;
  protected _addStakeTx: RequestAddStake;
  protected _withdrawDelegation: RequestWithdrawStake;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // this._transaction = new StakingTransaction(_coinConfig);
  }

  /**
   * Build a MoveCall transaction ready to be signed and executed.
   *
   * @returns {BitGoSuiTransaction} an unsigned Sui transaction
   */
  protected buildStakeTransaction(): BitGoSuiTransaction<ProgrammableTransaction> {
    return {
      type: SuiTransactionType.AddStake,
      sender: this._sender,
      tx: this._moveCallTx,
      gasData: this._gasData,
    };
  }

  /**
   * Get staking transaction type
   *
   * @return {TransactionType}
   * @protected
   */
  protected get transactionType(): TransactionType {
    // FIXME - find a way to get the TransactionType by method
    return utils.getTransactionType(MethodNames.RequestAddStakeMulCoin);
    // return utils.getTransactionType(this._moveCallTx.transactionData.commands[0].target!);
  }

  /**
   * Create a new transaction for staking coins ready to be signed and executed.
   *
   * @param {RequestAddStake} request
   */
  requestAddStake(request: RequestAddStake): this {
    this.validateAddress({ address: request.validatorAddress });
    this.validateValue(BigNumber(request.amount));

    if (this._sender === request.validatorAddress) {
      throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
    }
    for (const coin of request.coins) {
      this.validateSuiObjectRef(coin, 'addDelegation.coins');
    }
    this._addStakeTx = request;
    this._moveCallTx = SuiSystemStateUtil.newRequestAddStakeTxn(
      request.coins,
      request.amount,
      request.validatorAddress
    );
    return this;
  }

  /**
   * Create a new transaction for withdrawing coins ready to be signed
   *
   * @param {RequestWithdrawStake} request
   */
  requestWithdrawStake(request: RequestWithdrawStake): this {
    // FIXME - add validation for staked objectID
    // this.validateSuiObjectRef(request.stakedSuiObjectId, 'withdrawDelegation.stakedCoinId');

    this._withdrawDelegation = request;
    this._moveCallTx = SuiSystemStateUtil.newRequestWithdrawlStakeTxn(request.stakedSuiObjectId);
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<ProgrammableTransaction> {
    throw new NotImplementedError('Not implemented');
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<ProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    this._signatures.forEach((signature) => {
      this.transaction.addSignature(signature.publicKey, signature.signature);
    });

    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {StakingTransaction} tx the transaction data
   */
  initBuilder(tx: Transaction<ProgrammableTransaction>): void {
    throw new NotImplementedError('TODO: Not implemented');
  }

  /** @inheritdoc */
  validateTransaction(tx: Transaction<ProgrammableTransaction>): void {
    this.validateSchema({
      type: this._type,
      sender: this._sender,
      tx: this._moveCallTx,
      gasData: this._gasData,
    });
  }

  /**
   * Validate transaction schema
   *
   * @param {BitGoSuiTransaction<MoveCallTx>} tx
   * @private
   */
  private validateSchema(tx: BitGoSuiTransaction<ProgrammableTransaction>): void {
    throw new NotImplementedError('Not implemented');
  }

  /**
   * Build SuiTransaction
   *
   * @return {BitGoSuiTransaction<MoveCallTx>}
   * @protected
   */
  protected buildSuiTransaction(): BitGoSuiTransaction<ProgrammableTransaction> {
    this.validateTransaction(this._transaction);
    return {
      type: this._type,
      sender: this._sender,
      tx: this._moveCallTx,
      gasData: this._gasData,
    };
  }
}
