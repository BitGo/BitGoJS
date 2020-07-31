import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import * as hex from '@stablelib/hex';
import BigNumber from 'bignumber.js';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidPublicKey, toUint8Array } from './utils';
import { KeyPair } from './';

const DEFAULT_M = 3;
export class WalletInitializationBuilder extends TransactionBuilder {
  private _owners: string[] = [];
  private _txBody: proto.TransactionBody;
  private _txBodyData: proto.CryptoCreateTransactionBody;
  private readonly _duration: proto.Duration = new proto.Duration({ seconds: 120 });

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBody = new proto.TransactionBody();
    this._txBody.transactionValidDuration = this._duration;
    this._txBodyData = new proto.CryptoCreateTransactionBody();
    this._txBody.cryptoCreateAccount = this._txBodyData;
    this._txBodyData.autoRenewPeriod = new proto.Duration({ seconds: 7890000 });
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.key = { thresholdKey: this.buildOwnersKeys() };
    this._txBodyData.initialBalance = 0;
    this._txBody.transactionFee = new BigNumber(this._fee.fee).toNumber(); // validate
    this._txBody.transactionID = this.buildTxId();
    this._txBody.nodeAccountID = new proto.AccountID({ accountNum: 4 });
    const hTransaction = this._transaction.hederaTx || new proto.Transaction();
    hTransaction.bodyBytes = proto.TransactionBody.encode(this._txBody).finish();

    const transaction = new Transaction(this._coinConfig);
    transaction.body(hTransaction);
    for (const kp of this._multiSignerKeyPairs) {
      await transaction.sign(kp);
    }
    return transaction;
  }

  private buildOwnersKeys(): proto.ThresholdKey {
    return this._owners.reduce((tKeys, key) => {
      if (tKeys.keys && tKeys.keys.keys) {
        tKeys.keys.keys.push({
          ed25519: toUint8Array(new KeyPair({ pub: key }).getKeys(true).pub),
        });
      }
      return tKeys;
    }, new proto.ThresholdKey({ threshold: 2, keys: { keys: [] } }));
  }

  /** @inheritdoc */
  protected initBuilder(tx: Transaction) {
    super.initBuilder(tx);
    const createAcc = tx.txBody.cryptoCreateAccount;
    if (createAcc && createAcc.key && createAcc.key.thresholdKey) {
      this.initOwners(createAcc.key.thresholdKey as proto.ThresholdKey);
    }
  }

  private initOwners(keys: proto.ThresholdKey) {
    if (keys.keys && keys.keys.keys) {
      keys.keys.keys.forEach(key => {
        this.owner(hex.encode(key.ed25519!));
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
