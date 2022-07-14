import { BaseAddress, DotAssetTypes, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { ClaimArgs, MethodNames } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { ClaimTransactionSchema } from './txnSchema';
import utils from './utils';

export class ClaimBuilder extends TransactionBuilder {
  protected _validatorStash: string;
  protected _claimEra: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   *
   * Pay out all the stakers behind a single validator for a single era.
   * Any account can create this transaction.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#payoutstakersvalidator_stash-accountid32-era-u32
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.staking.payoutStakers(
      {
        validatorStash: this._validatorStash,
        era: this._claimEra,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  /**
   * Get the transaction type.
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingClaim;
  }

  /**
   *
   * The stash account of the validator.
   *
   * @param {string} validatorStash
   * @returns {ClaimBuilder} This claim builder.
   *
   */
  validatorStash(validatorStash: BaseAddress): this {
    this.validateAddress(validatorStash);
    this._validatorStash = validatorStash.address;
    return this;
  }

  /**
   * The era to claim.
   *
   * @param {string} claimEra
   * @returns {ClaimBuilder} This claim builder.
   *
   */
  claimEra(claimEra: string): this {
    this.validateValue(new BigNumber(claimEra));
    this._claimEra = claimEra;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.PayoutStakers) {
      const txMethod = decodedTxn.method.args as unknown as ClaimArgs;
      const claimEra = txMethod.era;
      const validatorStash = txMethod.validatorStash;
      const validationResult = ClaimTransactionSchema.validate({ claimEra, validatorStash });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Claim Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.PayoutStakers) {
      const txMethod = this._method.args as ClaimArgs;
      this.validatorStash({
        address: utils.decodeDotAddress(
          txMethod.validatorStash,
          utils.getAddressFormat(this._coinConfig.name as DotAssetTypes)
        ),
      });
      this.claimEra(txMethod.era);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected payoutStakers`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._claimEra, this._validatorStash);
  }

  /**
   *
   * The stash account of the validator.
   *
   * @param {string} claimEra
   * @param {string} validatorStash
   * @throws {Error} If the expected fields are not valid.
   *
   */
  private validateFields(claimEra: string, validatorStash: string): void {
    const validationResult = ClaimTransactionSchema.validate({
      claimEra,
      validatorStash,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Claim Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }
}
