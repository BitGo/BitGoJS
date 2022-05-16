import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from '.';
import { Entry, TransactionRecipient, NotSupported } from '@bitgo/sdk-core';
import { instructionParamsFactory } from './instructionParamsFactory';
import { InstructionBuilderTypes } from './constants';
import { getSolTokenFromAddress } from './utils';
import { AtaInit, Memo, TransactionExplanation } from './iface';
import BigNumber from 'bignumber.js';

const TRANSFER_AMOUNT_UNKNOWN_TEXT = 'TRANSFER_AMOUNT_UNKNOWN';

export class AtaInitializationTransaction extends Transaction {
  private _tokenAccountRentExemptAmount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get tokenAccountRentExemptAmount(): string {
    return this._tokenAccountRentExemptAmount;
  }

  set tokenAccountRentExemptAmount(amount: string) {
    this._tokenAccountRentExemptAmount = amount;
  }

  /** @inheritDoc */
  loadInputsAndOutputs(): void {
    if (!this._solTransaction || this._solTransaction.instructions?.length === 0) {
      return;
    }
    const outputs: Entry[] = [];
    const inputs: Entry[] = [];
    const instructionParams = instructionParamsFactory(this.type, this._solTransaction.instructions);

    for (const instruction of instructionParams) {
      if (instruction.type === InstructionBuilderTypes.CreateAssociatedTokenAccount) {
        const token = getSolTokenFromAddress(instruction.params.mintAddress, this._coinConfig.network);
        if (!token) {
          throw new NotSupported(
            'Invalid transaction, token mint address not supported: ' + instruction.params.mintAddress,
          );
        }
        inputs.push({
          address: instruction.params.ownerAddress,
          value: this.tokenAccountRentExemptAmount || TRANSFER_AMOUNT_UNKNOWN_TEXT,
          coin: token.name,
        });
        outputs.push({
          address: instruction.params.ataAddress,
          value: this.tokenAccountRentExemptAmount || TRANSFER_AMOUNT_UNKNOWN_TEXT,
          coin: token.name,
        });
      }
    }
    this._outputs = outputs;
    this._inputs = inputs;
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const decodedInstructions = instructionParamsFactory(this._type, this._solTransaction.instructions);

    let memo: string | undefined = undefined;

    let outputAmount = new BigNumber(0);
    const outputs: TransactionRecipient[] = [];

    for (const instruction of decodedInstructions) {
      switch (instruction.type) {
        case InstructionBuilderTypes.Memo:
          memo = (instruction as Memo).params.memo;
          break;
        case InstructionBuilderTypes.CreateAssociatedTokenAccount:
          const createAtaInstruction = instruction as AtaInit;
          outputs.push({
            address: createAtaInstruction.params.ataAddress,
            amount: this.tokenAccountRentExemptAmount || TRANSFER_AMOUNT_UNKNOWN_TEXT,
          });
          if (this.tokenAccountRentExemptAmount) {
            outputAmount = outputAmount.plus(this.tokenAccountRentExemptAmount);
          }
          break;
      }
    }

    return this.getExplainedTransaction(outputAmount, outputs, memo);
  }
}
