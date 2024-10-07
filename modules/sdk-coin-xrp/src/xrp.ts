/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as querystring from 'querystring';
import * as url from 'url';

import {
  BaseCoin,
  BitGoBase,
  checkKrsProvider,
  getBip32Keys,
  InvalidAddressError,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  promiseProps,
  TransactionExplanation,
  UnexpectedAddressError,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import * as rippleBinaryCodec from 'ripple-binary-codec';
import * as rippleKeypairs from 'ripple-keypairs';
import * as xrpl from 'xrpl';

import {
  ExplainTransactionOptions,
  FeeInfo,
  HalfSignedTransaction,
  RecoveryInfo,
  RecoveryOptions,
  RecoveryTransaction,
  SignTransactionOptions,
  SupplementGenerateWalletOptions,
  VerifyAddressOptions,
} from './lib/iface';
import { KeyPair as XrpKeyPair } from './lib/keyPair';
import utils from './lib/utils';
import ripple from './ripple';

export class Xrp extends BaseCoin {
  protected _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Xrp(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return this._staticsCoin.name;
  }

  /**
   * Identifier for the coin family
   */
  public getFamily(): string {
    return this._staticsCoin.family;
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return this._staticsCoin.fullName;
  }

  /**
   * Evaluates whether an address string is valid for this coin
   * @param address
   */
  public isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  public isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Get fee info from server
   */
  public async getFeeInfo(): Promise<FeeInfo> {
    return this.bitgo.get(this.url('/public/feeinfo')).result();
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns Bluebird<HalfSignedTransaction>
   */
  public async signTransaction({
    txPrebuild,
    prv,
    isLastSignature,
  }: SignTransactionOptions): Promise<HalfSignedTransaction | RecoveryTransaction> {
    if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
      if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
        throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
      }
      throw new Error('missing txPrebuild parameter');
    }

    if (_.isUndefined(prv) || !_.isString(prv)) {
      if (!_.isUndefined(prv) && !_.isString(prv)) {
        throw new Error(`prv must be a string, got type ${typeof prv}`);
      }
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!txPrebuild.txHex) {
      throw new Error(`missing txHex in txPrebuild`);
    }
    const signedTx = utils.signString(txPrebuild.txHex, prv);

    // Normally the SDK provides the first signature for an XRP tx, but occasionally it provides the final one as well
    // (recoveries)
    if (isLastSignature) {
      return { txHex: signedTx };
    }
    return { halfSigned: { txHex: signedTx } };
  }

  /**
   * Ripple requires additional parameters for wallet generation to be sent to the server. The additional parameters are
   * the root public key, which is the basis of the root address, two signed, and one half-signed initialization txs
   * @param walletParams
   * - rootPrivateKey: optional hex-encoded Ripple private key
   */
  async supplementGenerateWallet(
    walletParams: SupplementGenerateWalletOptions
  ): Promise<SupplementGenerateWalletOptions> {
    if (walletParams.rootPrivateKey) {
      if (walletParams.rootPrivateKey.length !== 64) {
        throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
      }
    } else {
      const keyPair = new XrpKeyPair().getKeys();
      if (!keyPair.prv) {
        throw new Error('no privateKey');
      }
      walletParams.rootPrivateKey = keyPair.prv;
    }
    return walletParams;
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions = {}): Promise<TransactionExplanation> {
    let transaction;
    let txHex: string = params.txHex || ((params.halfSigned && params.halfSigned.txHex) as string);
    if (!txHex) {
      throw new Error('missing required param txHex');
    }
    try {
      transaction = rippleBinaryCodec.decode(txHex);
    } catch (e) {
      try {
        transaction = JSON.parse(txHex);
        txHex = rippleBinaryCodec.encode(transaction);
      } catch (e) {
        throw new Error('txHex needs to be either hex or JSON string for XRP');
      }
    }
    let id: string;
    // hashes ids are different for signed and unsigned tx
    // first we try to get the hash id as if it is signed, will throw if its not
    try {
      id = xrpl.hashes.hashSignedTx(txHex);
    } catch (e) {
      id = xrpl.hashes.hashTx(txHex);
    }

    if (transaction.TransactionType == 'AccountSet') {
      return {
        displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'accountSet'],
        id: id,
        changeOutputs: [],
        outputAmount: 0,
        changeAmount: 0,
        outputs: [],
        fee: {
          fee: transaction.Fee,
          feeRate: null,
          size: txHex!.length / 2,
        },
        accountSet: {
          messageKey: transaction.MessageKey,
        },
      } as any;
    }

    const address =
      transaction.Destination + (transaction.DestinationTag >= 0 ? '?dt=' + transaction.DestinationTag : '');
    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'],
      id: id,
      changeOutputs: [],
      outputAmount: transaction.Amount,
      changeAmount: 0,
      outputs: [
        {
          address,
          amount: transaction.Amount,
        },
      ],
      fee: {
        fee: transaction.Fee,
        feeRate: null,
        size: txHex.length / 2,
      },
    } as any;
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   * @param txParams params object passed to send
   * @param txPrebuild prebuild object returned by server
   * @param wallet
   * @returns {boolean}
   */
  public async verifyTransaction({ txParams, txPrebuild }: VerifyTransactionOptions): Promise<boolean> {
    const explanation = await this.explainTransaction({
      txHex: txPrebuild.txHex,
    });

    const output = [...explanation.outputs, ...explanation.changeOutputs][0];
    const expectedOutput = txParams.recipients && txParams.recipients[0];

    const comparator = (recipient1, recipient2) => {
      if (recipient1.address !== recipient2.address) {
        return false;
      }
      const amount1 = new BigNumber(recipient1.amount);
      const amount2 = new BigNumber(recipient2.amount);
      return amount1.toFixed() === amount2.toFixed();
    };

    if (!comparator(output, expectedOutput)) {
      throw new Error('transaction prebuild does not match expected output');
    }

    return true;
  }

  /**
   * Check if address is a valid XRP address, and then make sure the root addresses match.
   * This prevents attacks where an attack may switch out the new address for one of their own
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   * @return true iff address is a wallet address (based on rootAddress)
   */
  public async isWalletAddress({ address, rootAddress }: VerifyAddressOptions): Promise<boolean> {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`address verification failure: address "${address}" is not valid`);
    }

    const addressDetails = utils.getAddressDetails(address);
    const rootAddressDetails = utils.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(
        `address validation failure: ${addressDetails.address} vs. ${rootAddressDetails.address}`
      );
    }

    return true;
  }

  /**
   * URL of a well-known, public facing (non-bitgo) rippled instance which can be used for recovery
   */
  public getRippledUrl(): string {
    return 'https://s1.ripple.com:51234';
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - rootAddress: root XRP wallet address to recover funds from
   * - userKey: [encrypted] xprv
   * - backupKey: [encrypted] xprv, or xpub if the xprv is held by a KRS provider
   * - walletPassphrase: necessary if one of the xprvs is encrypted
   * - bitgoKey: xpub
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   */
  public async recover(params: RecoveryOptions): Promise<RecoveryInfo | RecoveryTransaction> {
    const rippledUrl = this.getRippledUrl();
    const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
    const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

    const accountInfoParams = {
      method: 'account_info',
      params: [
        {
          account: params.rootAddress,
          strict: true,
          ledger_index: 'current',
          queue: true,
          signer_lists: true,
        },
      ],
    };

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider);
    }

    // Validate the destination address
    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });

    const { addressDetails, feeDetails, serverDetails } = await promiseProps({
      addressDetails: this.bitgo.post(rippledUrl).send(accountInfoParams),
      feeDetails: this.bitgo.post(rippledUrl).send({ method: 'fee' }),
      serverDetails: this.bitgo.post(rippledUrl).send({ method: 'server_info' }),
    });

    const openLedgerFee = new BigNumber(feeDetails.body.result.drops.open_ledger_fee);
    const baseReserve = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_base_xrp).times(
      this.getBaseFactor()
    );
    const reserveDelta = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_inc_xrp).times(
      this.getBaseFactor()
    );
    const currentLedger = serverDetails.body.result.info.validated_ledger.seq;
    const sequenceId = addressDetails.body.result.account_data.Sequence;
    const balance = new BigNumber(addressDetails.body.result.account_data.Balance);
    const signerLists = addressDetails.body.result.account_data.signer_lists;
    const accountFlags = addressDetails.body.result.account_data.Flags;

    // make sure there is only one signer list set
    if (signerLists.length !== 1) {
      throw new Error('unexpected set of signer lists');
    }

    // make sure the signers are user, backup, bitgo
    const userAddress = rippleKeypairs.deriveAddress(keys[0].publicKey.toString('hex'));
    const backupAddress = rippleKeypairs.deriveAddress(keys[1].publicKey.toString('hex'));

    const signerList = signerLists[0];
    if (signerList.SignerQuorum !== 2) {
      throw new Error('invalid minimum signature count');
    }
    const foundAddresses = {};

    const signerEntries = signerList.SignerEntries;
    if (signerEntries.length !== 3) {
      throw new Error('invalid signer list length');
    }
    for (const { SignerEntry } of signerEntries) {
      const weight = SignerEntry.SignerWeight;
      const address = SignerEntry.Account;
      if (weight !== 1) {
        throw new Error('invalid signer weight');
      }

      // if it's a dupe of an address we already know, block
      if (foundAddresses[address] >= 1) {
        throw new Error('duplicate signer address');
      }
      foundAddresses[address] = (foundAddresses[address] || 0) + 1;
    }

    if (foundAddresses[userAddress] !== 1) {
      throw new Error('unexpected incidence frequency of user signer address');
    }
    if (foundAddresses[backupAddress] !== 1) {
      throw new Error('unexpected incidence frequency of user signer address');
    }

    // make sure the flags disable the master key and enforce destination tags
    const USER_KEY_SETTING_FLAG = 65536;
    const MASTER_KEY_DEACTIVATION_FLAG = 1048576;
    const REQUIRE_DESTINATION_TAG_FLAG = 131072;
    if ((accountFlags & USER_KEY_SETTING_FLAG) !== 0) {
      throw new Error('a custom user key has been set');
    }
    if ((accountFlags & MASTER_KEY_DEACTIVATION_FLAG) !== MASTER_KEY_DEACTIVATION_FLAG) {
      throw new Error('the master key has not been deactivated');
    }
    if ((accountFlags & REQUIRE_DESTINATION_TAG_FLAG) !== REQUIRE_DESTINATION_TAG_FLAG) {
      throw new Error('the destination flag requirement has not been activated');
    }

    // recover the funds
    const reserve = baseReserve.plus(reserveDelta);
    const recoverableBalance = balance.minus(reserve);

    const rawDestination = params.recoveryDestination;
    const destinationDetails = url.parse(rawDestination);
    const destinationAddress = destinationDetails.pathname;

    // parse destination tag from query
    let destinationTag: number | undefined;
    if (destinationDetails.query) {
      const queryDetails = querystring.parse(destinationDetails.query);
      if (Array.isArray(queryDetails.dt)) {
        // if queryDetails.dt is an array, that means dt was given multiple times, which is not valid
        throw new InvalidAddressError(
          `destination tag can appear at most once, but ${queryDetails.dt.length} destination tags were found`
        );
      }

      const parsedTag = parseInt(queryDetails.dt as string, 10);
      if (Number.isInteger(parsedTag)) {
        destinationTag = parsedTag;
      }
    }

    if (recoverableBalance.toNumber() <= 0) {
      throw new Error(
        `Quantity of XRP to recover must be greater than 0. Current balance: ${balance.toNumber()}, blockchain reserve: ${reserve.toNumber()}, spendable balance: ${recoverableBalance.toNumber()}`
      );
    }

    const transaction = {
      TransactionType: 'Payment',
      Account: params.rootAddress, // source address
      Destination: destinationAddress,
      DestinationTag: destinationTag,
      Amount: recoverableBalance.toFixed(0),
      Flags: 2147483648,
      LastLedgerSequence: currentLedger + 1000000, // give it 1 million ledgers' time (~1 month, suitable for KRS)
      Fee: openLedgerFee.times(3).toFixed(0), // the factor three is for the multisigning
      Sequence: sequenceId,
    };
    const txJSON: string = JSON.stringify(transaction);

    if (isUnsignedSweep) {
      return {
        txHex: txJSON,
        coin: this.getChain(),
      };
    }

    if (!keys[0].privateKey) {
      throw new Error(`userKey is not a private key`);
    }
    const userKey = keys[0].privateKey.toString('hex');
    const userSignature = ripple.signWithPrivateKey(txJSON, userKey, { signAs: userAddress });

    let signedTransaction: string;

    if (isKrsRecovery) {
      signedTransaction = userSignature.signedTransaction;
    } else {
      if (!keys[1].privateKey) {
        throw new Error(`backupKey is not a private key`);
      }
      const backupKey = keys[1].privateKey.toString('hex');
      const backupSignature = ripple.signWithPrivateKey(txJSON, backupKey, { signAs: backupAddress });
      signedTransaction = ripple.multisign([userSignature.signedTransaction, backupSignature.signedTransaction]);
    }

    const transactionExplanation: RecoveryInfo = (await this.explainTransaction({
      txHex: signedTransaction,
    })) as any;

    transactionExplanation.txHex = signedTransaction;

    if (isKrsRecovery) {
      transactionExplanation.backupKey = params.backupKey;
      transactionExplanation.coin = this.getChain();
    }
    return transactionExplanation;
  }

  /**
   * Generate a new keypair for this coin.
   * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new XrpKeyPair({ seed }) : new XrpKeyPair();
    const keys = keyPair.getExtendedKeys();
    if (!keys.xprv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }
}
