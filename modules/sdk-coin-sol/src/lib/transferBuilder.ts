import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAmount, validateAddress } from './utils';
import { InstructionBuilderTypes } from './constants';
import { Transfer } from './iface';

import assert from 'assert';

export interface SendParams {
  address: string;
  amount: string;
}

export class TransferBuilder extends TransactionBuilder {
  private _sendParams: SendParams[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    for (const instruction of this._instructionsData) {
      if (instruction.type === InstructionBuilderTypes.Transfer) {
        const transferInstruction: Transfer = instruction;
        this.sender(transferInstruction.params.fromAddress);
        this.send({
          address: transferInstruction.params.toAddress,
          amount: transferInstruction.params.amount,
        });
      }
    }
  }

  /**
   *  Set a transfer
   *
   * @param {string} fromAddress - the sender address
   * @param {string} toAddress - the receiver address
   * @param {string} amount - the amount sent
   * @returns {TransactionBuilder} This transaction builder
   */
  send({ address, amount }: SendParams): this {
    validateAddress(address, 'address');
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }
    if (BigInt(amount) > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new BuildTransactionError(`input amount ${amount} exceeds max safe int ${Number.MAX_SAFE_INTEGER}`);
    }

    this._sendParams.push({ address, amount });

    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    assert(this._sender, 'Sender must be set before building the transaction');

    const transferData = this._sendParams.map((sendParams: SendParams): Transfer => {
      return {
        type: InstructionBuilderTypes.Transfer,
        params: {
          fromAddress: this._sender,
          toAddress: sendParams.address,
          amount: sendParams.amount,
        },
      };
    });
    this._instructionsData = transferData;

    return await super.buildImplementation();
  }
}
