import { Codes, VirtualSizes } from '@bitgo/unspents';
import { UnspentType } from '@bitgo/unspents/dist/codes';
import * as bitcoin from '@bitgo/utxo-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import * as Bluebird from 'bluebird';
import { randomBytes } from 'crypto';
import * as debugLib from 'debug';
import * as _ from 'lodash';
import * as request from 'superagent';

import { deriveKeyByPath, hdPath } from '../../bitcoin';
import { BitGo } from '../../bitgo';
import * as config from '../../config';
import * as errors from '../../errors';

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
  TransactionParams as BaseTransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient,
  VerificationOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyRecoveryTransactionOptions,
  VerifyTransactionOptions,
} from '../baseCoin';
import { CustomChangeOptions, parseOutput } from '../internal/parseOutput';
import { RequestTracer } from '../internal/util';
import { Keychain, KeyIndices } from '../keychains';
import { promiseProps } from '../promise-utils';
import { CrossChainRecoveryTool } from '../recovery';
import { NodeCallback } from '../types';
import { Wallet } from '../wallet';

const debug = debugLib('bitgo:v2:utxo');
const co = Bluebird.coroutine;

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

export interface TransactionFee {
  fee: number;
  feeRate?: number;
  size: number
}

export interface TransactionExplanation {
  displayOrder: string[];
  id: string;
  outputs: Output[],
  changeOutputs: Output[],
  outputAmount: string;
  changeAmount: number;
  fee: TransactionFee;
}

export interface Unspent {
  id: string,
  value: string,
}

export interface ExplainTransactionOptions {
  txHex: string;
  txInfo?: { changeAddresses: string[], unspents: Unspent[] };
  feeInfo?: string;
}

export interface UtxoNetwork {
  pubKeyHash: number;
  scriptHash: number;
  altScriptHash?: number;
  bech32: string;
}

export interface ParsedSignatureScript {
  isSegwitInput: boolean;
  inputClassification: string;
  signatures?: Buffer[];
  publicKeys?: Buffer[];
  pubScript?: Buffer;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txInfo?: any;
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
  addressType?: string;
  keychains: {
    pub: string;
    aspKeyId?: string;
  }[];
  threshold: number;
  chain?: number;
  index: number;
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
  txPrebuild: {
    txHex: string;
    txInfo: {
      unspents: {
        chain?: number;
        index?: number;
        value?: number;
        address?: string;
        redeemScript?: string;
        witnessScript?: string;
      }[];
    }
  };
  prv: string;
  isLastSignature?: boolean;
}

export interface MultiSigAddress {
  outputScript: Buffer;
  redeemScript: Buffer;
  witnessScript: Buffer;
  address: string;
}

export interface OfflineVaultTxInfo {
  inputs: {
    chainPath: string;
  }[];
}

export interface RecoverFromWrongChainOptions {
  txid: string;
  recoveryAddress: string;
  wallet: string;
  walletPassphrase: string;
  xprv: string;
  coin?: AbstractUtxoCoin;
  recoveryCoin?: AbstractUtxoCoin;
  signed?: boolean;
}

export interface FormattedOfflineVaultTxInfo {
  txInfo: {
    unspents: {
      chainPath: string;
      index?: string;
      chain?: string;
    }[];
  };
  txHex: string;
  feeInfo: Record<string, never>;
  coin: string;
}

export interface AddressInfo {
  txCount: number;
  totalBalance: number;
}

export interface UnspentInfo {
  address: string;
}

export interface RecoverParams {
  scan?: number;
  userKey: string;
  backupKey: string;
  recoveryDestination: string;
  krsProvider: string;
  ignoreAddressTypes: string[];
  bitgoKey: string;
  walletPassphrase?: string;
  apiKey?: string;
  userKeyPath?: string;
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

export abstract class AbstractUtxoCoin extends BaseCoin {
  public altScriptHash?: number;
  public supportAltScriptDestination?: boolean;
  private readonly _network: UtxoNetwork;

  protected constructor(bitgo: BitGo, network: UtxoNetwork) {
    super(bitgo);
    if (!_.isObject(network)) {
      throw new Error('network must be an object');
    }
    this._network = network;
  }

  get network() {
    return this._network;
  }

  static get validAddressTypes(): UnspentType[] {
    const validAddressTypes: UnspentType[] = [];
    // best way I could find to loop over enum values
    // https://github.com/Microsoft/TypeScript/issues/17198#issuecomment-423836658
    // this is a typescript rough corner for sure
    const unspentTypeKeys: string[] = Object.keys(UnspentType);
    const unspentTypes: UnspentType[] = unspentTypeKeys
      .map(k => UnspentType[k as any])
      .map(v => v as UnspentType);
    for (const addressType of unspentTypes) {
      try {
        Codes.forType(addressType);
        validAddressTypes.push(addressType);
      } catch (e) {
        // Do nothing. Codes.forType will throw if the address type has no chain codes, meaning it is invalid on the
        // BitGo platform and should not be added to the validAddressTypes array.
      }
    }
    return validAddressTypes;
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    return 1e8;
  }

  /**
   * Get an instance of the library which can be used to perform low-level operations for this coin
   */
  getCoinLibrary() {
    return bitcoin;
  }

