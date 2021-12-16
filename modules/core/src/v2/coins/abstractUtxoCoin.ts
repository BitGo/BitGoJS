/**
 * @prettier
 */
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';
import {
  getExternalChainCode,
  isChainCode,
  RootWalletKeys,
  scriptTypeForChain,
  outputScripts,
  toOutput,
  Unspent,
  verifySignatureWithUnspent,
  WalletUnspentSigner,
} from '@bitgo/utxo-lib/dist/src/bitgo';
import * as bitcoinMessage from 'bitcoinjs-message';
import { randomBytes } from 'crypto';
import * as debugLib from 'debug';
import * as _ from 'lodash';

import { BitGo } from '../../bitgo';
import * as config from '../../config';
import * as errors from '../../errors';

import { backupKeyRecovery, RecoverParams } from './utxo/recovery/backupKeyRecovery';
import {
  CrossChainRecoverySigned,
  CrossChainRecoveryUnsigned,
  recoverCrossChain,
} from './utxo/recovery/crossChainRecovery';

import {
  AddressCoinSpecific,
  BaseCoin,
  ExtraPrebuildParamsOptions,
  KeychainsTriplet,
  ParseTransactionOptions as BaseParseTransactionOptions,
  ParsedTransaction as BaseParsedTransaction,
  PrecreateBitGoOptions,
  PresignTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  SupplementGenerateWalletOptions,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionParams as BaseTransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient,
  VerificationOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  HalfSignedUtxoTransaction,
} from '../baseCoin';
import { CustomChangeOptions, parseOutput } from '../internal/parseOutput';
import { RequestTracer } from '../internal/util';
import { Keychain, KeyIndices } from '../keychains';
import { Triple } from '../triple';
import { promiseProps } from '../promise-utils';
import { Wallet } from '../wallet';
import { sanitizeLegacyPath } from '../../bip32path';

const debug = debugLib('bitgo:v2:utxo');

import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;
import { isReplayProtectionUnspent } from './utxo/replayProtection';
import { signAndVerifyWalletTransaction } from './utxo/sign';

export interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  chain: number;
  index: number;
}

export interface Output {
  address: string;
  amount: string | number;
  external?: boolean;
  needsCustomChangeKeySignatureVerification?: boolean;
}

export interface TransactionExplanation extends BaseTransactionExplanation<string, number> {
  locktime: number;
  outputs: Output[];
  changeOutputs: Output[];

  /**
   * Number of input signatures per input.
   */
  inputSignatures: number[];

  /**
   * Highest input signature count for the transaction
   */
  signatures: number;
}

export interface TransactionInfo {
  txHexes?: Record<string, string>;
  changeAddresses?: string[];
  unspents: Unspent[];
}

export interface ExplainTransactionOptions {
  txHex: string;
  txInfo?: TransactionInfo;
  feeInfo?: string;
  pubs?: Triple<string>;
}

export type UtxoNetwork = utxolib.Network;

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txInfo?: TransactionInfo;
  blockHeight?: number;
}

export interface TransactionParams extends BaseTransactionParams {
  walletPassphrase?: string;
  changeAddress?: string;
}

export interface ParseTransactionOptions extends BaseParseTransactionOptions {
  txParams: TransactionParams;
  txPrebuild: TransactionPrebuild;
  wallet: Wallet;
  verification?: VerificationOptions;
  reqId?: RequestTracer;
}

export interface ParsedTransaction extends BaseParsedTransaction {
  keychains: {
    user?: Keychain;
    backup?: Keychain;
    bitgo?: Keychain;
  };
  keySignatures: {
    backupPub?: string;
    bitgoPub?: string;
  };
  outputs: Output[];
  missingOutputs: Output[];
  explicitExternalOutputs: Output[];
  implicitExternalOutputs: Output[];
  changeOutputs: Output[];
  explicitExternalSpendAmount: number;
  implicitExternalSpendAmount: number;
  needsCustomChangeKeySignatureVerification: boolean;
  customChange?: CustomChangeOptions;
}

export interface GenerateAddressOptions {
  addressType?: ScriptType2Of3;
  keychains: {
    pub: string;
    aspKeyId?: string;
  }[];
  threshold?: number;
  chain?: number;
  index?: number;
  segwit?: boolean;
  bech32?: boolean;
}

export interface AddressDetails {
  address: string;
  chain: number;
  index: number;
  coin: string;
  coinSpecific: AddressCoinSpecific;
  addressType?: string;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  /** Transaction prebuild from bitgo server */
  txPrebuild: {
    txHex: string;
    txInfo: TransactionInfo;
  };
  /** xprv of user key or backup key */
  prv: string;
  /** xpubs triple for wallet (user, backup, bitgo) */
  pubs: Triple<string>;
  /** xpub for cosigner (defaults to bitgo) */
  cosignerPub?: string;
  /**
   * When true, creates full-signed transaction without placeholder signatures.
   * When false, creates half-signed transaction with placeholder signatures.
   */
  isLastSignature?: boolean;
}

export interface MultiSigAddress {
  outputScript: Buffer;
  redeemScript?: Buffer;
  witnessScript?: Buffer;
  address: string;
}

export interface RecoverFromWrongChainOptions {
  txid: string;
  recoveryAddress: string;
  wallet: string;
  walletPassphrase?: string;
  xprv?: string;
  /** @deprecated */
  coin?: AbstractUtxoCoin;
  recoveryCoin?: AbstractUtxoCoin;
  signed?: boolean;
}

