import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import { Transaction as SDKTransaction } from '@hashgraph/sdk';
import { TransactionBody } from '@hashgraph/sdk/lib/generated/TransactionBody_pb';
import { SignatureMap, SignaturePair } from '@hashgraph/sdk/lib/generated/BasicTypes_pb';

import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { stringifyAccountId, stringifyTxTime, toHex, toUint8Array } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  private _hederaTx: SDKTransaction;
  private _txBody: TransactionBody;
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
   * @param signature The signature to add, in string hex format
   * @param key The key of the key that created the signature
   */
  addSignature(signature: string, key: KeyPair): void {
    const sigPair = new SignaturePair();
    sigPair.setPubkeyprefix(toUint8Array(key.getKeys(true).pub));
    sigPair.setEd25519(toUint8Array(signature));

    const sigMap = this._hederaTx._toProto().getSigmap() || new SignatureMap();

    sigMap.getSigpairList().push(sigPair);
    this._hederaTx._toProto().setSigmap(sigMap);
  }

  /**
   * Add a signature to this transaction
   */
  replaceSignatures(): void {
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
    return toHex(this.hederaTx.toBytes());
  }

  /** @inheritdoc */
  toJson(): TxData {
    const txData = this.hederaTx._toProto().toObject();
    const txBody = txData.body!;

    const acc = stringifyAccountId(txBody.transactionid!.accountid!);
    const time = stringifyTxTime(txBody.transactionid!.transactionvalidstart!);
    const result: TxData = {
      id: acc + '@' + time,
      hash: toHex(this.hederaTx.hash()),
      data: toHex(this.hederaTx._toProto().getBodybytes_asU8()),
      fee: new BigNumber(txBody.transactionfee).toNumber(),
      from: acc,
      startTime: time,
      validDuration: txBody.transactionvalidduration!.seconds.toString(),
      node: stringifyAccountId(txBody.nodeaccountid!),
      memo: txBody.memo,
    };

    if (this._txBody.hasCryptotransfer()) {
      const transfers = txBody.cryptotransfer!.transfers!.accountamountsList[0];
      result.amount = transfers.amount;
      result.to = stringifyAccountId(transfers.accountid!);
    }
    return result;
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
   * Sets this transaction body components
   *
   * @param {Uint8Array} bytes encoded body transaction
   */
  bodyBytes(bytes: Uint8Array) {
    this.body(SDKTransaction.fromBytes(bytes));
  }
  //endregion
}
