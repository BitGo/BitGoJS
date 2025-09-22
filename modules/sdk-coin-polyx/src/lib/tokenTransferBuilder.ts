import { TransactionType } from '@bitgo-beta/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { PolyxBaseBuilder } from './baseBuilder';
import { TxMethod, MethodNames, AddAndAffirmWithMediatorsArgs, SettlementType, PortfolioKind } from './iface';
import { Transaction } from './transaction';
import { Interface } from '@bitgo-beta/abstract-substrate';
import { AddAndAffirmWithMediatorsTransactionSchema } from './txnSchema';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';

export class TokenTransferBuilder extends PolyxBaseBuilder<TxMethod, Transaction> {
  protected _assetId: string;
  protected _amount: string;
  protected _memo: string;
  protected _fromDID: string;
  protected _toDID: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SendToken;
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.addAndAffirmWithMediators(
      {
        venueId: null,
        settlementType: SettlementType.SettleOnAffirmation,
        tradeDate: null,
        valueDate: null,
        legs: [
          {
            fungible: {
              sender: {
                did: this._fromDID,
                kind: PortfolioKind.Default,
              },
              receiver: {
                did: this._toDID,
                kind: PortfolioKind.Default,
              },
              assetId: this._assetId,
              amount: this._amount,
            },
          },
        ],
        portfolios: [
          {
            did: this._fromDID,
            kind: PortfolioKind.Default,
          },
        ],
        instructionMemo: this._memo,
        mediators: [],
      },
      baseTxInfo
    );
  }

  /**
   * Sets the amount to transfer.
   *
   * @param {string} amount - The amount to transfer.
   * @returns {this} The current instance of the builder.
   */
  assetId(assetId: string): this {
    this._assetId = assetId;
    return this;
  }

  /**
   * Sets the amount to transfer.
   *
   * @param {string} amount - The amount to transfer.
   * @returns {this} The current instance of the builder.
   */
  amount(amount: string): this {
    this._amount = amount;
    return this;
  }

  /**
   * Sets the memo for the transaction.
   * Pads the memo on the left with zeros to ensure it is 32 characters long.
   *
   * @param {string} memo - The memo for the transaction.
   * @returns {this} The current instance of the builder.
   */
  memo(memo: string): this {
    const paddedMemo = memo.padStart(32, '0');
    this._memo = paddedMemo;
    return this;
  }

  /**
   * Sets the sender DID.
   *
   * @param {string} fromDID - The sender DID.
   * @returns {this} The current instance of the builder.
   */
  fromDID(fromDID: string): this {
    this._fromDID = fromDID;
    return this;
  }

  /**
   * Sets the receiver DID.
   *
   * @param {string} toDID - The receiver DID.
   * @returns {this} The current instance of the builder.
   */
  toDID(toDID: string): this {
    this._toDID = toDID;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.AddAndAffirmWithMediators) {
      const txMethod = this._method.args as AddAndAffirmWithMediatorsArgs;
      this.assetId(txMethod.legs[0].fungible.assetId);
      this.amount(txMethod.legs[0].fungible.amount);
      this.memo(txMethod.instructionMemo);
      this.fromDID(txMethod.legs[0].fungible.sender.did);
      this.toDID(txMethod.legs[0].fungible.receiver.did);
    } else {
      throw new Error(`Invalid Transaction Type: ${this._method?.name}. Expected AddAndAffirmWithMediators`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === MethodNames.AddAndAffirmWithMediators) {
      const txMethod = decodedTxn.method.args as AddAndAffirmWithMediatorsArgs;
      console.log(`Validating transaction: ${JSON.stringify(txMethod)}`);
      const venueId = txMethod.venueId;
      const settlementType = txMethod.settlementType;
      const tradeDate = txMethod.tradeDate;
      const valueDate = txMethod.valueDate;
      const legs = txMethod.legs;
      const portfolios = txMethod.portfolios;
      const instructionMemo = txMethod.instructionMemo;
      const mediators = txMethod.mediators;

      const validationResult = AddAndAffirmWithMediatorsTransactionSchema.validate({
        venueId,
        settlementType,
        tradeDate,
        valueDate,
        legs,
        portfolios,
        instructionMemo,
        mediators,
      });
      if (validationResult.error) {
        throw new Error(`Invalid transaction: ${validationResult.error.message}`);
      }
    }
  }

  private addAndAffirmWithMediators(
    args: AddAndAffirmWithMediatorsArgs,
    info: Interface.CreateBaseTxInfo
  ): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'addAndAffirmWithMediators',
          pallet: 'settlement',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
