import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  Environments,
  getBip32Keys,
  getIsUnsignedSweep,
  KeyPair,
  MultisigType,
  multisigTypes,
  SignedTransaction,
  TransactionRecipient,
  TransactionType,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import {
  bufferCVFromString,
  ClarityType,
  ClarityValue,
  createStacksPrivateKey,
  cvToString,
  cvToValue,
  deserializeTransaction,
  noneCV,
  privateKeyToString,
  publicKeyFromBuffer,
  publicKeyToString,
  someCV,
  standardPrincipalCV,
  uintCV,
} from '@stacks/transactions';
import { serializePayload } from '@stacks/transactions/dist/payload';
import BigNumber from 'bignumber.js';

import { ExplainTransactionOptions, StxSignTransactionOptions, StxTransactionExplanation } from './types';
import { StxLib } from '.';
import { TransactionBuilderFactory } from './lib';
import { TransactionBuilder } from './lib/transactionBuilder';
import { findContractTokenNameUsingContract, findTokenNameByContract, getAddressDetails } from './lib/utils';
import {
  AddressDetails,
  NativeStxBalance,
  RecoveryInfo,
  RecoveryOptions,
  RecoveryTransaction,
  SingleFungibleTokenBalance,
  StxNonceResponse,
  StxTxnFeeEstimationResponse,
  TxData,
} from './lib/iface';
import { TransferBuilder } from './lib/transferBuilder';
import { FungibleTokenTransferBuilder } from './lib/fungibleTokenTransferBuilder';

