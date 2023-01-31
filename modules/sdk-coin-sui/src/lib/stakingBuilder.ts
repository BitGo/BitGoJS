import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError, NotImplementedError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import {
  MoveCallTx,
  MethodNames,
  ModulesNames,
  MoveCallTxDetails,
  RequestAddDelegation,
  SuiTransaction,
  SuiTransactionType,
  SuiObjectRef,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { SUI_PACKAGE, SUI_SYSTEM_STATE_OBJECT } from './constants';
import { SuiMoveCallTransactionSchema } from './txnSchema';
import { StakingTransaction } from './stakingTransaction';
import { Transaction } from './transaction';
import BigNumber from 'bignumber.js';

export class StakingBuilder extends TransactionBuilder<MoveCallTx> {
  protected _moveCallTx: MoveCallTx;
  protected _addDelegationTx: RequestAddDelegation;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);
  }

  /**
   * Build a MoveCall transaction ready to be signed and executed.
   *
   * @returns {SuiTransaction} an unsigned Sui transaction
   *
   * @see https://github.com/MystenLabs/sui/blob/main/crates/sui-framework/docs/sui_system.md#function-request_add_delegation_mul_coin
   */
  protected buildStakeTransaction(): SuiTransaction<MoveCallTx> {
    return {
      type: SuiTransactionType.AddDelegation,
      sender: this._sender,
      tx: this._moveCallTx,
      gasBudget: this._gasBudget,
      gasPrice: this._gasPrice,
      gasPayment: this._gasPayment,
    };
  }

  /**
   * Get staking transaction type
   *
   * @return {TransactionType}
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddDelegator;
  }

  /**
   * Create a new transaction for delegating coins ready to be signed and executed.
   *
   * @param {RequestAddDelegation} addDelegationTx
   */
  requestAddDelegation(addDelegationTx: RequestAddDelegation): this {
    this.validateAddress({ address: addDelegationTx.validatorAddress });
    this.validateValue(BigNumber(addDelegationTx.amount));
    for (const coin of addDelegationTx.coins) {
      this.validateSuiObjectRef(coin, 'addDelegationTx.coins');
    }
    this._addDelegationTx = addDelegationTx;
    this._moveCallTx = {
      package: SUI_PACKAGE,
      module: ModulesNames.SuiSystem,
      function: MethodNames.RequestAddDelegationMulCoin,
      typeArguments: [],
      arguments: [
        SUI_SYSTEM_STATE_OBJECT,
        addDelegationTx.coins,
        addDelegationTx.amount,
        addDelegationTx.validatorAddress,
      ],
    };
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<MoveCallTx> {
    const tx = new StakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<MoveCallTx>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {StakingTransaction} tx the transaction data
   */
  initBuilder(tx: StakingTransaction): void {
    this._transaction = tx;
    this._signatures = [tx.suiSignature];

    const txData = tx.toJson();
    this.gasBudget(txData.gasBudget);
    this.sender(txData.sender);
    this.gasPayment(txData.gasPayment);

    const txDetails = txData.kind.Single as MoveCallTxDetails;
    if (txDetails.hasOwnProperty('Call')) {
      switch (txDetails.Call.function) {
        case MethodNames.RequestAddDelegationMulCoin:
          this.type(SuiTransactionType.AddDelegation);
          this.requestAddDelegation({
            coins: txDetails.Call.arguments[1] as SuiObjectRef[],
            amount: Number(txDetails.Call.arguments[2]),
            validatorAddress: txDetails.Call.arguments[3].toString(),
          });
          break;
        case MethodNames.RequestWithdrawDelegation:
          throw new NotImplementedError(`${txDetails.Call.function} not implemented`);
        case MethodNames.RequestSwitchDelegation:
          throw new NotImplementedError(`${txDetails.Call.function} not implemented`);
        default:
          throw new NotSupported(`${txDetails.Call.function} not supported`);
      }
    } else {
      throw new Error('Transaction type not supported: ' + txDetails);
    }
  }

  /** @inheritdoc */
  validateTransaction(tx: Transaction<MoveCallTx>): void {
    this.validateSchema({
      type: this._type,
      sender: this._sender,
      tx: this._moveCallTx,
      gasPrice: this._gasPrice,
      gasBudget: this._gasBudget,
      gasPayment: this._gasPayment,
    });
  }

  /**
   * Validate transaction schema
   *
   * @param {SuiTransaction<MoveCallTx>} tx
   * @private
   */
  private validateSchema(tx: SuiTransaction<MoveCallTx>): void {
    const validationResult = SuiMoveCallTransactionSchema.validate(tx);
    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Stake Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  /**
   * Build SuiTransaction
   *
   * @return {SuiTransaction<MoveCallTx>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<MoveCallTx> {
    this.validateTransaction(this._transaction);
    return {
      type: this._type,
      sender: this._sender,
      tx: this._moveCallTx,
      gasBudget: this._gasBudget,
      gasPrice: this._gasPrice,
      gasPayment: this._gasPayment,
    };
  }
}
