import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BaseTransaction, Entry, SigningError, toHex, toUint8Array, TransactionType } from '@bitgo/sdk-core';
import { hash } from '@stablelib/sha384';
import BigNumber from 'bignumber.js';
import { Writer } from 'protobufjs';
import * as nacl from 'tweetnacl';
import * as Long from 'long';
import { proto } from '@hashgraph/proto';
import { TxData, Recipient } from './iface';
import { stringifyAccountId, stringifyTxTime, stringifyTokenId, getHederaTokenNameFromId } from './utils';
import { KeyPair } from './';
import { HederaTransactionTypes } from './constants';

export class Transaction extends BaseTransaction {
  private _hederaTx: proto.Transaction;
  private _txBody: proto.TransactionBody;
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getKeys(true);
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    const secretKey = toUint8Array(keys.prv + keys.pub);
    const signature = nacl.sign.detached(this._hederaTx.bodyBytes, secretKey);
    this.addSignature(toHex(signature), keyPair);
  }

  /**
   * Add a signature to this transaction
   *
   * @param {string} signature - The signature to add, in string hex format
   * @param {KeyPair} key - The key of the key that created the signature
   */
  addSignature(signature: string, key: KeyPair): void {
    const sigPair = new proto.SignaturePair();
    sigPair.pubKeyPrefix = toUint8Array(key.getKeys(true).pub);
    sigPair.ed25519 = toUint8Array(signature);

    const sigMap = this._hederaTx.sigMap || new proto.SignatureMap();
    sigMap.sigPair!.push(sigPair);
    this._hederaTx.sigMap = sigMap;
    this._signatures.push(signature);
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    const encoder = proto.Transaction;
    return toHex(this.encode(this._hederaTx, encoder));
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: Uint8Array | string): void {
    const buffer = typeof rawTransaction === 'string' ? toUint8Array(rawTransaction) : rawTransaction;
    this.bodyBytes(buffer);
    switch (this.txBody.data) {
      case HederaTransactionTypes.Transfer:
        this.setTransactionType(TransactionType.Send);
        break;
      case HederaTransactionTypes.CreateAccount:
        this.setTransactionType(TransactionType.WalletInitialization);
        break;
      case HederaTransactionTypes.TokenAssociateToAccount:
        this.setTransactionType(TransactionType.AssociatedTokenAccountInitialization);
        break;
    }
  }

  /** @inheritdoc */
  toJson(): TxData {
    const [acc, time] = this.getTxIdParts();
    const result: TxData = {
      id: acc + '@' + time,
      hash: this.getTxHash(), // TODO: Update once hedera-sdk release this functionality BGA-284
      data: toHex(this._hederaTx.bodyBytes),
      fee: new BigNumber(this._txBody.transactionFee!.toString()).toNumber(),
      from: acc,
      startTime: time,
      validDuration: this._txBody.transactionValidDuration!.seconds!.toString(),
      node: stringifyAccountId(this._txBody.nodeAccountID!),
      memo: this._txBody.memo,
    };

    switch (this._txBody.data) {
      case HederaTransactionTypes.Transfer:
        result.instructionsData = {
          type: HederaTransactionTypes.Transfer,
          params: this.getTransferData(),
        };
        result.to = result.instructionsData.params.recipients[0].address;
        result.amount = result.instructionsData.params.recipients[0].amount;
        break;
      case HederaTransactionTypes.TokenAssociateToAccount:
        result.instructionsData = {
          type: HederaTransactionTypes.TokenAssociateToAccount,
          params: this.getAccountAssociateData(),
        };
        break;
    }

    return result;
  }

  /**
   * Get the recipient account and the amount
   * transferred on this transaction
   *
   * @returns { tokenName, Recipient[]} is object consisting of tokenName if it's a token transfer and recipients consisting
   *  the recipient address, the transfer amount, and the token name for token transfer
   */
  private getTransferData(): { tokenName?: string; recipients: Recipient[] } {
    const [acc] = this.getTxIdParts();
    const transferData: Recipient[] = [];
    const tokenTransfers: proto.ITokenTransferList[] = this._txBody.cryptoTransfer?.tokenTransfers || [];
    const transfers: proto.IAccountAmount[] =
      tokenTransfers[0]?.transfers || this._txBody.cryptoTransfer?.transfers?.accountAmounts || [];
    const tokenName = tokenTransfers.length
      ? getHederaTokenNameFromId(stringifyTokenId(tokenTransfers[0].token!))?.name
      : undefined;

    transfers.forEach((transfer) => {
      const amount = Long.fromValue(transfer.amount!);
      if (amount.isPositive() && stringifyAccountId(transfer.accountID!) !== acc) {
        transferData.push({
          address: stringifyAccountId(transfer.accountID!),
          amount: amount.toString(),
          ...(tokenTransfers.length && {
            tokenName: tokenName,
          }),
        });
      }
    });

    return {
      ...(tokenTransfers.length && {
        tokenName: tokenName,
      }),
      recipients: transferData,
    };
  }

  /**
   * Get the recipient account and the amount
   * transferred on this transaction
   *
   * @returns { accountId: string; tokenNames[]} is an object consisting of accountId for the token owner
   *  and list of tokenNames that will be enabled
   */
  private getAccountAssociateData(): { accountId: string; tokenNames: string[] } {
    const tokens: proto.ITokenID[] = this._txBody.tokenAssociate!.tokens || [];
    return {
      accountId: stringifyAccountId(this._txBody.tokenAssociate!.account!),
      tokenNames: tokens.map((token: proto.ITokenID) => getHederaTokenNameFromId(stringifyTokenId(token))!.name),
    };
  }

  // region getters & setters
  get txBody(): proto.TransactionBody {
    return this._txBody;
  }

  get hederaTx(): proto.Transaction {
    return this._hederaTx;
  }

  /**
   * Sets this transaction body components
   *
   * @param {proto.Transaction} tx - Body Transaction
   */
  body(tx: proto.Transaction): void {
    this._txBody = proto.TransactionBody.decode(tx.bodyBytes);
    this._hederaTx = tx;
    this.loadInputsAndOutputs();
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType - The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Decode previous signatures from the inner hedera transaction
   * and save them into the base transaction signature list.
   */
  loadPreviousSignatures(): void {
    if (this._hederaTx.sigMap && this._hederaTx.sigMap.sigPair) {
      const sigPairs = this._hederaTx.sigMap.sigPair;
      sigPairs.forEach((sigPair) => {
        const signature = sigPair.ed25519;
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
    const instruction = txJson.instructionsData;
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];

    switch (instruction?.type) {
      case HederaTransactionTypes.Transfer:
        let totalAmount = new BigNumber(0);
        instruction.params.recipients.forEach((recipient) => {
          totalAmount = totalAmount.plus(recipient.amount);
          outputs.push({
            address: recipient.address,
            value: recipient.amount,
            coin: recipient.tokenName || this._coinConfig.name,
          });
        });
        inputs.push({
          address: txJson.from,
          value: totalAmount.toString(),
          coin: instruction.params.tokenName || this._coinConfig.name,
        });
        break;

      case HederaTransactionTypes.TokenAssociateToAccount:
        instruction.params.tokenNames.forEach((tokenName) => {
          const tokenEntry: Entry = {
            address: instruction.params.accountId,
            value: '0',
            coin: tokenName,
          };
          inputs.push(tokenEntry);
          outputs.push(tokenEntry);
        });
        break;
    }
    this._inputs = inputs;
    this._outputs = outputs;
  }

  /**
   * Sets this transaction body components
   *
   * @param {Uint8Array} bytes - Encoded body transaction
   */
  bodyBytes(bytes: Uint8Array): void {
    this.body(proto.Transaction.decode(bytes));
  }
  // endregion

  // region helpers
  /**
   * Returns this hedera transaction id components in a readable format
   *
   * @returns {[string, string]} - Transaction id parts [<account id>, <startTime in seconds>]
   */
  getTxIdParts(): [string, string] {
    if (
      this._txBody &&
      this._txBody.transactionID &&
      this._txBody.transactionID.accountID &&
      this._txBody.transactionID.transactionValidStart
    ) {
      return [
        stringifyAccountId(this._txBody.transactionID.accountID),
        stringifyTxTime(this._txBody.transactionID.transactionValidStart),
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
    if (!this._txBody.nodeAccountID) {
      throw new Error('Missing transaction node id');
    }
    const _signedTx = new proto.SignedTransaction();
    _signedTx.sigMap = this._hederaTx.sigMap;
    _signedTx.bodyBytes = this._hederaTx.bodyBytes;

    const encoder = proto.SignedTransaction;
    return this.sha(this.encode(_signedTx, encoder));
  }

  /**
   * Encode an object using the given encoder class
   *
   * @param {proto} obj - The object to be encoded, must be in proto namespace
   * @param encoder - Object encoder
   * @returns {Uint8Array} - Encoded object byte array
   */
  private encode<CtorFn extends { new (): T }, T extends { constructor: CtorFn }>(
    obj: T,
    encoder: { encode(arg: T): Writer }
  ): Uint8Array {
    return encoder.encode(obj).finish();
  }

  /**
   * Returns a sha-384 hash
   *
   * @param {Uint8Array} bytes - Bytes to be hashed
   * @returns {string} - The resulting hash string
   */
  sha(bytes: Uint8Array): string {
    return toHex(hash(bytes));
  }
}
