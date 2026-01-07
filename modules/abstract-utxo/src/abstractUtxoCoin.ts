import assert from 'assert';
import { randomBytes } from 'crypto';

import _ from 'lodash';
import * as utxolib from '@bitgo/utxo-lib';
import { bip32 } from '@bitgo/secp256k1';
import { bitgo, getMainnet, isMainnet, isTestnet } from '@bitgo/utxo-lib';
import {
  AddressCoinSpecific,
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
  IWallet,
  KeychainsTriplet,
  KeyIndices,
  MismatchedRecipient,
  MultisigType,
  multisigTypes,
  ParseTransactionOptions as BaseParseTransactionOptions,
  PrecreateBitGoOptions,
  PresignTransactionOptions,
  RequestTracer,
  SignedTransaction,
  TxIntentMismatchError,
  SignTransactionOptions as BaseSignTransactionOptions,
  SupplementGenerateWalletOptions,
  TransactionParams as BaseTransactionParams,
  TransactionPrebuild as BaseTransactionPrebuild,
  Triple,
  TxIntentMismatchRecipientError,
  VerificationOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions as BaseVerifyTransactionOptions,
  Wallet,
  isValidPrv,
  isValidXprv,
} from '@bitgo/sdk-core';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

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
import { isReplayProtectionUnspent } from './transaction/fixedScript/replayProtection';
import { supportedCrossChainRecoveries } from './config';
import {
  assertValidTransactionRecipient,
  DecodedTransaction,
  explainTx,
  fromExtendedAddressFormat,
  isScriptRecipient,
  parseTransaction,
  verifyTransaction,
} from './transaction';
import type { TransactionExplanation } from './transaction/fixedScript/explainTransaction';
import { Musig2Participant } from './transaction/fixedScript/musig2';
import {
  AggregateValidationError,
  ErrorMissingOutputs,
  ErrorImplicitExternalOutputs,
} from './transaction/descriptor/verifyTransaction';
import { assertDescriptorWalletAddress, getDescriptorMapFromWallet, isDescriptorWallet } from './descriptor';
import { getCoinName, getFamilyFromNetwork, getFullNameFromNetwork, UtxoCoinName, UtxoCoinNameMainnet } from './names';
import { assertFixedScriptWalletAddress } from './address/fixedScript';
import { isSdkBackend, ParsedTransaction, SdkBackend } from './transaction/types';
import { decodePsbtWith, encodeTransaction, stringToBufferTryFormats } from './transaction/decode';
import { toBip32Triple, UtxoKeychain } from './keychains';
import { verifyKeySignature, verifyUserPublicKey } from './verifyKey';
import { getPolicyForEnv } from './descriptor/validatePolicy';
import { signTransaction } from './transaction/signTransaction';
import { isUtxoWalletData, UtxoWallet } from './wallet';
import { isDescriptorWalletData } from './descriptor/descriptorWallet';

import ScriptType2Of3 = utxolib.bitgo.outputScripts.ScriptType2Of3;

export type TxFormat =
  // This is a legacy transaction format based around the bitcoinjs-lib serialization of unsigned transactions
  // does not include prevOut data and is a bit painful to work with
  // going to be deprecated in favor of psbt
  // @deprecated
  | 'legacy'
  // This is the standard psbt format, including the full prevTx data for legacy transactions.
  // This will remain supported but is not the default, since the data sizes can become prohibitively large.
  | 'psbt'
  // This is a nonstandard psbt version where legacy inputs are serialized as if they were segwit inputs.
  // While this prevents us to fully verify the transaction fee, we have other checks in place to ensure the fee is within bounds.
  | 'psbt-lite';

export class ErrorDeprecatedTxFormat extends Error {
  constructor(txFormat: TxFormat) {
    super(`SDK support for txFormat=${txFormat} is deprecated on this environment. Please use psbt instead.`);
  }
}

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

const { isChainCode, scriptTypeForChain, outputScripts } = bitgo;

type Unspent<TNumber extends number | bigint = number> = bitgo.Unspent<TNumber>;

/**
 * Convert ValidationError to TxIntentMismatchRecipientError with structured data
 *
 * This preserves the structured error information from the original ValidationError
 * by extracting the mismatched outputs and converting them to the standardized format.
 * The original error is preserved as the `cause` for debugging purposes.
 */
