/**
 * @prettier
 */
import { randomBytes } from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  Wallet,
} from '../';

export class Ofc extends BaseCoin {
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Ofc(bitgo);
  }

  getChain() {
    return 'ofc';
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
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

  getFamily() {
    return 'ofc';
  }

  getFullName() {
    return 'Offchain';
  }

  /**
   * Return whether the given m of n wallet signers/ key amounts are valid for the coin
   */
  isValidMofNSetup({ m, n }: { m: number; n: number }) {
    return m === 1 && n === 1;
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

  isValidAddress(address: string): boolean {
    throw new MethodNotImplementedError();
  }

  getBaseFactor(): number | string {
    return 0;
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new MethodNotImplementedError();
  }

  /**
   * Signs a message using a trading wallet's BitGo Key
   * @param wallet - uses the BitGo key of this trading wallet to sign the message remotely in a KMS
   * @param message
   */
  async signMessage(wallet: Wallet, message: string): Promise<Buffer>;
  /**
   * Signs a message using the private key
   * @param key - uses the private key to sign the message
   * @param message
   */
  async signMessage(key: { prv: string }, message: string): Promise<Buffer>;
  async signMessage(keyOrWallet: { prv: string } | Wallet, message: string): Promise<Buffer> {
    if (!(keyOrWallet instanceof Wallet)) {
      return super.signMessage(keyOrWallet as { prv: string }, message);
    }
    const signatureHexString = await (keyOrWallet as Wallet).toTradingAccount().signPayload({ payload: message });
    return Buffer.from(signatureHexString, 'hex');
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams) {
    throw new MethodNotImplementedError();
  }
}
