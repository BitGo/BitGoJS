import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { TransactionType } from '../baseCoin';
import { AddProxyArgs, MethodNames, ProxyType } from './iface';
import { AddressInitializationSchema } from './txnSchema';
import { BaseAddress } from '../baseCoin/iface';

export class AddressInitializationBuilder extends TransactionBuilder {
  protected _delegate: string;
  protected _proxyType: ProxyType;
  protected _delay: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Register a proxy account for the sender that is able to make calls on its behalf.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxy
   */
  protected buildTransaction(): UnsignedTransaction {
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
    return TransactionType.AddressInitialization;
  }

  /**
   * The account to delegate auth to.
   *
   * @param {BaseAddress} owner
   * @returns {AddressInitializationBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#why-use-a-proxy
   */
  owner(owner: BaseAddress): this {
    this.validateAddress({ address: owner.address });
    this._delegate = owner.address;
    return this;
  }

  /**
   * The proxy type to add.
   *
   * @param {proxyType} proxyType
   * @returns {AddressInitializationBuilder} This builder.
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
   * @param {string} delay
   * @returns {AddressInitializationBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#time-delayed-proxies
   */
  delay(delay: string): this {
    this.validateValue(new BigNumber(parseInt(delay, 10)));
    this._delay = delay;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.AddProxy) {
      const txMethod = decodedTxn.method.args as unknown as AddProxyArgs;
      const delegate = txMethod.delegate;
      const proxyType = txMethod.proxyType;
      const delay = txMethod.delay;
      const validationResult = AddressInitializationSchema.validate({ delegate, proxyType, delay });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.AddProxy) {
      const txMethod = this._method.args as AddProxyArgs;
      this.owner({ address: txMethod.delegate });
      this.type(txMethod.proxyType);
      this.delay(new BigNumber(txMethod.delay).toString());
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected Wallet initialization`,
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._delegate, this._proxyType, this._delay);
  }

  private validateFields(delegate: string, proxyType: string, delay: string): void {
    const validationResult = AddressInitializationSchema.validate({
      delegate,
      proxyType,
      delay,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `AddressInitialization Transaction validation failed: ${validationResult.error.message}`,
      );
    }
  }
}
