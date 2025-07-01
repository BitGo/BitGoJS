import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BuildTransactionError } from '@bitgo/sdk-core';
import { Principal } from '@dfinity/principal';
import { sha256 } from 'js-sha256';
import BigNumber from 'bignumber.js';

export class StakingValidationWarning extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StakingValidationWarning';
  }
}

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import utils from './utils';
import { IcpTransactionData, OperationType, DEFAULT_MEMO } from './iface';

export interface StakingOptions {
  senderPublicKey: string;
  amountToStakeE8s: string;
  neuronMemo?: bigint;
  feeE8s?: string;
  dissolveDelaySeconds?: number;
}

export class StakingBuilder extends TransactionBuilder {
  private readonly GOVERNANCE_CANISTER_ID = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
  private readonly DEFAULT_FEE_E8S = '10000'; // 0.0001 ICP
  private readonly MIN_DISSOLVE_DELAY_FOR_VOTING = 6 * 30 * 24 * 60 * 60; // 6 months in seconds

  private amountToStakeE8s: string;
  private neuronMemo: bigint;
  private feeE8s: string;
  private dissolveDelaySeconds?: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._transaction = new Transaction(coinConfig);
  }

  private getNeuronSubaccount(controllerPrincipal: Principal, memo: bigint): Uint8Array {
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64BE(memo);
    const domainSeparator = Buffer.from([0x0c]);
    const context = Buffer.from('neuron-stake', 'utf8');
    const principalBytes = controllerPrincipal.toUint8Array();

    const hashInput = Buffer.concat([domainSeparator, context, Buffer.from(principalBytes), nonceBuf]);
    return Uint8Array.from(sha256.create().update(hashInput).array());
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.validateAmount();
    this.validateDissolveDelay();
    this.validateTransactionData();

    if (!this._publicKey) {
      throw new BuildTransactionError('Public key is required');
    }
    const controllerPrincipal = utils.derivePrincipalFromPublicKey(this._publicKey);
    const subaccount = this.getNeuronSubaccount(controllerPrincipal, this.neuronMemo);
    const neuronAccountId = utils.fromPrincipal(this.GOVERNANCE_CANISTER_ID, subaccount);
    const receiverAddress = neuronAccountId;

    // Let utils.getMetaData handle the time calculations with default behavior
    const currentTime = Date.now() * 1000_000;
    const { metaData } = utils.getMetaData(this.neuronMemo, currentTime, undefined);

    if (!metaData.ingress_end) {
      throw new BuildTransactionError('Failed to generate ingress expiry time');
    }

    const transactionData: IcpTransactionData = {
      senderAddress: this._sender,
      receiverAddress,
      amount: this.amountToStakeE8s,
      fee: this.feeE8s,
      senderPublicKeyHex: this._publicKey,
      memo: this.neuronMemo,
      transactionType: OperationType.TRANSACTION,
      expiryTime: metaData.ingress_end,
      additionalData: {
        dissolveDelaySeconds: this.dissolveDelaySeconds,
      },
    };

    this._transaction.icpTransactionData = transactionData;
    return this._transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    // The actual signing is handled by the TSS signing process
    // This implementation just returns the transaction
    return this._transaction;
  }

  private validateAmount(): void {
    if (!this.amountToStakeE8s) {
      throw new BuildTransactionError('Staking amount is required');
    }
    utils.validateValue(new BigNumber(this.amountToStakeE8s));
  }

  private validateDissolveDelay(): void {
    if (this.dissolveDelaySeconds !== undefined) {
      if (this.dissolveDelaySeconds < 0) {
        throw new BuildTransactionError('Dissolve delay cannot be negative');
      }
      if (this.dissolveDelaySeconds < this.MIN_DISSOLVE_DELAY_FOR_VOTING) {
        throw new StakingValidationWarning(
          `Dissolve delay of ${this.dissolveDelaySeconds} seconds is less than ` +
            `the minimum ${this.MIN_DISSOLVE_DELAY_FOR_VOTING} seconds required for voting rights`
        );
      }
    }
  }

  public amount(value: string): this {
    if (!value) {
      throw new BuildTransactionError('Amount value is required');
    }
    utils.validateValue(new BigNumber(value));
    this.amountToStakeE8s = value;
    return this;
  }

  public override memo(value: number): this {
    utils.validateMemo(value);
    this.neuronMemo = BigInt(value);
    return this;
  }

  public fee(value: string): this {
    if (!value) {
      throw new BuildTransactionError('Fee value is required');
    }
    utils.validateFee(value);
    this.feeE8s = value;
    return this;
  }

  public dissolveDelay(seconds: number): this {
    this.dissolveDelaySeconds = seconds;
    return this;
  }

  public override sender(address: string, publicKey: string): this {
    if (!utils.isValidAddress(address)) {
      throw new BuildTransactionError('Invalid sender address');
    }
    if (!utils.isValidPublicKey(publicKey)) {
      throw new BuildTransactionError('Invalid sender public key');
    }
    super.sender(address, publicKey);
    this.neuronMemo = BigInt(DEFAULT_MEMO);
    this.feeE8s = this.feeE8s || this.DEFAULT_FEE_E8S;
    return this;
  }

  private validateTransactionData(): void {
    if (!this._publicKey || !utils.isValidPublicKey(this._publicKey)) {
      throw new BuildTransactionError('Invalid or missing public key');
    }
    if (this.feeE8s) {
      utils.validateFee(this.feeE8s);
    }
    utils.validateExpireTime(this._transaction.icpTransactionData.expiryTime);
  }

  public getTransactionId(): string {
    if (!this._transaction.icpTransactionData) {
      throw new BuildTransactionError('Transaction data is required');
    }
    return utils.getTransactionId(
      this._transaction.unsignedTransaction,
      this._transaction.icpTransactionData.senderAddress,
      this._transaction.icpTransactionData.receiverAddress
    );
  }
}
