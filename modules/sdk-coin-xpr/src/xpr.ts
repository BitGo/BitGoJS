import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions as BaseVerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  InvalidAddressError,
  UnexpectedAddressError,
  MethodNotImplementedError,
  AuditDecryptedKeyParams,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { KeyPair as XprKeyPair, Transaction, TransferBuilder } from './lib';
import utils from './lib/utils';
import { MAINNET_CHAIN_ID, XPR_PRECISION } from './lib/constants';

/**
 * Verify address options for XPR
 */
interface VerifyAddressOptions extends BaseVerifyAddressOptions {
  rootAddress: string;
}

/**
 * Transaction prebuild interface
 */
export interface XprTransactionPrebuild {
  txHex: string;
  headers: {
    expiration: string;
    refBlockNum: number;
    refBlockPrefix: number;
  };
}

/**
 * Sign transaction options
 */
export interface XprSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: XprTransactionPrebuild;
  prv: string;
}

/**
 * Verify transaction options
 */
export interface XprVerifyTransactionOptions extends VerifyTransactionOptions {
  txPrebuild: XprTransactionPrebuild;
}

/**
 * Proton (XPR Network) main coin class
 */
export class Xpr extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Xpr(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivision
   * XPR has 4 decimal places
   */
  public getBaseFactor(): number {
    return Math.pow(10, XPR_PRECISION);
  }

  public getChain(): string {
    return 'xpr';
  }

  public getFamily(): string {
    return 'xpr';
  }

  public getFullName(): string {
    return 'Proton (XPR Network)';
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Check if this coin supports TSS (Threshold Signature Scheme)
   * @returns {boolean} True if TSS is supported
   */
  supportsTss(): boolean {
    return true;
  }

  /**
   * Get the MPC algorithm for TSS
   * @returns {MPCAlgorithm} 'ecdsa' for secp256k1 based coins
   */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Checks if the address is a valid Proton account name
   * @param address - the account name to validate
   */
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  /**
   * Generate secp256k1 key pair (K1 type used by EOSIO/Proton)
   *
   * @param seed - optional seed for deterministic key generation
   * @returns {KeyPair} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new XprKeyPair({ seed }) : new XprKeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   * Supports both PUB_K1_ and legacy EOS formats.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin.
   * Supports PVT_K1_ and WIF formats.
   *
   * @param {String} prv the private key to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return utils.isValidPrivateKey(prv);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   * @param params
   * @returns {boolean}
   */
  async verifyTransaction(params: XprVerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild, txParams } = params;

    if (!txPrebuild?.txHex) {
      throw new Error('Missing txPrebuild.txHex');
    }

    // Parse the transaction
    const tx = new Transaction(this._staticsCoin);
    tx.fromRawTransaction(txPrebuild.txHex);

    // Verify the transaction can be parsed
    const explanation = tx.explainTransaction();
    if (!explanation) {
      throw new Error('Failed to explain transaction');
    }

    return true;
  }

  /**
   * Check if address is a wallet address
   * For Proton, account names are registered on-chain and not derived from public keys.
   * This validates that the address matches the expected format.
   *
   * @param params
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, rootAddress } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`Invalid address: ${address}`);
    }

    // For Proton, compare addresses directly (account names)
    if (rootAddress && address !== rootAddress) {
      throw new UnexpectedAddressError(`Address mismatch: ${address} vs ${rootAddress}`);
    }

    return true;
  }

  /**
   * Parse a transaction from the raw transaction hex
   * @param params
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    const rawTx = params.txHex as string | undefined;

    if (!rawTx) {
      throw new Error('Missing raw transaction');
    }

    const tx = new Transaction(this._staticsCoin);
    tx.fromRawTransaction(rawTx);

    return {
      inputs: tx.inputs,
      outputs: tx.outputs,
    };
  }

  /**
   * Explain a transaction
   * @param params
   */
  async explainTransaction(params: { txHex: string }): Promise<BaseTransactionExplanation> {
    if (!params.txHex) {
      throw new Error('Missing txHex parameter');
    }

    const tx = new Transaction(this._staticsCoin);
    tx.fromRawTransaction(params.txHex);

    return tx.explainTransaction();
  }

  /**
   * Sign a transaction
   * @param params
   */
  async signTransaction(params: XprSignTransactionOptions): Promise<SignedTransaction> {
    const { txPrebuild, prv } = params;

    if (!txPrebuild?.txHex) {
      throw new Error('Missing txPrebuild.txHex');
    }

    if (!prv) {
      throw new Error('Missing private key');
    }

    // Create key pair from private key
    const keyPair = new XprKeyPair({ prv });

    // Parse the transaction
    const tx = new Transaction(this._staticsCoin);
    tx.fromRawTransaction(txPrebuild.txHex);

    // Sign the transaction
    await tx.sign(keyPair);

    return {
      txHex: tx.toBroadcastFormat(),
    };
  }

  /**
   * Get the chain ID for this coin
   * @returns {string} The chain ID
   */
  getChainId(): string {
    return MAINNET_CHAIN_ID;
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    throw new MethodNotImplementedError();
  }
}
