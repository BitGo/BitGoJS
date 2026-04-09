import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { ValidationResult } from 'joi';
import { AddAnonymousProxyArgs, AddProxyArgs, MethodNames, ProxyType } from './iface';
import { getDelegateAddress } from './iface_utils';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { AddressInitializationSchema, AnonymousAddressInitializationSchema } from './txnSchema';
import utils from './utils';

export class AddressInitializationBuilder extends TransactionBuilder {
  protected _delegate: string;
  protected _proxyType: ProxyType;
  protected _delay: string;
  protected _index = 0;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritDoc */
  protected buildTransaction(): UnsignedTransaction {
    if (this._delegate) {
      return this.buildAddProxyTransaction();
    } else {
      return this.buildAnonymousProxyTransaction();
    }
  }

  /**
   * Register a proxy account for the sender that is able to make calls on its behalf.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxy
   */
  protected buildAddProxyTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.proxy.addProxy(
      {
        delegate: this._delegate,
        proxyType: this._proxyType,
        delay: this._delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  /**
   * Spawn a receive address for the sender
   *
   * @return {UnsignedTransaction} an unsigned Dot transaction
   */
  protected buildAnonymousProxyTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return utils.pureProxy(
      {
        proxyType: this._proxyType,
        index: this._index,
        delay: parseInt(this._delay, 10),
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
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
   * Used for disambiguation if multiple calls are made in the same transaction
   * Use 0 as a default
   *
   * @param {number} index
   *
   * @returns {AddressInitializationBuilder} This transfer builder.
   */
  index(index: number): this {
    this.validateValue(new BigNumber(index));
    this._index = index;
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
    let validationResult;
    if (decodedTxn.method?.name === MethodNames.AddProxy) {
      const txMethod = decodedTxn.method.args as unknown as AddProxyArgs;
      validationResult = this.validateAddProxyFields(getDelegateAddress(txMethod), txMethod.proxyType, txMethod.delay);
    } else if (decodedTxn.method?.name === MethodNames.Anonymous || decodedTxn.method?.name === MethodNames.PureProxy) {
      const txMethod = decodedTxn.method.args as unknown as AddAnonymousProxyArgs;
      validationResult = this.validateAnonymousProxyFields(
        parseInt(txMethod.index, 10),
        txMethod.proxyType,
        txMethod.delay
      );
    }
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.AddProxy) {
      const txMethod = this._method.args as AddProxyArgs;
      this.owner({ address: getDelegateAddress(txMethod) });
      this.type(txMethod.proxyType);
      this.delay(new BigNumber(txMethod.delay).toString());
    } else if (this._method?.name === MethodNames.Anonymous || this._method?.name === MethodNames.PureProxy) {
      const txMethod = this._method.args as AddAnonymousProxyArgs;
      this.index(new BigNumber(txMethod.index).toNumber());
      this.type(txMethod.proxyType);
      this.delay(new BigNumber(txMethod.delay).toString());
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${MethodNames.AddProxy} or ${MethodNames.Anonymous}`
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields();
  }

  private validateFields(): void {
    let validationResult: ValidationResult;
    if (this._delegate) {
      validationResult = this.validateAddProxyFields(this._delegate, this._proxyType, this._delay);
    } else {
      validationResult = this.validateAnonymousProxyFields(this._index, this._proxyType, this._delay);
    }
    if (validationResult.error) {
      throw new InvalidTransactionError(
        `AddressInitialization Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  private validateAddProxyFields(delegate: string, proxyType: string, delay: string): ValidationResult {
    return AddressInitializationSchema.validate({
      delegate,
      proxyType,
      delay,
    });
  }

  private validateAnonymousProxyFields(index: number, proxyType: string, delay: string): ValidationResult {
    return AnonymousAddressInitializationSchema.validate({
      proxyType,
      index,
      delay,
    });
  }
}
