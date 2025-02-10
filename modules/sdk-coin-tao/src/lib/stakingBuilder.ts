// src/lib/stakingBuilder.ts
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { createType } from '@polkadot/types';
import { methods } from '@substrate/txwrapper-substrate';
import BigNumber from 'bignumber.js';
import utils from './utils';
import { BaseAddress, DotAssetTypes, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { MethodNames, StakeArgs, StakeArgsPayee, StakeArgsPayeeRaw, StakeMoreArgs } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { StakeTransactionSchema } from './txnSchema';

export class StakingBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _controller: string;
  protected _payee: StakeArgsPayee;
  protected _addToStake: boolean;

  // New property to store validity values
  protected _validityWindow?: { firstValid: number; maxDuration: number };

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  // Override validity to store the window locally
  validity(validityWindow: { firstValid: number; maxDuration: number }): this {
    this._validityWindow = validityWindow;
    return super.validity(validityWindow);
  }

  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();

    // If a validity window is set, override the era option with a mortal era.
    if (this._validityWindow && this._validityWindow.firstValid && this._validityWindow.maxDuration) {
      // Create an ExtrinsicEra type using the registry from the options.
      // (Cast options to 'any' to allow setting the 'era' property.)
      (baseTxInfo.options as any).era = createType(baseTxInfo.options.registry, 'ExtrinsicEra', {
        current: this._validityWindow.firstValid,
        period: this._validityWindow.maxDuration,
      });
    }

    if (this._addToStake) {
      return methods.staking.bondExtra(
        {
          maxAdditional: this._amount,
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    } else {
      return methods.staking.bond(
        {
          value: this._amount,
          payee: this._payee,
        },
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
      // Convert the payee object to a BaseAddress by mapping 'Account' to 'address'
      this.validateAddress({ address: payee.Account });
      this._payee = { Account: payee.Account };
    } else {
      this._payee = payee;
    }
    return this;
  }

  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    // Check if the decoded method name is either Bond or (legacy) upgradeAccounts.
    if (decodedTxn.method?.name === MethodNames.Bond || decodedTxn.method?.name === 'upgradeAccounts') {
      const txMethod = decodedTxn.method.args as unknown as StakeArgs;
      const value = txMethod.value;
      const controller = this._sender; // may be empty for unsigned tx
      const payee = txMethod.payee;
      const validationResult = StakeTransactionSchema.validate({ value, controller, payee });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    } else if (decodedTxn.method?.name === MethodNames.BondExtra) {
      const txMethod = decodedTxn.method.args as unknown as StakeMoreArgs;
      const value = txMethod.maxAdditional;
      const validationResult = StakeTransactionSchema.validate({ value, addToStake: true });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if ((this._method?.name as string) === 'upgradeAccounts' || this._method?.name === MethodNames.Bond) {
      const txMethod = this._method!.args as unknown as StakeArgs;
      this.amount(txMethod.value);
      // Only decode and set owner if a sender was decoded.
      if (this._sender) {
        this.owner({
          address: utils.decodeDotAddress(this._sender, utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)),
        });
      }
      const payee = txMethod.payee as StakeArgsPayeeRaw;
      if (payee.account) {
        this.payee({
          Account: utils.decodeDotAddress(
            payee.account,
            utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
          ),
        });
      } else {
        const payeeType = utils.capitalizeFirstLetter(Object.keys(payee)[0]) as StakeArgsPayee;
        this.payee(payeeType);
      }
    } else if (this._method?.name === MethodNames.BondExtra) {
      const txMethod = this._method!.args as StakeMoreArgs;
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
