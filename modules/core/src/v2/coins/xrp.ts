import { BigNumber } from 'bignumber.js';
import { HDNode, ECPair } from 'bitgo-utxo-lib';
import * as Bluebird from 'bluebird';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import * as url from 'url';
import * as querystring from 'querystring';
import { BitGo } from '../../bitgo';

import * as rippleAddressCodec from 'ripple-address-codec';
import * as rippleBinaryCodec from 'ripple-binary-codec';
import { computeBinaryTransactionHash } from 'ripple-lib/dist/npm/common/hashes';
import * as rippleKeypairs from 'ripple-keypairs';

import {
  BaseCoin,
  TransactionExplanation,
  KeyPair,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  ParseTransactionOptions,
  ParsedTransaction,
  TransactionPrebuild,
  VerifyTransactionOptions,
  InitiateRecoveryOptions as BaseInitiateRecoveryOptions,
} from '../baseCoin';
import * as config from '../../config';
import { NodeCallback } from '../types';
import { InvalidAddressError, UnexpectedAddressError } from '../../errors';

const ripple = require('../../ripple');
const sjcl = require('../../vendor/sjcl.min.js');

const co = Bluebird.coroutine;

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

interface SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

interface ExplainTransactionOptions {
  txHex?: string;
}

interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

interface RecoveryInfo extends TransactionExplanation {
  txHex: string;
  backupKey?: string;
  coin?: string;
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
    txHex: string
  }
}

