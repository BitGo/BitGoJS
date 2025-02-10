// src/lib/stakingBuilder.ts
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-substrate';
import BigNumber from 'bignumber.js';
import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { MethodNames, StakeArgs, StakeArgsPayee, StakeMoreArgs } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { StakeTransactionSchema } from './txnSchema';

export class StakingBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _controller: string;
  protected _payee: StakeArgsPayee;
  protected _addToStake: boolean;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    if (this._addToStake) {
      return methods.staking.bondExtra({ maxAdditional: this._amount }, baseTxInfo.baseTxInfo, baseTxInfo.options);
    } else {
      return methods.staking.bond(
        { value: this._amount, payee: this._payee },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    }
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  addToStake(addToStake: boolean): this {
    this._addToStake = addToStake;
    return this;
  }

  owner(controller: BaseAddress): this {
    this.validateAddress(controller);
    this._controller = controller.address;
    return this;
  }

  payee(payee: StakeArgsPayee): this {
    if (typeof payee !== 'string') {
      this.validateAddress({ address: payee.Account });
      this._payee = { Account: payee.Account };
    } else {
      this._payee = payee;
    }
    return this;
  }

  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.Bond) {
      const txMethod = decodedTxn.method.args as unknown as StakeArgs;
      const validationResult = StakeTransactionSchema.validate({
        value: txMethod.value,
        controller: this._controller,
        payee: txMethod.payee,
      });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    } else if (decodedTxn.method?.name === MethodNames.BondExtra) {
      const txMethod = decodedTxn.method.args as unknown as StakeMoreArgs;
      const validationResult = StakeTransactionSchema.validate({
        value: txMethod.maxAdditional,
        addToStake: true,
      });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.Bond) {
      const txMethod = this._method.args as unknown as StakeArgs;
      this.amount(txMethod.value);
      this.owner({ address: this._controller });
      this.payee(txMethod.payee);
    } else if (this._method?.name === MethodNames.BondExtra) {
      const txMethod = this._method.args as unknown as StakeMoreArgs;
      this.amount(txMethod.maxAdditional);
      this.addToStake(true);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected bond or bondExtra`);
    }
    return tx;
  }

  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._amount, this._controller, this._payee, this._addToStake);
  }

  private validateFields(value: string, controller: string, payee: StakeArgsPayee, addToStake: boolean): void {
    const validationResult = StakeTransactionSchema.validate({
      value,
      controller,
      payee,
      addToStake,
    });
    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Stake Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }
}
