import { Transaction } from './transaction';
import { PolyxBaseBuilder } from './baseBuilder';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { V8BatchTransactionSchema } from './txnSchema';
import utils from './utils';
import { BatchArgs, NominateArgs, V8BondArgs } from './iface';
import BigNumber from 'bignumber.js';

// Type definitions for decoded transaction formats
interface DecodedPayee {
  staked?: null;
  stash?: null;
  controller?: null;
  account?: string;
}

type PayeeValue = string | DecodedPayee;
type AmountValue = string | number;

/**
 * Polymesh v8 batch staking builder.
 *
 * Polymesh v8 changed `staking.bond` from `bond(controller, value, payee)` to `bond(value, payee)`
 * — the stash account is its own controller, so no `controller` leg is encoded. This builder
 * constructs `utility.batchAll([bond, nominate])` with the 2-arg bond call against v8 chain
 * metadata (v8 specVersion / txVersion).
 *
 * Behaviour is otherwise identical to the v7 {@link BatchStakingBuilder}, which is retained as the
 * `[CLEANUP-V8-OLD]` rollback path.
 */
export class V8BatchStakingBuilder extends PolyxBaseBuilder {
  // For bond operation
  protected _amount: string;
  protected _payee: string | { Account: string };

  // For nominate operation
  protected _validators: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getV8Material(_coinConfig.network.type));
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

    // Add bond call — v8 bond takes only { value, payee } (no controller)
    const bondCall = methods.staking.bond(
      {
        value: this._amount,
        payee: this._payee || 'Staked',
      } as unknown as { controller: string; value: string; payee: string | { Account: string } },
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
   * Set the rewards destination for bond ('Staked', 'Stash','Controller', or { Account: string })
   */
  payee(payee: string | { Account: string }): this {
    this._payee = payee;
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
      const bondArgs = calls[0].args as unknown as V8BondArgs;
      this.validateBondArgs(bondArgs);

      // Validate nominate arguments
      const nominateArgs = calls[1].args as unknown as NominateArgs;
      this.validateNominateArgs(nominateArgs);
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}`);
    }
  }

  /**
   * Normalize a decoded payee value into the construction-side shape.
   */
  private normalizePayee(payeeValue: PayeeValue): string | { Account: string } {
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
    return normalizedPayee;
  }

  /**
   * Validate v8 bond arguments (no controller)
   */
  private validateBondArgs(args: V8BondArgs): void {
    // Handle both string and number formats for value
    const amountValue = args.value as AmountValue;
    const valueString = typeof amountValue === 'string' ? amountValue : amountValue.toString();

    const normalizedPayee = this.normalizePayee(args.payee as PayeeValue);

    const validationResult = V8BatchTransactionSchema.validateBond({
      value: valueString,
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

    const validationResult = V8BatchTransactionSchema.validateNominate({
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
          const bondArgs = call.args as unknown as V8BondArgs;
          // Handle both string and number formats for value
          const amountValue = bondArgs.value as AmountValue;
          const valueString = typeof amountValue === 'string' ? amountValue : amountValue.toString();
          this.amount(valueString);

          // Handle different payee formats
          this.payee(this.normalizePayee(bondArgs.payee as PayeeValue));
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

    const validationResult = V8BatchTransactionSchema.validate({
      amount: this._amount,
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

  public testValidateBondArgs(args: V8BondArgs): void {
    return this.validateBondArgs(args);
  }

  public testValidateNominateArgs(args: NominateArgs): void {
    return this.validateNominateArgs(args);
  }
}
