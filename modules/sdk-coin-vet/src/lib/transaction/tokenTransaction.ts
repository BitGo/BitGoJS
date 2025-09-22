import assert from 'assert';
import { Secp256k1, Transaction as VetTransaction } from '@vechain/sdk-core';

import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { Transaction } from './transaction';
import utils from '../utils';

import { VetTransactionData } from '../iface';

export class TokenTransaction extends Transaction {
  private _tokenAddress: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.Send;
  }

  get tokenAddress(): string {
    return this._tokenAddress;
  }

  set tokenAddress(address: string) {
    this._tokenAddress = address;
  }

  buildClauses(): void {
    if (!this.tokenAddress) {
      throw new Error('Token address is not set');
    }
    this.clauses = this.recipients.map((recipient) => {
      const data = utils.getTransferTokenData(recipient.address, String(recipient.amount));
      return {
        to: this.tokenAddress,
        value: '0x0',
        data,
      };
    });
  }

  toJson(): VetTransactionData {
    const json: VetTransactionData = {
      id: this.id,
      chainTag: this.chainTag,
      blockRef: this.blockRef,
      expiration: this.expiration,
      recipients: this.recipients,
      gasPriceCoef: this.gasPriceCoef,
      gas: this.gas,
      dependsOn: this.dependsOn,
      nonce: this.nonce,
      sender: this.sender,
      feePayer: this.feePayerAddress,
      tokenAddress: this.tokenAddress,
    };

    return json;
  }

  fromDeserializedSignedTransaction(signedTx: VetTransaction): void {
    try {
      if (!signedTx || !signedTx.body) {
        throw new InvalidTransactionError('Invalid transaction: missing transaction body');
      }

      // Store the raw transaction
      this.rawTransaction = signedTx;

      // Set transaction body properties
      const body = signedTx.body;
      this.chainTag = body.chainTag;
      this.blockRef = body.blockRef;
      this.expiration = body.expiration;
      this.clauses = body.clauses;
      this.gasPriceCoef = typeof body.gasPriceCoef === 'number' ? body.gasPriceCoef : 128;
      this.gas = Number(body.gas);
      this.dependsOn = body.dependsOn;
      this.nonce = String(body.nonce);
      // Set recipients from clauses
      assert(body.clauses[0].to, 'token address not found in the clauses');
      this.tokenAddress = body.clauses[0].to;
      this.recipients = body.clauses.map((clause) => utils.decodeTransferTokenData(clause.data));
      this.loadInputsAndOutputs();

      // Set sender address
      if (signedTx.signature && signedTx.origin) {
        this.sender = signedTx.origin.toString().toLowerCase();
      }

      // Set signatures if present
      if (signedTx.signature) {
        // First signature is sender's signature
        this.senderSignature = Buffer.from(signedTx.signature.slice(0, Secp256k1.SIGNATURE_LENGTH));

        // If there's additional signature data, it's the fee payer's signature
        if (signedTx.signature.length > Secp256k1.SIGNATURE_LENGTH) {
          this.feePayerSignature = Buffer.from(signedTx.signature.slice(Secp256k1.SIGNATURE_LENGTH));
        }
      }
    } catch (e) {
      throw new InvalidTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
  }
}
