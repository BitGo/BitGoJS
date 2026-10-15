import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNum from 'bn.js';
import {
  ClarityValue,
  ContractCallOptions,
  makeUnsignedContractCall,
  PayloadType,
  PostCondition,
  PostConditionMode,
  UnsignedContractCallOptions,
  UnsignedMultiSigContractCallOptions,
} from '@stacks/transactions';
import {
  BuildTransactionError,
  InvalidParameterValueError,
  InvalidTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';

export abstract class AbstractContractBuilder extends TransactionBuilder {
  private _options: UnsignedContractCallOptions | UnsignedMultiSigContractCallOptions;
  protected _contractAddress: string;
  protected _contractName: string;
  protected _functionName: string;
  protected _postConditionMode?: PostConditionMode;
  protected _postConditions?: PostCondition[];
  protected _functionArgs: ClarityValue[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: Transaction): void {
    const txData = tx.toJson();
    if (txData.payload === undefined) {
      throw new InvalidTransactionError('payload must not be undefined');
    }
    if (txData.payload.payloadType === PayloadType.ContractCall) {
      this._contractAddress = txData.payload.contractAddress;
      this._contractName = txData.payload.contractName;
      this._functionName = txData.payload.functionName;
      this._functionArgs = txData.payload.functionArgs;
      // Restore post-conditions from the deserialized tx — `toJson()` does not carry them, so
      // without this a re-build (e.g. the fee re-build via `factory.from(hex)`) would drop them and
      // a `Deny`-mode contract call would abort on-chain (SIP-005 post-condition check).
      if (tx.stxTransaction) {
        this._postConditionMode = tx.stxTransaction.postConditionMode;
        this._postConditions = tx.stxTransaction.postConditions.values as PostCondition[];
      }
      super.initBuilder(tx);
    } else {
      throw new BuildTransactionError('Transaction should be contract call');
    }
  }

  /**
   * Set the post-condition mode (`Allow` / `Deny`) for this contract call.
   *
   * @obligation callers building a contract call that moves assets MUST set a mode AND matching
   *   post-conditions, or leave this unset and let the caller attach explicit post-conditions —
   *   consequence: an unset mode defaults to `Deny` in `@stacks/transactions`, so any asset movement
   *   not covered by a post-condition aborts the tx on-chain
   * @returns {AbstractContractBuilder} this builder
   */
  postConditionMode(mode: PostConditionMode): this {
    this._postConditionMode = mode;
    return this;
  }

  /**
   * Set the post-conditions for this contract call.
   *
   * @returns {AbstractContractBuilder} this builder
   */
  postConditions(postConditions: PostCondition[]): this {
    this._postConditions = postConditions;
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._options = this.buildContractCallOptions();
    this.transaction.setTransactionType(TransactionType.ContractCall);
    this.transaction.stxTransaction = await makeUnsignedContractCall(this._options);
    return await super.buildImplementation();
  }

  private buildContractCallOptions(): UnsignedContractCallOptions | UnsignedMultiSigContractCallOptions {
    const defaultOpts: ContractCallOptions = {
      contractAddress: this._contractAddress,
      contractName: this._contractName,
      functionName: this._functionName,
      functionArgs: this._functionArgs,
      postConditionMode: this._postConditionMode,
      postConditions: this._postConditions,
      anchorMode: this._anchorMode,
      network: this._network,
      fee: new BigNum(this._fee.fee).toString(),
      nonce: new BigNum(this._nonce).toString(),
    };
    if (this._fromPubKeys.length === 1) {
      return {
        ...defaultOpts,
        publicKey: this._fromPubKeys[0],
      };
    } else if (this._fromPubKeys.length > 1) {
      return {
        ...defaultOpts,
        publicKeys: this._fromPubKeys,
        numSignatures: this._numberSignatures,
      };
    } else {
      throw new InvalidParameterValueError('supply at least 1 public key');
    }
  }
}
