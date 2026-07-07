import assert from 'assert';
import { TransactionType, Recipient, BuildTransactionError, BaseKey } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, SuiCoin } from '@bitgo/statics';
import { SuiTransaction, SuiTransactionType, TokenTransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TokenTransferTransaction } from './tokenTransferTransaction';
import { normalizeSuiAddress, SuiObjectRef } from './mystenlab/types';
import utils from './utils';
import {
  Inputs,
  TransactionBlock as ProgrammingTransactionBlockBuilder,
  TransactionArgument,
} from './mystenlab/builder';
import { TypeTagSerializer } from './mystenlab/txn-data-serializers/type-tag-serializer';
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

  /**
   * Coin type recovered from a deserialized transaction (the `redeem_funds` type argument /
   * `BalanceWithdrawal` type). When set it takes precedence over the coin type derived from the
   * coin config, so re-building a transaction (e.g. to attach a TSS signature before broadcast)
   * preserves the exact coin type it was signed with even when the builder was constructed with
   * the parent chain config rather than the token config.
   */
  protected _tokenCoinTypeOverride?: string;

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
    if (this._tokenCoinTypeOverride) {
      return this._tokenCoinTypeOverride;
    }
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

    // Only restore meaningful expirations (Epoch or ValidDuring) — ignore None.
    if (txData.expiration && !('None' in txData.expiration)) {
      this._expiration = txData.expiration;
    }

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
      this._fundsInAddressBalance = new BigNumber(String(bw.reservation?.MaxAmountU64 ?? bw.amount));
      // Recover the coin type from the withdrawal's TypeTag so that re-building uses the exact
      // coin type the transaction was created (and signed) with. Without this, buildSuiTransaction
      // would re-derive the coin type from this._coinConfig, which is the parent chain config
      // (no packageId/module/symbol) when the builder is constructed via the chain — producing an
      // `undefined::undefined::undefined` coin type and a signature that fails on-chain verification.
      const withdrawalTypeTag = bw?.typeArg?.Balance;
      if (withdrawalTypeTag) {
        // BCS decodes the struct address without the `0x` prefix; normalize it so the recovered
        // coin type matches the config-derived form (`0x<addr>::module::name`). The serialized
        // bytes are identical either way since parseFromStr re-normalizes the address on encode.
        const [address, ...rest] = TypeTagSerializer.tagToString(withdrawalTypeTag).split('::');
        this._tokenCoinTypeOverride = [normalizeSuiAddress(address), ...rest].join('::');
      }
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
   *   Exception A — addr-bal only, full amount (fundsInAddressBalance === sum(recipient amounts)):
   *   MoveCall(0x2::coin::redeem_funds, [withdrawal(amount, coinType)]) → Coin<T>
   *   SplitCoins(addrCoin, [amount0]) → TransferObjects(split0, addr0)   # recipients 0..N-2
   *   ...
   *   TransferObjects([addrCoin], addrN-1)                                # last recipient directly
   *   (After N-1 splits addrCoin.balance === recipients[N-1].amount exactly, so it can be
   *   transferred directly. SplitCoins on the last recipient would leave a zero-balance Coin<T>
   *   unused, which causes UnusedValueWithoutDrop since Coin<T> has no drop ability.)
   *
   *   Exception B — addr-bal only, partial amount (fundsInAddressBalance > sum(recipient amounts)):
   *   MoveCall(0x2::coin::redeem_funds, [withdrawal(amount, coinType)]) → Coin<T>
   *   SplitCoins(addrCoin, [amount0]) → TransferObjects(split0, addr0)   # all recipients
   *   ...
   *   TransferObjects([addrCoin], sender)                                 # return change to sender
   *   (addrCoin still holds the unspent remainder; transferring it back to the sender consumes
   *   the command result, avoiding UnusedValueWithoutDrop. Mirrors the native SUI TransferBuilder
   *   change-return path. Unlike native SUI, MergeCoins(gas, [addrCoin]) is not possible here
   *   because gas is Coin<SUI> and addrCoin is Coin<T> — incompatible types.)
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

    // addrCoin (the Coin<T> returned by redeem_funds) is a command result and must be explicitly
    // consumed — Coin<T> has no `drop` ability, so leaving it unused causes UnusedValueWithoutDrop.
    // This only applies when there are no coin objects (addr-bal only); in the hybrid case addrCoin
    // is consumed upfront by the MergeCoins above.
    const recipientTotal = this._recipients.reduce((sum, r) => sum.plus(r.amount), new BigNumber(0));
    const isAddrBalOnly = (this._inputObjects ?? []).length === 0 && this._fundsInAddressBalance.gt(0);

    if (isAddrBalOnly && this._fundsInAddressBalance.eq(recipientTotal)) {
      // Exception A — full amount: split for first N-1 recipients, transfer addrCoin directly
      // to the last. After N-1 splits addrCoin.balance === recipients[N-1].amount exactly.
      this._recipients.slice(0, -1).forEach((recipient) => {
        const splitObject = programmableTxBuilder.splitCoins(mergedObject, [
          programmableTxBuilder.pure(BigInt(recipient.amount)),
        ]);
        programmableTxBuilder.transferObjects([splitObject], programmableTxBuilder.object(recipient.address));
      });
      const lastRecipient = this._recipients[this._recipients.length - 1];
      programmableTxBuilder.transferObjects([mergedObject], programmableTxBuilder.object(lastRecipient.address));
    } else {
      // Standard path: split and transfer for every recipient.
      this._recipients.forEach((recipient) => {
        const splitObject = programmableTxBuilder.splitCoins(mergedObject, [
          programmableTxBuilder.pure(BigInt(recipient.amount)),
        ]);
        programmableTxBuilder.transferObjects([splitObject], programmableTxBuilder.object(recipient.address));
      });
      if (isAddrBalOnly && this._fundsInAddressBalance.gt(recipientTotal)) {
        // Exception B — partial amount: addrCoin still holds the unspent remainder.
        // Return it to the sender to consume the command result (MergeCoins into gas is not
        // possible here — gas is Coin<SUI> but addrCoin is Coin<T>, incompatible types).
        programmableTxBuilder.transferObjects([mergedObject], programmableTxBuilder.object(this._sender));
      }
    }

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
  }
}
