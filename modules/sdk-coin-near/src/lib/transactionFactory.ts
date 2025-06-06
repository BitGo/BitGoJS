import * as nearAPI from 'near-api-js';
import { functionCall, transfer } from 'near-api-js/lib/transaction';

import { DelegateAction, SignedDelegate, SignedTransaction, Action as TxAction } from '@near-js/transactions';
import { Transaction as UnsignedTransaction } from '@near-js/transactions/lib/esm/schema';

import { InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { HEX_REGEX } from './constants';
import { DelegateTransaction } from './delegateTransaction';
import { Transaction } from './transaction';

export class TransactionFactory {
  /**
   * Builds either near transaction or delegate transaction from raw txn data, throws error if data is invalid
   *
   * @param {String} rawTx the raw transaction data
   * @param {CoinConfig} config the coin config
   * @returns {Transaction|DelegateTransaction} returns a near transaction or near delegate transaction
   */
  static fromRawTransaction(rawTx: string, config: Readonly<CoinConfig>): Transaction | DelegateTransaction {
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
      return Transaction.fromSigned(config, signedTx);
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
        return Transaction.fromUnsigned(config, unsignedTx);
      } catch (e) {
        try {
          const signedDelegateAction = nearAPI.utils.serialize.deserialize(
            nearAPI.transactions.SCHEMA.SignedDelegate,
            bufferRawTransaction
          ) as SignedDelegate;
          return DelegateTransaction.fromSigned(config, signedDelegateAction);
        } catch (e) {
          try {
            const delegateAction = nearAPI.utils.serialize.deserialize(
              nearAPI.transactions.SCHEMA.DelegateAction,
              bufferRawTransaction
            ) as DelegateAction;
            return DelegateTransaction.fromUnsigned(config, delegateAction);
          } catch (e) {
            throw new InvalidTransactionError('unable to build transaction from raw');
          }
        }
      }
    }
  }
}
