import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BuildTransactionError, Recipient, TransactionType } from '@bitgo/sdk-core';
import { SuiTransaction, SuiTransactionType, TransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransferTransaction } from './transferTransaction';
import assert from 'assert';
import {
  Inputs,
  Transactions as TransactionsConstructor,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  TransactionArgument,
} from './mystenlab/builder';
import utils from './utils';
import { MAX_COMMAND_ARGS, MAX_GAS_OBJECTS } from './constants';
import BigNumber from 'bignumber.js';

export class TransferBuilder extends TransactionBuilder<TransferProgrammableTransaction> {
  protected _recipients: Recipient[];
  /**
   * Balance held in the Sui address balance system (not in coin objects).
   * When set, this amount is included in the total available balance for transfer.
   * At execution time, Sui's GasCoin automatically draws from both coin objects
   * (gasData.payment) and address balance, so SplitCoins(GasCoin, [amount])
   * can spend funds from either source.
   */
  protected _fundsInAddressBalance: BigNumber = new BigNumber(0);

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  send(recipients: Recipient[]): this {
    this.validateRecipients(recipients);
    this._recipients = recipients;
    return this;
  }

  /**
   * Set the amount of funds held in the Sui address balance system for this sender.
   * This is the `fundsInAddressBalance` value from the `suix_getBalance` RPC response.
   * It is added to the coin object balances when computing total available funds.
   *
   * @param {string} amount - amount in MIST held in address balance
   */
  fundsInAddressBalance(amount: string): this {
    this._fundsInAddressBalance = new BigNumber(amount);
    return this;
  }

  /**
   * Returns the total available balance: sum of all gas payment coin object
   * balances plus any funds held in the address balance system.
   *
   * @param {BigNumber} coinObjectsBalance - sum of balances from gasData.payment coin objects
   */
  totalAvailableBalance(coinObjectsBalance: BigNumber): BigNumber {
    return coinObjectsBalance.plus(this._fundsInAddressBalance);
  }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
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
  protected fromImplementation(rawTransaction: string): Transaction<TransferProgrammableTransaction> {
    const tx = new TransferTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<TransferProgrammableTransaction>> {
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

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: TransferTransaction): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.Transfer);
    this.sender(txData.sender);
    this.gasData(txData.gasData);

    if (txData.expiration && !('None' in txData.expiration)) {
      this._expiration = txData.expiration;
    }

