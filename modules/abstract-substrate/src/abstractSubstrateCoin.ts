import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  EDDSAMethods,
  EDDSAMethodTypes,
  KeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  MPCConsolidationRecoveryOptions,
  MPCRecoveryOptions,
  MPCSweepRecoveryOptions,
  MPCSweepTxs,
  MPCTx,
  MPCTxs,
  MPCUnsignedTx,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  RecoveryTxRequest,
  SignedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { KeyPair as SubstrateKeyPair, Transaction } from './lib';
import { DEFAULT_SUBSTRATE_PREFIX } from './lib/constants';
import { SignTransactionOptions, VerifiedTransactionParameters, Material } from './lib/iface';
import utils from './lib/utils';
import { auditEddsaPrivateKey, getDerivationPath } from '@bitgo/sdk-lib-mpc';
import BigNumber from 'bignumber.js';
import { ApiPromise } from '@polkadot/api';

export const DEFAULT_SCAN_FACTOR = 20;

export class SubstrateCoin extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  readonly MAX_VALIDITY_DURATION = 2400;
  readonly SWEEP_TXN_DURATION = 64;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  /**
   * Creates an instance of TransactionBuilderFactory for the coin specific sdk
   */
  getBuilder(): any {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc **/
  getChain(): string {
    return this._staticsCoin.name;
  }

  /** @inheritDoc **/
  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  /** @inheritDoc **/
  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc **/
  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  /** @inheritDoc **/
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new SubstrateKeyPair({ seed }) : new SubstrateKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /** @inheritDoc **/
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /** @inheritDoc **/
  isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  /** @inheritDoc **/
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /** @inheritDoc **/
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams } = params;
    if (Array.isArray(txParams.recipients) && txParams.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }
    return true;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params?.prv;
    const txHex = params?.txPrebuild?.txHex;

    if (typeof txHex !== 'string') {
      throw new Error(`txHex must be string, got type ${typeof txHex}`);
    }

    if (typeof prv !== 'string') {
      throw new Error(`prv must be string, got type ${typeof prv}`);
    }

    return { txHex, prv };
  }

  /** @inheritDoc **/
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, prv } = this.verifySignTransactionParams(params);
    const factory = this.getBuilder();
    const txBuilder = factory.from(txHex);
    const keyPair = new SubstrateKeyPair({ prv: prv });
    const { referenceBlock, blockNumber, transactionVersion, sender } = params.txPrebuild.transaction;

    txBuilder
      .validity({ firstValid: blockNumber, maxDuration: this.getMaxValidityDurationBlocks() })
      .referenceBlock(referenceBlock)
      .version(transactionVersion)
      .sender({ address: sender })
      .sign({ key: keyPair.getKeys().prv });
    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = transaction.toBroadcastFormat();
    return { txHex: signedTxHex };
  }

  /**
   * Retrieves the address format for the substrate coin.
   *
   * @returns {number} The address format as a number.
   */
  protected getAddressFormat(): number {
    return DEFAULT_SUBSTRATE_PREFIX;
  }

  /**
   * Retrieves the maximum validity duration in blocks.
   *
   * This method is intended to be overridden by subclasses to provide the specific
   * maximum validity duration for different types of Substrate-based coins.
   *
   * @returns {number} The maximum validity duration in blocks.
   * @throws {Error} If the method is not implemented by the subclass.
   */
  protected getMaxValidityDurationBlocks(): number {
    throw new Error('Method not implemented.');
  }

  protected getAddressFromPublicKey(Pubkey: string): string {
    return new SubstrateKeyPair({ pub: Pubkey }).getAddress(this.getAddressFormat());
  }

  protected async getInitializedNodeAPI(): Promise<ApiPromise> {
    throw new Error('Method not implemented.');
  }

  protected async getAccountInfo(walletAddr: string): Promise<{ nonce: number; freeBalance: number }> {
    throw new Error('Method not implemented.');
  }

  protected async getFee(destAddr: string, srcAddr: string, amount: number): Promise<number> {
    throw new Error('Method not implemented.');
  }

  protected async getHeaderInfo(): Promise<{ headerNumber: number; headerHash: string }> {
    throw new Error('Method not implemented.');
  }

  protected async getMaterial(): Promise<Material> {
    throw new Error('Method not implemented.');
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param {MPCRecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {MPCTx} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: MPCRecoveryOptions): Promise<MPCTx | MPCSweepTxs> {
    if (!params.bitgoKey) {
      throw new Error('Missing bitgoKey');
    }

    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid recovery destination address');
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

    const MPC = await EDDSAMethods.getInitializedMpcInstance();

    const index = params.index || 0;
    const currPath = params.seed ? getDerivationPath(params.seed) + `/${index}` : `m/${index}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
    const senderAddr = this.getAddressFromPublicKey(accountId);

    const { nonce, freeBalance } = await this.getAccountInfo(senderAddr);
    const destAddr = params.recoveryDestination;
    const amount = freeBalance;
    const partialFee = await this.getFee(destAddr, senderAddr, amount);

    const value = new BigNumber(freeBalance).minus(new BigNumber(partialFee));
    if (value.isLessThanOrEqualTo(0)) {
      throw new Error('Did not find address with funds to recover');
    }

    const { headerNumber, headerHash } = await this.getHeaderInfo();
    const material = await this.getMaterial();
    const validityWindow = { firstValid: headerNumber, maxDuration: this.MAX_VALIDITY_DURATION };

    const txBuilder = this.getBuilder().getTransferBuilder().material(material);
    txBuilder
      .sweep(false)
      .to({ address: params.recoveryDestination })
      .sender({ address: senderAddr })
      .validity(validityWindow)
      .referenceBlock(headerHash)
      .sequenceId({ name: 'Nonce', keyword: 'Nonce', value: nonce })
      .fee({ amount: 0, type: 'tip' });

    const unsignedTransaction = (await txBuilder.build()) as Transaction;

    let serializedTx = unsignedTransaction.toBroadcastFormat();
    if (!isUnsignedSweep) {
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

      // add signature
      const signatureHex = await EDDSAMethods.getTSSSignature(
        userSigningMaterial,
        backupSigningMaterial,
        currPath,
        unsignedTransaction
      );

      const substrateKeyPair = new SubstrateKeyPair({ pub: accountId });
      txBuilder.addSignature({ pub: substrateKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txBuilder.build();
      serializedTx = signedTransaction.toBroadcastFormat();
    } else {
      const value = new BigNumber(freeBalance);
      const walletCoin = this.getChain();
      const inputs = [
        {
          address: unsignedTransaction.inputs[0].address,
          valueString: value.toString(),
          value: value.toNumber(),
        },
      ];
      const outputs = [
        {
          address: unsignedTransaction.outputs[0].address,
          valueString: value.toString(),
          coinName: walletCoin,
        },
      ];
      const spendAmount = value.toString();
      const parsedTx = { inputs: inputs, outputs: outputs, spendAmount: spendAmount, type: '' };
      const feeInfo = { fee: 0, feeString: '0' };
      const transaction: MPCTx = {
        serializedTx: serializedTx,
        scanIndex: index,
        coin: walletCoin,
        signableHex: unsignedTransaction.signablePayload.toString('hex'),
        derivationPath: currPath,
        parsedTx: parsedTx,
        feeInfo: feeInfo,
        coinSpecific: { ...validityWindow, commonKeychain: bitgoKey },
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

    const transaction: MPCTx = { serializedTx: serializedTx, scanIndex: index };
    return transaction;
  }

  /**
   * Builds native TAO recoveries of receive addresses in batch without BitGo.
   * Funds will be recovered to base address first. You need to initiate another sweep txn after that.
   *
   * @param {MPCConsolidationRecoveryOptions} params - options for consolidation recovery.
   * @param {string} [params.startingScanIndex] - receive address index to start scanning from. default to 1 (inclusive).
   * @param {string} [params.endingScanIndex] - receive address index to end scanning at. default to startingScanIndex + 20 (exclusive).
   */
  async recoverConsolidations(params: MPCConsolidationRecoveryOptions): Promise<MPCTxs | MPCSweepTxs> {
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const startIdx = params.startingScanIndex || 1;
    const endIdx = params.endingScanIndex || startIdx + DEFAULT_SCAN_FACTOR;

    if (startIdx < 1 || endIdx <= startIdx || endIdx - startIdx > 10 * DEFAULT_SCAN_FACTOR) {
      throw new Error(
        `Invalid starting or ending index to scan for addresses. startingScanIndex: ${startIdx}, endingScanIndex: ${endIdx}.`
      );
    }

    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const baseIndex = 0;
    const basePath = params.seed ? getDerivationPath(params.seed) + `/${baseIndex}` : `m/${baseIndex}`;
    const accountId = MPC.deriveUnhardened(bitgoKey, basePath).slice(0, 64);
    const baseAddress = this.getAddressFromPublicKey(accountId);

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
      };

      let recoveryTransaction;
      try {
        recoveryTransaction = await this.recover(recoverParams);
      } catch (e) {
        if (e.message === 'Did not find address with funds to recover') {
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
    }

    if (consolidationTransactions.length == 0) {
      throw new Error('Did not find an address with funds to recover');
    }

    if (isUnsignedSweep) {
      // lastScanIndex will be used to inform user the last address index scanned for available funds (so they can
      // appropriately adjust the scan range on the next iteration of consolidation recoveries). In the case of unsigned
      // sweep consolidations, this lastScanIndex will be provided in the coinSpecific of the last txn made.
      const lastTransactionCoinSpecific = {
        firstValid:
          consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific
            .firstValid,
        maxDuration:
          consolidationTransactions[consolidationTransactions.length - 1].transactions[0].unsignedTx.coinSpecific
            .maxDuration,
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

  /** inherited doc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
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
      if (
        !transaction.coinSpecific ||
        !transaction.coinSpecific?.firstValid ||
        !transaction.coinSpecific?.maxDuration
      ) {
        throw new Error('missing validity window');
      }
      const validityWindow = {
        firstValid: transaction.coinSpecific?.firstValid,
        maxDuration: transaction.coinSpecific?.maxDuration,
      };
      const material = await this.getMaterial();
      if (!transaction.coinSpecific?.commonKeychain) {
        throw new Error('Missing common keychain');
      }
      const commonKeychain = transaction.coinSpecific!.commonKeychain! as string;
      if (!transaction.derivationPath) {
        throw new Error('Missing derivation path');
      }
      const derivationPath = transaction.derivationPath as string;
      const accountId = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
      const senderAddr = this.getAddressFromPublicKey(accountId);

      const txnBuilder = this.getBuilder()
        .material(material)
        .from(transaction.serializedTx as string)
        .sender({ address: senderAddr })
        .validity(validityWindow);

      const substrateKeyPair = new SubstrateKeyPair({ pub: accountId });
      txnBuilder.addSignature({ pub: substrateKeyPair.getKeys().pub }, signatureHex);
      const signedTransaction = await txnBuilder.build();
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

  /** inherited doc */
  auditDecryptedKey({ publicKey, prv, multiSigType }: AuditDecryptedKeyParams) {
    if (multiSigType !== 'tss') {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }
}
