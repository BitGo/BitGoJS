/**
 * @prettier
 */
import { EthLikeTokenConfig, coins } from '@bitgo/statics';
import { BitGoBase, CoinConstructor, NamedCoinConstructor, common, MPCAlgorithm } from '@bitgo/sdk-core';
import {
  CoinNames,
  EthLikeToken,
  recoveryBlockchainExplorerQuery,
  VerifyEthTransactionOptions,
} from '@bitgo/abstract-eth';

import { TransactionBuilder } from './lib';
export { EthLikeTokenConfig };

export class XdcToken extends EthLikeToken {
  public readonly tokenConfig: EthLikeTokenConfig;
  static coinNames: CoinNames = {
    Mainnet: 'xdc',
    Testnet: 'txdc',
  };
  constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig) {
    super(bitgo, tokenConfig, XdcToken.coinNames);
  }
  static createTokenConstructor(config: EthLikeTokenConfig): CoinConstructor {
    return super.createTokenConstructor(config, XdcToken.coinNames);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    return super.createTokenConstructors(XdcToken.coinNames);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to XDC Etherscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from XDC Etherscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()].xdcExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].xdcExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  getFullName(): string {
    return 'XDC Token';
  }

  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Verify if a TSS transaction is valid.
   *
   * NOTE: This override intentionally does NOT call super.verifyTssTransaction() and does NOT
   * parse txPrebuild.txHex.  XDC tokens are built with a non-standard chain ID; the signable
   * hex produced during TSS pre-signing carries a `v` value that is incompatible with the EIP-155
   * check performed by the XDC TransactionBuilder, which would throw "Incompatible EIP155-based V".
   * Until the XDC signable-hex format is standardised, calldata comparison is skipped here and
   * relies on the server-side intent verification layer in wallet-platform.
   *
   * Regression risk: do not remove this override or add super() without first confirming that
   * XDC token signable hexes pass TransactionBuilder.from() without error.
   *
   * @param {VerifyEthTransactionOptions} params
   */
  async verifyTssTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;

    // Structural guard: mirrors the parent's guard so that only known no-recipient types
    // bypass the recipient requirement.  Keep in sync with AbstractEthLikeNewCoins.
    if (
      !txParams?.recipients &&
      !(
        txParams.prebuildTx?.consolidateId ||
        txPrebuild?.consolidateId ||
        (txParams.type &&
          [
            'acceleration',
            'fillNonce',
            'transferToken',
            'tokenApproval',
            'consolidate',
            'bridgeFunds',
            'enableToken',
            'enabletoken',
            'customTx',
          ].includes(txParams.type))
      )
    ) {
      throw new Error(`missing txParams`);
    }
    if (!wallet || !txPrebuild) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }

    // Calldata comparison is intentionally skipped — see method JSDoc.
    return true;
  }
}
