import {
  BaseCoin,
  BitGoBase,
  common,
  Ecdsa,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  UnsignedTransactionTss,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  KeyPair,
  recoveryBlockchainExplorerQuery,
  ReplayProtectionOptions,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
  ETHTransactionType,
  Transaction as EthTransaction,
  optionalDeps,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';
import EthereumCommon from '@ethereumjs/common';

export class Bsc extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Bsc(bitgo, staticsCoin);
  }

  /**
   * Builds an unsigned sweep transaction for TSS specific to BSC
   * This implementation ensures that only legacy transactions are supported for BSC.
   * @param params - Recovery options
   * @returns {Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2>}
   */
  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    const bscParams: RecoverOptions = { ...params };

    if (!bscParams.replayProtectionOptions) {
      bscParams.replayProtectionOptions = {
        chain: this.getChain().includes('t') ? '97' : '56',
        hardfork: 'petersburg',
      };
    } else if (!bscParams.replayProtectionOptions.hardfork) {
      bscParams.replayProtectionOptions.hardfork = 'petersburg';
    }

    if (!bscParams.gasLimit || !bscParams.gasPrice) {
      throw new Error('gasLimit and gasPrice are required for BSC legacy transactions');
    }

    if (!bscParams.backupKey) {
      throw new Error('backupKey is required for TSS recovery');
    }
    if (!bscParams.recoveryDestination) {
      throw new Error('Recipient address (recoveryDestination) is required for TSS recovery');
    }

    const { gasLimit, gasPrice } = await this.getGasValues(params);

    const derivationPath = bscParams.derivationSeed ? getDerivationPath(bscParams.derivationSeed) : 'm/0';
    const MPC = new Ecdsa();
    const derivedCommonKeyChain = MPC.deriveUnhardened(bscParams.backupKey as string, derivationPath);
    const backupKeyPair = new KeyPair({ pub: derivedCommonKeyChain.slice(0, 66) });
    const baseAddress = backupKeyPair.getAddress();

    const { txInfo, tx, nonce } = await this.buildTssRecoveryTxn(baseAddress, gasPrice, gasLimit, bscParams);

    return this.buildTxRequestForOfflineVaultMPCv2bsc(
      txInfo,
      tx,
      derivationPath,
      nonce,
      gasPrice,
      gasLimit,
      bscParams.replayProtectionOptions,
      derivedCommonKeyChain
    );
  }
  /**
   * This transforms the unsigned transaction information into a format the BitGo offline vault expects
   * Specific to BSC which only supports legacy transactions
   * @param {any} txInfo
   * @param {any} tx
   * @param {string} derivationPath
   * @param {number} nonce
   * @param {string} gasPrice
   * @param {string} gasLimit
   * @param {undefined} _eip1559Params
   * @param {ReplayProtectionOptions} replayProtectionOptions
   * @param {string} commonKeyChain
   * @returns {UnsignedSweepTxMPCv2}
   */
  private buildTxRequestForOfflineVaultMPCv2bsc(
    txInfo: any,
    tx: any,
    derivationPath: string,
    nonce: any,
    gasPrice: Buffer,
    gasLimit: number,
    replayProtectionOptions: ReplayProtectionOptions | undefined,
    commonKeyChain: string
  ): OfflineVaultTxInfo | UnsignedSweepTxMPCv2 {
    if (!tx.to) {
      throw new Error('BSC tx must have a `to` address');
    }

    console.log('tx', tx);
    const fee = gasLimit * Number(optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed());
    const txNonce = tx.nonce;
    const txGasPrice = tx.gasPrice;
    const txGasLimit = tx.gasLimit;
    const txTo = tx.to ? tx.to.toBuffer() : Buffer.alloc(0);
    const txValue = tx.value;
    const txData = tx.data && tx.data.length > 0 ? tx.data : Buffer.alloc(0);
    const txFrom = tx.from ? tx.from.toBuffer() : Buffer.alloc(0);

    const txChainId = this.getChain().includes('t') ? 97 : 56;

    let signableHex: string;
    let serializedTxHex: string;

    try {
      const txDataObj = {
        nonce: txNonce,
        gasPrice: txGasPrice,
        gasLimit: txGasLimit,
        to: txTo,
        value: txValue,
        data: txData,
        chainId: txChainId.toString(),
        _type: ETHTransactionType.LEGACY,
        from: txFrom,
      };

      const common = EthereumCommon.forCustomChain(
        'mainnet',
        {
          name: 'bsc',
          networkId: txChainId,
          chainId: txChainId,
        },
        'petersburg'
      );

      const bscTx = new EthTransaction(coins.get(this.getChain()), common, txDataObj);
      const serializedTx = bscTx.toBroadcastFormat();
      // Remove '0x' prefix if present
      serializedTxHex = serializedTx.startsWith('0x') ? serializedTx.slice(2) : serializedTx;
      signableHex = serializedTxHex;
    } catch (e) {
      throw new Error(`Failed to encode transaction: ${e.message}`);
    }

    if (!replayProtectionOptions) {
      replayProtectionOptions = {
        chain: txChainId.toString(),
        hardfork: 'petersburg',
      };
    } else if (!replayProtectionOptions.chain) {
      replayProtectionOptions.chain = txChainId.toString();
    }

    const unsignedTx: UnsignedTransactionTss = {
      serializedTxHex: serializedTxHex,
      signableHex: signableHex,
      derivationPath: derivationPath,
      feeInfo: {
        fee: fee,
        feeString: fee.toString(),
      },
      parsedTx: {
        spendAmount: txInfo.recipient.amount,
        outputs: [
          {
            coinName: this.getChain(),
            address: txInfo.recipient.address,
            valueString: txInfo.recipient.amount,
          },
        ],
      },
      coinSpecific: {
        commonKeyChain: commonKeyChain,
      },
      replayProtectionOptions: replayProtectionOptions,
    };

    return {
      txRequests: [
        {
          walletCoin: this.getChain(),
          transactions: [
            {
              unsignedTx: unsignedTx,
              nonce: nonce,
              signatureShares: [],
            },
          ],
        },
      ],
    };
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  allowsAccountConsolidations(): boolean {
    return true;
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

  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const apiToken = apiKey || common.Environments[this.bitgo.getEnv()].bscscanApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].bscscanBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }

  /**
   * Verify if a tss transaction is valid
   *
   * @param {VerifyEthTransactionOptions} params
   * @param {TransactionParams} params.txParams - params object passed to send
   * @param {TransactionPrebuild} params.txPrebuild - prebuild object returned by server
   * @param {Wallet} params.wallet - Wallet object to obtain keys to verify against
   * @returns {boolean}
   */
  async verifyTssTransaction(params: { txParams: any; txPrebuild: any; wallet: any }): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;
    if (
      !txParams?.recipients &&
      !(
        txParams.prebuildTx?.consolidateId ||
        (txParams.type && ['acceleration', 'fillNonce', 'transferToken'].includes(txParams.type))
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

    return true;
  }
}
