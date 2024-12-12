import assert from 'assert';
import { randomBytes } from 'crypto';
import _ from 'lodash';
import * as utxolib from '@bitgo/utxo-lib';
import { bip32, BIP32Interface, bitgo, getMainnet, isMainnet, isTestnet } from '@bitgo/utxo-lib';
import debugLib from 'debug';

import {
  backupKeyRecovery,
  CrossChainRecoverySigned,
  CrossChainRecoveryUnsigned,
  forCoin,
  recoverCrossChain,
  RecoverParams,
  RecoveryProvider,
  v1BackupKeyRecovery,
  V1RecoverParams,
  v1Sweep,
  V1SweepParams,
} from './recovery';

import {
  AddressCoinSpecific,
  AddressTypeChainMismatchError,
  BaseCoin,
  BitGoBase,
  CreateAddressFormat,
  ExtraPrebuildParamsOptions,
  HalfSignedUtxoTransaction,
  IBaseCoin,
  InvalidAddressDerivationPropertyError,
  InvalidAddressError,
  IRequestTracer,
  isTriple,
  ITransactionExplanation as BaseTransactionExplanation,
  IWallet,
  Keychain,
  KeychainsTriplet,
  KeyIndices,
  P2shP2wshUnsupportedError,
  P2trMusig2UnsupportedError,
  P2trUnsupportedError,
  P2wshUnsupportedError,
  ParseTransactionOptions as BaseParseTransactionOptions,
  PrecreateBitGoOptions,
  PresignTransactionOptions,
  RequestTracer,
  sanitizeLegacyPath,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  SupplementGenerateWalletOptions,
  TransactionParams as BaseTransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  Triple,
  UnexpectedAddressError,
  UnsupportedAddressTypeError,
  VerificationOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  Wallet,
  WalletData,
} from '@bitgo/sdk-core';
import { isReplayProtectionUnspent } from './replayProtection';
import { signAndVerifyPsbt, signAndVerifyWalletTransaction } from './sign';
import { supportedCrossChainRecoveries } from './config';
import {
  assertValidTransactionRecipient,
  explainTx,
  parseTransaction,
  verifyTransaction,
  fromExtendedAddressFormat,
  isScriptRecipient,
} from './transaction';
import { assertDescriptorWalletAddress, getDescriptorMapFromWallet, isDescriptorWallet } from './descriptor';

import { getChainFromNetwork, getFamilyFromNetwork, getFullNameFromNetwork } from './names';
import { CustomChangeOptions } from './transaction/fixedScript';
import { NamedKeychains } from './keychains';

const debug = debugLib('bitgo:v2:utxo');

import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;
import { verifyKeySignature, verifyUserPublicKey } from './verifyKey';

type UtxoCustomSigningFunction<TNumber extends number | bigint> = {
  (params: {
    coin: IBaseCoin;
    txPrebuild: TransactionPrebuild<TNumber>;
    pubs?: string[];
    /**
     * signingStep flag becomes applicable when both of the following conditions are met:
     * 1) When the external express signer is activated
     * 2) When the PSBT includes at least one taprootKeyPathSpend input.
     *
     * The signing process of a taprootKeyPathSpend input is a 4-step sequence:
     * i) user nonce generation - signerNonce - this is the first call to external express signer signTransaction
     * ii) bitgo nonce generation - cosignerNonce - this is the first and only call to local signTransaction
     * iii) user signature - signerSignature - this is the second call to external express signer signTransaction
     * iv) bitgo signature - not in signTransaction method’s scope
     *
     * In the absence of this flag, the aforementioned first three sequence is executed in a single signTransaction call.
     *
     * NOTE: We make a strong assumption that the external express signer and its caller uses sticky sessions,
     * since PSBTs are cached in step 1 to be used in step 3 for MuSig2 user secure nonce access.
     */
    signingStep?: 'signerNonce' | 'signerSignature' | 'cosignerNonce';
  }): Promise<SignedTransaction>;
};

const { getExternalChainCode, isChainCode, scriptTypeForChain, outputScripts } = bitgo;

type Unspent<TNumber extends number | bigint = number> = bitgo.Unspent<TNumber>;

type DecodedTransaction<TNumber extends number | bigint> =
  | utxolib.bitgo.UtxoTransaction<TNumber>
  | utxolib.bitgo.UtxoPsbt;

type RootWalletKeys = bitgo.RootWalletKeys;

export type UtxoCoinSpecific = AddressCoinSpecific | DescriptorAddressCoinSpecific;

