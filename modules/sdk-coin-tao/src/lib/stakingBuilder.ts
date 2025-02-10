// src/lib/stakingBuilder.ts
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { createType } from '@polkadot/types';
import { methods } from '@substrate/txwrapper-substrate';
import BigNumber from 'bignumber.js';
import { BaseAddress, InvalidTransactionError, TransactionType, DotAssetTypes } from '@bitgo/sdk-core';
import { MethodNames, StakeArgs, StakeArgsPayee, StakeArgsPayeeRaw, StakeMoreArgs } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { StakeTransactionSchema } from './txnSchema';
import utils from './utils';

export class StakingBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _controller: string;
  protected _payee: StakeArgsPayee;
  protected _addToStake: boolean;
  // Store the validity window provided via the validity() setter.
  protected _validityWindow?: { firstValid: number; maxDuration: number };

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  // Override validity() to store the validity window locally.
  validity(validityWindow: { firstValid: number; maxDuration: number }): this {
    this._validityWindow = validityWindow;
    return super.validity(validityWindow);
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    if (
      this._validityWindow &&
      this._validityWindow.firstValid &&
      this._validityWindow.maxDuration &&
      baseTxInfo.options.registry
    ) {
      // Force a mortal era on the unsigned options.
      (baseTxInfo.options as any).era = createType(baseTxInfo.options.registry, 'ExtrinsicEra', {
        current: this._validityWindow.firstValid,
        period: this._validityWindow.maxDuration,
      });
    }
    let tx: UnsignedTransaction;
    if (this._addToStake) {
      tx = methods.staking.bondExtra({ maxAdditional: this._amount }, baseTxInfo.baseTxInfo, baseTxInfo.options);
    } else {
      // Pass the controller along with value and payee.
      tx = methods.staking.bond(
        { controller: this._controller, value: this._amount, payee: this._payee },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    }
    // If the transaction is signed, override its signature’s era if needed.
    if (this._validityWindow && (tx as any).signature && baseTxInfo.options.registry) {
      const currentEra = (tx as any).signature.era;
      if (currentEra && currentEra.isImmortalEra) {
        (tx as any).signature.era = createType(baseTxInfo.options.registry, 'ExtrinsicEra', {
          current: this._validityWindow.firstValid,
          period: this._validityWindow.maxDuration,
        });
      }
    }
    return tx;
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
      // Use the correct property name as expected in user input: 'Account'
      this.validateAddress({ address: payee.Account });
      this._payee = { Account: payee.Account };
    } else {
      this._payee = payee;
    }
    return this;
  }

  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.Bond || decodedTxn.method?.name === 'upgradeAccounts') {
      const txMethod = decodedTxn.method.args as unknown as StakeArgs;
      const rawValue = txMethod.value;
      // If the value appears as a lookup (e.g. "Lookup54"), use the stored _amount.
      const value =
        typeof rawValue === 'string' && rawValue.startsWith('Lookup')
          ? this._amount || '0'
          : new BigNumber(rawValue).toString();
      const controller = this._controller;
      const payee = txMethod.payee;
      const validationResult = StakeTransactionSchema.validate({
        value,
        controller,
        payee,
      });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    } else if (decodedTxn.method?.name === MethodNames.BondExtra) {
      const txMethod = decodedTxn.method.args as unknown as StakeMoreArgs;
      const value = new BigNumber(txMethod.maxAdditional).toString();
      const validationResult = StakeTransactionSchema.validate({
        value,
        addToStake: true,
      });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if ((this._method?.name as string) === 'upgradeAccounts' || this._method?.name === MethodNames.Bond) {
      const txMethod = this._method!.args as unknown as StakeArgs;
      const rawValue = txMethod.value;
      const valueStr =
        typeof rawValue === 'string' && rawValue.startsWith('Lookup')
          ? this._amount || '0'
          : new BigNumber(rawValue).toString();
      this.amount(valueStr);
      // Expect the controller to be already set via owner()
      if (this._controller) {
        this.owner({ address: this._controller });
      }
      const payee = txMethod.payee as StakeArgsPayeeRaw | undefined;
      if (payee) {
        if (payee.account) {
          this.payee({
            Account: utils.decodeDotAddress(
              payee.account,
              utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
            ),
          });
        } else {
          const keys = Object.keys(payee);
          if (keys.length > 0) {
            const payeeType = utils.capitalizeFirstLetter(keys[0]) as StakeArgsPayee;
            this.payee(payeeType);
          } else {
            this.payee('Staked');
          }
        }
      } else {
        this.payee('Staked');
      }
    } else if (this._method?.name === MethodNames.BondExtra) {
      const txMethod = this._method!.args as StakeMoreArgs;
      this.amount(new BigNumber(txMethod.maxAdditional).toString());
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
