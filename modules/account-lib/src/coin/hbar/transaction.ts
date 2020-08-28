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

  /**
   * Public constructor.
   *
   * @param {Readonly<CoinConfig>} _coinConfig
   * @param {Uint8Array} bytes encoded SDK transaction
   */
  constructor(_coinConfig: Readonly<CoinConfig>, bytes?: Uint8Array) {
    super(_coinConfig);
    if (bytes) {
      this.innerTransaction(SDKTransaction.fromBytes(bytes));
    }
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    this._hederaTx.sign(keys.prv);
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
    sigPair.setPubkeyprefix(toUint8Array(key.getKeys().pub.toString(true)));
    sigPair.setEd25519(toUint8Array(signature));

    const sigMap = this._hederaTx._toProto().getSigmap() || new SignatureMap();

    this.checkDuplicatedSignature(sigMap, sigPair);
    sigMap.getSigpairList().push(sigPair);
    const innerTx = this._hederaTx._toProto();
    innerTx.setSigmap(sigMap);
    // The inner transaction must be replaced with the new signed transaction

    this.innerTransaction(SDKTransaction.fromBytes(innerTx.serializeBinary()));

    // Previous signatures are kept so we just add the new signature to the list
    this._signatures.push(signature);
  }

  /**
   * Check if the signature was already loaded to a signature map
   * with the same public key
   *
   * @param {SignatureMap} sigMap the current signature map
   * @param {SignaturePair} sigPair the signature pair to add
   */
  private checkDuplicatedSignature(sigMap: SignatureMap, sigPair: SignaturePair) {
    sigMap.getSigpairList().forEach(currentSigPair => {
      if (
        currentSigPair.getEd25519_asU8() === sigPair.getEd25519_asU8() &&
        currentSigPair.getPubkeyprefix_asU8() === sigPair.getPubkeyprefix_asU8()
      ) {
        throw new SigningError('Duplicated signature with the same public key');
      }
    });
  }

  /**
   * Replace transaction signatures with the ones from
   * the inner SDK transaction
   */
  private replaceSignatures(): void {
    this._signatures = this._hederaTx
      ._toProto()
      .getSigmap()!
      .getSigpairList()
      .map(sigPair => {
        return toHex(sigPair.getEd25519_asU8());
      });
  }

  /**
   * Retrieve the signatures from the inner transaction
   *
   * @returns {SignaturePair[]} A list of signature pairs
   */
  retrieveSignatures(): SignaturePair[] {
    return this._hederaTx && this._hederaTx._toProto().getSigmap()
      ? this._hederaTx
          ._toProto()!
          .getSigmap()!
          .getSigpairList()
      : [];
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
    return toHex(this._hederaTx.toBytes());
  }

  toJson(): TxData {
    const txData = JSON.parse(this._hederaTx.toString());
    if (txData.sigmap) {
      txData.hash = toHex(this._hederaTx.hash()); // Hash is returned if the transaction was signed
    }
    return txData;
  }

  //region getters & setters
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
    if (txJson.body!.cryptotransfer) {
      const accountAmountList = txJson.body!.cryptotransfer.transfers!.accountamountsList!;
      accountAmountList.forEach(accountAmount => {
        const account = stringifyAccountId(accountAmount.accountid!);
        const amount = accountAmount.amount;
        if (
          stringifyAccountId(accountAmount.accountid!) === stringifyAccountId(txJson.body!.transactionid!.accountid!)
        ) {
          this._inputs = [
            {
              address: account,
              value: Long.fromString(amount)
                .negate()
                .toString(),
              coin: this._coinConfig.name,
            },
          ];
        } else {
          this._outputs = [
            {
              address: account,
              value: amount,
              coin: this._coinConfig.name,
            },
          ];
        }
      });
    }
  }

  //endregion
}
