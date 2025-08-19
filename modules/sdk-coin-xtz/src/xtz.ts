import {
  BaseCoin,
  BaseTransactionBuilder,
  BitGoBase,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  KeyPair as SdkCoreKeyPair,
  SignedTransaction,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  MultisigType,
  multisigTypes,
  AuditDecryptedKeyParams,
  common,
  TransactionType,
} from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/secp256k1';
import { CoinFamily, coins, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Interface, KeyPair, TransactionBuilder, Utils } from './lib';
import { RecoverOptions } from './lib/iface';
import {
  generateDataToSign,
  isValidOriginatedAddress,
  TRANSACTION_FEE,
  TRANSACTION_GAS_LIMIT,
  TRANSACTION_STORAGE_LIMIT,
} from './lib/utils';
import request from 'superagent';
export class Xtz extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Xtz(bitgo, staticsCoin);
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

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Xtz supports transfers to consolidate balance from receive address to the wallet contract
   */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return Utils.isValidAddress(address);
  }

  /**
   * Generate Tezos key pair - BitGo xpub format
   *
   * @param seed
   * @returns {Object} object with generated xpub, xprv
   */
  generateKeyPair(seed?: Buffer): SdkCoreKeyPair {
    const keyPair = seed ? new KeyPair({ seed }) : new KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }

    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams } = params;
    if (Array.isArray(txParams.recipients) && txParams.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }
    return true;
  }

  /**
   * Derive a user key using the chain path of the address
   * @param key
   * @param path
   * @returns {string} derived private key
   */
  deriveKeyWithPath({ key, path }: { key: string; path: string }): string {
    const keychain = bip32.fromBase58(key);
    const derivedKeyNode = keychain.derivePath(path);
    return derivedKeyNode.toBase58();
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: Interface.XtzSignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = new TransactionBuilder(coins.get(this.getChain()));
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.source(params.txPrebuild.source);
    if (params.txPrebuild.dataToSign) {
      txBuilder.overrideDataToSign({ dataToSign: params.txPrebuild.dataToSign });
    }
    // The path /0/0/0/0 is used by the wallet base address
    // Derive the user key only if the transaction is sent from a receive address
    let key;
    const { chain, index } = params.txPrebuild.addressInfo;
    if (chain === 0 && index === 0) {
      key = params.prv;
    } else {
      const derivationPath = `0/0/${chain}/${index}`;
      key = this.deriveKeyWithPath({ key: params.prv, path: derivationPath });
    }
    txBuilder.sign({ key });

    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid messaged passed to signMessage');
    }
    const response = {
      txHex: transaction.toBroadcastFormat(),
    };
    return transaction.signature.length >= 2 ? response : { halfSigned: response };
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: SdkCoreKeyPair, message: string | Buffer): Promise<Buffer> {
    const keyPair = new KeyPair({ prv: key.prv });
    const messageHex =
      message instanceof Buffer ? message.toString('hex') : Buffer.from(message as string, 'utf-8').toString('hex');
    const signatureData = await Utils.sign(keyPair, messageHex);
    return Buffer.from(signatureData.sig);
  }
  /**
   * Method to validate recovery params
   * @param {RecoverOptions} params
   * @returns {void}
   */
  validateRecoveryParams(params: RecoverOptions): void {
    if (params.userKey === undefined) {
      throw new Error('missing userKey');
    }

    if (params.backupKey === undefined) {
      throw new Error('missing backupKey');
    }

    if (!params.isUnsignedSweep && params.walletPassphrase === undefined && !params.userKey.startsWith('xpub')) {
      throw new Error('missing wallet passphrase');
    }

    if (params.walletContractAddress === undefined || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (params.recoveryDestination === undefined || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
  }

  /**
   * Make a query to blockchain explorer for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @param apiKey {string} optional API key to use instead of the one from the environment
   * @returns {Object} response from the blockchain explorer
   */
  async recoveryBlockchainExplorerQuery(
    params: {
      actionPath: string;
      address?: string;
      action?: string;
    },
    apiKey?: string
  ): Promise<unknown> {
    const response = await request.get(
      `${common.Environments[this.bitgo.getEnv()].xtzExplorerBaseUrl}/v1/${params.actionPath}${
        params.address ? '/' + params.address : ''
      }${params.action ? '/' + params.action : ''}${apiKey ? `?apikey=${apiKey}` : ''}`
    );

    if (!response.ok) {
      throw new Error('could not reach TZKT');
    }

    if (response.status === 429) {
      throw new Error('TZKT rate limit reached');
    }
    return response.body;
  }

  /**
   * Queries public block explorer to get the next XTZ address details
   * @param {string} address
   * @param {string} apiKey - optional API key to use instead of the one from the environment
   * @returns {Promise<any>}
   */
  async getAddressDetails(address: string, apiKey?: string): Promise<any> {
    const result = await this.recoveryBlockchainExplorerQuery(
      {
        actionPath: 'accounts',
        address,
      },
      apiKey
    );

    if (!result) {
      throw new Error(`Unable to find details for ${address}`);
    }
    return result;
  }

  /**
   * Query explorer for the balance of an address
   * @param {String} address - the XTZ base/receive address
   * @param {String} apiKey - optional API key to use instead of the one from the environment
   * @returns {BigNumber} address balance
   */
  async queryAddressBalance(address: string, apiKey?: string): Promise<any> {
    const result: any = await this.recoveryBlockchainExplorerQuery(
      {
        actionPath: isValidOriginatedAddress(address) ? 'contracts' : 'accounts',
        address,
      },
      apiKey
    );
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.balance) {
      throw new Error(`Could not obtain address balance for ${address} from the explorer`);
    }
    return new BigNumber(result.balance, 10);
  }

  /**
   * Generate and pack the data to sign for each transfer.
   *
   * @param {String} contractAddress Wallet address to withdraw funds from
   * @param {String} contractCounter Wallet internal counter
   * @param {String} destination Tezos address to send the funds to
   * @param {String} amount Number of mutez to move
   * @param {IMSClient} imsClient Existing IMS client connection to reuse
   * @return {String} data to sign in hex format
   */
  async packDataToSign(contractAddress, contractCounter, destination, amount) {
    const dataToSign = generateDataToSign(contractAddress, destination, amount, contractCounter);
    const xtzRpcUrl = `${
      common.Environments[this.bitgo.getEnv()].xtzRpcUrl
    }/chains/main/blocks/head/helpers/scripts/pack_data`;

    if (!xtzRpcUrl) {
      throw new Error('XTZ RPC url not found');
    }

    const response = await request.post(xtzRpcUrl).send(dataToSign);
    if (response.status === 404) {
      throw new Error(`unable to pack data to sign ${response.status}: ${response.body.error.message}`);
    } else if (response.status !== 200) {
      throw new Error(`unexpected IMS response status ${response.status}: ${response.body.error.message}`);
    }
    return response.body.packed;
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params
   */
  async recover(params: RecoverOptions): Promise<unknown> {
    this.validateRecoveryParams(params);

    // Clean up whitespace from entered values

    const backupKey = params.backupKey.replace(/\s/g, '');

    const userAddressDetails = await this.getAddressDetails(params.walletContractAddress, params.apiKey);

    if (!userAddressDetails) {
      throw new Error('Unable to fetch user address details');
    }

    // Decrypt backup private key and get address
    let backupPrv;

    try {
      backupPrv = this.bitgo.decrypt({
        input: backupKey,
        password: params.walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${e.message}`);
    }
    const keyPair = new KeyPair({ prv: backupPrv });
    const backupSigningKey = keyPair.getKeys().prv;
    if (!backupSigningKey) {
      throw new Error('no private key');
    }
    const backupKeyAddress = keyPair.getAddress();

    const backupAddressDetails = await this.getAddressDetails(backupKeyAddress, params.apiKey || '');

    if (!backupAddressDetails.counter || !backupAddressDetails.balance) {
      throw new Error(`Missing required detail(s): counter, balance`);
    }
    const backupKeyNonce = new BigNumber(backupAddressDetails.counter + 1, 10);

    // get balance of backupKey to ensure funds are available to pay fees
    const backupKeyBalance = new BigNumber(backupAddressDetails.balance, 10);

    const gasLimit = isValidOriginatedAddress(params.recoveryDestination)
      ? TRANSACTION_GAS_LIMIT.CONTRACT_TRANSFER
      : TRANSACTION_GAS_LIMIT.TRANSFER;
    const gasPrice = TRANSACTION_FEE.TRANSFER;

    // Checking whether back up key address has sufficient funds for transaction
    if (backupKeyBalance.lt(gasPrice)) {
      const weiToGwei = 10 ** 6;
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(
          backupKeyBalance.toNumber() / weiToGwei
        ).toString()} Gwei.` +
          `This address must have a balance of at least ${(gasPrice / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some funds to this address then retry.`
      );
    }

    // get balance of sender address
    if (!userAddressDetails.balance || userAddressDetails.balance === 0) {
      throw new Error('No funds to recover from source address');
    }
    const txAmount = userAddressDetails.balance;
    if (new BigNumber(txAmount).isLessThanOrEqualTo(0)) {
      throw new Error('Wallet does not have enough funds to recover');
    }

    const feeInfo = {
      fee: new BigNumber(TRANSACTION_FEE.TRANSFER),
      gasLimit: new BigNumber(gasLimit),
      storageLimit: new BigNumber(TRANSACTION_STORAGE_LIMIT.TRANSFER),
    };

    const txBuilder = new TransactionBuilder(coins.get(this.getChain()));

    txBuilder.type(TransactionType.Send);
    txBuilder.source(backupKeyAddress);

    // Used to set the branch for the transaction
    const chainHead: any = await this.recoveryBlockchainExplorerQuery({
      actionPath: 'head',
    });

    if (!chainHead || !chainHead.hash) {
      throw new Error('Unable to fetch chain head');
    }
    txBuilder.branch(chainHead.hash);

    if (!backupAddressDetails.revealed) {
      feeInfo.fee = feeInfo.fee.plus(TRANSACTION_FEE.REVEAL);
      feeInfo.gasLimit = feeInfo.gasLimit.plus(TRANSACTION_GAS_LIMIT.REVEAL);
      feeInfo.storageLimit = feeInfo.storageLimit.plus(TRANSACTION_STORAGE_LIMIT.REVEAL);
      backupKeyNonce.plus(1);
      const publicKeyToReveal = keyPair.getKeys();
      txBuilder.publicKeyToReveal(publicKeyToReveal.pub);
    }

    txBuilder.counter(backupKeyNonce.toString());

    const packedDataToSign = await this.packDataToSign(
      params.walletContractAddress,
      backupKeyNonce.toString(),
      params.recoveryDestination,
      txAmount?.toString()
    );

    txBuilder
      .transfer(txAmount?.toString())
      .from(params.walletContractAddress)
      .to(params.recoveryDestination)
      .counter(backupKeyNonce.toString())
      .fee(TRANSACTION_FEE.TRANSFER.toString())
      .storageLimit(TRANSACTION_STORAGE_LIMIT.TRANSFER.toString())
      .gasLimit(gasLimit.toString())
      .dataToSign(packedDataToSign);

    txBuilder.sign({ key: backupSigningKey });
    const signedTx = await txBuilder.build();

    return {
      id: signedTx.id,
      tx: signedTx.toBroadcastFormat(),
    };
  }

  /**
   * Explain a Tezos transaction from txHex
   * @param params
   */
  async explainTransaction(params: Interface.ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = new TransactionBuilder(coins.get(this.getChain()));
    // Newer coins can return BaseTransactionBuilderFactory instead of BaseTransactionBuilder
    if (!(txBuilder instanceof BaseTransactionBuilder)) {
      throw new Error('getBuilder() did not return an BaseTransactionBuilder object. Has it been updated?');
    }
    txBuilder.from(txHex);
    const tx = await txBuilder.build();

    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];

    return {
      displayOrder,
      id: tx.id,
      outputs: tx.outputs,
      outputAmount: tx.outputs
        .reduce((accumulator, output) => accumulator.plus(output.value), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
    } as any;
  }

  isValidPub(pub: string): boolean {
    return Utils.isValidPublicKey(pub);
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams) {
    throw new MethodNotImplementedError();
  }
}
