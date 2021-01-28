import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import Long from 'long';
import { AccountId, Ed25519PublicKey } from '@hashgraph/sdk';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BuildTransactionError, InvalidParameterValueError } from '../baseCoin/errors';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { isValidAddress, isValidAmount, isValidPublicKey, isValidTimeString, stringifyAccountId, toHex } from './utils';
import { TransactionType } from '../baseCoin';
import BigNumber from 'bignumber.js';

export class TokenCreateBuilder extends TransactionBuilder {
  private _txBodyData: proto.TokenCreateTransactionBody;
  private _tokenName: string;
  private _tokenSymbol: string;
  private _decimals: string;
  private _initialSupply: string;
  private _treasuryAccountId: string;
  private _adminKey: string;
  private _kycKey: string;
  private _freezeKey: string;
  private _wipeKey: string;
  private _supplyKey: string;
  private _freezeDefault: boolean;
  private _expirationTime: string;
  private _autoRenewAccountId: string;
  private _autoRenewPeriod: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.TokenCreateTransactionBody();
    this._txBody.tokenCreation = this._txBodyData;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.name = this._tokenName;
    this._txBodyData.symbol = this._tokenSymbol;
    this._txBodyData.treasury = this.buildAccountID(this._treasuryAccountId);
    this._txBodyData.expiry = this.buildTimestamp(this._expirationTime);
    if (this._decimals) {
      this._txBodyData.decimals = parseInt(this._decimals);
    }
    if (this._initialSupply) {
      this._txBodyData.initialSupply = Long.fromString(this._initialSupply);
    }
    if (this._adminKey) {
      this._txBodyData.adminKey = this.buildKey(this._adminKey);
    }
    if (this._kycKey) {
      this._txBodyData.kycKey = this.buildKey(this._kycKey);
    }
    if (this._freezeKey) {
      this._txBodyData.freezeKey = this.buildKey(this._freezeKey);
    }
    if (this._wipeKey) {
      this._txBodyData.wipeKey = this.buildKey(this._wipeKey);
    }
    if (this._supplyKey) {
      this._txBodyData.supplyKey = this.buildKey(this._supplyKey);
    }
    if (this._freezeDefault) {
      this._txBodyData.freezeDefault = this._freezeDefault;
    }
    if (this._autoRenewAccountId) {
      this._txBodyData.autoRenewAccount = this.buildAccountID(this._autoRenewAccountId);
    }
    if (this._autoRenewPeriod) {
      this._txBodyData.autoRenewPeriod = this.buildDuration(this._autoRenewPeriod);
    } else {
      this._txBodyData.autoRenewPeriod = this.buildDuration('7890000');
    }
    this.transaction.setTransactionType(TransactionType.TokenCreation);
    return await super.buildImplementation();
  }

  private buildAccountID(address: string): proto.AccountID {
    const accountData = new AccountId(address);
    return new proto.AccountID({
      accountNum: accountData.account,
      realmNum: accountData.realm,
      shardNum: accountData.shard,
    });
  }

  private buildKey(key: string): proto.Key {
    const keyData = Ed25519PublicKey.fromString(key);
    return new proto.Key({
      ed25519: keyData.toBytes(),
    });
  }

  private buildTimestamp(timestamp: string): proto.Timestamp {
    const timeParts = timestamp.split('.').map(v => new BigNumber(v).toNumber());
    return new proto.Timestamp({ seconds: timeParts[0], nanos: timeParts[1] });
  }

  private buildDuration(duration: string): proto.Duration {
    const timeParts = duration.split('.').map(v => new BigNumber(v).toNumber());
    return new proto.Timestamp({ seconds: timeParts[0], nanos: timeParts[1] });
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this.transaction.setTransactionType(TransactionType.TokenCreation);
    const data = tx.txBody.tokenCreation;
    this.expirationTime((Date.now() + 7776000).toString());
    this.autoRenewPeriod('7890000');
    if (data && data.name) {
      this.name(data.name!);
    }
    if (data && data.symbol) {
      this.symbol(data.symbol!);
    }
    if (data && data.decimals) {
      this.decimal(data.decimals!.toString());
    }
    if (data && data.initialSupply) {
      this.initialSupply(data.initialSupply!.toString());
    }
    if (data && data.treasury) {
      this.treasuryAccount(stringifyAccountId(data.treasury!));
    }
    if (data && data.adminKey) {
      this.adminKey(toHex(data.adminKey.ed25519!));
    }
    if (data && data.kycKey) {
      this.kycKey(toHex(data.kycKey.ed25519!));
    }
    if (data && data.freezeKey) {
      this.freezeKey(toHex(data.freezeKey.ed25519!));
    }
    if (data && data.wipeKey) {
      this.wipeKey(toHex(data.wipeKey.ed25519!));
    }
    if (data && data.supplyKey) {
      this.supplyKey(toHex(data.supplyKey.ed25519!));
    }
    if (data && data.freezeDefault) {
      this.freezeDefault(data.freezeDefault!);
    }
    if (data && data.expiry) {
      this.expirationTime(data.expiry.seconds!.toString());
    }
    if (data && data.autoRenewAccount) {
      this.autoRenewAccount(stringifyAccountId(data.autoRenewAccount!));
    }
    if (data && data.autoRenewPeriod) {
      this.autoRenewPeriod(data.autoRenewPeriod.seconds!.toString());
    }
  }

  //region TokenCreateTransaction fields
  name(name: string): this {
    if (name.length > 100) {
      throw new InvalidParameterValueError('Name cannot be longer than 100 characters');
    }
    this._tokenName = name;
    return this;
  }

  symbol(symbol: string): this {
    if (symbol.length > 100) {
      throw new InvalidParameterValueError('Symbol cannot be longer than 100 characters');
    }
    this._tokenSymbol = symbol;
    return this;
  }

  decimal(decimal: string): this {
    if (!isValidAmount(decimal)) {
      throw new InvalidParameterValueError('Invalid decimal');
    }
    this._decimals = decimal;
    return this;
  }

  initialSupply(initialSupply: string): this {
    if (!isValidAmount(initialSupply)) {
      throw new InvalidParameterValueError('Invalid initial supply');
    }
    this._initialSupply = initialSupply;
    return this;
  }

  treasuryAccount(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid treasury account');
    }
    this._treasuryAccountId = address;
    return this;
  }

  adminKey(key: string): this {
    if (!isValidPublicKey(key)) {
      throw new InvalidParameterValueError('Invalid admin key');
    }
    this._adminKey = key;
    return this;
  }

  kycKey(key: string): this {
    if (!isValidPublicKey(key)) {
      throw new InvalidParameterValueError('Invalid kyc key');
    }
    this._kycKey = key;
    return this;
  }

  freezeKey(key: string): this {
    if (!isValidPublicKey(key)) {
      throw new InvalidParameterValueError('Invalid freeze key');
    }
    this._freezeKey = key;
    return this;
  }

  wipeKey(key: string): this {
    if (!isValidPublicKey(key)) {
      throw new InvalidParameterValueError('Invalid wipe key');
    }
    this._wipeKey = key;
    return this;
  }

  supplyKey(key: string): this {
    if (!isValidPublicKey(key)) {
      throw new InvalidParameterValueError('Invalid supply key');
    }
    this._supplyKey = key;
    return this;
  }

  freezeDefault(freeze: boolean): this {
    this._freezeDefault = freeze;
    return this;
  }

  expirationTime(timestamp: string): this {
    if (!isValidTimeString(timestamp)) {
      throw new InvalidParameterValueError('Invalid timestamp');
    }
    this._expirationTime = timestamp;
    return this;
  }

  autoRenewAccount(address: string): this {
    if (!isValidAddress(address)) {
      throw new InvalidParameterValueError('Invalid auto renew account');
    }
    this._autoRenewAccountId = address;
    return this;
  }

  autoRenewPeriod(duration: string): this {
    if (!isValidTimeString(duration)) {
      throw new InvalidParameterValueError('Invalid auto renew period');
    }
    this._autoRenewPeriod = duration;
    return this;
  }

  //endregion

  //region Validators
  validateMandatoryFields(): void {
    if (this._tokenName === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing token name');
    }
    if (this._tokenSymbol === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing token symbol');
    }
    if (this._treasuryAccountId === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing treasury account id');
    }
    if (this._expirationTime === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing expiration time');
    }
    super.validateMandatoryFields();
  }
  //endregion
}
