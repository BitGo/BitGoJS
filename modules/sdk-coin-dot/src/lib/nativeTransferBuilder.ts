import { BaseAddress, DotAssetTypes, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { MethodNames, ProxyArgs, ProxyType, TransferAllArgs, TransferArgs } from './iface';
import { getAddress } from './iface_utils';
import { SingletonRegistry } from './singletonRegistry';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { ProxyTransactionSchema, TransferAllTransactionSchema, TransferTransactionSchema } from './txnSchema';
import utils from './utils';

export abstract class NativeTransferBuilder extends TransactionBuilder {
  protected _sweepFreeBalance = false;
  protected _keepAddressAlive = true;
  protected _amount: string;
  protected _to: string;
  protected _owner: string;
  protected _forceProxyType: ProxyType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   *
   * Dispatch the given call from an account that the sender is authorised for through add_proxy.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxy
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    let transferTx;
    if (this._sweepFreeBalance) {
      transferTx = methods.balances.transferAll(
        {
          dest: { id: this._to },
          keepAlive: this._keepAddressAlive,
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    } else {
      transferTx = methods.balances.transferKeepAlive(
        {
          value: this._amount,
          dest: { id: this._to },
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    }

    if (!this._owner) {
      return transferTx;
    }
    return methods.proxy.proxy(
      {
        real: this._owner,
        forceProxyType: this._forceProxyType,
        call: transferTx.method,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   *
   * Set this to be a sweep transaction, using TransferAll with keepAlive set to true by default.
   * If keepAlive is false, the entire address will be swept (including the 1 DOT minimum).
   *
   * @param {boolean} keepAlive - keep the address alive after this sweep
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://github.com/paritytech/txwrapper-core/blob/main/docs/modules/txwrapper_substrate_src.methods.balances.md#transferall
   */
  sweep(keepAlive?: boolean): this {
    this._sweepFreeBalance = true;
    if (keepAlive !== undefined) {
      this._keepAddressAlive = keepAlive;
    }
    return this;
  }

  /**
   *
   * The amount for transfer transaction.
   *
   * @param {string} amount
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/build-protocol-info
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   *
   * The destination address for transfer transaction.
   *
   * @param {string} dest
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/build-protocol-info
   */
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }

  /**
   *
   * The real address of the original tx
   *
   * @param {BaseAddress} real
   * @returns {TransferBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#why-use-a-proxy
   */
  owner(owner: BaseAddress): this {
    this.validateAddress({ address: owner.address });
    this._owner = owner.address;
    return this;
  }

  /**
   *
   * The proxy type to execute
   *
   * @param {proxyType} forceProxyType
   * @returns {TransferBuilder} This builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-proxies#proxy-types
   */
  forceProxyType(forceProxyType: ProxyType): this {
    this._forceProxyType = forceProxyType;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    if (decodedTxn.method?.name === MethodNames.TransferKeepAlive) {
      const txMethod = decodedTxn.method.args as unknown as TransferArgs;
      const amount = `${txMethod.value}`;
      const to = txMethod.dest.id;
      const validationResult = TransferTransactionSchema.validate({ amount, to });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
      }
    } else if (decodedTxn.method?.name === MethodNames.Proxy) {
      const txMethod = decodedTxn.method.args as unknown as ProxyArgs;
      const real = getAddress(txMethod);
      const forceProxyType = txMethod.forceProxyType;
      const decodedCall = utils.decodeCallMethod(rawTransaction, {
        registry: SingletonRegistry.getInstance(this._material),
        metadataRpc: this._material.metadata,
      });
      const amount = `${decodedCall.value}`;
      const to = decodedCall.dest.id;
      const validationResult = ProxyTransactionSchema.validate({ real, forceProxyType, amount, to });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Proxy Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.TransferKeepAlive) {
      const txMethod = this._method.args as TransferArgs;
      this.amount(txMethod.value);
      this.to({
        address: utils.decodeDotAddress(
          txMethod.dest.id,
          utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
        ),
      });
    } else if (this._method?.name === MethodNames.TransferAll) {
      this._sweepFreeBalance = true;
      const txMethod = this._method.args as TransferAllArgs;
      this.sweep(txMethod.keepAlive);
      this.to({
        address: utils.decodeDotAddress(
          txMethod.dest.id,
          utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
        ),
      });
    } else if (this._method?.name === MethodNames.Proxy) {
      const txMethod = this._method.args as ProxyArgs;
      this.owner({
        address: utils.decodeDotAddress(
          getAddress(txMethod),
          utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
        ),
      });
      this.forceProxyType(txMethod.forceProxyType);
      const decodedCall = utils.decodeCallMethod(rawTransaction, {
        registry: SingletonRegistry.getInstance(this._material),
        metadataRpc: this._material.metadata,
      });
      if (!decodedCall.value || !decodedCall.dest) {
        throw new InvalidTransactionError(
          `Invalid Proxy Transaction Method: ${this._method?.name}. Expected transferKeepAlive`
        );
      }
      this.amount(`${decodedCall.value}`);
      this.to({
        address: utils.decodeDotAddress(
          decodedCall.dest.id,
          utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
        ),
      });
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected a transferKeepAlive or a proxy transferKeepAlive transaction`
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._to, this._amount, this._owner, this._forceProxyType);
  }

  private validateFields(to: string, amount: string, real?: string, forceProxyType?: string): void {
    let validationResult;
    if (forceProxyType) {
      validationResult = ProxyTransactionSchema.validate({ to, amount, real, forceProxyType });
    } else if (this._sweepFreeBalance) {
      validationResult = TransferAllTransactionSchema.validate({ to });
    } else {
      validationResult = TransferTransactionSchema.validate({ amount, to });
    }

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Proxy/TransferAll/TransferKeepAlive Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }
}
