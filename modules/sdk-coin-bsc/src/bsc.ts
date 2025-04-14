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
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
  optionalDeps,
  BuildTransactionParams,
} from '@bitgo/abstract-eth';
import type * as EthLikeTxLib from '@ethereumjs/tx';
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
   * Get the chain configuration for BSC
   * @returns {any} The chain configuration object
   */
  public getConfig(): any {
    return {
      chain: this.getChain().includes('t') ? 97 : 56,
      hardfork: 'petersburg',
    };
  }

  /**
   * BSC does not support EIP-1559 transactions
   * @returns {boolean} Always false for BSC
   */
  supportsEIP1559(): boolean {
    return false;
  }

  /**
   * Builds an unsigned sweep transaction for TSS specific to BSC
   * This implementation ensures that only legacy transactions are supported for BSC.
   * @param params - Recovery options
   * @returns {Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2>}
   */
  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    if (!params.replayProtectionOptions) {
      params.replayProtectionOptions = {
        chain: this.getChain().includes('t') ? '97' : '56',
        hardfork: 'petersburg',
      };
    } else if (!params.replayProtectionOptions.hardfork) {
      params.replayProtectionOptions.hardfork = 'petersburg';
    }

    params.replayProtectionOptions.hardfork = 'petersburg';

    if (!params.gasLimit || !params.gasPrice) {
      throw new Error('gasLimit and gasPrice are required for BSC legacy transactions');
    }

    return this.buildUnsignedSweepTxnMPCv2(params);
  }

  /**
   * Override the buildUnsignedSweepTxnMPCv2 method to handle BSC-specific logic
   */
  protected async buildUnsignedSweepTxnMPCv2(params: RecoverOptions): Promise<UnsignedSweepTxMPCv2> {
    const { gasLimit, gasPrice } = await this.getGasValues(params);

    if (!params.userKey) {
      throw new Error('userKey is required for TSS recovery');
    }
    if (!params.backupKey) {
      throw new Error('backupKey is required for TSS recovery');
    }
    if (!params.recoveryDestination) {
      throw new Error('Recipient address (recoveryDestination) is required for TSS recovery');
    }
    if (!params.walletContractAddress) {
      throw new Error('walletContractAddress is required for TSS recovery');
    }

    const derivationPath = params.derivationSeed ? getDerivationPath(params.derivationSeed) : 'm/0';
    const MPC = new Ecdsa();
    const derivedCommonKeyChain = MPC.deriveUnhardened(params.backupKey as string, derivationPath);
    const backupKeyPair = new KeyPair({ pub: derivedCommonKeyChain.slice(0, 66) });
    const baseAddress = backupKeyPair.getAddress();

    const nonce = await this.getAddressNonce(baseAddress, params.apiKey);

    const balance = await this.queryAddressBalance(baseAddress);
    const totalGasNeeded = new optionalDeps.ethUtil.BN(gasLimit).mul(new optionalDeps.ethUtil.BN(gasPrice));
    const txAmount = balance.sub(totalGasNeeded);

    if (txAmount.lte(new optionalDeps.ethUtil.BN(0))) {
      throw new Error('Insufficient funds for recovery transaction');
    }

    // Define the recipient (destination address)
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      gasLimit: gasLimit.toString(10),
    };

    // Create BSC-specific common object
    const chainCfg = this.getConfig();
    // Get the chain ID (56 for mainnet, 97 for testnet)
    const txChainId = chainCfg.chain;
    // BSC uses a specific chain ID calculation for network ID: chainId * 2 + 35
    const networkId = txChainId * 2 + 35;

    // Always use petersburg hardfork for BSC
    const hardfork = 'petersburg';

    const common = EthereumCommon.forCustomChain(
      'mainnet',
      {
        name: 'bsc',
        networkId: networkId,
        chainId: txChainId,
      },
      hardfork
    );

    // Create transaction data object
    // The 'from' address is implicit in the transaction signature
    // The 'to' address is the recovery destination
    const txDataObj = {
      nonce: nonce,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      to: params.recoveryDestination,
      value: txAmount,
      data: Buffer.from(''),
    };

    // Create a transaction using the ethereumjs/tx library
    const legacyTx = optionalDeps.EthTx.Transaction.fromTxData(txDataObj, { common: common });

    // Calculate fee
    const fee = gasLimit * Number(optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed());

    // Get the serialized transaction hex
    const serializedTxHex = legacyTx.serialize().toString('hex');

    // For BSC, we need to get the raw transaction data for signing
    // This ensures the signable hex is in the correct format
    const messageToSign = legacyTx.getMessageToSign(false);

    // Convert Buffer[] to any[] for RLP encoding
    const bufArrToArr = (ba: Buffer[]): any[] => ba.map((b) => b);

    // Use RLP encoding to create the signable hex
    // This is the format expected by the signing service
    const signableHex = Buffer.from(optionalDeps.ethUtil.rlp.encode(bufArrToArr(messageToSign))).toString('hex');

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
        commonKeyChain: params.backupKey,
      },
      replayProtectionOptions: params.replayProtectionOptions,
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

  /**
   * Method to build the tx object specific to BSC
   * @param {BuildTransactionParams} params - params to build transaction
   * @returns {EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction}
   */
  static buildTransaction(
    params: BuildTransactionParams
  ): EthLikeTxLib.FeeMarketEIP1559Transaction | EthLikeTxLib.Transaction {
    // Always use petersburg hardfork for BSC
    const hardfork = 'petersburg';

    // Get chain ID from replay protection options or use default
    const chainId = params.replayProtectionOptions?.chain
      ? parseInt(params.replayProtectionOptions.chain as string, 10)
      : 56;
    // BSC uses a specific chain ID calculation for network ID: chainId * 2 + 35
    const networkId = chainId * 2 + 35;

    // Create a BSC-specific common object with petersburg hardfork
    const common = EthereumCommon.forCustomChain(
      'mainnet',
      {
        name: 'bsc',
        networkId: networkId,
        chainId: chainId,
      },
      hardfork
    );

    const baseParams = {
      to: params.to,
      nonce: params.nonce,
      value: params.value,
      data: params.data,
      gasLimit: new optionalDeps.ethUtil.BN(params.gasLimit),
    };

    // BSC only supports legacy transactions
    const unsignedEthTx = optionalDeps.EthTx.Transaction.fromTxData(
      {
        ...baseParams,
        gasPrice: new optionalDeps.ethUtil.BN(params.gasPrice),
      },
      { common: common }
    );

    return unsignedEthTx;
  }

  /**
   * Method to get the custom chain common object for BSC
   * @param {number} chainId - the chain id of the custom chain
   * @returns {EthereumCommon}
   */
  static getCustomChainCommon(chainId: number): EthereumCommon {
    // Always use petersburg hardfork for BSC
    const hardfork = 'petersburg';

    // BSC uses a specific chain ID calculation for network ID: chainId * 2 + 35
    const networkId = chainId * 2 + 35;

    // Use BSC-specific common objects with petersburg hardfork
    const isTestnet = chainId === 97;
    return EthereumCommon.forCustomChain(
      'mainnet',
      {
        name: isTestnet ? 'testnet' : 'mainnet',
        networkId: networkId,
        chainId: chainId,
      },
      hardfork
    );
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

  // Default delay between API calls (milliseconds)
  private static readonly DEFAULT_API_DELAY = 1500;

  /**
   * Helper method to add delay between API calls to avoid rate limiting
   * @param {number} ms - milliseconds to delay, defaults to DEFAULT_API_DELAY
   * @returns {Promise<void>}
   * @private
   */
  private async delayBetweenApiCalls(ms: number = Bsc.DEFAULT_API_DELAY): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Query the blockchain explorer with rate limiting protection
   * @param {Record<string, string>} query - query parameters
   * @param {string} apiKey - optional API key
   * @returns {Promise<Record<string, unknown>>} - explorer response
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    // Add delay before making API call to avoid rate limiting
    await this.delayBetweenApiCalls();

    // Get API token with fallbacks
    let apiToken = apiKey;

    // If no direct API key provided, try environment variable
    if (!apiToken) {
      apiToken = process.env.BSCSCAN_API_KEY;
    }

    // If still no API key, try BitGo environment
    if (!apiToken) {
      const env = this.bitgo.getEnv();
      const environments = common.Environments[env];
      apiToken = environments?.bscscanApiToken;
    }

    // If we still don't have an API key, use a hardcoded one for now
    // This is a temporary solution until proper API key management is implemented
    if (!apiToken) {
      apiToken = '7IM2WZ72DWSWSG71T3ZTTXCMSKBAKTUWSP'; // User-provided API key
    }

    const explorerUrl = common.Environments[this.bitgo.getEnv()].bscscanBaseUrl;

    // Add API key directly to query to ensure it's used
    query.apikey = apiToken;

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