export interface VerifyAddressOptions<TCoinSpecific extends UtxoCoinSpecific> extends BaseVerifyAddressOptions {
  chain?: number;
  index: number;
  coinSpecific?: TCoinSpecific;
}

export interface BaseOutput {
  address: string;
  amount: string | number;
  // Even though this external flag is redundant with the chain property, it is necessary for backwards compatibility
  // with legacy transaction format.
  external?: boolean;
}

export interface FixedScriptWalletOutput extends BaseOutput {
  needsCustomChangeKeySignatureVerification?: boolean;
  chain: number;
  index: number;
}

export type Output = BaseOutput | FixedScriptWalletOutput;

export function isWalletOutput(output: Output): output is FixedScriptWalletOutput {
  return (
    (output as FixedScriptWalletOutput).chain !== undefined && (output as FixedScriptWalletOutput).index !== undefined
  );
}

export interface TransactionExplanation extends BaseTransactionExplanation<string, string> {
  locktime: number;
  /** NOTE: this actually only captures external outputs */
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

export interface TransactionInfo<TNumber extends number | bigint = number> {
  /** Maps txid to txhex. Required for offline signing. */
  txHexes?: Record<string, string>;
  changeAddresses?: string[];
  /** psbt does not require unspents. */
  unspents?: Unspent<TNumber>[];
}

export interface ExplainTransactionOptions<TNumber extends number | bigint = number> {
  txHex: string;
  txInfo?: TransactionInfo<TNumber>;
  feeInfo?: string;
  pubs?: Triple<string>;
}

export interface DecoratedExplainTransactionOptions<TNumber extends number | bigint = number>
  extends ExplainTransactionOptions<TNumber> {
  changeInfo?: { address: string; chain: number; index: number }[];
}

export type UtxoNetwork = utxolib.Network;

export interface TransactionPrebuild<TNumber extends number | bigint = number> extends BaseTransactionPrebuild {
  txInfo?: TransactionInfo<TNumber>;
  blockHeight?: number;
}

export interface TransactionParams extends BaseTransactionParams {
  walletPassphrase?: string;
  allowExternalChangeAddress?: boolean;
  changeAddress?: string;
  rbfTxIds?: string[];
}

// parseTransactions' return type makes use of WalletData's type but with customChangeKeySignatures as required.
export interface AbstractUtxoCoinWalletData extends WalletData {
  customChangeKeySignatures: {
    user: string;
    backup: string;
    bitgo: string;
  };
}

export class AbstractUtxoCoinWallet extends Wallet {
  public _wallet: AbstractUtxoCoinWalletData;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, walletData: any) {
    super(bitgo, baseCoin, walletData);
  }
}

export interface ParseTransactionOptions<TNumber extends number | bigint = number> extends BaseParseTransactionOptions {
  txParams: TransactionParams;
  txPrebuild: TransactionPrebuild<TNumber>;
  wallet: AbstractUtxoCoinWallet;
  verification?: VerificationOptions;
  reqId?: IRequestTracer;
}

export type ParsedTransaction<TNumber extends number | bigint = number> = {
  keychains: NamedKeychains;
  keySignatures: {
    backupPub?: string;
    bitgoPub?: string;
  };
  outputs: Output[];
  missingOutputs: Output[];
  explicitExternalOutputs: Output[];
  implicitExternalOutputs: Output[];
  changeOutputs: Output[];
  explicitExternalSpendAmount: TNumber;
  implicitExternalSpendAmount: TNumber;
  needsCustomChangeKeySignatureVerification: boolean;
  customChange?: CustomChangeOptions;
};

export interface GenerateAddressOptions {
  addressType?: ScriptType2Of3;
  threshold?: number;
  chain?: number;
  index?: number;
  segwit?: boolean;
  bech32?: boolean;
}

export interface GenerateFixedScriptAddressOptions extends GenerateAddressOptions {
  format?: CreateAddressFormat;
  keychains: {
    pub: string;
    aspKeyId?: string;
  }[];
}

export interface AddressDetails {
  address: string;
  chain: number;
  index: number;
  coin: string;
  coinSpecific: AddressCoinSpecific | DescriptorAddressCoinSpecific;
  addressType?: string;
}

export interface DescriptorAddressCoinSpecific extends AddressCoinSpecific {
  descriptorName: string;
  descriptorChecksum: string;
}