export class Stx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Stx(bitgo, staticsCoin);
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

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getTransaction(coinConfig: Readonly<StaticsBaseCoin>): TransactionBuilder {
    return new TransactionBuilderFactory(coinConfig).getTransferBuilder();
  }

  /** {@inheritDoc } **/
  supportsMultisig(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild, txParams } = params;

    // Verify single recipient constraint
    if (Array.isArray(txParams?.recipients) && txParams.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }

    // Get raw transaction from either txHex or txRequest
    const rawTx =
      txPrebuild.txHex ||
      (txPrebuild.txRequest?.apiVersion === 'full'
        ? txPrebuild.txRequest.transactions?.[0]?.unsignedTx?.signableHex
        : txPrebuild.txRequest?.unsignedTxs?.[0]?.signableHex);

    if (!rawTx) {
      throw new Error('missing required transaction hex');
    }

    // Verify recipient and amount if provided
    if (txParams?.recipients?.[0]) {
      const recipient = txParams.recipients[0];
      const coinConfig = coins.get(this.getChain());
      const txBuilder = new TransactionBuilderFactory(coinConfig).getTransferBuilder();
      txBuilder.from(rawTx);
      const transaction = await txBuilder.build();
      const explainedTx = transaction.explainTransaction();

      // Verify recipient address matches
      if (recipient.address !== explainedTx.to) {
        throw new Error('transaction recipient address does not match expected address');
      }

      // Verify amount matches
      if (!new BigNumber(recipient.amount).isEqualTo(explainedTx.amount)) {
        throw new Error('transaction amount does not match expected amount');
      }
    }

    return true;
  }

  /**
   * Check if address is valid, then make sure it matches the base address.
   *
   * @param {VerifyAddressOptions} params
   * @param {String} params.address - the address to verify
   * @param {String} params.baseAddress - the base address from the wallet
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, keychains } = params;
    if (!keychains || keychains.length !== 3) {
      throw new Error('Invalid keychains');
    }
    const pubs = keychains.map((keychain) => StxLib.Utils.xpubToSTXPubkey(keychain.pub));
    const addressVersion = StxLib.Utils.getAddressVersion(address);
    const baseAddress = StxLib.Utils.getSTXAddressFromPubKeys(pubs, addressVersion).address;
    return StxLib.Utils.isSameBaseAddress(address, baseAddress);
  }

  /**
   * Generate Stacks key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new StxLib.KeyPair({ seed }) : new StxLib.KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      return StxLib.Utils.isValidPublicKey(pub);
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    try {
      return StxLib.Utils.isValidPrivateKey(prv);
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      return StxLib.Utils.isValidAddressWithPaymentId(address);
    } catch (e) {
      return false;
    }
  }

  /**
   * Signs stacks transaction
   * @param params
   */
  async signTransaction(params: StxSignTransactionOptions): Promise<SignedTransaction> {
    const factory = new StxLib.TransactionBuilderFactory(coins.get(this.getChain()));
    const txBuilder = factory.from(params.txPrebuild.txHex);
    const prvKeys = params.prv instanceof Array ? params.prv : [params.prv];
    prvKeys.forEach((prv) => txBuilder.sign({ key: prv }));
    if (params.pubKeys) txBuilder.fromPubKey(params.pubKeys);
    // if (params.numberSignature) txBuilder.numberSignatures(params.numberSignature);
    const transaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid message passed to signMessage');
    }

    const txHex = {
      txHex: transaction.toBroadcastFormat(),
    };

    return transaction.signature.length >= 2 ? txHex : { halfSigned: txHex };
  }

  async parseTransaction(params: any): Promise<any> {
    return {};
  }

  /**
   * Explain a Stacks transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<StxTransactionExplanation | undefined> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }

    const factory = new StxLib.TransactionBuilderFactory(coins.get(this.getChain()));
    const txBuilder = factory.from(txHex);

    if (params.publicKeys !== undefined) {
      txBuilder.fromPubKey(params.publicKeys);
      if (params.publicKeys.length === 1) {
        // definitely a single sig tx
        txBuilder.numberSignatures(1);
      }
    }

    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    if (tx.type === TransactionType.Send) {
      // check if it is a token transaction or native coin transaction
      let transactionRecipient: TransactionRecipient;
      let outputAmount: string;
      let memo: string | undefined;
      if (txJson.payload.contractAddress && txJson.payload.functionArgs.length >= 3) {
        outputAmount = cvToValue(txJson.payload.functionArgs[0]).toString();
        transactionRecipient = {
          address: cvToString(txJson.payload.functionArgs[2]),
          amount: outputAmount,
          tokenName: findTokenNameByContract(txJson.payload.contractAddress, txJson.payload.contractName),
        };
        if (
          txJson.payload.functionArgs.length === 4 &&
          txJson.payload.functionArgs[3].type === ClarityType.OptionalSome
        ) {
          memo = Buffer.from(txJson.payload.functionArgs[3].value.buffer).toString();
          transactionRecipient['memo'] = memo;
        }
      } else {
        outputAmount = txJson.payload.amount;
        memo = txJson.payload.memo;
        transactionRecipient = {
          address: txJson.payload.to,
          amount: outputAmount,
          memo: memo,
        };
      }
      const outputs: TransactionRecipient[] = [transactionRecipient];

      const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo', 'type'];
      return {
        displayOrder,
        id: txJson.id,
        outputAmount: outputAmount.toString(),
        changeAmount: '0',
        outputs,
        changeOutputs: [],
        fee: txJson.fee,
        memo: memo,
        type: tx.type,
      };
    }

    if (tx.type === TransactionType.ContractCall) {
      const displayOrder = [
        'id',
        'fee',
        'type',
        'contractAddress',
        'contractName',
        'contractFunction',
        'contractFunctionArgs',
      ];
      return {
        displayOrder,
        id: txJson.id,
        changeAmount: '0',
        outputAmount: '',
        outputs: [],
        changeOutputs: [],
        fee: txJson.fee,
        type: tx.type,
        contractAddress: txJson.payload.contractAddress,
        contractName: txJson.payload.contractName,
        contractFunction: txJson.payload.functionName,
        contractFunctionArgs: txJson.payload.functionArgs,
      };
    }
  }

  /**
   * Get URLs of some active public nodes
   * @returns {String} node url
   */
  getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].stxNodeUrl;
  }

  /**
   * Get native stacks balance for an account
   * @param {String} address - stacks address
   * @returns {Promise<NativeStxBalance>}
   */
  protected async getNativeStxBalanceFromNode({ address }: { address: string }): Promise<NativeStxBalance> {
    const endpoint = `${this.getPublicNodeUrl()}/extended/v2/addresses/${address}/balances/stx`;
    try {
      const response = await this.bitgo.get(endpoint);
      if (response.statusCode !== 200) {
        throw new Error(`request failed with status ${response.statusCode}`);
      }
      const body: NativeStxBalance = response.body;
      return body;
    } catch (e) {
      throw new Error(`unable to get native stx balance from node: ${e.message}`);
    }
  }

  /**
   * Get single fungible token balance for an account
   * @param {String} address - stacks address
   * @param {String} assetId - fungible token asset id
   * @returns {Promise<SingleFungibleTokenBalance>}
   */
  protected async getSingleFungibleTokenBalanceFromNode({
    address,
    assetId,
  }: {
    address: string;
    assetId: string;
  }): Promise<SingleFungibleTokenBalance> {
    const endpoint = `${this.getPublicNodeUrl()}/extended/v2/addresses/${address}/balances/ft/${assetId}`;
    try {
      const response = await this.bitgo.get(endpoint);
      if (response.statusCode !== 200) {
        throw new Error(`request failed with status ${response.statusCode}`);
      }
      const body: SingleFungibleTokenBalance = response.body;
      return body;
    } catch (e) {
      throw new Error(`unable to get native stx balance from node: ${e.message}`);
    }
  }

  /**
   * Get nonce data specific to an account from a public node
   * @param {String} address - stacks address
   * @returns {Promise<StxNonceResponse>}
   */
  protected async getAccountNonceFromNode({ address }: { address: string }): Promise<StxNonceResponse> {
    const endpoint = `${this.getPublicNodeUrl()}/extended/v1/address/${address}/nonces`;
    try {
      const response = await this.bitgo.get(endpoint);
      if (response.statusCode !== 200) {
        throw new Error(`request failed with status ${response.statusCode}`);
      }
      const body: StxNonceResponse = response.body;
      return body;
    } catch (e) {
      throw new Error(`unable to get account nonce from node: ${e.message}`);
    }
  }

  /**
   * Get stacks transaction estimated fee
   * @param {String} txHex - hex of stacks transaction payload
   * @param {Number} txHexLength - length of built serialized transaction
   * @returns {Promise<Number>} - fee estimate (taking the lowest)
   */
  protected async getTransactionFeeEstimation({
    txHex,
    txHexLength,
  }: {
    txHex: string;
    txHexLength: number;
  }): Promise<number> {
    const endpoint = `${this.getPublicNodeUrl()}/v2/fees/transaction`;
    const requestBody = {
      transaction_payload: txHex,
      estimated_len: txHexLength,
    };
    try {
      const response = await this.bitgo.post(endpoint).send(requestBody);
      if (response.statusCode !== 200) {
        throw new Error(`request failed with status ${response.statusCode}`);
      }
      const body: StxTxnFeeEstimationResponse = response.body;
      if (body.estimations.length !== 3) {
        throw new Error('Invalid response estimation length');
      }
      return body.estimations[0].fee;
    } catch (e) {
      throw new Error(`unable to get transaction fee estimation: ${e.message}`);
    }
  }

  /**
   * Format for offline vault signing
   * @param {BaseTransaction} tx - base transaction
   * @returns {Promise<RecoveryInfo>}
   */
  protected async formatForOfflineVault(tx: BaseTransaction): Promise<RecoveryInfo> {
    const txJson: TxData = tx.toJson();
    const transactionExplanation: RecoveryInfo = (await this.explainTransaction({
      txHex: tx.toBroadcastFormat(),
      feeInfo: { fee: txJson.fee },
    })) as RecoveryInfo;
    transactionExplanation.coin = this.getChain();
    transactionExplanation.feeInfo = { fee: txJson.fee };
    transactionExplanation.txHex = tx.toBroadcastFormat();
    return transactionExplanation;
  }

  /**
   * Get the recoverable amount & fee after subtracting the txn fee
   * @param {String} serializedHex - serialized txn hex
   * @param {Number} txHexLength - deserialized txn length
   * @param {String} balance - total account balance
   * @param {String} tokenBalance - total token balance
   * @returns {Promise<Record<string, string>>}
   */
  protected async getRecoverableAmountAndFee(
    serializedHex: string,
    txHexLength: number,
    balance: string,
    tokenBalance?: string
  ): Promise<Record<string, string>> {
    const estimatedFee = await this.getTransactionFeeEstimation({
      txHex: serializedHex,
      txHexLength: txHexLength,
    });
    const balanceBN = new BigNumber(balance);
    const feeBN = new BigNumber(estimatedFee);
    if (balanceBN.isLessThan(feeBN)) {
      throw new Error('insufficient balance to build the transaction');
    }
    return {
      recoverableAmount: tokenBalance ?? balanceBN.minus(feeBN).toString(),
      fee: feeBN.toString(),
    };
  }

  /**
   * Method to find the right builder for token or native coin transfer
   * @param {String} contractAddress - token contract address
   * @param {String} contractName - token contract name
   * @returns {TransferBuilder|FungibleTokenTransferBuilder}
   */
  protected getTokenOrNativeTransferBuilder(
    contractAddress?: string,
    contractName?: string
  ): TransferBuilder | FungibleTokenTransferBuilder {
    const isToken = !!contractAddress && !!contractName;
    let factory: TransactionBuilderFactory;
    if (isToken) {
      const tokenName = findTokenNameByContract(contractAddress, contractName);
      if (!tokenName) {
        throw new Error('invalid contract address or contract name, not supported');
      }
      factory = new TransactionBuilderFactory(coins.get(tokenName));
    } else {
      factory = new TransactionBuilderFactory(coins.get(this.getChain()));
    }
    let builder: TransferBuilder | FungibleTokenTransferBuilder;
    if (isToken) {
      builder = factory.getFungibleTokenTransferBuilder();
    } else {
      builder = factory.getTransferBuilder();
    }
    return builder;
  }

  /**
   * Method to build fungible token transfer transaction
   * @param {FungibleTokenTransferBuilder} builder - fungible token transfer builder
   * @param {String} contractAddress - token contract address
   * @param {String} contractName - token contract name
   * @param {String[]} pubs - account public keys
   * @param {Number} nonce - account nonce
   * @param {AddressDetails} rootAddressDetails - root address details
   * @param {AddressDetails} destinationAddressDetails - receive address details
   * @param {String} stxBalance - native stx balance
   * @returns {Promise<BaseTransaction>} - built transaction
   */
  protected async buildTokenTransferTransaction({
    builder,
    contractAddress,
    contractName,
    pubs,
    nonce,
    rootAddressDetails,
    destinationAddressDetails,
    stxBalance,
  }: {
    builder: FungibleTokenTransferBuilder;
    contractAddress: string;
    contractName: string;
    pubs: string[];
    nonce: number;
    rootAddressDetails: AddressDetails;
    destinationAddressDetails: AddressDetails;
    stxBalance: string;
  }): Promise<BaseTransaction> {
    const txBuilder = builder as FungibleTokenTransferBuilder;
    const contractTokenName = findContractTokenNameUsingContract(contractAddress, contractName);
    if (!contractTokenName) {
      throw new Error('invalid contract address or contract name, not supported');
    }
    const assetId = `${contractAddress}.${contractName}::${contractTokenName}`;
    // fetch the token balance
    const tokenBalanceData = await this.getSingleFungibleTokenBalanceFromNode({
      address: rootAddressDetails.address,
      assetId,
    });
    const tokenBalance = tokenBalanceData?.balance;
    if (!Number(tokenBalance) || isNaN(Number(tokenBalance))) {
      throw new Error(
        `no token balance found to recover for address: ${rootAddressDetails.address}, token: ${assetId}`
      );
    }
    txBuilder.fee({ fee: '200' });
    txBuilder.numberSignatures(2);
    txBuilder.fromPubKey(pubs);
    txBuilder.nonce(nonce);
    txBuilder.contractAddress(contractAddress);
    txBuilder.contractName(contractName);
    if (contractTokenName) {
      txBuilder.tokenName(contractTokenName);
    }
    txBuilder.functionName('transfer');
    const functionArgs: ClarityValue[] = [
      uintCV(tokenBalance),
      standardPrincipalCV(rootAddressDetails.address),
      standardPrincipalCV(destinationAddressDetails.address),
    ];
    if (destinationAddressDetails.memoId) {
      functionArgs.push(someCV(bufferCVFromString(destinationAddressDetails.memoId)));
    } else {
      functionArgs.push(noneCV());
    }
    txBuilder.functionArgs(functionArgs);
    const baseTxn = await txBuilder.build();
    const txBroadcastFormat = baseTxn.toBroadcastFormat();
    const txDeserialized = deserializeTransaction(txBroadcastFormat);
    const serializedHex = serializePayload(txDeserialized.payload).toString('hex');
    const { recoverableAmount, fee } = await this.getRecoverableAmountAndFee(
      serializedHex,
      txBroadcastFormat.length,
      stxBalance,
      tokenBalance
    );
    functionArgs[0] = uintCV(recoverableAmount);
    txBuilder.functionArgs(functionArgs);
    txBuilder.fee({ fee: fee });
    return await txBuilder.build();
  }

  /**
   * Method to build native transfer transaction
   * @param {TransferBuilder} builder - transfer builder
   * @param {String[]} pubs - account public keys
   * @param {Number} nonce - account nonce
   * @param {AddressDetails} destinationAddressDetails - receive address details
   * @param {String} stxBalance - native stx balance
   * @returns {Promise<BaseTransaction>} - built transaction
   */
  protected async buildNativeTransferTransaction({
    builder,
    pubs,
    nonce,
    destinationAddressDetails,
    stxBalance,
  }: {
    builder: TransferBuilder;
    pubs: string[];
    nonce: number;
    destinationAddressDetails: AddressDetails;
    stxBalance: string;
  }): Promise<BaseTransaction> {
    const txBuilder = builder as TransferBuilder;
    txBuilder.fee({ fee: '200' });
    txBuilder.numberSignatures(2);
    txBuilder.fromPubKey(pubs);
    txBuilder.nonce(nonce);
    txBuilder.to(destinationAddressDetails.address);
    txBuilder.amount(stxBalance);
    if (destinationAddressDetails.memoId) {
      txBuilder.memo(destinationAddressDetails.memoId);
    }
    const baseTxn = await txBuilder.build();
    const txBroadcastFormat = baseTxn.toBroadcastFormat();
    const txDeserialized = deserializeTransaction(txBroadcastFormat);
    const serializedHex = serializePayload(txDeserialized.payload).toString('hex');
    const { recoverableAmount, fee } = await this.getRecoverableAmountAndFee(
      serializedHex,
      txBroadcastFormat.length,
      stxBalance
    );
    txBuilder.amount(recoverableAmount);
    txBuilder.fee({ fee: fee });
    return await txBuilder.build();
  }

  /**
   * Method that uses appropriate builder and builds transaction depending on token or native coin
   * @param {String[]} pubs - public keys
   * @param {AddressDetails} rootAddressDetails - sender address detail
   * @param {AddressDetails} destinationAddressDetails - receiver address detail
   * @param {Number} nonce - wallet nonce
   * @param {String} balance - wallet balance
   * @param {String | undefined} contractAddress - token contract address
   * @param {String | undefined} contractName - token contract name
   * @returns {Promise<BaseTransaction>} built transaction
   */
  protected async getNativeOrTokenTransaction({
    pubs,
    rootAddressDetails,
    destinationAddressDetails,
    nonce,
    stxBalance,
    contractAddressInput,
    contractName,
  }: {
    pubs: string[];
    rootAddressDetails: AddressDetails;
    destinationAddressDetails: AddressDetails;
    nonce: number;
    stxBalance: string;
    contractAddressInput?: string;
    contractName?: string;
  }): Promise<{ tx: BaseTransaction; builder: TransferBuilder | FungibleTokenTransferBuilder }> {
    const builder = this.getTokenOrNativeTransferBuilder(contractAddressInput, contractName);
    const contractAddress = contractAddressInput?.toUpperCase();
    const isToken = !!contractAddress && !!contractName;
    let finalTx: BaseTransaction;
    if (isToken) {
      finalTx = await this.buildTokenTransferTransaction({
        builder: builder as FungibleTokenTransferBuilder,
        contractAddress,
        contractName,
        pubs,
        nonce,
        rootAddressDetails,
        destinationAddressDetails,
        stxBalance,
      });
    } else {
      finalTx = await this.buildNativeTransferTransaction({
        builder: builder as TransferBuilder,
        pubs,
        nonce,
        destinationAddressDetails,
        stxBalance,
      });
    }
    return {
      tx: finalTx,
      builder: builder,
    };
  }

  /**
   * Method to recover native stx or sip10 tokens from bitgo hot & cold wallets
   * @param {String} params.backupKey - encrypted wallet backup key (public or private)
   * @param {String} params.userKey - encrypted wallet user key (public or private)
   * @param {String} params.rootAddress - wallet root address
   * @param {String} params.recoveryDestination - receive address
   * @param {String} params.bitgoKey - encrypted bitgo public key
   * @param {String} params.walletPassphrase - wallet password
   * @param {String} params.contractId - contract id of the token (mandatory for token recovery)
   * @returns {Promise<RecoveryInfo|RecoveryTransaction>} RecoveryTransaction.txHex - hex of serialized transaction (signed or unsigned)
   */
  async recover(params: RecoveryOptions): Promise<RecoveryInfo | RecoveryTransaction> {
    if (!this.isValidAddress(params.rootAddress)) {
      throw new Error('invalid root address!');
    }
    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid destination address!');
    }
    let contractAddress: string | undefined;
    let contractName: string | undefined;
    if (params.contractId) {
      [contractAddress, contractName] = params.contractId.split('.');
      if ((contractAddress && !contractName) || (contractName && !contractAddress)) {
        throw new Error('invalid contract id, please provide it in the form (contractAddress.contractName)');
      }
    }
    const isUnsignedSweep = getIsUnsignedSweep(params);
    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: true });
    const rootAddressDetails = getAddressDetails(params.rootAddress);
    const [accountBalanceData, accountNonceData] = await Promise.all([
      this.getNativeStxBalanceFromNode({ address: rootAddressDetails.address }),
      this.getAccountNonceFromNode({ address: rootAddressDetails.address }),
    ]);
    const balance = Number(accountBalanceData.balance);
    if (!balance || isNaN(balance)) {
      throw new Error('could not find any balance to recover for ' + params.rootAddress);
    }
    const userPub = publicKeyFromBuffer(keys[0].publicKey);
    const backupPub = publicKeyFromBuffer(keys[1].publicKey);
    const bitgoPubKey = publicKeyFromBuffer(keys[2].publicKey);
    const pubs = [publicKeyToString(userPub), publicKeyToString(backupPub), publicKeyToString(bitgoPubKey)];

    const destinationAddressDetails = getAddressDetails(params.recoveryDestination);
    const nonce =
      typeof accountNonceData?.last_executed_tx_nonce === 'number' ? accountNonceData.last_executed_tx_nonce + 1 : 0;

    const { tx, builder } = await this.getNativeOrTokenTransaction({
      pubs,
      rootAddressDetails,
      destinationAddressDetails,
      nonce,
      stxBalance: accountBalanceData.balance,
      contractAddressInput: contractAddress,
      contractName: contractName,
    });

    if (isUnsignedSweep) {
      return await this.formatForOfflineVault(tx);
    }
    // check the private key & sign
    if (!keys[0].privateKey) {
      throw new Error(`userKey is not a private key`);
    }
    const userKey = createStacksPrivateKey(keys[0].privateKey);
    builder.sign({ key: privateKeyToString(userKey) });

    const halfSignedTx = await builder.build();
    const txHexHalfSigned = halfSignedTx.toBroadcastFormat();
    const builder2 = this.getTokenOrNativeTransferBuilder(contractAddress, contractName);
    builder2.from(txHexHalfSigned);

    if (!keys[1].privateKey) {
      throw new Error(`backupKey is not a private key`);
    }
    const backupKey = createStacksPrivateKey(keys[1].privateKey);
    builder2.sign({ key: privateKeyToString(backupKey) });

    const fullySignedTx = await builder2.build();
    const fullySignedTxHex = fullySignedTx.toBroadcastFormat();

    return {
      txHex: fullySignedTxHex,
    };
  }
}
