import { BaseCoin as CoinConfig, DotNetwork } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { BuildTransactionError, NotImplementedError, NotSupported } from '../baseCoin/errors';
import { decode, getRegistry } from '@substrate/txwrapper-polkadot';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { AddressInitializationBuilder } from './addressInitializationBuilder';
import { StakingBuilder } from './stakingBuilder';
import { MethodNames } from './iface';
import { UnstakeBuilder } from '.';
import { UnnominateBuilder } from './unnominateBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _registry: TypeRegistry;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.staticsConfig();
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  getStakingBuilder(): StakingBuilder {
    return new StakingBuilder(this._coinConfig);
  }

  getAddressInitializationBuilder(): AddressInitializationBuilder {
    return new AddressInitializationBuilder(this._coinConfig);
  }

  getWalletInitializationBuilder(): void {
    throw new NotImplementedError(`walletInitialization for ${this._coinConfig.name} not implemented`);
  }

  getUnstakeBuilder(): UnstakeBuilder {
    return new UnstakeBuilder(this._coinConfig);
  }

  getUnnominateBuilder(): UnnominateBuilder {
    return new UnnominateBuilder(this._coinConfig);
  }

  from(rawTxn: string): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);
    return builder;
  }

  protected staticsConfig(): void {
    const networkConfig = this._coinConfig.network as DotNetwork;
    const { specName, specVersion, chainName, metadataRpc } = networkConfig;
    this._registry = getRegistry({
      chainName: chainName,
      specName: specName,
      specVersion: specVersion,
      metadataRpc: metadataRpc,
    });
  }

  private getBuilder(rawTxn: string): TransactionBuilder {
    const { metadataRpc } = this._coinConfig.network as DotNetwork;
    if (!this._registry) {
      throw new BuildTransactionError('Please set the network before parsing the transaction');
    }
    const decodedTxn = decode(rawTxn, {
      metadataRpc,
      registry: this._registry,
    });
    const methodName = decodedTxn.method?.name;
    if (methodName === MethodNames.TransferKeepAlive || methodName === MethodNames.Proxy) {
      return this.getTransferBuilder();
    } else if (methodName === MethodNames.Bond) {
      return this.getStakingBuilder();
    } else if (methodName === MethodNames.AddProxy) {
      return this.getAddressInitializationBuilder();
    } else if (methodName === MethodNames.Unbond) {
      return this.getUnstakeBuilder();
    } else if (methodName === MethodNames.Chill) {
      return this.getUnnominateBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
