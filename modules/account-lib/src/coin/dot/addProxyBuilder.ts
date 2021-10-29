import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode, methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TransactionType } from '../baseCoin';
import { AddProxyArgs, proxyType } from './iface';
import { AddProxyTransactionSchema } from './txnSchema';

export class AddProxyBuilder extends TransactionBuilder {
  protected _delegate: string;
  protected _proxyType: proxyType;
  protected _delay: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected buildDotTxn(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.proxy.addProxy(
      {
        delegate: this._delegate,
        proxyType: this._proxyType,
        delay: this._delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options,
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AddProxy;
  }

  /**
   *
   * The account to delegate auth to
   *
   * @param {string} delegate
   * @returns {AddProxyBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#why-use-a-proxy
   */
  delegate(delegate: string): this {
    this.validateAddress({ address: delegate });
    this._delegate = delegate;
    return this;
  }

  /**
   *
   * The proxy type to add
   *
   * @param {proxyType} proxyType
   * @returns {AddProxyBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#proxy-types
   */
  proxyType(proxyType: proxyType): this {
    this._proxyType = proxyType;
    return this;
  }

  /**
   *
   * The number of blocks that an announcement must be in place for.
   * before the corresponding call may be dispatched.
   * If zero, then no announcement is needed.
   *
   * @param {number} delay
   * @returns {AddProxyBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#time-delayed-proxies
   */
  delay(delay: number): this {
    this.validateValue(new BigNumber(delay));
    this._delay = delay;
    return this;
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    super.validateRawTransaction(rawTransaction);
    const decodedTxn = decode(rawTransaction, {
      metadataRpc: this._metadataRpc,
      registry: this._registry,
    });
    if (decodedTxn.method?.name === 'addProxy') {
      const txMethod = decodedTxn.method.args as unknown as AddProxyArgs;
      const delegate = txMethod.delegate;
      const proxyType = txMethod.proxyType;
      const delay = txMethod.delay;
      const validationResult = AddProxyTransactionSchema.validate({ delegate, proxyType, delay });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === 'addProxy') {
      const txMethod = this._method.args as AddProxyArgs;
      this.delegate(txMethod.delegate);
      this.proxyType(txMethod.proxyType);
      this.delay(parseInt(txMethod.delay, 10));
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected bond`);
    }
    return tx;
  }
}
