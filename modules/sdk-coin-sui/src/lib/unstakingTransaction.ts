import {
  BaseKey,
  Entry,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { UnstakingProgrammableTransaction, SuiTransaction, TransactionExplanation, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';
import {
  builder,
  getIdFromCallArg,
  Inputs,
  MoveCallTransaction,
  ObjectCallArg,
  TransactionBlockInput,
} from './mystenlab/builder';
import { CallArg, normalizeSuiAddress, SuiObjectRef } from './mystenlab/types';
import { BCS } from '@mysten/bcs';
import { AMOUNT_UNKNOWN_TEXT, SUI_ADDRESS_LENGTH } from './constants';
import { UnstakingBuilder } from './unstakingBuilder';
import { assertEqualTransactionBlocks } from './compareTransactionBlocks';

export class UnstakingTransaction extends Transaction<UnstakingProgrammableTransaction> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<UnstakingProgrammableTransaction> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction<UnstakingProgrammableTransaction>): void {
    this._suiTransaction = tx;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
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
    };
  }

  /** @inheritDoc */
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
      case TransactionType.StakingClaim:
        return this.explainWithdrawStakedSuiTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  getEntriesForStakedSuiInput(
    stakedSuiInput: TransactionBlockInput,
    amount?: bigint
  ): { inputs: Entry[]; outputs: Entry[] } {
    const stakedSui = 'value' in stakedSuiInput ? stakedSuiInput.value : stakedSuiInput;
    return {
      inputs: [
        {
          address: normalizeSuiAddress(getIdFromCallArg(stakedSui)),
          value: amount === undefined ? AMOUNT_UNKNOWN_TEXT : amount.toString(),
          coin: this._coinConfig.name,
        },
      ],
      outputs: [
        {
          address: this.suiTransaction.sender,
          value: AMOUNT_UNKNOWN_TEXT,
          coin: this._coinConfig.name,
        },
      ],
    };
  }

  getEntriesForTransactionPair(
    inputs: SuiTransaction['tx']['inputs'],
    transactions: unknown[]
  ): {
    inputs: Entry[];
    outputs: Entry[];
  } {
    if (transactions.length !== 2) {
      throw new Error('Invalid transaction pair');
    }

    if (!MoveCallTransaction.is(transactions[0]) || !MoveCallTransaction.is(transactions[1])) {
      throw new Error('Invalid transaction pair');
    }

    if (!Array.isArray(inputs) || inputs.length !== 3) {
      throw new Error('Invalid inputs');
    }

    function isImmOrOwnedObj(obj: ObjectCallArg['Object']): obj is { ImmOrOwned: SuiObjectRef } {
      return 'ImmOrOwned' in obj;
    }

    const [inputStakedSui, inputAmount, inputSharedObj] = inputs;
    if (
      !TransactionBlockInput.is(inputStakedSui) ||
      !TransactionBlockInput.is(inputAmount) ||
      !TransactionBlockInput.is(inputSharedObj) ||
      inputStakedSui.type !== 'object' ||
      inputAmount.type !== 'pure' ||
      typeof inputAmount.value !== 'string' ||
      inputSharedObj.type !== 'object' ||
      !ObjectCallArg.is(inputStakedSui.value) ||
      !isImmOrOwnedObj(inputStakedSui.value.Object)
    ) {
      throw new Error('Invalid inputs');
    }

    const amount = BigInt(inputAmount.value);

    // make sure we parsed the transaction correctly by rebuilding it and comparing the transaction blocks
    assertEqualTransactionBlocks(
      { inputs, transactions },
      UnstakingBuilder.getTransactionBlockData(inputStakedSui.value.Object.ImmOrOwned, amount)
    );

    return this.getEntriesForStakedSuiInput(inputStakedSui, amount);
  }

  getEntriesForSingleTransaction(
    inputs: SuiTransaction['tx']['inputs'],
    tx: unknown
  ): {
    inputs: Entry[];
    outputs: Entry[];
  } {
    if (!MoveCallTransaction.is(tx) || !TransactionBlockInput.is(tx.arguments[1])) {
      throw new Error('Invalid transaction');
    }
    const stakedSuiInputIdx = tx.arguments[1].index;
    const stakedSuiInput = inputs[stakedSuiInputIdx];
    if (!TransactionBlockInput.is(stakedSuiInput)) {
      // for unclear reasons, in tests the stakedSuiInput is not a TransactionBlockInput sometimes
      if (!ObjectCallArg.is(stakedSuiInput)) {
        throw new Error('Invalid transaction');
      }
    }
    return this.getEntriesForStakedSuiInput(stakedSuiInput as TransactionBlockInput);
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this.suiTransaction) {
      return;
    }

    let parsed;
    const { inputs, transactions } = this.suiTransaction.tx;
    if (transactions.length === 1) {
      parsed = this.getEntriesForSingleTransaction(inputs, transactions[0]);
    } else if (transactions.length === 2) {
      parsed = this.getEntriesForTransactionPair(inputs, transactions);
    } else {
      throw new InvalidTransactionError('Invalid transaction');
    }

    this._inputs = parsed.inputs;
    this._outputs = parsed.outputs;
  }

  /**
   * Sets this transaction payload
   *
   * @param {string} rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      this._suiTransaction = Transaction.deserializeSuiTransaction(
        rawTransaction
      ) as SuiTransaction<UnstakingProgrammableTransaction>;
      this._type = utils.getTransactionType(this._suiTransaction.type);
      this._id = this._suiTransaction.id;
      this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Helper function for serialize() to get the correct txData with transaction type
   *
   * @return {TxData}
   */
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
    } as UnstakingProgrammableTransaction;

    return {
      sender: this._suiTransaction.sender,
      expiration: { None: null },
      gasData: this._suiTransaction.gasData,
      kind: {
        ProgrammableTransaction: programmableTx,
      },
    };
  }

  /**
   * Returns a complete explanation for a unstaking transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainWithdrawStakedSuiTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
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
}
