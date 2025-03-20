import {
  SuiTransaction,
  RequestWalrusWithdrawStake,
  WalrusWithdrawStakeProgrammableTransaction,
  SuiTransactionType,
} from './iface';
import { BaseCoin as CoinConfig, NetworkType } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { WalrusWithdrawStakeTransaction } from './walrusWithdrawStakeTransaction';
import utils from './utils';

import { WALRUS_TESTNET_CONFIG, WALRUS_PROD_CONFIG } from './resources/walrusConfig';
import { BaseKey, BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransferTransaction } from './transferTransaction';
import { Transaction } from './transaction';
import { normalizeSuiObjectId } from './mystenlab/types';
import {
  Inputs,
  MoveCallTransaction,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
} from './mystenlab/builder';
import assert from 'assert';
import { MAX_GAS_OBJECTS } from './constants';

export class WalrusWithdrawStakeBuilder extends TransactionBuilder<WalrusWithdrawStakeProgrammableTransaction> {
  protected _withdrawStake: RequestWalrusWithdrawStake;

  private walrusConfig: any;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new WalrusWithdrawStakeTransaction(_coinConfig);

    // TODO improve mainnet vs. testnet configuration
    this.walrusConfig = _coinConfig.network.type === NetworkType.MAINNET ? WALRUS_PROD_CONFIG : WALRUS_TESTNET_CONFIG;
  }

  /**
   * Get staking transaction type
   *
   * @return {TransactionType}
   * @protected
   */
  protected get transactionType(): TransactionType {
    return utils.getTransactionType(this.transaction.suiTransaction.type);
  }

  /** @inheritDoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /** @inheritDoc */
  sign(key: BaseKey) {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
  }

  /**
   * Create a new transaction for requesting coin withdrawal, ready to be signed and executed.
   *
   * @param request - the request object
   */
  requestWithdrawStake(request: RequestWalrusWithdrawStake): this {
    this.validateSuiObjectRef(request.stakedWal, 'stakedWal');
    if (request.amount !== undefined) {
      if (!utils.isValidAmount(request.amount)) {
        throw new Error(`invalid amount: ${request.amount}`);
      }
    }
    this._withdrawStake = request;
    return this;
  }

  /** @inheritDoc */
  protected fromImplementation(rawTransaction: string): Transaction<WalrusWithdrawStakeProgrammableTransaction> {
    const tx = new WalrusWithdrawStakeTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritDoc */
  protected async buildImplementation(): Promise<Transaction<WalrusWithdrawStakeProgrammableTransaction>> {
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

  initBuilder(tx: Transaction<WalrusWithdrawStakeProgrammableTransaction>): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(tx.suiTransaction.type);
    this.sender(txData.sender);
    this.gasData(txData.gasData);
    const parsed = utils.getWalrusWithdrawStakeRequests(tx.suiTransaction.tx);
    this.requestWithdrawStake({
      stakedWal: {
        ...parsed.stakedWal,
        objectId: normalizeSuiObjectId(parsed.stakedWal.objectId),
        version: Number(parsed.stakedWal.version),
      },
      amount: parsed.amount === undefined ? undefined : Number(parsed.amount),
    });
  }

  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._withdrawStake.stakedWal, new BuildTransactionError('stakedWal object is required before building'));
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);
  }

  protected buildSuiTransaction(): SuiTransaction<WalrusWithdrawStakeProgrammableTransaction> {
    this.validateTransactionFields();
    const ptb = new ProgrammingTransactionBlockBuilder();
    switch (this._type) {
      case SuiTransactionType.WalrusRequestWithdrawStake:
        // For request_withdraw, we may need to split the staked WAL into two objects
        if (this._withdrawStake.amount !== undefined) {
          // This is a partial unstake. Split the StakedWAL
          const splitStakedWal = ptb.moveCall({
            target: `${this.walrusConfig.WALRUS_PKG_ID}::staked_wal::split`,
            arguments: [
              ptb.object(Inputs.ObjectRef(this._withdrawStake.stakedWal)),
              ptb.pure(Number(this._withdrawStake.amount)),
            ],
          } as unknown as MoveCallTransaction);

          // Request to withdraw the split StakedWAL
          ptb.moveCall({
            target: `${this.walrusConfig.WALRUS_PKG_ID}::${this.walrusConfig.WALRUS_STAKING_MODULE_NAME}::request_withdraw_stake`,
            arguments: [ptb.object(Inputs.SharedObjectRef(this.walrusConfig.WALRUS_STAKING_OBJECT)), splitStakedWal],
          });

          ptb.transferObjects([splitStakedWal], ptb.object(this._sender));
        } else {
          // This is a full unstake. No need to split, just withdraw the provided StakedWAL.
          // Also, since there is no newly-created StakedWAL, no need to transferObjects.
          ptb.moveCall({
            target: `${this.walrusConfig.WALRUS_PKG_ID}::${this.walrusConfig.WALRUS_STAKING_MODULE_NAME}::request_withdraw_stake`,
            arguments: [
              ptb.object(Inputs.SharedObjectRef(this.walrusConfig.WALRUS_STAKING_OBJECT)),
              ptb.object(Inputs.ObjectRef(this._withdrawStake.stakedWal)),
            ],
          });
        }
        break;
      case SuiTransactionType.WalrusWithdrawStake:
        // For the actual withdraw, we are using the already split StakedWAL from above
        // No need to split, just do the withdraw_stake move call
        const unstakedWal = ptb.moveCall({
          target: `${this.walrusConfig.WALRUS_PKG_ID}::${this.walrusConfig.WALRUS_STAKING_MODULE_NAME}::withdraw_stake`,
          arguments: [
            ptb.object(Inputs.SharedObjectRef(this.walrusConfig.WALRUS_STAKING_OBJECT)),
            ptb.object(Inputs.ObjectRef(this._withdrawStake.stakedWal)),
          ],
        });
        ptb.transferObjects([unstakedWal], ptb.object(this._sender));
        break;
      default:
        throw new BuildTransactionError(`Invalid transaction type: ${this._type}`);
    }

    const txData = ptb.blockData;
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
