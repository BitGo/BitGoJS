/**
 * @prettier
 */
import * as Bluebird from 'bluebird';
import * as crypto from 'crypto';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
const co = Bluebird.coroutine;
import * as bitgoAccountLib from '@bitgo/account-lib';
import { HDNode, networks } from 'bitgo-utxo-lib';
import * as request from 'superagent';
import * as common from '../../common';

import {
  BaseCoin,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionFee,
  TransactionRecipient as Recipient,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionExplanation,
} from '../baseCoin';

import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';

export const MINIMUM_TRON_MSIG_TRANSACTION_FEE = 1e6;

export interface TronSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface TronTransactionExplanation extends TransactionExplanation {
  expiration: number;
  timestamp: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  feeInfo: TransactionFee;
}

export interface ExplainTransactionOptions {
  txHex?: string; // txHex is poorly named here; it is just a wrapped JSON object
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  feeInfo: TransactionFee;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C - this is bitgo's xpub and will be used to derive their root address
  recoveryDestination: string; // base58 address
  krsProvider?: string;
  walletPassphrase?: string;
}

export interface RecoveryTransaction {
  tx: TransactionPrebuild;
  recoveryAmount: number;
}

export enum NodeTypes {
  Full,
  Solidity,
}

/**
 * This structure is not a complete model of the AccountResponse from a node.
 */
export interface AccountResponse {
  address: string;
  balance: number;
  owner_permission: {
    keys: [bitgoAccountLib.Trx.Interface.PermissionKey];
  };
  active_permission: [{ keys: [bitgoAccountLib.Trx.Interface.PermissionKey] }];
}

export class Trx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  getBaseFactor() {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  static createInstance(bitgo: BitGo, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Trx(bitgo, staticsCoin);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return this.isValidHexAddress(address) || bitgoAccountLib.Trx.Utils.isBase58Address(address);
  }

