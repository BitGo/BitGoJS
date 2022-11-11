import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { ValidationResult } from 'joi';
import { AddProxyArgs, MethodNames, ProxyType } from './iface';
import { getDelegateAddress } from './iface_utils';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { AddressInitializationSchema } from './txnSchema';

export class RemoveProxyBuilder extends TransactionBuilder {
  protected _delegate: string;
  protected _proxyType: ProxyType;
  protected _delay: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritDoc */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.proxy.removeProxy(
      {
        delegate: this._delegate,
        proxyType: this._proxyType,
        delay: this._delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AddressInitialization;
  }

  /**
   * The proxy account to remove.
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
   * The proxy type to remove.
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
    if (decodedTxn.method?.name === MethodNames.RemoveProxy) {
      const txMethod = decodedTxn.method.args as unknown as AddProxyArgs;
      validationResult = this.validateRemoveProxyFields(
        getDelegateAddress(txMethod),
        txMethod.proxyType,
        txMethod.delay
      );
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.RemoveProxy) {
      const txMethod = this._method.args as AddProxyArgs;
      this.owner({ address: getDelegateAddress(txMethod) });
      this.type(txMethod.proxyType);
      this.delay(new BigNumber(txMethod.delay).toString());
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${MethodNames.RemoveProxy}`
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
    const validationResult: ValidationResult = this.validateRemoveProxyFields(
      this._delegate,
      this._proxyType,
      this._delay
    );
    if (validationResult.error) {
      throw new InvalidTransactionError(`RemoveProxy Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  private validateRemoveProxyFields(delegate: string, proxyType: string, delay: string): ValidationResult {
    return AddressInitializationSchema.validate({
      delegate,
      proxyType,
      delay,
    });
  }
}
