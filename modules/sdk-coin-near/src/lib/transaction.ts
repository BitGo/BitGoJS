import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Action, Signature, TransactionExplanation, TxData } from './iface';
import { AdditionalAllowedMethods, FT_TRANSFER, HEX_REGEX, StakingContractMethodNames } from './constants';
import utils from './utils';
import { KeyPair } from './keyPair';
import * as nearAPI from 'near-api-js';
import base58 from 'bs58';
import { Action as TxAction, SignedTransaction, Transaction as UnsignedTransaction } from '@near-js/transactions';
import { functionCall, transfer } from 'near-api-js/lib/transaction';
import { sha256 } from 'js-sha256';
import { KeyType } from '@near-js/crypto';

export class Transaction extends BaseTransaction {
  private _nearTransaction: nearAPI.transactions.Transaction;
  private _nearSignedTransaction: nearAPI.transactions.SignedTransaction;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get nearTransaction(): nearAPI.transactions.Transaction {
    return this._nearTransaction;
  }

  set nearTransaction(tx: nearAPI.transactions.Transaction) {
    this._nearTransaction = tx;
    this._id = utils.base58Encode(this.getTransactionHash());
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
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const txSeralized = this._nearSignedTransaction
      ? Buffer.from(this._nearSignedTransaction.encode()).toString('base64')
      : Buffer.from(this._nearTransaction.encode()).toString('base64');
    return txSeralized;
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }

    let parsedAction: Action = {};
    const action = this._nearTransaction.actions[0];
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

    let signature: Signature | undefined;
    if (this._nearSignedTransaction?.signature?.ed25519Signature) {
      signature = {
        keyType: KeyType.ED25519,
        data: new Uint8Array(this._nearSignedTransaction.signature.ed25519Signature.data),
      };
    }
    let publicKey: string | undefined;
    if (this._nearTransaction.publicKey?.ed25519Key) {
      const rawBytes = new Uint8Array(this._nearTransaction.publicKey.ed25519Key.data);
      const encoded = nearAPI.utils.serialize.base_encode(rawBytes);
      publicKey = `ed25519:${encoded}`;
    }

    return {
      id: this._id,
      signerId: this._nearTransaction.signerId,
      publicKey: publicKey,
      nonce: this._nearTransaction.nonce,
      receiverId: this._nearTransaction.receiverId,
      actions: [parsedAction],
      signature: signature ? signature : undefined,
    };
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Sets this transaction payload
   *
   * @param rawTx
   */
  fromRawTransaction(rawTx: string): void {
    const bufferRawTransaction = HEX_REGEX.test(rawTx) ? Buffer.from(rawTx, 'hex') : Buffer.from(rawTx, 'base64');
    try {
      const signedTx = nearAPI.utils.serialize.deserialize(
        nearAPI.transactions.SCHEMA.SignedTransaction,
        bufferRawTransaction
      ) as SignedTransaction;
      signedTx.transaction.actions = signedTx.transaction.actions.map((a) => {
        const action = new TxAction(a);
        switch (action.enum) {
          case 'transfer': {
            if (action.transfer?.deposit) {
              return transfer(BigInt(action.transfer.deposit));
            }
            break;
          }
          case 'functionCall': {
            if (action.functionCall) {
              return functionCall(
                action.functionCall.methodName,
                new Uint8Array(action.functionCall.args),
                BigInt(action.functionCall.gas),
                BigInt(action.functionCall.deposit)
              );
            }
            break;
          }
          default: {
            return action;
          }
        }
        return action;
      });
      this._nearSignedTransaction = signedTx;
      this._nearTransaction = signedTx.transaction;
      this._id = utils.base58Encode(this.getTransactionHash());
    } catch (e) {
      try {
        const unsignedTx = nearAPI.utils.serialize.deserialize(
          nearAPI.transactions.SCHEMA.Transaction,
          bufferRawTransaction
        ) as UnsignedTransaction;
        unsignedTx.actions = unsignedTx.actions.map((a) => {
          const action = new TxAction(a);
          switch (action.enum) {
            case 'transfer': {
              if (action.transfer?.deposit) {
                return transfer(BigInt(action.transfer.deposit));
              }
              break;
            }
            case 'functionCall': {
              if (action.functionCall) {
                return functionCall(
                  action.functionCall.methodName,
                  new Uint8Array(action.functionCall.args),
                  BigInt(action.functionCall.gas),
                  BigInt(action.functionCall.deposit)
                );
              }
              break;
            }
            default: {
              return action;
            }
          }
          return action;
        });
        this._nearTransaction = unsignedTx;
        this._id = utils.base58Encode(this.getTransactionHash());
      } catch (e) {
        throw new InvalidTransactionError('unable to build transaction from raw');
      }
    }

    this.loadInputsAndOutputs();
  }

  /**
   * Sign this transaction
   *
   * @param {KeyPair} signer key
   */

