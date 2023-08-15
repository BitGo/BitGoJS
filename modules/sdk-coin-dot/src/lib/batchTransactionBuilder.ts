import {
  BuildTransactionError,
  InvalidTransactionError,
  NotImplementedError,
  TransactionType,
  toUint8Array,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { ValidationResult } from 'joi';
import {
  AddAnonymousProxyBatchCallArgs,
  AddProxyBatchCallArgs,
  BatchCallObject,
  BatchArgs,
  MethodNames,
  SectionNames,
  StakeArgsPayee,
  StakeBatchCallArgs,
  StakeBatchCallPayee,
  StakeMoreCallArgs,
} from './iface';
import {
  getDelegateAddress,
  isStakeBatchCallPayeeStaked,
  isStakeBatchCallPayeeStash,
  isStakeBatchCallPayeeController,
  isStakeBatchCallPayeeAccount,
} from './iface_utils';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { BatchTransactionSchema } from './txnSchema';
import utils from './utils';

export class BatchTransactionBuilder extends TransactionBuilder {
  protected _calls: string[];
  protected _type: TransactionType;
  private _atomic = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritDoc */
  protected buildTransaction(): UnsignedTransaction {
    return this.buildBatchTransaction();
  }

  /**
   * Build a transaction which batches together multiple transactions.
   * The transactions which are batched together are passed in as an array of hex strings
   * which are composed of the method to call and the arguments to pass into the method.
   *
   * @returns {UnsignedTransaction}
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#batchcalls-veccall
   */
  protected buildBatchTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    if (this._atomic) {
      return methods.utility.batchAll(
        {
          calls: this._calls,
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    } else {
      return methods.utility.batch(
        {
          calls: this._calls,
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    }
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Batch;
  }

  /**
   * Set multiple unsigned transactions to be batched and broadcast as a single transaction
   *
   * @param {BatchCall[]} calls unsigned transactions
   * @returns {BatchTransactionBuilder} This batch transaction builder.
   */
  calls(calls: string[]): this {
    this.validateCalls(calls);
    this._calls = calls;
    return this;
  }

  /**
   * If true when a batched call fails the entire transactions is rolled back, if false no roll back
   * is performed and the effects of any successful call prior to the error remain.
   *
   * @param atomic true if calls must succeed atomically, false otherwise.
   */
  atomic(atomic: boolean): this {
    this._atomic = atomic;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const txMethod = decodedTxn.method.args as unknown as BatchArgs;
    const validationResult = this.validateBatchTransactionFields(txMethod.calls);
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.Batch || this._method?.name === MethodNames.BatchAll) {
      if (this._method?.name === MethodNames.BatchAll) {
        this.atomic(true);
      }
      const txMethod = this._method.args as BatchArgs;
      if (!txMethod.calls) {
        throw new InvalidTransactionError('failed to decode calls from batch transaction');
      }
      const callsToBatch: string[] = [];
      txMethod.calls.forEach((call) => {
        const method = (call as BatchCallObject).callIndex;
        const decodedMethod = toUint8Array(utils.stripHexPrefix(method));
        const decodedCall = this._registry.findMetaCall(decodedMethod);
        if (
          decodedCall.section === SectionNames.Proxy &&
          (decodedCall.method === MethodNames.Anonymous || decodedCall.method === MethodNames.PureProxy)
        ) {
          callsToBatch.push(this.getPureProxyCall(call.args as AddAnonymousProxyBatchCallArgs));
        } else if (decodedCall.section === SectionNames.Proxy && decodedCall.method === MethodNames.AddProxy) {
          callsToBatch.push(this.getAddProxyCall(call.args as AddProxyBatchCallArgs));
        } else if (decodedCall.section === SectionNames.Staking && decodedCall.method === MethodNames.Bond) {
          callsToBatch.push(this.getBondCall(call.args as StakeBatchCallArgs));
        } else if (decodedCall.section === SectionNames.Staking && decodedCall.method === MethodNames.Unbond) {
          callsToBatch.push(this.getUnbondCall(call.args as StakeMoreCallArgs));
        } else if (decodedCall.section === SectionNames.Staking && decodedCall.method === MethodNames.Chill) {
          callsToBatch.push(this.getChillCall());
        } else if (decodedCall.section === SectionNames.Proxy && decodedCall.method === MethodNames.RemoveProxy) {
          callsToBatch.push(this.getRemoveProxyCall(call.args as AddProxyBatchCallArgs));
        } else {
          throw new NotImplementedError(`batching of transaction with index ${method} unsupported`);
        }
      });
      this.calls(callsToBatch);
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${MethodNames.Batch}`
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields();
  }

  /**
   * Validate list of unsigned transactions added to batch
   *
   * @param {string[]} calls
   *
   */
  validateCalls(calls: string[]): void {
    calls.forEach((call) => {
      if (call.slice(0, 2) !== '0x') {
        // example: '0x160400000000000000'
        throw new BuildTransactionError('call in string format must be hex format of a method and its arguments');
      }
    });
  }

  private validateFields(): void {
    const validationResult = this.validateBatchTransactionFields(this._calls);
    if (validationResult.error) {
      throw new InvalidTransactionError(
        `AddressInitialization Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  private validateBatchTransactionFields(calls: (string | BatchCallObject)[]): ValidationResult {
    return BatchTransactionSchema.validate({
      calls,
    });
  }

  private getPureProxyCall(args: AddAnonymousProxyBatchCallArgs): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = utils.pureProxy(
      {
        proxyType: args.proxy_type,
        index: args.index,
        delay: args.delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    return unsigned.method;
  }

  private getBondCall(args: StakeBatchCallArgs): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = methods.staking.bond(
      {
        value: args.value,
        payee: this.getPayee(args.payee),
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    return unsigned.method;
  }

  private getUnbondCall(args: StakeMoreCallArgs): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = methods.staking.unbond(
      {
        value: args.value,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    return unsigned.method;
  }

  private getPayee(payee: StakeBatchCallPayee): StakeArgsPayee {
    if (isStakeBatchCallPayeeStash(payee)) {
      return 'Stash';
    } else if (isStakeBatchCallPayeeController(payee)) {
      return 'Controller';
    } else if (isStakeBatchCallPayeeAccount(payee)) {
      return { Account: payee.account };
    } else if (isStakeBatchCallPayeeStaked(payee)) {
      return 'Staked';
    } else {
      throw new Error(`Invalid payee: ${payee}`);
    }
  }

  private getAddProxyCall(args: AddProxyBatchCallArgs): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = methods.proxy.addProxy(
      {
        delegate: getDelegateAddress(args),
        proxyType: args.proxy_type,
        delay: args.delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    return unsigned.method;
  }

  private getRemoveProxyCall(args: AddProxyBatchCallArgs): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = methods.proxy.removeProxy(
      {
        delegate: getDelegateAddress(args),
        proxyType: args.proxy_type,
        delay: args.delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    return unsigned.method;
  }

  private getChillCall(): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = methods.staking.chill({}, baseTxInfo.baseTxInfo, baseTxInfo.options);
    return unsigned.method;
  }
}
