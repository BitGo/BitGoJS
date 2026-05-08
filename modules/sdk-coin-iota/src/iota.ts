import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  EDDSAMethods,
  EDDSAMethodTypes,
  Environments,
  KeyPair,
  MPCAlgorithm,
  MPCConsolidationRecoveryOptions,
  MPCRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCTxs,
  MPCType,
  MPCUnsignedTx,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
  RecoveryTxRequest,
  SignedTransaction,
  SignTransactionOptions,
  TransactionRecipient,
  TransactionType,
  TssVerifyAddressOptions,
  verifyEddsaTssWalletAddress,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import utils from './lib/utils';
import { KeyPair as IotaKeyPair, Transaction, TransactionBuilder, TransactionBuilderFactory } from './lib';
import { auditEddsaPrivateKey, getDerivationPath } from '@bitgo/sdk-lib-mpc';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {
  ExplainTransactionOptions,
  IotaParseTransactionOptions,
  TransactionExplanation,
  TransferTxData,
  TransactionObjectInput,
} from './lib/iface';
import { TransferTransaction } from './lib/transferTransaction';
import {
  DEFAULT_GAS_OVERHEAD,
  DEFAULT_SCAN_FACTOR,
  MAX_GAS_BUDGET,
  MAX_GAS_OBJECTS,
  MAX_OBJECT_LIMIT,
} from './lib/constants';

export interface IotaRecoveryOptions extends MPCRecoveryOptions {
  fullnodeRpcUrl?: string; // Override default RPC URL
}

interface IotaObjectWithBalance extends TransactionObjectInput {
  balance: string;
}

/**
 * IOTA coin implementation.
 * Supports TSS (Threshold Signature Scheme) with EDDSA algorithm.
 */
