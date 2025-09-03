import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  Ecdsa,
  ECDSAUtils,
  ExplanationResult,
  InvalidAddressError,
  InvalidMemoIdError,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SigningError,
  SignTransactionOptions,
  TransactionType,
  UnexpectedAddressError,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { bip32 } from '@bitgo/secp256k1';
import { Coin } from '@cosmjs/stargate';
import { BigNumber } from 'bignumber.js';
import { Buffer } from 'buffer';
import { createHash, Hash, randomBytes } from 'crypto';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as request from 'superagent';
import * as url from 'url';
import {
  CosmosKeyPair,
  CosmosLikeCoinRecoveryOutput,
  CosmosTransaction,
  FeeData,
  GasAmountDetails,
  RecoveryOptions,
  RedelegateMessage,
  SendMessage,
  CosmosTransactionBuilder,
  KeyShares,
  TransactionBuildParams,
  BalanceResult,
} from './lib';
import { ROOT_PATH } from './lib/constants';
import utils from './lib/utils';
import { auditEcdsaPrivateKey } from '@bitgo/sdk-lib-mpc';

/**
 * Cosmos accounts support memo Id based addresses
 */
interface AddressDetails {
  address: string;
  memoId?: string | undefined;
}

/**
 * Cosmos accounts support memo Id based addresses
 */
interface CosmosCoinSpecific {
  rootAddress: string;
}

