import { BaseCoin as CoinConfig, DotNetwork } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { BuildTransactionError, NotSupported } from '../baseCoin/errors';
import { decode, getRegistry } from '@substrate/txwrapper-polkadot';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { StakingBuilder } from './stakingBuilder';
import { MethodNames } from './iface';
import { UnstakeBuilder } from '.';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _metadataRpc: string;
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

  getWalletInitializationBuilder(): WalletInitializationBuilder {
    return new WalletInitializationBuilder(this._coinConfig);
  }

  getUnstakeBuilder(): UnstakeBuilder {
    return new UnstakeBuilder(this._coinConfig);
  }

  from(rawTxn: string): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);
    return builder;
  }

  protected staticsConfig(): void {
    const networkConfig = this._coinConfig.network as DotNetwork;
    const { specName, specVersion, chainName, metadataRpc } = networkConfig;
    this._metadataRpc = metadataRpc;
    this._registry = getRegistry({
      chainName: chainName,
      specName: specName,
      specVersion: specVersion,
      metadataRpc: metadataRpc,
    });
  }

  private getBuilder(rawTxn: string): TransactionBuilder {
    if (!this._registry || !this._metadataRpc) {
      throw new BuildTransactionError('Please set the network before parsing the transaction');
    }
    const decodedTxn = decode(rawTxn, {
      metadataRpc: this._metadataRpc,
      registry: this._registry,
    });
    const methodName = decodedTxn.method?.name;
    if (methodName === MethodNames.TransferKeepAlive || methodName === MethodNames.Proxy) {
      return this.getTransferBuilder();
    } else if (methodName === MethodNames.Bond) {
      return this.getStakingBuilder();
    } else if (methodName === MethodNames.AddProxy) {
      return this.getWalletInitializationBuilder();
    } else if (methodName === MethodNames.Unbond) {
      return this.getUnstakeBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }
}
