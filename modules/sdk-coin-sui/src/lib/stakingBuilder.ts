import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  SuiTransaction,
  RequestAddStake,
  RequestWithdrawStake,
  SuiTransactionType,
  StakingProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import utils from './utils';
import assert from 'assert';
import { TransferTransaction } from './transferTransaction';
import { StakingTransaction } from './stakingTransaction';
import {
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  TransactionBlockInput,
  MoveCallTransaction,
  Inputs,
} from './mystenlab/builder';
import {
  ADD_STAKE_FUN_NAME,
  SUI_SYSTEM_ADDRESS,
  SUI_SYSTEM_MODULE_NAME,
  SUI_SYSTEM_STATE_OBJECT,
} from './mystenlab/framework';
import { BCS } from '@mysten/bcs';

export class StakingBuilder extends TransactionBuilder<StakingProgrammableTransaction> {
  protected _addStakeTx: RequestAddStake;
  protected _withdrawDelegation: RequestWithdrawStake;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);
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
        transactions: [],
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
    return TransactionType.StakingAdd;
  }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /**
   * Create a new transaction for staking coins ready to be signed and executed.
   *
   * @param {RequestAddStake} request
   */
  stake(request: RequestAddStake): this {
    utils.validateAddress(request.validatorAddress, 'validatorAddress');
    assert(utils.isValidAmount(request.amount), 'Invalid recipient amount');

    if (this._sender === request.validatorAddress) {
      throw new BuildTransactionError('Sender address cannot be the same as the Staking address');
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
    const tx = new StakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
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
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.AddStake);
    this.sender(txData.sender);
    this.gasData(txData.gasData);

    const amountInputIdx = (
      (txData.kind.ProgrammableTransaction.transactions[1] as MoveCallTransaction).arguments[1] as TransactionBlockInput
    ).index;
    const amount = utils.getAmount(txData.kind.ProgrammableTransaction.inputs[amountInputIdx] as TransactionBlockInput);

    const validatorAddressInputIdx = (
      (txData.kind.ProgrammableTransaction.transactions[1] as MoveCallTransaction).arguments[2] as TransactionBlockInput
    ).index;
    const validatorAddress = utils.getAddress(
      txData.kind.ProgrammableTransaction.inputs[validatorAddressInputIdx] as TransactionBlockInput
    );

    this.stake({ amount, validatorAddress });
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(
      this._addStakeTx.validatorAddress,
      new BuildTransactionError('validator address is required before building')
    );
    assert(this._addStakeTx.amount, new BuildTransactionError('staking amount is required before building'));
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  /**
   * Build SuiTransaction
   *
   * @return {BitGoSuiTransaction<MoveCallTx>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<StakingProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();
    // Create a new coin with staking balance, based on the coins used as gas payment.
    const coin = programmableTxBuilder.splitCoins(programmableTxBuilder.gas, [
      programmableTxBuilder.pure(this._addStakeTx.amount),
    ]);
    // Stake the split coin to a specific validator address.
    programmableTxBuilder.moveCall({
      target: `${SUI_SYSTEM_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${ADD_STAKE_FUN_NAME}`,
      arguments: [
        programmableTxBuilder.object(Inputs.SharedObjectRef(SUI_SYSTEM_STATE_OBJECT)),
        coin,
        programmableTxBuilder.pure(Inputs.Pure(this._addStakeTx.validatorAddress, BCS.ADDRESS)),
      ],
    } as MoveCallTransaction);
    const txData = programmableTxBuilder.blockData;

    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [...txData.inputs],
        transactions: [...txData.transactions],
      },
      gasData: {
        ...this._gasData,
      },
    };
  }
}
