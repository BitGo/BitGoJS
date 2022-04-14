/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import * as bip32 from 'bip32';
import * as Keccak from 'keccak';
import * as secp256k1 from 'secp256k1';
import * as _ from 'lodash';
import {
  BaseCoin,
  FeeEstimateOptions,
  FullySignedTransaction,
  HalfSignedAccountTransaction,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  PresignTransactionOptions as BasePresignTransactionOptions,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionFee,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
  TransactionRecipient,
  TransactionParams,
} from '../baseCoin';
import { BitGo } from '../../bitgo';
import { InvalidAddressError, MethodNotImplementedError } from '../../errors';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { getBuilder, Eth, AvaxC as AvaxCAccountLib } from '@bitgo/account-lib';
import { common } from '@bitgo/sdk-core';

import { optionalDeps } from './eth';
import { Wallet } from '../wallet';

// For precreateBitgo
interface PrecreateBitGoOptions {
  enterprise?: string;
  newFeeAddress?: string;
}

// For explainTransaction
export interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string;
  };
  feeInfo: TransactionFee;
}

interface AvaxcTransactionParams extends TransactionParams {
  gasPrice?: number;
  gasLimit?: number;
  hopParams?: HopParams;
  hop?: boolean;
}

interface VerifyAvaxcTransactionOptions extends VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  txParams: AvaxcTransactionParams;
}

// For preSign
interface PresignTransactionOptions extends TransactionPrebuild, BasePresignTransactionOptions {
  wallet: Wallet;
}

interface EIP1559 {
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  hopTransaction?: HopPrebuild;
  buildParams: {
    recipients: Recipient[];
  };
  recipients: TransactionRecipient[];
  nextContractSequenceId: string;
  gasPrice: number;
  gasLimit: number;
  isBatch: boolean;
  coin: string;
  token?: string;
}

// For createHopTransactionParams
interface HopTransactionBuildOptions {
  wallet: Wallet;
  recipients: Recipient[];
  walletPassphrase: string;
}

interface Recipient {
  address: string;
  amount: string;
  data?: string;
}

// For getExtraPrebuildParams
interface BuildOptions {
  hop?: boolean;
  wallet?: Wallet;
  recipients?: Recipient[];
  walletPassphrase?: string;
  [index: string]: unknown;
}

// For FeeEstimate
interface FeeEstimate {
  gasLimitEstimate: number;
  feeEstimate: number;
}

/**
 * The extra parameters to send to platform build route for hop transactions
 */
interface HopParams {
  hopParams: {
    gasPriceMax: number;
    userReqSig: string;
    paymentId: string;
  };
  gasLimit: number;
}

/**
 * The prebuilt hop transaction returned from the HSM
 */
interface HopPrebuild {
  tx: string;
  id: string;
  signature: string;
  paymentId: string;
  gasPrice: number;
  gasLimit: number;
  amount: number;
  recipient: string;
  nonce: number;
  userReqSig: string;
  gasPriceMax: number;
}

// For txPreBuild
export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface EthTransactionFee {
  fee: string;
  gasLimit?: string;
}

export interface TxPreBuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  feeInfo: EthTransactionFee;
  source: string;
  dataToSign: string;
  nextContractSequenceId?: string;
  expireTime?: number;
  hopTransaction?: string;
  eip1559?: EIP1559;
}

// For signTransaction
export interface AvaxSignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TxPreBuild;
  prv: string;
}

export interface HalfSignedTransaction extends HalfSignedAccountTransaction {
  halfSigned: {
    txHex?: never;
    recipients: Recipient[];
    expiration?: number;
    eip1559?: EIP1559;
  };
}

export type SignedTransaction = HalfSignedTransaction | FullySignedTransaction;

export class AvaxC extends BaseCoin {
  static hopTransactionSalt = 'bitgoHopAddressRequestSalt';

  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxC(bitgo, staticsCoin);
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getChain() {
    return this._staticsCoin.name;
  }

