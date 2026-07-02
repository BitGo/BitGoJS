import { TransactionType, InvalidTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction as VetTransaction, Secp256k1 } from '@vechain/sdk-core';

import { Transaction } from './transaction';
import { VetTransactionData } from '../iface';

export class FlushCoinsTransaction extends Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.FlushCoins;
  }

  /** @inheritdoc */
  buildClauses(): void {
    this._clauses = [
      {
        to: this._contract,
        value: '0x0',
        data: this._transactionData,
      },
    ];
  }

  /** @inheritdoc */
  toJson(): VetTransactionData {
    return {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      data: this.transactionData,
      value: '0',
      sender: this.sender,
      to: this.contract,
    };
  }

  /** @inheritdoc */
  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      this.rawTransaction = signedTx;

      const body = signedTx.body;
      this.chainTag = typeof body.chainTag === 'number' ? body.chainTag : 0;
      this.blockRef = body.blockRef || '0x0';
      this.expiration = typeof body.expiration === 'number' ? body.expiration : 64;
      this.clauses = body.clauses || [];
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = typeof body.gas === 'number' ? body.gas : Number(body.gas) || 0;
      this.dependsOn = body.dependsOn || null;
      this.nonce = String(body.nonce);
      this.contract = body.clauses[0]?.to || '0x0';
      this.transactionData = body.clauses[0]?.data || '0x0';
      this.type = TransactionType.FlushCoins;

      try {
        if (signedTx.origin) {
          this.sender = signedTx.origin.toString().toLowerCase();
        }
      } catch {
        // unsigned transaction has no origin
      }

      if (signedTx.signature) {
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));
        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }
}
