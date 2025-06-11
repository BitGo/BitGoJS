import { TransactionBuilder, Transaction } from '@bitgo/abstract-substrate';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BatchTransactionSchema } from './txnSchema';
import utils from './utils';
import { BatchArgs, BondArgs, NominateArgs } from './iface';
import BigNumber from 'bignumber.js';

// Type definitions for decoded transaction formats
interface DecodedController {
  id: string;
}

interface DecodedPayee {
  staked?: null;
  stash?: null;
  controller?: null;
  account?: string;
}

type ControllerValue = string | DecodedController;
type PayeeValue = string | DecodedPayee;
type AmountValue = string | number;

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
    if (methodName === 'batchAll') {
      const txMethod = decodedTxn.method.args as unknown as BatchArgs;
      const calls = txMethod.calls;

      if (calls.length !== 2) {
        throw new InvalidTransactionError(
          `Invalid batch staking transaction: expected 2 calls but got ${calls.length}`
        );
      }

      // Check that first call is bond
      const firstCallMethod = utils.decodeMethodName(calls[0], this._registry);
      if (firstCallMethod !== 'bond') {
        throw new InvalidTransactionError(
          `Invalid batch staking transaction: first call should be bond but got ${firstCallMethod}`
        );
      }

      // Check that second call is nominate
      const secondCallMethod = utils.decodeMethodName(calls[1], this._registry);
      if (secondCallMethod !== 'nominate') {
        throw new InvalidTransactionError(
          `Invalid batch staking transaction: second call should be nominate but got ${secondCallMethod}`
        );
      }

      // Validate bond arguments
      const bondArgs = calls[0].args as unknown as BondArgs;
      this.validateBondArgs(bondArgs);

      // Validate nominate arguments
      const nominateArgs = calls[1].args as unknown as NominateArgs;
      this.validateNominateArgs(nominateArgs);
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}`);
    }
  }

  /**
   * Validate bond arguments
   */
  private validateBondArgs(args: BondArgs): void {
    // Handle both string and object formats for controller
    const controllerValue = args.controller as ControllerValue;
    const controllerAddress = typeof controllerValue === 'string' ? controllerValue : controllerValue.id;

    if (!utils.isValidAddress(controllerAddress)) {
      throw new InvalidTransactionError(
        `Invalid bond args: controller address ${controllerAddress} is not a well-formed address`
      );
    }

    // Handle both string and number formats for value
    const amountValue = args.value as AmountValue;
    const valueString = typeof amountValue === 'string' ? amountValue : amountValue.toString();

    // Handle different payee formats
    const payeeValue = args.payee as PayeeValue;
    let normalizedPayee: string | { Account: string } = payeeValue as string;
    if (typeof payeeValue === 'object' && payeeValue !== null) {
      const decodedPayee = payeeValue as DecodedPayee;
      if (decodedPayee.staked !== undefined) {
        normalizedPayee = 'Staked';
      } else if (decodedPayee.stash !== undefined) {
        normalizedPayee = 'Stash';
      } else if (decodedPayee.controller !== undefined) {
        normalizedPayee = 'Controller';
      } else if (decodedPayee.account) {
        normalizedPayee = { Account: decodedPayee.account };
      }
    }

    const validationResult = BatchTransactionSchema.validateBond({
      value: valueString,
      controller: controllerAddress,
      payee: normalizedPayee,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid bond args: ${validationResult.error.message}`);
    }
  }

  /**
   * Validate nominate arguments
   */
  private validateNominateArgs(args: NominateArgs): void {
    // Handle both string and object formats for targets
    const targetAddresses = args.targets.map((target) => {
      if (typeof target === 'string') {
        return target;
      } else if (target && typeof target === 'object' && 'id' in target) {
        return (target as { id: string }).id;
      }
      throw new InvalidTransactionError(`Invalid target format: ${JSON.stringify(target)}`);
    });

    const validationResult = BatchTransactionSchema.validateNominate({
      validators: targetAddresses,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid nominate args: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);

    // Check if the transaction is a batch transaction
    if ((this._method?.name as string) !== 'batchAll') {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected batchAll`);
    }

    if (this._method) {
      const txMethod = this._method.args as unknown as BatchArgs;

      for (const call of txMethod.calls) {
        const callMethod = utils.decodeMethodName(call, this._registry);
        if (callMethod === 'bond') {
          const bondArgs = call.args as unknown as BondArgs;
          // Handle both string and number formats for value
          const amountValue = bondArgs.value as AmountValue;
          const valueString = typeof amountValue === 'string' ? amountValue : amountValue.toString();
          this.amount(valueString);

          // Handle both string and object formats for controller
          const controllerValue = bondArgs.controller as ControllerValue;
          const controllerAddress = typeof controllerValue === 'string' ? controllerValue : controllerValue.id;
          this.controller({ address: controllerAddress });

          // Handle different payee formats
          const payeeValue = bondArgs.payee as PayeeValue;
          let normalizedPayee: string | { Account: string } = payeeValue as string;
          if (typeof payeeValue === 'object' && payeeValue !== null) {
            const decodedPayee = payeeValue as DecodedPayee;
            if (decodedPayee.staked !== undefined) {
              normalizedPayee = 'Staked';
            } else if (decodedPayee.stash !== undefined) {
              normalizedPayee = 'Stash';
            } else if (decodedPayee.controller !== undefined) {
              normalizedPayee = 'Controller';
            } else if (decodedPayee.account) {
              normalizedPayee = { Account: decodedPayee.account };
            }
          }
          this.payee(normalizedPayee);
        } else if (callMethod === 'nominate') {
          const nominateArgs = call.args as unknown as NominateArgs;

          // Handle both string and object formats for targets
          const targetAddresses = nominateArgs.targets.map((target) => {
            if (typeof target === 'string') {
              return target;
            } else if (target && typeof target === 'object' && 'id' in target) {
              return (target as { id: string }).id;
            }
            throw new InvalidTransactionError(`Invalid target format: ${JSON.stringify(target)}`);
          });
          this.validators(targetAddresses);
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