export class Iota extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  /**
   * Factory method to create an IOTA coin instance.
   */
  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Iota(bitgo, staticsCoin);
  }

  // ========================================
  // Coin Configuration Methods
  // ========================================

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
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

  // ========================================
  // Multi-Signature and TSS Support
  // ========================================

  supportsTss(): boolean {
    return true;
  }

  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return MPCType.EDDSA;
  }

  // ========================================
  // Address and Public Key Validation
  // ========================================

  /**
   * Validates an IOTA address.
   * @param address - The address to validate (64-character hex string)
   * @returns true if the address is valid
   */
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  /**
   * Validates a public key.
   * @param pub - The public key to validate
   * @returns true if the public key is valid
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Verifies if an address belongs to a TSS wallet.
   * @param params - Verification parameters including wallet address and user/backup public keys
   * @returns true if the address belongs to the wallet
   */
  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    return verifyEddsaTssWalletAddress(
      params,
      (address) => this.isValidAddress(address),
      (publicKey) => utils.getAddressFromPublicKey(publicKey)
    );
  }

  // ========================================
  // Transaction Explanation and Verification
  // ========================================

  /**
   * Explains a transaction by parsing its hex representation.
   * @param params - Parameters containing the transaction hex
   * @returns Detailed explanation of the transaction
   * @throws Error if txHex is missing or transaction cannot be explained
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const rawTx = this.validateAndExtractTxHex(params.txHex, 'explain');
    const transaction = await this.rebuildTransaction(rawTx);
    return transaction.explainTransaction();
  }

  /**
   * Verifies that a transaction prebuild matches the original transaction parameters.
   * Ensures recipients and amounts align with the intended transaction.
   *
   * @param params - Verification parameters containing prebuild and original params
   * @returns true if verification succeeds
   * @throws Error if verification fails
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild, txParams } = params;
    const rawTx = this.validateAndExtractTxHex(txPrebuild.txHex, 'verify');

    const transaction = await this.rebuildTransaction(rawTx);
    this.validateTransactionType(transaction);

    if (txParams.recipients !== undefined) {
      this.verifyTransactionRecipients(transaction as TransferTransaction, txParams.recipients);
    }

    return true;
  }

  /**
   * Parses a transaction and extracts inputs, outputs, and fees.
   * @param params - Parameters containing the transaction hex
   * @returns Parsed transaction with inputs, outputs, and fee information
   */
  async parseTransaction(params: IotaParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });

    if (!transactionExplanation || transactionExplanation.outputs.length === 0) {
      return this.createEmptyParsedTransaction();
    }

    const fee = this.calculateTransactionFee(transactionExplanation);
    const inputs = this.buildTransactionInputs(transactionExplanation, fee);
    const outputs = this.buildTransactionOutputs(transactionExplanation);

    return { inputs, outputs, fee };
  }

  // ========================================
  // Key Generation and Signing
  // ========================================

  /**
   * Generates a key pair for IOTA transactions.
   * @param seed - Optional seed to generate deterministic key pair
   * @returns Key pair with public and private keys
   * @throws Error if private key generation fails
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new IotaKeyPair({ seed }) : new IotaKeyPair();
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
   * Signs a transaction (not implemented for IOTA).
   * IOTA transactions are signed externally using TSS.
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Audits a decrypted private key to ensure it's valid for the given public key.
   * @param params - Parameters containing multiSigType, private key, and public key
   * @throws Error if multiSigType is not TSS or if key validation fails
   */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== multisigTypes.tss) {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }

  /**
   * Extracts the signable payload from a serialized transaction.
   * @param serializedTx - The serialized transaction hex
   * @returns Buffer containing the signable payload
   */
  async getSignablePayload(serializedTx: string): Promise<Buffer> {
    const rebuiltTransaction = await this.rebuildTransaction(serializedTx);
    return rebuiltTransaction.signablePayload;
  }

  /**
   * @inheritDoc
   */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Sets coin-specific fields in the transaction intent.
   * @param intent - The populated intent object to modify
   * @param params - Parameters containing unspents data
   */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    intent.unspents = params.unspents;
  }

  /**
   * Builds funds recovery transaction(s) without BitGo
   *
   * @param {IotaRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {MPCTx | MPCSweepTxs} array of the serialized transaction hex strings and indices
   * of the addresses being swept
   */
  async recover(params: IotaRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('Missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid recoveryDestination address');
    }

    const startIdx = utils.getSafeNumber(0, 'Invalid starting index to scan for addresses', params.startingScanIndex);
    const numIterations = utils.getSafeNumber(DEFAULT_SCAN_FACTOR, 'Invalid scanning factor', params.scan);
    const endIdx = startIdx + numIterations;
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    for (let idx = startIdx; idx < endIdx; idx++) {
      const derivationPath = (params.seed ? getDerivationPath(params.seed) : 'm') + `/${idx}`;
      const derivedPublicKey = MPC.deriveUnhardened(bitgoKey, derivationPath).slice(0, 64);
      const senderAddress = utils.getAddressFromPublicKey(derivedPublicKey);

      // Token recovery path: recover the token provided by user
      if (params.tokenContractAddress) {
        if (!(await this.hasTokenBalance(senderAddress, params))) {
          continue;
        }

        let tokenObjects: IotaObjectWithBalance[];
        try {
          tokenObjects = await this.fetchOwnedObjects(
            senderAddress,
            params.fullnodeRpcUrl,
            params.tokenContractAddress
          );
        } catch (e) {
          continue;
        }

        if (tokenObjects.length === 0) {
          continue;
        }

        try {
          return await this.recoverIotaToken(
            params,
            tokenObjects,
            senderAddress,
            derivationPath,
            derivedPublicKey,
            idx,
            bitgoKey
          );
        } catch (e) {
          continue;
        }
      }

      let ownedObjects: IotaObjectWithBalance[];
      try {
        ownedObjects = await this.fetchOwnedObjects(senderAddress, params.fullnodeRpcUrl);
      } catch (e) {
        continue;
      }

      if (ownedObjects.length === 0) {
        continue;
      }

      // Cap objects to prevent oversized transactions (IOTA max tx size = 128 KiB)
      if (ownedObjects.length > MAX_GAS_OBJECTS) {
        ownedObjects = ownedObjects
          .sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1))
          .slice(0, MAX_GAS_OBJECTS);
      }

      const { gasBudget, gasPrice, gasObjects, totalBalance } = await this.prepareGasAndObjects(
        ownedObjects,
        senderAddress,
        params
      );

      const netBalance = totalBalance - BigInt(gasBudget);

      if (netBalance <= 0n) {
        continue;
      }
      const recoveryAmount = netBalance.toString();

      const factory = this.getTxBuilderFactory();
      const txBuilder = factory.getTransferBuilder();

      txBuilder
        .sender(senderAddress)
        .recipients([{ address: params.recoveryDestination, amount: recoveryAmount }])
        .gasData({ gasBudget, gasPrice, gasPaymentObjects: gasObjects });

      // Return unsigned transaction for cold/custody wallets
      const isUnsignedSweep = !params.walletPassphrase;
      if (isUnsignedSweep) {
        return this.buildUnsignedSweepTransaction(txBuilder, senderAddress, bitgoKey, idx, derivationPath);
      }

      // Build transaction for signing
      const unsignedTx = (await txBuilder.build()) as TransferTransaction;

      // Sign the transaction with decrypted keys
      const fullSignatureBase64 = await this.signRecoveryTransaction(
        txBuilder,
        params,
        derivationPath,
        derivedPublicKey,
        unsignedTx
      );

      // Build and return signed transaction
      const finalTx = (await txBuilder.build()) as TransferTransaction;
      const serializedTx = await finalTx.toBroadcastFormat();

      return {
        transactions: [
          {
            scanIndex: idx,
            recoveryAmount,
            serializedTx,
            signature: fullSignatureBase64,
            coin: this.getChain(),
          },
        ],
        lastScanIndex: idx,
      };
    }

    throw new Error(
      `Did not find an address with sufficient funds to recover. ` +
        `Scanned addresses from index ${startIdx} to ${endIdx - 1}. ` +
        `Please start the next scan at address index ${endIdx}.`
    );
  }

  /**
   * Checks whether the address holds a positive balance of the specified token.
   */
  private async hasTokenBalance(senderAddress: string, params: IotaRecoveryOptions): Promise<boolean> {
    try {
      const balance = await this.getBalance(senderAddress, params.fullnodeRpcUrl, params.tokenContractAddress);
      return balance > 0n;
    } catch (e) {
      return false;
    }
  }

  /**
   * Consolidates funds from multiple receive addresses to the base address (index 0).
   * If walletPassphrase is not provided, returns unsigned transactions for offline signing
   * (cold/custody wallet recovery). Otherwise, returns signed transactions.
   *
   * @param params - Consolidation recovery parameters
   * @param params.bitgoKey - The commonKeychain (combined TSS public key)
   * @param params.startingScanIndex - Starting address index to scan (default: 1)
   * @param params.endingScanIndex - Ending address index to scan (default: startingScanIndex + 20)
   * @param params.walletPassphrase - Optional passphrase for signing (omit for unsigned transactions)
   * @returns MPCTxs (signed) or MPCSweepTxs (unsigned) containing all consolidation transactions
   * @throws Error if no addresses with funds are found in the scan range
   */
  async recoverConsolidations(params: MPCConsolidationRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
    const isUnsignedSweep = !params.walletPassphrase;

    const startIdx = utils.getSafeNumber(1, 'Invalid starting index to scan for addresses', params.startingScanIndex);
    const endIdx = utils.getSafeNumber(
      startIdx + DEFAULT_SCAN_FACTOR,
      'Invalid ending index to scan for addresses',
      params.endingScanIndex
    );

    if (startIdx < 1 || endIdx <= startIdx || endIdx - startIdx > 10 * DEFAULT_SCAN_FACTOR) {
      throw new Error(
        `Invalid starting or ending index to scan for addresses. startingScanIndex: ${startIdx}, endingScanIndex: ${endIdx}.`
      );
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    const basePath = (params.seed ? getDerivationPath(params.seed) : 'm') + '/0';
    const derivedBasePublicKey = MPC.deriveUnhardened(bitgoKey, basePath).slice(0, 64);
    const baseAddress = utils.getAddressFromPublicKey(derivedBasePublicKey);

    const consolidationTransactions: any[] = [];
    let lastScanIndex = startIdx;

    for (let idx = startIdx; idx < endIdx; idx++) {
      const recoverParams: IotaRecoveryOptions = {
        userKey: params.userKey,
        backupKey: params.backupKey,
        bitgoKey: params.bitgoKey,
        walletPassphrase: params.walletPassphrase,
        seed: params.seed,
        tokenContractAddress: params.tokenContractAddress,
        recoveryDestination: baseAddress, // Consolidate to base address
        startingScanIndex: idx,
        scan: 1,
      };

      let recoveryTransaction: MPCTxs | MPCSweepTxs;
      try {
        recoveryTransaction = await this.recover(recoverParams);
      } catch (e) {
        if ((e as Error).message.startsWith('Did not find an address with sufficient funds to recover.')) {
          lastScanIndex = idx;
          continue;
        }
        throw e;
      }

      if (isUnsignedSweep) {
        consolidationTransactions.push((recoveryTransaction as MPCSweepTxs).txRequests[0]);
      } else {
        consolidationTransactions.push((recoveryTransaction as MPCTxs).transactions[0]);
      }
      lastScanIndex = idx;
    }

    if (consolidationTransactions.length === 0) {
      throw new Error(
        `Did not find an address with sufficient funds to recover. Please start the next scan at address index ${
          lastScanIndex + 1
        }.`
      );
    }

    if (isUnsignedSweep) {
      consolidationTransactions[
        consolidationTransactions.length - 1
      ].transactions[0].unsignedTx.coinSpecific.lastScanIndex = lastScanIndex;
      return { txRequests: consolidationTransactions };
    }

    return { transactions: consolidationTransactions, lastScanIndex };
  }

  /**
   * Gets the total coin balance for an address.
   *
   * @param address - IOTA address to query
   * @param rpcUrl - Optional RPC URL override
   * @param coinType - Optional coin type (defaults to native IOTA)
   * @returns Total balance as a bigint
   */
  private async getBalance(address: string, rpcUrl?: string, coinType?: string): Promise<bigint> {
    const url = rpcUrl || this.getPublicNodeUrl();
    const normalizedCoinType = coinType || this.getNativeCoinType();
    const response = await this.makeRpcCall(url, 'iotax_getBalance', [address, normalizedCoinType]);
    return BigInt(response.totalBalance);
  }

  /**
   * Fetches owned objects for an address via fullnode RPC.
   * Handles pagination to retrieve all objects.
   *
   * @param address - IOTA address to query
   * @param rpcUrl - Optional RPC URL override
   * @param coinType - Optional coin type to filter objects (defaults to native IOTA)
   * @returns Array of owned objects with balance information
   */
  private async fetchOwnedObjects(
    address: string,
    rpcUrl?: string,
    coinType?: string
  ): Promise<IotaObjectWithBalance[]> {
    const url = rpcUrl || this.getPublicNodeUrl();
    const allObjects: IotaObjectWithBalance[] = [];
    const innerCoinType = coinType || this.getNativeCoinType();
    const structType = `0x2::coin::Coin<${innerCoinType}>`;
    let cursor: string | null = null;
    let hasNextPage = true;
    const MAX_PAGES = 500;
    let pageCount = 0;
    while (hasNextPage && pageCount < MAX_PAGES) {
      pageCount++;
      const query = {
        filter: { StructType: structType },
        options: { showContent: true, showType: true },
      };

      const response = await this.makeRpcCall(url, 'iotax_getOwnedObjects', [address, query, cursor, 50]);
      const { data, nextCursor, hasNextPage: more } = response;

      for (const item of data || []) {
        const { objectId, version, digest } = item.data;
        const balance = item.data.content?.fields?.balance || '0';
        if (BigInt(balance) > 0n) {
          allObjects.push({ objectId, version: version.toString(), digest, balance });
        }
      }

      if (nextCursor === cursor) {
        break;
      }
      hasNextPage = more;
      cursor = nextCursor;
    }

    if (pageCount >= MAX_PAGES) {
      console.warn(`fetchOwnedObjects: Hit max page limit (${MAX_PAGES}) for ${address}`);
    }
    return allObjects;
  }

  /**
   * Makes JSON-RPC call to IOTA fullnode.
   *
   * @param url - Fullnode RPC URL
   * @param method - RPC method name
   * @param params - RPC parameters
   * @returns RPC result
   * @throws Error if RPC call fails
   */
  private async makeRpcCall(url: string, method: string, params: any[]): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC call failed with status ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(`RPC error: ${json.error.message || JSON.stringify(json.error)}`);
    }

    return json.result;
  }

  /**
   * Gets the public node RPC URL from the centralized environment configuration.
   *
   * @returns RPC URL for the current BitGo environment
   */
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].iotaNodeUrl;
  }

  /**
   * Gets the native coin type identifier for filtering owned objects.
   *
   * @returns Native coin type string
   */
  private getNativeCoinType(): string {
    return '0x2::iota::IOTA';
  }

  /**
   * Prepares gas configuration for a recovery transaction.
   *
   * Gas estimation is done via a dry-run of a temporary transaction, then
   * multiplied by DEFAULT_GAS_OVERHEAD (1.1x) as a safety buffer.
   *
   * @param ownedObjects - Native IOTA coin objects to use as gas payment
   * @param senderAddress - Sender address for the transaction
   * @param params - Recovery parameters (includes recoveryDestination, rpcUrl)
   * @param paymentObjects - Optional token objects for token recovery
   * @returns Gas budget, gas price, gas objects array, and total native balance
   */
  private async prepareGasAndObjects(
    ownedObjects: IotaObjectWithBalance[],
    senderAddress: string,
    params: IotaRecoveryOptions,
    paymentObjects?: TransactionObjectInput[]
  ): Promise<{
    gasBudget: number;
    gasPrice: number;
    gasObjects: TransactionObjectInput[];
    totalBalance: bigint;
  }> {
    const gasObjects: TransactionObjectInput[] = ownedObjects.map((obj) => ({
      objectId: obj.objectId,
      version: obj.version,
      digest: obj.digest,
    }));
    const totalBalance = ownedObjects.reduce((sum, obj) => sum + BigInt(obj.balance), 0n);

    const gasPrice = await this.fetchGasPrice(params.fullnodeRpcUrl);

    // Build temp transaction for estimation
    const factory = this.getTxBuilderFactory();
    const tempBuilder = factory.getTransferBuilder();
    const estimationAmount = totalBalance > 0n ? '1' : '0';

    tempBuilder.sender(senderAddress).recipients([{ address: params.recoveryDestination, amount: estimationAmount }]);

    if (paymentObjects && paymentObjects.length > 0) {
      tempBuilder.paymentObjects(paymentObjects);
    } else {
      tempBuilder.paymentObjects(gasObjects);
    }

    const tempTx = await tempBuilder.build();
    const estimatedGas = await this.estimateGas(await tempTx.toBroadcastFormat(), params.fullnodeRpcUrl);
    const gasBudget = Math.min(MAX_GAS_BUDGET, Math.trunc(estimatedGas * DEFAULT_GAS_OVERHEAD));

    return { gasBudget, gasPrice, gasObjects, totalBalance };
  }

  private async recoverIotaToken(
    params: IotaRecoveryOptions,
    tokenObjectsWithBalance: IotaObjectWithBalance[],
    senderAddress: string,
    derivationPath: string,
    derivedPublicKey: string,
    idx: number,
    bitgoKey: string
  ): Promise<MPCTxs | MPCSweepTxs> {
    tokenObjectsWithBalance = tokenObjectsWithBalance.sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));
    if (tokenObjectsWithBalance.length > MAX_OBJECT_LIMIT) {
      tokenObjectsWithBalance = tokenObjectsWithBalance.slice(0, MAX_OBJECT_LIMIT);
    }

    const tokenObjects: TransactionObjectInput[] = tokenObjectsWithBalance.map((obj) => ({
      objectId: obj.objectId,
      version: obj.version,
      digest: obj.digest,
    }));
    const tokenBalance = tokenObjectsWithBalance.reduce((sum, obj) => sum + BigInt(obj.balance), 0n);
    if (tokenBalance <= 0n) {
      throw new Error('Token balance is zero');
    }

    let gasObjectsWithBalance: IotaObjectWithBalance[];
    try {
      gasObjectsWithBalance = await this.fetchOwnedObjects(senderAddress, params.fullnodeRpcUrl);
    } catch (e) {
      throw new Error('Failed to fetch gas objects for token recovery');
    }
    if (gasObjectsWithBalance.length === 0) {
      throw new Error('No gas objects found for token recovery');
    }

    gasObjectsWithBalance = gasObjectsWithBalance.sort((a, b) => (BigInt(b.balance) > BigInt(a.balance) ? 1 : -1));
    if (gasObjectsWithBalance.length >= MAX_GAS_OBJECTS) {
      gasObjectsWithBalance = gasObjectsWithBalance.slice(0, MAX_GAS_OBJECTS - 1);
    }

    const { gasBudget, gasPrice, gasObjects, totalBalance } = await this.prepareGasAndObjects(
      gasObjectsWithBalance,
      senderAddress,
      params,
      tokenObjects
    );
    const netGasBalance = totalBalance - BigInt(gasBudget);
    if (netGasBalance <= 0n) {
      throw new Error('Insufficient gas balance for token recovery');
    }

    const recoveryAmount = tokenBalance.toString();
    const factory = this.getTxBuilderFactory();
    const txBuilder = factory.getTransferBuilder();

    txBuilder
      .sender(senderAddress)
      .recipients([{ address: params.recoveryDestination, amount: recoveryAmount }])
      .paymentObjects(tokenObjects)
      .gasData({ gasBudget, gasPrice, gasPaymentObjects: gasObjects });

    const isUnsignedSweep = !params.walletPassphrase;
    const tokenCoin = params.tokenContractAddress || this.getChain();

    if (isUnsignedSweep) {
      return this.buildUnsignedSweepTransaction(
        txBuilder,
        senderAddress,
        bitgoKey,
        idx,
        derivationPath,
        params.tokenContractAddress
      );
    }

    const unsignedTx = (await txBuilder.build()) as TransferTransaction;

    const fullSignatureBase64 = await this.signRecoveryTransaction(
      txBuilder,
      params,
      derivationPath,
      derivedPublicKey,
      unsignedTx
    );

    const finalTx = (await txBuilder.build()) as TransferTransaction;
    const serializedTx = await finalTx.toBroadcastFormat();

    return {
      transactions: [
        {
          scanIndex: idx,
          recoveryAmount,
          serializedTx,
          signature: fullSignatureBase64,
          coin: tokenCoin,
        },
      ],
      lastScanIndex: idx,
    };
  }

  private async signRecoveryTransaction(
    txBuilder: TransactionBuilder,
    params: IotaRecoveryOptions,
    derivationPath: string,
    derivedPublicKey: string,
    unsignedTx: TransferTransaction
  ): Promise<string> {
    if (!params.userKey) {
      throw new Error('missing userKey');
    }
    if (!params.backupKey) {
      throw new Error('missing backupKey');
    }
    if (!params.walletPassphrase) {
      throw new Error('missing wallet passphrase');
    }

    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    // Decrypt private keys from KeyCard values
    let userPrv: string;
    try {
      userPrv = this.bitgo.decrypt({ input: userKey, password: params.walletPassphrase });
    } catch (e) {
      throw new Error(`Error decrypting user keychain: ${(e as Error).message}`);
    }
    const userSigningMaterial = JSON.parse(userPrv) as EDDSAMethodTypes.UserSigningMaterial;

    let backupPrv: string;
    try {
      backupPrv = this.bitgo.decrypt({ input: backupKey, password: params.walletPassphrase });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${(e as Error).message}`);
    }
    const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;

    // Generate TSS signature
    const signatureBuffer = await EDDSAMethods.getTSSSignature(
      userSigningMaterial,
      backupSigningMaterial,
      derivationPath,
      unsignedTx
    );

    // Build full signature: scheme_flag (1 byte) + signature (64 bytes) + public_key (32 bytes)
    const schemeFlag = Buffer.alloc(1, 0x00); // Ed25519 scheme
    const publicKeyBytes = Buffer.from(derivedPublicKey, 'hex');
    const fullSignature = Buffer.concat([schemeFlag, signatureBuffer, publicKeyBytes]);

    txBuilder.addSignature({ pub: derivedPublicKey }, signatureBuffer);

    return fullSignature.toString('base64');
  }

  /**
   * Fetches current reference gas price from fullnode.
   *
   * @param rpcUrl - Optional RPC URL override
   * @returns Current gas price
   */
  private async fetchGasPrice(rpcUrl?: string): Promise<number> {
    const url = rpcUrl || this.getPublicNodeUrl();
    const result = await this.makeRpcCall(url, 'iotax_getReferenceGasPrice', []);
    return parseInt(result, 10);
  }

  /**
   * Estimates gas for a transaction via dry run.
   *
   * @param txBase64 - Transaction in base64 format
   * @param rpcUrl - Optional RPC URL override
   * @returns Estimated gas cost
   */
  private async estimateGas(txBase64: string, rpcUrl?: string): Promise<number> {
    const url = rpcUrl || this.getPublicNodeUrl();
    const result = await this.makeRpcCall(url, 'iota_dryRunTransactionBlock', [txBase64]);

    const computationCost = parseInt(result.effects.gasUsed.computationCost, 10);
    const storageCost = parseInt(result.effects.gasUsed.storageCost, 10);
    const storageRebate = parseInt(result.effects.gasUsed.storageRebate, 10);

    return Math.max(computationCost + storageCost - storageRebate, computationCost);
  }

  private async buildUnsignedSweepTransaction(
    txBuilder: TransactionBuilder,
    senderAddress: string,
    bitgoKey: string,
    scanIndex: number,
    derivationPath: string,
    tokenContractAddress?: string
  ): Promise<MPCSweepTxs> {
    const unsignedTransaction = (await txBuilder.build()) as TransferTransaction;
    const serializedTx = await unsignedTransaction.toBroadcastFormat();
    const serializedTxHex = Buffer.from(serializedTx, 'base64').toString('hex');
    const parsedTx = await this.parseTransaction({ txHex: serializedTxHex });
    const walletCoin = tokenContractAddress || this.getChain();
    const parsedOutputs = parsedTx.outputs as Array<{ address: string; amount: string }>;
    const output = parsedOutputs[0];

    // Build parsed transaction structure from parsed data
    const inputs = [
      {
        address: senderAddress,
        valueString: output.amount,
        value: new BigNumber(output.amount),
      },
    ];
    const outputs = [
      {
        address: output.address,
        valueString: output.amount,
        coinName: walletCoin,
      },
    ];

    const completedParsedTx = {
      inputs: inputs,
      outputs: outputs,
      spendAmount: output.amount,
      type: TransactionType.Send,
    };

    const fee = parsedTx.fee as BigNumber;
    const feeInfo = { fee: fee.toNumber(), feeString: fee.toString() };
    const coinSpecific = { commonKeychain: bitgoKey };

    const transaction: MPCTx = {
      serializedTx: serializedTxHex,
      scanIndex,
      coin: walletCoin,
      signableHex: unsignedTransaction.signablePayload.toString('hex'),
      derivationPath,
      parsedTx: completedParsedTx,
      feeInfo: feeInfo,
      coinSpecific: coinSpecific,
    };

    const unsignedTxWrapper: MPCUnsignedTx = { unsignedTx: transaction, signatureShares: [] };
    const txRequest: RecoveryTxRequest = { transactions: [unsignedTxWrapper], walletCoin };
    return { txRequests: [txRequest] };
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Validates and extracts transaction hex from parameters.
   * @param txHex - The transaction hex to validate
   * @param operation - The operation being performed (for error messages)
   * @returns The validated transaction hex
   * @throws Error if txHex is missing
   */
  private validateAndExtractTxHex(txHex: string | undefined, operation: string): string {
    if (!txHex) {
      throw new Error(`missing required tx prebuild property txHex for ${operation} operation`);
    }
    return txHex;
  }

  /**
   * Validates that the transaction is a TransferTransaction.
   * @param transaction - The transaction to validate
   * @throws Error if transaction is not a TransferTransaction
   */
  private validateTransactionType(transaction: Transaction): void {
    if (!(transaction instanceof TransferTransaction)) {
      throw new Error('Tx not a transfer transaction');
    }
  }

  /**
   * Verifies that transaction recipients match the expected recipients.
   * @param transaction - The transfer transaction to verify
   * @param expectedRecipients - The expected recipients from transaction params
   * @throws Error if recipients don't match
   */
  private verifyTransactionRecipients(
    transaction: TransferTransaction,
    expectedRecipients: TransactionRecipient[]
  ): void {
    const txData = transaction.toJson() as TransferTxData;

    if (!txData.recipients) {
      throw new Error('Tx recipients does not match with expected txParams recipients');
    }

    const actualRecipients = this.normalizeRecipients(txData.recipients);
    const expected = this.normalizeRecipients(expectedRecipients);

    if (!this.recipientsMatch(expected, actualRecipients)) {
      throw new Error('Tx recipients does not match with expected txParams recipients');
    }
  }

  /**
   * Normalizes recipients by extracting only relevant fields.
   * @param recipients - Recipients to normalize
   * @returns Normalized recipients with address, amount, and tokenName only
   */
  private normalizeRecipients(recipients: TransactionRecipient[]): TransactionRecipient[] {
    return recipients.map((recipient) => _.pick(recipient, ['address', 'amount', 'tokenName']));
  }

  /**
   * Checks if expected recipients match actual recipients.
   * @param expected - Expected recipients
   * @param actual - Actual recipients from transaction
   * @returns true if all expected recipients are found in actual recipients
   */
  private recipientsMatch(expected: TransactionRecipient[], actual: TransactionRecipient[]): boolean {
    return expected.every((expectedRecipient) =>
      actual.some((actualRecipient) => _.isEqual(expectedRecipient, actualRecipient))
    );
  }

  /**
   * Creates an empty parsed transaction result.
   * Used when transaction has no outputs.
   */
  private createEmptyParsedTransaction(): ParsedTransaction {
    return {
      inputs: [],
      outputs: [],
      fee: new BigNumber(0),
    };
  }

  /**
   * Calculates the transaction fee from the explanation.
   * @param explanation - The transaction explanation
   * @returns The fee as a BigNumber
   */
  private calculateTransactionFee(explanation: TransactionExplanation): BigNumber {
    if (explanation.fee.fee === '') {
      return new BigNumber(0);
    }
    return new BigNumber(explanation.fee.fee);
  }

  /**
   * Builds the inputs array for a parsed transaction.
   * Includes sender input and optionally sponsor input if present.
   *
   * @param explanation - The transaction explanation
   * @param fee - The calculated transaction fee
   * @returns Array of transaction inputs
   */
  private buildTransactionInputs(
    explanation: TransactionExplanation,
    fee: BigNumber
  ): Array<{
    address: string;
    amount: string;
  }> {
    const senderAddress = explanation.outputs[0].address;
    const outputAmount = new BigNumber(explanation.outputAmount);

    // If there's a sponsor, sender only pays for outputs
    // Otherwise, sender pays for outputs + fee
    const senderAmount = explanation.sponsor ? outputAmount.toFixed() : outputAmount.plus(fee).toFixed();

    const inputs = [
      {
        address: senderAddress,
        amount: senderAmount,
      },
    ];

    // Add sponsor input if present
    if (explanation.sponsor) {
      inputs.push({
        address: explanation.sponsor,
        amount: fee.toFixed(),
      });
    }

    return inputs;
  }

  /**
   * Builds the outputs array for a parsed transaction.
   * @param explanation - The transaction explanation
   * @returns Array of transaction outputs
   */
  private buildTransactionOutputs(explanation: TransactionExplanation): Array<{
    address: string;
    amount: string;
  }> {
    return explanation.outputs.map((output) => ({
      address: output.address,
      amount: new BigNumber(output.amount).toFixed(),
    }));
  }

  /**
   * Creates a transaction builder factory instance.
   * @returns TransactionBuilderFactory for this coin
   */
  private getTxBuilderFactory(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Rebuilds a transaction from its hex representation.
   * @param txHex - The transaction hex to rebuild
   * @returns The rebuilt transaction
   * @throws Error if transaction cannot be rebuilt
   */
  private async rebuildTransaction(txHex: string): Promise<Transaction> {
    const txBuilderFactory = this.getTxBuilderFactory();
    try {
      const txBuilder = txBuilderFactory.from(txHex);
      return (await txBuilder.build()) as Transaction;
    } catch (err) {
      throw new Error(`Failed to rebuild transaction: ${err.toString()}`);
    }
  }
}
