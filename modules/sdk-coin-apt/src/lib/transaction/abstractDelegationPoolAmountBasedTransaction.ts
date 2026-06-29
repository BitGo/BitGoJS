import {
  AccountAddress,
  EntryFunctionABI,
  InputGenerateTransactionPayloadData,
  MoveFunctionId,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  TypeTagAddress,
  TypeTagU64,
} from '@aptos-labs/ts-sdk';
import { AbstractDelegationPoolTransaction } from './abstractDelegationPoolTransaction';
import { BaseCoin } from '@bitgo/statics';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import utils from '../utils';
import { APTOS_COIN } from '../constants';

/**
 * This is a convenience class for delegation pool functions with arguments [address, amount].
 *
 * Assume this class can be deleted at any time (concrete implementations remain the same).
 * Therefore, do not store objects as this type.
 * Good: `export abstract class DelegationPoolWithdrawTransaction extends AbstractDelegationPoolAmountBasedTransaction`
 * Good: `const transaction: AbstractDelegationPoolTransaction = DelegationPoolWithdrawTransaction()`
 * Bad: `const transaction: AbstractDelegationPoolAmountBasedTransaction = DelegationPoolWithdrawTransaction()`
 */
export abstract class AbstractDelegationPoolAmountBasedTransaction extends AbstractDelegationPoolTransaction {
  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
    this._assetId = APTOS_COIN;
  }

  abstract moveFunctionId(): MoveFunctionId;

  protected override parseTransactionPayload(payload: TransactionPayload): void {
    if (!this.isValidPayload(payload)) {
      throw new InvalidTransactionError('Invalid transaction payload');
    }
    const { entryFunction } = payload;
    const addressArg = entryFunction.args[0];
    const amountArg = entryFunction.args[1];
    const [{ address, amount }] = utils.parseRecipients(addressArg, amountArg);
    this.validatorAddress = address;
    this.amount = amount.toString();
  }

  protected override getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    const { validatorAddress, amount } = this;
    if (validatorAddress === undefined) throw new Error('validatorAddress is undefined');
    if (amount === undefined) throw new Error('amount is undefined');
    return {
      function: this.moveFunctionId(),
      typeArguments: [],
      functionArguments: [AccountAddress.fromString(validatorAddress), amount],
      abi: this.abi,
    };
  }

  private isValidPayload(payload: TransactionPayload): payload is TransactionPayloadEntryFunction {
    return (
      payload instanceof TransactionPayloadEntryFunction &&
      payload.entryFunction.args.length === 2 &&
      payload.entryFunction.type_args.length === 0
    );
  }

  private abi: EntryFunctionABI = {
    typeParameters: [],
    parameters: [new TypeTagAddress(), new TypeTagU64()],
  };
}
