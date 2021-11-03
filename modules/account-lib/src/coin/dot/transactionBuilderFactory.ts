import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory } from '../baseCoin';
import { NotSupported } from '../baseCoin/errors';
import { decode } from '@substrate/txwrapper-polkadot';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { ProxyBuilder } from './proxyBuilder';
import { AddProxyBuilder } from './addProxyBuilder';
import { StakeBuilder } from './stakeBuilder';
import { metadataRpc } from './metaData';
import { MethodNames } from './iface';
import Utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  getTransferBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }

  getProxyBuilder(): ProxyBuilder {
    return new ProxyBuilder(this._coinConfig);
  }

  getStakeBuilder(): StakeBuilder {
    return new StakeBuilder(this._coinConfig);
  }

  getAddProxyBuilder(): AddProxyBuilder {
    return new AddProxyBuilder(this._coinConfig);
  }

  from(rawTxn: string): TransactionBuilder {
    const builder = this.getBuilder(rawTxn);
    builder.from(rawTxn);

    return builder;
  }

  private getBuilder(rawTxn: string): TransactionBuilder {
    const decodedTxn = decode(rawTxn, {
      metadataRpc: metadataRpc,
      registry: Utils.getDefaultRegistry(),
    });
    if (decodedTxn.method?.name === MethodNames.TransferKeepAlive) {
      return this.getTransferBuilder();
    } else if (decodedTxn.method?.name === MethodNames.Bond) {
      return this.getStakeBuilder();
    } else if (decodedTxn.method?.name === MethodNames.AddProxy) {
      return this.getAddProxyBuilder();
    } else if (decodedTxn.method?.name === MethodNames.Proxy) {
      return this.getProxyBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }

  public getWalletInitializationBuilder(): TransferBuilder {
    return new TransferBuilder(this._coinConfig);
  }
}
