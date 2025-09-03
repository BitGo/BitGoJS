/**
 * @prettier
 */

import BigNumber from 'bignumber.js';
import * as base58 from 'bs58';

import {
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
  BaseCoin,
  ParseTransactionOptions as BaseParseTransactionOptions,
  BaseTransaction,
  TransactionPrebuild as BaseTransactionPrebuild,
  BitGoBase,
  EDDSAMethods,
  EDDSAMethodTypes,
  Environments,
  KeyPair,
  Memo,
  MethodNotImplementedError,
  MPCAlgorithm,
  MPCConsolidationRecoveryOptions,
  MPCRecoveryOptions,
  MPCSweepRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCTxs,
  MPCUnsignedTx,
  OvcInput,
  OvcOutput,
  ParsedTransaction,
  PresignTransactionOptions,
  PublicKey,
  RecoveryTxRequest,
  SignedTransaction,
  SignTransactionOptions,
  TokenEnablementConfig,
  TransactionExplanation,
  TransactionRecipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  MultisigType,
  multisigTypes,
  AuditDecryptedKeyParams,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
} from '@bitgo/sdk-core';
import { auditEddsaPrivateKey, getDerivationPath } from '@bitgo/sdk-lib-mpc';
import { BaseNetwork, CoinFamily, coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import * as _ from 'lodash';
import * as request from 'superagent';
import { KeyPair as SolKeyPair, Transaction, TransactionBuilder, TransactionBuilderFactory } from './lib';
import {
  getAssociatedTokenAccountAddress,
  getSolTokenFromAddress,
  getSolTokenFromTokenName,
  isValidAddress,
  isValidPrivateKey,
  isValidPublicKey,
  validateRawTransaction,
} from './lib/utils';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const DEFAULT_SCAN_FACTOR = 20; // default number of receive addresses to scan for funds

export interface TransactionFee {
  fee: string;
}

export type SolTransactionExplanation = TransactionExplanation;

export interface ExplainTransactionOptions {
  txBase64: string;
  feeInfo: TransactionFee;
  tokenAccountRentExemptAmount?: string;
}

export interface TxInfo {
  recipients: TransactionRecipient[];
  from: string;
  txid: string;
}

export interface SolSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string | string[];
  pubKeys?: string[];
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txBase64: string;
  txInfo: TxInfo;
  source: string;
}

export interface SolVerifyTransactionOptions extends VerifyTransactionOptions {
  memo?: Memo;
  feePayer: string;
  blockhash: string;
  durableNonce?: { walletNonceAddress: string; authWalletAddress: number };
}

interface TransactionOutput {
  address: string;
  amount: number | string;
  tokenName?: string;
}

type TransactionInput = TransactionOutput;

export interface SolParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export interface SolParseTransactionOptions extends BaseParseTransactionOptions {
  txBase64: string;
  feeInfo: TransactionFee;
  tokenAccountRentExemptAmount?: string;
}

interface SolDurableNonceFromNode {
  authority: string;
  blockhash: string;
}

interface TokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

interface TokenAccountInfo {
  isNative: boolean;
  mint: string;
  owner: string;
  state: string;
  tokenAmount: TokenAmount;
}

interface TokenAccount {
  info: TokenAccountInfo;
  pubKey: string;
  tokenName?: string;
}

export interface SolRecoveryOptions extends MPCRecoveryOptions {
  durableNonce?: {
    publicKey: string;
    secretKey: string;
  };
  tokenContractAddress?: string;
  closeAtaAddress?: string;
  // destination address where token should be sent before closing the ATA address
  recoveryDestinationAtaAddress?: string;
  programId?: string; // programId of the token
  apiKey?: string; // API key for node requests
}

export interface SolConsolidationRecoveryOptions extends MPCConsolidationRecoveryOptions {
  durableNonces: {
    publicKeys: string[];
    secretKey: string;
  };
  tokenContractAddress?: string;
  apiKey?: string; // API key for node requests
}

const HEX_REGEX = /^[0-9a-fA-F]+$/;

