/**
 * @prettier
 */

import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import * as base58 from 'bs58';
import * as nearAPI from 'near-api-js';
import * as request from 'superagent';

import { auditEddsaPrivateKey } from '@bitgo/sdk-lib-mpc';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  Eddsa,
  EDDSAMethods,
  EDDSAMethodTypes,
  Environments,
  KeyPair,
  MPCAlgorithm,
  MPCRecoveryOptions,
  MPCSweepRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCTxs,
  MPCUnsignedTx,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  PublicKey,
  RecoveryTxRequest,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TokenEnablementConfig,
  TransactionParams,
  TransactionType,
  TssVerifyAddressOptions,
  UnexpectedAddressError,
  verifyEddsaTssWalletAddress,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins, Nep141Token, Networks } from '@bitgo/statics';

import { KeyPair as NearKeyPair, Transaction, TransactionBuilder, TransactionBuilderFactory } from './lib';
import { TransactionExplanation, TxData } from './lib/iface';
import nearUtils from './lib/utils';
import { MAX_GAS_LIMIT_FOR_FT_TRANSFER, STORAGE_DEPOSIT } from './lib/constants';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  key: string;
  blockHash: string;
  nonce: bigint;
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
  signer: string;
}

export interface NearParseTransactionOptions extends BaseParseTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

/**
 * Options for verifying NEAR TSS/MPC wallet addresses.
 * Extends base TssVerifyAddressOptions with NEAR-specific fields.
 */
export interface TssVerifyNearAddressOptions extends TssVerifyAddressOptions {
  /** The root address of the wallet (for root address verification) */
  rootAddress?: string;
}

interface TransactionOutput {
  address: string;
  amount: string;
}

interface NearTxBuilderParamsFromNode {
  nonce: bigint;
  blockHash: string;
}

interface NearFeeConfig {
  sendSir: number;
  sendNotSir: number;
  execution: number;
}

interface ProtocolConfigOutput {
  storageAmountPerByte: number;
  transferCost: NearFeeConfig;
  receiptConfig: NearFeeConfig;
}

type TransactionInput = TransactionOutput;

export interface NearParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export type NearTransactionExplanation = TransactionExplanation;

