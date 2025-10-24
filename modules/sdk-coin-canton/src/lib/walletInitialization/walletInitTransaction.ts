import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  MultiHashSignature,
  OnboardingTransaction,
  PreparedParty,
  WalletInitBroadcastData,
  WalletInitTxData,
} from '../iface';
import { SIGNATURE_ALGORITHM_SPEC, SIGNATURE_FORMAT } from '../constant';

export class WalletInitTransaction extends BaseTransaction {
  private _preparedParty: PreparedParty;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  get preparedParty(): PreparedParty {
    return this._preparedParty;
  }

  set preparedParty(transaction: PreparedParty) {
    this._preparedParty = transaction;
    this._id = transaction.multiHash;
    this._type = TransactionType.WalletInitialization;
  }

  canSign(key: BaseKey): boolean {
    return false;
  }

  set signatures(signature: string) {
    this._signatures.push(signature);
  }

  toBroadcastFormat(): string {
    if (!this._preparedParty) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const multiHashSignatures: MultiHashSignature[] = [];
    if (this.signature.length > 0) {
      this.signature.map((signature) => {
        const multiHashSignature: MultiHashSignature = {
          format: SIGNATURE_FORMAT,
          signature: signature,
          signedBy: this._preparedParty.publicKeyFingerprint,
          signingAlgorithmSpec: SIGNATURE_ALGORITHM_SPEC,
        };
        multiHashSignatures.push(multiHashSignature);
      });
    }
    const walletInitBroadcastData: WalletInitBroadcastData = {
      preparedParty: this._preparedParty,
      onboardingTransactions: this._preparedParty.topologyTransactions.map((txn) => {
        const onboardingTransaction: OnboardingTransaction = {
          transaction: txn,
        };
        return onboardingTransaction;
      }),
      multiHashSignatures: multiHashSignatures,
    };
    return Buffer.from(JSON.stringify(walletInitBroadcastData)).toString('base64');
  }

  toJson(): WalletInitTxData {
    if (!this._preparedParty) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    const result: WalletInitTxData = {
      id: this.id,
      type: this._type as TransactionType,
      preparedParty: this._preparedParty,
    };
    return result;
  }

  get signablePayload(): Buffer {
    if (!this._preparedParty) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return Buffer.from(this._preparedParty.multiHash, 'base64');
  }

  fromRawTransaction(rawTx: string): void {
    try {
      const decoded: WalletInitBroadcastData = JSON.parse(Buffer.from(rawTx, 'base64').toString('utf8'));
      this._preparedParty = decoded.preparedParty;
      this._type = TransactionType.WalletInitialization;
      this._id = decoded.preparedParty.multiHash;
      if (decoded.multiHashSignatures.length > 0) {
        decoded.multiHashSignatures.map((multiHashSignature: MultiHashSignature) => {
          this.signatures = multiHashSignature.signature;
        });
      }
    } catch (e) {
      throw new InvalidTransactionError('Unable to parse raw transaction data');
    }
  }
}
