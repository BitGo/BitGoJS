import base58 from 'bs58';
import { sha256 } from 'js-sha256';
import * as nearAPI from 'near-api-js';
import { functionCall, transfer } from 'near-api-js/lib/transaction';
import { KeyType } from '@near-js/crypto';
import { Action as TxAction, SignedTransaction, Transaction as UnsignedTransaction } from '@near-js/transactions';

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

import {
  FT_TRANSFER,
  FUNGIBLE_TOKEN_RELATED_METHODS,
  HEX_REGEX,
  StakingContractMethodNames,
  STORAGE_DEPOSIT,
} from './constants';
import { Action, Signature, TransactionExplanation, TxData } from './iface';
import { KeyPair } from './keyPair';
import utils from './utils';

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

    const parsedActions: Action[] = [];
    const actions = this._nearTransaction.actions;
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
      actions: parsedActions,
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
  private setTypeByFunctionCall(methodName: string): void {
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
        this.setTransactionType(TransactionType.Send);
        break;
      case STORAGE_DEPOSIT:
        this.setTransactionType(TransactionType.StorageDeposit);
        break;
    }
  }

  /**
   * Check if method is allowed on Near account-lib implementation.
   * This method should check on all contracts added to Near.
   * @param methodName contract call method name to check if it's allowed.
   */
  private validateMethodAllowed(methodName: string): void {
    const allowedMethods = [...Object.values(StakingContractMethodNames), ...FUNGIBLE_TOKEN_RELATED_METHODS];
    if (!allowedMethods.includes(methodName)) {
      throw new InvalidTransactionError('unsupported function call in raw transaction');
    }
  }

  /**
   * Check if valid methods are present for batching of actions
   *
   * @param {TxAction[]} actions list of near transaction actions
   * @returns {void}
   */
  private validateBatchingMethods(actions: TxAction[]): void {
    actions.every((action) => {
      if (action.enum !== 'functionCall' || !action.functionCall) {
        throw new InvalidTransactionError('invalid action for batching');
      }
    });
    if (
      actions[0].functionCall?.methodName !== STORAGE_DEPOSIT ||
      actions[1].functionCall?.methodName !== FT_TRANSFER
    ) {
      throw new InvalidTransactionError('invalid action sequence: expected storage_deposit followed by ft_transfer');
    }
  }

  /**
   * Build input and output field for this transaction
   *
   */
  loadInputsAndOutputs(): void {
    if (!this._nearTransaction.actions || !this._nearTransaction.actions.length) {
      throw new InvalidTransactionError('no actions in raw transaction');
    }
    // TODO: modify this for send-many support
    // currently only storage deposit + ft transfer are allowed for batching
    if (this._nearTransaction.actions.length > 2) {
      throw new InvalidTransactionError('too many actions in raw transaction');
    }
    // check for correct sequence of actions
    if (this._nearTransaction.actions.length === 2) {
      this.validateBatchingMethods(this._nearTransaction.actions);
    }

    const action = this._nearTransaction.actions[0];
    const actions = this._nearTransaction.actions;

    switch (action.enum) {
      case 'transfer':
        this.setTransactionType(TransactionType.Send);
        break;
      case 'functionCall':
        if (action.functionCall) {
          const methodName = action.functionCall.methodName;
          this.validateMethodAllowed(methodName);
          this.setTypeByFunctionCall(methodName);
        }
        break;
      default:
        throw new InvalidTransactionError('unsupported action in raw transaction');
    }
    // if there are 2 actions, we know for sure that it is storage deposit + ft transfer
    if (actions.length === 2) {
      this.setTransactionType(TransactionType.Send);
    }

    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    actions.map((action) => {
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
          } else if (action.functionCall) {
            if (action.functionCall.methodName === 'ft_transfer') {
              const parsedArgs = JSON.parse(Buffer.from(action.functionCall.args).toString());
              inputs.push({
                address: this._nearTransaction.signerId,
                value: parsedArgs.amount,
                coin: this._coinConfig.name,
              });
              outputs.push({
                address: parsedArgs.receiver_id,
                value: parsedArgs.amount,
                coin: this._coinConfig.name,
              });
            }
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
        case TransactionType.StorageDeposit:
          break;
      }
    });
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
        if (methodName === FT_TRANSFER) {
          hasFtTransfer = true;
          const amountStr = args['amount'] as string;
          if (args.amount) {
            totalTokenAmount += BigInt(amountStr);
          }
        }
        if (methodName === STORAGE_DEPOSIT) {
          hasStorageDeposit = true;
          totalNearDeposit += deposit;
        }
      }
    }
    if (hasFtTransfer) {
      return totalTokenAmount.toString();
    } else if (hasStorageDeposit) {
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
        if (functionCall.methodName === FT_TRANSFER) {
          const amountStr = functionCall.args['amount'] as string;
          const receiverId = functionCall.args['receiver_id'] as string;
          // in ft transfer, the outer receiver id will be contract address of the token
          const tokenName = utils.findTokenNameFromContractAddress(json.receiverId);
          const output: ITransactionRecipient = {
            address: receiverId,
            amount: amountStr,
          };
          if (tokenName) {
            output.tokenName = tokenName;
          }
          outputs.push(output);
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
        if (functionCall.methodName === STORAGE_DEPOSIT) {
          const receiverId =
            functionCall.args && functionCall.args['account_id']
              ? (functionCall.args['account_id'] as string)
              : json.signerId;
          // in storage deposit, the outer receiver id will be contract address of the token
          const tokenName = utils.findTokenNameFromContractAddress(json.receiverId);
          const output: ITransactionRecipient = {
            address: receiverId,
            amount: functionCall.deposit,
          };
          if (tokenName) {
            output.tokenName = tokenName;
          }
          outputs.push(output);
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
      case TransactionType.Send:
        if (result.actions.length > 1 || result.actions[0].functionCall) {
          return this.explainTokenTransferTransaction(result, explanationResult);
        }
        return this.explainTransferTransaction(result, explanationResult);
      case TransactionType.StakingActivate:
        return this.explainStakingActivateTransaction(result, explanationResult);
      case TransactionType.StakingDeactivate:
        return explanationResult;
      case TransactionType.StakingWithdraw:
        return this.explainStakingWithdrawTransaction(result, explanationResult);
      case TransactionType.StorageDeposit:
        return this.explainStorageDepositTransaction(result, explanationResult);
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
