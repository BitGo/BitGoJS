/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import * as _ from 'lodash';
import {
  NaclWrapper,
  Multisig,
  Address,
  Seed,
  generateAccountFromSeed,
  generateAccount,
  isValidAddress,
  isValidSeed,
  Encoding,
} from 'algosdk';

export interface TransactionExplanation {
  displayOrder: string[];
  id: string;
  outputs: Output[],
  changeOutputs: Output[],
  outputAmount: string;
  changeAmount: number;
  fee: TransactionFee;
  memo: string;
}

export interface SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
  wallet: {
    addressVersion: string;
  }
  keychain: KeyPair;
  backupKeychain: KeyPair;
  bitgoKeychain: KeyPair;
}

export interface TransactionPrebuild {
  txHex: string;
  txInfo: {
    from: string;
    to: string;
    amount: string;
    fee: number;
    firstRound: number;
    lastRound: number;
    genesisID: string;
    genesisHash: string;
    note?: string;
  }
}

export interface HalfSignedTransaction {
  halfSigned: {
    txHex: string,
  }
}

export interface Output {
  address: string;
  amount: string;
}

export interface TransactionFee {
  fee: number;
  feeRate?: number;
  size?: number
}

export interface ExplainTransactionOptions {
  txHex: string;
  wallet: {
    addressVersion: string;
  }
}

interface KeyPair {
  pub: string;
  prv: string;
}

const MAX_ALGORAND_NOTE_LENGTH = 1024;

export class Algo extends BaseCoin {

  constructor(bitgo) {
    super(bitgo);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Algo(bitgo);
  }

  getChain(): string {
    return 'algo';
  }

  getFamily(): string {
    return 'algo';
  }

  getFullName(): string {
    return 'Algorand';
  }

  getBaseFactor(): any {
    return 1e6;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    // TODO: this sounds like its true with the staking txes - confirm before launch
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const pair = seed ? generateAccountFromSeed(seed) : generateAccount();
    return {
      pub: pair.addr, // encoded pub
      prv: Seed.encode(pair.sk), // encoded seed
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub): boolean {
    return isValidAddress(pub);
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   * In Algorand, when the private key is encoded as base32 string only the first 32 bytes are taken,
   * so the encoded value is actually the seed
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return isValidSeed(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer): Buffer {
    // key.prv actually holds the encoded seed, but we use the prv name to avoid breaking the keypair schema.
    // See jsdoc comment in isValidPrv
    let seed = key.prv;
    if (!this.isValidPrv(seed)) {
      throw new Error(`invalid seed: ${seed}`);
    }
    if (typeof seed === 'string') {
      try {
        seed = Seed.decode(seed).seed;
      } catch (e) {
        throw new Error(`could not decode seed: ${seed}`);
      }
    }
    const keyPair = generateAccountFromSeed(seed);

    if (!Buffer.isBuffer(message)) {
      message = Buffer.from(message);
    }

    return Buffer.from(NaclWrapper.sign(message, keyPair.sk));
  }

  /**
   * Specifies what key we will need for signing` - Algorand needs the backup, bitgo pubs.
   */
  keyIdsForSigning(): number[] {
    return [ 0, 1, 2 ]; 
  }

  /**
   * Explain/parse transaction
   * @param params
   * - txHex: transaction encoded as base64 string   
   */
  explainTransaction(params: ExplainTransactionOptions): TransactionExplanation {
    const { txHex } = params;

    let tx;
    try {
      const txToHex = Buffer.from(txHex, 'base64');
      const decodedTx = Encoding.decode(txToHex);

      // if we are a signed msig tx, the structure actually has the { msig, txn } as the root object
      // if we are not signed, the decoded tx is the txn - refer to partialSignTxn and MultiSig constructor
      //   in algosdk for more information
      const txnForDecoding = decodedTx.txn || decodedTx;

      tx = Multisig.MultiSigTransaction.from_obj_for_encoding(txnForDecoding);
    } catch (ex) {
      throw new Error('txHex needs to be a valid tx encoded as base64 string');
    }

    const id = tx.txID();
    const fee = { fee: tx.fee};

    const outputs = [{
      amount: tx.amount,
      address: Address.encode(new Uint8Array(tx.to.publicKey)),
    }];

    const outputAmount = tx.amount;

    // TODO(CT-480): add recieving address display here
    const memo = tx.note;

    return {
      displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'memo'],
      id,
      outputs,
      outputAmount,
      changeAmount: 0,
      fee,
      changeOutputs: [],
      memo
    };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   */
  signTransaction(params: SignTransactionOptions): HalfSignedTransaction {
    const prv = params.prv;
    const txHex = params.txPrebuild.txHex;
    const addressVersion = params.wallet.addressVersion;

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

    if (!_.has(params, 'keychain') || !_.has(params, 'backupKeychain') || !_.has(params, 'bitgoKeychain')) {
      throw new Error('missing public keys parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    // we need to re-encode our public keys using algosdk's format
    const encodedPublicKeys = [
      Address.decode(params.keychain.pub).publicKey,
      Address.decode(params.backupKeychain.pub).publicKey,
      Address.decode(params.bitgoKeychain.pub).publicKey,
    ];

    // re-encode sk from our prv (this acts as a seed out of the keychain)
    const seed = Seed.decode(prv).seed;
    const pair = generateAccountFromSeed(seed);
    const sk = pair.sk;

    // decode our tx
    let transaction;
    try {
      const txToHex = Buffer.from(txHex, 'base64');
      const decodedTx = Encoding.decode(txToHex);
      transaction = Multisig.MultiSigTransaction.from_obj_for_encoding(decodedTx);
    } catch (e) {
      throw new Error('transaction needs to be a valid tx encoded as base64 string');
    }
    
    // sign
    const halfSigned = transaction.partialSignTxn(
      { version: addressVersion, threshold: 2, pks: encodedPublicKeys },
      sk
    );

    const signedBase64 = Buffer.from(halfSigned).toString('base64');

    return { 
      halfSigned: { 
        txHex: signedBase64,
      } 
    };
  }
}