  sign(signer: KeyPair): void {
    if (!this._nearTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    const serializedTxHash = this.getTransactionHash();
    const signature = signer.signMessageinUint8Array(serializedTxHash);
    this._nearSignedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: this._nearTransaction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearTransaction.publicKey.keyType,
        data: signature,
      }),
    });
    this.loadInputsAndOutputs();
  }

  /**
   * set transaction type by staking contract method names.
   * @param methodName method name to match and set the transaction type
   */
  private setTypeByStakingMethod(methodName: string): void {
    switch (methodName) {
      case StakingContractMethodNames.DepositAndStake:
        this.setTransactionType(TransactionType.StakingActivate);
        break;
      case StakingContractMethodNames.Unstake:
        this.setTransactionType(TransactionType.StakingDeactivate);
        break;
      case StakingContractMethodNames.Withdraw:
        this.setTransactionType(TransactionType.StakingWithdraw);
        break;
      case FT_TRANSFER:
        this.setTransactionType(TransactionType.SendToken);
        break;
    }
  }

  /**
   * Check if method is allowed on Near account-lib implementation.
   * This method should check on all contracts added to Near.
   * @param methodName contract call method name to check if it's allowed.
   */
  private validateMethodAllowed(methodName: string): void {
    const allowedMethods = [...Object.values(StakingContractMethodNames), ...AdditionalAllowedMethods];
    if (!allowedMethods.includes(methodName)) {
      throw new InvalidTransactionError('unsupported function call in raw transaction');
    }
  }

  /**
   * Build input and output field for this transaction
   *
   */
  loadInputsAndOutputs(): void {
    if (this._nearTransaction.actions.length !== 1) {
      throw new InvalidTransactionError('too many actions in raw transaction');
    }

    const action = this._nearTransaction.actions[0];

    switch (action.enum) {
      case 'transfer':
        this.setTransactionType(TransactionType.Send);
        break;
      case 'functionCall':
        if (action.functionCall) {
          const methodName = action.functionCall.methodName;
          this.validateMethodAllowed(methodName);
          this.setTypeByStakingMethod(methodName);
        }
        break;
      default:
        throw new InvalidTransactionError('unsupported action in raw transaction');
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    switch (this.type) {
      case TransactionType.Send:
        if (action.transfer) {
          const amount = action.transfer.deposit.toString();
          inputs.push({
            address: this._nearTransaction.signerId,
            value: amount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: this._nearTransaction.receiverId,
            value: amount,
            coin: this._coinConfig.name,
          });
        }
        break;
      case TransactionType.StakingActivate:
        if (action.functionCall) {
          const stakingAmount = action.functionCall.deposit.toString();
          inputs.push({
            address: this._nearTransaction.signerId,
            value: stakingAmount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: this._nearTransaction.receiverId,
            value: stakingAmount,
            coin: this._coinConfig.name,
          });
        }
        break;
      case TransactionType.StakingWithdraw:
        if (action.functionCall) {
          const stakingWithdrawAmount = JSON.parse(Buffer.from(action.functionCall.args).toString()).amount;
          inputs.push({
            address: this._nearTransaction.receiverId,
            value: stakingWithdrawAmount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: this._nearTransaction.signerId,
            value: stakingWithdrawAmount,
            coin: this._coinConfig.name,
          });
        }
        break;
      case TransactionType.SendToken:
        if (action.functionCall) {
          const tokenTransferAmount = JSON.parse(Buffer.from(action.functionCall.args).toString()).amount;
          const receiverId = JSON.parse(Buffer.from(action.functionCall.args).toString()).receiver_id;
          inputs.push({
            address: receiverId,
            value: tokenTransferAmount,
            coin: this._coinConfig.name,
          });
          outputs.push({
            address: this._nearTransaction.signerId,
            value: tokenTransferAmount,
            coin: this._coinConfig.name,
          });
        }
        break;
    }
    this._outputs = outputs;
    this._inputs = inputs;
  }

  /**
   * Returns a complete explanation for a transfer transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    return {
      ...explanationResult,
      outputAmount: json.actions[0].transfer?.deposit.toString() || '',
      outputs: [
        {
          address: json.receiverId,
          amount: json.actions[0].transfer?.deposit.toString() || '',
        },
      ],
    };
  }

  /**
   * Returns a complete explanation for a staking activate transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainStakingActivateTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    return {
      ...explanationResult,
      outputAmount: json.actions[0].functionCall?.deposit.toString() || '',
      outputs: [
        {
          address: json.receiverId,
          amount: json.actions[0].functionCall?.deposit.toString() || '',
        },
      ],
    };
  }

  /**
   * Returns a complete explanation for a staking withdraw transaction
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainStakingWithdrawTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const amount = json.actions[0].functionCall?.args.amount as string;
    return {
      ...explanationResult,
      outputAmount: amount,
      outputs: [
        {
          address: json.signerId,
          amount: amount,
        },
      ],
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
      case TransactionType.Send:
        return this.explainTransferTransaction(result, explanationResult);
      case TransactionType.StakingActivate:
        return this.explainStakingActivateTransaction(result, explanationResult);
      case TransactionType.StakingDeactivate:
        return explanationResult;
      case TransactionType.StakingWithdraw:
        return this.explainStakingWithdrawTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  private getTransactionHash(): Uint8Array {
    const serializedTx = nearAPI.utils.serialize.serialize(
      nearAPI.transactions.SCHEMA.Transaction,
      this._nearTransaction
    );
    return new Uint8Array(sha256.array(serializedTx));
  }

  get signablePayload(): Buffer {
    if (!this._nearTransaction) {
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
    this._nearSignedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: this._nearTransaction,
      signature: new nearAPI.transactions.Signature({
        keyType: this._nearTransaction.publicKey.keyType,
        data: signature,
      }),
    });
    this.loadInputsAndOutputs();
  }
  /** @inheritdoc **/
  get signature(): string[] {
    const signatures: string[] = [];

    if (this._nearSignedTransaction && this._nearSignedTransaction.signature.ed25519Signature) {
      signatures.push(base58.encode(this._nearSignedTransaction.signature.ed25519Signature.data));
    }

    return signatures;
  }
}
