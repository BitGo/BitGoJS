import {
  BaseKey,
  InvalidTransactionError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { StakingProgrammableTransaction, SuiTransaction, TransactionExplanation, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';
import {
  builder,
  Inputs,
  MoveCallTransaction,
  SplitCoinsTransaction,
  TransactionBlockInput,
} from './mystenlab/builder';
import { CallArg, normalizeSuiAddress } from './mystenlab/types';
import { BCS } from '@mysten/bcs';
import { MAX_GAS_OBJECTS, SUI_ADDRESS_LENGTH } from './constants';

export class StakingTransaction extends Transaction<StakingProgrammableTransaction> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<StakingProgrammableTransaction> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction<StakingProgrammableTransaction>): void {
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
      case TransactionType.StakingAdd:
        return this.explainAddDelegationTransaction(result, explanationResult);
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

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this.suiTransaction) {
      return;
    }
    const requests = utils.getStakeRequests(this.suiTransaction.tx);
    this._outputs = requests.map((request) => {
      return {
        address: request.validatorAddress,
        value: request.amount.toString(),
        coin: this._coinConfig.name,
      };
    });

    this._inputs = [
      {
        address: this.suiTransaction.sender,
        value: this._outputs.reduce((acc, output) => acc + Number(output.value), 0).toString(),
        coin: this._coinConfig.name,
      },
    ];
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
      ) as SuiTransaction<StakingProgrammableTransaction>;
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
    } as StakingProgrammableTransaction;

    return {
      sender: this._suiTransaction.sender,
      expiration: { None: null },
      gasData: {
        ...this._suiTransaction.gasData,
        payment: this._suiTransaction.gasData.payment.slice(0, MAX_GAS_OBJECTS - 1),
      },
      kind: {
        ProgrammableTransaction: programmableTx,
      },
    };
  }

  /**
   * Returns a complete explanation for a staking transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainAddDelegationTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    const outputs: TransactionRecipient[] = [];
    this.suiTransaction.tx.transactions.forEach((transaction, txIndex) => {
      if (SplitCoinsTransaction.is(transaction)) {
        const amountInputIdx = (transaction.amounts[0] as TransactionBlockInput).index;
        const amount = BigInt((this.suiTransaction.tx.inputs[amountInputIdx] as TransactionBlockInput).value);

        // For AddStake, every split is followed by a move call
        const validatorAddressInputIdx = (
          (this.suiTransaction.tx.transactions[txIndex + 1] as MoveCallTransaction)
            .arguments[2] as TransactionBlockInput
        ).index;
        const validatorAddress = utils.getAddress(
          this.suiTransaction.tx.inputs[validatorAddressInputIdx] as TransactionBlockInput
        );

        outputs.push({
          address: validatorAddress,
          amount: amount.toString(10),
        });
      }
    });

    const outputAmount = outputs.reduce((sum, output) => sum + BigInt(output.amount), BigInt(0)).toString(10);

    return {
      ...explanationResult,
      outputAmount,
      outputs,
    };
  }
}
