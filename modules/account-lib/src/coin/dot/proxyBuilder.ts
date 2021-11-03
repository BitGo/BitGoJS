import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode, methods } from '@substrate/txwrapper-polkadot';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TransactionType } from '../baseCoin';
import { MethodNames, ProxyArgs, proxyType } from './iface';
import { ProxyTransactionSchema } from './txnSchema';
import utils from './utils';

export class ProxyBuilder extends TransactionBuilder {
  protected _real: string;
  protected _forceProxyType: proxyType;
  protected _call: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected buildDotTxn(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.proxy.proxy(
      {
        real: this._real,
        forceProxyType: this._forceProxyType,
        call: this._call,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options,
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Proxy;
  }

  /**
   *
   * The real address of the original tx
   *
   * @param {string} real
   * @returns {ProxyBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#why-use-a-proxy
   */
  real(real: string): this {
    this.validateAddress({ address: real });
    this._real = real;
    return this;
  }

  /**
   *
   * The proxy type to execute
   *
   * @param {proxyType} forceProxyType
   * @returns {ProxyBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#proxy-types
   */
  forceProxyType(forceProxyType: proxyType): this {
    this._forceProxyType = forceProxyType;
    return this;
  }

  /**
   *
   * The hex of the method call to execute
   *
   * @param {string} call
   * @returns {ProxyBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#another-way-to-create-proxies
   */
  call(call: string): this {
    this._call = call;
    return this;
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    super.validateRawTransaction(rawTransaction);
    const decodedTxn = decode(rawTransaction, {
      metadataRpc: this._metadataRpc,
      registry: this._registry,
    });
    if (decodedTxn.method?.name === MethodNames.Proxy) {
      const txMethod = decodedTxn.method.args as unknown as ProxyArgs;
      const real = txMethod.real;
      const forceProxyType = txMethod.forceProxyType;
      const decodedCall = utils.decodeCallMethod(rawTransaction, {
        registry: this._registry,
        metadataRpc: this._metadataRpc,
      });
      const validationResult = ProxyTransactionSchema.validate({ real, forceProxyType, call: decodedCall });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: any): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.Proxy) {
      const txMethod = this._method.args as ProxyArgs;
      this.real(txMethod.real);
      this.forceProxyType(txMethod.forceProxyType);
      const decodedCall = utils.decodeCallMethod(rawTransaction, {
        registry: this._registry,
        metadataRpc: this._metadataRpc,
      });
      this.call(decodedCall);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected proxy`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._real, this._forceProxyType, this._call);
  }

  private validateFields(real: string, forceProxyType: string, call: string): void {
    const validationResult = ProxyTransactionSchema.validate({
      real,
      forceProxyType,
      call,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
