import { BaseKey, BaseTransaction, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  MultiHashSignature,
  OnboardingTransaction,
  PreparedParty,
  TransactionExplanation,
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

    // Validate critical fields
    if (!this._preparedParty.multiHash) {
      throw new InvalidTransactionError('Missing multiHash from IMS preparedParty.');
    }

    const multiHash = Buffer.from(this._preparedParty.multiHash, 'base64');
    const topologyTxs = this._preparedParty.topologyTransactions;

    // CRITICAL: Topology transactions are REQUIRED for wallet initialization signing
    // Canton's signing contract for WalletInit requires:
    // [txnType (4 bytes, if version >0.5.x)] || itemCount || [lenOfTx || tx]... || multiHash
    // Returning multiHash-only breaks the signing payload structure
    if (!topologyTxs || topologyTxs.length === 0) {
      throw new InvalidTransactionError('Missing or empty topologyTransactions from IMS.');
    }

    const shouldIncludeTxnType = this._preparedParty.shouldIncludeTxnType ?? false;
    const itemCount = topologyTxs.length + 1; // topology txs + multiHash
    const parts: Buffer[] = [];

    try {
      // Optional txnType prefix for Splice version >0.5.x
      // shouldIncludeTxnType is set by IMS based on the Splice version during buildCantonTopologyAndTransaction
      if (shouldIncludeTxnType) {
        const txnTypeBuf = Buffer.alloc(4);
        txnTypeBuf.writeUInt32LE(0, 0); // txnType value for wallet initialization
        parts.push(txnTypeBuf);
      }

      // Item count (UInt32LE)
      // Count includes: all topology transactions + 1 for the multiHash
      const itemCountBuf = Buffer.alloc(4);
      itemCountBuf.writeUInt32LE(itemCount, 0);
      parts.push(itemCountBuf);

      // Topology transactions with length prefixes
      // Each transaction is prefixed with its length (UInt32LE) for parsing
      for (let i = 0; i < topologyTxs.length; i++) {
        const tx = topologyTxs[i];
        if (!tx) {
          throw new InvalidTransactionError(`Topology transaction at index ${i} is null.`);
        }

        try {
          const txBuf = Buffer.from(tx, 'base64');

          // Validate base64 was decoded successfully (round-trip check)
          if (txBuf.toString('base64') !== tx) {
            throw new Error('Invalid base64 encoding');
          }

          const lenBuf = Buffer.alloc(4);
          lenBuf.writeUInt32LE(txBuf.length, 0);
          parts.push(lenBuf, txBuf);
        } catch (e) {
          throw new InvalidTransactionError(
            `Failed to decode topology transaction at index ${i}: ` + `${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      // Append multiHash (Canton's hash of party configuration)
      parts.push(multiHash);

      return Buffer.concat(parts);
    } catch (e) {
      if (e instanceof InvalidTransactionError) {
        throw e;
      }
      throw new InvalidTransactionError(
        `Failed to construct wallet init payload: ${e instanceof Error ? e.message : String(e)}`
      );
    }
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

  explainTransaction(): TransactionExplanation {
    const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'];
    return {
      id: this.id,
      displayOrder,
      outputs: [],
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: '0' },
      type: this.type,
    };
  }
}
