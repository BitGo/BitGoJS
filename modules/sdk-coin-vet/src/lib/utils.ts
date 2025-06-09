import { BaseUtils, TransactionType } from '@bitgo/sdk-core';
import { VET_TRANSACTION_ID_LENGTH } from './constants';
import { KeyPair } from './keyPair';
import { HexUInt, Transaction, TransactionClause } from '@vechain/sdk-core';

export class Utils implements BaseUtils {
  isValidAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  isValidBlockId(hash: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidPrivateKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidPublicKey(key: string): boolean {
    try {
      new KeyPair({ pub: key });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidTransactionId(txId: string): boolean {
    return this.isValidHex(txId, VET_TRANSACTION_ID_LENGTH);
  }

  isValidHex(value: string, length: number): boolean {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  deserializeTransaction(serializedTransaction: string): Transaction {
    const txBytes = HexUInt.of(serializedTransaction).bytes;
    try {
      return Transaction.decode(txBytes, false);
    } catch (err) {
      if (err.message?.includes('Expected 9 items, but got 10')) {
        // Likely signed, so retry with isSigned = true
        return Transaction.decode(txBytes, true);
      }
      throw err;
    }
  }

  getTransactionTypeFromClause(clauses: TransactionClause[]): TransactionType {
    if (clauses[0].data === '0x') {
      return TransactionType.Send;
    } else {
      return TransactionType.SendToken;
    }
  }
}

const utils = new Utils();

export default utils;
