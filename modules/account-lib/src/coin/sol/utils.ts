import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import BigNumber from 'bignumber.js';

const DECODED_BLOCK_HASH_LENGTH = 32; // https://docs.solana.com/developing/programming-model/transactions#blockhash-format
const DECODED_ADDRESS_LENGTH = 32; // https://docs.solana.com/developing/programming-model/transactions#account-address-format
const DECODED_SIGNATURE_LENGTH = 64; // https://docs.solana.com/terminology#signature
const BASE_58_ENCONDING_REGEX = '[1-9A-HJ-NP-Za-km-z]';

/** @inheritdoc */
export function isValidAddress(address: string): boolean {
  return isValidPublicKey(address);
}

/** @inheritdoc */
export function isValidBlockId(hash: string): boolean {
  try {
    return (
      !!hash && new RegExp(BASE_58_ENCONDING_REGEX).test(hash) && bs58.decode(hash).length === DECODED_BLOCK_HASH_LENGTH
    );
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
export function isValidPrivateKey(prvKey: string | Uint8Array): boolean {
  try {
    const key: Uint8Array = typeof prvKey === 'string' ? this.base58ToUint8Array(prvKey) : prvKey;
    return !!Keypair.fromSecretKey(key);
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
export function isValidPublicKey(pubKey: string): boolean {
  try {
    return (
      !!pubKey &&
      new RegExp(BASE_58_ENCONDING_REGEX).test(pubKey) &&
      bs58.decode(pubKey).length === DECODED_ADDRESS_LENGTH &&
      PublicKey.isOnCurve(new PublicKey(pubKey).toBuffer())
    );
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
export function isValidSignature(signature: string): boolean {
  try {
    return !!signature && bs58.decode(signature).length === DECODED_SIGNATURE_LENGTH;
  } catch (e) {
    return false;
  }
}

/** @inheritdoc */
// TransactionId are the first signature on a Transaction
export function isValidTransactionId(txId: string): boolean {
  return this.isValidSignature(txId);
}

/**
 * Returns whether or not the string is a valid amount of lamports number
 *
 * @param {string} amount - the string to validate
 * @returns {boolean} - the validation result
 */
export function isValidAmount(amount: string): boolean {
  const bigNumberAmount = new BigNumber(amount);
  return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThanOrEqualTo(0);
}

export function base58ToUint8Array(key: string): Uint8Array {
  return new Uint8Array(bs58.decode(key));
}

export function Uint8ArrayTobase58(key: Uint8Array): string {
  return bs58.encode(key);
}
