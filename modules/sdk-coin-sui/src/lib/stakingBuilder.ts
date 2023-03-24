import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotImplementedError, TransactionType } from '@bitgo/sdk-core';
import {
  SuiTransaction,
  MethodNames,
  RequestAddStake,
  RequestWithdrawStake,
  SuiTransactionType,
  StakingProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import BigNumber from 'bignumber.js';
import utils from './utils';

export class StakingBuilder extends TransactionBuilder<StakingProgrammableTransaction> {
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
  protected buildStakeTransaction(): SuiTransaction<StakingProgrammableTransaction> {
    return {
      type: SuiTransactionType.AddStake,
      sender: this._sender,
      tx: {
        inputs: [],
        commands: [],
      },
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
    // TODO: FIXME - find a way to get the TransactionType by method
    return utils.getTransactionType(MethodNames.RequestAddStakeMulCoin);
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
    return this;
  }

  /**
   * Create a new transaction for withdrawing coins ready to be signed
   *
   * @param {RequestWithdrawStake} request
   */
  requestWithdrawStake(request: RequestWithdrawStake): this {
    // TODO: FIXME  - add validation for staked objectID
    this._withdrawDelegation = request;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<StakingProgrammableTransaction> {
    throw new NotImplementedError('Not implemented');
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<StakingProgrammableTransaction>> {
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
  initBuilder(tx: Transaction<StakingProgrammableTransaction>): void {
    throw new NotImplementedError('TODO: Not implemented');
  }

  /** @inheritdoc */
  validateTransaction(tx: Transaction<StakingProgrammableTransaction>): void {
    this.validateSchema({
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [],
        commands: [],
      },
      gasData: this._gasData,
    });
  }

  /**
   * Validate transaction schema
   *
   * @param {BitGoSuiTransaction<MoveCallTx>} tx
   * @private
   */
  private validateSchema(tx: SuiTransaction<StakingProgrammableTransaction>): void {
    throw new NotImplementedError('Not implemented');
  }

  /**
   * Build SuiTransaction
   *
   * @return {BitGoSuiTransaction<MoveCallTx>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<StakingProgrammableTransaction> {
    // TODO: FIXME - validate transaction
    // this.validateTransaction(this._transaction);
    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [],
        commands: [],
      },
      gasData: this._gasData,
    };
  }
}
