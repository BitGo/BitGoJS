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
  mergeMultisigTransactions,
} from 'algosdk';
import * as stellar from 'stellar-sdk';
import * as Bluebird from 'bluebird';
import { NodeCallback } from '../types';

const co = Bluebird.coroutine;

export interface TransactionExplanation {
  displayOrder: string[];
  id: string;
  outputs: Output[];
  changeOutputs: Output[];
  outputAmount: string;
  changeAmount: number;
  fee: TransactionFee;
  memo: string;
}

export interface SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  halfSigned?: {
    txHex: string;
  };
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
  };
  keys: string[];
  addressVersion: number;
}

export interface FullySignedTransaction {
  txHex: string;
}

export interface HalfSignedTransaction {
  halfSigned: {
    txHex: string;
  };
}

export interface Output {
  address: string;
  amount: string;
}

export interface TransactionFee {
  fee: number;
  feeRate?: number;
  size?: number;
}

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface InitiateRecoveryOptions {
  userKey: string;
  backupKey: string;
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase?: string;
}

export interface RecoveryOptions extends InitiateRecoveryOptions {
  rootAddress: string;
}

export interface RecoveryTransaction {
  tx: string;
  recoveryAmount: number;
  backupKey?: string;
  coin?: string;
}

export interface VerifiedTransactionParameters {
  txHex: string;
  addressVersion: number;
  keys: string[];
  sk: string;
  isHalfSigned: boolean;
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
    return [0, 1, 2];
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * - userKey: [encrypted] Algo private key
   * - backupKey: [encrypted] Algo private key, or public key if the private key is held by a KRS provider
   * - walletPassphrase: necessary if one of the private keys is encrypted
   * - bitgoKey : bitgo xpub of the wallet to recover funds from
   * - krsProvider: necessary if backup key is held by KRS
   * - recoveryDestination: target address to send recovered funds to
   * @param callback
   */
  recover(params: RecoveryOptions, callback: NodeCallback<RecoveryTransaction>): Bluebird<RecoveryTransaction> {
    return co(function*() {
      // const userPrv = this.bitgo.decrypt({ input: params.userKey, passphrase: params.walletPassphrase });
      // const backupPrv = this.bitgo.decrypt({ input: params.backupKey, passphrase: params.walletPassphrase });
      // const bitgoPub = params.bitgoKey;

      // const walletAddress = ''; // GET WALLET ADDRESS FROM  userPrv, backupPrv, and bitgoPub

      // const walletInfoUrl = `algoexplorerhere.io/address/${walletAddress}`; // create the url for getting a wallet's info from a public block explorer

      // // get wallet info from algorand public block explorer
      // let walletInfo;
      // try {
      //   walletInfo = yield request.get(walletInfoUrl).result();
      // } catch (e) {
      //   throw new Error('Unable to reach the Stellar network via Horizon.');
      // }

      // const balance = 100; // get balance from walletInfo
      // const txfee = 1; // set transaction fee here

      // const algoTx = {}; // construct an algo tx that spends balance to params.recoveryDestination

      // algoTx.sign(userPrv);

      // algoTx.sign(backupPrv);

      // // build algoTx (merge signatures or whatever)

      return {
        // tx: algoTx.serialized() // serialize it (this is a hex string for other coins)
      };

      // todo: once this flow is completed, we can add the KRS recovery case (where backup key is a pub instead of encrypted prv)
      // todo: handle unencrypted private keys for userKey and backupKey (handle after we get the main case working)
    })
      .call(this)
      .asCallback(callback);
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
    const fee = { fee: tx.fee };

    const outputAmount = tx.amount || 0;
    var outputs = [];
    if (tx.to) {
      outputs.push({
        amount: outputAmount,
        address: Address.encode(new Uint8Array(tx.to.publicKey)),
      });
    }

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
      memo,
    };
  }

  isStellarSeed(seed: string): boolean {
    return stellar.StrKey.isValidEd25519SecretSeed(seed);
  }

  convertFromStellarSeed(seed: string): string {
    // assume this is a trust custodial seed if its a valid ed25519 prv
    if (!this.isStellarSeed(seed)) {
      return null;
    }
    return Seed.encode(stellar.StrKey.decodeEd25519SecretSeed(seed));
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;
    const addressVersion = params.txPrebuild.addressVersion;
    let isHalfSigned = false;

    // it's possible this tx was already signed - take the halfSigned
    // txHex if it is
    let txHex = params.txPrebuild.txHex;
    if (params.txPrebuild.halfSigned) {
      isHalfSigned = true;
      txHex = params.txPrebuild.halfSigned.txHex;
    }

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

    if (
      !_.has(params.txPrebuild, 'keys[0]') ||
      !_.has(params.txPrebuild, 'keys[1]') ||
      !_.has(params.txPrebuild, 'keys[2]')
    ) {
      throw new Error('missing public keys parameter to sign transaction');
    }

    if (!_.isNumber(addressVersion)) {
      throw new Error('missing addressVersion parameter to sign transaction');
    }

    // we need to re-encode our public keys using algosdk's format
    const keys = [params.txPrebuild.keys[0], params.txPrebuild.keys[1], params.txPrebuild.keys[2]];

    // re-encode sk from our prv (this acts as a seed out of the keychain)
    const seed = Seed.decode(prv).seed;
    const pair = generateAccountFromSeed(seed);
    const sk = pair.sk;

    return { txHex, addressVersion, keys, sk, isHalfSigned };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   */
  signTransaction(params: SignTransactionOptions): HalfSignedTransaction | FullySignedTransaction {
    const { txHex, addressVersion, keys, sk, isHalfSigned } = this.verifySignTransactionParams(params);
    const encodedPublicKeys = _.map(keys, k => Address.decode(k).publicKey);

    // decode our unsigned/half-signed tx
    let transaction;
    let txToHex;
    try {
      txToHex = Buffer.from(txHex, 'base64');
      const initialDecodedTx = Encoding.decode(txToHex);

      // we need to scrub the txn of sigs for half-signed
      const decodedTx = isHalfSigned ? initialDecodedTx.txn : initialDecodedTx;

      transaction = Multisig.MultiSigTransaction.from_obj_for_encoding(decodedTx);
    } catch (e) {
      throw new Error('transaction needs to be a valid tx encoded as base64 string');
    }

    // sign our tx
    let signed = transaction.partialSignTxn({ version: addressVersion, threshold: 2, pks: encodedPublicKeys }, sk);

    // if we have already signed it, we'll have to merge that with our previous tx
    if (isHalfSigned) {
      signed = mergeMultisigTransactions([Buffer.from(signed), txToHex]);
    }

    const signedBase64 = Buffer.from(signed).toString('base64');

    if (isHalfSigned) {
      return { txHex: signedBase64 };
    } else {
      return { halfSigned: { txHex: signedBase64 } };
    }
  }
}
