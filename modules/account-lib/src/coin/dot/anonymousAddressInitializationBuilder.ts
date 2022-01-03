import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { TransactionType } from '../baseCoin';
import { AddAnonymousProxyArgs, MethodNames, ProxyType } from './iface';
import { AnonymousAddressInitializationSchema } from './txnSchema';

export class AnonymousAddressInitializationBuilder extends TransactionBuilder {
  protected _proxyType: string;
  protected _index: number;
  protected _delay: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Spawn a receive address for the sender
   *
   * @return {UnsignedTransaction} an unsigned Dot transaction
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.proxy.anonymous(
      {
        proxyType: this._proxyType,
        index: this._index,
        delay: this._delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options,
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AnonymousAddressInitialization;
  }

  /**
   * The proxy type to add.
   *
   * @param {proxyType} proxyType
   * @returns {AnonymousAddressInitializationBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#proxy-types
   */
  type(proxyType: ProxyType): this {
    this._proxyType = proxyType;
    return this;
  }

  /**
   * The number of blocks that an announcement must be in place for.
   * before the corresponding call may be dispatched.
   * If zero, then no announcement is needed.
   * TODO: move to the validity window method once it has been standardized
   *
   * @param {number} delay
   * @returns {AnonymousAddressInitializationBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#time-delayed-proxies
   */
  delay(delay: number): this {
    this.validateValue(new BigNumber(delay));
    this._delay = delay;
    return this;
  }

  /**
   * Used for disambiguation if multiple calls are made in the same transaction
   * Use 0 as a default
   *
   * @param {number} index
   *
   * @returns {AnonymousAddressInitializationBuilder} This transfer builder.
   */
  index(index: number): this {
    this.validateValue(new BigNumber(index));
    this._index = index;
    return this;
  }

  /** @inheritDoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.Anonymous) {
      const txMethod = decodedTxn.method.args as unknown as AddAnonymousProxyArgs;
      const proxyType = txMethod.proxyType;
      const index = txMethod.index;
      const delay = txMethod.delay;
      const validationResult = AnonymousAddressInitializationSchema.validate({ proxyType, index, delay });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritDoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.Anonymous) {
      const txMethod = this._method.args as AddAnonymousProxyArgs;
      this.type(txMethod.proxyType);
      this.index(new BigNumber(txMethod.index).toNumber());
      this.delay(new BigNumber(txMethod.delay).toNumber());
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected Anonymous Address initialization`,
      );
    }
    return tx;
  }

  /** @inheritDoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._proxyType, this._index, this._delay);
  }

  private validateFields(proxyType: string, index: number, delay: number): void {
    const validationResult = AnonymousAddressInitializationSchema.validate({
      proxyType,
      index,
      delay,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `AnonymousAddressInitialization Transaction validation failed: ${validationResult.error.message}`,
      );
    }
  }
}