function convertValidationErrorToTxIntentMismatch(
  error: AggregateValidationError,
  reqId: string | IRequestTracer | undefined,
  txParams: BaseTransactionParams,
  txHex: string | undefined,
  txExplanation?: unknown
): TxIntentMismatchRecipientError {
  const mismatchedRecipients: MismatchedRecipient[] = [];

  for (const err of error.errors) {
    if (err instanceof ErrorMissingOutputs) {
      mismatchedRecipients.push(
        ...err.missingOutputs.map((output) => ({
          address: output.address,
          amount: output.amount.toString(),
        }))
      );
    } else if (err instanceof ErrorImplicitExternalOutputs) {
      mismatchedRecipients.push(
        ...err.implicitExternalOutputs.map((output) => ({
          address: output.address,
          amount: output.amount.toString(),
        }))
      );
    }
  }

  const txIntentError = new TxIntentMismatchRecipientError(
    error.message,
    reqId,
    [txParams],
    txHex,
    mismatchedRecipients,
    txExplanation
  );
  // Preserve the original structured error as the cause for debugging
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
  (txIntentError as Error & { cause?: Error }).cause = error;
  return txIntentError;
}

export type { DecodedTransaction } from './transaction/types';

export type RootWalletKeys = bitgo.RootWalletKeys;

export type UtxoCoinSpecific = AddressCoinSpecific | DescriptorAddressCoinSpecific;

export interface VerifyAddressOptions<TCoinSpecific extends UtxoCoinSpecific> extends BaseVerifyAddressOptions {
  chain?: number;
  index: number;
  coinSpecific?: TCoinSpecific;
}

export type Bip322Message = {
  address: string;
  message: string;
};

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
  decodeWith?: SdkBackend;
}

export interface DecoratedExplainTransactionOptions<TNumber extends number | bigint = number>
  extends ExplainTransactionOptions<TNumber> {
  changeInfo?: { address: string; chain: number; index: number }[];
}

export type UtxoNetwork = utxolib.Network;

export interface TransactionPrebuild<TNumber extends number | bigint = number> extends BaseTransactionPrebuild {
  txInfo?: TransactionInfo<TNumber>;
  blockHeight?: number;
  decodeWith?: SdkBackend;
}

export interface TransactionParams extends BaseTransactionParams {
  walletPassphrase?: string;
  allowExternalChangeAddress?: boolean;
  changeAddress?: string;
  rbfTxIds?: string[];
}

export interface ParseTransactionOptions<TNumber extends number | bigint = number> extends BaseParseTransactionOptions {
  txParams: TransactionParams;
  txPrebuild: TransactionPrebuild<TNumber>;
  wallet: UtxoWallet;
  verification?: VerificationOptions;
  reqId?: IRequestTracer;
}

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
    decodeWith?: SdkBackend;
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
  wallet?: UtxoWallet;
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
  userKeychain?: UtxoKeychain;
  disableNetworking: boolean;
  txParams: TransactionParams;
}

export interface VerifyTransactionOptions<TNumber extends number | bigint = number>
  extends BaseVerifyTransactionOptions {
  txPrebuild: TransactionPrebuild<TNumber>;
  txParams: TransactionParams;
  wallet: UtxoWallet;
}

export interface SignPsbtRequest {
  psbt: string;
}

export interface SignPsbtResponse {
  psbt: string;
}

