import * as accountLib from '@bitgo/account-lib';
import { Material } from '@bitgo/account-lib/dist/src/coin/dot/iface';
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { MethodNotImplementedError } from '../../errors';
import {
  BaseCoin,
  DerivedKeyPair,
  DeriveKeypairOptions,
  ExtraPrebuildParamsOptions,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  PresignTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../baseCoin';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
  material: Material;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: accountLib.Dot.Interface.TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
  material: Material;
}

const dotUtils = accountLib.Dot.Utils.default;

export class Dot extends BaseCoin {
  private static materialData: Material;
  
  readonly MAX_VALIDITY_DURATION = 2400;
  constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Dot(bitgo);
  }

  getChain(): string {
    return 'dot';
  }

  getBaseChain(): string {
    return 'dot';
  }

  getFamily(): string {
    return 'dot';
  }

  getFullName(): string {
    return 'Polkadot';
  }

  getBaseFactor(): number {
    return 1e12;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsDerivationKeypair(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions): Promise<Record<string, unknown>> {
    buildParams.material = await this.materialDataLookup();
    return buildParams;
  }

  /**
   * Url at which the material data can be reached
   */
  private async materialDataLookup(): Promise<Material> {
    if (!Dot.materialData) {
      Dot.materialData = await this.bitgo.get(this.url('/material')).result();
    }
    return Dot.materialData;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed
      ? dotUtils.keyPairFromSeed(new Uint8Array(seed))
      : new accountLib.Dot.KeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /** @inheritDoc */
  deriveKeypair(params: DeriveKeypairOptions): DerivedKeyPair | undefined {
    try {
      if (_.isNil(params.addressDerivationPrv)) {
        throw new Error('addressDerivationPrv is missing');
      }
      const rootKeyPair = new accountLib.Dot.KeyPair({ prv: params.addressDerivationPrv });
      const derivationPath = `m/0'/0'/0'/${params.index}'`;
      const derivedKeys = rootKeyPair.deriveHardened(derivationPath);
      if (_.isNil(derivedKeys?.prv)) {
        throw new Error('Key derivation failed - missing derived prv key');
      }
      const derivedBase58KeyPair = new accountLib.Dot.KeyPair({ prv: derivedKeys.prv });
      const { prv, pub } = derivedBase58KeyPair.getKeys();
      const derivedAddress = derivedBase58KeyPair.getAddress();
      if (!_.isString(prv) || !accountLib.Dot.Utils.default.isValidPrivateKey(prv)) {
        throw new Error('failed to create valid derived base58 prv key');
      }
      if (!_.isString(pub) || !accountLib.Dot.Utils.default.isValidPublicKey(pub)) {
        throw new Error('failed to create valid derived base58 pub key');
      }
      if (!accountLib.Dot.Utils.default.isValidAddress(derivedAddress)) {
        throw new Error('failed to create valid DOT address from derived base58 keys');
      }
      return {
        prv,
        pub,
        address: derivedAddress,
      };
    } catch (e) {
      throw new Error(`failed to derive key pair with: ${e}`);
    }
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return dotUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid dot private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return dotUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return dotUtils.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   * @return {Buffer} A signature over the given message using the given key
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const msg = Buffer.isBuffer(message) ? message.toString('utf8') : message;
    // reconstitute keys and sign
    return Buffer.from(new accountLib.Dot.KeyPair({ prv: key.prv }).signMessage(msg));
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
  ): Promise<never> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const { prv, material } = params;

    const txHex = params.txPrebuild.txHex;

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params, 'pubs')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    if (_.isUndefined(material)) {
      throw new Error('missing material parameter to sign transaction');
    }

    if (!_.isObject(material)) {
      throw new Error(`material must be an object, got type ${typeof prv}`);
    }

    return { txHex, prv, material };
  }

  async presignTransaction(params: PresignTransactionOptions): Promise<any> {
    return params;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.material {Material} material data for the txn
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, prv, material } = this.verifySignTransactionParams(params);
    
    const factory = accountLib.register(this.getChain(), accountLib.Dot.TransactionBuilderFactory).material(material);

    const txBuilder = factory.from(txHex);
    const keyPair = new accountLib.Dot.KeyPair({ prv: prv });
    const { referenceBlock, blockNumber, transactionVersion, sender } = params.txPrebuild.transaction;

    txBuilder
      .validity({ firstValid: blockNumber, maxDuration: this.MAX_VALIDITY_DURATION })
      .referenceBlock(referenceBlock)
      .version(transactionVersion)
      .sender({ address: sender })
      .sign({ key: keyPair.getKeys().prv });
    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = transaction.toBroadcastFormat();
    return { txHex: signedTxHex };
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: never): Promise<never> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
  }

  async parseTransaction(
    params: ParseTransactionOptions,
  ): Promise<ParsedTransaction> {
    return {};
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new accountLib.Dot.KeyPair({ pub: Pubkey }).getAddress();
  }
}