    if (txData.inputObjects) {
      this.inputObjects(txData.inputObjects);
    }

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
      this._fundsInAddressBalance = new BigNumber(String(bw.reservation?.MaxAmountU64 ?? bw.amount));
    }

    const recipients = utils.getRecipients(tx.suiTransaction);
    this.send(recipients);
  }

  /**
   * Validates all fields are defined
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

    // If inputObjects are provided, validate them
    if (this._inputObjects && this._inputObjects.length > 0) {
      this.validateInputObjectsBase(this._inputObjects);
    }

    // When fundsInAddressBalance is set, validate that total recipient amount
    // does not exceed available address balance. Coin object balances are not
    // stored in the builder (gasData.payment holds only ObjectRefs), so only
    // the address balance portion can be cross-checked here.
    if (this._fundsInAddressBalance.gt(0)) {
      const totalRecipientAmount = this._recipients.reduce(
        (acc, r) => acc.plus(new BigNumber(r.amount)),
        new BigNumber(0)
      );
      assert(totalRecipientAmount.gt(0), new BuildTransactionError('total recipient amount must be greater than 0'));
    }
  }

  /**
   * Build transfer programmable transaction.
   *
   * Three build paths:
   *
   * Path 1a — Sponsored with coin objects (sender ≠ gasData.owner, inputObjects provided):
   *   [optional withdrawal(fundsInAddressBalance) → redeem_funds → Coin<SUI>]
   *   MergeCoins(inputObject[0], [inputObject[1..], addrCoin?])
   *   SplitCoins(mergedObject, [amount]) → TransferObjects
   *   Handles Cases 4 (coins only), 6 (coins, sponsor addr-bal gas), 8 (coins+addr-bal).
   *
   * Path 1b — Sponsored, address balance only (sender ≠ gasData.owner, no inputObjects):
   *   withdrawal(fundsInAddressBalance) → redeem_funds → Coin<SUI>
   *   SplitCoins(addrCoin, [amount]) → TransferObjects
   *   Handles Case 5 (sponsor coin-object gas) and Case 7/Phase-4b (sponsor addr-bal gas).
   *   Caller must set ValidDuring expiration when gasData.payment = [] (Cases 7, 9).
   *
   * Path 2 — Self-pay (sender === gasData.owner):
   *   SplitCoins(GasCoin, [amount]) → TransferObjects
   *   GasCoin at Sui execution time = gasData.payment objects merged + fundsInAddressBalance.
   *   Handles Case 1 (coins), Case 2 (addr-bal only, caller sets ValidDuring), Case 3 (mixed).
   *
   * @protected
   */
  protected buildSuiTransaction(): SuiTransaction<TransferProgrammableTransaction> {
    this.validateTransactionFields();
    const programmableTxBuilder = new ProgrammingTransactionBlockBuilder();

    if (this._sender !== this._gasData.owner && this._inputObjects && this._inputObjects.length > 0) {
      // Path 1: sponsored transaction.
      // The fee payer (gasData.owner) pays gas. The sender's funds come from:
      //   - coin objects (inputObjects)
      //   - address balance via tx.withdrawal() + 0x2::coin::redeem_funds
      const inputObjects: TransactionArgument[] = this._inputObjects.map((object) =>
        programmableTxBuilder.object(Inputs.ObjectRef(object))
      );

      // If the sender also has address balance, withdraw it as a Coin<SUI> and
      // merge it into the coin-object pool before splitting for recipients.
      if (this._fundsInAddressBalance.gt(0)) {
        const [addrCoin] = programmableTxBuilder.moveCall({
          target: '0x2::coin::redeem_funds',
          typeArguments: ['0x2::sui::SUI'],
          arguments: [programmableTxBuilder.withdrawal({ amount: BigInt(this._fundsInAddressBalance.toFixed()) })],
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
        expiration: this._expiration,
        fundsInAddressBalance: this._fundsInAddressBalance.gt(0) ? this._fundsInAddressBalance.toFixed() : undefined,
      };
    } else if (this._sender !== this._gasData.owner && this._fundsInAddressBalance.gt(0)) {
      // Path 1b: sponsored, address balance only — no coin inputObjects.
      // Sender's funds come entirely from address balance; gas is paid by the sponsor.
      // withdrawal(fundsInAddressBalance) → redeem_funds → Coin<SUI> → SplitCoins → TransferObjects
      const [addrCoin] = programmableTxBuilder.moveCall({
        target: '0x2::coin::redeem_funds',
        typeArguments: ['0x2::sui::SUI'],
        arguments: [programmableTxBuilder.withdrawal({ amount: BigInt(this._fundsInAddressBalance.toFixed()) })],
      });
      // addrCoin is a command result (from redeem_funds) and must be explicitly consumed.
      // Split for every recipient — keeps a 1:1 SplitCoins↔TransferObjects structure for the
      // transaction parser.  After all splits, consume the source coin explicitly:
      //   - If there is change (fundsInAddressBalance > total recipient amount): return addrCoin
      //     to sender via TransferObjects.
      //   - If send-all (no change): addrCoin has 0 balance; destroy it by merging into the
      //     sponsor's gas coin (a 0-value merge is valid in Sui and deletes the source object).
      const totalRecipientAmount = this._recipients.reduce((sum, r) => sum.plus(r.amount), new BigNumber(0));
      const hasChange = this._fundsInAddressBalance.gt(totalRecipientAmount);

      this._recipients.forEach((recipient) => {
        const splitObject = programmableTxBuilder.splitCoins(addrCoin, [
          programmableTxBuilder.pure(Number(recipient.amount)),
        ]);
        programmableTxBuilder.transferObjects([splitObject], programmableTxBuilder.object(recipient.address));
      });

      if (hasChange) {
        // Return the remaining balance (change) to the sender.
        programmableTxBuilder.transferObjects([addrCoin], programmableTxBuilder.object(this._sender));
      } else {
        // Send-all: addrCoin has 0 balance after all splits.  Merge it into the sponsor's gas
        // coin to destroy the zero-balance object (coin::join accepts a 0-value source).
        programmableTxBuilder.mergeCoins(programmableTxBuilder.gas, [addrCoin]);
      }
      const txData1b = programmableTxBuilder.blockData;
      return {
        type: this._type,
        sender: this._sender,
        tx: {
          inputs: [...txData1b.inputs],
          transactions: [...txData1b.transactions],
        },
        gasData: {
          ...this._gasData,
        },
        expiration: this._expiration,
        fundsInAddressBalance: this._fundsInAddressBalance.toFixed(),
      };
    } else {
      // number of objects passed as gas payment should be strictly less than `MAX_GAS_OBJECTS`. When the transaction
      // requires a larger number of inputs we use the merge command to merge the rest of the objects into the gasCoin
      if (this._gasData.payment.length >= MAX_GAS_OBJECTS) {
        const gasPaymentObjects = this._gasData.payment
          .slice(MAX_GAS_OBJECTS - 1)
          .map((object) => Inputs.ObjectRef(object));

        // limit for total number of `args: CallArg[]` for a single command is MAX_COMMAND_ARGS so the max length of
        // `sources[]` for a `mergeCoins(destination, sources[])` command is MAX_COMMAND_ARGS - 1 (1 used up for
        // `destination`). We need to create a total of `gasPaymentObjects/(MAX_COMMAND_ARGS - 1)` merge commands to
        // merge all the objects
        while (gasPaymentObjects.length > 0) {
          programmableTxBuilder.mergeCoins(
            programmableTxBuilder.gas,
            gasPaymentObjects.splice(0, MAX_COMMAND_ARGS - 1).map((object) => programmableTxBuilder.object(object))
          );
        }
      }

      this._recipients.forEach((recipient) => {
        const coin = programmableTxBuilder.add(
          TransactionsConstructor.SplitCoins(programmableTxBuilder.gas, [
            programmableTxBuilder.pure(Number(recipient.amount)),
          ])
        );
        programmableTxBuilder.add(
          TransactionsConstructor.TransferObjects([coin], programmableTxBuilder.object(recipient.address))
        );
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
          payment: this._gasData.payment.slice(0, MAX_GAS_OBJECTS - 1),
        },
        expiration: this._expiration,
        fundsInAddressBalance: this._fundsInAddressBalance.gt(0) ? this._fundsInAddressBalance.toFixed() : undefined,
      };
    }
  }
}
