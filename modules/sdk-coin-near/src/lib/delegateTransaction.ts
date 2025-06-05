import { Buffer } from 'buffer';
import base58 from 'bs58';
import { sha256 } from 'js-sha256';
import * as nearAPI from 'near-api-js';

import {
  Action as NearAction,
  DelegateAction,
  encodeDelegateAction,
  encodeSignedDelegate,
  SignedDelegate,
} from '@near-js/transactions';
import { KeyType } from '@near-js/crypto';

import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  ITransactionRecipient,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { Action, Signature, TransactionExplanation, TxData } from './iface';
import { AdditionalAllowedMethods } from './constants';
import utils from './utils';
import { KeyPair } from './keyPair';

export class DelegateTransaction extends BaseTransaction {
  private _nearDelegateAction: DelegateAction;
  private _nearSignedDelegateAction: SignedDelegate;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get nearTransaction(): DelegateAction {
    return this._nearDelegateAction;
  }

  set nearTransaction(tx: DelegateAction) {
    this._nearDelegateAction = tx;
    this._id = utils.base58Encode(this.getTransactionHash());
  }

  /**
   * Initiates the delegate transaction from signed delegate object
   * @param {CoinConfig} coinConfig the coin config
   * @param {SignedDelegate} signedDelegate the signed delegate object
   * @returns {DelegateTransaction} tx the delegate transaction
   */
  static fromSigned(coinConfig: Readonly<CoinConfig>, signedDelegate: SignedDelegate): DelegateTransaction {
    const tx = new DelegateTransaction(coinConfig);
    tx.initFromSigned(signedDelegate);
    return tx;
  }

  /**
   * Initiates the delegate transaction from unsigned delegate action
   * @param {CoinConfig} coinConfig the coin config
   * @param {DelegateAction} delegateAction the unsigned delegate action
   * @returns {DelegateTransaction} tx the delegate transaction
   */
  static fromUnsigned(coinConfig: Readonly<CoinConfig>, delegateAction: DelegateAction): DelegateTransaction {
    const tx = new DelegateTransaction(coinConfig);
    tx.initFromUnsigned(delegateAction);
    return tx;
  }

  /**
   * Assigns the signed delegate to class variables
   *
   * @param {SignedDelegate} signedDelegate the signed delegate object
   * @returns {void}
   */
  private initFromSigned(signedDelegate: SignedDelegate): void {
    this._nearSignedDelegateAction = signedDelegate;
    this._nearDelegateAction = signedDelegate.delegateAction;
    this._id = utils.base58Encode(this.getTransactionHash());
    this.loadInputsAndOutputs();
  }

