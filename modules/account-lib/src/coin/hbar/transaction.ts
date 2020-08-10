import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { hash } from '@stablelib/sha384';
import BigNumber from 'bignumber.js';
import { Writer } from 'protobufjs';
// import * as nacl from 'tweetnacl';
import { Transaction as SDKTransaction } from '@hashgraph/sdk';
import { TransactionBody } from '@hashgraph/sdk/lib/generated/TransactionBody_pb';
// import { SignatureMap, SignaturePair } from '@hashgraph/sdk/lib/generated/BasicTypes_pb';
import Long from 'long';
// import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { stringifyAccountId, stringifyTxTime, toHex } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  private _hederaTx: SDKTransaction;
  private _txBody: TransactionBody;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getSDKKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    this.hederaTx.sign(keys.prv);
    this._signatures = this.hederaTx
      ._toProto()
      .getSigmap()!
      .getSigpairList()
      .map(sigPair => {
        return toHex(sigPair.getEd25519_asU8());
      });
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    // return toHex(this.encode(this._hederaTx));
    return toHex(this.hederaTx.toBytes());
  }

  /** @inheritdoc */
  toJson(): TxData {
    const txData = this.hederaTx._toProto().toObject();
    const acc = stringifyAccountId(txData.body!.transactionid!.accountid!);
    const time = stringifyTxTime(txData.body!.transactionid!.transactionvalidstart!);
    const result: TxData = {
      id: acc + '@' + time,
      hash: toHex(this.hederaTx.hash()),
      data: toHex(this.hederaTx._toProto().getBodybytes_asU8()),
      fee: new BigNumber(txData.body!.transactionId!.transactionfee).toNumber(),
      from: acc,
      startTime: time,
      validDuration: txData.body!.transactionvalidduration!.seconds.toString(),
      node: stringifyAccountId(txData.body!.nodeaccountid!),
      memo: txData.body!.memo,
    };

    if (this._txBody.hasCryptotransfer()) {
      const transfers = txData.body!.cryptotransfer!.transfers.accountamountsList[0];
      result.amount = transfers.amount;
      result.to = stringifyAccountId(transfers.accountid!);
    }
    return result;
  }

  /**
   * Get the recipient account and the amount
   * transferred on this transaction
   *
   * @returns {[string, string]} first element is the recipient, second element is the amount
   */
  private getTransferData(): [string, string] {
    let transferData;
    this._txBody
      .getCryptotransfer()!
      .getTransfers()!
      .getAccountamountsList()
      .forEach(transfer => {
        const amount = Long.fromValue(transfer.getAmount());
        if (amount.isPositive()) {
          transferData = [stringifyAccountId(transfer.getAccountid()!), amount.toString()];
        }
      });

    return transferData;
  }

  //region getters & setters
  get txBody(): TransactionBody {
    return this._txBody;
  }

  get hederaTx(): SDKTransaction {
    return this._hederaTx;
  }

  /**
   * Sets this transaction body components
   *
   * @param {SDKTransaction} tx body transaction
   */
  body(tx: SDKTransaction) {
    // this._txBody = TransactionBody.deserializeBinary(tx._toProto().getBodybytes_asU8());
    this._txBody = tx._toProto().getBody()!;
    this._hederaTx = tx;
    // this.loadPreviousSignatures();
  }

  /**
   * Decode previous signatures from the inner hedera transaction
   * and save them into the base transaction signature list.
   */
  loadPreviousSignatures(): void {
    if (
      this._hederaTx._toProto().getSigmap() &&
      this._hederaTx
        ._toProto()
        .getSigmap()!
        .getSigpairList()
    ) {
      const sigPairs = this._hederaTx
        ._toProto()
        .getSigmap()!
        .getSigpairList();
      sigPairs.forEach(sigPair => {
        // const signature = sigPair.ed25519;
        const signature = sigPair.getEd25519_asU8();
        if (signature) {
          this._signatures.push(toHex(signature));
        }
      });
    }
  }

  /**
   * Sets this transaction body components
   *
   * @param {Uint8Array} bytes encoded body transaction
   */
  bodyBytes(bytes: Uint8Array) {
    this.body(SDKTransaction.fromBytes(bytes));
  }
  //endregion

  //region helpers
  /**
   * Returns this hedera transaction id components in a readable format
   *
   * @returns {[string, string]} - transaction id parts [<account id>, <startTime in seconds>]
   */
  getTxIdParts(): [string, string] {
    if (
      this._txBody &&
      this._txBody.getTransactionid() &&
      this._txBody.getTransactionid()!.getAccountid() &&
      this._txBody.getTransactionid()!.getTransactionvalidstart()
    ) {
      return [
        stringifyAccountId(this._txBody.getTransactionid()!.getAccountid()!),
        stringifyTxTime(this._txBody.getTransactionid()!.getTransactionvalidstart()!),
      ];
    }
    throw new Error('Missing transaction id information');
  }

  /**
   * Returns this transaction hash
   *
   * @returns {string} - The transaction hash
   */
  getTxHash(): string {
    if (!this._txBody.getNodeaccountid()) {
      throw new Error('Missing transaction node id');
    }
    return this.getHashOf(this._hederaTx);
  }

  /**
   * Returns an sha-384 hash
   *
   * @param {Uint8Array} bytes - bytes to be hashed
   * @returns {string} - the resulting hash string
   */
  sha(bytes: Uint8Array): string {
    return toHex(hash(bytes));
  }

  /**
   * Returns a hash of the given proto object.
   *
   * @param obj - The object to be hashed, it must be an proto namespace object
   * @returns {string} - the resulting hash string
   */
  private getHashOf<T>(obj: T): string {
    return this.sha(this.encode(obj));
  }
  //endregion
}