  /**
   * Get the base chain that the coin exists on.
   */
  getBaseChain() {
    return this.getChain();
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  valuelessTransferAllowed(): boolean {
    return true;
  }

  isValidAddress(address: string): boolean {
    return !!address && AvaxCAccountLib.Utils.isValidEthAddress(address);
  }

  isToken(): boolean {
    return false;
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const avaxKeyPair = seed ? new AvaxCAccountLib.KeyPair({ seed }) : new AvaxCAccountLib.KeyPair();
    const extendedKeys = avaxKeyPair.getExtendedKeys();
    return {
      pub: extendedKeys.xpub,
      prv: extendedKeys.xprv!,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  verifyAddress({ address }: VerifyAddressOptions): boolean {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }
    return true;
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param params
   * @param params.txParams params object passed to send
   * @param params.txPrebuild prebuild object returned by server
   * @param params.wallet Wallet object to obtain keys to verify against
   * @returns {boolean}
   */
  async verifyTransaction(params: VerifyAvaxcTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;
    if (!txParams?.recipients || !txPrebuild?.recipients || !wallet) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }
    if (txPrebuild.recipients.length !== 1) {
      throw new Error(`txPrebuild should only have 1 recipient but ${txPrebuild.recipients.length} found`);
    }
    if (txParams.hop && txPrebuild.hopTransaction) {
      // Check recipient amount for hop transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`hop transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }

      // Check tx sends to hop address
      const decodedHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(
        optionalDeps.ethUtil.toBuffer(txPrebuild.hopTransaction.tx)
      );
      const expectedHopAddress = optionalDeps.ethUtil.stripHexPrefix(decodedHopTx.getSenderAddress().toString());
      const actualHopAddress = optionalDeps.ethUtil.stripHexPrefix(txPrebuild.recipients[0].address);
      if (expectedHopAddress.toLowerCase() !== actualHopAddress.toLowerCase()) {
        throw new Error('recipient address of txPrebuild does not match hop address');
      }

      // Convert TransactionRecipient array to Recipient array
      const recipients: Recipient[] = txParams.recipients.map((r) => {
        return {
          address: r.address,
          amount: typeof r.amount === 'number' ? r.amount.toString() : r.amount,
        };
      });

      // Check destination address and amount
      await this.validateHopPrebuild(wallet, txPrebuild.hopTransaction, { recipients });
    } else if (txParams.recipients.length > 1) {
      // Check total amount for batch transaction
      let expectedTotalAmount = new BigNumber(0);
      for (let i = 0; i < txParams.recipients.length; i++) {
        expectedTotalAmount = expectedTotalAmount.plus(txParams.recipients[i].amount);
      }
      if (!expectedTotalAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'batch transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
    } else {
      // Check recipient address and amount for normal transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`normal transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }
      const expectedAmount = new BigNumber(txParams.recipients[0].amount);
      if (!expectedAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
      if (
        AvaxC.isAVAXCAddress(txParams.recipients[0].address) &&
        txParams.recipients[0].address !== txPrebuild.recipients[0].address
      ) {
        throw new Error('destination address in normal txPrebuild does not match that in txParams supplied by client');
      }
    }
    // Check coin is correct for all transaction types
    if (!this.verifyCoin(txPrebuild)) {
      throw new Error(`coin in txPrebuild did not match that in txParams supplied by client`);
    }
    return true;
  }

  private static isAVAXCAddress(address: string): boolean {
    return !!address.match(/0x[a-fA-F0-9]{40}/);
  }

  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.getChain();
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new AvaxCAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params The options with which to recover
   */
  async recover(params: any): Promise<any> {
    throw new MethodNotImplementedError();
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): Eth.TransactionBuilder {
    return getBuilder(this.getBaseChain()) as Eth.TransactionBuilder;
  }

  /**
   * Explain a transaction from txHex, overriding BaseCoins
   * @param params The options with which to explain the transaction
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    const outputs = tx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });

    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];

    return {
      displayOrder,
      id: tx.id,
      outputs: outputs,
      outputAmount: outputs
        .reduce((accumulator, output) => accumulator.plus(output.amount), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
    };
  }

  /**
   * Above is standard BaseCoins functions
   * ================================================================================================================
   * ================================================================================================================
   * Below is transaction functions
   */

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   * @param params
   */
  async presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction);
    }
    return params;
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  async postProcessPrebuild(params: TransactionPrebuild): Promise<TransactionPrebuild> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction, params.buildParams);
    }
    return params;
  }

  /**
   * Validates that the hop prebuild from the HSM is valid and correct
   * @param wallet The wallet that the prebuild is for
   * @param hopPrebuild The prebuild to validate
   * @param originalParams The original parameters passed to prebuildTransaction
   * @returns void
   * @throws Error if The prebuild is invalid
   */
  async validateHopPrebuild(
    wallet: Wallet,
    hopPrebuild: HopPrebuild,
    originalParams?: { recipients: Recipient[] }
  ): Promise<void> {
    const { tx, id, signature } = hopPrebuild;

    // first, validate the HSM signature
    const serverXpub = common.Environments[this.bitgo.getEnv()].hsmXpub;
    const serverPubkeyBuffer: Buffer = bip32.fromBase58(serverXpub).publicKey;
    const signatureBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(signature), 'hex');
    const messageBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(id), 'hex');

    const sig = new Uint8Array(signatureBuffer.slice(1));
    const isValidSignature: boolean = secp256k1.ecdsaVerify(sig, messageBuffer, serverPubkeyBuffer);
    if (!isValidSignature) {
      throw new Error(`Hop txid signature invalid`);
    }

    const builtHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(optionalDeps.ethUtil.toBuffer(tx));
    // If original params are given, we can check them against the transaction prebuild params
    if (!_.isNil(originalParams)) {
      const { recipients } = originalParams;

      // Then validate that the tx params actually equal the requested params
      const originalAmount = new BigNumber(recipients[0].amount);
      const originalDestination: string = recipients[0].address;

      const hopAmount = new BigNumber(optionalDeps.ethUtil.bufferToHex(<Buffer>builtHopTx.value));
      if (!builtHopTx.to) {
        throw new Error(`Transaction does not have a destination address`);
      }
      const hopDestination = builtHopTx.to.toString();
      if (!hopAmount.eq(originalAmount)) {
        throw new Error(`Hop amount: ${hopAmount} does not equal original amount: ${originalAmount}`);
      }
      if (hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
        throw new Error(`Hop destination: ${hopDestination} does not equal original recipient: ${hopDestination}`);
      }
    }

    if (!builtHopTx.verifySignature()) {
      // We dont want to continue at all in this case, at risk of AVAX being stuck on the hop address
      throw new Error(`Invalid hop transaction signature, txid: ${id}`);
    }
    if (optionalDeps.ethUtil.addHexPrefix(builtHopTx.hash().toString('hex')) !== id) {
      throw new Error(`Signed hop txid does not equal actual txid`);
    }
  }

  /**
   * Assemble half-sign prebuilt transaction
   * @param params
   */
  async signTransaction(params: AvaxSignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new AvaxCAccountLib.KeyPair({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      txHex: transaction.toBroadcastFormat(),
      recipients: recipients,
      expiration: params.txPrebuild.expireTime,
      hopTransaction: params.txPrebuild.hopTransaction,
    };

    return { halfSigned: txParams };
  }

  /**
   * Modify prebuild before sending it to the server. Add things like hop transaction params
   * @param buildParams The whitelisted parameters for this prebuild
   * @param buildParams.hop True if this should prebuild a hop tx, else false
   * @param buildParams.recipients The recipients array of this transaction
   * @param buildParams.wallet The wallet sending this tx
   * @param buildParams.walletPassphrase the passphrase for this wallet
   */
  async getExtraPrebuildParams(buildParams: BuildOptions): Promise<BuildOptions> {
    if (
      !_.isUndefined(buildParams.hop) &&
      buildParams.hop &&
      !_.isUndefined(buildParams.wallet) &&
      !_.isUndefined(buildParams.recipients) &&
      !_.isUndefined(buildParams.walletPassphrase)
    ) {
      if (this.isToken()) {
        throw new Error(
          `Hop transactions are not enabled for AVAXC tokens, nor are they necessary. Please remove the 'hop' parameter and try again.`
        );
      }
      return (await this.createHopTransactionParams({
        wallet: buildParams.wallet,
        recipients: buildParams.recipients,
        walletPassphrase: buildParams.walletPassphrase,
      })) as any;
    }
    return {};
  }

  /**
   * Creates the extra parameters needed to build a hop transaction
   * @param buildParams The original build parameters
   * @returns extra parameters object to merge with the original build parameters object and send to the platform
   */
  async createHopTransactionParams(buildParams: HopTransactionBuildOptions): Promise<HopParams> {
    const wallet = buildParams.wallet;
    const recipients = buildParams.recipients;
    const walletPassphrase = buildParams.walletPassphrase;

    const userKeychain = await this.keychains().get({ id: wallet.keyIds()[0] });
    const userPrv = wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });
    const userPrvBuffer = bip32.fromBase58(userPrv).privateKey;
    if (!userPrvBuffer) {
      throw new Error('invalid userPrv');
    }
    if (!recipients || !Array.isArray(recipients)) {
      throw new Error('expecting array of recipients');
    }

    // Right now we only support 1 recipient
    if (recipients.length !== 1) {
      throw new Error('must send to exactly 1 recipient');
    }
    const recipientAddress = recipients[0].address;
    const recipientAmount = recipients[0].amount;
    const feeEstimateParams = {
      recipient: recipientAddress,
      amount: recipientAmount,
      hop: true,
    };
    const feeEstimate: FeeEstimate = await this.feeEstimate(feeEstimateParams);

    const gasLimit = feeEstimate.gasLimitEstimate;
    const gasPrice = Math.round(feeEstimate.feeEstimate / gasLimit);
    const gasPriceMax = gasPrice * 5;
    // Payment id a random number so its different for every tx
    const paymentId = Math.floor(Math.random() * 10000000000).toString();
    const hopDigest: Buffer = AvaxC.getHopDigest([
      recipientAddress,
      recipientAmount,
      gasPriceMax.toString(),
      gasLimit.toString(),
      paymentId,
    ]);

    const userReqSig = optionalDeps.ethUtil.addHexPrefix(
      Buffer.from(secp256k1.ecdsaSign(hopDigest, userPrvBuffer).signature).toString('hex')
    );

    return {
      hopParams: {
        gasPriceMax,
        userReqSig,
        paymentId,
      },
      gasLimit,
    };
  }

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params The params passed into the function
   * @param {Boolean} [params.hop] True if we should estimate fee for a hop transaction
   * @param {String} [params.recipient] The recipient of the transaction to estimate a send to
   * @param {String} [params.data] The ETH tx data to estimate a send for
   * @returns {Object} The fee info returned from the server
   */
  async feeEstimate(params: FeeEstimateOptions): Promise<FeeEstimate> {
    const query: FeeEstimateOptions = {};
    if (params && params.hop) {
      query.hop = params.hop;
    }
    if (params && params.recipient) {
      query.recipient = params.recipient;
    }
    if (params && params.data) {
      query.data = params.data;
    }
    if (params && params.amount) {
      query.amount = params.amount;
    }

    return await this.bitgo.get(this.url('/tx/fee')).query(query).result();
  }

  /**
   * Gets the hop digest for the user to sign. This is validated in the HSM to prove that the user requested this tx
   * @param paramsArr The parameters to hash together for the digest
   */
  private static getHopDigest(paramsArr: string[]): Buffer {
    const hash = new Keccak('keccak256');
    hash.update([AvaxC.hopTransactionSalt, ...paramsArr].join('$'));
    return hash.digest();
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    // TODO: Fix this later
    return true;
  }

  /**
   * Ensure either enterprise or newFeeAddress is passed, to know whether to create new key or use enterprise key
   * @param params
   * @param params.enterprise {String} the enterprise id to associate with this key
   * @param params.newFeeAddress {Boolean} create a new fee address (enterprise not needed in this case)
   */
  preCreateBitGo(params: PrecreateBitGoOptions): void {
    // We always need params object, since either enterprise or newFeeAddress is required
    if (!_.isObject(params)) {
      throw new Error(`preCreateBitGo must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (_.isUndefined(params.enterprise) && _.isUndefined(params.newFeeAddress)) {
      throw new Error(
        'expecting enterprise when adding BitGo key. If you want to create a new AVAX bitgo key, set the newFeeAddress parameter to true.'
      );
    }

    // Check whether key should be an enterprise key or a BitGo key for a new fee address
    if (!_.isUndefined(params.enterprise) && !_.isUndefined(params.newFeeAddress)) {
      throw new Error(`Incompatible arguments - cannot pass both enterprise and newFeeAddress parameter.`);
    }

    if (!_.isUndefined(params.enterprise) && !_.isString(params.enterprise)) {
      throw new Error(`enterprise should be a string - got ${params.enterprise} (type ${typeof params.enterprise})`);
    }

    if (!_.isUndefined(params.newFeeAddress) && !_.isBoolean(params.newFeeAddress)) {
      throw new Error(
        `newFeeAddress should be a boolean - got ${params.newFeeAddress} (type ${typeof params.newFeeAddress})`
      );
    }
  }
}