export interface AddressInfo {
  txCount: number;
  totalBalance: number;
}

export interface VerifyKeySignaturesOptions {
  userKeychain?: Keychain;
  keychainToVerify?: Keychain;
  keySignature?: string;
}

export interface VerifyUserPublicKeyOptions {
  userKeychain?: Keychain;
  disableNetworking: boolean;
  txParams: TransactionParams;
}

export interface VerifyTransactionOptions extends BaseVerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
}

export interface UnspentParams {
  id: string;
  value: number;
  valueString: string;
  address: string;
  blockHeight: number;
}

export abstract class AbstractUtxoCoin extends BaseCoin {
  public altScriptHash?: number;
  public supportAltScriptDestination?: boolean;
  private readonly _network: utxolib.Network;

  protected constructor(bitgo: BitGo, network: utxolib.Network) {
    super(bitgo);
    if (!_.isObject(network)) {
      throw new Error('network must be an object');
    }
    this._network = network;
  }

  get network() {
    return this._network;
  }

  sweepWithSendMany(): boolean {
    return true;
  }

  /** @deprecated */
  static get validAddressTypes(): ScriptType2Of3[] {
    return [...outputScripts.scriptTypes2Of3];
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    return 1e8;
  }

  /**
   * @deprecated
   */
  getCoinLibrary() {
    return utxolib;
  }

  /**
   * Helper to get the version number for an address
   */
  protected getAddressVersion(address: string): number | undefined {
    // try decoding as base58 first
    try {
      const { version } = utxolib.address.fromBase58Check(address, this.network);
      return version;
    } catch (e) {
      // try next format
    }

    // if coin does not support script types with bech32 encoding, do not attempt to parse
    if (!this.supportsAddressType('p2wsh') && !this.supportsAddressType('p2tr')) {
      return;
    }

    // otherwise, try decoding as bech32
    try {
      const { version, prefix } = utxolib.address.fromBech32(address);
      if (_.isString(this.network.bech32) && prefix === this.network.bech32) {
        return version;
      }
    } catch (e) {
      // ignore errors, just fall through and return undefined
    }
  }

  /**
   * Helper to get the bech32 prefix for an address
   */
  protected getAddressPrefix(address: string): string | undefined {
    // otherwise, try decoding as bech32
    try {
      const { prefix } = utxolib.address.fromBech32(address);
      return prefix;
    } catch (e) {
      // ignore errors, just fall through and return undefined
    }
  }

