import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { AccountCreateTransaction, ThresholdKey } from '@hashgraph/sdk';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidPublicKey, toHex } from './utils';
import { KeyPair } from './';

export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: string[] = [];
  private _cryptoBuilder: AccountCreateTransaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._cryptoBuilder = new AccountCreateTransaction();
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._cryptoBuilder
      .setInitialBalance(0)
      .setKey(this.buildOwnersKeys())
      .setAutoRenewPeriod(7890000);
    this._sdkTransactionBuilder = this._cryptoBuilder;
    return super.buildImplementation();
  }

  /**
   * Build the owner keys on its threshold object
   *
   * @returns {ThresholdKey} the wallet threshold keys
   */
  private buildOwnersKeys(): ThresholdKey {
    const threshold = new ThresholdKey(2);
    this._owners.forEach(owner => {
      const pub = new KeyPair({ pub: owner }).getSDKKeys().pub;
      threshold.add(pub);
    });

    return threshold;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const createAcc = tx.hederaTx
      ._toProto()
      .getBody()!
      .getCryptocreateaccount();
    if (createAcc && createAcc.getKey() && createAcc.getKey()!.getThresholdkey()) {
      createAcc
        .getKey()!
        .getThresholdkey()!
        .getKeys()!
        .getKeysList()
        .forEach(key => {
          this.owner(toHex(key.getEd25519_asU8()!));
        });
    }
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
    if (!isValidPublicKey(address)) {
      throw new BuildTransactionError('Invalid address: ' + address);
    }
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
