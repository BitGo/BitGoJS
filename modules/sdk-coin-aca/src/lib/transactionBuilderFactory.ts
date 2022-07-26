import { BaseTransactionBuilderFactory, NotImplementedError, NotSupported } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { Material, MethodNames } from './iface';
import { SingletonRegistry } from './singletonRegistry';
import { TransferBuilder } from 'import from polkadot';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _material: Material;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._material = utils.getMaterial(_coinConfig);
  }

  public getWalletInitializationBuilder() {
    throw new Error('Method not implemented.');
  }

  getTransferBuilder(): TransferBuilder {
    // get the transfer builder from polkadot import not custom one
    return new TransferBuilder(this._coinConfig).material(this._material);
  }

  getTokenBuilder(): TokenBuilder {
    // get the transfer builder from polkadot import not custom one
    // this will be implemented here in sdk-coin-acala
    return new TokenBuilder(this._coinConfig).material(this._material);
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
    if (methodName === MethodNames.TransferKeepAlive || methodName === MethodNames.Proxy) {
      return this.getTransferBuilder();
    } else if (methodName === MethodNames.Transfer) {
      return this.getTokenBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
