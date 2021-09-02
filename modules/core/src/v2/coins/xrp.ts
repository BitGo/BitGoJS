/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import { ECPair } from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as url from 'url';
import * as querystring from 'querystring';
import * as accountLib from '@bitgo/account-lib';

import {
  BaseCoin,
  KeyPair,
  ParseTransactionOptions,
  ParsedTransaction,
  TransactionExplanation,
  TransactionPrebuild,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';
import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';
import { InvalidAddressError, UnexpectedAddressError } from '../../errors';
import {
  checkKrsProvider,
  getBip32Keys,
  InitiateRecoveryOptions as BaseInitiateRecoveryOptions,
} from '../recovery/initiate';

const ripple = require('../../ripple');

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

interface SignTransactionOptions extends BaseSignTransactionOptions {
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
    txHex: string;
  };
}

interface SupplementGenerateWalletOptions {
  rootPrivateKey?: string;
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
    if (!destinationAddress || !accountLib.Xrp.Utils.default.isValidAddress(destinationAddress)) {
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
    return accountLib.Xrp.Utils.default.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  public isValidPrv(prv: string): boolean {
    return accountLib.Xrp.Utils.default.isValidPrivateKey(prv);
  }

  /**
   * Get fee info from server
   */
  public getFeeInfo(_?, callback?): Bluebird<FeeInfo> {
    return Bluebird.resolve(this.bitgo.get(this.url('/public/feeinfo')).result()).nodeify(callback);
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @param callback
   * @returns Bluebird<HalfSignedTransaction>
   */
  public signTransaction(
    { txPrebuild, prv }: SignTransactionOptions,
    callback?: NodeCallback<HalfSignedTransaction>
  ): Bluebird<HalfSignedTransaction> {
    return co<HalfSignedTransaction>(function* () {
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
      const factory = accountLib.getBuilder(this.getChain()) as unknown as accountLib.Xrp.TransactionBuilderFactory;

      const txBuilder = factory.from(txPrebuild.txHex || '');
      txBuilder.sign({ key: prv });
      const tx = (yield txBuilder.build()) as unknown as accountLib.Xrp.Transaction;

      return { halfSigned: { txHex: tx.toBroadcastFormat() } };
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Ripple requires additional parameters for wallet generation to be sent to the server. The additional parameters are
   * the root public key, which is the basis of the root address, two signed, and one half-signed initialization txs
   * @param walletParams
   * - rootPrivateKey: optional hex-encoded Ripple private key
   */
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions): Bluebird<SupplementGenerateWalletOptions> {
    return co<SupplementGenerateWalletOptions>(function* () {
      if (walletParams.rootPrivateKey) {
        if (walletParams.rootPrivateKey.length !== 64) {
          throw new Error('rootPrivateKey needs to be a hexadecimal private key string');
        }
      } else {
        const keyPair = ECPair.makeRandom();
        walletParams.rootPrivateKey = keyPair.getPrivateKeyBuffer().toString('hex');
      }
      return walletParams;
    }).call(this);
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions = {},
    callback?: NodeCallback<TransactionExplanation>
  ): Bluebird<TransactionExplanation> {
    return co<TransactionExplanation>(function* () {
      const txHex = params.txHex;
      if (!txHex) {
        throw new Error('missing required param txHex');
      }

      const factory = accountLib.getBuilder(this.getChain()) as unknown as accountLib.Xrp.TransactionBuilderFactory;

      const txBuilder = factory.from(txHex);
      const tx = (yield txBuilder.build()) as unknown as accountLib.Xrp.Transaction;
      const txJson = tx.toJson();

      if (tx.type === accountLib.BaseCoin.TransactionType.WalletInitialization) {
        return {
          displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'accountSet'],
          changeOutputs: [],
          outputAmount: 0,
          changeAmount: 0,
          outputs: [],
          fee: {
            fee: txJson.fee,
            feeRate: null,
            size: txHex.length / 2,
          },
          accountSet: {
            messageKey: txJson.messageKey,
          },
        };
      }

      return {
        displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'],
        changeOutputs: [],
        outputAmount: txJson.amount,
        changeAmount: 0,
        outputs: [
          {
            address: txJson.destination,
            amount: txJson.amount,
          },
        ],
        fee: {
          fee: txJson.fee,
          feeRate: null,
          size: txHex.length / 2,
        },
      };
    })
      .call(this)
      .asCallback(callback);
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
    return co<boolean>(function* () {
      const explanation = (yield self.explainTransaction({
        txHex: txPrebuild.txHex,
      })) as any;

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
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Check if address is a valid XRP address, and then make sure the root addresses match.
   * This prevents attacks where an attack may switch out the new address for one of their own
   * @param address {String} the address to verify
   * @param rootAddress {String} the wallet's root address
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public verifyAddress({ address, rootAddress }: VerifyAddressOptions) {
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
   * @param callback
   */
  public recover(
    params: RecoveryOptions,
    callback?: NodeCallback<RecoveryInfo | string>
  ): Bluebird<RecoveryInfo | string> {
    const self = this;
    return co<RecoveryInfo | string>(function* explainTransaction(): any {
      const rippledUrl = self.getRippledUrl();
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
        checkKrsProvider(self, params.krsProvider);
      }

      // Validate the destination address
      if (!self.isValidAddress(params.recoveryDestination)) {
        throw new Error('Invalid destination address!');
      }

      const keys = getBip32Keys(self.bitgo, params, { requireBitGoXpub: false });

      const { addressDetails, feeDetails, serverDetails } = yield Bluebird.props({
        addressDetails: self.bitgo.post(rippledUrl).send(accountInfoParams),
        feeDetails: self.bitgo.post(rippledUrl).send({ method: 'fee' }),
        serverDetails: self.bitgo.post(rippledUrl).send({ method: 'server_info' }),
      });

      const openLedgerFee = new BigNumber(feeDetails.body.result.drops.open_ledger_fee);
      const baseReserve = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_base_xrp).times(
        self.getBaseFactor()
      );
      const reserveDelta = new BigNumber(serverDetails.body.result.info.validated_ledger.reserve_inc_xrp).times(
        self.getBaseFactor()
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
      const userAddress = new accountLib.Xrp.KeyPair({ pub: keys[0].publicKey.toString('hex') }).getAddress();
      const backupAddress = new accountLib.Xrp.KeyPair({ pub: keys[1].publicKey.toString('hex') }).getAddress();

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
          throw new InvalidAddressError(
            `destination tag can appear at most once, but ${queryDetails.dt.length} destination tags were found`
          );
        }

        const parsedTag = parseInt(queryDetails.dt, 10);
        if (Number.isInteger(parsedTag)) {
          destinationTag = parsedTag;
        }
      }
      const rippleLib = ripple();
      const factory = accountLib.getBuilder(this.getChain()) as unknown as accountLib.Xrp.TransactionBuilderFactory;
      const builder = factory.getTransferBuilder();
      builder
        .sender({ address: params.rootAddress })
        .flags(2147483648)
        .lastLedgerSequence(`${currentLedger + 1000000}`)
        .fee({ fee: openLedgerFee.times(3).toFixed(0) })
        .sequence(`${sequenceId}`)
        .amount(recoverableBalance.toFixed(0));

      if (destinationAddress) {
        builder.destination({ address: destinationAddress });
      }
      if (destinationTag) {
        builder.destinationTag(destinationTag);
      }
      const unsignedTx = yield builder.build();
      if (isUnsignedSweep) {
        return unsignedTx.toJson();
      }
      const signedBuilder = factory.from(unsignedTx.toBroadcastFormat());
      if (!keys[0].privateKey) {
        throw new Error(`userKey is not a private key`);
      }
      signedBuilder.sign({ key: keys[0].privateKey.toString('hex') });
      const tx = yield signedBuilder.build();
      let signedTransaction;

      if (isKrsRecovery) {
        signedTransaction = tx.toBroadcastFormat();
      } else {
        if (!keys[1].privateKey) {
          throw new Error(`backupKey is not a private key`);
        }
        const backupKey = keys[1].privateKey.toString('hex');
        const backupBuilder = factory.from(unsignedTx.toBroadcastFormat());
        backupBuilder.sign({ key: backupKey });
        const backup_tx = yield backupBuilder.build();
        signedTransaction = rippleLib.combine([
          tx.toBroadcastFormat(),
          backup_tx.toBroadcastFormat(),
        ]).signedTransaction;
      }
      const transactionExplanation: RecoveryInfo = yield self.explainTransaction({
        txHex: signedTransaction,
      });
      transactionExplanation.txHex = signedTransaction;

      if (isKrsRecovery) {
        transactionExplanation.backupKey = params.backupKey;
        transactionExplanation.coin = self.getChain();
      }
      return transactionExplanation;
    })
      .call(this)
      .asCallback(callback);
  }

  // /**
  //  * Generate a new keypair for this coin.
  //  * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
  //  */
  public generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new accountLib.Xrp.KeyPair({ seed }) : new accountLib.Xrp.KeyPair();
    const keys = keyPair.getExtendedKeys();

    if (!keys.xprv) {
      throw new Error('Missing xprv in key generation.');
    }
    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }
}
