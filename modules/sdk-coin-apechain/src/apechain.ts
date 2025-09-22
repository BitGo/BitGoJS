/**
 * @prettier
 */
import { BaseCoin, BitGoBase, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo-beta/statics';
import {
  AbstractEthLikeNewCoins,
  TransactionBuilder as EthLikeTransactionBuilder,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
} from '@bitgo-beta/abstract-eth';
import { TransactionBuilder } from './lib';

export class Apechain extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Apechain(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    return this.buildUnsignedSweepTxnMPCv2(params);
  }
}
