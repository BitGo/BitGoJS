import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BuildTransactionError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidPublicKey } from './utils';
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

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.key = { thresholdKey: this.buildOwnersKeys() };
    this._txBodyData.initialBalance = 0;
    this._txBody.transactionFee = +new BigNumber(this._fee.fee); // validate
    this._txBody.transactionID = this.buildTxId();
    this._txBody.nodeAccountID = new proto.AccountID({ accountNum: 4 });
    const hTransaction = new proto.Transaction();
    hTransaction.bodyBytes = proto.TransactionBody.encode(this._txBody).finish();

    const transaction = new Transaction(this._coinConfig);
    transaction.body(hTransaction);
    return transaction;
  }

  private buildTxId(): proto.TransactionID {
    const accString = this._source.address.split('.').pop();
    const acc = +new BigNumber(accString!);
    return new proto.TransactionID({
      transactionValidStart: { seconds: new Date().getTime() / 1000, nanos: 0 },
      accountID: { accountNum: acc },
    });
  }

  private buildOwnersKeys(): proto.ThresholdKey {
    return this._owners.reduce((tKeys, key) => {
      if (tKeys.keys && tKeys.keys.keys) {
        tKeys.keys.keys.push({
          ed25519: new KeyPair({ pub: key }).getKeys().pub,
        });
      }
      return tKeys;
    }, new proto.ThresholdKey({ threshold: 2, keys: { keys: [] } }));
  }
}
