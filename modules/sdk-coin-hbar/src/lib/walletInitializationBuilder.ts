import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as Long from 'long';
import { proto } from '@hashgraph/proto';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidPublicKey, toHex, toUint8Array } from './utils';
import { KeyPair } from './';
import { DEFAULT_SIGNER_NUMBER } from './constants';

export class WalletInitializationBuilder extends TransactionBuilder {
  private readonly _txBodyData: proto.CryptoCreateTransactionBody;
  private _owners: string[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.CryptoCreateTransactionBody();
    this._txBody.cryptoCreateAccount = this._txBodyData;
    this._txBodyData.autoRenewPeriod = new proto.Duration({ seconds: Long.fromNumber(7890000) });
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.key = { thresholdKey: this.buildOwnersKeys() };
    this._txBodyData.initialBalance = Long.ZERO;
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    return await super.buildImplementation();
  }

  /**
   *
   * @param {boolean} rawKeys - Defines if the owners keys are obtained in raw or protocol default format
   * @returns {proto.ThresholdKey} - The wallet threshold keys
   */
  private buildOwnersKeys(rawKeys = true): proto.ThresholdKey {
    return this._owners.reduce((tKeys, key) => {
      if (tKeys.keys && tKeys.keys.keys) {
        tKeys.keys.keys.push({
          ed25519: toUint8Array(new KeyPair({ pub: key }).getKeys(rawKeys).pub),
        });
      }
      return tKeys;
    }, new proto.ThresholdKey({ threshold: 2, keys: { keys: [] } }));
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const createAcc = tx.txBody.cryptoCreateAccount;
    if (createAcc && createAcc.key && createAcc.key.thresholdKey) {
      this.initOwners(createAcc.key.thresholdKey as proto.ThresholdKey);
    }
  }

  private initOwners(keys: proto.ThresholdKey) {
    if (keys.keys && keys.keys.keys) {
      keys.keys.keys.forEach((key) => {
        this.owner(toHex(key.ed25519!));
      });
    }
  }
  // endregion

  // region Common builder methods
  /**
   * Set one of the owners of the multisig wallet.
   *
   * @param {string} address - The public key of the owner's account
   * @returns {WalletInitializationBuilder} - This wallet initialization builder
   */
  owner(address: string): this {
    if (this._owners.length >= DEFAULT_SIGNER_NUMBER) {
      throw new BuildTransactionError(
        'A maximum of ' + DEFAULT_SIGNER_NUMBER + ' owners can be set for a multisig wallet'
      );
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

    if (this._owners.length !== DEFAULT_SIGNER_NUMBER) {
      throw new BuildTransactionError(
        `Invalid transaction: wrong number of owners -- required: ${DEFAULT_SIGNER_NUMBER}, found: ${this._owners.length}`
      );
    }
    super.validateMandatoryFields();
  }
  // endregion
}
