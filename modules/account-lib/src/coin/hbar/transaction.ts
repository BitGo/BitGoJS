import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import { Transaction as SDKTransaction } from '@hashgraph/sdk';
import { TransactionBody } from '@hashgraph/sdk/lib/generated/TransactionBody_pb';
import { SignatureMap, SignaturePair } from '@hashgraph/sdk/lib/generated/BasicTypes_pb';

import Long from 'long';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { stringifyAccountId, stringifyTxTime, toHex, toUint8Array } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  private _hederaTx: SDKTransaction;
  protected _type: TransactionType;

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
    this.replaceSignatures();
  }

  /**
   * Add a signature to this transaction
   *
   * @param {string} signature The signature to add, in string hex format
   * @param {KeyPair} key The key of the key that created the signature
   */
  addSignature(signature: string, key: KeyPair): void {
    const sigPair = new SignaturePair();
    sigPair.setPubkeyprefix(toUint8Array(key.getKeys(true).pub));
    sigPair.setEd25519(toUint8Array(signature));

    const sigMap = this.hederaTx._toProto().getSigmap() || new SignatureMap();

    const innerTx = this.hederaTx._toProto();
    sigMap.getSigpairList().push(sigPair);
    innerTx.setSigmap(sigMap);
    // The inner transaction must be replaced with the new signed transaction
    this.fromBytes(innerTx.serializeBinary());
    // Previous signatures are kept so we just add the new signature to the list
    this._signatures.push(signature);
  }

  /**
   * Replace transaction signatures with the ones from
   * the inner SDK transaction
   */
  private replaceSignatures(): void {
    this._signatures = this.hederaTx
      ._toProto()
      .getSigmap()!
      .getSigpairList()
      .map(sigPair => {
        return toHex(sigPair.getEd25519_asU8());
      });
  }

  /**
   * Get the inner transaction body deserialized in the SDK
   * proto default format
   *
   * @returns {TransactionBody} a transaction body object
   */
  txBody(): TransactionBody {
    return TransactionBody.deserializeBinary(this._hederaTx._toProto().getBodybytes_asU8());
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    return toHex(this.hederaTx.toBytes());
  }

  /** @inheritdoc */
  toJson(): TxData {
    const txData = this.hederaTx._toProto().toObject();
    const txBody = this.txBody().toObject();

    const acc = stringifyAccountId(txBody.transactionid!.accountid!);
    const time = stringifyTxTime(txBody.transactionid!.transactionvalidstart!);
    const result: TxData = {
      id: acc + '@' + time,
      hash: txData.sigmap ? toHex(this.hederaTx.hash()) : '', // Hash is returned if the transaction was signed
      data: toHex(this.hederaTx._toProto().getBodybytes_asU8()),
      fee: new BigNumber(txBody.transactionfee).toNumber(),
      from: acc,
      startTime: time,
      validDuration: txBody.transactionvalidduration!.seconds.toString(),
      node: stringifyAccountId(txBody.nodeaccountid!),
      memo: txBody.memo,
    };

    if (txBody.cryptotransfer) {
      txBody.cryptotransfer!.transfers!.accountamountsList.forEach(transfer => {
        if (Long.fromValue(transfer.amount).isPositive()) {
          result.amount = transfer.amount;
          result.to = stringifyAccountId(transfer.accountid!);
        }
      });
    }
    return result;
  }

  //region getters & setters

  get hederaTx(): SDKTransaction {
    return this._hederaTx;
  }

  /**
   * Set the inner SDK transaction
   *
   * @param {SDKTransaction} tx SDK transaction
   */
  innerTransaction(tx: SDKTransaction) {
    this._hederaTx = tx;
    this.loadInputsAndOutputs();
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Load the input and output data on this transaction using the transaction json
   * if there are outputs. For transactions without outputs (e.g. wallet initializations),
   * this function will not do anything
   */
  loadInputsAndOutputs(): void {
    const txJson = this.toJson();
    if (txJson.to && txJson.amount) {
      this._outputs = [{
        address: txJson.to,
        value: txJson.amount,
        coin: this._coinConfig.name,
      }];

      this._inputs = [{
        address: txJson.from,
        value: txJson.amount,
        coin: this._coinConfig.name,
      }];
    }
  }

  /**
   * Set the inner SDK transaction as bytes
   *
   * @param {Uint8Array} bytes encoded SDK transaction
   */
  fromBytes(bytes: Uint8Array) {
    this.innerTransaction(SDKTransaction.fromBytes(bytes));
  }
  //endregion
}