export class Xrp extends BaseCoin {
  protected constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
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
      throw new InvalidAddressError(`destination tag can appear at most once, but ${queryDetails.dt.length} destination tags were found`);
    }

    const parsedTag = parseInt(queryDetails.dt, 10);
    if (!Number.isSafeInteger(parsedTag)) {
      throw new InvalidAddressError('invalid destination tag');
    }

    if (parsedTag > 0xFFFFFFFF || parsedTag < 0) {
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
      HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get fee info from server
   */
  public getFeeInfo(_?, callback?): Promise<FeeInfo> {
    return this.bitgo.get(this.url('/public/feeinfo'))
      .result()
      .nodeify(callback);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {{txHex}}
   */
  public signTransaction({ txPrebuild, prv }: SignTransactionOptions): HalfSignedTransaction {
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

    const userKey = HDNode.fromBase58(prv).getKey();
    const userPrivateKey: Buffer = userKey.getPrivateKeyBuffer();
    const userAddress = rippleKeypairs.deriveAddress(userKey.getPublicKeyBuffer().toString('hex'));

    const rippleLib = ripple();
    const halfSigned = rippleLib.signWithPrivateKey(txPrebuild.txHex, userPrivateKey.toString('hex'), { signAs: userAddress });
    return { halfSigned: { txHex: halfSigned.signedTransaction } };
  }

  /**
   * Ripple requires additional parameters for wallet generation to be sent to the server. The additional parameters are
   * the root public key, which is the basis of the root address, two signed, and one half-signed initialization txs
   * @param walletParams
   * - rootPrivateKey: optional hex-encoded Ripple private key
   * @param keychains
   */
  supplementGenerateWallet(walletParams, keychains): Bluebird<any> {
    return co(function *() {
      const { userKeychain, backupKeychain, bitgoKeychain } = keychains;

      const userKey = HDNode.fromBase58(userKeychain.pub).getKey();
      const userAddress = rippleKeypairs.deriveAddress(userKey.getPublicKeyBuffer().toString('hex'));

      const backupKey = HDNode.fromBase58(backupKeychain.pub).getKey();
      const backupAddress = rippleKeypairs.deriveAddress(backupKey.getPublicKeyBuffer().toString('hex'));

      const bitgoKey = HDNode.fromBase58(bitgoKeychain.pub).getKey();
      const bitgoAddress = rippleKeypairs.deriveAddress(bitgoKey.getPublicKeyBuffer().toString('hex'));

      // initially, we need to generate a random root address which has to be distinct from all three keychains
      let keyPair = ECPair.makeRandom();
      if (walletParams.rootPrivateKey) {
        const rootPrivateKey = walletParams.rootPrivateKey;
        if (typeof rootPrivateKey !== 'string' || rootPrivateKey.length !== 64) {
          throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
        }
        keyPair = ECPair.fromPrivateKeyBuffer(Buffer.from(walletParams.rootPrivateKey, 'hex'));
      }
      const privateKey: Buffer = keyPair.getPrivateKeyBuffer();
      const publicKey: Buffer = keyPair.getPublicKeyBuffer();
      const rootAddress = rippleKeypairs.deriveAddress(publicKey.toString('hex'));

      const self = this;
      const rippleLib = ripple();

      const feeInfo = yield self.getFeeInfo();
      const openLedgerFee = new BigNumber(feeInfo.xrpOpenLedgerFee);
      const medianFee = new BigNumber(feeInfo.xrpMedianFee);
      const fee = BigNumber.max(openLedgerFee, medianFee).times(1.5).toFixed(0);

      // configure multisigners
      const multisigAssignmentTx = {
        TransactionType: 'SignerListSet',
        Account: rootAddress,
        SignerQuorum: 2,
        SignerEntries: [
          {
            SignerEntry: {
              Account: userAddress,
              SignerWeight: 1
            }
          },
          {
            SignerEntry: {
              Account: backupAddress,
              SignerWeight: 1
            }
          },
          {
            SignerEntry: {
              Account: bitgoAddress,
              SignerWeight: 1
            }
          }
        ],
        Flags: 2147483648,
        // LastLedgerSequence: ledgerVersion + 10,
        Fee: fee,
        Sequence: 1
      };
      const signedMultisigAssignmentTx = rippleLib.signWithPrivateKey(JSON.stringify(multisigAssignmentTx), privateKey.toString('hex'));

      // enforce destination tags
      const destinationTagTx = {
        TransactionType: 'AccountSet',
        Account: rootAddress,
        SetFlag: 1,
        Flags: 2147483648,
        // LastLedgerSequence: ledgerVersion + 10,
        Fee: fee,
        Sequence: 2
      };
      const signedDestinationTagTx = rippleLib.signWithPrivateKey(JSON.stringify(destinationTagTx), privateKey.toString('hex'));

      // disable master key
      const masterDeactivationTx = {
        TransactionType: 'AccountSet',
        Account: rootAddress,
        SetFlag: 4,
        Flags: 2147483648,
        // LastLedgerSequence: ledgerVersion + 10,
        Fee: fee,
        Sequence: 3
      };
      const signedMasterDeactivationTx = rippleLib.signWithPrivateKey(JSON.stringify(masterDeactivationTx), privateKey.toString('hex'));

      // extend the wallet initialization params
      walletParams.rootPub = publicKey.toString('hex');
      walletParams.initializationTxs = {
        setMultisig: signedMultisigAssignmentTx.signedTransaction,
        disableMasterKey: signedMasterDeactivationTx.signedTransaction,
        forceDestinationTag: signedDestinationTagTx.signedTransaction
      };
      return walletParams;
    }).call(this);
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(params: ExplainTransactionOptions = {}, callback?: NodeCallback<TransactionExplanation>): Bluebird<TransactionExplanation> {
    return co<TransactionExplanation>(function *() {
      if (!params.txHex) {
        throw new Error('missing required param txHex');
      }
      let transaction;
      let txHex;
      try {
        transaction = rippleBinaryCodec.decode(params.txHex);
        txHex = params.txHex;
      } catch (e) {
        try {
          transaction = JSON.parse(params.txHex);
          txHex = rippleBinaryCodec.encode(transaction);
        } catch (e) {
          throw new Error('txHex needs to be either hex or JSON string for XRP');
        }
      }
      const id = computeBinaryTransactionHash(txHex);
      const address = transaction.Destination + ((transaction.DestinationTag >= 0) ? '?dt=' + transaction.DestinationTag : '');
      return {
        displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'],
        id: id,
        changeOutputs: [],
        outputAmount: transaction.Amount,
        changeAmount: 0,
        outputs: [
          {
            address,
            amount: transaction.Amount
          }
        ],
        fee: {
          fee: transaction.Fee,
          feeRate: null,
          size: txHex.length / 2
        }
      };
    }).call(this).asCallback(callback);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   * @param txParams params object passed to send
   * @param txPrebuild prebuild object returned by server
   * @param wallet
   * @param callback
   * @returns {boolean}
   */
  public verifyTransaction({ txParams, txPrebuild }: VerifyTransactionOptions, callback): Bluebird<boolean> {
    const self = this;
    return co<boolean>(function *() {
      const explanation = yield self.explainTransaction({
        txHex: txPrebuild.txHex
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
    }).call(this).asCallback(callback);
  }

  /**
   * Check if address is a valid XRP address, and then make sure the root addresses match.
   * This prevents attacks where an attack may switch out the new address for one of their own
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   */
  public verifyAddress({ address, rootAddress }: VerifyAddressOptions) {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`address verification failure: address "${address}" is not valid`);
    }

    const addressDetails = this.getAddressDetails(address);
    const rootAddressDetails = this.getAddressDetails(rootAddress);

    if (addressDetails.address !== rootAddressDetails.address) {
      throw new UnexpectedAddressError(`address validation failure: ${addressDetails.address} vs. ${rootAddressDetails.address}`);
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
   * @param callback
   */
  public recover(params: RecoveryOptions, callback?: NodeCallback<RecoveryInfo | string>): Bluebird<RecoveryInfo | string> {
    const self = this;
    return co<RecoveryInfo | string>(function *explainTransaction() {
      const rippledUrl = self.getRippledUrl();
      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

      const accountInfoParams = {
        method: 'account_info',
        params: [{
          account: params.rootAddress,
          strict: true,
          ledger_index: 'current',
          queue: true,
          signer_lists: true,
        }],
      };

      const { keys, addressDetails, feeDetails, serverDetails } = yield Bluebird.props({
        keys: self.initiateRecovery(params),
        addressDetails: self.bitgo.post(rippledUrl).send(accountInfoParams),
        feeDetails: self.bitgo.post(rippledUrl).send({ method: 'fee' }),
        serverDetails: self.bitgo.post(rippledUrl).send({ method: 'server_info' }),
      });

      const openLedgerFee = new BigNumber(feeDetails.body.result.drops.open_ledger_fee);
      const baseReserve = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_base_xrp).times(self.getBaseFactor());
      const reserveDelta = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_inc_xrp).times(self.getBaseFactor());
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
      const userAddress = rippleKeypairs.deriveAddress(keys[0].getPublicKeyBuffer().toString('hex'));
      const backupAddress = rippleKeypairs.deriveAddress(keys[1].getPublicKeyBuffer().toString('hex'));

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
      const reserve = baseReserve.plus(reserveDelta.times(5));
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
          throw new InvalidAddressError(`destination tag can appear at most once, but ${queryDetails.dt.length} destination tags were found`);
        }

        const parsedTag = parseInt(queryDetails.dt, 10);
        if (Number.isInteger(parsedTag)) {
          destinationTag = parsedTag;
        }
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
        return txJSON;
      }
      const rippleLib = ripple();
      const userKey = keys[0].getKey().getPrivateKeyBuffer().toString('hex');
      const userSignature = rippleLib.signWithPrivateKey(txJSON, userKey, { signAs: userAddress });

      let signedTransaction;

      if (isKrsRecovery) {
        signedTransaction = userSignature;
      } else {
        const backupKey = keys[1].getKey().getPrivateKeyBuffer().toString('hex');
        const backupSignature = rippleLib.signWithPrivateKey(txJSON, backupKey, { signAs: backupAddress });
        signedTransaction = rippleLib.combine([userSignature.signedTransaction, backupSignature.signedTransaction]);
      }

      const transactionExplanation: RecoveryInfo = yield self.explainTransaction({
        txHex: signedTransaction.signedTransaction,
      });
      transactionExplanation.txHex = signedTransaction.signedTransaction;

      if (isKrsRecovery) {
        transactionExplanation.backupKey = params.backupKey;
        transactionExplanation.coin = self.getChain();
      }
      return transactionExplanation;
    }).call(this).asCallback(callback);
  }

  /**
   * Prepare and validate all keychains from the keycard for recovery
   */
  initiateRecovery(params: InitiateRecoveryOptions): Bluebird<HDNode[]> {
    const self = this;
    return co<HDNode[]>(function *initiateRecovery() {
      const keys: HDNode[] = [];
      const userKey = params.userKey; // Box A
      let backupKey = params.backupKey; // Box B
      const bitgoXpub = params.bitgoKey; // Box C
      const destinationAddress = params.recoveryDestination;
      const passphrase = params.walletPassphrase;

      const isKrsRecovery = backupKey.startsWith('xpub') && !userKey.startsWith('xpub');
      const isUnsignedSweep = backupKey.startsWith('xpub') && userKey.startsWith('xpub');

      if (isKrsRecovery && params.krsProvider && _.isUndefined(config.krsProviders[params.krsProvider])) {
        throw new Error('unknown key recovery service provider');
      }

      const validatePassphraseKey = function(userKey, passphrase): HDNode {
        try {
          if (!userKey.startsWith('xprv') && !isUnsignedSweep) {
            userKey = sjcl.decrypt(passphrase, userKey);
          }
          return HDNode.fromBase58(userKey);
        } catch (e) {
          throw new Error('Failed to decrypt user key with passcode - try again!');
        }
      };

      const key = validatePassphraseKey(userKey, passphrase);

      keys.push(key);

      // Validate the backup key
      try {
        if (!backupKey.startsWith('xprv') && !isKrsRecovery && !isUnsignedSweep) {
          backupKey = sjcl.decrypt(passphrase, backupKey);
        }
        const backupHDNode = HDNode.fromBase58(backupKey);
        keys.push(backupHDNode);
      } catch (e) {
        throw new Error('Failed to decrypt backup key with passcode - try again!');
      }
      try {
        const bitgoHDNode = HDNode.fromBase58(bitgoXpub);
        keys.push(bitgoHDNode);
      } catch (e) {
        if (self.getFamily() !== 'xrp') {
          // in XRP recoveries, the BitGo xpub is optional
          throw new Error('Failed to parse bitgo xpub!');
        }
      }
      // Validate the destination address
      if (!self.isValidAddress(destinationAddress)) {
        throw new Error('Invalid destination address!');
      }

      return keys;
    }).call(this);
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
      seed = crypto.randomBytes(512 / 8);
    }
    const extendedKey = HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  parseTransaction(params: ParseTransactionOptions, callback?: NodeCallback<ParsedTransaction>): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }
}