export class Near extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  protected static initialized = false;
  protected static MPC: Eddsa;
  protected network = this.bitgo.getEnv() === 'prod' ? 'main' : 'test';

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Near(bitgo, staticsCoin);
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /**
   * @inheritDoc
   */
  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: false,
    };
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getBaseChain(): string {
    return this.getChain();
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseFactor(): any {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new NearKeyPair({ seed }) : new NearKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return nearUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid near private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return nearUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return nearUtils.isValidAddress(address);
  }

  /** @inheritDoc */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const nearKeypair = new NearKeyPair({ prv: key.prv });
    if (Buffer.isBuffer(message)) {
      message = base58.encode(message);
    }

    return Buffer.from(nearKeypair.signMessage(message));
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<NearTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txPrebuild.txHex;

    try {
      const transactionBuilder = factory.from(txRaw);
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;

    const txHex = params.txPrebuild.txHex;

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params.txPrebuild, 'key')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    // if we are receiving addresses do not try to convert them
    const signer = !nearUtils.isValidAddress(params.txPrebuild.key)
      ? new NearKeyPair({ pub: params.txPrebuild.key }).getAddress()
      : params.txPrebuild.key;
    return { txHex, prv, signer };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param callback
   * @returns {Bluebird<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const txBuilder = factory.from(params.txPrebuild.txHex);
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

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: MPCRecoveryOptions): Promise<MPCTx | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
    let startIdx = params.startingScanIndex;
    if (startIdx === undefined) {
      startIdx = 0;
    } else if (!Number.isInteger(startIdx) || startIdx < 0) {
      throw new Error('Invalid starting index to scan for addresses');
    }
    let numIteration = params.scan;
    if (numIteration === undefined) {
      numIteration = 20;
    } else if (!Number.isInteger(numIteration) || numIteration <= 0) {
      throw new Error('Invalid scanning factor');
    }
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const { storageAmountPerByte, transferCost, receiptConfig } = await this.getProtocolConfig();
    let isStorageDepositEnabled = false;

    if (params.tokenContractAddress) {
      // check if receiver storage deposit is enabled
      isStorageDepositEnabled = await this.checkIfStorageDepositIsEnabled(
        params.recoveryDestination,
        params.tokenContractAddress
      );
    }

    for (let i = startIdx; i < numIteration + startIdx; i++) {
      const currPath = `m/${i}`;
      const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
      let availableBalance = new BigNumber(0);
      try {
        availableBalance = new BigNumber(await this.getAccountBalance(accountId, storageAmountPerByte));
      } catch (e) {
        // UNKNOWN_ACCOUNT error indicates that the address has not partake in any transaction so far, so we will
        // treat it as a zero balance address
        if (e.message !== 'UNKNOWN_ACCOUNT') {
          throw e;
        }
      }
      if (availableBalance.toNumber() <= 0) {
        continue;
      }
      const feeReserve = BigNumber(Networks[this.network].near.feeReserve);
      const storageReserve = BigNumber(Networks[this.network].near.storageReserve);

      // check for possible token recovery, recover the token provided by the user
      if (params.tokenContractAddress) {
        const tokenName = nearUtils.findTokenNameFromContractAddress(params.tokenContractAddress);
        if (!tokenName) {
          throw new Error(
            `Token name not found for contract address ${params.tokenContractAddress}. The address may be invalid or unsupported. Please refer to the supported tokens in the BitGo documentation for guidance.`
          );
        }
        const token = nearUtils.getTokenInstanceFromTokenName(tokenName);
        if (!token) {
          throw new Error(
            `Token instance could not be created for token name ${tokenName}. The token may be invalid or unsupported. Please refer to the supported tokens in the BitGo documentation for guidance.`
          );
        }
        let availableTokenBalance: BigNumber;
        try {
          availableTokenBalance = new BigNumber(
            await this.getAccountFungibleTokenBalance(accountId, params.tokenContractAddress)
          );
        } catch (e) {
          throw e;
        }
        if (availableTokenBalance.toNumber() <= 0) {
          continue;
        }
        const netAmount = availableBalance
          .minus(nearUtils.convertGasUnitsToYoctoNear(MAX_GAS_LIMIT_FOR_FT_TRANSFER))
          .minus(feeReserve)
          .minus(storageReserve);
        if (netAmount.toNumber() <= 0) {
          throw new Error(
            `Found address ${i} with non-zero fund but fund is insufficient to support a token recover ` +
              `transaction. Please start the next scan at address index ${i + 1}.`
          );
        }
        return this.recoverNearToken(
          params,
          token,
          accountId,
          currPath,
          i,
          bitgoKey,
          isStorageDepositEnabled,
          availableTokenBalance,
          isUnsignedSweep
        );
      }

      // first build the unsigned txn
      const bs58EncodedPublicKey = nearAPI.utils.serialize.base_encode(new Uint8Array(Buffer.from(accountId, 'hex')));
      const { nonce, blockHash } = await this.getAccessKey({ accountId, bs58EncodedPublicKey });
      const gasPrice = await this.getGasPrice(blockHash);
      const gasPriceFirstBlock = new BigNumber(gasPrice);
      const gasPriceSecondBlock = gasPriceFirstBlock.multipliedBy(1.05);
      const totalGasRequired = new BigNumber(transferCost.sendSir)
        .plus(receiptConfig.sendSir)
        .multipliedBy(gasPriceFirstBlock)
        .plus(new BigNumber(transferCost.execution).plus(receiptConfig.execution).multipliedBy(gasPriceSecondBlock));
      // adding some padding to make sure the gas doesn't go below required gas by network
      const totalGasWithPadding = totalGasRequired.multipliedBy(1.5);
      const netAmount = availableBalance.minus(totalGasWithPadding).minus(feeReserve).minus(storageReserve);
      if (netAmount.toNumber() <= 0) {
        throw new Error(
          `Found address ${i} with non-zero fund but fund is insufficient to support a recover ` +
            `transaction. Please start the next scan at address index ${i + 1}.`
        );
      }
      const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
      const txBuilder = factory
        .getTransferBuilder()
        .sender(accountId, accountId)
        .nonce(nonce)
        .receiverId(params.recoveryDestination)
        .recentBlockHash(blockHash)
        .amount(netAmount.toFixed());
      const unsignedTransaction = (await txBuilder.build()) as Transaction;
      let serializedTx = unsignedTransaction.toBroadcastFormat();
      if (!isUnsignedSweep) {
        serializedTx = await this.signRecoveryTransaction(txBuilder, params, currPath, accountId);
      } else {
        return this.buildUnsignedSweepTransaction(
          txBuilder,
          accountId,
          params.recoveryDestination,
          bitgoKey,
          i,
          currPath,
          netAmount,
          totalGasWithPadding
        );
      }
      return { serializedTx: serializedTx, scanIndex: i };
    }
    throw new Error('Did not find an address with funds to recover');
  }

  /**
   * Function to handle near token recovery
   * @param {MPCRecoveryOptions} params mpc recovery options input
   * @param {Nep141Token} token the token object
   * @param {String} senderAddress sender address
   * @param {String} derivationPath the derivation path
   * @param {Number} idx current index
   * @param {String} bitgoKey bitgo key
   * @param {Boolean} isStorageDepositEnabled flag indicating whether storage deposit is enabled on the receiver
   * @param {BigNumber} availableTokenBalance currently available token balance on the address
   * @param {Boolean} isUnsignedSweep flag indicating whether it is an unsigned sweep
   * @returns {Promise<MPCTx | MPCSweepTxs>}
   */
  private async recoverNearToken(
    params: MPCRecoveryOptions,
    token: Nep141Token,
    senderAddress: string,
    derivationPath: string,
    idx: number,
    bitgoKey: string,
    isStorageDepositEnabled: boolean,
    availableTokenBalance: BigNumber,
    isUnsignedSweep: boolean
  ): Promise<MPCTx | MPCSweepTxs> {
    const factory = new TransactionBuilderFactory(token);
    const bs58EncodedPublicKey = nearAPI.utils.serialize.base_encode(new Uint8Array(Buffer.from(senderAddress, 'hex')));
    const { nonce, blockHash } = await this.getAccessKey({ accountId: senderAddress, bs58EncodedPublicKey });
    const txBuilder = factory
      .getFungibleTokenTransferBuilder()
      .sender(senderAddress, senderAddress)
      .nonce(nonce)
      .receiverId(token.contractAddress)
      .recentBlockHash(blockHash)
      .ftReceiverId(params.recoveryDestination)
      .gas(MAX_GAS_LIMIT_FOR_FT_TRANSFER)
      .deposit('1')
      .amount(availableTokenBalance.toString());
    if (!isStorageDepositEnabled) {
      txBuilder.addStorageDeposit({
        deposit: BigInt(token.storageDepositAmount),
        gas: BigInt(MAX_GAS_LIMIT_FOR_FT_TRANSFER),
        accountId: params.recoveryDestination,
      });
    }
    if (isUnsignedSweep) {
      return this.buildUnsignedSweepTransaction(
        txBuilder,
        senderAddress,
        params.recoveryDestination,
        bitgoKey,
        idx,
        derivationPath,
        availableTokenBalance,
        new BigNumber(nearUtils.convertGasUnitsToYoctoNear(MAX_GAS_LIMIT_FOR_FT_TRANSFER)),
        token
      );
    } else {
      const serializedTx = await this.signRecoveryTransaction(txBuilder, params, derivationPath, senderAddress);
      return { serializedTx: serializedTx, scanIndex: idx };
    }
  }

  /**
   * Function to build unsigned sweep transaction
   * @param {TransactionBuilder} txBuilder the near transaction builder
   * @param {String} senderAddress sender address
   * @param {String} receiverAddress the receiver address
   * @param {String} bitgoKey bitgo key
   * @param {Number} index current index
   * @param {String} derivationPath the derivation path
   * @param {BigNumber} netAmount net amount to be recovered
   * @param {BigNumber} netGas net gas required
   * @param {Nep141Token} token optional nep141 token instance
   * @returns {Promise<MPCSweepTxs>}
   */
  private async buildUnsignedSweepTransaction(
    txBuilder: TransactionBuilder,
    senderAddress: string,
    receiverAddress: string,
    bitgoKey: string,
    index: number,
    derivationPath: string,
    netAmount: BigNumber,
    netGas: BigNumber,
    token?: Nep141Token
  ): Promise<MPCSweepTxs> {
    const isTokenTransaction = !!token;
    const unsignedTransaction = (await txBuilder.build()) as Transaction;
    const serializedTx = unsignedTransaction.toBroadcastFormat();
    const walletCoin = isTokenTransaction ? token.name : this.getChain();
    const inputs = [
      {
        address: senderAddress,
        valueString: netAmount.toString(),
        value: netAmount.toNumber(),
      },
    ];
    const outputs = [
      {
        address: receiverAddress,
        valueString: netAmount.toString(),
        coinName: walletCoin,
      },
    ];
    const spendAmount = netAmount.toString();
    const parsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
    const feeInfo = { fee: netGas.toNumber(), feeString: netGas.toFixed() }; // Include gas fees

    const transaction: MPCTx = {
      serializedTx: serializedTx, // Serialized unsigned transaction
      scanIndex: index, // Current index in the scan
      coin: walletCoin,
      signableHex: unsignedTransaction.signablePayload.toString('hex'), // Hex payload for signing
      derivationPath: derivationPath, // Derivation path for the account
      parsedTx: parsedTx,
      feeInfo: feeInfo,
      coinSpecific: { commonKeychain: bitgoKey }, // Include block hash for NEAR
    };

    const transactions: MPCUnsignedTx[] = [{ unsignedTx: transaction, signatureShares: [] }];
    const txRequest: RecoveryTxRequest = {
      transactions: transactions,
      walletCoin: walletCoin,
    };
    return { txRequests: [txRequest] };
  }

  /**
   * Function to sign the recovery transaction
   * @param {TransactionBuilder} txBuilder the near transaction builder
   * @param {MPCRecoveryOptions} params mpc recovery options input
   * @param {String} derivationPath the derivation path
   * @param {String} senderAddress the sender address
   * @returns {Promise<String>}
   */
  private async signRecoveryTransaction(
    txBuilder: TransactionBuilder,
    params: MPCRecoveryOptions,
    derivationPath: string,
    senderAddress: string
  ): Promise<string> {
    const unsignedTransaction = (await txBuilder.build()) as Transaction;
    // Sign the txn
    /* ***************** START **************************************/
    // TODO(BG-51092): This looks like a common part which can be extracted out too
    if (!params.userKey) {
      throw new Error('missing userKey');
    }
    if (!params.backupKey) {
      throw new Error('missing backupKey');
    }
    if (!params.walletPassphrase) {
      throw new Error('missing wallet passphrase');
    }

    // Clean up whitespace from entered values
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
    /** TODO BG-52419 Implement Codec for parsing */
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
    /* ********************** END ***********************************/

    // add signature
    const signatureHex = await EDDSAMethods.getTSSSignature(
      userSigningMaterial,
      backupSigningMaterial,
      derivationPath,
      unsignedTransaction
    );
    const publicKeyObj = { pub: senderAddress };
    txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);

    const completedTransaction = await txBuilder.build();
    return completedTransaction.toBroadcastFormat();
  }

  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    const req = params.signatureShares;
    const broadcastableTransactions: MPCTx[] = [];
    let lastScanIndex = 0;

    for (let i = 0; i < req.length; i++) {
      const MPC = await EDDSAMethods.getInitializedMpcInstance();
      const transaction = req[i].txRequest.transactions[0].unsignedTx;

      // Validate signature shares
      if (!req[i].ovc || !req[i].ovc[0].eddsaSignature) {
        throw new Error('Missing signature(s)');
      }
      const signature = req[i].ovc[0].eddsaSignature;

      // Validate signable hex
      if (!transaction.signableHex) {
        throw new Error('Missing signable hex');
      }
      const messageBuffer = Buffer.from(transaction.signableHex!, 'hex');
      const result = MPC.verify(messageBuffer, signature);
      if (!result) {
        throw new Error('Invalid signature');
      }

      // Prepare the signature in hex format
      const signatureHex = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

      // Validate transaction-specific fields
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;

      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;

      // Derive account ID and sender address
      const accountId = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const txnBuilder = this.getBuilder().from(transaction.serializedTx as string);

      // Add the signature
      const nearKeyPair = new NearKeyPair({ pub: accountId });
      txnBuilder.addSignature({ pub: nearKeyPair.getKeys().pub }, signatureHex);

      // Finalize and serialize the transaction
      const signedTransaction = await txnBuilder.build();
      const serializedTx = signedTransaction.toBroadcastFormat();

      // Add the signed transaction to the list
      broadcastableTransactions.push({
        serializedTx: serializedTx,
        scanIndex: transaction.scanIndex,
      });

      // Update the last scan index if applicable
      if (i === req.length - 1 && transaction.coinSpecific!.lastScanIndex) {
        lastScanIndex = transaction.coinSpecific!.lastScanIndex as number;
      }
    }

    // Return the broadcastable transactions and the last scan index
    return { transactions: broadcastableTransactions, lastScanIndex };
  }

  /**
   * Make a request to one of the public EOS nodes available
   * @param params.payload
   */
  protected async getDataFromNode(params: { payload?: Record<string, unknown> }): Promise<request.Response> {
    const nodeUrls = this.getPublicNodeUrls();
    for (const nodeUrl of nodeUrls) {
      try {
        return await request.post(nodeUrl).send(params.payload);
      } catch (e) {
        console.debug(e);
      }
    }
    throw new Error(`Unable to call endpoint: '/' from nodes: ${_.join(nodeUrls, ', ')}`);
  }

  protected async getAccessKey({
    accountId,
    bs58EncodedPublicKey,
  }: {
    accountId: string;
    bs58EncodedPublicKey: string;
  }): Promise<NearTxBuilderParamsFromNode> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_access_key',
          finality: 'final',
          account_id: accountId,
          public_key: bs58EncodedPublicKey,
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    const accessKey = response.body.result;
    return { nonce: accessKey.nonce + 1, blockHash: accessKey.block_hash };
  }

  protected async getAccountBalance(accountId: string, storageAmountPerByte: number): Promise<string> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_account',
          finality: 'final',
          account_id: accountId,
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Failed to query account information');
    }
    const errorCause = response.body.error?.cause.name;
    if (errorCause !== undefined) {
      throw new Error(errorCause);
    }

    const account = response.body.result;
    const costPerByte = new BigNumber(storageAmountPerByte);
    const stateStaked = new BigNumber(account.storage_usage).multipliedBy(costPerByte);
    const staked = new BigNumber(account.locked);
    const totalBalance = new BigNumber(account.amount).plus(staked);
    const availableBalance = totalBalance.minus(BigNumber.max(staked, stateStaked));
    return availableBalance.toString();
  }

  /**
   * Function to get the fungible token balance for an account
   * @param {String} accountId account for which the ft balance to be fetched
   * @param tokenContractAddress the token contract address
   * @returns {Promise<String>}
   */
  protected async getAccountFungibleTokenBalance(accountId: string, tokenContractAddress: string): Promise<string> {
    const base64Args = nearUtils.convertToBase64({ account_id: accountId });
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: tokenContractAddress,
          method_name: 'ft_balance_of',
          args_base64: base64Args,
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Failed to fetch ft balance of the account');
    }
    const errorCause = response.body.error?.cause?.name;
    if (errorCause !== undefined) {
      throw new Error(errorCause);
    }
    const resultUint8Array: Uint8Array = new Uint8Array(response.body.result.result);
    const raw = new TextDecoder().decode(resultUint8Array);
    return JSON.parse(raw);
  }

  /**
   * Function to check if storage deposit is enabled on an address for a token
   * @param {String} accountId account for which the storage balance to be fetched
   * @param tokenContractAddress the token contract address
   * @returns {Promise<Boolean>} true if we find the storage balance, false if response is null
   */
  protected async checkIfStorageDepositIsEnabled(accountId: string, tokenContractAddress: string): Promise<boolean> {
    const base64Args = nearUtils.convertToBase64({ account_id: accountId });
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: tokenContractAddress,
          method_name: 'storage_balance_of',
          args_base64: base64Args,
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Failed to fetch storage deposit of the account');
    }
    const errorCause = response.body.error?.cause?.name;
    if (errorCause !== undefined) {
      throw new Error(errorCause);
    }
    const resultUint8Array: Uint8Array = new Uint8Array(response.body.result.result);
    const raw = new TextDecoder().decode(resultUint8Array);
    const decoded = JSON.parse(raw);
    return decoded !== null;
  }

  protected async getProtocolConfig(): Promise<ProtocolConfigOutput> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'EXPERIMENTAL_protocol_config',
        params: {
          finality: 'final',
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }

    const config = response.body.result;
    const storageAmountPerByte = config.runtime_config.storage_amount_per_byte;
    const transferCostFromNetwork = config.runtime_config.transaction_costs.action_creation_config.transfer_cost;
    const transferCost: NearFeeConfig = {
      sendSir: transferCostFromNetwork.send_sir,
      sendNotSir: transferCostFromNetwork.send_not_sir,
      execution: transferCostFromNetwork.execution,
    };

    const receiptConfigFromNetwork = config.runtime_config.transaction_costs.action_receipt_creation_config;
    const receiptConfig: NearFeeConfig = {
      sendSir: receiptConfigFromNetwork.send_sir,
      sendNotSir: receiptConfigFromNetwork.send_not_sir,
      execution: receiptConfigFromNetwork.execution,
    };
    return { storageAmountPerByte, transferCost, receiptConfig };
  }

  protected async getGasPrice(blockHash: string): Promise<string> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'gas_price',
        params: [blockHash],
      },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.result.gas_price;
  }

  protected getPublicNodeUrls(): string[] {
    return Environments[this.bitgo.getEnv()].nearNodeUrls;
  }

  async parseTransaction(params: NearParseTransactionOptions): Promise<NearParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txPrebuild: params.txPrebuild,
      publicKey: params.publicKey,
      feeInfo: params.feeInfo,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    const nearTransaction = transactionExplanation as NearTransactionExplanation;
    if (nearTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = nearTransaction.outputs[0].address;
    const feeAmount = new BigNumber(nearTransaction.fee.fee === '' ? '0' : nearTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(nearTransaction.outputAmount).plus(feeAmount).toFixed(),
      },
    ];

    const outputs: TransactionOutput[] = nearTransaction.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });

    return {
      inputs,
      outputs,
    };
  }

  /**
   * Verifies if the given address belongs to a TSS wallet for NEAR.
   * For NEAR, the address is the public key directly (implicit accounts).
   *
   * @param {TssVerifyNearAddressOptions} params - Verification parameters
   * @returns {Promise<boolean>} True if address belongs to wallet
   * @throws {UnexpectedAddressError} If address doesn't match derived address
   * @throws {Error} If invalid parameters or root address verification with wrong index
   */
  async isWalletAddress(params: TssVerifyNearAddressOptions): Promise<boolean> {
    const result = await verifyEddsaTssWalletAddress(
      params,
      (address) => this.isValidAddress(address),
      (publicKey) => publicKey
    );

    if (!result) {
      throw new UnexpectedAddressError(`address validation failure`);
    }

    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams, wallet } = params;
    const transaction = new Transaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(rawTx);
    const explainedTx = transaction.explainTransaction();

    // users do not input recipients for consolidation requests as they are generated by the server
    if (txParams.type === 'enabletoken' && params.verification?.verifyTokenEnablement) {
      this.validateTokenEnablementTransaction(transaction, explainedTx, txParams);
    }

    if (txParams.recipients !== undefined) {
      if (txParams.type === 'enabletoken') {
        const tokenName = explainedTx.outputs[0].tokenName;
        if (tokenName) {
          const nepToken = nearUtils.getTokenInstanceFromTokenName(tokenName);
          if (nepToken) {
            explainedTx.outputs.forEach((output) => {
              if (output.amount !== nepToken.storageDepositAmount) {
                throw new Error('Storage deposit amount not matching!');
              }
            });
          }
        }
      }

      const filteredRecipients = txParams.recipients?.map((recipient) => {
        if (txParams.type !== 'enabletoken') {
          return _.pick(recipient, ['address', 'amount']);
        } else {
          return _.pick(recipient, ['address', 'tokenName']);
        }
      });
      const filteredOutputs = explainedTx.outputs.map((output) => {
        if (txParams.type !== 'enabletoken') {
          return _.pick(output, ['address', 'amount']);
        } else {
          return _.pick(output, ['address', 'tokenName']);
        }
      });

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        // For enabletoken, provide more specific error messages for address mismatches
        if (txParams.type === 'enabletoken' && params.verification?.verifyTokenEnablement) {
          const mismatchedAddresses = txParams.recipients
            ?.filter(
              (recipient, index) => !filteredOutputs[index] || recipient.address !== filteredOutputs[index].address
            )
            .map((recipient) => recipient.address);

          if (mismatchedAddresses && mismatchedAddresses.length > 0) {
            throw new Error(`Address mismatch: ${mismatchedAddresses.join(', ')}`);
          }
        }
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipients of txParams.recipients) {
        totalAmount = txParams.type !== 'enabletoken' ? totalAmount.plus(recipients.amount) : BigNumber(0);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount) && txParams.type !== 'enabletoken') {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }

    if (params.verification?.consolidationToBaseAddress) {
      if (!wallet?.coinSpecific()?.rootAddress) {
        throw new Error('Unable to determine base address for consolidation');
      }
      await this.verifyConsolidationToBaseAddress(explainedTx, wallet.coinSpecific()?.rootAddress as string);
    }

    return true;
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  auditDecryptedKey({ prv, publicKey, multiSigType }: AuditDecryptedKeyParams) {
    if (multiSigType !== 'tss') {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }

  /**
   * Validates a token enablement transaction by performing checks
   * for NEAR protocol compliance and ensuring txParams matches transaction data.
   *
   * @param transaction - The NEAR transaction object to validate
   * @param explainedTx - The same transaction data in explained format with parsed outputs and metadata
   * @param txParams - The transaction parameters containing recipients and configuration
   * @throws {Error} When any validation check fails, with descriptive error messages
   * @private
   */
  private validateTokenEnablementTransaction(
    transaction: Transaction,
    explainedTx: TransactionExplanation,
    txParams: TransactionParams
  ): void {
    const transactionData = transaction.toJson();
    this.validateTxType(txParams, explainedTx);
    this.validateSigner(transactionData);
    this.validateRawReceiver(transactionData, txParams);
    this.validatePublicKey(transactionData);
    this.validateRawActions(transactionData, txParams);
    this.validateBeneficiary(explainedTx, txParams);
    this.validateTokenOutput(explainedTx, txParams);
  }

  // Validates that the signer ID exists in the transaction
  private validateSigner(transactionData: TxData): void {
    if (!transactionData.signerId) {
      throw new Error('Error on token enablements: missing signer ID in transaction');
    }
  }

  private validateBeneficiary(explainedTx: TransactionExplanation, txParams: TransactionParams): void {
    if (!explainedTx.outputs || explainedTx.outputs.length === 0) {
      throw new Error('Error on token enablements: transaction has no outputs to validate beneficiary');
    }

    // NEAR token enablements only support a single recipient
    if (!txParams.recipients || txParams.recipients.length === 0) {
      throw new Error('Error on token enablements: missing recipients in transaction parameters');
    }

    if (txParams.recipients.length !== 1) {
      throw new Error('Error on token enablements: token enablement only supports a single recipient');
    }

    if (explainedTx.outputs.length !== 1) {
      throw new Error('Error on token enablements: transaction must have exactly 1 output');
    }

    const output = explainedTx.outputs[0];
    const recipient = txParams.recipients[0];

    if (!recipient?.address) {
      throw new Error('Error on token enablements: missing beneficiary address in transaction parameters');
    }

    if (output.address !== recipient.address) {
      throw new Error('Error on token enablements: transaction beneficiary mismatch with user expectation');
    }
  }

  // Validates that the raw transaction receiverId matches the expected token contract
  private validateRawReceiver(transactionData: TxData, txParams: TransactionParams): void {
    if (!transactionData.receiverId) {
      throw new Error('Error on token enablements: missing receiver ID in transaction');
    }

    const recipient = txParams.recipients?.[0];
    if (!recipient?.tokenName) {
      throw new Error('Error on token enablements: missing token name in transaction parameters');
    }

    const tokenInstance = nearUtils.getTokenInstanceFromTokenName(recipient.tokenName);
    if (!tokenInstance) {
      throw new Error(`Error on token enablements: unknown token '${recipient.tokenName}'`);
    }

    if (transactionData.receiverId !== tokenInstance.contractAddress) {
      throw new Error(
        `Error on token enablements: receiver contract mismatch - expected '${tokenInstance.contractAddress}', got '${transactionData.receiverId}'`
      );
    }
  }

  // Validates token output information from explained transaction
  private validateTokenOutput(explainedTx: TransactionExplanation, txParams: TransactionParams): void {
    if (!explainedTx.outputs || explainedTx.outputs.length !== 1) {
      throw new Error('Error on token enablements: transaction must have exactly 1 output');
    }

    const output = explainedTx.outputs[0];
    const recipient = txParams.recipients?.[0];

    if (!output.tokenName) {
      throw new Error('Error on token enablements: missing token name in transaction output');
    }

    const tokenInstance = nearUtils.getTokenInstanceFromTokenName(output.tokenName);
    if (!tokenInstance) {
      throw new Error(`Error on token enablements: unknown token '${output.tokenName}'`);
    }

    if (recipient?.tokenName && recipient.tokenName !== output.tokenName) {
      throw new Error(
        `Error on token enablements: token mismatch - user expects '${recipient.tokenName}', transaction has '${output.tokenName}'`
      );
    }
  }

  private validatePublicKey(transactionData: TxData): void {
    if (!transactionData.publicKey) {
      throw new Error('Error on token enablements: missing public key in transaction');
    }

    // Validate ed25519 format: "ed25519:base58_encoded_key"
    if (!transactionData.publicKey.startsWith('ed25519:')) {
      throw new Error('Error on token enablements: unsupported key type, expected ed25519');
    }

    const base58Part = transactionData.publicKey.substring(8);
    if (!this.isValidPub(base58Part)) {
      throw new Error('Error on token enablements: invalid public key format');
    }
  }

  // Validates the raw transaction actions according to NEAR protocol spec
  private validateRawActions(transactionData: TxData, txParams: TransactionParams): void {
    // Must have exactly 1 action (NEAR spec requirement)
    if (!transactionData.actions || transactionData.actions.length !== 1) {
      throw new Error('Error on token enablements: must have exactly 1 action');
    }

    const action = transactionData.actions[0];

    // Must be a functionCall action (not transfer)
    if (!action.functionCall) {
      throw new Error('Error on token enablements: action must be a function call');
    }

    // Must be storage_deposit method (NEAR spec requirement)
    if (action.functionCall.methodName !== 'storage_deposit') {
      throw new Error(
        `Error on token enablements: invalid method '${action.functionCall.methodName}', expected '${STORAGE_DEPOSIT}'`
      );
    }

    // Validate args structure (should be JSON object)
    if (!action.functionCall.args || typeof action.functionCall.args !== 'object') {
      throw new Error('Error on token enablements: invalid or missing function call arguments');
    }

    // Validate deposit exists and is valid
    if (!action.functionCall.deposit) {
      throw new Error('Error on token enablements: missing deposit in function call');
    }

    const depositAmount = new BigNumber(action.functionCall.deposit);
    if (depositAmount.isNaN() || depositAmount.isLessThan(0)) {
      throw new Error('Error on token enablements: invalid deposit amount in function call');
    }

    // Validate gas exists and is valid
    if (!action.functionCall.gas) {
      throw new Error('Error on token enablements: missing gas in function call');
    }

    const gasAmount = new BigNumber(action.functionCall.gas);
    if (gasAmount.isNaN() || gasAmount.isLessThan(0)) {
      throw new Error('Error on token enablements: invalid gas amount in function call');
    }

    // Validate deposit amount against expected storage deposit (merged from validateActions)
    const recipient = txParams.recipients?.[0];
    if (recipient?.tokenName) {
      const tokenInstance = nearUtils.getTokenInstanceFromTokenName(recipient.tokenName);
      if (tokenInstance?.storageDepositAmount && action.functionCall.deposit !== tokenInstance.storageDepositAmount) {
        throw new Error(
          `Error on token enablements: deposit amount ${action.functionCall.deposit} does not match expected storage deposit ${tokenInstance.storageDepositAmount}`
        );
      }
    }

    // Validate user-specified amount matches deposit (merged from validateActions)
    if (
      recipient?.amount !== undefined &&
      recipient.amount !== '0' &&
      recipient.amount !== action.functionCall.deposit
    ) {
      throw new Error(
        `Error on token enablements: user specified amount '${recipient.amount}' does not match storage deposit '${action.functionCall.deposit}'`
      );
    }
  }

  private validateTxType(txParams: TransactionParams, explainedTx: TransactionExplanation): void {
    const expectedType = TransactionType.StorageDeposit;
    const actualType = explainedTx.type;

    if (actualType !== expectedType) {
      throw new Error(`Invalid transaction type on token enablement: expected "${expectedType}", got "${actualType}".`);
    }
  }

  protected async verifyConsolidationToBaseAddress(
    explainedTx: TransactionExplanation,
    baseAddress: string
  ): Promise<void> {
    for (const output of explainedTx.outputs) {
      if (output.address !== baseAddress) {
        throw new Error('tx outputs does not match with expected address');
      }
    }
  }
}