  /**
   * Assigns the delegate action to class variables
   *
   * @param {DelegateAction} delegateAction the unsigned delegate action
   * @returns {void}
   */
  private initFromUnsigned(delegateAction: DelegateAction): void {
    this._nearDelegateAction = delegateAction;
    this._id = utils.base58Encode(this.getTransactionHash());
    this.loadInputsAndOutputs();
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    try {
      new KeyPair({ prv: key.key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._nearDelegateAction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return this._nearSignedDelegateAction
      ? Buffer.from(encodeSignedDelegate(this._nearSignedDelegateAction)).toString('base64')
      : Buffer.from(encodeDelegateAction(this._nearDelegateAction)).toString('base64');
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._nearDelegateAction) {
      throw new InvalidTransactionError('Empty delegation data');
    }

    const parsedActions: Action[] = [];
    const actions = this._nearDelegateAction.actions;
    actions.map((action) => {
      let parsedAction: Action = {};
      if (action.enum === 'transfer' && action.transfer) {
        parsedAction = { transfer: action.transfer };
      } else if (action.enum === 'functionCall' && action.functionCall) {
        const functionCall = action.functionCall;
        parsedAction = {
          functionCall: {
            methodName: functionCall.methodName,
            args: JSON.parse(Buffer.from(functionCall.args).toString()),
            gas: functionCall.gas.toString(),
            deposit: functionCall.deposit.toString(),
          },
        };
      }
      parsedActions.push(parsedAction);
    });
    let signature: Signature | undefined;
    if (this._nearSignedDelegateAction?.signature?.ed25519Signature) {
      signature = {
        keyType: KeyType.ED25519,
        data: new Uint8Array(this._nearSignedDelegateAction.signature.ed25519Signature.data),
      };
    }
    let publicKey: string | undefined;
    if (this._nearDelegateAction.publicKey?.ed25519Key) {
      const rawBytes = new Uint8Array(this._nearDelegateAction.publicKey.ed25519Key.data);
      const encoded = nearAPI.utils.serialize.base_encode(rawBytes);
      publicKey = `ed25519Key.${encoded}`;
    }

    return {
      id: this._id,
      signerId: this._nearDelegateAction.senderId,
      publicKey: publicKey,
      nonce: this._nearDelegateAction.nonce,
      receiverId: this._nearDelegateAction.receiverId,
      actions: parsedActions,
      signature: signature ? signature : undefined,
    };
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   * @returns {void}
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Sign this transaction
   *
   * @param {KeyPair} signer key
   * @returns {void}
   */
  sign(signer: KeyPair): void {
    if (!this._nearDelegateAction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    const serializedTxHash = this.getTransactionHash();
    const signature = signer.signMessageinUint8Array(serializedTxHash);
    this._nearSignedDelegateAction = new SignedDelegate({
      delegateAction: this._nearDelegateAction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearDelegateAction.publicKey.keyType,
        data: signature,
      }),
    });
    this.loadInputsAndOutputs();
  }

  /**
   * Check if method name allowed for delegate transaction call
   *
   * @param {String} methodName method name of delegate action
   * @returns {Boolean} true if method name is allowed
   */
  private isAllowedMethod(methodName: string): boolean {
    return AdditionalAllowedMethods.includes(methodName);
  }

  /**
   * Check if action is valid for delegate transaction
   *
   * @param {Array<NearAction>} actions the list of near actions
   * @returns {Boolean} true if actions is valid for delegate transaction
   */
  private isValidActions(actions: Array<NearAction>): boolean {
    return actions.every((action) => {
      if (!action.functionCall) return false;

      const methodName = action.functionCall.methodName;
      return this.isAllowedMethod(methodName);
    });
  }

  /**
   * Checks if fungible token transfer action present in list of actions
   *
   * @param {Array<NearAction>} actions the list of near actions
   * @returns {Boolean} true if at least one action is ft transfer action
   */
  private isTokenTransferActionPresent(actions: Array<NearAction>): boolean {
    return actions.some((action) => action.functionCall?.methodName === 'ft_transfer');
  }

  /**
   * Checks if all actions are storage deposit actions
   *
   * @param {Array<NearAction>} actions the list of near actions
   * @returns {Boolean} true if all actions are storage deposit
   */
  private isAllActionsAreStorageDeposit(actions: Array<NearAction>): boolean {
    return actions.every((action) => action.functionCall?.methodName === 'storage_deposit');
  }

  /**
   * Load input and output field for this transaction
   * In delegate we only support functionCall action (ft_transfer and/or storage_deposit) and
   * batching of multiple ft_transfers or ft_transfer with storage_deposit
   *
   * @returns {void}
   */
  loadInputsAndOutputs(): void {
    const actions = this._nearDelegateAction.actions;
    if (!this.isValidActions(actions)) {
      throw new InvalidTransactionError('unsupported action(s) in raw transaction');
    }

    if (this.isTokenTransferActionPresent(actions)) {
      this.setTransactionType(TransactionType.SendToken);
    } else if (this.isAllActionsAreStorageDeposit(actions)) {
      this.setTransactionType(TransactionType.StorageDeposit);
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];

    actions.map((action) => {
      switch (this.type) {
        case TransactionType.SendToken: {
          if (action.functionCall) {
            if (action.functionCall.methodName === 'ft_transfer') {
              const parsedArgs = JSON.parse(Buffer.from(action.functionCall.args).toString());
              inputs.push({
                address: parsedArgs.receiver_id,
                value: parsedArgs.amount,
                coin: this._coinConfig.name,
              });
              outputs.push({
                address: this._nearDelegateAction.senderId,
                value: parsedArgs.amount,
                coin: this._coinConfig.name,
              });
            }
            if (action.functionCall.methodName === 'storage_deposit') {
              const parsedArgs = JSON.parse(Buffer.from(action.functionCall.args).toString());
              const receiverId = parsedArgs.account_id ? parsedArgs.account_id : this._nearDelegateAction.senderId;
              inputs.push({
                address: receiverId,
                value: action.functionCall.deposit.toString(),
                coin: this._coinConfig.family,
              });
              outputs.push({
                address: this._nearDelegateAction.senderId,
                value: action.functionCall.deposit.toString(),
                coin: this._coinConfig.family,
              });
            }
          }
          break;
        }
        case TransactionType.StorageDeposit: {
          if (action.functionCall) {
            const parsedArgs = JSON.parse(Buffer.from(action.functionCall.args).toString());
            const receiverId = parsedArgs.account_id ? parsedArgs.account_id : this._nearDelegateAction.senderId;
            inputs.push({
              address: receiverId,
              value: action.functionCall.deposit.toString(),
              coin: this._coinConfig.family,
            });
            outputs.push({
              address: this._nearDelegateAction.senderId,
              value: action.functionCall.deposit.toString(),
              coin: this._coinConfig.family,
            });
          }
          break;
        }
        default:
          break;
      }
    });
    this._outputs = outputs;
    this._inputs = inputs;
  }

  /**
   * Calculates the total fungible token amount & total native near amount
   *
   * @param {Action[]} actions the list of delegate transaction actions
   * @returns {String} either native near amount or fungible token amount
   */
  calculateTotalOutputAmount(actions: Action[]): string {
    let hasFtTransfer = false;
    let hasStorageDeposit = false;

    let totalTokenAmount = BigInt(0);
    let totalNearDeposit = BigInt(0);

    for (const action of actions) {
      if (action.functionCall) {
        const functionCall = action.functionCall;
        const methodName = functionCall.methodName;
        const args = functionCall.args;
        const deposit = BigInt(functionCall.deposit);
        if (methodName === 'ft_transfer') {
          hasFtTransfer = true;
          const amountStr = args['amount'] as string;
          if (args.amount) {
            totalTokenAmount += BigInt(amountStr);
          }
        }
        if (methodName === 'storage_deposit') {
          hasStorageDeposit = true;
          totalNearDeposit += deposit;
        }
      }
    }
    if (hasFtTransfer && hasStorageDeposit) {
      return totalTokenAmount.toString();
    } else if (!hasFtTransfer && hasStorageDeposit) {
      return totalNearDeposit.toString();
    }
    return '';
  }

  /**
   * Returns a complete explanation for a token transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTokenTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const actions = json.actions;
    const outputAmount = this.calculateTotalOutputAmount(actions);
    const outputs: ITransactionRecipient[] = [];
    actions.map((action) => {
      if (action.functionCall) {
        const functionCall = action.functionCall;
        if (functionCall.methodName === 'ft_transfer') {
          const amountStr = functionCall.args['amount'] as string;
          outputs.push({
            address: json.receiverId,
            amount: amountStr,
          });
        }
      }
    });
    return {
      ...explanationResult,
      outputAmount: outputAmount,
      outputs: outputs,
    };
  }

  /**
   * Returns a complete explanation for a storage deposit transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainStorageDepositTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const actions = json.actions;
    const outputAmount = this.calculateTotalOutputAmount(actions);
    const outputs: ITransactionRecipient[] = [];
    actions.map((action) => {
      if (action.functionCall) {
        const functionCall = action.functionCall;
        if (functionCall.methodName === 'storage_deposit') {
          outputs.push({
            address: json.receiverId,
            amount: functionCall.deposit,
          });
        }
      }
    });
    return {
      ...explanationResult,
      outputAmount: outputAmount,
      outputs: outputs,
    };
  }

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];
    const outputs: TransactionRecipient[] = [];
    const explanationResult: TransactionExplanation = {
      // txhash used to identify the transactions
      id: result.id || '',
      displayOrder,
      outputAmount: '0',
      changeAmount: '0',
      changeOutputs: [],
      outputs,
      fee: { fee: '' },
      type: this.type,
    };
    switch (this.type) {
      case TransactionType.SendToken:
        return this.explainTokenTransferTransaction(result, explanationResult);
      case TransactionType.StorageDeposit:
        return this.explainStorageDepositTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Get the serialized transaction hash
   *
   * @returns {Uint8Array} serialized hash in Uint8Array form
   */
  private getTransactionHash(): Uint8Array {
    const serializedTx = nearAPI.utils.serialize.serialize(
      nearAPI.transactions.SCHEMA.DelegateAction,
      this._nearDelegateAction
    );
    return new Uint8Array(sha256.array(serializedTx));
  }

  /**
   * Get the signable payload for the delegate action
   *
   * @returns {Buffer}
   */
  get signablePayload(): Buffer {
    if (!this._nearDelegateAction) {
      throw new InvalidTransactionError('empty transaction');
    }
    return Buffer.from(this.getTransactionHash());
  }

  /**
   * Constructs a signed payload using construct.signTx
   * This method will be called during the build step if a TSS signature
   * is added and will set the signTransaction which is the txHex that will be broadcasted
   * As well as add the signature used to sign to the signature array in hex format
   *
   * @param {Buffer} signature The signature to be added to a near transaction
   */
  constructSignedPayload(signature: Buffer): void {
    this._nearSignedDelegateAction = new SignedDelegate({
      delegateAction: this._nearDelegateAction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearDelegateAction.publicKey.keyType,
        data: signature,
      }),
    });
    this.loadInputsAndOutputs();
  }
  /** @inheritdoc **/
  get signature(): string[] {
    const signatures: string[] = [];

    if (this._nearSignedDelegateAction && this._nearSignedDelegateAction.signature.ed25519Signature) {
      signatures.push(base58.encode(this._nearSignedDelegateAction.signature.ed25519Signature.data));
    }

    return signatures;
  }
}
