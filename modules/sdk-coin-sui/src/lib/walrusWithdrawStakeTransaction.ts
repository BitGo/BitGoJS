import { SuiTransaction, TransactionExplanation, TxData, WalrusWithdrawStakeProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import utils from './utils';
import {
  BaseKey,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { CallArg, normalizeSuiAddress } from './mystenlab/types';
import { builder, Inputs, TransactionBlockInput } from './mystenlab/builder';
import { AMOUNT_UNKNOWN_TEXT, SUI_ADDRESS_LENGTH } from './constants';
import { BCS } from '@mysten/bcs';
import { Buffer } from 'buffer';

export class WalrusWithdrawStakeTransaction extends Transaction<WalrusWithdrawStakeProgrammableTransaction> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<WalrusWithdrawStakeProgrammableTransaction> {
    return this._suiTransaction;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  canSign(key: BaseKey): boolean {
    return true;
  }

  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  toJson(): TxData {
    if (!this._suiTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }

    const tx = this._suiTransaction;
    return {
      id: this._id,
      sender: tx.sender,
      kind: { ProgrammableTransaction: tx.tx },
      gasData: tx.gasData,
      expiration: { None: null },
      inputObjects: [utils.getWalrusWithdrawStakeRequests(tx.tx).stakedWal],
    };
  }

  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = [
      'id',
      'outputs',
      'outputAmount',
      'changeOutputs',
      'changeAmount',
      'fee',
      'type',
      'module',
      'function',
      'validatorAddress',
    ];
    const outputs: TransactionRecipient[] = [];

    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.suiTransaction.gasData.budget.toString() },
      type: this.type,
    };

    switch (this.type) {
      case TransactionType.StakingDeactivate:
        return this.explainRequestWithdrawStakedWalTransaction(result, explanationResult);
      case TransactionType.StakingWithdraw:
        return this.explainWithdrawStakedWalTransaction(result, explanationResult);

      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  explainRequestWithdrawStakedWalTransaction(
    result: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    const outputs: TransactionRecipient[] = [
      {
        address: this.suiTransaction.sender,
        amount: AMOUNT_UNKNOWN_TEXT,
      },
    ];
    const outputAmount = AMOUNT_UNKNOWN_TEXT;
    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }

  explainWithdrawStakedWalTransaction(
    result: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    const outputs: TransactionRecipient[] = [
      {
        address: this.suiTransaction.sender,
        amount: AMOUNT_UNKNOWN_TEXT,
      },
    ];
    const outputAmount = AMOUNT_UNKNOWN_TEXT;
    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }

  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      this._suiTransaction = Transaction.deserializeSuiTransaction(
        rawTransaction
      ) as SuiTransaction<WalrusWithdrawStakeProgrammableTransaction>;
      this._type = utils.getTransactionType(this._suiTransaction.type);
      this._id = this._suiTransaction.id;
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  getTxData(): TxData {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('empty transaction');
    }
    const inputs: CallArg[] | TransactionBlockInput[] = this._suiTransaction.tx.inputs.map((input, index) => {
      if (input.hasOwnProperty('Object')) {
        return input;
      }
      if (input.hasOwnProperty('Pure')) {
        if (input.Pure.length === SUI_ADDRESS_LENGTH) {
          const address = normalizeSuiAddress(
            builder.de(BCS.ADDRESS, Buffer.from(input.Pure).toString('base64'), 'base64')
          );
          return Inputs.Pure(address, BCS.ADDRESS);
        } else {
          const amount = builder.de(BCS.U64, Buffer.from(input.Pure).toString('base64'), 'base64');
          return Inputs.Pure(amount, BCS.U64);
        }
      }
      if (input.kind === 'Input' && (input.value.hasOwnProperty('Object') || input.value.hasOwnProperty('Pure'))) {
        return input.value;
      }

      // what's left is the pure number or address string
      return Inputs.Pure(input.value, input.type === 'pure' ? BCS.U64 : BCS.ADDRESS);
    });

    const programmableTx = {
      inputs: inputs,
      transactions: this._suiTransaction.tx.transactions,
    } as WalrusWithdrawStakeProgrammableTransaction;

    return {
      sender: this._suiTransaction.sender,
      expiration: { None: null },
      gasData: this._suiTransaction.gasData,
      kind: {
        ProgrammableTransaction: programmableTx,
      },
    };
  }

  loadInputsAndOutputs(): void {
    if (!this._suiTransaction) {
      return;
    }

    const withdrawRequest = utils.getWalrusWithdrawStakeRequests(this._suiTransaction.tx);
    this._inputs = [
      {
        address: withdrawRequest.stakedWal.objectId,
        value: withdrawRequest.amount === undefined ? AMOUNT_UNKNOWN_TEXT : withdrawRequest.amount.toString(),
        coin: this._coinConfig.name,
      },
    ];
    this._outputs = [
      {
        address: this.suiTransaction.sender,
        value: withdrawRequest.amount === undefined ? AMOUNT_UNKNOWN_TEXT : withdrawRequest.amount.toString(),
        coin: this._coinConfig.name,
      },
    ];
  }
}