export class CosmosCoin<CustomMessage = never> extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new CosmosCoin(bitgo, staticsCoin);
  }

  /**
   * Creates an instance of TransactionBuilderFactory for the coin specific sdk
   */
  getBuilder(): any {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    throw new Error('Method not implemented');
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
    return 'ecdsa';
  }

  /** @inheritDoc **/
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /** @inheritDoc **/
  isValidPrv(prv: string): boolean {
    return utils.isValidPrivateKey(prv);
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param {RecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {CosmosLikeCoinRecoveryOutput} the serialized transaction hex string and index
   * of the address being swept
   */
  async recover(params: RecoveryOptions): Promise<CosmosLikeCoinRecoveryOutput> {
    const isUnsignedSweep = this.isUnsignedSweep(params);
    this.validateRecoveryParams(params, isUnsignedSweep);

    const { senderAddress, publicKey, keyShares } = await this.getSenderDetails(params, isUnsignedSweep);

    const [chainId, accountDetails, balances] = await Promise.all([
      this.getChainId(),
      this.getAccountDetails(senderAddress),
      this.getAccountBalance(senderAddress),
    ]);

    const { actualBalance, remainingBalances } = this.processBalances(balances);
    const messages = this.buildTransactionMessages(
      senderAddress,
      params.recoveryDestination,
      actualBalance,
      remainingBalances
    );

    return this.buildAndSignTransaction({
      messages,
      chainId,
      accountDetails,
      publicKey: publicKey || '',
      isUnsignedSweep,
      keyShares,
    });
  }

  /**
   * Validates the recovery parameters
   */
  private validateRecoveryParams(params: RecoveryOptions, isUnsignedSweep: boolean): void {
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    if (!isUnsignedSweep) {
      if (!params.userKey) throw new Error('missing userKey');
      if (!params.backupKey) throw new Error('missing backupKey');
      if (!params.walletPassphrase) throw new Error('missing wallet passphrase');
    }
  }

  /**
   * Checks if this is an unsigned sweep operation
   */
  private isUnsignedSweep(params: RecoveryOptions): boolean {
    return !params.userKey && !params.backupKey && !params.walletPassphrase;
  }

  /**
   * Gets sender details including address, public key and key shares
   */
  private async getSenderDetails(
    params: RecoveryOptions,
    isUnsignedSweep: boolean
  ): Promise<{
    senderAddress: string;
    publicKey?: string;
    keyShares?: KeyShares;
  }> {
    const MPC = new Ecdsa();

    if (isUnsignedSweep) {
      return {
        senderAddress: params.rootAddress as string,
        publicKey: MPC.deriveUnhardened(params.bitgoKey || '', ROOT_PATH).slice(0, 66),
      };
    }

    const keyShares = await this.getKeyShares(params);
    const publicKey = MPC.deriveUnhardened(keyShares.commonKeyChain, ROOT_PATH).slice(0, 66);

    return {
      senderAddress: this.getAddressFromPublicKey(publicKey),
      publicKey,
      keyShares,
    };
  }

  /**
   * Gets key shares from recovery parameters
   */
  private async getKeyShares(params: RecoveryOptions): Promise<KeyShares> {
    if (!params.userKey || !params.backupKey || !params.walletPassphrase) {
      throw new Error('Missing required key parameters');
    }

    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');
    const walletPassphrase = params.walletPassphrase;

    if (!userKey || !backupKey) {
      throw new Error('Invalid key format');
    }

    return await ECDSAUtils.getMpcV2RecoveryKeyShares(userKey, backupKey, walletPassphrase);
  }

  /**
   * Processes account balances and validates sufficient funds
   */
  private processBalances(balances: Coin[]): BalanceResult {
    if (!balances?.length) {
      throw new Error('No balance found on account');
    }

    const denomination = this.getDenomination();
    if (!denomination) {
      throw new Error('Invalid denomination');
    }

    let nativeBalance = new BigNumber(0);
    const remainingBalances: Coin[] = [];

    const gasAmountDetails = this.getGasAmountDetails();
    if (!gasAmountDetails?.gasAmount) {
      throw new Error('Invalid gas amount');
    }

    const gasAmount = new BigNumber(gasAmountDetails.gasAmount);
    balances.forEach((balance) => {
      if (!balance.amount) {
        throw new Error('Invalid balance amount');
      }

      if (balance.denom === denomination) {
        nativeBalance = new BigNumber(balance.amount);
      } else {
        remainingBalances.push(balance);
      }
    });

    const actualBalance = nativeBalance.minus(gasAmount);
    if (actualBalance.isLessThanOrEqualTo(0)) {
      throw new Error('Did not have enough funds to recover');
    }

    return { nativeBalance, remainingBalances, actualBalance };
  }

  /**
   * Builds transaction messages for all balances
   */
  private buildTransactionMessages(
    senderAddress: string,
    recoveryDestination: string,
    actualBalance: BigNumber,
    remainingBalances: Coin[]
  ): SendMessage[] {
    const nativeSendMessage: SendMessage = {
      fromAddress: senderAddress,
      toAddress: recoveryDestination,
      amount: [
        {
          denom: this.getDenomination(),
          amount: actualBalance.toFixed(),
        },
      ],
    };

    const otherTokenMessages = remainingBalances.map((balance) => ({
      fromAddress: senderAddress,
      toAddress: recoveryDestination,
      amount: [balance],
    }));

    return [...otherTokenMessages, nativeSendMessage];
  }

  /**
   * Builds and signs the transaction
   */
  private async buildAndSignTransaction(params: TransactionBuildParams): Promise<CosmosLikeCoinRecoveryOutput> {
    if (!params.chainId) {
      throw new Error('Invalid chain ID');
    }

    const [accountNumber, sequenceNo] = params.accountDetails;
    if (!accountNumber || !sequenceNo) {
      throw new Error('Invalid account details');
    }

    const denomination = this.getDenomination();
    const gasAmountDetails = this.getGasAmountDetails();
    if (!denomination || !gasAmountDetails?.gasAmount || !gasAmountDetails?.gasLimit) {
      throw new Error('Invalid gas configuration');
    }

    const gasBudget: FeeData = {
      amount: [
        {
          denom: denomination,
          amount: gasAmountDetails.gasAmount,
        },
      ],
      gasLimit: gasAmountDetails.gasLimit,
    };

    const txnBuilder = this.getBuilder()
      .getTransferBuilder()
      .messages(params.messages)
      .gasBudget(gasBudget)
      .sequence(Number(sequenceNo))
      .accountNumber(Number(accountNumber))
      .chainId(params.chainId)
      .publicKey(params.publicKey);

    const unsignedTransaction = (await txnBuilder.build()) as CosmosTransaction<CustomMessage>;
    if (!unsignedTransaction) {
      throw new Error('Failed to build unsigned transaction');
    }

    if (params.isUnsignedSweep) {
      return {
        signableHex: unsignedTransaction.signablePayload.toString('hex'),
      };
    }

    return this.signTransactionWithMpc(unsignedTransaction, txnBuilder, params.keyShares!, params.publicKey);
  }

  /**
   * Signs the transaction with MPC
   */
  /**
   * Signs the transaction using MPC (Multi-Party Computation)
   * @param unsignedTransaction The unsigned transaction to sign
   * @param txnBuilder The transaction builder instance
   * @param keyShares The key shares for MPC signing
   * @param publicKey The public key for verification
   * @returns The signed transaction output
   * @throws Error if validation fails or signing process encounters an error
   */
  protected async signTransactionWithMpc(
    unsignedTransaction: CosmosTransaction<CustomMessage>,
    txnBuilder: CosmosTransactionBuilder,
    keyShares: KeyShares,
    publicKey: string
  ): Promise<CosmosLikeCoinRecoveryOutput> {
    // Validate inputs
    if (!unsignedTransaction?.signablePayload) {
      throw new Error('Invalid unsigned transaction');
    }

    if (!keyShares?.userKeyShare || !keyShares?.backupKeyShare || !keyShares?.commonKeyChain) {
      throw new Error('Invalid key shares');
    }

    if (!publicKey) {
      throw new Error('Invalid public key');
    }

    try {
      const MPC = new Ecdsa();
      const message = unsignedTransaction.signablePayload;

      // Get hash function and compute message hash
      const hashFunction = utils.getHashFunction() || createHash('sha256');
      if (!hashFunction) {
        throw new Error('Failed to get hash function');
      }
      const messageHash = hashFunction.update(message).digest();

      // Sign the transaction
      const signature = await ECDSAUtils.signRecoveryMpcV2(
        messageHash,
        keyShares.userKeyShare,
        keyShares.backupKeyShare,
        keyShares.commonKeyChain
      );

      // Verify the signature
      const signableHex = unsignedTransaction.signablePayload.toString('hex');
      const signableBuffer = Buffer.from(signableHex, 'hex');
      MPC.verify(signableBuffer, signature, this.getHashFunction());

      // Get cosmos key pair and validate
      const cosmosKeyPair = this.getKeyPair(publicKey);
      if (!cosmosKeyPair) {
        throw new Error('Invalid cosmos key pair');
      }

      // Add signature to transaction
      txnBuilder.addSignature({ pub: cosmosKeyPair.getKeys().pub }, Buffer.from(signature.r + signature.s, 'hex'));

      // Build final transaction
      const signedTransaction = await txnBuilder.build();
      if (!signedTransaction) {
        throw new Error('Failed to build signed transaction');
      }

      return {
        serializedTx: signedTransaction.toBroadcastFormat(),
      };
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  /**
   * Builds a redelegate transaction
   * @param {RecoveryOptions} params parameters needed to construct and
   * (maybe) sign the transaction
   *
   * @returns {CosmosLikeCoinRecoveryOutput} the serialized transaction hex string
   */
  async redelegate(
    params: RecoveryOptions & {
      validatorSrcAddress: string;
      validatorDstAddress: string;
      amountToRedelegate: string;
    }
  ): Promise<CosmosLikeCoinRecoveryOutput> {
    if (!params.validatorSrcAddress || !this.isValidAddress(params.validatorSrcAddress)) {
      throw new Error('invalid validatorSrcAddress');
    }

    if (!params.validatorDstAddress || !this.isValidAddress(params.validatorDstAddress)) {
      throw new Error('invalid validatorDstAddress');
    }

    if (!params.userKey) {
      throw new Error('missing userKey');
    }

    if (!params.backupKey) {
      throw new Error('missing backupKey');
    }

    if (!params.walletPassphrase) {
      throw new Error('missing wallet passphrase');
    }

    if (!params.amountToRedelegate) {
      throw new Error('missing amountToRedelegate');
    }

    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    const { userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      userKey,
      backupKey,
      params.walletPassphrase
    ); // baseAddress is not extracted

    const MPC = new Ecdsa();
    const chainId = await this.getChainId();
    const publicKey = MPC.deriveUnhardened(commonKeyChain, ROOT_PATH).slice(0, 66);
    const senderAddress = this.getAddressFromPublicKey(publicKey);

    const [accountNumber, sequenceNo] = await this.getAccountDetails(senderAddress);
    const gasBudget: FeeData = {
      amount: [{ denom: this.getDenomination(), amount: this.getGasAmountDetails().gasAmount }],
      gasLimit: this.getGasAmountDetails().gasLimit,
    };

    const amount: Coin = {
      denom: this.getDenomination(),
      amount: new BigNumber(params.amountToRedelegate).toFixed(),
    };

    const sendMessage: RedelegateMessage[] = [
      {
        delegatorAddress: senderAddress,
        validatorSrcAddress: params.validatorSrcAddress,
        validatorDstAddress: params.validatorDstAddress,
        amount: amount,
      },
    ];

    const txnBuilder = this.getBuilder().getStakingRedelegateBuilder();
    txnBuilder
      .messages(sendMessage)
      .gasBudget(gasBudget)
      .publicKey(publicKey)
      .sequence(Number(sequenceNo))
      .accountNumber(Number(accountNumber))
      .chainId(chainId);

    const unsignedTransaction = (await txnBuilder.build()) as CosmosTransaction<CustomMessage>;
    let serializedTx = unsignedTransaction.toBroadcastFormat();
    const signableHex = unsignedTransaction.signablePayload.toString('hex');
    const message = unsignedTransaction.signablePayload;
    const messageHash = (utils.getHashFunction() || createHash('sha256')).update(message).digest();
    const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, userKeyShare, backupKeyShare, commonKeyChain);
    const signableBuffer = Buffer.from(signableHex, 'hex');
    MPC.verify(signableBuffer, signature, this.getHashFunction());
    const cosmosKeyPair = this.getKeyPair(publicKey);
    txnBuilder.addSignature({ pub: cosmosKeyPair.getKeys().pub }, Buffer.from(signature.r + signature.s, 'hex'));
    const signedTransaction = await txnBuilder.build();
    serializedTx = signedTransaction.toBroadcastFormat();

    return { serializedTx: serializedTx };
  }

  /** @inheritDoc **/
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const { txPrebuild, txParams } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const transaction = await this.getBuilder().from(rawTx).build();
    const explainedTx = transaction.explainTransaction();
    if (txParams.recipients && txParams.recipients.length > 0) {
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      // WithdrawDelegatorRewards and ContractCall transaction don't have amount
      if (transaction.type !== TransactionType.StakingWithdraw && transaction.type !== TransactionType.ContractCall) {
        for (const recipients of txParams.recipients) {
          totalAmount = totalAmount.plus(recipients.amount);
        }
        if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
          throw new Error('Tx total amount does not match with expected total amount field');
        }
      }
    }
    return true;
  }

  /** @inheritDoc **/
  async explainTransaction(options: { txHex: string }): Promise<ExplanationResult> {
    if (!options.txHex) {
      throw new Error('missing required txHex parameter');
    }
    try {
      const transactionBuilder = this.getBuilder().from(options.txHex);
      const transaction = await transactionBuilder.build();
      return transaction.explainTransaction();
    } catch (e) {
      throw new Error('Invalid transaction: ' + e.message);
    }
  }

  /**
   * Sign a transaction with a single private key
   * @param params parameters in the form of { txPrebuild: {txHex}, prv }
   * @returns signed transaction in the form of { txHex }
   */
  async signTransaction(
    params: SignTransactionOptions & { txPrebuild: { txHex: string }; prv: string }
  ): Promise<SignedTransaction> {
    const txHex = params?.txPrebuild?.txHex;
    const privateKey = params?.prv;
    if (!txHex) {
      throw new SigningError('missing required txPrebuild parameter: params.txPrebuild.txHex');
    }
    if (!privateKey) {
      throw new SigningError('missing required prv parameter: params.prv');
    }
    const txBuilder = this.getBuilder().from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();
    if (!transaction) {
      throw new SigningError('Failed to build signed transaction');
    }
    const serializedTx = transaction.toBroadcastFormat();
    return {
      txHex: serializedTx,
    };
  }

  /** @inheritDoc **/
  async parseTransaction(params: ParseTransactionOptions & { txHex: string }): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });
    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    if (transactionExplanation.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }
    const senderAddress = transactionExplanation.outputs[0].address;
    const feeAmount = new BigNumber(transactionExplanation.fee.fee === '' ? '0' : transactionExplanation.fee.fee);
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(transactionExplanation.outputAmount).plus(feeAmount).toFixed(),
      },
    ];
    const outputs = transactionExplanation.outputs.map((output) => {
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
   * Get the public node url from the Environments constant we have defined
   */
  protected getPublicNodeUrl(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Get account number from public node
   */
  protected async getAccountFromNode(senderAddress: string): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const getAccountPath = '/cosmos/auth/v1beta1/accounts/';
    const fullEndpoint = nodeUrl + getAccountPath + senderAddress;
    try {
      return await request.get(fullEndpoint).send();
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${getAccountPath + senderAddress} from node: ${nodeUrl}`);
  }

  /**
   * Get balance from public node
   */
  protected async getBalanceFromNode(senderAddress: string): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const getBalancePath = '/cosmos/bank/v1beta1/balances/';
    const fullEndpoint = nodeUrl + getBalancePath + senderAddress;
    try {
      return await request.get(fullEndpoint).send();
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${getBalancePath + senderAddress} from node: ${nodeUrl}`);
  }

  /**
   * Get chain id from public node
   */
  protected async getChainIdFromNode(): Promise<request.Response> {
    const nodeUrl = this.getPublicNodeUrl();
    const getLatestBlockPath = '/cosmos/base/tendermint/v1beta1/blocks/latest';
    const fullEndpoint = nodeUrl + getLatestBlockPath;
    try {
      return await request.get(fullEndpoint).send();
    } catch (e) {
      console.debug(e);
    }
    throw new Error(`Unable to call endpoint ${getLatestBlockPath} from node: ${nodeUrl}`);
  }

  /**
   * Helper to fetch account balance
   */
  protected async getAccountBalance(senderAddress: string): Promise<Coin[]> {
    const response = await this.getBalanceFromNode(senderAddress);
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.balances;
  }

  /**
   * Helper to fetch chainId
   */
  protected async getChainId(): Promise<string> {
    const response = await this.getChainIdFromNode();
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.block.header.chain_id;
  }

  /**
   * Helper to fetch account number
   */
  protected async getAccountDetails(senderAddress: string): Promise<string[]> {
    const response = await this.getAccountFromNode(senderAddress);
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return [response.body.account.account_number, response.body.account.sequence];
  }

  /** @inheritDoc **/
  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bip32.fromSeed(seed);
    return {
      pub: extendedKey.neutered().toBase58(),
      prv: extendedKey.toBase58(),
    };
  }

  /**
   * Retrieves the address from a public key.
   * @param {string} pubKey - The public key.
   * @returns {string} The corresponding address.
   */
  getAddressFromPublicKey(pubKey: string): string {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const addressDetails = this.getAddressDetails(params.address);

    if (!this.isValidAddress(addressDetails.address)) {
      throw new InvalidAddressError(`invalid address: ${addressDetails.address}`);
    }
    const rootAddress = (params.coinSpecific as CosmosCoinSpecific).rootAddress;
    if (addressDetails.address !== rootAddress) {
      throw new UnexpectedAddressError(`address validation failure: ${addressDetails.address} vs ${rootAddress}`);
    }
    return true;
  }

  /** @inheritDoc **/
  getHashFunction(): Hash {
    return utils.getHashFunction();
  }

  /**
   * Process address into address and memo id
   *
   * @param address the address
   * @returns object containing address and memo id
   */
  getAddressDetails(address: string): AddressDetails {
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname || '';

    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memo id property
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (Array.isArray(queryDetails.memoId)) {
      throw new InvalidAddressError(
        `memoId may only be given at most once, but found ${queryDetails.memoId.length} instances in address ${address}`
      );
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new InvalidAddressError(`invalid address '${address}', must contain exactly one memoId`);
    }

    const [memoId] = _.castArray(queryDetails.memoId) || undefined;
    if (!this.isValidMemoId(memoId)) {
      throw new InvalidMemoIdError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      address: destinationAddress,
      memoId,
    };
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId memo id
   * @returns true if memo id is valid
   */
  isValidMemoId(memoId: string): boolean {
    return utils.isValidMemoId(memoId);
  }

  /**
   * Helper method to return the respective coin's base unit
   */
  getDenomination(): string {
    throw new Error('Method not implemented');
  }

  /**
   * Helper method to fetch gas amount details for respective coin
   */
  getGasAmountDetails(): GasAmountDetails {
    throw new Error('Method not implemented');
  }

  /**
   * Helper method to get key pair for individual coin
   * @param publicKey
   */
  getKeyPair(publicKey: string): CosmosKeyPair {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  auditDecryptedKey({ multiSigType, publicKey, prv }: AuditDecryptedKeyParams) {
    if (multiSigType !== 'tss') {
      throw new Error('Unsupported multiSigType');
    } else {
      auditEcdsaPrivateKey(prv as string, publicKey as string);
    }
  }
}
