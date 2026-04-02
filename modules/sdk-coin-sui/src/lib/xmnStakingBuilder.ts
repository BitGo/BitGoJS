import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { RequestXmnStake, SuiTransaction, SuiTransactionType, XmnStakingProgrammableTransaction } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StakingTransaction } from './stakingTransaction';
import {
  Inputs,
  MoveCallTransaction,
  TransactionArgument,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import { MAX_GAS_OBJECTS } from './constants';
import { XMN_MAINNET_CONFIG, XMN_TESTNET_CONFIG, XmnConfig } from './resources/xmnConfig';
import { SuiObjectRef } from './mystenlab/types';
import assert from 'assert';
import utils from './utils';

/**
 * Builder for XMN staking transactions.
 *
 * Calls staking_factory::stake<XMN, XMN, BRIDGE_TOKEN>(factory, coin).
 * The function has a void return — it internally transfers the minted OpenPosition
 * to ctx.sender(). Do NOT call tx.transferObjects() on the result.
 */
export class XmnStakingBuilder extends TransactionBuilder<XmnStakingProgrammableTransaction> {
  protected _stakeRequest: RequestXmnStake;

  private xmnConfig: XmnConfig;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);
    this.xmnConfig = _coinConfig.network.type === NetworkType.MAINNET ? XMN_MAINNET_CONFIG : XMN_TESTNET_CONFIG;
  }

  protected buildStakeTransaction(): SuiTransaction<XmnStakingProgrammableTransaction> {
    return {
      type: SuiTransactionType.XmnStake,
      sender: this._sender,
      tx: {
        inputs: [],
        transactions: [],
      },
      gasData: this._gasData,
    };
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  validateTransaction(transaction: Transaction<XmnStakingProgrammableTransaction>): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  sign(key: BaseKey) {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
  }

  /**
   * Set the stake request parameters.
   *
   * @param request - amount in base units (1 XMN = 1_000_000) and XMN coin objects to spend
   */
  stake(request: RequestXmnStake): this {
    assert(utils.isValidAmount(request.amount), 'Invalid stake amount');
    assert(request.inputObjects && request.inputObjects.length > 0, 'inputObjects required');
    this._stakeRequest = request;
    return this;
  }

  protected fromImplementation(rawTransaction: string): Transaction<XmnStakingProgrammableTransaction> {
    const tx = new StakingTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  protected async buildImplementation(): Promise<Transaction<XmnStakingProgrammableTransaction>> {
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

  initBuilder(tx: Transaction<XmnStakingProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.XmnStake);
    this.sender(txData.sender);
    this.gasData(txData.gasData);
  }

  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._stakeRequest, new BuildTransactionError('stake request is required before building'));
    assert(this._stakeRequest.amount, new BuildTransactionError('stake amount is required before building'));
    assert(
      this._stakeRequest.inputObjects && this._stakeRequest.inputObjects.length > 0,
      new BuildTransactionError('input objects required before building')
    );
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  protected buildSuiTransaction(): SuiTransaction<XmnStakingProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    // Merge all input XMN coin objects into one, then split the required amount
    const inputObjects: TransactionArgument[] = this._stakeRequest.inputObjects.map((obj: SuiObjectRef) =>
      programmableTxBuilder.object(Inputs.ObjectRef(obj))
    );
    const mergedObject = inputObjects.shift() as TransactionArgument;

    if (inputObjects.length > 0) {
      programmableTxBuilder.mergeCoins(mergedObject, inputObjects);
    }

    const splitObject = programmableTxBuilder.splitCoins(mergedObject, [
      programmableTxBuilder.pure(this._stakeRequest.amount),
    ]);

    // Call staking_factory::stake<XMN, XMN, BRIDGE_TOKEN>(factory, coin)
    // IMPORTANT: void return — OpenPosition is internally transferred to ctx.sender()
    // Do NOT call transferObjects on the result.
    programmableTxBuilder.moveCall({
      target: `${this.xmnConfig.XMN_PKG_ID}::${this.xmnConfig.STAKING_MODULE}::stake`,
      typeArguments: [
        this.xmnConfig.XMN_COIN_TYPE,
        this.xmnConfig.XMN_COIN_TYPE,
        this.xmnConfig.BRIDGE_TOKEN_COIN_TYPE,
      ],
      arguments: [
        programmableTxBuilder.object(
          Inputs.SharedObjectRef({
            objectId: this.xmnConfig.XMN_STAKING_FACTORY.objectId,
            initialSharedVersion: this.xmnConfig.XMN_STAKING_FACTORY.initialSharedVersion,
            mutable: this.xmnConfig.XMN_STAKING_FACTORY.mutable,
          })
        ),
        splitObject,
      ],
    } as unknown as MoveCallTransaction);

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
        payment: this._gasData.payment.slice(0, MAX_GAS_OBJECTS - 1),
      },
    };
  }
}