type UtxoBaseSignTransactionOptions<TNumber extends number | bigint = number> = BaseSignTransactionOptions & {
  /** Transaction prebuild from bitgo server */
  txPrebuild: {
    /**
     * walletId is required in following 2 scenarios.
     * 1. External signer express mode is used.
     * 2. bitgo MuSig2 nonce is requested
     */
    walletId?: string;
    txHex: string;
    txInfo?: TransactionInfo<TNumber>;
  };
  /** xpubs triple for wallet (user, backup, bitgo). Required only when txPrebuild.txHex is not a PSBT */
  pubs?: Triple<string>;
  /** xpub for cosigner (defaults to bitgo) */
  cosignerPub?: string;
  /**
   * When true, creates full-signed transaction without placeholder signatures.
   * When false, creates half-signed transaction with placeholder signatures.
   */
  isLastSignature?: boolean;
  /**
   * If true, allows signing a non-segwit input with a witnessUtxo instead requiring a previous
   * transaction (nonWitnessUtxo)
   */
  allowNonSegwitSigningWithoutPrevTx?: boolean;
};

export type SignTransactionOptions<TNumber extends number | bigint = number> = UtxoBaseSignTransactionOptions<TNumber> &
  (
    | {
        prv: string;
        signingStep?: 'signerNonce' | 'signerSignature';
      }
    | {
        signingStep: 'cosignerNonce';
      }
  );

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
  apiKey?: string;
  /** @deprecated */
  coin?: AbstractUtxoCoin;
  recoveryCoin?: AbstractUtxoCoin;
  signed?: boolean;
}

export interface VerifyKeySignaturesOptions {
  userKeychain: { pub?: string };
  keychainToVerify: { pub?: string };
  keySignature: string;
}

export interface VerifyUserPublicKeyOptions {
  userKeychain?: Keychain;
  disableNetworking: boolean;
  txParams: TransactionParams;
}

export interface VerifyTransactionOptions<TNumber extends number | bigint = number>
  extends BaseVerifyTransactionOptions {
  txPrebuild: TransactionPrebuild<TNumber>;
  txParams: TransactionParams;
  wallet: AbstractUtxoCoinWallet;
}

export interface SignPsbtRequest {
  psbt: string;
}

export interface SignPsbtResponse {
  psbt: string;
}

export abstract class AbstractUtxoCoin extends BaseCoin {
  public altScriptHash?: number;
  public supportAltScriptDestination?: boolean;
  public readonly amountType: 'number' | 'bigint';
  private readonly _network: utxolib.Network;

  protected constructor(bitgo: BitGoBase, network: utxolib.Network, amountType: 'number' | 'bigint' = 'number') {
    super(bitgo);
    if (!utxolib.isValidNetwork(network)) {
      throw new Error(
        'invalid network: please make sure to use the same version of ' +
          '@bitgo/utxo-lib as this library when initializing an instance of this class'
      );
    }
    this.amountType = amountType;
    this._network = network;
  }

  /**
   * Key Value: Unsigned tx id => PSBT
   * It is used to cache PSBTs with taproot key path (MuSig2) inputs during external express signer is activated.
   * Reason: MuSig2 signer secure nonce is cached in the UtxoPsbt object. It will be required during the signing step.
   * For more info, check SignTransactionOptions.signingStep
   *
   * TODO BTC-276: This cache may need to be done with LRU like memory safe caching if memory issues comes up.
   */
  private static readonly PSBT_CACHE = new Map<string, utxolib.bitgo.UtxoPsbt>();

  get network() {
    return this._network;
  }

  getChain() {
    return getChainFromNetwork(this.network);
  }

  getFamily() {
    return getFamilyFromNetwork(this.network);
  }

  getFullName() {
    return getFullNameFromNetwork(this.network);
  }

