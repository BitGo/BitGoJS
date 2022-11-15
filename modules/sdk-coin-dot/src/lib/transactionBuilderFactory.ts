import { BaseTransactionBuilderFactory, NotImplementedError, NotSupported } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { decode } from '@substrate/txwrapper-polkadot';
import { AddressInitializationBuilder } from './addressInitializationBuilder';
import { Material, MethodNames } from './iface';
import { RemoveProxyBuilder } from './proxyBuilder';
import { SingletonRegistry } from './singletonRegistry';
import { StakingBuilder } from './stakingBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { UnnominateBuilder } from './unnominateBuilder';
import utils from './utils';
import { BatchTransactionBuilder, ClaimBuilder, UnstakeBuilder, WithdrawUnstakedBuilder } from '.';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _material: Material;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._material = utils.getMaterial(_coinConfig);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig).material(this._material);
  }

  getStakingBuilder(): StakingBuilder {
    return new StakingBuilder(this._coinConfig).material(this._material);
  }

  getAddressInitializationBuilder(): AddressInitializationBuilder {
    return new AddressInitializationBuilder(this._coinConfig).material(this._material);
  }

  getRemoveProxyBuilder(): RemoveProxyBuilder {
    return new RemoveProxyBuilder(this._coinConfig).material(this._material);
  }

  getBatchTransactionBuilder(): BatchTransactionBuilder {
    return new BatchTransactionBuilder(this._coinConfig).material(this._material);
  }

  getWalletInitializationBuilder(): void {
    throw new NotImplementedError(`walletInitialization for ${this._coinConfig.name} not implemented`);
  }

  getUnstakeBuilder(): UnstakeBuilder {
    return new UnstakeBuilder(this._coinConfig).material(this._material);
  }

  getWithdrawUnstakedBuilder(): WithdrawUnstakedBuilder {
    return new WithdrawUnstakedBuilder(this._coinConfig).material(this._material);
  }

  getClaimBuilder(): ClaimBuilder {
    return new ClaimBuilder(this._coinConfig).material(this._material);
  }

  getUnnominateBuilder(): UnnominateBuilder {
    return new UnnominateBuilder(this._coinConfig);
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
    } else if (methodName === MethodNames.Bond || methodName === MethodNames.BondExtra) {
      return this.getStakingBuilder();
    } else if (methodName === MethodNames.AddProxy) {
      return this.getAddressInitializationBuilder();
    } else if (methodName === MethodNames.RemoveProxy) {
      return this.getRemoveProxyBuilder();
    } else if (methodName === MethodNames.Unbond) {
      return this.getUnstakeBuilder();
    } else if (methodName === MethodNames.Chill) {
      return this.getUnnominateBuilder();
    } else if (methodName === MethodNames.WithdrawUnbonded) {
      return this.getWithdrawUnstakedBuilder();
    } else if (methodName === MethodNames.PayoutStakers) {
      return this.getClaimBuilder();
    } else if (methodName === MethodNames.Batch || methodName === MethodNames.BatchAll) {
      return this.getBatchTransactionBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