  /**
   * Check if an address is valid
   * @param address
   * @param forceAltScriptSupport
   */
  isValidAddress(address: string, forceAltScriptSupport = false): boolean {
    const validVersions: number[] = [this.network.pubKeyHash, this.network.scriptHash];
    if (this.altScriptHash && (forceAltScriptSupport || this.supportAltScriptDestination)) {
      validVersions.push(this.altScriptHash);
    }

    const addressVersion = this.getAddressVersion(address);

    // the address version needs to be among the valid ones
    const addressVersionValid = _.isNumber(addressVersion) && validVersions.includes(addressVersion);
    const addressPrefix = this.getAddressPrefix(address);

    if (!this.supportsAddressType('p2wsh') || _.isUndefined(addressPrefix)) {
      return addressVersionValid;
    }

    // address has a potential bech32 prefix, validate that
    return (
      _.isString(this.network.bech32) && this.network.bech32 === addressPrefix && address === address.toLowerCase()
    );
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string) {
    try {
      return bip32.fromBase58(pub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the latest block height
   * @param reqId
   */
  async getLatestBlockHeight(reqId?: RequestTracer): Promise<number> {
    if (reqId) {
      this.bitgo.setRequestTracer(reqId);
    }
    const chainhead = await this.bitgo.get(this.url('/public/block/latest')).result();
    return (chainhead as any).height;
  }

  /**
   * Run custom coin logic after a transaction prebuild has been received from BitGo
   * @param prebuild
   */
  async postProcessPrebuild(prebuild: TransactionPrebuild): Promise<TransactionPrebuild> {
    if (_.isUndefined(prebuild.txHex)) {
      throw new Error('missing required txPrebuild property txHex');
    }
    const transaction = this.createTransactionFromHex(prebuild.txHex);
    if (_.isUndefined(prebuild.blockHeight)) {
      prebuild.blockHeight = (await this.getLatestBlockHeight()) as number;
    }
    // Lock transaction to the next block to discourage fee sniping
    // See: https://github.com/bitcoin/bitcoin/blob/fb0ac482eee761ec17ed2c11df11e054347a026d/src/wallet/wallet.cpp#L2133
    transaction.locktime = prebuild.blockHeight;
    return _.extend({}, prebuild, { txHex: transaction.toHex() });
  }

  /**
   * Find outputs that are within expected outputs but not within actual outputs, including duplicates
   * @param expectedOutputs
   * @param actualOutputs
   * @returns {Array}
   */
  protected static findMissingOutputs(expectedOutputs: Output[], actualOutputs: Output[]): Output[] {
    const keyFunc = ({ address, amount }: Output): string => `${address}:${Number(amount)}`;
    const groupedOutputs = _.groupBy(expectedOutputs, keyFunc);

    actualOutputs.forEach((output) => {
      const group = groupedOutputs[keyFunc(output)];
      if (group) {
        group.pop();
      }
    });

    return _.flatten(_.values(groupedOutputs));
  }

  /**
   * Determine an address' type based on its witness and redeem script presence
   * @param addressDetails
   */
  static inferAddressType(addressDetails: { chain: number }): ScriptType2Of3 | null {
    return isChainCode(addressDetails.chain) ? scriptTypeForChain(addressDetails.chain) : null;
  }

  createTransactionFromHex(hex: string) {
    return utxolib.bitgo.createTransactionFromHex(hex, this.network);
  }

  /**
   * Extract and fill transaction details such as internal/change spend, external spend (explicit vs. implicit), etc.
   * @param params
   * @returns {*}
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    const { txParams, txPrebuild, wallet, verification = {}, reqId } = params;

    if (!_.isUndefined(verification.disableNetworking) && !_.isBoolean(verification.disableNetworking)) {
      throw new Error('verification.disableNetworking must be a boolean');
    }
    const disableNetworking = verification.disableNetworking;

    const fetchKeychains = async (wallet: Wallet): Promise<VerificationOptions['keychains']> => {
      return promiseProps({
        user: this.keychains().get({ id: wallet.keyIds()[KeyIndices.USER], reqId }),
        backup: this.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP], reqId }),
        bitgo: this.keychains().get({ id: wallet.keyIds()[KeyIndices.BITGO], reqId }),
      });
    };

    // obtain the keychains and key signatures
    let keychains: VerificationOptions['keychains'] | undefined = verification.keychains;
    if (!keychains) {
      if (disableNetworking) {
        throw new Error('cannot fetch keychains without networking');
      }
      keychains = await fetchKeychains(wallet);
    }

    if (!keychains || !keychains.user || !keychains.backup || !keychains.bitgo) {
      throw new Error('keychains are required, but could not be fetched');
    }

    const keychainArray: Triple<Keychain> = [keychains.user, keychains.backup, keychains.bitgo];

    const keySignatures = _.get(wallet, '_wallet.keySignatures');

    if (_.isUndefined(txPrebuild.txHex)) {
      throw new Error('missing required txPrebuild property txHex');
    }
    // obtain all outputs
    const explanation: TransactionExplanation = await this.explainTransaction({
      txHex: txPrebuild.txHex,
      txInfo: txPrebuild.txInfo,
      pubs: keychainArray.map((k) => k.pub) as Triple<string>,
    });

    const allOutputs = [...explanation.outputs, ...explanation.changeOutputs];

    // verify that each recipient from txParams has their own output
    const expectedOutputs = _.get(txParams, 'recipients', [] as TransactionRecipient[]).map((output) => {
      return { ...output, address: this.canonicalAddress(output.address) };
    });

    const missingOutputs = AbstractUtxoCoin.findMissingOutputs(expectedOutputs, allOutputs);

    // get the keychains from the custom change wallet if needed
    let customChange: CustomChangeOptions | undefined;
    const { customChangeWalletId = undefined } = wallet.coinSpecific() || {};
    if (customChangeWalletId) {
      // fetch keychains from custom change wallet for deriving addresses.
      // These keychains should be signed and this should be verified in verifyTransaction
      const customChangeKeySignatures = _.get(wallet, '_wallet.customChangeKeySignatures', {});
      const customChangeWallet: Wallet = await this.wallets().get({ id: customChangeWalletId });
      const customChangeKeys = await fetchKeychains(customChangeWallet);

      if (!customChangeKeys) {
        throw new Error('failed to fetch keychains for custom change wallet');
      }

      if (customChangeKeys.user && customChangeKeys.backup && customChangeKeys.bitgo && customChangeWallet) {
        const customChangeKeychains: [Keychain, Keychain, Keychain] = [
          customChangeKeys.user,
          customChangeKeys.backup,
          customChangeKeys.bitgo,
        ];

        customChange = {
          keys: customChangeKeychains,
          signatures: [
            customChangeKeySignatures.user,
            customChangeKeySignatures.backup,
            customChangeKeySignatures.bitgo,
          ],
        };
      }
    }

    /**
     * Loop through all the outputs and classify each of them as either internal spends
     * or external spends by setting the "external" property to true or false on the output object.
     */
    const allOutputDetails: Output[] = await Promise.all(
      allOutputs.map((currentOutput) => {
        return parseOutput({
          currentOutput,
          coin: this,
          txPrebuild,
          verification,
          keychainArray,
          wallet,
          txParams,
          customChange,
          reqId,
        });
      })
    );

    const needsCustomChangeKeySignatureVerification = allOutputDetails.some(
      (output) => output.needsCustomChangeKeySignatureVerification
    );

    const changeOutputs = _.filter(allOutputDetails, { external: false });

    // these are all the outputs that were not originally explicitly specified in recipients
    const implicitOutputs = AbstractUtxoCoin.findMissingOutputs(allOutputDetails, expectedOutputs);

    const explicitOutputs = AbstractUtxoCoin.findMissingOutputs(allOutputDetails, implicitOutputs);

    // these are all the non-wallet outputs that had been originally explicitly specified in recipients
    const explicitExternalOutputs = _.filter(explicitOutputs, { external: true });

    // this is the sum of all the originally explicitly specified non-wallet output values
    const explicitExternalSpendAmount = _.sumBy(explicitExternalOutputs, 'amount');

    /**
     * The calculation of the implicit external spend amount pertains to verifying the pay-as-you-go-fee BitGo
     * automatically applies to transactions sending money out of the wallet. The logic is fairly straightforward
     * in that we compare the external spend amount that was specified explicitly by the user to the portion
     * that was specified implicitly. To protect customers from people tampering with the transaction outputs, we
     * define a threshold for the maximum percentage of the implicit external spend in relation to the explicit
     * external spend.
     */

    // make sure that all the extra addresses are change addresses
    // get all the additional external outputs the server added and calculate their values
    const implicitExternalOutputs = _.filter(implicitOutputs, { external: true });
    const implicitExternalSpendAmount = _.sumBy(implicitExternalOutputs, 'amount');

    return {
      keychains,
      keySignatures,
      outputs: allOutputDetails,
      missingOutputs,
      explicitExternalOutputs,
      implicitExternalOutputs,
      changeOutputs,
      explicitExternalSpendAmount,
      implicitExternalSpendAmount,
      needsCustomChangeKeySignatureVerification,
      customChange,
    };
  }

  /**
   * Decrypt the wallet's user private key and verify that the claimed public key matches
   * @param {VerifyUserPublicKeyOptions} params
   * @return {boolean}
   * @protected
   */
  protected verifyUserPublicKey(params: VerifyUserPublicKeyOptions): boolean {
    const { userKeychain, txParams, disableNetworking } = params;
    if (!userKeychain) {
      throw new Error('user keychain is required');
    }

    const userPub = userKeychain.pub;

    // decrypt the user private key so we can verify that the claimed public key is a match
    let userPrv = userKeychain.prv;
    if (_.isEmpty(userPrv)) {
      const encryptedPrv = userKeychain.encryptedPrv;
      if (encryptedPrv && !_.isEmpty(encryptedPrv)) {
        // if the decryption fails, it will throw an error
        userPrv = this.bitgo.decrypt({
          input: encryptedPrv,
          password: txParams.walletPassphrase,
        });
      }
    }

    if (!userPrv) {
      const errorMessage = 'user private key unavailable for verification';
      if (disableNetworking) {
        console.log(errorMessage);
        return false;
      } else {
        throw new Error(errorMessage);
      }
    } else {
      const userPrivateKey = bip32.fromBase58(userPrv);
      if (userPrivateKey.toBase58() === userPrivateKey.neutered().toBase58()) {
        throw new Error('user private key is only public');
      }
      if (userPrivateKey.neutered().toBase58() !== userPub) {
        throw new Error('user private key does not match public key');
      }
    }

    return true;
  }

  /**
   * Verify signatures produced by the user key over the backup and bitgo keys.
   *
   * If set, these signatures ensure that the wallet keys cannot be changed after the wallet has been created.
   * @param {VerifyKeySignaturesOptions} params
   * @return {{backup: boolean, bitgo: boolean}}
   */
  protected verifyKeySignature(params: VerifyKeySignaturesOptions): boolean {
    // first, let's verify the integrity of the user key, whose public key is used for subsequent verifications
    const { userKeychain, keychainToVerify, keySignature } = params;
    if (!userKeychain) {
      throw new Error('user keychain is required');
    }

    if (!keychainToVerify) {
      throw new Error('keychain to verify is required');
    }

    if (!keySignature) {
      throw new Error('key signature is required');
    }

    // verify the signature against the user public key
    const publicKey = bip32.fromBase58(userKeychain.pub).publicKey;
    const signingAddress = utxolib.address.toBase58Check(
      utxolib.crypto.hash160(publicKey),
      utxolib.networks.bitcoin.pubKeyHash,
      this.network
    );

    // BG-5703: use BTC mainnet prefix for all key signature operations
    // (this means do not pass a prefix parameter, and let it use the default prefix instead)
    try {
      return bitcoinMessage.verify(keychainToVerify.pub, signingAddress, Buffer.from(keySignature, 'hex'));
    } catch (e) {
      debug('error thrown from bitcoinmessage while verifying key signature', e);
      return false;
    }
  }

  /**
   * Verify signatures against the user private key over the change wallet extended keys
   * @param {ParsedTransaction} tx
   * @param {Keychain} userKeychain
   * @return {boolean}
   * @protected
   */
  protected verifyCustomChangeKeySignatures(tx: ParsedTransaction, userKeychain: Keychain): boolean {
    if (!tx.customChange) {
      throw new Error('parsed transaction is missing required custom change verification data');
    }

    if (!Array.isArray(tx.customChange.keys) || !Array.isArray(tx.customChange.signatures)) {
      throw new Error('customChange property is missing keys or signatures');
    }

    for (const keyIndex of [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO]) {
      const keychainToVerify = tx.customChange.keys[keyIndex];
      const keySignature = tx.customChange.signatures[keyIndex];
      if (!keychainToVerify) {
        throw new Error(`missing required custom change ${KeyIndices[keyIndex].toLowerCase()} keychain public key`);
      }
      if (!keySignature) {
        throw new Error(`missing required custom change ${KeyIndices[keyIndex].toLowerCase()} keychain signature`);
      }
      if (!this.verifyKeySignature({ userKeychain, keychainToVerify, keySignature })) {
        debug('failed to verify custom change %s key signature!', KeyIndices[keyIndex].toLowerCase());
        return false;
      }
    }

    return true;
  }

  /**
   * Get the maximum percentage limit for pay-as-you-go outputs
   *
   * @protected
   */
  protected getPayGoLimit(allowPaygoOutput?: boolean): number {
    // allowing paygo outputs needs to be the default behavior, so only disallow paygo outputs if the
    // relevant verification option is both set and false
    if (!_.isNil(allowPaygoOutput) && !allowPaygoOutput) {
      return 0;
    }
    // 150 basis points is the absolute permitted maximum if paygo outputs are allowed
    return 0.015;
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param params
   * @param params.txParams params object passed to send
   * @param params.txPrebuild prebuild object returned by server
   * @param params.txPrebuild.txHex prebuilt transaction's txHex form
   * @param params.wallet Wallet object to obtain keys to verify against
   * @param params.verification Object specifying some verification parameters
   * @param params.verification.disableNetworking Disallow fetching any data from the internet for verification purposes
   * @param params.verification.keychains Pass keychains manually rather than fetching them by id
   * @param params.verification.addresses Address details to pass in for out-of-band verification
   * @returns {boolean}
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet, verification = { allowPaygoOutput: true }, reqId } = params;
    const disableNetworking = !!verification.disableNetworking;
    const parsedTransaction: ParsedTransaction = await this.parseTransaction({
      txParams,
      txPrebuild,
      wallet,
      verification,
      reqId,
    });

    const keychains = parsedTransaction.keychains;

    // verify that the claimed user public key corresponds to the wallet's user private key
    let userPublicKeyVerified = false;
    try {
      // verify the user public key matches the private key - this will throw if there is no match
      userPublicKeyVerified = this.verifyUserPublicKey({ userKeychain: keychains.user, disableNetworking, txParams });
    } catch (e) {
      debug('failed to verify user public key!', e);
    }

    // let's verify these keychains
    const keySignatures = parsedTransaction.keySignatures;
    if (!_.isEmpty(keySignatures)) {
      const verify = (key, pub) =>
        this.verifyKeySignature({ userKeychain: keychains.user, keychainToVerify: key, keySignature: pub });
      const isBackupKeySignatureValid = verify(keychains.backup, keySignatures.backupPub);
      const isBitgoKeySignatureValid = verify(keychains.bitgo, keySignatures.bitgoPub);
      if (!isBackupKeySignatureValid || !isBitgoKeySignatureValid) {
        throw new Error('secondary public key signatures invalid');
      }
      debug('successfully verified backup and bitgo key signatures');
    } else if (!disableNetworking) {
      // these keys were obtained online and their signatures were not verified
      // this could be dangerous
      console.log('unsigned keys obtained online are being used for address verification');
    }

    if (parsedTransaction.needsCustomChangeKeySignatureVerification) {
      if (!keychains.user || !userPublicKeyVerified) {
        throw new Error('transaction requires verification of user public key, but it was unable to be verified');
      }
      const customChangeKeySignaturesVerified = this.verifyCustomChangeKeySignatures(parsedTransaction, keychains.user);
      if (!customChangeKeySignaturesVerified) {
        throw new Error(
          'transaction requires verification of custom change key signatures, but they were unable to be verified'
        );
      }
      debug('successfully verified user public key and custom change key signatures');
    }

    const missingOutputs = parsedTransaction.missingOutputs;
    if (missingOutputs.length !== 0) {
      // there are some outputs in the recipients list that have not made it into the actual transaction
      throw new Error('expected outputs missing in transaction prebuild');
    }

    const intendedExternalSpend = parsedTransaction.explicitExternalSpendAmount;

    // this is a limit we impose for the total value that is amended to the transaction beyond what was originally intended
    const payAsYouGoLimit = intendedExternalSpend * this.getPayGoLimit(verification.allowPaygoOutput);

    /*
    Some explanation for why we're doing what we're doing:
    Some customers will have an output to BitGo's PAYGo wallet added to their transaction, and we need to account for
    it here. To protect someone tampering with the output to make it send more than it should to BitGo, we define a
    threshold for the output's value above which we'll throw an error, because the paygo output should never be that
    high.
     */

    // make sure that all the extra addresses are change addresses
    // get all the additional external outputs the server added and calculate their values
    const nonChangeAmount = parsedTransaction.implicitExternalSpendAmount;

    debug(
      'Intended spend is %s, Non-change amount is %s, paygo limit is %s',
      intendedExternalSpend,
      nonChangeAmount,
      payAsYouGoLimit
    );

    // the additional external outputs can only be BitGo's pay-as-you-go fee, but we cannot verify the wallet address
    if (nonChangeAmount > payAsYouGoLimit) {
      // there are some addresses that are outside the scope of intended recipients that are not change addresses
      throw new Error('prebuild attempts to spend to unintended external recipients');
    }

    const allOutputs = parsedTransaction.outputs;
    if (!txPrebuild.txHex) {
      throw new Error(`txPrebuild.txHex not set`);
    }
    const transaction = this.createTransactionFromHex(txPrebuild.txHex);
    const transactionCache = {};
    const inputs = await Promise.all(
      transaction.ins.map(async (currentInput) => {
        const transactionId = (Buffer.from(currentInput.hash).reverse() as Buffer).toString('hex');
        const txHex = txPrebuild.txInfo?.txHexes?.[transactionId];
        if (txHex) {
          const localTx = this.createTransactionFromHex(txHex);
          if (localTx.getId() !== transactionId) {
            throw new Error('input transaction hex does not match id');
          }
          const currentOutput = localTx.outs[currentInput.index];
          const address = utxolib.address.fromOutputScript(currentOutput.script, this.network);
          return {
            address,
            value: currentOutput.value,
          };
        } else if (!transactionCache[transactionId]) {
          if (disableNetworking) {
            throw new Error('attempting to retrieve transaction details externally with networking disabled');
          }
          if (reqId) {
            this.bitgo.setRequestTracer(reqId);
          }
          transactionCache[transactionId] = await this.bitgo.get(this.url(`/public/tx/${transactionId}`)).result();
        }
        const transactionDetails = transactionCache[transactionId];
        return transactionDetails.outputs[currentInput.index];
      })
    );

    const inputAmount = _.sumBy(inputs, 'value');
    const outputAmount = _.sumBy(allOutputs, 'amount');
    const fee = inputAmount - outputAmount;

    if (fee < 0) {
      throw new Error(
        `attempting to spend ${outputAmount} satoshis, which exceeds the input amount (${inputAmount} satoshis) by ${-fee}`
      );
    }

    return true;
  }

  /**
   * Make sure an address is valid and throw an error if it's not.
   * @param params.address The address string on the network
   * @param params.addressType
   * @param params.keychains Keychain objects with xpubs
   * @param params.coinSpecific Coin-specific details for the address such as a witness script
   * @param params.chain Derivation chain
   * @param params.index Derivation index
   * @throws {InvalidAddressError}
   * @throws {InvalidAddressDerivationPropertyError}
   * @throws {UnexpectedAddressError}
   */
  verifyAddress(params: VerifyAddressOptions): boolean {
    const { address, addressType, keychains, coinSpecific, chain, index } = params;

    if (!this.isValidAddress(address)) {
      throw new errors.InvalidAddressError(`invalid address: ${address}`);
    }

    if ((_.isUndefined(chain) && _.isUndefined(index)) || !(_.isFinite(chain) && _.isFinite(index))) {
      throw new errors.InvalidAddressDerivationPropertyError(
        `address validation failure: invalid chain (${chain}) or index (${index})`
      );
    }

    if (!_.isObject(coinSpecific)) {
      throw new errors.InvalidAddressVerificationObjectPropertyError(
        'address validation failure: coinSpecific field must be an object'
      );
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    const expectedAddress = this.generateAddress({
      addressType: addressType as ScriptType2Of3,
      keychains,
      threshold: 2,
      chain,
      index,
    });

    if (expectedAddress.address !== address) {
      throw new errors.UnexpectedAddressError(
        `address validation failure: expected ${expectedAddress.address} but got ${address}`
      );
    }

    return true;
  }

  /**
   * Indicates whether coin supports a block target
   * @returns {boolean}
   */
  supportsBlockTarget() {
    return true;
  }

  /**
   * @param addressType
   * @returns true iff coin supports spending from unspentType
   */
  supportsAddressType(addressType: ScriptType2Of3): boolean {
    return utxolib.bitgo.outputScripts.isSupportedScriptType(this.network, addressType);
  }

  /**
   * @param chain
   * @return true iff coin supports spending from chain
   */
  supportsAddressChain(chain: number): boolean {
    return isChainCode(chain) && this.supportsAddressType(utxolib.bitgo.scriptTypeForChain(chain));
  }

  keyIdsForSigning(): number[] {
    return [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO];
  }

  /**
   * TODO(BG-11487): Remove addressType, segwit, and bech32 params in SDKv6
   * Generate an address for a wallet based on a set of configurations
   * @param params.addressType {string}   Deprecated
   * @param params.keychains   {[object]} Array of objects with xpubs
   * @param params.threshold   {number}   Minimum number of signatures
   * @param params.chain       {number}   Derivation chain (see https://github.com/BitGo/unspents/blob/master/src/codes.ts for
   *                                                 the corresponding address type of a given chain code)
   * @param params.index       {number}   Derivation index
   * @param params.segwit      {boolean}  Deprecated
   * @param params.bech32      {boolean}  Deprecated
   * @returns {{chain: number, index: number, coin: number, coinSpecific: {outputScript, redeemScript}}}
   */
  generateAddress(params: GenerateAddressOptions): AddressDetails {
    const { keychains, threshold, chain, index, segwit = false, bech32 = false } = params;
    let derivationChain = getExternalChainCode('p2sh');
    if (_.isNumber(chain) && _.isInteger(chain) && isChainCode(chain)) {
      derivationChain = chain;
    }

    function convertFlagsToAddressType(): ScriptType2Of3 {
      if (isChainCode(chain)) {
        return utxolib.bitgo.scriptTypeForChain(chain);
      }
      if (_.isBoolean(segwit) && segwit) {
        return 'p2shP2wsh';
      } else if (_.isBoolean(bech32) && bech32) {
        return 'p2wsh';
      } else {
        return 'p2sh';
      }
    }

    const addressType = params.addressType || convertFlagsToAddressType();

    if (addressType !== utxolib.bitgo.scriptTypeForChain(derivationChain)) {
      throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
    }

    if (!this.supportsAddressType(addressType)) {
      switch (addressType) {
        case 'p2sh':
          throw new Error(`internal error: p2sh should always be supported`);
        case 'p2shP2wsh':
          throw new errors.P2shP2wshUnsupportedError();
        case 'p2wsh':
          throw new errors.P2wshUnsupportedError();
        case 'p2tr':
          throw new errors.P2trUnsupportedError();
        default:
          throw new errors.UnsupportedAddressTypeError();
      }
    }

    let signatureThreshold = 2;
    if (_.isInteger(threshold)) {
      signatureThreshold = threshold as number;
      if (signatureThreshold <= 0) {
        throw new Error('threshold has to be positive');
      }
      if (signatureThreshold > keychains.length) {
        throw new Error('threshold cannot exceed number of keys');
      }
    }

    let derivationIndex = 0;
    if (_.isInteger(index) && (index as number) > 0) {
      derivationIndex = index as number;
    }

    const path = '0/0/' + derivationChain + '/' + derivationIndex;
    const hdNodes = keychains.map(({ pub }) => bip32.fromBase58(pub));
    const derivedKeys = hdNodes.map((hdNode) => hdNode.derivePath(sanitizeLegacyPath(path)).publicKey);

    const { outputScript, redeemScript, witnessScript, address } = this.createMultiSigAddress(
      addressType,
      signatureThreshold,
      derivedKeys
    );

    return {
      address,
      chain: derivationChain,
      index: derivationIndex,
      coin: this.getChain(),
      coinSpecific: {
        outputScript: outputScript.toString('hex'),
        redeemScript: redeemScript && redeemScript.toString('hex'),
        witnessScript: witnessScript && witnessScript.toString('hex'),
      },
      addressType,
    };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params - {@see SignTransactionOptions}
   * @returns {Promise<SignedTransaction | HalfSignedUtxoTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction | HalfSignedUtxoTransaction> {
    const txPrebuild = params.txPrebuild;
    const userPrv = params.prv;

    if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
      if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
        throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
      }
      throw new Error('missing txPrebuild parameter');
    }
    const transaction = this.createTransactionFromHex(txPrebuild.txHex);

    if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
      throw new Error('length of unspents array should equal to the number of transaction inputs');
    }

    let isLastSignature = false;
    if (_.isBoolean(params.isLastSignature)) {
      // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
      isLastSignature = params.isLastSignature;
    }

    if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
      if (!_.isUndefined(userPrv)) {
        throw new Error(`prv must be a string, got type ${typeof userPrv}`);
      }
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!params.pubs || params.pubs.length !== 3) {
      throw new Error(`must provide xpub array`);
    }

    const signerKeychain = bip32.fromBase58(userPrv, utxolib.networks.bitcoin);
    if (signerKeychain.isNeutered()) {
      throw new Error('expected user private key but received public key');
    }
    debug(`Here is the public key of the xprv you used to sign: ${signerKeychain.neutered().toBase58()}`);

    const cosignerPub = params.cosignerPub ?? params.pubs[2];
    const keychains = params.pubs.map((pub) => bip32.fromBase58(pub)) as Triple<bip32.BIP32Interface>;
    const cosignerKeychain = bip32.fromBase58(cosignerPub);

    const signedTransaction = signAndVerifyWalletTransaction(
      transaction,
      txPrebuild.txInfo.unspents,
      new WalletUnspentSigner<RootWalletKeys>(keychains, signerKeychain, cosignerKeychain),
      { isLastSignature }
    );

    return {
      txHex: signedTransaction.toBuffer().toString('hex'),
    };
  }

