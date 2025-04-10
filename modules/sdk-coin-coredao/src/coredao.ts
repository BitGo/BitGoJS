import { BaseCoin, BitGoBase, common, MPCAlgorithm, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  optionalDeps,
  recoveryBlockchainExplorerQuery,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import BN from 'bn.js';

export class Coredao extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Coredao(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): TransactionBuilder {
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

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].coredaoExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].coredaoExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    return this.buildUnsignedSweepTxnMPCv2(params);
  }

  /** @inheritDoc */
  async queryAddressBalance(address: string): Promise<BN> {
    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'balance',
      address: address,
    });
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result || isNaN(Number(result.result))) {
      throw new Error(`Could not obtain address balance for ${address} from the explorer, got: ${result.result}`);
    }
    result.result = result.result.toString();

    return new optionalDeps.ethUtil.BN(result.result, 10);
  }

  /** @inheritDoc */
  async getAddressNonce(address: string): Promise<number> {
    // Get nonce for backup key
    let nonce = 0;

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'txlist',
      sort: 'desc',
      address: address,
    });
    if (!result || !Array.isArray(result.result)) {
      throw new Error('Unable to find next nonce from the explorer, got: ' + JSON.stringify(result));
    }
    const backupKeyTxList = result.result.filter((tx) => tx.from === address);
    if (backupKeyTxList.length > 0) {
      // Calculate last nonce used
      nonce = Math.max(...backupKeyTxList.filter((tx) => tx.from === address).map((tx) => tx.nonce as number)) + 1;
    }
    return nonce;
  }
}
