import {
  addressToString,
  BufferReader,
  createStacksPrivateKey,
  createStacksPublicKey,
  createTransactionAuthField,
  deserializeTransaction,
  isSingleSig,
  MultiSigSpendingCondition,
  PayloadType,
  PubKeyEncoding,
  StacksMessageType,
  StacksTransaction,
  TransactionSigner,
} from '@stacks/transactions';
import { BaseCoin as CoinConfig, StacksNetwork } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  NotSupported,
  ParseTransactionError,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { SignatureData, StacksContractPayload, StacksTransactionPayload, TxData } from './iface';
import { functionArgsToSendParams, getTxSenderAddress, removeHexPrefix, stringifyCv, unpadMemo } from './utils';
import { KeyPair } from './keyPair';
import { ContractCallPayload } from '@stacks/transactions/dist/payload';
import BigNum from 'bn.js';

export class Transaction extends BaseTransaction {
  private _stxTransaction: StacksTransaction;
  protected _type: TransactionType;
  private _sigHash: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair[] | KeyPair, sigHash?: string): Promise<void> {
    const keyPairs = keyPair instanceof Array ? keyPair : [keyPair];
    const signer = new TransactionSigner(this._stxTransaction);
    signer.checkOversign = false;
    signer.sigHash = sigHash ?? this._sigHash ?? this._stxTransaction.verifyBegin();
    for (const kp of keyPairs) {
      const keys = kp.getKeys(kp.getCompressed());
      if (!keys.prv) {
        throw new SigningError('Missing private key');
      }
      const privKey = createStacksPrivateKey(keys.prv);
      signer.signOrigin(privKey);
      this._sigHash = signer.sigHash;
    }
  }

  async appendOrigin(pubKeyString: string[] | string): Promise<void> {
    const pubKeyStrings = pubKeyString instanceof Array ? pubKeyString : [pubKeyString];
    const signer: TransactionSigner = new TransactionSigner(this._stxTransaction);
    pubKeyStrings.forEach((pubKey) => {
      signer.appendOrigin(createStacksPublicKey(pubKey));
    });
  }

  async signWithSignatures(signature: SignatureData[] | SignatureData, isMultiSig: boolean): Promise<void> {
    if (!signature) {
      throw new SigningError('Missing signatures');
    }
    const signatures = signature instanceof Array ? signature : [signature];

    if (!isMultiSig) {
      this._stxTransaction = this._stxTransaction.createTxWithSignature(signatures[0].data);
    } else {
      const authFields = signatures.map((sig) => createTransactionAuthField(PubKeyEncoding.Compressed, sig));
      (this._stxTransaction.auth.spendingCondition as MultiSigSpendingCondition).fields = (
        this._stxTransaction.auth.spendingCondition as MultiSigSpendingCondition
      ).fields.concat(authFields);
    }
    if (signatures.length > 0) {
      this._sigHash = signatures[signatures.length - 1].sigHash;
    }
  }

  get signature(): string[] {
    if (this._stxTransaction && this._stxTransaction.auth.spendingCondition) {
      if (isSingleSig(this._stxTransaction.auth.spendingCondition)) {
        return [this._stxTransaction.auth.spendingCondition.signature.data];
      } else {
        const signatures: string[] = [];
        this._stxTransaction.auth.spendingCondition.fields.forEach((field) => {
          if (field.contents.type === StacksMessageType.MessageSignature) {
            signatures.push(field.contents.data);
          }
        });
        return signatures;
      }
    }
    return [];
  }

  /** @inheritdoc */
  toJson(): TxData {
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
        memo: unpadMemo(payload.memo.content),
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
        functionArgs: payload.functionArgs.map(stringifyCv),
      };
      return contractPayload;
    } else {
      throw new NotSupported('payload type not supported');
    }
  }

  /**
   * Return the length of a transaction.  This is needed to calculate
   * the transaction fee.
   *
   * @returns {number} size in bytes of the serialized transaction
   */
  transactionSize(): number {
    return this._stxTransaction.serialize().length;
  }

  toBroadcastFormat(): string {
    if (!this._stxTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    return this._stxTransaction.serialize().toString('hex');
  }

  get stxTransaction(): StacksTransaction {
    return this._stxTransaction;
  }

  set stxTransaction(t: StacksTransaction) {
    this._stxTransaction = t;
  }

  private getNonce(): number {
    if (this._stxTransaction.auth.spendingCondition) {
      return Number(this._stxTransaction.auth.spendingCondition.nonce);
    } else {
      throw new InvalidTransactionError('spending condition is null');
    }
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
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
    } else if (txJson.payload.payloadType === PayloadType.ContractCall) {
      if (txJson.payload.contractAddress === (this._coinConfig.network as StacksNetwork).sendmanymemoContractAddress) {
        const sendParams = functionArgsToSendParams((this.stxTransaction.payload as ContractCallPayload).functionArgs);
        const coin = this._coinConfig.name;
        const sum: BigNum = sendParams.reduce((current, next) => current.add(new BigNum(next.amount)), new BigNum(0));
        this._outputs = sendParams.map((sendParam) => ({ address: sendParam.address, value: sendParam.amount, coin }));
        this._inputs = [{ address: txJson.from, value: sum.toString(), coin }];
      } else {
        this._outputs = [
          {
            address: txJson.payload.contractAddress,
            value: '0',
            coin: this._coinConfig.name,
          },
        ];

        this._inputs = [
          {
            address: txJson.from,
            value: '0',
            coin: this._coinConfig.name,
          },
        ];
      }
    }
  }
}