  /**
   * Helper to get the version number for an address
   */
  protected getAddressVersion(address: string): number | undefined {
    // try decoding as base58 first
    try {
      const { version } = this.getCoinLibrary().address.fromBase58Check(address);
      return version;
    } catch (e) {
      // if that fails, and we aren't supporting p2wsh, then we are done and did not find a version
      if (!this.supportsP2wsh()) {
        return;
      }
    }

    // otherwise, try decoding as bech32
    try {
      const { version, prefix } = this.getCoinLibrary().address.fromBech32(address);
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
      const { prefix } = this.getCoinLibrary().address.fromBech32(address);
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
    const validVersions = [
      this.network.pubKeyHash,
      this.network.scriptHash,
    ];
    if (this.altScriptHash && (forceAltScriptSupport || this.supportAltScriptDestination)) {
      validVersions.push(this.altScriptHash);
    }

    const addressVersion = this.getAddressVersion(address);

    // the address version needs to be among the valid ones
    const addressVersionValid = _.isNumber(addressVersion) && validVersions.includes(addressVersion);
    const addressPrefix = this.getAddressPrefix(address);

    if (!this.supportsP2wsh() || _.isUndefined(addressPrefix)) {
      return addressVersionValid;
    }

    // address has a potential bech32 prefix, validate that
    return _.isString(this.network.bech32) && this.network.bech32 === addressPrefix;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string) {
    try {
      bitcoin.HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the latest block height
   * @param reqId
   * @param callback
   */
  getLatestBlockHeight(reqId?: RequestTracer, callback?: NodeCallback<number>): Bluebird<number> {
    const self = this;
    return co<number>(function *() {
      if (reqId) {
        this.bitgo._reqId = reqId;
      }
      const chainhead = yield self.bitgo.get(self.url('/public/block/latest')).result();
      return (chainhead as any).height;
    }).call(this).asCallback(callback);
  }

  /**
   * Run custom coin logic after a transaction prebuild has been received from BitGo
   * @param prebuild
   * @param callback
   */
  postProcessPrebuild(prebuild: TransactionPrebuild, callback?: NodeCallback<TransactionPrebuild>): Bluebird<TransactionPrebuild> {
    const self = this;
    return co<TransactionPrebuild>(function *(): any {
      if (_.isUndefined(prebuild.txHex)) {
        throw new Error('missing required txPrebuild property txHex');
      }
      const transaction = bitcoin.Transaction.fromHex(prebuild.txHex, self.network);
      if (_.isUndefined(prebuild.blockHeight)) {
        prebuild.blockHeight = (yield self.getLatestBlockHeight()) as number;
      }
      // Lock transaction to the next block to discourage fee sniping
      // See: https://github.com/bitcoin/bitcoin/blob/fb0ac482eee761ec17ed2c11df11e054347a026d/src/wallet/wallet.cpp#L2133
      transaction.locktime = prebuild.blockHeight;
      return _.extend({}, prebuild, { txHex: transaction.toHex() });
    }).call(this).asCallback(callback);
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
  static inferAddressType(addressDetails: { coinSpecific: AddressCoinSpecific }): string | null {
    if (_.isObject(addressDetails.coinSpecific)) {
      if (_.isString(addressDetails.coinSpecific.redeemScript) && _.isString(addressDetails.coinSpecific.witnessScript)) {
        return Codes.UnspentTypeTcomb('p2shP2wsh');
      } else if (_.isString(addressDetails.coinSpecific.redeemScript)) {
        return Codes.UnspentTypeTcomb('p2sh');
      } else if (_.isString(addressDetails.coinSpecific.witnessScript)) {
        return Codes.UnspentTypeTcomb('p2wsh');
      }
    }
    return null;
  }

  /**
   * Extract and fill transaction details such as internal/change spend, external spend (explicit vs. implicit), etc.
   * @param params
   * @param callback
   * @returns {*}
   */
  parseTransaction(params: ParseTransactionOptions, callback?: NodeCallback<ParsedTransaction>): Bluebird<ParsedTransaction> {
    const self = this;
    return co<ParsedTransaction>(function *(): any {
      const {
        txParams,
        txPrebuild,
        wallet,
        verification = {},
        reqId,
      } = params;

      if (!_.isUndefined(verification.disableNetworking) && !_.isBoolean(verification.disableNetworking)) {
        throw new Error('verification.disableNetworking must be a boolean');
      }
      const disableNetworking = verification.disableNetworking;

      async function fetchKeychains(wallet: Wallet): Promise<VerificationOptions['keychains']> {
        return promiseProps({
          user: self.keychains().get({ id: wallet.keyIds()[KeyIndices.USER], reqId }),
          backup: self.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP], reqId }),
          bitgo: self.keychains().get({ id: wallet.keyIds()[KeyIndices.BITGO], reqId }),
        });
      }

      // obtain the keychains and key signatures
      let keychains: VerificationOptions['keychains'] | undefined = verification.keychains;
      if (!keychains) {
        if (disableNetworking) {
          throw new Error('cannot fetch keychains without networking');
        }
        keychains = yield fetchKeychains(wallet);
      }

      if (!keychains || !keychains.user || !keychains.backup || !keychains.bitgo) {
        throw new Error('keychains are required, but could not be fetched');
      }

      const keychainArray: [Keychain, Keychain, Keychain] = [keychains.user, keychains.backup, keychains.bitgo];

      const keySignatures = _.get(wallet, '_wallet.keySignatures');

      if (_.isUndefined(txPrebuild.txHex)) {
        throw new Error('missing required txPrebuild property txHex');
      }
      // obtain all outputs
      const explanation: TransactionExplanation = yield self.explainTransaction({
        txHex: txPrebuild.txHex,
        txInfo: txPrebuild.txInfo,
      });

      const allOutputs = [...explanation.outputs, ...explanation.changeOutputs];

      // verify that each recipient from txParams has their own output
      const expectedOutputs = _.get(txParams, 'recipients', [] as TransactionRecipient[]);
      const missingOutputs = AbstractUtxoCoin.findMissingOutputs(expectedOutputs, allOutputs);

      // get the keychains from the custom change wallet if needed
      let customChange: CustomChangeOptions | undefined;
      const { customChangeWalletId = undefined } = wallet.coinSpecific() || {};
      if (customChangeWalletId) {
        // fetch keychains from custom change wallet for deriving addresses.
        // These keychains should be signed and this should be verified in verifyTransaction
        const customChangeKeySignatures = _.get(wallet, '_wallet.customChangeKeySignatures', {});
        const customChangeWallet: Wallet = yield self.wallets().get({ id: customChangeWalletId });
        const customChangeKeys = yield fetchKeychains(customChangeWallet);

        if (!customChangeKeys) {
          throw new Error('failed to fetch keychains for custom change wallet');
        }
        const customChangeKeychains: [Keychain, Keychain, Keychain] = [customChangeKeys.user, customChangeKeys.backup, customChangeKeys.bitgo];

        if (customChangeKeychains && customChangeWallet) {
          customChange = {
            keys: customChangeKeychains,
            signatures: [customChangeKeySignatures.user, customChangeKeySignatures.backup, customChangeKeySignatures.bitgo],
          };
        }
      }

      /**
       * Loop through all the outputs and classify each of them as either internal spends
       * or external spends by setting the "external" property to true or false on the output object.
       */
      const allOutputDetails: Output[] = yield Bluebird.map(allOutputs, (currentOutput) => {
        return parseOutput({
          currentOutput,
          coin: self,
          txPrebuild,
          verification,
          keychainArray,
          wallet,
          txParams,
          customChange,
          reqId,
        });
      });

      const needsCustomChangeKeySignatureVerification = allOutputDetails.some((output) => output.needsCustomChangeKeySignatureVerification);

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

      const result: ParsedTransaction = {
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
      return result;
    }).call(this).asCallback(callback);
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
      if (!_.isEmpty(encryptedPrv)) {
        // if the decryption fails, it will throw an error
        userPrv = this.bitgo.decrypt({
          input: encryptedPrv,
          password: txParams.walletPassphrase,
        });
      }
    }

    if (_.isEmpty(userPrv)) {
      const errorMessage = 'user private key unavailable for verification';
      if (disableNetworking) {
        console.log(errorMessage);
        return false;
      } else {
        throw new Error(errorMessage);
      }
    } else {
      const userPrivateKey = bitcoin.HDNode.fromBase58(userPrv);
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
    const signingAddress = bitcoin.HDNode.fromBase58(userKeychain.pub).keyPair.getAddress();

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
   * @param callback
   * @returns {boolean}
   */
  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    const self = this;
    return co<boolean>(function *(): any {
      const { txParams, txPrebuild, wallet, verification = { allowPaygoOutput: true }, reqId } = params;
      const disableNetworking = !!verification.disableNetworking;
      const parsedTransaction: ParsedTransaction = yield self.parseTransaction({ txParams, txPrebuild, wallet, verification, reqId });

      const keychains = parsedTransaction.keychains;

      // verify that the claimed user public key corresponds to the wallet's user private key
      let userPublicKeyVerified = false;
      try {
        // verify the user public key matches the private key - this will throw if there is no match
        userPublicKeyVerified = self.verifyUserPublicKey({ userKeychain: keychains.user, disableNetworking, txParams });
      } catch (e) {
        debug('failed to verify user public key!', e);
      }

      // let's verify these keychains
      const keySignatures = parsedTransaction.keySignatures;
      if (!_.isEmpty(keySignatures)) {
        const verify = (key, pub) => self.verifyKeySignature({ userKeychain: keychains.user, keychainToVerify: key, keySignature: pub });
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
        const customChangeKeySignaturesVerified = self.verifyCustomChangeKeySignatures(parsedTransaction, keychains.user);
        if (!customChangeKeySignaturesVerified) {
          throw new Error('transaction requires verification of custom change key signatures, but they were unable to be verified');
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
      const payAsYouGoLimit = intendedExternalSpend * self.getPayGoLimit(verification.allowPaygoOutput);

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

      debug('Intended spend is %s, Non-change amount is %s, paygo limit is %s', intendedExternalSpend, nonChangeAmount, payAsYouGoLimit);

      // the additional external outputs can only be BitGo's pay-as-you-go fee, but we cannot verify the wallet address
      if (nonChangeAmount > payAsYouGoLimit) {
        // there are some addresses that are outside the scope of intended recipients that are not change addresses
        throw new Error('prebuild attempts to spend to unintended external recipients');
      }

      const allOutputs = parsedTransaction.outputs;
      const transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex, self.network);
      const transactionCache = {};
      const inputs = yield Bluebird.map(transaction.ins, co(function *(currentInput) {
        const transactionId = (Buffer.from(currentInput.hash).reverse() as Buffer).toString('hex');
        const txHex = _.get(txPrebuild, `txInfo.txHexes.${transactionId}`);
        if (txHex) {
          const localTx = bitcoin.Transaction.fromHex(txHex, self.network);
          if (localTx.getId() !== transactionId) {
            throw new Error('input transaction hex does not match id');
          }
          const currentOutput = localTx.outs[currentInput.index];
          const address = bitcoin.address.fromOutputScript(currentOutput.script, self.network);
          return {
            address,
            value: currentOutput.value,
          };
        } else if (!transactionCache[transactionId]) {
          if (disableNetworking) {
            throw new Error('attempting to retrieve transaction details externally with networking disabled');
          }
          if (reqId) {
            self.bitgo.setRequestTracer(reqId);
          }
          transactionCache[transactionId] = yield self.bitgo.get(self.url(`/public/tx/${transactionId}`)).result();
        }
        const transactionDetails = transactionCache[transactionId];
        return transactionDetails.outputs[currentInput.index];
      }).bind(this));

      const inputAmount = _.sumBy(inputs, 'value');
      const outputAmount = _.sumBy(allOutputs, 'amount');
      const fee = inputAmount - outputAmount;

      if (fee < 0) {
        throw new Error(`attempting to spend ${outputAmount} satoshis, which exceeds the input amount (${inputAmount} satoshis) by ${-fee}`);
      }

      return true;
    }).call(this).asCallback(callback);
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

    if ((_.isUndefined(chain) && _.isUndefined(index)) || (!(_.isFinite(chain) && _.isFinite(index)))) {
      throw new errors.InvalidAddressDerivationPropertyError(`address validation failure: invalid chain (${chain}) or index (${index})`);
    }

    if (!_.isObject(coinSpecific)) {
      throw new errors.InvalidAddressVerificationObjectPropertyError('address validation failure: coinSpecific field must be an object');
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    const expectedAddress = this.generateAddress({
      addressType,
      keychains,
      threshold: 2,
      chain,
      index,
    });

    if (expectedAddress.address !== address) {
      throw new errors.UnexpectedAddressError(`address validation failure: expected ${expectedAddress.address} but got ${address}`);
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
   * Indicates whether a coin supports wrapped segwit outputs
   * @returns {boolean}
   */
  supportsP2shP2wsh() {
    return false;
  }

  /**
   * Indicates whether a coin supports native segwit outputs
   * @returns {boolean}
   */
  supportsP2wsh() {
    return false;
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
    let derivationChain = 0;
    if (_.isNumber(chain) && _.isInteger(chain) && chain > 0) {
      derivationChain = chain;
    }

    function convertFlagsToAddressType(): string {
      if (_.isBoolean(segwit) && segwit) {
        return Codes.UnspentTypeTcomb('p2shP2wsh');
      } else if (_.isBoolean(bech32) && bech32) {
        return Codes.UnspentTypeTcomb('p2wsh');
      } else {
        return Codes.UnspentTypeTcomb('p2sh');
      }
    }

    const addressType = params.addressType || convertFlagsToAddressType();

    switch (addressType) {
      case Codes.UnspentTypeTcomb('p2sh'):
        if (!Codes.isP2sh(derivationChain)) {
          throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
        }
        break;
      case Codes.UnspentTypeTcomb('p2shP2wsh'):
        if (!this.supportsP2shP2wsh()) {
          throw new errors.P2shP2wshUnsupportedError();
        }

        if (!Codes.isP2shP2wsh(derivationChain)) {
          throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
        }
        break;
      case Codes.UnspentTypeTcomb('p2wsh'):
        if (!this.supportsP2wsh()) {
          throw new errors.P2wshUnsupportedError();
        }

        if (!Codes.isP2wsh(derivationChain)) {
          throw new errors.AddressTypeChainMismatchError(addressType, derivationChain);
        }
        break;
      default:
        throw new errors.UnsupportedAddressTypeError();
    }

    let signatureThreshold = 2;
    if (_.isInteger(threshold)) {
      signatureThreshold = threshold;
      if (signatureThreshold <= 0) {
        throw new Error('threshold has to be positive');
      }
      if (signatureThreshold > keychains.length) {
        throw new Error('threshold cannot exceed number of keys');
      }
    }

    let derivationIndex = 0;
    if (_.isInteger(index) && index > 0) {
      derivationIndex = index;
    }

    const path = 'm/0/0/' + derivationChain + '/' + derivationIndex;
    const hdNodes = keychains.map(({ pub }) => bitcoin.HDNode.fromBase58(pub));
    const derivedKeys = hdNodes.map(hdNode => hdPath(hdNode).deriveKey(path).getPublicKeyBuffer());

    const { outputScript, redeemScript, witnessScript, address } =
      this.createMultiSigAddress(addressType, signatureThreshold, derivedKeys);

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
   * @param params
   * @param params.txPrebuild transaction prebuild from bitgo server
   * @param params.prv private key to be used for signing
   * @param params.isLastSignature True if `TransactionBuilder.build()` should be called and not `TransactionBuilder.buildIncomplete()`
   * @param callback
   * @returns {Bluebird<SignedTransaction>}
   */
  signTransaction(params: SignTransactionOptions, callback?: NodeCallback<SignedTransaction>): Bluebird<SignedTransaction> {
    const self = this;
    return co<SignedTransaction>(function *() {
      const txPrebuild = params.txPrebuild;
      const userPrv = params.prv;

      if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
        if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
          throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
        }
        throw new Error('missing txPrebuild parameter');
      }
      let transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex, self.network);

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

      const keychain = bitcoin.HDNode.fromBase58(userPrv);

      if (keychain.toBase58() === keychain.neutered().toBase58()) {
        throw new Error('expected user private key but received public key');
      }
      debug(`Here is the public key of the xprv you used to sign: ${keychain.neutered().toBase58()}`);

      const keychainHdPath = hdPath(keychain);
      const txb = bitcoin.TransactionBuilder.fromTransaction(transaction, self.network);
      self.prepareTransactionBuilder(txb);

      const getSignatureContext = (txPrebuild: TransactionPrebuild, index: number) => {
        const currentUnspent = txPrebuild.txInfo.unspents[index];
        return {
          inputIndex: index,
          unspent: currentUnspent,
          path: 'm/0/0/' + currentUnspent.chain + '/' + currentUnspent.index,
          isP2wsh: !currentUnspent.redeemScript,
          isBitGoTaintedUnspent: self.isBitGoTaintedUnspent(currentUnspent),
          error: undefined as Error | undefined,
        };
      };

      const signatureIssues: ReturnType<typeof getSignatureContext>[] = [];
      // Sign inputs
      for (let index = 0; index < transaction.ins.length; ++index) {
        debug('Signing input %d of %d', index + 1, transaction.ins.length);
        const signatureContext = getSignatureContext(txPrebuild, index);
        if (signatureContext.isBitGoTaintedUnspent) {
          debug(
            'Skipping input %d of %d (unspent from replay protection address which is platform signed only)',
            index + 1, transaction.ins.length
          );
          continue;
        }
        const privKey = keychainHdPath.deriveKey(signatureContext.path);
        privKey.network = self.network;

        debug('Input details: %O', signatureContext);

        const sigHashType = self.defaultSigHashType;
        try {
          if (signatureContext.isP2wsh) {
            debug('Signing p2wsh input');
            const witnessScript = Buffer.from(signatureContext.unspent.witnessScript, 'hex');
            const witnessScriptHash = bitcoin.crypto.sha256(witnessScript);
            const prevOutScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
            txb.sign(index, privKey, prevOutScript, sigHashType, signatureContext.unspent.value, witnessScript);
          } else {
            const subscript = Buffer.from(signatureContext.unspent.redeemScript, 'hex');
            const isP2shP2wsh = !!signatureContext.unspent.witnessScript;
            if (isP2shP2wsh) {
              debug('Signing p2shP2wsh input');
              const witnessScript = Buffer.from(signatureContext.unspent.witnessScript, 'hex');
              txb.sign(index, privKey, subscript, sigHashType, signatureContext.unspent.value, witnessScript);
            } else {
              debug('Signing p2sh input');
              txb.sign(index, privKey, subscript, sigHashType, signatureContext.unspent.value);
            }
          }

        } catch (e) {
          debug('Failed to sign input:', e);
          signatureContext.error = e;
          signatureIssues.push(signatureContext);
          continue;
        }
        debug('Successfully signed input %d of %d', index + 1, transaction.ins.length);
      }

      if (isLastSignature) {
        transaction = txb.build();
      } else {
        transaction = txb.buildIncomplete();
      }

      // Verify input signatures
      for (let index = 0; index < transaction.ins.length; ++index) {
        debug('Verifying input signature %d of %d', index + 1, transaction.ins.length);
        const signatureContext = getSignatureContext(txPrebuild, index);
        if (signatureContext.isBitGoTaintedUnspent) {
          debug(
            'Skipping input signature %d of %d (unspent from replay protection address which is platform signed only)',
            index + 1, transaction.ins.length
          );
          continue;
        }

        if (signatureContext.isP2wsh) {
          transaction.setInputScript(index, Buffer.alloc(0));
        }

        const isValidSignature = self.verifySignature(transaction, index, signatureContext.unspent.value);
        if (!isValidSignature) {
          debug('Invalid signature');
          signatureContext.error = new Error('invalid signature');
          signatureIssues.push(signatureContext);
        }
      }

      if (signatureIssues.length > 0) {
        const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
        const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
        error.code = 'input_signature_failure';
        error.signingErrors = signatureIssues;
        throw error;
      }

      return {
        txHex: transaction.toBuffer().toString('hex'),
      };
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Always false for coins other than BCH and TBCH.
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent(unspent: Unspent) {
    return false;
  }

  /**
   * Modify the transaction builder to comply with the specific coin's requirements such as version and branch id
   * @param txBuilder
   * @returns {*}
   */
  prepareTransactionBuilder(txBuilder: any): any {
    return txBuilder;
  }

  /**
   * Get the default sighash type to be used when signing transactions
   * @returns {number}
   */
  get defaultSigHashType(): number {
    return bitcoin.Transaction.SIGHASH_ALL;
  }

  /**
   * Parse a transaction's signature script to obtain public keys, signatures, the sig script, and other properties
   * @param transaction
   * @param inputIndex
   * @returns { isSegwitInput: boolean, inputClassification: string, signatures: [Buffer], publicKeys: [Buffer], pubScript: Buffer }
   */
  parseSignatureScript(transaction: any, inputIndex: number): ParsedSignatureScript {
    const currentInput = transaction.ins[inputIndex];
    const isSegwitInput = currentInput.witness.length > 0;
    const isNativeSegwitInput = currentInput.script.length === 0;
    let decompiledSigScript, inputClassification;
    if (isSegwitInput) {
      // The decompiledSigScript is the script containing the signatures, public keys, and the script that was committed
      // to (pubScript). If this is a segwit input the decompiledSigScript is in the witness, regardless of whether it
      // is native or not. The inputClassification is determined based on whether or not the input is native to give an
      // accurate classification. Note that p2shP2wsh inputs will be classified as p2sh and not p2wsh.
      decompiledSigScript = currentInput.witness;
      if (isNativeSegwitInput) {
        inputClassification = bitcoin.script.classifyWitness(bitcoin.script.compile(decompiledSigScript), true);
      } else {
        inputClassification = bitcoin.script.classifyInput(currentInput.script, true);
      }
    } else {
      inputClassification = bitcoin.script.classifyInput(currentInput.script, true);
      decompiledSigScript = bitcoin.script.decompile(currentInput.script);
    }

    if (inputClassification === bitcoin.script.types.P2PKH) {
      const [signature, publicKey] = decompiledSigScript;
      const publicKeys = [publicKey];
      const signatures = [signature];
      const pubScript = bitcoin.script.pubKeyHash.output.encode(bitcoin.crypto.hash160(publicKey));

      return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
    } else if (inputClassification === bitcoin.script.types.P2SH
        || inputClassification === bitcoin.script.types.P2WSH) {
      // Note the assumption here that if we have a p2sh or p2wsh input it will be multisig (appropriate because the
      // BitGo platform only supports multisig within these types of inputs). Signatures are all but the last entry in
      // the decompiledSigScript. The redeemScript/witnessScript (depending on which type of input this is) is the last
      // entry in the decompiledSigScript (denoted here as the pubScript). The public keys are the second through
      // antepenultimate entries in the decompiledPubScript. See below for a visual representation of the typical 2-of-3
      // multisig setup:
      //
      // decompiledSigScript = 0 <sig1> <sig2> <pubScript>
      // decompiledPubScript = 2 <pub1> <pub2> <pub3> 3 OP_CHECKMULTISIG
      const signatures = decompiledSigScript.slice(0, -1);
      const pubScript = _.last<Buffer>(decompiledSigScript);
      const decompiledPubScript = bitcoin.script.decompile(pubScript);
      const publicKeys = decompiledPubScript.slice(1, -2);

      // Op codes 81 through 96 represent numbers 1 through 16 (see https://en.bitcoin.it/wiki/Script#Opcodes), which is
      // why we subtract by 80 to get the number of signatures (n) and the number of public keys (m) in an n-of-m setup.
      const len = decompiledPubScript.length;
      const nSignatures = decompiledPubScript[0] - 80;
      const nPubKeys = decompiledPubScript[len - 2] - 80;

      // Due to a bug in the implementation of multisignature in the bitcoin protocol, a 0 is added to the signature
      // script, so we add 1 when asserting the number of signatures matches the number of signatures expected by the
      // pub script. Also, note that we consider a signature script with the the same number of signatures as public
      // keys (+1 as noted above) valid because we use placeholder signatures when parsing a half-signed signature
      // script.
      if (signatures.length !== nSignatures + 1 && signatures.length !== nPubKeys + 1) {
        throw new Error(`expected ${nSignatures} or ${nPubKeys} signatures, got ${signatures.length - 1}`);
      }

      if (publicKeys.length !== nPubKeys) {
        throw new Error(`expected ${nPubKeys} public keys, got ${publicKeys.length}`);
      }

      const lastOpCode = decompiledPubScript[len - 1];
      if (lastOpCode !== bitcoin.opcodes.OP_CHECKMULTISIG) {
        throw new Error(`expected opcode #${bitcoin.opcodes.OP_CHECKMULTISIG}, got opcode #${lastOpCode}`);
      }

      return { isSegwitInput, inputClassification, signatures, publicKeys, pubScript };
    } else {
      return { isSegwitInput, inputClassification };
    }
  }

  /**
   * Calculate the hash to verify the signature against
   * @param transaction Transaction object
   * @param inputIndex
   * @param pubScript
   * @param amount The previous output's amount
   * @param hashType
   * @param isSegwitInput
   * @returns {*}
   */
  calculateSignatureHash(transaction: any, inputIndex: number, pubScript: Buffer, amount: number, hashType: number, isSegwitInput: boolean): Buffer {
    if (isSegwitInput) {
      return transaction.hashForWitnessV0(inputIndex, pubScript, amount, hashType);
    } else {
      return transaction.hashForSignature(inputIndex, pubScript, hashType);
    }
  }

  /**
   * Verify the signature on a (half-signed) transaction
   * @param transaction bitcoinjs-lib tx object
   * @param inputIndex The input whererfore to check the signature
   * @param amount For segwit and BCH, the input amount needs to be known for signature verification
   * @param verificationSettings
   * @param verificationSettings.signatureIndex The index of the signature to verify (only iterates over non-empty signatures)
   * @param verificationSettings.publicKey The hex of the public key to verify (will verify all signatures)
   * @returns {boolean}
   */
  verifySignature(transaction: any, inputIndex: number, amount: number, verificationSettings: {
    signatureIndex?: number;
    publicKey?: string;
  } = {}): boolean {
    const { signatures, publicKeys, isSegwitInput, inputClassification, pubScript } =
        this.parseSignatureScript(transaction, inputIndex);

    if (![bitcoin.script.types.P2WSH, bitcoin.script.types.P2SH, bitcoin.script.types.P2PKH].includes(inputClassification)) {
      return false;
    }

    if (!publicKeys || publicKeys.length === 0) {
      return false;
    }

    if (isSegwitInput && !amount) {
      return false;
    }

    // get the first non-empty signature and verify it against all public keys
    const nonEmptySignatures = _.filter(signatures, s => !_.isEmpty(s));

    /*
    We either want to verify all signature/pubkey combinations, or do an explicit combination

    If a signature index is specified, only that signature is checked. It's verified against all public keys.
    If a single public key is found to be valid, the function returns true.

    If a public key is specified, we iterate over all signatures. If a single one matches the public key, the function
    returns true.

    If neither is specified, all signatures are checked against all public keys. Each signature must have its own distinct
    public key that it matches for the function to return true.
     */
    let signaturesToCheck = nonEmptySignatures;
    if (!_.isUndefined(verificationSettings.signatureIndex)) {
      signaturesToCheck = [nonEmptySignatures[verificationSettings.signatureIndex]];
    }

    const publicKeyHex = verificationSettings.publicKey;
    const matchedPublicKeyIndices = {};
    let areAllSignaturesValid = true;

    // go over all signatures
    for (const signatureBuffer of signaturesToCheck) {

      let isSignatureValid = false;

      const hasSignatureBuffer = Buffer.isBuffer(signatureBuffer) && signatureBuffer.length > 0;
      if (hasSignatureBuffer && Buffer.isBuffer(pubScript) && pubScript.length > 0) {
        // slice the last byte from the signature hash input because it's the hash type
        const signature = bitcoin.ECSignature.fromDER(signatureBuffer.slice(0, -1));
        const hashType = _.last(signatureBuffer);
        if (!hashType) {
          // missing hashType byte - signature cannot be validated
          return false;
        }
        const signatureHash = this.calculateSignatureHash(transaction, inputIndex, pubScript, amount, hashType, isSegwitInput);

        for (let publicKeyIndex = 0; publicKeyIndex < publicKeys.length; publicKeyIndex++) {
          const publicKeyBuffer = publicKeys[publicKeyIndex];
          if (!_.isUndefined(publicKeyHex) && publicKeyBuffer.toString('hex') !== publicKeyHex) {
            // we are only looking to verify one specific public key's signature (publicKeyHex)
            // this particular public key is not the one whose signature we're trying to verify
            continue;
          }

          if (matchedPublicKeyIndices[publicKeyIndex]) {
            continue;
          }

          const publicKey = bitcoin.ECPair.fromPublicKeyBuffer(publicKeyBuffer);
          if (publicKey.verify(signatureHash, signature)) {
            isSignatureValid = true;
            matchedPublicKeyIndices[publicKeyIndex] = true;
            break;
          }
        }
      }

      if (!_.isUndefined(publicKeyHex) && isSignatureValid) {
        // We were trying to see if any of the signatures was valid for the given public key. Evidently yes.
        return true;
      }

      if (!isSignatureValid && _.isUndefined(publicKeyHex)) {
        return false;
      }

      areAllSignaturesValid = isSignatureValid && areAllSignaturesValid;
    }

    return areAllSignaturesValid;
  }

  /**
   * Decompose a raw transaction into useful information, such as the total amounts,
   * change amounts, and transaction outputs.
   * @param params
   * @param callback
   */
  explainTransaction(params: ExplainTransactionOptions, callback?: NodeCallback<TransactionExplanation>): Bluebird<TransactionExplanation> {
    const self = this;
    return co<TransactionExplanation>(function *() {
      const txHex = _.get(params, 'txHex');
      if (!txHex || !_.isString(txHex) || !txHex.match(/^([a-f0-9]{2})+$/i)) {
        throw new Error('invalid transaction hex, must be a valid hex string');
      }

      let transaction;
      try {
        transaction = bitcoin.Transaction.fromHex(txHex, self.network);
      } catch (e) {
        throw new Error('failed to parse transaction hex');
      }

      const id = transaction.getId();
      let changeAddresses: string[] = [];
      let spendAmount = 0;
      let changeAmount = 0;
      const txInfo = _.get(params, 'txInfo');
      if (txInfo && txInfo.changeAddresses) {
        changeAddresses = txInfo.changeAddresses;
      }
      const explanation: any = {
        displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'],
        id: id,
        outputs: [],
        changeOutputs: [],
      };

      transaction.outs.forEach((currentOutput) => {
        const currentAddress = self.getCoinLibrary().address.fromOutputScript(currentOutput.script, self.network);
        const currentAmount = currentOutput.value;

        if (changeAddresses.indexOf(currentAddress) !== -1) {
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

      const unspentValues = {};

      // get information on tx inputs
      const inputSignatures = transaction.ins.map((input, idx) => {
        const hasSigScript = !_.isEmpty(input.script);
        const hasWitnessScript = !_.isEmpty(input.witness);

        if (!hasSigScript && !hasWitnessScript) {
          // no sig script or witness data for this input
          debug('no signature script or witness script data for input %s', idx);
          return 0;
        }

        let parsedSigScript;
        try {
          parsedSigScript = self.parseSignatureScript(transaction, idx);
        } catch (e) {
          return false;
        }

        if (hasWitnessScript) {
          if (!txInfo || !txInfo.unspents) {
            // segwit txs require input values, cannot validate signatures
            debug('unable to retrieve input amounts from unspents - cannot validate segwit input signatures');
            return 0;
          }

          // lazily populate unspent values
          if (_.isEmpty(unspentValues)) {
            txInfo.unspents.forEach((unspent) => {
              unspentValues[unspent.id] = unspent.value;
            });
          }
        }

        const nonEmptySignatures = parsedSigScript.signatures.filter((sig) => !_.isEmpty(sig));
        const validSignatures = nonEmptySignatures.map((sig, sigIndex) => {
          if (_.isEmpty(sig)) {
            return false;
          }

          const parentTxId = (Buffer.from(input.hash).reverse() as Buffer).toString('hex');
          const inputId = `${parentTxId}:${input.index}`;
          const amount = unspentValues[inputId];

          try {
            return self.verifySignature(transaction, idx, amount, { signatureIndex: sigIndex });
          } catch (e) {
            return false;
          }
        });

        return validSignatures.reduce((validCount, isValid) => isValid ? validCount + 1 : validCount, 0);
      });

      explanation.inputSignatures = inputSignatures;
      explanation.signatures = _.max(inputSignatures);
      return explanation;
    }).call(this).asCallback(callback);
  }

  /**
   * Create a multisig address of a given type from a list of keychains and a signing threshold
   * @param addressType
   * @param signatureThreshold
   * @param keys
   */
  createMultiSigAddress(addressType: string, signatureThreshold: number, keys: Buffer[]): MultiSigAddress {
    function createWitnessProgram(inputScript) {
      const witnessScriptHash = bitcoin.crypto.sha256(inputScript);
      return bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash);
    }

    const multiSigScript = bitcoin.script.multisig.output.encode(signatureThreshold, keys);
    let outputScript, redeemScript, witnessScript;
    switch (addressType) {
      case Codes.UnspentTypeTcomb('p2sh'):
        const multisigScriptHash = bitcoin.crypto.hash160(multiSigScript);
        outputScript = bitcoin.script.scriptHash.output.encode(multisigScriptHash);
        redeemScript = multiSigScript;
        break;
      case Codes.UnspentTypeTcomb('p2shP2wsh'):
        const witnessProgram = createWitnessProgram(multiSigScript);
        const witnessProgramHash = bitcoin.crypto.hash160(witnessProgram);
        outputScript = bitcoin.script.scriptHash.output.encode(witnessProgramHash);
        redeemScript = witnessProgram;
        witnessScript = multiSigScript;
        break;
      case Codes.UnspentTypeTcomb('p2wsh'):
        outputScript = createWitnessProgram(multiSigScript);
        witnessScript = multiSigScript;
        break;
      default:
        throw new Error(`unexpected addressType ${addressType}`);
    }

    return {
      outputScript,
      redeemScript,
      witnessScript,
      address: bitcoin.address.fromOutputScript(outputScript, this.network),
    };
  }

  /**
   * @param scriptHashScript
   * @deprecated
   */
  // TODO(BG-11638): remove in next SDK major version release
  calculateRecoveryAddress(scriptHashScript: Buffer) {
    return this.getCoinLibrary().address.fromOutputScript(scriptHashScript, this.network);
  }

  /**
   * Get a static fee rate which is used in recovery situations
   * @deprecated
   */
  getRecoveryFeePerBytes(): Bluebird<number> {
    return Bluebird.resolve(100);
  }

  /**
   * Get a url which can be used for determining recovery fee rates
   */
  getRecoveryFeeRecommendationApiBaseUrl(): Bluebird<string> {
    return Bluebird.reject(new Error('AbtractUtxoCoin method not implemented'));
  }

  /**
   * Get the current market price from a third party to be used for recovery
   * This function is only intended for non-bitgo recovery transactions, when it is necessary
   * to calculate the rough fee needed to pay to Keyternal. We are okay with approximating,
   * because the resulting price of this function only has less than 1 dollar influence on the
   * fee that needs to be paid to Keyternal.
   *
   * See calculateFeeAmount function:  return Math.round(feeAmountUsd / currentPrice * self.getBaseFactor());
   *
   * This end function should not be used as an accurate endpoint, since some coins' prices are missing from the provider
   */
  getRecoveryMarketPrice(): Bluebird<string> {
    const self = this;
    return co<string>(function *getRecoveryMarketPrice() {
      const familyNamesToCoinGeckoIds = new Map()
        .set('BTC', 'bitcoin')
        .set('LTC', 'litecoin')
        .set('BCH', 'bitcoin-cash')
        .set('ZEC', 'zcash')
        .set('DASH', 'dash')
        // note: we don't have a source for price data of BCHA and BSV, but we will use BCH as a proxy. We will substitute
        // it out for a better source when it becomes available.  TODO BG-26359.
        .set('BCHA', 'bitcoin-cash')
        .set('BSV', 'bitcoin-cash');

      const coinGeckoId = familyNamesToCoinGeckoIds.get(self.getFamily().toUpperCase());
      if (!coinGeckoId) {
        throw new Error(`There is no CoinGecko id for family name ${self.getFamily().toUpperCase()}.`);
      }
      const coinGeckoUrl = config.coinGeckoBaseUrl + `simple/price?ids=${coinGeckoId}&vs_currencies=USD`;
      const response = yield request.get(coinGeckoUrl).retry(2).result();

      // An example of response
      // {
      //   "ethereum": {
      //     "usd": 220.64
      //   }
      // }
      if (!response) {
        throw new Error('Unable to reach Coin Gecko API for price data');
      }
      if (!response[coinGeckoId]['usd'] || typeof response[coinGeckoId]['usd'] !== 'number') {
        throw new Error('Unexpected response from Coin Gecko API for price data');
      }

      return response[coinGeckoId]['usd'];
    }).call(this);
  }

  /**
   * Helper function for recover()
   * This transforms the txInfo from recover into the format that offline-signing-tool expects
   * @param txInfo
   * @param txHex
   * @returns {{txHex: *, txInfo: {unspents: *}, feeInfo: {}, coin: void}}
   */
  formatForOfflineVault(txInfo: OfflineVaultTxInfo, txHex: string): FormattedOfflineVaultTxInfo {
    const response: FormattedOfflineVaultTxInfo = {
      txHex,
      txInfo: {
        unspents: txInfo.inputs,
      },
      feeInfo: {},
      coin: this.getChain(),
    };
    _.map(response.txInfo.unspents, function(unspent) {
      const pathArray = unspent.chainPath.split('/');
      // Note this code works because we assume our chainPath is m/0/0/chain/index - this will be incorrect for custom derivation schemes
      unspent.index = pathArray[4];
      unspent.chain = pathArray[3];
    });
    return response;
  }

  protected abstract getAddressInfoFromExplorer(address: string, apiKey?: string): Bluebird<AddressInfo>;
  protected abstract getUnspentInfoFromExplorer(address: string, apiKey?: string): Bluebird<UnspentInfo[]>;

  /**
   * Derive child keys at specific index, from provided parent keys
   * @param {bitcoin.HDNode[]} keyArray
   * @param {number} index
   * @returns {bitcoin.HDNode[]}
   */
  deriveKeys(keyArray: bitcoin.HDNode[], index: number) {
    return keyArray.map((k) => k.derive(index));
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - userKey: [encrypted] xprv, or xpub
   * - backupKey: [encrypted] xprv, or xpub if the xprv is held by a KRS provider
   * - walletPassphrase: necessary if one of the xprvs is encrypted
   * - bitgoKey: xpub
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   * - scan: the amount of consecutive addresses without unspents to scan through before stopping
   * - ignoreAddressTypes: (optional) array of AddressTypes to ignore, these are strings defined in Codes.UnspentTypeTcomb
   *        for example: ['p2shP2wsh', 'p2wsh'] will prevent code from checking for wrapped-segwit and native-segwit chains on the public block explorers
   * @param callback
   */
  recover(params: RecoverParams, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *recover() {
      // ============================HELPER FUNCTIONS============================
      function queryBlockchainUnspentsPath(keyArray: bitcoin.HDNode[], basePath: string, addressesById) {
        return co(function* () {
          const MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS = params.scan || 20;
          let numSequentialAddressesWithoutTxs = 0;

          // get unspents for these addresses
          const gatherUnspents = co(function* coGatherUnspents(addrIndex) {
            const derivedKeys = self.deriveKeys(keyArray, addrIndex);

            const chain = Number(basePath.split('/').pop()); // extracts the chain from the basePath
            const keys = derivedKeys.map(k => k.getPublicKeyBuffer());
            const address: any = self.createMultiSigAddress(Codes.typeForCode(chain), 2, keys);

            const addrInfo: AddressInfo = (yield self.getAddressInfoFromExplorer(address.address, params.apiKey)) as any;
            // we use txCount here because it implies usage - having tx'es means the addr was generated and used
            if (addrInfo.txCount === 0) {
              numSequentialAddressesWithoutTxs++;
            } else {
              numSequentialAddressesWithoutTxs = 0;

              if (addrInfo.totalBalance > 0) {
                console.log(`Found an address with balance: ${address.address} with balance ${addrInfo.totalBalance}`);
                // This address has a balance.
                address.chainPath = basePath + '/' + addrIndex;
                address.userKey = derivedKeys[0];
                address.backupKey = derivedKeys[1];
                addressesById[address.address] = address;

                // Try to find unspents on it.
                const addressUnspents: UnspentInfo[] = (yield self.getUnspentInfoFromExplorer(address.address, params.apiKey)) as any;

                addressUnspents.forEach(function addAddressToUnspent(unspent) {
                  unspent.address = address.address;
                  walletUnspents.push(unspent);
                });
              }
            }

            if (numSequentialAddressesWithoutTxs >= MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS) {
              // stop searching for addresses with unspents in them, we've found ${MAX_SEQUENTIAL_ADDRESSES_WITHOUT_TXS} in a row with none
              // we are done
              return;
            }

            return gatherUnspents(addrIndex + 1);
          });

          const walletUnspents: UnspentInfo[] = [];
          // This will populate walletAddresses
          yield gatherUnspents(0);

          if (walletUnspents.length === 0) {
            // Couldn't find any addresses with funds
            return [];
          }

          return walletUnspents;
        }).call(this);
      }

      // ============================LOGIC============================
      if (_.isUndefined(params.userKey)) {
        throw new Error('missing userKey');
      }

      if (_.isUndefined(params.backupKey)) {
        throw new Error('missing backupKey');
      }

      if (_.isUndefined(params.recoveryDestination) || !self.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      if (!_.isUndefined(params.scan) && (!_.isInteger(params.scan) || params.scan < 0)) {
        throw new Error('scan must be a positive integer');
      }

      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');
      const krsProvider = config.krsProviders[params.krsProvider];

      if (isKrsRecovery && _.isUndefined(krsProvider)) {
        throw new Error('unknown key recovery service provider');
      }

      if (isKrsRecovery && !(krsProvider.supportedCoins.includes(self.getFamily()))) {
        throw new Error('specified key recovery service does not support recoveries for this coin');
      }

      // check whether key material and password authenticate the users and return parent keys of all three keys of the wallet
      const keys = yield self.initiateRecovery(params);

      const [userKey, backupKey, bitgoKey] = (keys as any);
      let derivedUserKey;
      let baseKeyPath;
      if (params.userKeyPath) {
        derivedUserKey = deriveKeyByPath(userKey, params.userKeyPath);
        const twoKeys = self.deriveKeys(self.deriveKeys([backupKey, bitgoKey], 0), 0);
        baseKeyPath = [derivedUserKey, ...twoKeys];
      } else {
        baseKeyPath = self.deriveKeys(self.deriveKeys((keys as any), 0), 0);
      }

      const queries: any[] = [];
      const addressesById = {};

      _.forEach(Object.keys(Codes.UnspentTypeTcomb.meta.map), function(addressType) {
        // If we aren't ignoring the address type, we derive the public key and construct the query for the external and
        // internal indices
        if (!_.includes(params.ignoreAddressTypes, addressType)) {
          if (addressType === Codes.UnspentTypeTcomb('p2shP2wsh') && !self.supportsP2shP2wsh()) {
            // P2shP2wsh is not supported. Skip.
            return;
          }

          if (addressType === Codes.UnspentTypeTcomb('p2wsh') && !self.supportsP2wsh()) {
            // P2wsh is not supported. Skip.
            return;
          }

          let codes;
          try {
            codes = Codes.forType(Codes.UnspentTypeTcomb(addressType) as any);
          } catch (e) {
            // The unspent type is not supported by bitgo so attempting to get its chain codes throws. Catch that error
            // and continue.
            return;
          }
          const externalChainCode = codes.external;
          const internalChainCode = codes.internal;
          const externalKey = self.deriveKeys(baseKeyPath, externalChainCode);
          const internalKey = self.deriveKeys(baseKeyPath, internalChainCode);
          queries.push(queryBlockchainUnspentsPath(externalKey, '/0/0/' + externalChainCode, addressesById));
          queries.push(queryBlockchainUnspentsPath(internalKey, '/0/0/' + internalChainCode, addressesById));
        }
      });

      // Execute the queries and gather the unspents
      const queryResponses = yield Promise.all(queries);
      const unspents: any[] = _.flatten(queryResponses); // this flattens the array (turns an array of arrays into just one array)
      const totalInputAmount = _.sumBy(unspents, 'amount');
      if (totalInputAmount <= 0) {
        throw new errors.ErrorNoInputToRecover();
      }

      // Build the transaction
      const transactionBuilder = new bitcoin.TransactionBuilder(self.network);
      self.prepareTransactionBuilder(transactionBuilder);
      const txInfo: any = {};

      const feePerByte: number = (yield self.getRecoveryFeePerBytes()) as any;

      // KRS recovery transactions have a 2nd output to pay the recovery fee, like paygo fees. Use p2wsh outputs because
      // they are the largest outputs and thus the most conservative estimate to use in calculating fees. Also use
      // segwit overhead size and p2sh inputs for the same reason.
      const outputSize = (isKrsRecovery ? 2 : 1) * VirtualSizes.txP2wshOutputSize;
      const approximateSize =
        VirtualSizes.txSegOverheadVSize + outputSize + (VirtualSizes.txP2shInputSize * unspents.length);
      const approximateFee = approximateSize * feePerByte;

      // Construct a transaction
      txInfo.inputs = unspents.map(function addInputForUnspent(unspent) {
        const address = addressesById[unspent.address];

        transactionBuilder.addInput(unspent.txid, unspent.n, 0xffffffff, address.outputScript);

        return {
          chainPath: address.chainPath,
          redeemScript: address.redeemScript && address.redeemScript.toString('hex'),
          witnessScript: address.witnessScript && address.witnessScript.toString('hex'),
          value: unspent.amount,
        };
      });

      let recoveryAmount = totalInputAmount - approximateFee;
      let krsFee;
      if (isKrsRecovery) {
        try {
          krsFee = yield self.calculateFeeAmount({ provider: params.krsProvider, amount: recoveryAmount });
          recoveryAmount -= krsFee;
        } catch (err) {
          // Don't let this error block the recovery -
          console.dir(err);
        }
      }

      if (recoveryAmount < 0) {
        throw new Error(`this wallet\'s balance is too low to pay the fees specified by the KRS provider. 
          Existing balance on wallet: ${totalInputAmount}. Estimated network fee for the recovery transaction
          : ${approximateFee}, KRS fee to pay: ${krsFee}. After deducting fees, your total recoverable balance
          is ${recoveryAmount}`);
      }

      transactionBuilder.addOutput(params.recoveryDestination, recoveryAmount);

      if (isKrsRecovery && krsFee > 0) {
        const krsFeeAddress = krsProvider.feeAddresses[self.getChain()];

        if (!krsFeeAddress) {
          throw new Error('this KRS provider has not configured their fee structure yet - recovery cannot be completed');
        }

        transactionBuilder.addOutput(krsFeeAddress, krsFee);
      }

      if (isUnsignedSweep) {
        const txHex = transactionBuilder.buildIncomplete().toBuffer().toString('hex');
        return self.formatForOfflineVault(txInfo, txHex);
      } else {
        const signedTx = self.signRecoveryTransaction(transactionBuilder, unspents, addressesById, !isKrsRecovery);
        txInfo.transactionHex = signedTx.build().toBuffer().toString('hex');
        try {
          txInfo.tx = yield self.verifyRecoveryTransaction(txInfo);
        } catch (e) {
          // some coins don't have a reliable third party verification endpoint, or sometimes the third party endpoint
          // could be unavailable due to service outage, so we continue without verification for those coins, but we will
          // let users know that they should verify their own
          // this message should be piped to WRW and displayed on the UI
          if (e instanceof errors.MethodNotImplementedError || e instanceof errors.BlockExplorerUnavailable) {
            console.log('Please verify your transaction by decoding the tx hex using a third-party api of your choice');
          } else {
            throw e;
          }
        }
      }

      if (isKrsRecovery) {
        txInfo.coin = self.getChain();
        txInfo.backupKey = params.backupKey;
        txInfo.recoveryAmount = recoveryAmount;
      }

      return txInfo;
    }).call(this).asCallback(callback);
  }

  /**
   * Apply signatures to a funds recovery transaction using user + backup key
   * @param txb {Object} a transaction builder object (with inputs and outputs)
   * @param unspents {Array} the unspents to use in the transaction
   * @param addresses {Array} the address and redeem script info for the unspents
   * @param cosign {Boolean} whether to cosign this transaction with the user's backup key (false if KRS recovery)
   * @returns the transaction builder originally passed in as the first argument
   */
  signRecoveryTransaction(txb: any, unspents: Output[], addresses: any, cosign: boolean): any {
    interface SignatureIssue {
      inputIndex: number;
      unspent: Output;
      error: Error | null;
    }

    const signatureIssues: SignatureIssue[] = [];
    unspents.forEach((unspent, i) => {
      const address = addresses[unspent.address];
      const backupPrivateKey = address.backupKey.keyPair;
      const userPrivateKey = address.userKey.keyPair;
      // force-override networks
      backupPrivateKey.network = this.network;
      userPrivateKey.network = this.network;

      const currentSignatureIssue: SignatureIssue = {
        inputIndex: i,
        unspent: unspent,
        error: null,
      };

      if (cosign) {
        try {
          txb.sign(i, backupPrivateKey, address.redeemScript, this.defaultSigHashType, unspent.amount, address.witnessScript);
        } catch (e) {
          currentSignatureIssue.error = e;
          signatureIssues.push(currentSignatureIssue);
        }
      }

      try {
        txb.sign(i, userPrivateKey, address.redeemScript, this.defaultSigHashType, unspent.amount, address.witnessScript);
      } catch (e) {
        currentSignatureIssue.error = e;
        signatureIssues.push(currentSignatureIssue);
      }
    });

    if (signatureIssues.length > 0) {
      const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
      const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
      error.code = 'input_signature_failure';
      error.signingErrors = signatureIssues;
      throw error;
    }

    return txb;
  }

  /**
   * Calculates the amount (in base units) to pay a KRS provider when building a recovery transaction
   * @param params
   * @param params.provider {String} the KRS provider that holds the backup key
   * @param params.amount {Number} amount (in base units) to be recovered
   * @param callback
   * @returns {*}
   */
  calculateFeeAmount(params: { provider: string, amount?: number }, callback?: NodeCallback<number>): Bluebird<number> {
    const self = this;
    return co<number>(function *calculateFeeAmount() {
      const krsProvider = config.krsProviders[params.provider];

      if (krsProvider === undefined) {
        throw new Error(`no fee structure specified for provider ${params.provider}`);
      }

      if (krsProvider.feeType === 'flatUsd') {
        const feeAmountUsd = krsProvider.feeAmount;
        const currentPrice: number = (yield self.getRecoveryMarketPrice()) as any;

        return Math.round(feeAmountUsd / currentPrice * self.getBaseFactor());
      } else {
        // we can add more fee structures here as needed for different providers, such as percentage of recovery amount
        throw new Error('Fee structure not implemented');
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Recover BTC that was sent to the wrong chain
   * @param params
   * @param params.txid The txid of the faulty transaction
   * @param params.recoveryAddress address to send recovered funds to
   * @param params.wallet the wallet that received the funds
   * @param params.recoveryCoin the coin type of the wallet that received the funds
   * @param params.signed return a half-signed transaction (default=true)
   * @param params.walletPassphrase the wallet passphrase
   * @param params.xprv the unencrypted xprv (used instead of wallet passphrase)
   * @param callback
   * @returns {*}
   */
  recoverFromWrongChain(params: RecoverFromWrongChainOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *recoverFromWrongChain() {
      const {
        txid,
        recoveryAddress,
        wallet,
        walletPassphrase,
        xprv,
      } = params;

      // params.recoveryCoin used to be params.coin, backwards compatibility
      const recoveryCoin = params.coin || params.recoveryCoin;
      if (!recoveryCoin) {
        throw new Error('missing required object recoveryCoin');
      }
      // signed should default to true, and only be disabled if explicitly set to false (not undefined)
      const signed = params.signed !== false;

      const sourceCoinFamily = self.getFamily();
      const recoveryCoinFamily = recoveryCoin.getFamily();
      const supportedRecoveryCoins = config.supportedCrossChainRecoveries[sourceCoinFamily];

      if (_.isUndefined(supportedRecoveryCoins) || !supportedRecoveryCoins.includes(recoveryCoinFamily)) {
        throw new Error(`Recovery of ${sourceCoinFamily} balances from ${recoveryCoinFamily} wallets is not supported.`);
      }

      const recoveryTool = new CrossChainRecoveryTool({
        bitgo: self.bitgo,
        sourceCoin: self,
        recoveryCoin: recoveryCoin,
        logging: true,
      });

      yield recoveryTool.buildTransaction({
        wallet: wallet,
        faultyTxId: txid,
        recoveryAddress: recoveryAddress,
      });

      if (signed) {
        yield recoveryTool.signTransaction({ passphrase: walletPassphrase, prv: xprv });
        return recoveryTool.export();
      } else {
        return yield recoveryTool.buildUnsigned();
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed: Buffer): { pub: string, prv: string } {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bitcoin.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58(),
    };
  }

  getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions, callback?: NodeCallback<any>): Bluebird<any> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  preCreateBitGo(params: PrecreateBitGoOptions): void {
    return;
  }

  presignTransaction(params: PresignTransactionOptions, callback?: (err: Error, res: any) => void): Bluebird<any> {
    return Bluebird.resolve(params).asCallback(callback);
  }

  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions, keychains: KeychainsTriplet): Bluebird<any> {
    return Bluebird.resolve(walletParams);
  }

  transactionDataAllowed(): boolean {
    return false;
  }

  valuelessTransferAllowed(): boolean {
    return false;
  }

  verifyRecoveryTransaction(txInfo: VerifyRecoveryTransactionOptions): Bluebird<any> {
    return Bluebird.reject(new errors.MethodNotImplementedError());
  }

  signMessage(key: { prv: string }, message: string | Buffer, callback?: NodeCallback<Buffer>): Bluebird<Buffer> {
    return co<Buffer>(function* cosignMessage() {
      const privateKey = bitcoin.HDNode.fromBase58(key.prv).getKey();
      const privateKeyBuffer = privateKey.d.toBuffer(32);
      const isCompressed = privateKey.compressed;
      const prefix = bitcoin.networks.bitcoin.messagePrefix;
      return bitcoinMessage.sign(message, privateKeyBuffer, isCompressed, prefix);
    })
      .call(this)
      .asCallback(callback);
  }
}
