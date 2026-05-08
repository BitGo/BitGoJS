import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { PolyxBaseBuilder } from './baseBuilder';
import { TxMethod, MethodNames, RejectInstructionBuilderArgs, PortfolioKind } from './iface';
import { Transaction } from './transaction';
import { Interface } from '@bitgo/abstract-substrate';
import { RejectInstructionTransactionSchema } from './txnSchema';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';

export class RejectInstructionBuilder extends PolyxBaseBuilder<TxMethod, Transaction> {
  protected _instructionId: string;
  protected _portfolioDID: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.RejectInstruction;
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.rejectInstruction(
      {
        id: this._instructionId,
        portfolio: {
          did: this._portfolioDID,
          kind: PortfolioKind.Default,
        },
        numberOfAssets: {
          fungible: 1,
          nonFungible: 0,
          offChain: 0,
        },
      },
      baseTxInfo
    );
  }

  /**
   * @param instructionId - The ID of the instruction to be rejected
   * @returns {this}
   */
  instructionId(instructionId: string): this {
    this._instructionId = instructionId;
    return this;
  }

  /**
   * @param portfolioDID - The DID of the portfolio associated with the instruction
   * @returns {this}
   */
  portfolioDID(portfolioDID: string): this {
    this._portfolioDID = portfolioDID;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.RejectInstruction) {
      const txMethod = this._method.args as RejectInstructionBuilderArgs;
      this._instructionId = txMethod.id as string;
      this._portfolioDID = txMethod.portfolio.did as string;
    } else {
      throw new Error(`Cannot build from transaction with method ${this._method?.name} for RejectInstructionBuilder`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === MethodNames.RejectInstruction) {
      const txMethod = decodedTxn.method.args as RejectInstructionBuilderArgs;
      const id = txMethod.id;
      const portfolio = txMethod.portfolio;

      const validationResult = RejectInstructionTransactionSchema.validate({
        id,
        portfolio,
      });
      if (validationResult.error) {
        throw new Error(`Invalid transaction: ${validationResult.error.message}`);
      }
    }
  }

  private rejectInstruction(args: RejectInstructionBuilderArgs, info: Interface.CreateBaseTxInfo): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'rejectInstruction',
          pallet: 'settlement',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
