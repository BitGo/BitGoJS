import assert from 'assert';
import { TransactionType, Recipient, BuildTransactionError, BaseKey } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, SuiCoin } from '@bitgo/statics';
import { SuiTransaction, SuiTransactionType, TokenTransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TokenTransferTransaction } from './tokenTransferTransaction';
import { SuiObjectRef } from './mystenlab/types';
import utils from './utils';
import {
  Inputs,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  TransactionArgument,
} from './mystenlab/builder';
import BigNumber from 'bignumber.js';

export class TokenTransferBuilder extends TransactionBuilder<TokenTransferProgrammableTransaction> {
  protected _recipients: Recipient[];
  protected _inputObjects: SuiObjectRef[];
  /**
   * Balance held in the address balance system for the token being transferred.
   * When set, this amount is included in the total available balance.
   * At execution time, tx.withdrawal() + 0x2::coin::redeem_funds converts it
   * to a Coin<T> that is merged with any coin objects before splitting.
   */
  protected _fundsInAddressBalance: BigNumber = new BigNumber(0);

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TokenTransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * The full coin type string derived from the coin config (e.g. `0xabc::my_token::MY_TOKEN`).
   */
  private get tokenCoinType(): string {
    const config = this._coinConfig as SuiCoin;
    return `${config.packageId}::${config.module}::${config.symbol}`;
  }

  /** @inheritdoc */
  validateTransaction(transaction: TokenTransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /** @inheritdoc */
  sign(key: BaseKey): void {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    super.sign(key);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<TokenTransferProgrammableTransaction> {
    const tx = new TokenTransferTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<TokenTransferProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    this._signatures.forEach((signature) => {
      this.transaction.addSignature(signature.publicKey, signature.signature);
    });

    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /** @inheritdoc */
  initBuilder(tx: TokenTransferTransaction): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }
    const txData = tx.toJson();
    this.type(SuiTransactionType.TokenTransfer);
    this.sender(txData.sender);
    this.gasData(txData.gasData);
    const recipients = utils.getRecipients(tx.suiTransaction);
    this.send(recipients);

    // Reconstruct fundsInAddressBalance from BalanceWithdrawal input if present.
    // After BCS deserialization inputs are CallArg format: { BalanceWithdrawal: {...} }
    // During building they are TransactionBlockInput format: { kind:'Input', value: { BalanceWithdrawal: {...} } }
    const withdrawalInput = (tx.suiTransaction?.tx?.inputs as any[])?.find(
      (input: any) =>
        (input !== null && typeof input === 'object' && 'BalanceWithdrawal' in input) ||
        (input?.value !== null && typeof input?.value === 'object' && 'BalanceWithdrawal' in (input.value ?? {}))
    );
    if (withdrawalInput) {
      const bw = withdrawalInput.BalanceWithdrawal ?? withdrawalInput.value?.BalanceWithdrawal;
      this._fundsInAddressBalance = new BigNumber(String(bw.amount));
    }

    if (txData.inputObjects && txData.inputObjects.length > 0) {
      this.inputObjects(txData.inputObjects);
    }
  }

  send(recipients: Recipient[]): this {
    this.validateRecipients(recipients);
    this._recipients = recipients;
    return this;
  }

  inputObjects(inputObject: SuiObjectRef[]): this {
    this.validateInputObjectRefs(inputObject);
    this._inputObjects = inputObject;
    return this;
  }

  /**
   * Set the amount of token funds held in the Sui address balance system for this sender.
   *
   * @param {string} amount - amount in base units held in address balance
   */
  fundsInAddressBalance(amount: string): this {
    this._fundsInAddressBalance = new BigNumber(amount);
    return this;
  }

  /**
   * Validates all fields are defined correctly
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(
      this._recipients && this._recipients.length > 0,
      new BuildTransactionError('at least one recipient is required before building')
    );
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
    this.validateGasData(this._gasData);

    // Must have at least coin objects OR address balance
    assert(
      (this._inputObjects && this._inputObjects.length > 0) || this._fundsInAddressBalance.gt(0),
      new BuildTransactionError('input objects or fundsInAddressBalance required before building')
    );
    if (this._inputObjects && this._inputObjects.length > 0) {
      this.validateInputObjectRefs(this._inputObjects);
    }
  }

  /** Validates the individual object refs (does not require non-empty array). */
  private validateInputObjectRefs(inputObjects: SuiObjectRef[]): void {
    if (inputObjects) {
      inputObjects.forEach((inputObject) => {
        this.validateSuiObjectRef(inputObject, 'input object');
      });
    }
  }

  /**
   * Build SuiTransaction.
   *
   * Two build paths:
   *
   * Path A — coin objects only (fundsInAddressBalance = 0):
   *   MergeCoins(inputObject[0], [inputObject[1..]]) → SplitCoins → TransferObjects
   *
   * Path B — coin objects + address balance (or address balance only):
   *   MoveCall(0x2::coin::redeem_funds, [withdrawal(amount, coinType)]) → Coin<T>
   *   MergeCoins(inputObject[0] | addrCoin, [rest...]) → SplitCoins → TransferObjects
   *
   * @return {SuiTransaction<TokenTransferProgrammableTransaction>}
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<TokenTransferProgrammableTransaction> {
    this.validateTransactionFields();

    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    const inputObjects: TransactionArgument[] = (this._inputObjects ?? []).map((object) =>
      programmableTxBuilder.object(Inputs.ObjectRef(object))
    );

    // If address balance is available, withdraw it as Coin<T> and add to the pool
    if (this._fundsInAddressBalance.gt(0)) {
      const coinType = this.tokenCoinType;
      const [addrCoin] = programmableTxBuilder.moveCall({
        target: '0x2::coin::redeem_funds',
        typeArguments: [coinType],
        arguments: [
          programmableTxBuilder.withdrawal({
            amount: BigInt(this._fundsInAddressBalance.toFixed()),
            type: coinType,
          }),
        ],
      });
      inputObjects.push(addrCoin);
    }

    const mergedObject = inputObjects.shift() as TransactionArgument;
    if (inputObjects.length > 0) {
      programmableTxBuilder.mergeCoins(mergedObject, inputObjects);
    }

    this._recipients.forEach((recipient) => {
      const splitObject = programmableTxBuilder.splitCoins(mergedObject, [
        programmableTxBuilder.pure(Number(recipient.amount)),
      ]);
      programmableTxBuilder.transferObjects([splitObject], programmableTxBuilder.object(recipient.address));
    });

    const txData = programmableTxBuilder.blockData;
    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [...txData.inputs],
        transactions: [...txData.transactions],
      },
      gasData: {
        ...this._gasData,
      },
    };
  }
}
