import { BaseTransactionBuilderFactory, NotImplementedError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { TransferBuilder } from './transferBuilder';
import { RegisterDidWithCDDBuilder } from './registerDidWithCDDBuilder';
import utils from './utils';
import { Interface, SingletonRegistry, TransactionBuilder } from './';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _material: Interface.Material;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._material = utils.getMaterial(_coinConfig.network.type);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig).material(this._material);
  }

  getRegisterDidWithCDDBuilder(): RegisterDidWithCDDBuilder {
    return new RegisterDidWithCDDBuilder(this._coinConfig).material(this._material);
  }

  getWalletInitializationBuilder(): void {
    throw new NotImplementedError(`walletInitialization for ${this._coinConfig.name} not implemented`);
  }

  from(rawTxn: string): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);
    return builder;
  }

  material(material: Interface.Material): this {
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
    if (methodName === Interface.MethodNames.TransferWithMemo) {
      return this.getTransferBuilder();
    } else if (methodName === Interface.MethodNames.RegisterDidWithCDD) {
      return this.getRegisterDidWithCDDBuilder();
    } else {
      throw new Error('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