export class Sol extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sol(bitgo, staticsCoin);
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsMessageSigning(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getNetwork(): BaseNetwork {
    return this._staticsCoin.network;
  }

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  async verifyTransaction(params: SolVerifyTransactionOptions): Promise<boolean> {
    // asset name to transfer amount map
    const totalAmount: Record<string, BigNumber> = {};
    const coinConfig = coins.get(this.getChain());
    const {
      txParams: txParams,
      txPrebuild: txPrebuild,
      memo: memo,
      durableNonce: durableNonce,
      verification: verificationOptions,
    } = params;
    const transaction = new Transaction(coinConfig);
    const rawTx = txPrebuild.txBase64 || txPrebuild.txHex;
    const consolidateId = txPrebuild.consolidateId;

    const walletRootAddress = params.wallet.coinSpecific()?.rootAddress;

    if (!rawTx) {
      throw new Error('missing required tx prebuild property txBase64 or txHex');
    }

    let rawTxBase64 = rawTx;
    if (HEX_REGEX.test(rawTx)) {
      rawTxBase64 = Buffer.from(rawTx, 'hex').toString('base64');
    }
    transaction.fromRawTransaction(rawTxBase64);
    const explainedTx = transaction.explainTransaction();

    // users do not input recipients for consolidation requests as they are generated by the server
    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) =>
        _.pick(recipient, ['address', 'amount', 'tokenName'])
      );
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount', 'tokenName']));

      if (filteredRecipients.length !== filteredOutputs.length) {
        throw new Error('Number of tx outputs does not match with number of txParams recipients');
      }

      // For each recipient, check if it's a token tx (tokenName will exist if so)
      // If it is a token tx, verify that the recipient address equals the derived address from explainedTx
      // Derive the ATA if it is a native address and confirm it is equal to the explained tx recipient
      const recipientChecks = await Promise.all(
        filteredRecipients.map(async (recipientFromUser, index) => {
          const recipientFromTx = filteredOutputs[index]; // This address should be an ATA

          // Compare the BigNumber values because amount is (string | number)
          const userAmount = new BigNumber(recipientFromUser.amount);
          const txAmount = new BigNumber(recipientFromTx.amount);
          if (!userAmount.isEqualTo(txAmount)) {
            return false;
          }

          // Compare the addresses and tokenNames
          // Else if the addresses are not the same, check the derived ATA for parity
          if (
            recipientFromUser.address === recipientFromTx.address &&
            recipientFromUser.tokenName === recipientFromTx.tokenName
          ) {
            return true;
          } else if (recipientFromUser.address !== recipientFromTx.address && recipientFromUser.tokenName) {
            // Try to check if the user's derived ATA is equal to the tx recipient address
            // If getAssociatedTokenAccountAddress throws an error, then we are unable to derive the ATA for that address.
            // Return false and throw an error if that is the case.
            try {
              const tokenMintAddress = getSolTokenFromTokenName(recipientFromUser.tokenName);
              return getAssociatedTokenAccountAddress(
                tokenMintAddress!.tokenAddress,
                recipientFromUser.address,
                true,
                tokenMintAddress!.programId
              ).then((ata: string) => {
                return ata === recipientFromTx.address;
              });
            } catch {
              // Unable to derive ATA
              return false;
            }
          }
          return false;
        })
      );

      if (recipientChecks.includes(false)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
    } else if (verificationOptions?.consolidationToBaseAddress) {
      //verify funds are sent to walletRootAddress for a consolidation
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount', 'tokenName']));

      for (const output of filteredOutputs) {
        if (output.address !== walletRootAddress) {
          throw new Error('tx outputs does not match with expected address');
        }
      }
    }

    const transactionJson = transaction.toJson();
    if (memo && memo.value !== explainedTx.memo) {
      throw new Error('Tx memo does not match with expected txParams recipient memo');
    }
    if (txParams.recipients) {
      for (const recipients of txParams.recipients) {
        // totalAmount based on each token
        const assetName = recipients.tokenName || this.getChain();
        const amount = totalAmount[assetName] || new BigNumber(0);
        totalAmount[assetName] = amount.plus(recipients.amount);
      }

      // total output amount from explainedTx
      const explainedTxTotal: Record<string, BigNumber> = {};

      for (const output of explainedTx.outputs) {
        // total output amount based on each token
        const assetName = output.tokenName || this.getChain();
        const amount = explainedTxTotal[assetName] || new BigNumber(0);
        explainedTxTotal[assetName] = amount.plus(output.amount);
      }

      if (!_.isEqual(explainedTxTotal, totalAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }

    // For non-consolidate transactions, feePayer must be the wallet's root address
    if (consolidateId === undefined && transactionJson.feePayer !== walletRootAddress) {
      throw new Error('Tx fee payer is not the wallet root address');
    }

    if (durableNonce && !_.isEqual(explainedTx.durableNonce, durableNonce)) {
      throw new Error('Tx durableNonce does not match with param durableNonce');
    }

    return true;
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  /**
   * Generate Solana key pair
   *
   * @param {Buffer} seed - Seed from which the new SolKeyPair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer | undefined): KeyPair {
    const result = seed ? new SolKeyPair({ seed }).getKeys() : new SolKeyPair().getKeys();
    return result as KeyPair;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    return isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    return isValidPrivateKey(prv);
  }

  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const solKeypair = new SolKeyPair({ prv: key.prv });
    if (Buffer.isBuffer(message)) {
      message = base58.encode(message);
    }

    return Buffer.from(solKeypair.signMessage(message));
  }

  /**
   * Signs Solana transaction
   * @param params
   * @param callback
   */
  async signTransaction(params: SolSignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const rawTx = params.txPrebuild.txHex || params.txPrebuild.txBase64;
    const txBuilder = factory.from(rawTx);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    const serializedTx = (transaction as BaseTransaction).toBroadcastFormat();

    return {
      txHex: serializedTx,
    } as any;
  }

  async parseTransaction(params: SolParseTransactionOptions): Promise<SolParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txBase64: params.txBase64,
      feeInfo: params.feeInfo,
      tokenAccountRentExemptAmount: params.tokenAccountRentExemptAmount,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    const solTransaction = transactionExplanation as SolTransactionExplanation;
    if (solTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = solTransaction.outputs[0].address;
    const feeAmount = new BigNumber(solTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(solTransaction.outputAmount).plus(feeAmount).toNumber(),
      },
    ];

    const outputs: TransactionOutput[] = solTransaction.outputs.map(({ address, amount, tokenName }) => {
      const output: TransactionOutput = { address, amount };
      if (tokenName) {
        output.tokenName = tokenName;
      }
      return output;
    });

    return {
      inputs,
      outputs,
    };
  }

  /**
   * Explain a Solana transaction from txBase64
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<SolTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction;

    try {
      const transactionBuilder = factory.from(params.txBase64);
      if (transactionBuilder instanceof TransactionBuilder) {
        const txBuilder = transactionBuilder as TransactionBuilder;
        txBuilder.fee({ amount: params.feeInfo.fee });
        if (params.tokenAccountRentExemptAmount) {
          txBuilder.associatedTokenAccountRent(params.tokenAccountRentExemptAmount);
        }
      }
      rebuiltTransaction = await transactionBuilder.build();
    } catch (e) {
      console.log(e);
      throw new Error('Invalid transaction');
    }

    const explainedTransaction = (rebuiltTransaction as BaseTransaction).explainTransaction();

    return explainedTransaction as SolTransactionExplanation;
  }

  /** @inheritDoc */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const factory = this.getBuilder();
    const rebuiltTransaction = await factory.from(serializedTx).build();
    return rebuiltTransaction.signablePayload;
  }

  /** @inheritDoc */
  async presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    // Hot wallet txns are only valid for 1-2 minutes.
    // To buy more time, we rebuild the transaction with a new blockhash right before we sign.
    if (params.walletData.type !== 'hot') {
      return Promise.resolve(params);
    }

    const txRequestId = params.txPrebuild?.txRequestId;
    if (txRequestId === undefined) {
      throw new Error('Missing txRequestId');
    }

    const { tssUtils } = params;

    await tssUtils!.deleteSignatureShares(txRequestId);
    const recreated = await tssUtils!.getTxRequest(txRequestId);
    let txHex = '';
    if (recreated.unsignedTxs) {
      txHex = recreated.unsignedTxs[0]?.serializedTxHex;
    } else {
      txHex = recreated.transactions ? recreated.transactions[0]?.unsignedTx.serializedTxHex : '';
    }

    if (!txHex) {
      throw new Error('Missing serialized tx hex');
    }

    return Promise.resolve({
      ...params,
      txPrebuild: recreated,
      txHex,
    });
  }

  protected getPublicNodeUrl(apiKey?: string): string {
    if (apiKey) {
      return Environments[this.bitgo.getEnv()].solAlchemyNodeUrl + `/${apiKey}`;
    }
    return Environments[this.bitgo.getEnv()].solNodeUrl;
  }

  /**
   * Make a request to one of the public SOL nodes available
   * @param params.payload
   */
  protected async getDataFromNode(
    params: { payload?: Record<string, unknown> },
    apiKey?: string
  ): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl(apiKey);
    try {
      return await request.post(nodeUrl).send(params.payload);
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint: '/' from node: ${nodeUrl}`);
  }

  protected async getBlockhash(apiKey?: string): Promise<string> {
    const response = await this.getDataFromNode(
      {
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getLatestBlockhash',
          params: [
            {
              commitment: 'finalized',
            },
          ],
        },
      },
      apiKey
    );
    if (response.status !== 200) {
      throw new Error('Account not found');
    }

    return response.body.result.value.blockhash;
  }

  protected async getFeeForMessage(message: string, apiKey?: string): Promise<number> {
    const response = await this.getDataFromNode(
      {
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getFeeForMessage',
          params: [
            message,
            {
              commitment: 'finalized',
            },
          ],
        },
      },
      apiKey
    );
    if (response.status !== 200) {
      throw new Error('Account not found');
    }

    return response.body.result.value;
  }

  protected async getRentExemptAmount(apiKey?: string): Promise<number> {
    const response = await this.getDataFromNode(
      {
        payload: {
          jsonrpc: '2.0',
          id: '1',
          method: 'getMinimumBalanceForRentExemption',
          params: [165],
        },
      },
      apiKey
    );
    if (response.status !== 200 || response.error) {
      throw new Error(JSON.stringify(response.error));
    }

    return response.body.result;
  }

  protected async getAccountBalance(pubKey: string, apiKey?: string): Promise<number> {
    const response = await this.getDataFromNode(
      {
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getBalance',
          params: [pubKey],
        },
      },
      apiKey
    );
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.result.value;
  }

  protected async getAccountInfo(pubKey: string, apiKey?: string): Promise<SolDurableNonceFromNode> {
    const response = await this.getDataFromNode(
      {
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getAccountInfo',
          params: [
            pubKey,
            {
              encoding: 'jsonParsed',
            },
          ],
        },
      },
      apiKey
    );
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return {
      authority: response.body.result.value.data.parsed.info.authority,
      blockhash: response.body.result.value.data.parsed.info.blockhash,
    };
  }

  protected async getTokenAccountsByOwner(pubKey = '', programId = '', apiKey?: string): Promise<[] | TokenAccount[]> {
    const response = await this.getDataFromNode(
      {
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getTokenAccountsByOwner',
          params: [
            pubKey,
            {
              programId:
                programId.toString().toLowerCase() === TOKEN_2022_PROGRAM_ID.toString().toLowerCase()
                  ? TOKEN_2022_PROGRAM_ID.toString()
                  : TOKEN_PROGRAM_ID.toString(),
            },
            {
              encoding: 'jsonParsed',
            },
          ],
        },
      },
      apiKey
    );
    if (response.status !== 200) {
      throw new Error('Account not found');
    }

    if (response.body.result.value.length !== 0) {
      const tokenAccounts: TokenAccount[] = [];
      for (const tokenAccount of response.body.result.value) {
        tokenAccounts.push({ info: tokenAccount.account.data.parsed.info, pubKey: tokenAccount.pubKey });
      }
      return tokenAccounts;
    }

    return [];
  }

  protected async getTokenAccountInfo(pubKey: string, apiKey?: string): Promise<TokenAccount> {
    const response = await this.getDataFromNode(
      {
        payload: {
          id: '1',
          jsonrpc: '2.0',
          method: 'getAccountInfo',
          params: [
            pubKey,
            {
              encoding: 'jsonParsed',
            },
          ],
        },
      },
      apiKey
    );
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return {
      pubKey: pubKey,
      info: response.body.result.value.data.parsed.info,
    };
  }

  /** inherited doc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    if (!params.signatureShares) {
      ('Missing transaction(s)');
    }
    const req = params.signatureShares;
    const broadcastableTransactions: MPCTx[] = [];
    let lastScanIndex = 0;

    for (let i = 0; i < req.length; i++) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const transaction = req[i].txRequest.transactions[0].unsignedTx;
      if (!req[i].ovc || !req[i].ovc[0].eddsaSignature) {
        throw new Error('Missing signature(s)');
      }
      const signature = req[i].ovc[0].eddsaSignature;
      if (!transaction.signableHex) {
        throw new Error('Missing signable hex');
      }
      const messageBuffer = Buffer.from(transaction.signableHex!, 'hex');
      const result = MPC.verify(messageBuffer, signature);
      if (!result) {
        throw new Error('Invalid signature');
      }
      const signatureHex = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
      const txBuilder = this.getBuilder().from(transaction.serializedTx as string);
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;
      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;
      const accountId = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const bs58EncodedPublicKey = new SolKeyPair({ pub: accountId }).getAddress();

      // add combined signature from ovc
      const publicKeyObj = { pub: bs58EncodedPublicKey };
      txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);

      const signedTransaction = await txBuilder.build();
      const serializedTx = signedTransaction.toBroadcastFormat();

      broadcastableTransactions.push({
        serializedTx: serializedTx,
        scanIndex: transaction.scanIndex,
      });

      if (i === req.length - 1 && transaction.coinSpecific!.lastScanIndex) {
        lastScanIndex = transaction.coinSpecific!.lastScanIndex as number;
      }
    }

    return { transactions: broadcastableTransactions, lastScanIndex };
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param {SolRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {MPCTx | MPCSweepTxs} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: SolRecoveryOptions): Promise<MPCTx | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }

    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

    // Build the transaction
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    let balance = 0;

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const bs58EncodedPublicKey = new SolKeyPair({ pub: accountId }).getAddress();

    balance = await this.getAccountBalance(bs58EncodedPublicKey, params.apiKey);

    const factory = this.getBuilder();
    const walletCoin = this.getChain();

    let txBuilder;
    let blockhash = await this.getBlockhash(params.apiKey);
    let rentExemptAmount;
    let authority = '';
    let totalFee = new BigNumber(0);
    let totalFeeForTokenRecovery = new BigNumber(0);

    // check for possible token recovery, recover the token provide by user
    if (params.tokenContractAddress) {
      let isUnsupportedToken = false;
      const tokenAccounts = await this.getTokenAccountsByOwner(bs58EncodedPublicKey, params.programId, params.apiKey);
      if (tokenAccounts.length !== 0) {
        // there exists token accounts on the given address, but need to check certain conditions:
        // 1. if there is a recoverable balance
        // 2. if the token is supported by bitgo
        const recovereableTokenAccounts: TokenAccount[] = [];
        for (const tokenAccount of tokenAccounts) {
          if (params.tokenContractAddress === tokenAccount.info.mint) {
            const tokenAmount = new BigNumber(tokenAccount.info.tokenAmount.amount);
            const network = this.getNetwork();
            const token = getSolTokenFromAddress(tokenAccount.info.mint, network); // todo(WIN-5894) fix for ams

            if (!token) {
              isUnsupportedToken = true;
            }
            if (tokenAmount.gt(new BigNumber(0))) {
              tokenAccount.tokenName = token?.name || 'Unsupported Token';
              recovereableTokenAccounts.push(tokenAccount);
            }
            break;
          }
        }

        if (recovereableTokenAccounts.length !== 0) {
          rentExemptAmount = await this.getRentExemptAmount(params.apiKey);

          txBuilder = factory
            .getTokenTransferBuilder()
            .nonce(blockhash)
            .sender(bs58EncodedPublicKey)
            .associatedTokenAccountRent(rentExemptAmount.toString())
            .feePayer(bs58EncodedPublicKey);

          // need to get all token accounts of the recipient address and need to create them if they do not exist
          const recipientTokenAccounts = await this.getTokenAccountsByOwner(
            params.recoveryDestination,
            params.programId,
            params.apiKey
          );

          for (const tokenAccount of recovereableTokenAccounts) {
            let recipientTokenAccountExists = false;
            for (const recipientTokenAccount of recipientTokenAccounts as TokenAccount[]) {
              if (recipientTokenAccount.info.mint === tokenAccount.info.mint) {
                recipientTokenAccountExists = true;
                break;
              }
            }

            const recipientTokenAccount = await getAssociatedTokenAccountAddress(
              tokenAccount.info.mint,
              params.recoveryDestination,
              false,
              params.programId?.toString()
            );
            const tokenName = tokenAccount.tokenName as string;
            const sendParams = {
              address: recipientTokenAccount,
              amount: tokenAccount.info.tokenAmount.amount,
              tokenName,
              ...(isUnsupportedToken
                ? {
                    tokenAddress: tokenAccount.info.mint,
                    programId: params.programId?.toString(),
                    decimalPlaces: tokenAccount.info.tokenAmount.decimals,
                  }
                : {}),
            };
            txBuilder.send(sendParams);

            if (!recipientTokenAccountExists) {
              // recipient token account does not exist for token and must be created
              txBuilder.createAssociatedTokenAccount({
                ownerAddress: params.recoveryDestination,
                tokenName: tokenName,
                ...(isUnsupportedToken ? { tokenAddress: tokenAccount.info.mint } : {}),
                programId:
                  params.programId?.toString().toLowerCase() === TOKEN_2022_PROGRAM_ID.toString().toLowerCase()
                    ? TOKEN_2022_PROGRAM_ID.toString()
                    : TOKEN_PROGRAM_ID.toString(),
              });
              // add rent exempt amount to total fee for each token account that has to be created
              totalFeeForTokenRecovery = totalFeeForTokenRecovery.plus(rentExemptAmount);
            }
          }
        } else {
          throw Error('Not enough token funds to recover');
        }
      } else {
        // there are no recoverable token accounts , need to check if there are tokens to recover
        throw Error('Did not find token account to recover tokens, please check token account');
      }
    } else {
      txBuilder = factory
        .getTransferBuilder()
        .nonce(blockhash)
        .sender(bs58EncodedPublicKey)
        .send({ address: params.recoveryDestination, amount: balance.toString() })
        .feePayer(bs58EncodedPublicKey);
    }

    if (params.durableNonce) {
      const durableNonceInfo = await this.getAccountInfo(params.durableNonce.publicKey, params.apiKey);
      blockhash = durableNonceInfo.blockhash;
      authority = durableNonceInfo.authority;

      txBuilder.nonce(blockhash, {
        walletNonceAddress: params.durableNonce.publicKey,
        authWalletAddress: authority,
      });
    }

    // build the transaction without fee
    const unsignedTransactionWithoutFee = (await txBuilder.build()) as Transaction;
    const serializedMessage = unsignedTransactionWithoutFee.solTransaction.serializeMessage().toString('base64');

    const baseFee = await this.getFeeForMessage(serializedMessage, params.apiKey);
    const feePerSignature = params.durableNonce ? baseFee / 2 : baseFee;
    totalFee = totalFee.plus(new BigNumber(baseFee));
    totalFeeForTokenRecovery = totalFeeForTokenRecovery.plus(new BigNumber(baseFee));
    if (totalFee.gt(balance)) {
      throw Error('Did not find address with funds to recover');
    }

    if (params.tokenContractAddress) {
      // Check if there is sufficient native solana to recover tokens
      if (new BigNumber(balance).lt(totalFeeForTokenRecovery)) {
        throw Error(
          'Not enough funds to pay for recover tokens fees, have: ' +
            balance +
            ' need: ' +
            totalFeeForTokenRecovery.toString()
        );
      }
      txBuilder.fee({ amount: feePerSignature });
    } else {
      const netAmount = new BigNumber(balance).minus(totalFee);
      txBuilder = factory
        .getTransferBuilder()
        .nonce(blockhash)
        .sender(bs58EncodedPublicKey)
        .send({ address: params.recoveryDestination, amount: netAmount.toString() })
        .feePayer(bs58EncodedPublicKey)
        .fee({ amount: feePerSignature });

      if (params.durableNonce) {
        txBuilder.nonce(blockhash, {
          walletNonceAddress: params.durableNonce.publicKey,
          authWalletAddress: authority,
        });
      }
    }

    if (!isUnsignedSweep) {
      // Sign the txn
      if (!params.userKey) {
        throw new Error('missing userKey');
      }

      if (!params.backupKey) {
        throw new Error('missing backupKey');
      }

      if (!params.walletPassphrase) {
        throw new Error('missing wallet passphrase');
      }

      // build the transaction with fee
      const unsignedTransaction = (await txBuilder.build()) as Transaction;

      const userKey = params.userKey.replace(/\s/g, '');
      const backupKey = params.backupKey.replace(/\s/g, '');

      // Decrypt private keys from KeyCard values
      let userPrv;

      try {
        userPrv = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }

      const userSigningMaterial = JSON.parse(userPrv) as EDDSAMethodTypes.UserSigningMaterial;

      let backupPrv;
      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }
      const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;

      const signatureHex = await EDDSAMethods.getTSSSignature(
        userSigningMaterial,
        backupSigningMaterial,
        currPath,
        unsignedTransaction
      );

      const publicKeyObj = { pub: bs58EncodedPublicKey };
      txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);
    }

    if (params.durableNonce) {
      // add durable nonce account signature
      txBuilder.sign({ key: params.durableNonce.secretKey });
    }

    const completedTransaction = await txBuilder.build();
    const serializedTx = completedTransaction.toBroadcastFormat();
    const derivationPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const inputs: OvcInput[] = [];
    for (const input of completedTransaction.inputs) {
      inputs.push({
        address: input.address,
        valueString: input.value,
        value: new BigNumber(input.value).toNumber(),
      });
    }
    const outputs: OvcOutput[] = [];
    for (const output of completedTransaction.outputs) {
      outputs.push({
        address: output.address,
        valueString: output.value,
        coinName: output.coin ? output.coin : walletCoin,
      });
    }
    const spendAmount = completedTransaction.inputs.length === 1 ? completedTransaction.inputs[0].value : 0;
    const parsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
    const feeInfo = { fee: totalFeeForTokenRecovery.toNumber(), feeString: totalFee.toString() };
    const coinSpecific = { commonKeychain: bitgoKey };
    if (isUnsignedSweep) {
      const transaction: MPCTx = {
        serializedTx: serializedTx,
        scanIndex: index,
        coin: walletCoin,
        signableHex: completedTransaction.signablePayload.toString('hex'),
        derivationPath: derivationPath,
        parsedTx: parsedTx,
        feeInfo: feeInfo,
        coinSpecific: coinSpecific,
      };
      const unsignedTx: MPCUnsignedTx = { unsignedTx: transaction, signatureShares: [] };
      const transactions: MPCUnsignedTx[] = [unsignedTx];
      const txRequest: RecoveryTxRequest = {
        transactions: transactions,
        walletCoin: walletCoin,
      };
      const txRequests: MPCSweepTxs = { txRequests: [txRequest] };
      return txRequests;
    }
    const transaction: MPCTx = {
      serializedTx: serializedTx,
      scanIndex: index,
    };
    return transaction;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param {SolRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {BaseBroadcastTransactionResult[]} the serialized transaction hex string and index
   * of the address being swept
   */
  async recoverCloseATA(params: SolRecoveryOptions): Promise<BaseBroadcastTransactionResult[]> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }

    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    if (!params.closeAtaAddress || !this.isValidAddress(params.closeAtaAddress)) {
      throw new Error('invalid closeAtaAddress');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');

    // Build the transaction
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    let balance = 0;

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const bs58EncodedPublicKey = new SolKeyPair({ pub: accountId }).getAddress();

    const accountBalance = await this.getAccountBalance(bs58EncodedPublicKey);

    balance = await this.getAccountBalance(params.closeAtaAddress);
    if (balance <= 0) {
      throw Error('Did not find closeAtaAddress with sol funds to recover');
    }

    const factory = this.getBuilder();

    let txBuilder;
    let blockhash;
    const recovertTxns: BaseBroadcastTransactionResult[] = [];

    const rentExemptAmount = await this.getRentExemptAmount();

    // do token recovery before closing ATA address
    // check if any token is present on the closeAtaAddress
    const tokenInfo = await this.getTokenAccountInfo(params.closeAtaAddress);
    const tokenBalance = Number(tokenInfo.info.tokenAmount.amount);

    if (tokenBalance > 0) {
      // closeATA address has some token balance, it needs to be withdrawn before closing ATA
      console.log(
        `closeATA address ${params.closeAtaAddress} has token balance ${tokenBalance}, it needs to be withdrawn before closing ATA address`
      );

      if (!params.recoveryDestinationAtaAddress || !this.isValidAddress(params.recoveryDestinationAtaAddress)) {
        throw new Error('invalid recoveryDestinationAtaAddress');
      }

      blockhash = await this.getBlockhash(params.apiKey);

      txBuilder = factory
        .getTokenTransferBuilder()
        .nonce(blockhash)
        .sender(bs58EncodedPublicKey)
        .associatedTokenAccountRent(rentExemptAmount.toString())
        .feePayer(bs58EncodedPublicKey);
      const unsignedTransaction = (await txBuilder.build()) as Transaction;
      const serializedMessage = unsignedTransaction.solTransaction.serializeMessage().toString('base64');
      const feePerSignature = await this.getFeeForMessage(serializedMessage, params.apiKey);
      const baseFee = params.durableNonce ? feePerSignature * 2 : feePerSignature;
      const totalFee = new BigNumber(baseFee);
      if (totalFee.gt(accountBalance)) {
        throw Error('Did not find address with funds to recover');
      }
      txBuilder.fee({ amount: feePerSignature });

      const network = this.getNetwork();
      const token = getSolTokenFromAddress(tokenInfo.info.mint, network); // todo(WIN-5894) fix for ams
      txBuilder.send({
        address: params.recoveryDestinationAtaAddress,
        amount: tokenBalance,
        tokenName: token?.name,
      });

      const tokenRecoveryTxn = await this.signAndGenerateBroadcastableTransaction(
        params,
        txBuilder,
        bs58EncodedPublicKey
      );
      const serializedTokenRecoveryTxn = (await tokenRecoveryTxn).serializedTx;
      const broadcastTokenRecoveryTxn = await this.broadcastTransaction({
        serializedSignedTransaction: serializedTokenRecoveryTxn,
      });
      console.log(broadcastTokenRecoveryTxn);
      recovertTxns.push(broadcastTokenRecoveryTxn);
    }

    // after recovering the token amount, attempting to close the ATA address
    if (params.closeAtaAddress) {
      blockhash = await this.getBlockhash(params.apiKey);

      const ataCloseBuilder = () => {
        const txBuilder = factory.getCloseAtaInitializationBuilder();
        txBuilder.nonce(blockhash);
        txBuilder.sender(bs58EncodedPublicKey);
        txBuilder.accountAddress(params.closeAtaAddress ?? '');
        txBuilder.destinationAddress(params.recoveryDestination);
        txBuilder.authorityAddress(bs58EncodedPublicKey);
        txBuilder.associatedTokenAccountRent(rentExemptAmount.toString());
        return txBuilder;
      };
      txBuilder = ataCloseBuilder();
    }
    const closeATARecoveryTxn = await this.signAndGenerateBroadcastableTransaction(
      params,
      txBuilder,
      bs58EncodedPublicKey
    );
    const serializedCloseATARecoveryTxn = (await closeATARecoveryTxn).serializedTx;
    const broadcastCloseATARecoveryTxn = await this.broadcastTransaction({
      serializedSignedTransaction: serializedCloseATARecoveryTxn,
    });
    console.log(broadcastCloseATARecoveryTxn);
    recovertTxns.push(broadcastCloseATARecoveryTxn);

    return recovertTxns;
  }

  async signAndGenerateBroadcastableTransaction(
    params: SolRecoveryOptions,
    txBuilder: any,
    bs58EncodedPublicKey: string
  ): Promise<MPCTx> {
    // Sign the txn
    if (!params.userKey) {
      throw new Error('missing userKey');
    }

    if (!params.backupKey) {
      throw new Error('missing backupKey');
    }

    if (!params.walletPassphrase) {
      throw new Error('missing wallet passphrase');
    }

    const unsignedTransaction = (await txBuilder.build()) as Transaction;

    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    // Decrypt private keys from KeyCard values
    let userPrv;

    try {
      userPrv = this.bitgo.decrypt({
        input: userKey,
        password: params.walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting user keychain: ${e.message}`);
    }

    const userSigningMaterial = JSON.parse(userPrv) as EDDSAMethodTypes.UserSigningMaterial;

    let backupPrv;
    try {
      backupPrv = this.bitgo.decrypt({
        input: backupKey,
        password: params.walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${e.message}`);
    }
    const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;

    const signatureHex = await EDDSAMethods.getTSSSignature(
      userSigningMaterial,
      backupSigningMaterial,
      currPath,
      unsignedTransaction
    );

    const publicKeyObj = { pub: bs58EncodedPublicKey };
    txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);

    const completedTransaction = await txBuilder.build();
    const serializedTx = completedTransaction.toBroadcastFormat();
    const transaction: MPCTx = {
      serializedTx: serializedTx,
      scanIndex: index,
    };
    return transaction;
  }

  /**
   * Builds native SOL recoveries of receive addresses in batch without BitGo.
   * Funds will be recovered to base address first. You need to initiate another sweep txn after that.
   *
   * @param {SolConsolidationRecoveryOptions} params - options for consolidation recovery.
   * @param {string} [params.startingScanIndex] - receive address index to start scanning from. default to 1 (inclusive).
   * @param {string} [params.endingScanIndex] - receive address index to end scanning at. default to startingScanIndex + 20 (exclusive).
   */
  async recoverConsolidations(params: SolConsolidationRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const startIdx = params.startingScanIndex || 1;
    const endIdx = params.endingScanIndex || startIdx + DEFAULT_SCAN_FACTOR;

    if (startIdx < 1 || endIdx <= startIdx || endIdx - startIdx > 10 * DEFAULT_SCAN_FACTOR) {
      throw new Error(
        `Invalid starting or ending index to scan for addresses. startingScanIndex: ${startIdx}, endingScanIndex: ${endIdx}.`
      );
    }

    // validate durable nonces array
    if (!params.durableNonces) {
      throw new Error('Missing durable nonces');
    }
    if (!params.durableNonces.publicKeys) {
      throw new Error('Invalid durable nonces: missing public keys');
    }
    if (!params.durableNonces.secretKey) {
      throw new Error('Invalid durable nonces array: missing secret key');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const baseAddressIndex = 0;
    const baseAddressPath = params.seed
      ? getDerivationPath(params.seed) + `/${baseAddressIndex}`
      : `m/${baseAddressIndex}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, baseAddressPath).slice(0, 64);
    const baseAddress = new SolKeyPair({ pub: accountId }).getAddress();

    let durableNoncePubKeysIndex = 0;
    const durableNoncePubKeysLength = params.durableNonces.publicKeys.length;
    const consolidationTransactions: any[] = [];
    let lastScanIndex = startIdx;

    for (let i = startIdx; i < endIdx; i++) {
      const recoverParams = {
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletPassphrase: params.walletPassphrase,
        recoveryDestination: baseAddress,
        seed: params.seed,
        index: i,
        durableNonce: {
          publicKey: params.durableNonces.publicKeys[durableNoncePubKeysIndex],
          secretKey: params.durableNonces.secretKey,
        },
        tokenContractAddress: params.tokenContractAddress,
        apiKey: params.apiKey,
      };

      let recoveryTransaction;
      try {
        recoveryTransaction = await this.recover(recoverParams);
      } catch (e) {
        if (
          e.message === 'Did not find address with funds to recover' ||
          e.message === 'Did not find token account to recover tokens, please check token account' ||
          e.message === 'Not enough token funds to recover'
        ) {
          lastScanIndex = i;
          continue;
        }
        throw e;
      }

      if (isUnsignedSweep) {
        consolidationTransactions.push((recoveryTransaction as MPCSweepTxs).txRequests[0]);
      } else {
        consolidationTransactions.push(recoveryTransaction);
      }

      lastScanIndex = i;
      durableNoncePubKeysIndex++;
      if (durableNoncePubKeysIndex >= durableNoncePubKeysLength) {
        // no more available nonce accounts to create transactions
        break;
      }
    }

    if (consolidationTransactions.length === 0) {
      throw new Error('Did not find an address with funds to recover');
    }

    if (isUnsignedSweep) {
      // lastScanIndex will be used to inform user the last address index scanned for available funds (so they can
      // appropriately adjust the scan range on the next iteration of consolidation recoveries). In the case of unsigned
      // sweep consolidations, this lastScanIndex will be provided in the coinSpecific of the last txn made.
      const lastTransactionCoinSpecific = {
        commonKeychain:
          consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific
            .commonKeychain,
        lastScanIndex: lastScanIndex,
      };
      consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific =
        lastTransactionCoinSpecific;
      const consolidationSweepTransactions: MPCSweepTxs = { txRequests: consolidationTransactions };
      return consolidationSweepTransactions;
    }

    return { transactions: consolidationTransactions, lastScanIndex };
  }

  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: true,
    };
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  async broadcastTransaction({
    serializedSignedTransaction,
  }: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    validateRawTransaction(serializedSignedTransaction, true, true);
    const response = await this.getDataFromNode({
      payload: {
        id: '1',
        jsonrpc: '2.0',
        method: 'sendTransaction',
        params: [
          serializedSignedTransaction,
          {
            encoding: 'base64',
          },
        ],
      },
    });

    if (response.body.error) {
      throw new Error('Error broadcasting transaction: ' + response.body.error.message);
    }

    return { txId: response.body.result };
  }

  /** @inheritDoc */
  auditDecryptedKey({ prv, publicKey, multiSigType }: AuditDecryptedKeyParams) {
    if (multiSigType !== 'tss') {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }

  /** @inheritDoc */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    // Handle custom instructions for Solana
    if (params.solInstructions) {
      intent.solInstructions = params.solInstructions;
    }
  }
}