  /** Indicates whether the coin supports a block target */
  supportsBlockTarget() {
    // FIXME: the SDK does not seem to use this anywhere so it is unclear what the purpose of this method is
    switch (getMainnet(this.network)) {
      case utxolib.networks.bitcoin:
      case utxolib.networks.dogecoin:
        return true;
      default:
        return false;
    }
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
   * Check if an address is valid
   * @param address
   * @param param
   */
  isValidAddress(address: string, param?: { anyFormat: boolean } | /* legacy parameter */ boolean): boolean {
    if (typeof param === 'boolean' && param) {
      throw new Error('deprecated');
    }

    // By default, allow all address formats.
    // At the time of writing, the only additional address format is bch cashaddr.
    const anyFormat = (param as { anyFormat: boolean } | undefined)?.anyFormat ?? true;
    try {
      // Find out if the address is valid for any format. Tries all supported formats by default.
      // Throws if address cannot be decoded with any format.
      const [format, script] = utxolib.addressFormat.toOutputScriptAndFormat(address, this.network);
      // unless anyFormat is set, only 'default' is allowed.
      if (!anyFormat && format !== 'default') {
        return false;
      }
      // make sure that address is in normal representation for given format.
      return address === utxolib.addressFormat.fromOutputScriptWithFormat(script, format, this.network);
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
  isValidPub(pub: string) {
    try {
      return bip32.fromBase58(pub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  preprocessBuildParams(params: Record<string, any>): Record<string, any> {
    if (params.recipients !== undefined) {
      params.recipients =
        params.recipients instanceof Array
          ? params?.recipients?.map((recipient) => {
              const { address, ...rest } = recipient;
              return { ...rest, ...fromExtendedAddressFormat(address) };
            })
          : params.recipients;
    }

    return params;
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

  checkRecipient(recipient: { address: string; amount: number | string }): void {
    assertValidTransactionRecipient(recipient);
    if (!isScriptRecipient(recipient.address)) {
      super.checkRecipient(recipient);
    }
  }

  /**
   * Run custom coin logic after a transaction prebuild has been received from BitGo
   * @param prebuild
   */
  async postProcessPrebuild<TNumber extends number | bigint>(
    prebuild: TransactionPrebuild<TNumber>
  ): Promise<TransactionPrebuild<TNumber>> {
    if (_.isUndefined(prebuild.txHex)) {
      throw new Error('missing required txPrebuild property txHex');
    }
    const tx = this.decodeTransactionFromPrebuild(prebuild);
    if (_.isUndefined(prebuild.blockHeight)) {
      prebuild.blockHeight = (await this.getLatestBlockHeight()) as number;
    }
    return _.extend({}, prebuild, { txHex: tx.toHex() });
  }

  /**
   * Determine an address' type based on its witness and redeem script presence
   * @param addressDetails
   */
  static inferAddressType(addressDetails: { chain: number }): ScriptType2Of3 | null {
    return isChainCode(addressDetails.chain) ? scriptTypeForChain(addressDetails.chain) : null;
  }

  createTransactionFromHex<TNumber extends number | bigint = number>(
    hex: string
  ): utxolib.bitgo.UtxoTransaction<TNumber> {
    return utxolib.bitgo.createTransactionFromHex<TNumber>(hex, this.network, this.amountType);
  }

  decodeTransaction<TNumber extends number | bigint>(input: Buffer | string): DecodedTransaction<TNumber> {
    if (typeof input === 'string') {
      for (const format of ['hex', 'base64'] as const) {
        const buffer = Buffer.from(input, format);
        const bufferToString = buffer.toString(format);
        if (
          (format === 'base64' && bufferToString === input) ||
          (format === 'hex' && bufferToString === input.toLowerCase())
        ) {
          return this.decodeTransaction(buffer);
        }
      }

      throw new Error('input must be a valid hex or base64 string');
    }

    if (utxolib.bitgo.isPsbt(input)) {
      return utxolib.bitgo.createPsbtFromBuffer(input, this.network);
    } else {
      return utxolib.bitgo.createTransactionFromBuffer(input, this.network, {
        amountType: this.amountType,
      });
    }
  }

  decodeTransactionFromPrebuild<TNumber extends number | bigint>(prebuild: {
    txHex?: string;
    txBase64?: string;
  }): DecodedTransaction<TNumber> {
    const string = prebuild.txHex ?? prebuild.txBase64;
    if (!string) {
      throw new Error('missing required txHex or txBase64 property');
    }
    return this.decodeTransaction(string);
  }

  toCanonicalTransactionRecipient(output: { valueString: string; address?: string }): {
    amount: bigint;
    address?: string;
  } {
    const amount = BigInt(output.valueString);
    assertValidTransactionRecipient({ amount, address: output.address });
    if (!output.address) {
      return { amount };
    }
    return { amount, address: this.canonicalAddress(output.address) };
  }

  /**
   * Extract and fill transaction details such as internal/change spend, external spend (explicit vs. implicit), etc.
   * @param params
   * @returns {*}
   */
  async parseTransaction<TNumber extends number | bigint = number>(
    params: ParseTransactionOptions<TNumber>
  ): Promise<ParsedTransaction<TNumber>> {
    return parseTransaction(this, params);
  }

  /**
   * @deprecated - use function verifyUserPublicKey instead
   */
  protected verifyUserPublicKey(params: VerifyUserPublicKeyOptions): boolean {
    return verifyUserPublicKey(this.bitgo, params);
  }

  /**
   * @deprecated - use function verifyKeySignature instead
   */
  public verifyKeySignature(params: VerifyKeySignaturesOptions): boolean {
    return verifyKeySignature(params);
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
  async verifyTransaction<TNumber extends number | bigint = number>(
    params: VerifyTransactionOptions<TNumber>
  ): Promise<boolean> {
    return verifyTransaction(this, this.bitgo, params);
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
  async isWalletAddress(params: VerifyAddressOptions<UtxoCoinSpecific>, wallet?: IWallet): Promise<boolean> {
    const { address, addressType, keychains, chain, index } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (wallet && isDescriptorWallet(wallet)) {
      assertDescriptorWalletAddress(this.network, params, getDescriptorMapFromWallet(wallet));
      return true;
    }

    if ((_.isUndefined(chain) && _.isUndefined(index)) || !(_.isFinite(chain) && _.isFinite(index))) {
      throw new InvalidAddressDerivationPropertyError(
        `address validation failure: invalid chain (${chain}) or index (${index})`
      );
    }

    if (!keychains) {
      throw new Error('missing required param keychains');
    }

    const expectedAddress = this.generateAddress({
      format: params.format,
      addressType: addressType as ScriptType2Of3,
      keychains,
      threshold: 2,
      chain,
      index,
    });

    if (expectedAddress.address !== address) {
      throw new UnexpectedAddressError(
        `address validation failure: expected ${expectedAddress.address} but got ${address}`
      );
    }

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
  generateAddress(params: GenerateFixedScriptAddressOptions): AddressDetails {
    let derivationIndex = 0;
    if (_.isInteger(params.index) && (params.index as number) > 0) {
      derivationIndex = params.index as number;
    }

    const { keychains, threshold, chain, segwit = false, bech32 = false } = params as GenerateFixedScriptAddressOptions;

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
      throw new AddressTypeChainMismatchError(addressType, derivationChain);
    }

    if (!this.supportsAddressType(addressType)) {
      switch (addressType) {
        case 'p2sh':
          throw new Error(`internal error: p2sh should always be supported`);
        case 'p2shP2wsh':
          throw new P2shP2wshUnsupportedError();
        case 'p2wsh':
          throw new P2wshUnsupportedError();
        case 'p2tr':
          throw new P2trUnsupportedError();
        case 'p2trMusig2':
          throw new P2trMusig2UnsupportedError();
        default:
          throw new UnsupportedAddressTypeError();
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

    const path = '0/0/' + derivationChain + '/' + derivationIndex;
    const hdNodes = keychains.map(({ pub }) => bip32.fromBase58(pub));
    const derivedKeys = hdNodes.map((hdNode) => hdNode.derivePath(sanitizeLegacyPath(path)).publicKey);

    const { outputScript, redeemScript, witnessScript, address } = this.createMultiSigAddress(
      addressType,
      signatureThreshold,
      derivedKeys
    );

    return {
      address: this.canonicalAddress(address, params.format),
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
   * @returns input psbt added with deterministic MuSig2 nonce for bitgo key for each MuSig2 inputs.
   * @param psbtHex all MuSig2 inputs should contain user MuSig2 nonce
   * @param walletId
   */
  async signPsbt(psbtHex: string, walletId: string): Promise<SignPsbtResponse> {
    const params: SignPsbtRequest = { psbt: psbtHex };
    return await this.bitgo
      .post(this.url('/wallet/' + walletId + '/tx/signpsbt'))
      .send(params)
      .result();
  }

  /**
   * @returns input psbt added with deterministic MuSig2 nonce for bitgo key for each MuSig2 inputs from OVC.
   * @param ovcJson JSON object provided by OVC with fields psbtHex and walletId
   */
  async signPsbtFromOVC(ovcJson: Record<string, unknown>): Promise<Record<string, unknown>> {
    assert(ovcJson['psbtHex'], 'ovcJson must contain psbtHex');
    assert(ovcJson['walletId'], 'ovcJson must contain walletId');
    const psbt = (await this.signPsbt(ovcJson['psbtHex'] as string, ovcJson['walletId'] as string)).psbt;
    assert(psbt, 'psbt not found');
    return _.extend(ovcJson, { txHex: psbt });
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params - {@see SignTransactionOptions}
   * @returns {Promise<SignedTransaction | HalfSignedUtxoTransaction>}
   */
  async signTransaction<TNumber extends number | bigint = number>(
    params: SignTransactionOptions<TNumber>
  ): Promise<SignedTransaction | HalfSignedUtxoTransaction> {
    const txPrebuild = params.txPrebuild;

    if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
      if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
        throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
      }
      throw new Error('missing txPrebuild parameter');
    }

    let tx = this.decodeTransactionFromPrebuild(params.txPrebuild);

    const isTxWithKeyPathSpendInput = tx instanceof bitgo.UtxoPsbt && bitgo.isTransactionWithKeyPathSpendInput(tx);

    let isLastSignature = false;
    if (_.isBoolean(params.isLastSignature)) {
      // We can only be the first signature on a transaction with taproot key path spend inputs because
      // we require the secret nonce in the cache of the first signer, which is impossible to retrieve if
      // deserialized from a hex.
      if (params.isLastSignature && isTxWithKeyPathSpendInput) {
        throw new Error('Cannot be last signature on a transaction with key path spend inputs');
      }

      // if build is called instead of buildIncomplete, no signature placeholders are left in the sig script
      isLastSignature = params.isLastSignature;
    }

    const getSignerKeychain = (): utxolib.BIP32Interface => {
      const userPrv = params.prv;
      if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
        if (!_.isUndefined(userPrv)) {
          throw new Error(`prv must be a string, got type ${typeof userPrv}`);
        }
        throw new Error('missing prv parameter to sign transaction');
      }
      const signerKeychain = bip32.fromBase58(userPrv, utxolib.networks.bitcoin);
      if (signerKeychain.isNeutered()) {
        throw new Error('expected user private key but received public key');
      }
      debug(`Here is the public key of the xprv you used to sign: ${signerKeychain.neutered().toBase58()}`);
      return signerKeychain;
    };

    const setSignerMusigNonceWithOverride = (
      psbt: utxolib.bitgo.UtxoPsbt,
      signerKeychain: utxolib.BIP32Interface,
      nonSegwitOverride: boolean
    ) => {
      utxolib.bitgo.withUnsafeNonSegwit(psbt, () => psbt.setAllInputsMusig2NonceHD(signerKeychain), nonSegwitOverride);
    };

    let signerKeychain: utxolib.BIP32Interface | undefined;

    if (tx instanceof bitgo.UtxoPsbt && isTxWithKeyPathSpendInput) {
      switch (params.signingStep) {
        case 'signerNonce':
          signerKeychain = getSignerKeychain();
          setSignerMusigNonceWithOverride(tx, signerKeychain, !!params.allowNonSegwitSigningWithoutPrevTx);
          AbstractUtxoCoin.PSBT_CACHE.set(tx.getUnsignedTx().getId(), tx);
          return { txHex: tx.toHex() };
        case 'cosignerNonce':
          assert(txPrebuild.walletId, 'walletId is required for MuSig2 bitgo nonce');
          return { txHex: (await this.signPsbt(tx.toHex(), txPrebuild.walletId)).psbt };
        case 'signerSignature':
          const txId = tx.getUnsignedTx().getId();
          const psbt = AbstractUtxoCoin.PSBT_CACHE.get(txId);
          assert(
            psbt,
            `Psbt is missing from txCache (cache size ${AbstractUtxoCoin.PSBT_CACHE.size}).
            This may be due to the request being routed to a different BitGo-Express instance that for signing step 'signerNonce'.`
          );
          AbstractUtxoCoin.PSBT_CACHE.delete(txId);
          tx = psbt.combine(tx);
          break;
        default:
          // this instance is not an external signer
          assert(txPrebuild.walletId, 'walletId is required for MuSig2 bitgo nonce');
          signerKeychain = getSignerKeychain();
          setSignerMusigNonceWithOverride(tx, signerKeychain, !!params.allowNonSegwitSigningWithoutPrevTx);
          const response = await this.signPsbt(tx.toHex(), txPrebuild.walletId);
          tx.combine(bitgo.createPsbtFromHex(response.psbt, this.network));
          break;
      }
    } else {
      switch (params.signingStep) {
        case 'signerNonce':
        case 'cosignerNonce':
          /**
           * In certain cases, the caller of this method may not know whether the txHex contains a psbt with taproot key path spend input(s).
           * Instead of throwing error, no-op and return the txHex. So that the caller can call this method in the same sequence.
           */
          return { txHex: tx.toHex() };
      }
    }

    if (signerKeychain === undefined) {
      signerKeychain = getSignerKeychain();
    }

    let signedTransaction: bitgo.UtxoTransaction<bigint> | bitgo.UtxoPsbt;
    if (tx instanceof bitgo.UtxoPsbt) {
      signedTransaction = signAndVerifyPsbt(tx, signerKeychain, {
        isLastSignature,
        allowNonSegwitSigningWithoutPrevTx: params.allowNonSegwitSigningWithoutPrevTx,
      });
    } else {
      if (tx.ins.length !== txPrebuild.txInfo?.unspents?.length) {
        throw new Error('length of unspents array should equal to the number of transaction inputs');
      }

      if (!params.pubs || !isTriple(params.pubs)) {
        throw new Error(`must provide xpub array`);
      }

      const keychains = params.pubs.map((pub) => bip32.fromBase58(pub)) as Triple<BIP32Interface>;
      const cosignerPub = params.cosignerPub ?? params.pubs[2];
      const cosignerKeychain = bip32.fromBase58(cosignerPub);

      const walletSigner = new bitgo.WalletUnspentSigner<RootWalletKeys>(keychains, signerKeychain, cosignerKeychain);
      signedTransaction = signAndVerifyWalletTransaction(tx, txPrebuild.txInfo.unspents, walletSigner, {
        isLastSignature,
      }) as bitgo.UtxoTransaction<bigint>;
    }

    return {
      txHex: signedTransaction.toBuffer().toString('hex'),
    };
  }

  /**
   * Sign a transaction with a custom signing function. Example use case is express external signer
   * @param customSigningFunction custom signing function that returns a single signed transaction
   * @param signTransactionParams parameters for custom signing function. Includes txPrebuild and pubs (for legacy tx only).
   *
   * @returns signed transaction as hex string
   */
  async signWithCustomSigningFunction<TNumber extends number | bigint>(
    customSigningFunction: UtxoCustomSigningFunction<TNumber>,
    signTransactionParams: { txPrebuild: TransactionPrebuild<TNumber>; pubs?: string[] }
  ): Promise<SignedTransaction> {
    const txHex = signTransactionParams.txPrebuild.txHex;
    assert(txHex, 'missing txHex parameter');

    const tx = this.decodeTransaction(txHex);

    const isTxWithKeyPathSpendInput = tx instanceof bitgo.UtxoPsbt && bitgo.isTransactionWithKeyPathSpendInput(tx);

    if (!isTxWithKeyPathSpendInput) {
      return await customSigningFunction({ ...signTransactionParams, coin: this });
    }

    const getTxHex = (v: SignedTransaction): string => {
      if ('txHex' in v) {
        return v.txHex;
      }
      throw new Error('txHex not found in signTransaction result');
    };

    const signerNonceTx = await customSigningFunction({
      ...signTransactionParams,
      signingStep: 'signerNonce',
      coin: this,
    });

    const { pubs } = signTransactionParams;
    assert(pubs === undefined || isTriple(pubs));

    const cosignerNonceTx = await this.signTransaction<TNumber>({
      ...signTransactionParams,
      pubs,
      txPrebuild: { ...signTransactionParams.txPrebuild, txHex: getTxHex(signerNonceTx) },
      signingStep: 'cosignerNonce',
    });

    return await customSigningFunction({
      ...signTransactionParams,
      txPrebuild: { ...signTransactionParams.txPrebuild, txHex: getTxHex(cosignerNonceTx) },
      signingStep: 'signerSignature',
      coin: this,
    });
  }

  /**
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent<TNumber extends number | bigint>(unspent: Unspent<TNumber>): boolean {
    return isReplayProtectionUnspent<TNumber>(unspent, this.network);
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
   * Decompose a raw psbt/transaction into useful information, such as the total amounts,
   * change amounts, and transaction outputs.
   * @param params
   */
  async explainTransaction<TNumber extends number | bigint = number>(
    params: ExplainTransactionOptions<TNumber>
  ): Promise<TransactionExplanation> {
    return explainTx(this.decodeTransactionFromPrebuild(params), params, this.network);
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

  async recoverV1(params: V1RecoverParams): ReturnType<typeof v1BackupKeyRecovery> {
    return v1BackupKeyRecovery(this, this.bitgo, params);
  }

  async sweepV1(params: V1SweepParams): ReturnType<typeof v1Sweep> {
    return v1Sweep(this, this.bitgo, params);
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
   * @param params.apiKey for utxo coins other than [BTC,TBTC] this is a Block Chair api key
   * @returns {*}
   */
  async recoverFromWrongChain<TNumber extends number | bigint = number>(
    params: RecoverFromWrongChainOptions
  ): Promise<CrossChainRecoverySigned<TNumber> | CrossChainRecoveryUnsigned<TNumber>> {
    const { txid, recoveryAddress, wallet, walletPassphrase, xprv, apiKey } = params;

    // params.recoveryCoin used to be params.coin, backwards compatibility
    const recoveryCoin = params.coin || params.recoveryCoin;
    if (!recoveryCoin) {
      throw new Error('missing required object recoveryCoin');
    }
    // signed should default to true, and only be disabled if explicitly set to false (not undefined)
    const signed = params.signed !== false;

    const sourceCoinFamily = this.getFamily();
    const recoveryCoinFamily = recoveryCoin.getFamily();
    const supportedRecoveryCoins = supportedCrossChainRecoveries[sourceCoinFamily];

    if (_.isUndefined(supportedRecoveryCoins) || !supportedRecoveryCoins.includes(recoveryCoinFamily)) {
      throw new Error(`Recovery of ${sourceCoinFamily} balances from ${recoveryCoinFamily} wallets is not supported.`);
    }

    return await recoverCrossChain<TNumber>(this.bitgo, {
      sourceCoin: this,
      recoveryCoin,
      walletId: wallet,
      txid,
      recoveryAddress,
      walletPassphrase: signed ? walletPassphrase : undefined,
      xprv: signed ? xprv : undefined,
      apiKey,
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

  private shouldDefaultToPsbtTxFormat(buildParams: ExtraPrebuildParamsOptions & { wallet: Wallet }) {
    const walletFlagMusigKp = buildParams.wallet.flag('musigKp') === 'true';
    const isHotWallet = buildParams.wallet.type() === 'hot';

    // if not txFormat is already specified figure out if we should default to psbt format
    return (
      buildParams.txFormat === undefined &&
      (buildParams.wallet.subType() === 'distributedCustody' ||
        // default to testnet for all utxo coins except zcash
        (isTestnet(this.network) &&
          // FIXME(BTC-1322): fix zcash PSBT support
          getMainnet(this.network) !== utxolib.networks.zcash &&
          isHotWallet) ||
        // if mainnet, only default to psbt for btc hot wallets
        (isMainnet(this.network) && getMainnet(this.network) === utxolib.networks.bitcoin && isHotWallet) ||
        // default to psbt if it has the wallet flag
        walletFlagMusigKp)
    );
  }

  async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions & { wallet: Wallet }): Promise<{
    txFormat?: 'legacy' | 'psbt';
    changeAddressType?: ScriptType2Of3[] | ScriptType2Of3;
  }> {
    let txFormat = buildParams.txFormat as 'legacy' | 'psbt' | undefined;
    let changeAddressType = buildParams.changeAddressType as ScriptType2Of3[] | ScriptType2Of3 | undefined;

    if (this.shouldDefaultToPsbtTxFormat(buildParams)) {
      txFormat = 'psbt';
    }

    // if the addressType is not specified, we need to default to p2trMusig2 for testnet hot wallets for staged rollout of p2trMusig2
    if (
      buildParams.addressType === undefined && // addressType is deprecated and replaced by `changeAddress`
      buildParams.changeAddressType === undefined &&
      buildParams.changeAddress === undefined &&
      buildParams.wallet.type() === 'hot'
    ) {
      changeAddressType = ['p2trMusig2', 'p2wsh', 'p2shP2wsh', 'p2sh', 'p2tr'];
    }

    return {
      txFormat,
      changeAddressType,
    };
  }

  preCreateBitGo(params: PrecreateBitGoOptions): void {
    return;
  }

  async presignTransaction(params: PresignTransactionOptions): Promise<any> {
    // In the case that we have a 'psbt-lite' transaction format, we want to indicate in signing to not fail
    const txHex = (params.txHex ?? params.txPrebuild?.txHex) as string;
    if (
      txHex &&
      utxolib.bitgo.isPsbt(txHex as string) &&
      utxolib.bitgo.isPsbtLite(utxolib.bitgo.createPsbtFromHex(txHex, this.network)) &&
      params.allowNonSegwitSigningWithoutPrevTx === undefined
    ) {
      return { ...params, allowNonSegwitSigningWithoutPrevTx: true };
    }
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

  getRecoveryProvider(apiToken?: string): RecoveryProvider {
    return forCoin(this.getChain(), apiToken);
  }
}
