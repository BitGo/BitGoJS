import { BaseTransactionBuilderFactory, NotImplementedError, NotSupported } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { Material, MethodNames } from './iface';
import { SingletonRegistry } from './singletonRegistry';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _material: Material;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._material = utils.getMaterial(_coinConfig);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig).material(this._material);
  }

  getWalletInitializationBuilder(): void {
    throw new NotImplementedError(`walletInitialization for ${this._coinConfig.name} not implemented`);
  }

  from(rawTxn: string): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);
    return builder;
  }

  material(material: Material): this {
    this._material = material;
    return this;
  }

  private getBuilder(rawTxn: string): TransactionBuilder {
    const registry = SingletonRegistry.getInstance(this._material);
    const decodedTxn = decode(rawTxn, {
      metadataRpc: this._material.metadata,
      registry: registry,
    });

    const methodName = decodedTxn.method?.name;
    if (
      methodName === MethodNames.TransferKeepAlive ||
      methodName === MethodNames.TransferAll ||
      methodName === MethodNames.Proxy
    ) {
      return this.getTransferBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
