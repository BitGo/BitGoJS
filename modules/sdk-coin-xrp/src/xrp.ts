/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import { bip32, ECPair } from '@bitgo/utxo-lib';
import { randomBytes } from 'crypto';
import * as _ from 'lodash';
import * as url from 'url';
import * as querystring from 'querystring';

import * as rippleAddressCodec from 'ripple-address-codec';
import * as rippleBinaryCodec from 'ripple-binary-codec';
import { computeBinaryTransactionHash } from 'ripple-lib/dist/npm/common/hashes';
import * as rippleKeypairs from 'ripple-keypairs';
import {
  BaseCoin,
  BitGoBase,
  checkKrsProvider,
  getBip32Keys,
  InitiateRecoveryOptions as BaseInitiateRecoveryOptions,
  InvalidAddressError,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  promiseProps,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  TransactionPrebuild,
  UnexpectedAddressError,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

const ripple = require('./ripple');

interface Address {
  address: string;
  destinationTag?: number;
}

interface FeeInfo {
  date: string;
  height: number;
  baseReserve: string;
  baseFee: string;
}

interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
  isLastSignature?: boolean;
}

interface ExplainTransactionOptions {
  txHex?: string;
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
}

interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

interface RecoveryInfo extends TransactionExplanation {
  txHex: string;
  backupKey?: string;
  coin?: string;
}

export interface RecoveryTransaction {
  txHex: string;
}

export interface InitiateRecoveryOptions extends BaseInitiateRecoveryOptions {
  krsProvider?: string;
}

export interface RecoveryOptions {
  backupKey: string;
  userKey: string;
  rootAddress: string;
  recoveryDestination: string;
  bitgoKey?: string;
  walletPassphrase: string;
  krsProvider?: string;
}

interface HalfSignedTransaction {
  halfSigned: {
    txHex: string;
  };
}

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
}

export class Xrp extends BaseCoin {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Xrp(bitgo);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'xrp';
  }

  /**
   * Identifier for the coin family
   */
  public getFamily(): string {
    return 'xrp';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Ripple';
  }

  /**
   * Parse an address string into address and destination tag
   */
  public getAddressDetails(address: string): Address {
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname;
    if (!destinationAddress || !rippleAddressCodec.isValidClassicAddress(destinationAddress)) {
      throw new InvalidAddressError(`destination address "${destinationAddress}" is not valid`);
    }
    // there are no other properties like destination tags
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        destinationTag: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new InvalidAddressError('no query params present');
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.dt) {
      // if there are more properties, the query details need to contain the destination tag property.
      throw new InvalidAddressError('destination tag missing');
    }

    if (Array.isArray(queryDetails.dt)) {
      // if queryDetails.dt is an array, that means dt was given multiple times, which is not valid
      throw new InvalidAddressError(
        `destination tag can appear at most once, but ${queryDetails.dt.length} destination tags were found`
      );
    }

    const parsedTag = parseInt(queryDetails.dt, 10);
    if (!Number.isSafeInteger(parsedTag)) {
      throw new InvalidAddressError('invalid destination tag');
    }

    if (parsedTag > 0xffffffff || parsedTag < 0) {
      throw new InvalidAddressError('destination tag out of range');
    }

    return {
      address: destinationAddress,
      destinationTag: parsedTag,
    };
  }

  /**
   * Construct a full, normalized address from an address and destination tag
   */
  public normalizeAddress({ address, destinationTag }: Address): string {
    if (!_.isString(address)) {
      throw new InvalidAddressError('invalid address details');
    }
    if (_.isInteger(destinationTag)) {
      return `${address}?dt=${destinationTag}`;
    }
    return address;
  }

  /**
   * Evaluates whether an address string is valid for this coin
   * @param address
   */
  public isValidAddress(address: string): boolean {
    try {
      const addressDetails = this.getAddressDetails(address);
      return address === this.normalizeAddress(addressDetails);
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  public isValidPub(pub: string): boolean {
    try {
      return bip32.fromBase58(pub).isNeutered();
    } catch (e) {
      return false;
    }
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

    const userKey = bip32.fromBase58(prv);
    const userPrivateKey = userKey.privateKey;
    if (!userPrivateKey) {
      throw new Error(`no privateKey`);
    }
    const userAddress = rippleKeypairs.deriveAddress(userKey.publicKey.toString('hex'));

    const rippleLib = ripple();

    const tx = rippleLib.signWithPrivateKey(txPrebuild.txHex, userPrivateKey.toString('hex'), {
      signAs: userAddress,
    });

    // Normally the SDK provides the first signature for an XRP tx, but occasionally it provides the final one as well
    // (recoveries)
    if (isLastSignature) {
      return { txHex: tx.signedTransaction };
    }
    return { halfSigned: { txHex: tx.signedTransaction } };
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
      const keyPair = ECPair.makeRandom();
      if (!keyPair.privateKey) {
        throw new Error('no privateKey');
      }
      walletParams.rootPrivateKey = keyPair.privateKey.toString('hex');
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
    const id = computeBinaryTransactionHash(txHex as string);

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

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

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
    const rippleLib = ripple();
    if (!keys[0].privateKey) {
      throw new Error(`userKey is not a private key`);
    }
    const userKey = keys[0].privateKey.toString('hex');
    const userSignature = rippleLib.signWithPrivateKey(txJSON, userKey, { signAs: userAddress });

    let signedTransaction;

    if (isKrsRecovery) {
      signedTransaction = userSignature;
    } else {
      if (!keys[1].privateKey) {
        throw new Error(`backupKey is not a private key`);
      }
      const backupKey = keys[1].privateKey.toString('hex');
      const backupSignature = rippleLib.signWithPrivateKey(txJSON, backupKey, { signAs: backupAddress });
      signedTransaction = rippleLib.combine([userSignature.signedTransaction, backupSignature.signedTransaction]);
    }

    const transactionExplanation: RecoveryInfo = (await this.explainTransaction({
      txHex: signedTransaction.signedTransaction,
    })) as any;
    transactionExplanation.txHex = signedTransaction.signedTransaction;

    if (isKrsRecovery) {
      transactionExplanation.backupKey = params.backupKey;
      transactionExplanation.coin = this.getChain();
    }
    return transactionExplanation;
  }

  initiateRecovery(params: InitiateRecoveryOptions): never {
    throw new Error('deprecated method');
  }

  /**
   * Generate a new keypair for this coin.
   * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bip32.fromSeed(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }
}
