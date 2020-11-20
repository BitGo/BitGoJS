import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BuildTransactionError, NotImplementedError } from '../baseCoin/errors';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';

export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  // endregion

  // region Common builder methods
  /**
   * Set one of the owners of the multisig wallet.
   *
   * @param {string} address The public key of the owner's account
   * @returns {WalletInitializationBuilder} This wallet initialization builder
   */
  owner(address: string): this {
    if (this._owners.length >= DEFAULT_M) {
      throw new BuildTransactionError('A maximum of ' + DEFAULT_M + ' owners can be set for a multisig wallet');
    }
    // TODO : isValidPublicKey
    if (this._owners.includes(address)) {
      throw new BuildTransactionError('Repeated owner address: ' + address);
    }
    this._owners.push(address);
    return this;
  }
  // endregion

  // region Validators
  validateMandatoryFields(): void {
    if (this._owners === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing wallet owners');
    }

    if (this._owners.length !== DEFAULT_M) {
      throw new BuildTransactionError(
        `Invalid transaction: wrong number of owners -- required: ${DEFAULT_M}, found: ${this._owners.length}`,
      );
    }
    super.validateMandatoryFields();
  }
  // endregion
}