export abstract class AbstractUtxoCoin
  extends BaseCoin
  implements Musig2Participant<utxolib.bitgo.UtxoPsbt>, Musig2Participant<fixedScriptWallet.BitGoPsbt>
{
  public altScriptHash?: number;
  public supportAltScriptDestination?: boolean;
  public defaultSdkBackend: SdkBackend = 'utxolib';
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

  /** @deprecated - will be removed when we drop support for utxolib */
  get network(): utxolib.Network {
    return this._network;
  }

  get name(): UtxoCoinName {
    return getCoinName(this.network);
  }

  getChain(): UtxoCoinName {
    return this.name;
  }

  getFamily(): UtxoCoinNameMainnet {
    return getFamilyFromNetwork(this.network);
  }

  getFullName(): string {
    return getFullNameFromNetwork(this.network);
  }

  /** Indicates whether the coin supports a block target */
  supportsBlockTarget(): boolean {
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
  getBaseFactor(): number {
    return 1e8;
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
  isValidPub(pub: string): boolean {
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
    const tx = this.decodeTransactionFromPrebuild(prebuild);
    if (_.isUndefined(prebuild.blockHeight)) {
      prebuild.blockHeight = (await this.getLatestBlockHeight()) as number;
    }
    return _.extend({}, prebuild, { txHex: encodeTransaction(tx).toString('hex') });
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

  decodeTransaction<TNumber extends number | bigint>(
    input: Buffer | string,
    decodeWith: SdkBackend = this.defaultSdkBackend
  ): DecodedTransaction<TNumber> {
    if (typeof input === 'string') {
      const buffer = stringToBufferTryFormats(input, ['hex', 'base64']);
      return this.decodeTransaction(buffer, decodeWith);
    }

    if (utxolib.bitgo.isPsbt(input)) {
      return decodePsbtWith(input, this.network, decodeWith);
    } else {
      if (decodeWith !== 'utxolib') {
        console.error('received decodeWith hint %s, ignoring for legacy transaction', decodeWith);
      }
      return utxolib.bitgo.createTransactionFromBuffer(input, this.network, {
        amountType: this.amountType,
      });
    }
  }

  decodeTransactionAsPsbt(input: Buffer | string): utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt {
    const decoded = this.decodeTransaction(input);
    if (decoded instanceof fixedScriptWallet.BitGoPsbt || decoded instanceof utxolib.bitgo.UtxoPsbt) {
      return decoded;
    }
    throw new Error('expected psbt but got transaction');
  }

  decodeTransactionFromPrebuild<TNumber extends number | bigint>(prebuild: {
    txHex?: string;
    txBase64?: string;
    decodeWith?: string;
  }): DecodedTransaction<TNumber> {
    const string = prebuild.txHex ?? prebuild.txBase64;
    if (!string) {
      throw new Error('missing required txHex or txBase64 property');
    }
    let { decodeWith } = prebuild;
    if (decodeWith !== undefined) {
      if (typeof decodeWith !== 'string' || !isSdkBackend(decodeWith)) {
        console.error('decodeWith %s is not a valid value, using default', decodeWith);
        decodeWith = undefined;
      }
    }
    return this.decodeTransaction(string, decodeWith);
  }

  toCanonicalTransactionRecipient(output: { valueString: string; address?: string }): {
    amount: bigint;
    address: string;
  } {
    const amount = BigInt(output.valueString);
    assertValidTransactionRecipient({ amount, address: output.address });
    assert(output.address, 'address is required');
    if (isScriptRecipient(output.address)) {
      return { amount, address: output.address };
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
   * @returns {boolean} True if verification passes
   * @throws {TxIntentMismatchError} if transaction validation fails
   * @throws {TxIntentMismatchRecipientError} if transaction recipients don't match user intent
   */
  async verifyTransaction<TNumber extends number | bigint = number>(
    params: VerifyTransactionOptions<TNumber>
  ): Promise<boolean> {
    try {
      return await verifyTransaction(this, this.bitgo, params);
    } catch (error) {
      if (error instanceof AggregateValidationError) {
        const txExplanation = await TxIntentMismatchError.tryGetTxExplanation(
          this as unknown as IBaseCoin,
          params.txPrebuild
        );
        throw convertValidationErrorToTxIntentMismatch(
          error,
          params.reqId,
          params.txParams,
          params.txPrebuild.txHex,
          txExplanation
        );
      }
      throw error;
    }
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
    const { address, keychains, chain, index } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (wallet && isDescriptorWallet(wallet)) {
      if (!keychains) {
        throw new Error('missing required param keychains');
      }
      if (!isTriple(keychains)) {
        throw new Error('keychains must be a triple');
      }
      assertDescriptorWalletAddress(
        this.network,
        params,
        getDescriptorMapFromWallet(wallet, toBip32Triple(keychains), getPolicyForEnv(this.bitgo.env))
      );
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

    assertFixedScriptWalletAddress(this.network, {
      address,
      keychains,
      format: params.format ?? 'base58',
      addressType: params.addressType,
      chain,
      index,
    });

    return true;
  }

  /**
   * @param addressType
   * @returns true iff coin supports spending from unspentType
   */
  supportsAddressType(addressType: ScriptType2Of3): boolean {
    return utxolib.bitgo.outputScripts.isSupportedScriptType(this.network, addressType);
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
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
   * @returns input psbt added with deterministic MuSig2 nonce for bitgo key for each MuSig2 inputs.
   * @param psbt all MuSig2 inputs should contain user MuSig2 nonce
   * @param walletId
   */
  async getMusig2Nonces(psbt: utxolib.bitgo.UtxoPsbt, walletId: string): Promise<utxolib.bitgo.UtxoPsbt>;
  async getMusig2Nonces(psbt: fixedScriptWallet.BitGoPsbt, walletId: string): Promise<fixedScriptWallet.BitGoPsbt>;
  async getMusig2Nonces<T extends utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt>(
    psbt: T,
    walletId: string
  ): Promise<T>;
  async getMusig2Nonces<T extends utxolib.bitgo.UtxoPsbt | fixedScriptWallet.BitGoPsbt>(
    psbt: T,
    walletId: string
  ): Promise<T> {
    const buffer = encodeTransaction(psbt);
    const response = await this.bitgo
      .post(this.url('/wallet/' + walletId + '/tx/signpsbt'))
      .send({ psbt: buffer.toString('hex') })
      .result();
    if (psbt instanceof utxolib.bitgo.UtxoPsbt) {
      return decodePsbtWith(response.psbt, this.network, 'utxolib') as T;
    } else {
      return decodePsbtWith(response.psbt, this.network, 'wasm-utxo') as T;
    }
  }

  /**
   * @deprecated Use getMusig2Nonces instead
   * @returns input psbt added with deterministic MuSig2 nonce for bitgo key for each MuSig2 inputs.
   * @param psbtHex all MuSig2 inputs should contain user MuSig2 nonce
   * @param walletId
   */
  async signPsbt(psbtHex: string, walletId: string): Promise<SignPsbtResponse> {
    const psbt = await this.getMusig2Nonces(this.decodeTransactionAsPsbt(psbtHex), walletId);
    return { psbt: encodeTransaction(psbt).toString('hex') };
  }

  /**
   * @returns input psbt added with deterministic MuSig2 nonce for bitgo key for each MuSig2 inputs from OVC.
   * @param ovcJson JSON object provided by OVC with fields psbtHex and walletId
   */
  async signPsbtFromOVC(ovcJson: Record<string, unknown>): Promise<Record<string, unknown>> {
    assert(ovcJson['psbtHex'], 'ovcJson must contain psbtHex');
    assert(ovcJson['walletId'], 'ovcJson must contain walletId');
    const hex = ovcJson['psbtHex'] as string;
    const walletId = ovcJson['walletId'] as string;
    const psbt = await this.getMusig2Nonces(this.decodeTransactionAsPsbt(hex), walletId);
    return _.extend(ovcJson, { txHex: encodeTransaction(psbt).toString('hex') });
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params - {@see SignTransactionOptions}
   * @returns {Promise<SignedTransaction | HalfSignedUtxoTransaction>}
   */
  async signTransaction<TNumber extends number | bigint = number>(
    params: SignTransactionOptions<TNumber>
  ): Promise<SignedTransaction | HalfSignedUtxoTransaction> {
    return signTransaction<TNumber>(this, this.bitgo, params);
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
   * Decompose a raw psbt/transaction into useful information, such as the total amounts,
   * change amounts, and transaction outputs.
   * @param params
   */
  override async explainTransaction<TNumber extends number | bigint = number>(
    params: ExplainTransactionOptions<TNumber>
  ): Promise<TransactionExplanation> {
    return explainTx(this.decodeTransactionFromPrebuild(params), params, this.network);
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

  /**
   * Determines the default transaction format based on wallet properties and network
   * @param wallet - The wallet to check
   * @param requestedFormat - Optional explicitly requested format
   * @returns The transaction format to use, or undefined if no default applies
   */
  getDefaultTxFormat(wallet: Wallet, requestedFormat?: TxFormat): TxFormat | undefined {
    // If format is explicitly requested, use it
    if (requestedFormat !== undefined) {
      if (isTestnet(this.network) && requestedFormat === 'legacy') {
        throw new ErrorDeprecatedTxFormat(requestedFormat);
      }

      return requestedFormat;
    }

    if (isTestnet(this.network)) {
      return 'psbt-lite';
    }

    const walletFlagMusigKp = wallet.flag('musigKp') === 'true';
    const isHotWallet = wallet.type() === 'hot';

    // Determine if we should default to psbt format
    const shouldDefaultToPsbt =
      wallet.subType() === 'distributedCustody' ||
      // if mainnet, only default to psbt for btc hot wallets
      (isMainnet(this.network) && getMainnet(this.network) === utxolib.networks.bitcoin && isHotWallet) ||
      // default to psbt if it has the wallet flag
      walletFlagMusigKp;

    return shouldDefaultToPsbt ? 'psbt' : undefined;
  }

  async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions & { wallet: Wallet }): Promise<{
    txFormat?: TxFormat;
    changeAddressType?: ScriptType2Of3[] | ScriptType2Of3;
  }> {
    const txFormat = this.getDefaultTxFormat(buildParams.wallet, buildParams.txFormat as TxFormat | undefined);
    let changeAddressType = buildParams.changeAddressType as ScriptType2Of3[] | ScriptType2Of3 | undefined;

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
    if (params.walletData && isUtxoWalletData(params.walletData) && isDescriptorWalletData(params.walletData)) {
      return params;
    }
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

  /** @inheritDoc */
  auditDecryptedKey({
    multiSigType,
    publicKey,
    prv,
  }: {
    multiSigType: MultisigType;
    publicKey: string;
    prv: string;
  }): void {
    if (multiSigType === 'tss') {
      throw new Error('tss auditing is not supported for this coin');
    }
    if (!isValidPrv(prv) && !isValidXprv(prv)) {
      throw new Error('invalid private key');
    }
    if (publicKey) {
      const genPubKey = bip32.fromBase58(prv).neutered().toBase58();
      if (genPubKey !== publicKey) {
        throw new Error('public key does not match private key');
      }
    }
  }
}
