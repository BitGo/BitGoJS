import { Transaction } from './transaction';
import { PolyxBaseBuilder } from './baseBuilder';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { NominateTransactionSchema } from './txnSchema';
import utils from './utils';
import { NominateArgs } from './iface';

// [CLEANUP-V8-OLD] v7 path — v7 metadata material. Retained as the Flipt rollback path alongside
// V8NominateBuilder (same logic, v8 material).
export class NominateBuilder extends PolyxBaseBuilder {
  protected _validators: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getMaterial(_coinConfig.network.type));
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingVote;
  }

  validators(validators: string[]): this {
    if (validators.length === 0) {
      throw new InvalidTransactionError('validators must have at least 1 entry');
    }
    if (validators.length > 16) {
      throw new InvalidTransactionError('validators must have at most 16 entries');
    }
    for (const address of validators) {
      this.validateAddress({ address });
    }
    this._validators = validators;
    return this;
  }

  getValidators(): string[] {
    return this._validators;
  }

  protected buildTransaction(): UnsignedTransaction {
    if (this._validators.length === 0) {
      throw new InvalidTransactionError('validators must have at least 1 entry');
    }

    const baseTxInfo = this.createBaseTxInfo();

    return methods.staking.nominate({ targets: this._validators }, baseTxInfo.baseTxInfo, baseTxInfo.options);
  }

  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const methodName = decodedTxn.method?.name as string;
    if (methodName !== 'nominate') {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}`);
    }

    const args = decodedTxn.method.args as unknown as NominateArgs;
    const targetAddresses = args.targets.map((target) => {
      if (typeof target === 'string') {
        return target;
      } else if (target && typeof target === 'object' && 'id' in target) {
        return (target as { id: string }).id;
      }
      throw new InvalidTransactionError(`Invalid target format: ${JSON.stringify(target)}`);
    });

    const validationResult = NominateTransactionSchema.validate({ validators: targetAddresses });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid nominate args: ${validationResult.error.message}`);
    }
  }

  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);

    if ((this._method?.name as string) !== 'nominate') {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected nominate`);
    }

    if (this._method) {
      const args = this._method.args as unknown as NominateArgs;
      const targetAddresses = args.targets.map((target) => {
        if (typeof target === 'string') {
          return target;
        } else if (target && typeof target === 'object' && 'id' in target) {
          return (target as { id: string }).id;
        }
        throw new InvalidTransactionError(`Invalid target format: ${JSON.stringify(target)}`);
      });
      this._validators = targetAddresses;
    }

    return tx;
  }

  validateTransaction(tx: Transaction): void {
    super.validateTransaction(tx);
    this.validateFields();
  }

  private validateFields(): void {
    if (this._validators.length === 0) {
      throw new InvalidTransactionError('validators must have at least 1 entry');
    }

    const validationResult = NominateTransactionSchema.validate({ validators: this._validators });
    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
    }
  }
}
