import {
  BufferReader,
  PayloadType,
  StacksTransaction,
  TransactionSigner,
  createStacksPrivateKey,
  deserializeTransaction,
  addressToString,
  StacksMessageType,
  createStacksPublicKey,
  isSingleSig,
  TransactionAuthField,
  cvToString,
  getCVTypeString,
  MultiSigSpendingCondition,
  createTransactionAuthField,
  PubKeyEncoding,
} from '@stacks/transactions';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { SigningError, ParseTransactionError, InvalidTransactionError, NotSupported } from '../baseCoin/errors';
import { BaseKey } from '../baseCoin/iface';
import { BaseTransaction, Error, TransactionType } from '../baseCoin';
import { SignatureData, StacksContractPayload, StacksTransactionPayload, TxData } from './iface';
import { getTxSenderAddress, bufferToHexPrefixString, removeHexPrefix } from './utils';
import { KeyPair } from './keyPair';

export class Transaction extends BaseTransaction {
  private _stxTransaction: StacksTransaction;
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair[] | KeyPair): Promise<void> {
    const keyPairs = keyPair instanceof Array ? keyPair : [keyPair];
    const signer = new TransactionSigner(this._stxTransaction);
    for (const kp of keyPairs) {
      const keys = kp.getKeys(kp.getCompressed());
      if (!keys.prv) {
        throw new SigningError('Missing private key');
      }
      const privKey = createStacksPrivateKey(keys.prv);
      signer.signOrigin(privKey);
    }
  }

  async appendOrigin(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getKeys(keyPair.getCompressed());
    if (!keys.pub) {
      throw new SigningError('Missing public key');
    }
    const pubKey = createStacksPublicKey(keys.pub);
    const signer = new TransactionSigner(this._stxTransaction);
    signer.appendOrigin(pubKey);
  }

  async signWithSignatures(signature: SignatureData[], publicKey: string[]): Promise<void> {
    if (!signature) {
      throw new SigningError('Missing signatures');
    }
    if (signature.length === 1) this._stxTransaction = this._stxTransaction.createTxWithSignature(signature[0].data);
    else {
      const fields = [...signature, createStacksPublicKey(publicKey[signature.length])];
      (this._stxTransaction.auth.spendingCondition as MultiSigSpendingCondition).fields = fields.map(sig =>
        createTransactionAuthField(PubKeyEncoding.Compressed, sig),
      );
    }
  }

  get signature(): string[] {
    if (this._stxTransaction && this._stxTransaction.auth.spendingCondition) {
      if (isSingleSig(this._stxTransaction.auth.spendingCondition)) {
        return [this._stxTransaction.auth.spendingCondition.signature.data];
      } else {
        return this._stxTransaction.auth.spendingCondition.fields.map(this.getSignatureFromField);
      }
    }
    return [];
  }

  private getSignatureFromField(field: TransactionAuthField): string {
    switch (field.contents.type) {
      case StacksMessageType.PublicKey:
        return field.contents.data.toString('hex');
      case StacksMessageType.MessageSignature:
        return field.contents.data;
    }
  }

  /** @inheritdoc */
  toJson() {
    if (!this._stxTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    const result: TxData = {
      id: this._stxTransaction.txid(),
      fee: this._stxTransaction.auth.getFee().toString(10),
      from: getTxSenderAddress(this._stxTransaction),
      nonce: this.getNonce(),
      payload: this.getPayloadData(),
    };
    return result;
  }

  private getPayloadData(): StacksTransactionPayload | StacksContractPayload {
    if (this._stxTransaction.payload.payloadType === PayloadType.TokenTransfer) {
      const payload = this._stxTransaction.payload;
      const txPayload: StacksTransactionPayload = {
        payloadType: PayloadType.TokenTransfer,
        // result.payload.memo will be padded with \u0000 up to
        // MEMO_MAX_LENGTH_BYTES as defined in @stacks/transactions
        memo: payload.memo.content,
        to: addressToString({
          type: StacksMessageType.Address,
          version: payload.recipient.address.version,
          hash160: payload.recipient.address.hash160.toString(),
        }),
        amount: payload.amount.toString(),
      };
      return txPayload;
    } else if (this._stxTransaction.payload.payloadType === PayloadType.ContractCall) {
      const payload = this._stxTransaction.payload;
      const contractPayload: StacksContractPayload = {
        payloadType: PayloadType.ContractCall,
        contractAddress: addressToString(payload.contractAddress),
        contractName: payload.contractName.content,
        functionName: payload.functionName.content,
        functionArgs: payload.functionArgs.map(arg => {
          return {
            type: getCVTypeString(arg),
            value: cvToString(arg),
          };
        }),
      };
      return contractPayload;
    } else {
      throw new NotSupported('payload type not supported');
    }
  }

  toBroadcastFormat(): string {
    if (!this._stxTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    return bufferToHexPrefixString(this._stxTransaction.serialize());
  }

  get stxTransaction(): StacksTransaction {
    return this._stxTransaction;
  }

  set stxTransaction(t: StacksTransaction) {
    this._stxTransaction = t;
  }

  private getNonce(): number {
    if (this._stxTransaction.auth.spendingCondition) {
      return this._stxTransaction.auth.spendingCondition.nonce.toNumber();
    } else {
      throw new InvalidTransactionError('spending condition is null');
    }
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string) {
    const raw = removeHexPrefix(rawTransaction);
    try {
      this._stxTransaction = deserializeTransaction(BufferReader.fromBuffer(Buffer.from(raw, 'hex')));
    } catch (e) {
      throw new ParseTransactionError('Error parsing the raw transaction');
    }
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
   * if there are outputs.
   */
  loadInputsAndOutputs(): void {
    const txJson = this.toJson();
    if (txJson.payload.payloadType === PayloadType.TokenTransfer) {
      if (txJson.payload.to && txJson.payload.amount) {
        this._outputs = [
          {
            address: txJson.payload.to,
            value: txJson.payload.amount,
            coin: this._coinConfig.name,
          },
        ];

        this._inputs = [
          {
            address: txJson.from,
            value: txJson.payload.amount,
            coin: this._coinConfig.name,
          },
        ];
      }
    }
  }
}
