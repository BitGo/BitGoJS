import { BaseTransactionBuilderFactory, NotImplementedError, NotSupported } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { SingletonRegistry, TransactionBuilder, Interface } from './';
import { TransferBuilder } from './transferBuilder';
import utils from './utils';
import { StakingBuilder } from './stakingBuilder';
import { UnstakeBuilder } from './unstakeBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _material: Interface.Material;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._material = utils.getMaterial(_coinConfig.network.type);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig).material(this._material);
  }

  getStakingBuilder(): StakingBuilder {
    return new StakingBuilder(this._coinConfig).material(this._material);
  }

  getUnstakingBuilder(): UnstakeBuilder {
    return new UnstakeBuilder(this._coinConfig).material(this._material);
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
    if (methodName === Interface.MethodNames.TransferKeepAlive || methodName === Interface.MethodNames.TransferAll) {
      return this.getTransferBuilder();
    } else if (methodName === Interface.MethodNames.AddStake) {
      return this.getStakingBuilder();
    } else if (methodName === Interface.MethodNames.RemoveStake) {
      return this.getUnstakingBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
