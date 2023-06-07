import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  SuiTransaction,
  RequestWithdrawStakedSui,
  SuiTransactionType,
  UnstakingProgrammableTransaction,
} from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import assert from 'assert';
import { TransferTransaction } from './transferTransaction';
import {
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  TransactionBlockInput,
  MoveCallTransaction,
  Inputs,
} from './mystenlab/builder';
import {
  SUI_STAKING_POOL_MODULE_NAME,
  SUI_STAKING_POOL_SPLIT_FUN_NAME,
  SUI_SYSTEM_ADDRESS,
  SUI_SYSTEM_MODULE_NAME,
  SUI_SYSTEM_STATE_OBJECT,
  WITHDRAW_STAKE_FUN_NAME,
} from './mystenlab/framework';
import { UnstakingTransaction } from './unstakingTransaction';
import utils from './utils';
import { SuiObjectRef } from './mystenlab/types';
import { SerializedTransactionDataBuilder } from './mystenlab/builder/TransactionDataBlock';

export class UnstakingBuilder extends TransactionBuilder<UnstakingProgrammableTransaction> {
  protected _withdrawDelegation: RequestWithdrawStakedSui;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new UnstakingTransaction(_coinConfig);
  }

  /**
   * Build a MoveCall transaction ready to be signed and executed.
   *
   * @returns {BitGoSuiTransaction} an unsigned Sui transaction
   */
  protected buildUnstakeTransaction(): SuiTransaction<UnstakingProgrammableTransaction> {
    return {
      type: SuiTransactionType.WithdrawStake,
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
    return TransactionType.StakingClaim;
  }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /** @inheritdoc */
  sign(key: BaseKey) {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
  }

  /**
   * Create a new transaction for withdrawing coins ready to be signed
   *
   * @param {RequestWithdrawStakedSui} request
   */
  unstake(request: RequestWithdrawStakedSui): this {
    this.validateSuiObjectRef(request.stakedSui, 'stakedSui');
    if (request.amount !== undefined) {
      if (!utils.isValidAmount(request.amount)) {
        throw new Error(`invalid amount: ${request.amount}`);
      }
    }
    this._withdrawDelegation = request;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<UnstakingProgrammableTransaction> {
    const tx = new UnstakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<UnstakingProgrammableTransaction>> {
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
  initBuilder(tx: Transaction<UnstakingProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.WithdrawStake);
    this.sender(txData.sender);
    this.gasData(txData.gasData);

    const stakedSuiInputIdx = (
      (txData.kind.ProgrammableTransaction.transactions[0] as MoveCallTransaction).arguments[1] as TransactionBlockInput
    ).index;
    const stakedSuiInput = txData.kind.ProgrammableTransaction.inputs[stakedSuiInputIdx] as TransactionBlockInput;
    const stakedSui = 'value' in stakedSuiInput ? stakedSuiInput.value : stakedSuiInput;

    this.unstake({ stakedSui: stakedSui.Object.ImmOrOwned });
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(
      this._withdrawDelegation.stakedSui,
      new BuildTransactionError('stakedSui object is required before building')
    );
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  static getTransactionBlockData(objectRef: SuiObjectRef, amount?: bigint): SerializedTransactionDataBuilder {
    const txb = new ProgrammingTransactionBlockBuilder();
    const targetSplit =
      `${SUI_SYSTEM_ADDRESS}::${SUI_STAKING_POOL_MODULE_NAME}::${SUI_STAKING_POOL_SPLIT_FUN_NAME}` as `${string}::${string}::${string}`;
    const targetWithdrawStake =
      `${SUI_SYSTEM_ADDRESS}::${SUI_SYSTEM_MODULE_NAME}::${WITHDRAW_STAKE_FUN_NAME}` as `${string}::${string}::${string}`;
    if (amount === undefined) {
      txb.moveCall({
        target: targetWithdrawStake,
        arguments: [txb.object(Inputs.SharedObjectRef(SUI_SYSTEM_STATE_OBJECT)), txb.pure(Inputs.ObjectRef(objectRef))],
      });
    } else {
      txb.moveCall({
        target: targetSplit,
        arguments: [txb.object(Inputs.ObjectRef(objectRef)), txb.pure(amount)],
      });
      txb.moveCall({
        target: targetWithdrawStake,
        arguments: [
          txb.object(Inputs.SharedObjectRef(SUI_SYSTEM_STATE_OBJECT)),
          { kind: 'NestedResult', index: 0, resultIndex: 0 },
        ],
      });
    }
    return txb.blockData;
  }

  /**
   * Build SuiTransaction
   *
   * @return {SuiTransaction<UnstakingProgrammableTransaction>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<UnstakingProgrammableTransaction> {
    this.validateTransactionFields();
    const txData = UnstakingBuilder.getTransactionBlockData(
      this._withdrawDelegation.stakedSui,
      this._withdrawDelegation.amount === undefined ? undefined : BigInt(this._withdrawDelegation.amount)
    );
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