  /**
   * Checks if this is a valid hex address
   * @param address hex address
   */
  isValidHexAddress(address: string): boolean {
    return address.length === 42 && /^(0x)?([0-9a-f]{2})+$/i.test(address);
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    // TODO: move this and address creation logic to account-lib
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256 bit chain code, both of which must be
      // random. 512 bits is therefore the maximum entropy and gives us maximum security against cracking.
      seed = crypto.randomBytes(512 / 8);
    }
    const hd = HDNode.fromSeedBuffer(seed);
    return {
      pub: hd.neutered().toBase58(),
      prv: hd.toBase58(),
    };
  }

  isValidXpub(xpub: string): boolean {
    try {
      return HDNode.fromBase58(xpub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  isValidPub(pub: string): boolean {
    if (this.isValidXpub(pub)) {
      // xpubs can be converted into regular pubs, so technically it is a valid pub
      return true;
    }
    return new RegExp('^04[a-zA-Z0-9]{128}$').test(pub);
  }

  parseTransaction(
    params: ParseTransactionOptions,
    callback?: NodeCallback<ParsedTransaction>
  ): Bluebird<ParsedTransaction> {
    return Bluebird.resolve({}).asCallback(callback);
  }

  verifyAddress(params: VerifyAddressOptions): boolean {
    return true;
  }

  verifyTransaction(params: VerifyTransactionOptions, callback?: NodeCallback<boolean>): Bluebird<boolean> {
    return Bluebird.resolve(true).asCallback(callback);
  }

  signTransaction(params: TronSignTransactionOptions): SignedTransaction {
    const coinName = this.getChain();
    const txBuilder = new bitgoAccountLib.TransactionBuilder({ coinName });
    txBuilder.from(params.txPrebuild.txHex);

    let key = params.prv;
    if (this.isValidXprv(params.prv)) {
      key = HDNode.fromBase58(params.prv)
        .getKey()
        .getPrivateKeyBuffer();
    }

    txBuilder.sign({ key });
    const transaction = txBuilder.build();
    const response = {
      txHex: JSON.stringify(transaction.toJson()),
    };
    if (transaction.toJson().signature.length >= 2) {
      return response;
    }
    // Half signed transaction
    return {
      halfSigned: response,
    };
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   *
   * @param prv - the prv to be checked
   */
  isValidXprv(prv: string): boolean {
    try {
      HDNode.fromBase58(prv);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Convert a message to string in hexadecimal format.
   *
   * @param message {Buffer|String} message to sign
   * @return the message as a hexadecimal string
   */
  toHexString(message: string | Buffer): string {
    if (typeof message === 'string') {
      return Buffer.from(message).toString('hex');
    } else if (Buffer.isBuffer(message)) {
      return message.toString('hex');
    } else {
      throw new Error('Invalid messaged passed to signMessage');
    }
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key: KeyPair, message: string | Buffer): Buffer {
    const toSign = this.toHexString(message);

    let prv = key.prv;
    if (this.isValidXprv(prv)) {
      prv = HDNode.fromBase58(prv)
        .getKey()
        .getPrivateKeyBuffer();
    }

    let sig = bitgoAccountLib.Trx.Utils.signString(toSign, prv, true);

    // remove the preceding 0x
    sig = sig.replace(/^0x/, '');

    return Buffer.from(sig, 'hex');
  }

  /**
   * Converts an xpub to a compressed pub
   * @param xpub
   */
  xpubToCompressedPub(xpub: string): string {
    if (!this.isValidXpub(xpub)) {
      throw new Error('invalid xpub');
    }

    const hdNode = HDNode.fromBase58(xpub, networks.bitcoin);
    return hdNode.keyPair.__Q.getEncoded(false).toString('hex');
  }

  compressedPubToHexAddress(pub: string): string {
    const byteArrayAddr = bitgoAccountLib.Trx.Utils.getByteArrayFromHexAddress(pub);
    const rawAddress = bitgoAccountLib.Trx.Utils.getRawAddressFromPubKey(byteArrayAddr);
    return bitgoAccountLib.Trx.Utils.getHexAddressFromByteArray(rawAddress);
  }

  xprvToCompressedPrv(xprv: string): string {
    if (!this.isValidXprv(xprv)) {
      throw new Error('invalid xprv');
    }

    const hdNode = HDNode.fromBase58(xprv, networks.bitcoin);
    return hdNode.keyPair.d.toBuffer(32).toString('hex');
  }

  /**
   * Make a query to Trongrid for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @param callback
   * @returns {Object} response from Trongrid
   */
  private recoveryPost(
    query: { path: string; jsonObj: any; node: NodeTypes },
    callback?: NodeCallback<any>
  ): Bluebird<any> {
    const self = this;
    return co(function*() {
      let nodeUri = '';
      switch (query.node) {
        case NodeTypes.Full:
          nodeUri = common.Environments[self.bitgo.getEnv()].tronNodes.full;
          break;
        case NodeTypes.Solidity:
          nodeUri = common.Environments[self.bitgo.getEnv()].tronNodes.solidity;
          break;
        default:
          throw new Error('node type not found');
      }

      const response = yield request
        .post(nodeUri + query.path)
        .type('json')
        .send(query.jsonObj);

      if (!response.ok) {
        throw new Error('could not reach Tron node');
      }

      // unfortunately, it doesn't look like most TRON nodes return valid json as body
      return JSON.parse(response.text);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Query our explorer for the balance of an address
   * @param address {String} the address encoded in hex
   * @param callback
   * @returns {BigNumber} address balance
   */
  private getAccountFromNode(address: string, callback?: NodeCallback<AccountResponse>): Bluebird<AccountResponse> {
    const self = this;
    return co<AccountResponse>(function*() {
      const result = yield self.recoveryPost({
        path: '/walletsolidity/getaccount',
        jsonObj: { address },
        node: NodeTypes.Solidity,
      });
      return result;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Retrieves our build transaction from a node.
   * @param toAddr hex-encoded address
   * @param fromAddr hex-encoded address
   * @param amount
   * @param callback
   */
  private getBuildTransaction(
    toAddr: string,
    fromAddr: string,
    amount: number,
    callback?: NodeCallback<bitgoAccountLib.Trx.Interface.TransactionReceipt>
  ): Bluebird<bitgoAccountLib.Trx.Interface.TransactionReceipt> {
    const self = this;
    return co<bitgoAccountLib.Trx.Interface.TransactionReceipt>(function*() {
      // our addresses should be base58, we'll have to encode to hex
      const result = yield self.recoveryPost({
        path: '/wallet/createtransaction',
        jsonObj: {
          to_address: toAddr,
          owner_address: fromAddr,
          amount,
        },
        node: NodeTypes.Full,
      });
      return result;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Throws an error if any keys in the ownerKeys collection don't match the keys array we pass
   * @param ownerKeys
   * @param keysToFind
   */
  checkPermissions(ownerKeys: { address: string; weight: number }[], keys: string[]) {
    keys = keys.map(k => k.toUpperCase());

    ownerKeys.map(key => {
      const hexKey = key.address.toUpperCase();
      if (!keys.includes(hexKey)) {
        throw new Error(`pub address ${hexKey} not found in account`);
      }

      if (key.weight !== 1) {
        throw new Error('owner permission is invalid for this structure');
      }
    });
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params
   * @param callback
   */
  recover(params: RecoveryOptions, callback?: NodeCallback<RecoveryTransaction>): Bluebird<RecoveryTransaction> {
    const self = this;
    return co<RecoveryTransaction>(function*() {
      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

      // get our user, backup keys
      const keys = yield self.initiateRecovery(params);

      // we need to decode our bitgoKey to a base58 address
      const bitgoHexAddr = self.compressedPubToHexAddress(self.xpubToCompressedPub(params.bitgoKey));
      const recoveryAddressHex = bitgoAccountLib.Trx.Utils.getHexAddressFromBase58Address(params.recoveryDestination);

      // call the node to get our account balance
      const account = yield self.getAccountFromNode(bitgoHexAddr);
      const recoveryAmount = account.balance;

      const userXPub = keys[0].neutered().toBase58();
      const userXPrv = keys[0].toBase58();
      const backupXPub = keys[1].neutered().toBase58();

      // construct the tx -
      // there's an assumption here being made about fees: for a wallet that hasn't been used in awhile, the implication is
      // it has maximum bandwidth. thus, a recovery should cost the minimum amount (1e6 sun or 1 Tron)
      if (MINIMUM_TRON_MSIG_TRANSACTION_FEE > recoveryAmount) {
        throw new Error('Amount of funds to recover wouldnt be able to fund a send');
      }
      const recoveryAmountMinusFees = recoveryAmount - MINIMUM_TRON_MSIG_TRANSACTION_FEE;
      const buildTx = yield self.getBuildTransaction(recoveryAddressHex, bitgoHexAddr, recoveryAmountMinusFees);

      const keyHexAddresses = [
        self.compressedPubToHexAddress(self.xpubToCompressedPub(userXPub)),
        self.compressedPubToHexAddress(self.xpubToCompressedPub(backupXPub)),
        bitgoHexAddr,
      ];

      // run checks to ensure this is a valid tx - permissions match our signer keys
      self.checkPermissions(account.owner_permission.keys, keyHexAddresses);
      self.checkPermissions(account.active_permission[0].keys, keyHexAddresses);

      // construct our tx
      const txBuilder = new bitgoAccountLib.TransactionBuilder({ coinName: this.getChain() });
      txBuilder.from(buildTx);

      // this tx should be enough to drop into a node
      if (isUnsignedSweep) {
        return {
          tx: txBuilder.build().toJson(),
          recoveryAmount: recoveryAmountMinusFees,
        };
      }

      const userPrv = self.xprvToCompressedPrv(userXPrv);

      txBuilder.sign({ key: userPrv });

      // krs recoveries don't get signed
      if (!isKrsRecovery) {
        const backupXPrv = keys[1].toBase58();
        const backupPrv = self.xprvToCompressedPrv(backupXPrv);

        txBuilder.sign({ key: backupPrv });
      }

      return {
        tx: txBuilder.build().toJson(),
        recoveryAmount: recoveryAmountMinusFees,
      };
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Explain a Tron transaction from txHex
   * @param params
   * @param callback
   */
  explainTransaction(
    params: ExplainTransactionOptions,
    callback?: NodeCallback<TronTransactionExplanation>
  ): Bluebird<TronTransactionExplanation> {
    return co<TronTransactionExplanation>(function*() {
      const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
      if (!txHex || !params.feeInfo) {
        throw new Error('missing explain tx parameters');
      }
      const coinName = this.getChain();
      const txBuilder = new bitgoAccountLib.TransactionBuilder({ coinName });
      txBuilder.from(txHex);
      const tx = txBuilder.build();
      const outputs = [
        {
          amount: tx.destinations[0].value.toString(),
          address: tx.destinations[0].address, // Should turn it into a readable format, aka base58
        },
      ];

      const displayOrder = [
        'id',
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'timestamp',
        'expiration',
      ];

      const explanationResult: TronTransactionExplanation = {
        displayOrder,
        id: tx.id,
        outputs,
        outputAmount: outputs[0].amount,
        changeOutputs: [], // account based does not use change outputs
        changeAmount: '0', // account base does not make change
        fee: params.feeInfo,
        timestamp: tx.validFrom,
        expiration: tx.validTo,
      };

      return explanationResult;
    })
      .call(this)
      .asCallback(callback);
  }
}