  /**
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent(unspent: Unspent): boolean {
    return isReplayProtectionUnspent(unspent, this.network);
  }

  /**
   * @deprecated - use utxolib.bitgo.getDefaultSigHash(network) instead
   * @returns {number}
   */
  get defaultSigHashType(): number {
    return utxolib.bitgo.getDefaultSigHash(this.network);
  }

  /**
   * @deprecated - use utxolib.bitcoin.verifySignature() instead
   */
  verifySignature(
    transaction: any,
    inputIndex: number,
    amount: number,
    verificationSettings: {
      signatureIndex?: number;
      publicKey?: string;
    } = {}
  ): boolean {
    if (transaction.network !== this.network) {
      throw new Error(`network mismatch`);
    }
    return utxolib.bitgo.verifySignature(transaction, inputIndex, amount, {
      signatureIndex: verificationSettings.signatureIndex,
      publicKey: verificationSettings.publicKey ? Buffer.from(verificationSettings.publicKey, 'hex') : undefined,
    });
  }

  /**
   * Decompose a raw transaction into useful information, such as the total amounts,
   * change amounts, and transaction outputs.
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = _.get(params, 'txHex');
    if (!txHex || !_.isString(txHex) || !txHex.match(/^([a-f0-9]{2})+$/i)) {
      throw new Error('invalid transaction hex, must be a valid hex string');
    }

    let transaction;
    try {
      transaction = this.createTransactionFromHex(txHex);
    } catch (e) {
      throw new Error('failed to parse transaction hex');
    }

    const id = transaction.getId();
    let spendAmount = 0;
    let changeAmount = 0;
    const explanation = {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'],
      id: id,
      outputs: [] as Output[],
      changeOutputs: [] as Output[],
    } as TransactionExplanation;

    const { changeAddresses = [], unspents = [] } = params.txInfo ?? {};

    transaction.outs.forEach((currentOutput) => {
      const currentAddress = utxolib.address.fromOutputScript(currentOutput.script, this.network);
      const currentAmount = currentOutput.value;

      if (changeAddresses.includes(currentAddress)) {
        // this is change
        changeAmount += currentAmount;
        explanation.changeOutputs.push({
          address: currentAddress,
          amount: currentAmount,
        });
        return;
      }

      spendAmount += currentAmount;
      explanation.outputs.push({
        address: currentAddress,
        amount: currentAmount,
      });
    });
    explanation.outputAmount = spendAmount;
    explanation.changeAmount = changeAmount;

    // add fee info if available
    if (params.feeInfo) {
      explanation.displayOrder.push('fee');
      explanation.fee = params.feeInfo;
    }

    if (_.isInteger(transaction.locktime) && transaction.locktime > 0) {
      explanation.locktime = transaction.locktime;
      explanation.displayOrder.push('locktime');
    }

    const prevOutputs = params.txInfo?.unspents.map((u) => toOutput(u, this.network));

    // if keys are provided, prepare the keys for input signature checking
    const keys = params.pubs?.map((xpub) => bip32.fromBase58(xpub));
    const walletKeys = keys && keys.length === 3 ? new RootWalletKeys(keys as Triple<bip32.BIP32Interface>) : undefined;

    // get the number of signatures per input
    const inputSignatureCounts = transaction.ins.map((input, idx): number => {
      if (unspents.length !== transaction.ins.length) {
        return 0;
      }

      if (!prevOutputs) {
        throw new Error(`invalid state`);
      }

      if (!walletKeys) {
        // no pub keys or incorrect number of pub keys
        return 0;
      }

      try {
        return verifySignatureWithUnspent(transaction, idx, unspents, walletKeys).filter((v) => v).length;
      } catch (e) {
        // some other error occurred and we can't validate the signatures
        return 0;
      }
    });

    explanation.inputSignatures = inputSignatureCounts;
    explanation.signatures = _.max(inputSignatureCounts) as number;
    return explanation;
  }

  /**
   * Create a multisig address of a given type from a list of keychains and a signing threshold
   * @param addressType
   * @param signatureThreshold
   * @param keys
   */
  createMultiSigAddress(addressType: ScriptType2Of3, signatureThreshold: number, keys: Buffer[]): MultiSigAddress {
    const {
      scriptPubKey: outputScript,
      redeemScript,
      witnessScript,
    } = utxolib.bitgo.outputScripts.createOutputScript2of3(keys, addressType);

    return {
      outputScript,
      redeemScript,
      witnessScript,
      address: utxolib.address.fromOutputScript(outputScript, this.network),
    };
  }

