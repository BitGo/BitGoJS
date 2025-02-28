import {
  BaseCoin,
  BitGoBase,
  Environments,
  SignTransactionOptions as BaseSignTransactionOptions,
} from '@bitgo/sdk-core';
import { coins, BaseCoin as StaticsBaseCoin, BittensorSpecNameType } from '@bitgo/statics';
import { Interface, SubstrateCoin } from '@bitgo/abstract-substrate';
import { TransactionBuilderFactory } from './lib';
import { ApiPromise, WsProvider } from '@polkadot/api';

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: Interface.TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
}

export class Tao extends SubstrateCoin {
  readonly staticsCoin?: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this.staticsCoin = staticsCoin;
  }

  protected static nodeApiInitialized = false;
  protected static API: ApiPromise;

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tao(bitgo, staticsCoin);
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  getMaxValidityDurationBlocks(): number {
    return 2400;
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  protected async getInitializedNodeAPI(): Promise<ApiPromise> {
    if (!Tao.nodeApiInitialized) {
      const wsProvider = new WsProvider(Environments[this.bitgo.getEnv()].substrateNodeUrls);
      Tao.API = await ApiPromise.create({ provider: wsProvider });
      Tao.nodeApiInitialized = true;
    }
    return Tao.API;
  }

  protected async getAccountInfo(walletAddr: string): Promise<{ nonce: number; freeBalance: number }> {
    const api = await this.getInitializedNodeAPI();
    const { nonce, data: balance } = await api.query.system.account(walletAddr);
    return { nonce: nonce.toNumber(), freeBalance: balance.free.toNumber() };
  }

  protected async getFee(destAddr: string, srcAddr: string, amount: number): Promise<number> {
    const api = await this.getInitializedNodeAPI();
    const info = await api.tx.balances.transferAllowDeath(destAddr, amount).paymentInfo(srcAddr);
    return info.partialFee.toNumber();
  }

  protected async getHeaderInfo(): Promise<{ headerNumber: number; headerHash: string }> {
    const api = await this.getInitializedNodeAPI();
    const { number, hash } = await api.rpc.chain.getHeader();
    return { headerNumber: number.toNumber(), headerHash: hash.toString() };
  }

  protected async getMaterial(): Promise<Interface.Material> {
    const api = await this.getInitializedNodeAPI();
    return {
      genesisHash: api.genesisHash.toString(),
      chainName: api.runtimeChain.toString(),
      specName: api.runtimeVersion.specName.toString() as BittensorSpecNameType,
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      txVersion: api.runtimeVersion.transactionVersion.toNumber(),
      metadata: api.runtimeMetadata.toHex(),
    };
  }
}
