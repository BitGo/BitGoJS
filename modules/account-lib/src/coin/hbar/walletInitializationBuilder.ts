import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { AccountCreateTransaction, ThresholdKey, Ed25519PublicKey } from '@hashgraph/sdk';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionBuilder, DEFAULT_M } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidPublicKey, toUint8Array, toHex } from './utils';
import { KeyPair } from './';
import { TransactionType } from '../baseCoin';

export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: string[] = [];
  private _txBodyData: proto.CryptoCreateTransactionBody;
  private _cryptoBuilder: AccountCreateTransaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.CryptoCreateTransactionBody();
    this._txBody.cryptoCreateAccount = this._txBodyData;
    this._txBodyData.autoRenewPeriod = new proto.Duration({ seconds: 7890000 });
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._cryptoBuilder.setInitialBalance(0).setKey(this.buildOwnersKeys());
    this._sdkTransactionBuilder = this._cryptoBuilder;
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    return super.buildImplementation();
  }

  /**
   *
   * @param {boolean} rawKeys defines if the owners keys are obtained in raw or protocol default format
   * @returns {ThresholdKey} the wallet threshold keys
   */
  private buildOwnersKeys(rawKeys = true): ThresholdKey {
    /* return this._owners.reduce((tKeys, key) => {
      if (tKeys.keys && tKeys.keys.keys) {
        tKeys.keys.keys.push({
          ed25519: toUint8Array(new KeyPair({ pub: key }).getKeys(rawKeys).pub),
        });
      }
      return tKeys;
    }, new proto.ThresholdKey({ threshold: 2, keys: { keys: [] } })); */
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
    this.transaction.setTransactionType(TransactionType.WalletInitialization);
    // TODO: Add initialization for owners
    /* const createAcc = tx.txBody.cryptoCreateAccount;
    if (createAcc && createAcc.key && createAcc.key.thresholdKey) {
      this.initOwners(createAcc.key.thresholdKey as proto.ThresholdKey);
    } */
  }

  private initOwners(keys: proto.ThresholdKey) {
    if (keys.keys && keys.keys.keys) {
      keys.keys.keys.forEach(key => {
        this.owner(toHex(key.ed25519!));
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
