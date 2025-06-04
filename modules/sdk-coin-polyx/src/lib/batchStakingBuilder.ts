import { TransactionBuilder, Transaction } from '@bitgo/abstract-substrate';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BatchTransactionSchema } from './txnSchema';
import utils from './utils';
import { BatchArgs, BondArgs, NominateArgs } from './iface';
import BigNumber from 'bignumber.js';

export class BatchStakingBuilder extends TransactionBuilder {
  // For bond operation
  protected _amount: string;
  protected _controller: string;
  protected _payee: string | { Account: string };

  // For nominate operation
  protected _validators: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getMaterial(_coinConfig.network.type));
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Batch;
  }

  /**
   * Build a batch transaction that combines bond and nominate operations
   * Both operations are required and always atomic (using batchAll)
   */
  protected buildTransaction(): UnsignedTransaction {
    // Ensure both bond and nominate operations are included
    if (!this._amount || this._validators.length === 0) {
      throw new InvalidTransactionError('Batch transaction must include both bond and nominate operations');
    }

    const baseTxInfo = this.createBaseTxInfo();

    // Create the individual calls
    const calls: string[] = [];

    // Add bond call
    const bondCall = methods.staking.bond(
      {
        controller: this._controller || this._sender,
        value: this._amount,
        payee: this._payee || 'Staked',
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    calls.push(bondCall.method);

    // Add nominate call
    const nominateCall = methods.staking.nominate(
      {
        targets: this._validators,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
    calls.push(nominateCall.method);

    // Always use batchAll (atomic)
    return methods.utility.batchAll(
      {
        calls,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  /**
   * Set the staking amount for bond
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   * Get the staking amount
   */
  getAmount(): string {
    return this._amount;
  }

  /**
   * Set the controller account for bond
   */
  controller(controller: BaseAddress): this {
    this.validateAddress(controller);
    this._controller = controller.address;
    return this;
  }

  /**
   * Get the controller address
   */
  getController(): string {
    return this._controller;
  }

  /**
   * Set the rewards destination for bond ('Staked', 'Stash','Controller', or { Account: string })
   */
  payee(payee: string | { Account: string }): this {
    if (typeof payee === 'object' && payee.Account) {
      this._payee = payee;
    } else {
      this._payee = payee;
    }
    return this;
  }

  /**
   * Get the payee
   */
  getPayee(): string | { Account: string } {
    return this._payee;
  }

  /**
   * Set the validators to nominate
   */
  validators(validators: string[]): this {
    for (const address of validators) {
      this.validateAddress({ address });
    }
    this._validators = validators;
    return this;
  }

  /**
   * Get the validators to nominate
   */
  getValidators(): string[] {
    return this._validators;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const methodName = decodedTxn.method?.name as string;

    // batch bond and nominate
    if (methodName === 'utility.batchAll') {
      const txMethod = decodedTxn.method.args as unknown as BatchArgs;
      const calls = txMethod.calls;

      for (const call of calls) {
        const callMethod = call.method;

        if (callMethod === 'staking.bond') {
          const bondArgs = call.args as unknown as BondArgs;
          this.validateBondArgs(bondArgs);
        } else if (callMethod === 'staking.nominate') {
          const nominateArgs = call.args as unknown as NominateArgs;
          this.validateNominateArgs(nominateArgs);
        } else {
          throw new InvalidTransactionError(`Invalid call in batch: ${callMethod}`);
        }
      }
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}`);
    }
  }

  /**
   * Validate bond arguments
   */
  private validateBondArgs(args: BondArgs): void {
    if (!utils.isValidAddress(args.controller)) {
      throw new InvalidTransactionError(
        `Invalid bond args: controller address ${args.controller} is not a well-formed address`
      );
    }

    const validationResult = BatchTransactionSchema.validateBond({
      value: args.value,
      controller: args.controller,
      payee: args.payee,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid bond args: ${validationResult.error.message}`);
    }
  }

  /**
   * Validate nominate arguments
   */
  private validateNominateArgs(args: NominateArgs): void {
    const validationResult = BatchTransactionSchema.validateNominate({
      validators: args.targets,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid nominate args: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);

    // Check if the transaction is a batch transaction
    if ((this._method?.name as string) !== 'utility.batchAll') {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected utility.batchAll`);
    }

    if (this._method) {
      const txMethod = this._method.args as unknown as BatchArgs;

      for (const call of txMethod.calls) {
        if (call.method === 'staking.bond') {
          const bondArgs = call.args as unknown as BondArgs;
          this.amount(bondArgs.value);
          this.controller({ address: bondArgs.controller });
          this.payee(bondArgs.payee);
        } else if (call.method === 'staking.nominate') {
          const nominateArgs = call.args as unknown as NominateArgs;
          this.validators(nominateArgs.targets);
        }
      }
    }

    return tx;
  }

  /** @inheritdoc */
  validateTransaction(tx: Transaction): void {
    super.validateTransaction(tx);
    this.validateFields();
  }

  /**
   * Validate the builder fields
   */
  private validateFields(): void {
    // Ensure both bond and nominate operations are included
    if (!this._amount || this._validators.length === 0) {
      throw new InvalidTransactionError('Batch transaction must include both bond and nominate operations');
    }

    const validationResult = BatchTransactionSchema.validate({
      amount: this._amount,
      controller: this._controller,
      payee: this._payee,
      validators: this._validators,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
    }
  }

  testValidateFields(): void {
    this.validateFields();
  }

  public testValidateBondArgs(args: BondArgs): void {
    return this.validateBondArgs(args);
  }

  public testValidateNominateArgs(args: NominateArgs): void {
    return this.validateNominateArgs(args);
  }
}