  /**
   * @deprecated - use {@see backupKeyRecovery}
   * Builds a funds recovery transaction without BitGo
   * @param params - {@see backupKeyRecovery}
   */
  async recover(params: RecoverParams): ReturnType<typeof backupKeyRecovery> {
    return backupKeyRecovery(this, this.bitgo, params);
  }

  /**
   * Recover coin that was sent to wrong chain
   * @param params
   * @param params.txid The txid of the faulty transaction
   * @param params.recoveryAddress address to send recovered funds to
   * @param params.wallet the wallet that received the funds
   * @param params.recoveryCoin the coin type of the wallet that received the funds
   * @param params.signed return a half-signed transaction (default=true)
   * @param params.walletPassphrase the wallet passphrase
   * @param params.xprv the unencrypted xprv (used instead of wallet passphrase)
   * @returns {*}
   */
  async recoverFromWrongChain(
    params: RecoverFromWrongChainOptions
  ): Promise<CrossChainRecoverySigned | CrossChainRecoveryUnsigned> {
    const { txid, recoveryAddress, wallet, walletPassphrase, xprv } = params;

    // params.recoveryCoin used to be params.coin, backwards compatibility
    const recoveryCoin = params.coin || params.recoveryCoin;
    if (!recoveryCoin) {
      throw new Error('missing required object recoveryCoin');
    }
    // signed should default to true, and only be disabled if explicitly set to false (not undefined)
    const signed = params.signed !== false;

    const sourceCoinFamily = this.getFamily();
    const recoveryCoinFamily = recoveryCoin.getFamily();
    const supportedRecoveryCoins = config.supportedCrossChainRecoveries[sourceCoinFamily];

    if (_.isUndefined(supportedRecoveryCoins) || !supportedRecoveryCoins.includes(recoveryCoinFamily)) {
      throw new Error(`Recovery of ${sourceCoinFamily} balances from ${recoveryCoinFamily} wallets is not supported.`);
    }

    return await recoverCrossChain(this.bitgo, {
      sourceCoin: this,
      recoveryCoin,
      walletId: wallet,
      txid,
      recoveryAddress,
      walletPassphrase: signed ? walletPassphrase : undefined,
      xprv: signed ? xprv : undefined,
    });
  }

  /**
   * Generate bip32 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed: Buffer): { pub: string; prv: string } {
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

  async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions): Promise<any> {
    return {};
  }

  preCreateBitGo(params: PrecreateBitGoOptions): void {
    return;
  }

  async presignTransaction(params: PresignTransactionOptions): Promise<any> {
    return params;
  }

  async supplementGenerateWallet(
    walletParams: SupplementGenerateWalletOptions,
    keychains: KeychainsTriplet
  ): Promise<any> {
    return walletParams;
  }

  transactionDataAllowed(): boolean {
    return false;
  }

  valuelessTransferAllowed(): boolean {
    return false;
  }
}
