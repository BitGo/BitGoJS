import { Interface, Schema, Transaction, TransactionBuilder } from '@bitgo/abstract-substrate';
import { InvalidTransactionError, TransactionType, BaseAddress } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import { ClaimRootTransaction } from './claimRootTransaction';

export class ClaimRootBuilder extends TransactionBuilder {
  protected _hotkey: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new ClaimRootTransaction(_coinConfig);
  }

  /** @inheritdoc */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.claimRootWithHotkey({ hotkey: this._hotkey }, baseTxInfo);
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingClaim;
  }

  /**
   * Set the hotkey address for the claim
   * @param {string} address hotkey address to claim rewards for
   * @returns {ClaimRootBuilder} This builder.
   */
  hotkey({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._hotkey = address;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name !== Interface.MethodNames.ClaimRootWithHotkey) {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${Interface.MethodNames.ClaimRootWithHotkey}`
      );
    }
    const txMethod = this._method.args as Interface.ClaimRootWithHotkeyArgs;
    this.hotkey({ address: txMethod.hotkey });
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._hotkey);
  }

  private validateFields(hotkey: string): void {
    const validationResult = Schema.ClaimRootWithHotkeyTransactionSchema.validate({ hotkey });
    if (validationResult.error) {
      throw new InvalidTransactionError(
        `ClaimRoot Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === Interface.MethodNames.ClaimRootWithHotkey) {
      const txMethod = decodedTxn.method.args as unknown as Interface.ClaimRootWithHotkeyArgs;
      const validationResult = Schema.ClaimRootWithHotkeyTransactionSchema.validate({ hotkey: txMethod.hotkey });
      if (validationResult.error) {
        throw new InvalidTransactionError(
          `ClaimRoot Transaction validation failed: ${validationResult.error.message}`
        );
      }
    }
  }

  private claimRootWithHotkey(
    args: Interface.ClaimRootWithHotkeyArgs,
    info: Interface.CreateBaseTxInfo
  ): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'claimRootWithHotkey',
          pallet: 'subtensorModule',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
