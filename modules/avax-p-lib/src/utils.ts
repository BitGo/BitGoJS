import { ec } from 'elliptic';
import { isValidXprv, isValidXpub } from '../../account-lib/src/utils/crypto';

/**
 * Returns whether or not the string is a valid protocol public key or
 * extended public key.
 *
 * The key format is documented at
 * https://github.com/stacksgov/sips/blob/main/sips/sip-005/sip-005-blocks-and-transactions.md#transaction-authorization
 *
 * @param {string} pub - the  public key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPublicKey(pub: string): boolean {
  if (isValidXpub(pub)) return true;

  if (pub.length !== 66 && pub.length !== 130) return false;

  const firstByte = pub.slice(0, 2);

  // uncompressed public key
  if (pub.length === 130 && firstByte !== '04') return false;

  // compressed public key
  if (pub.length === 66 && firstByte !== '02' && firstByte !== '03') return false;

  if (!allHexChars(pub)) return false;

  // validate the public key
  const secp256k1 = new ec('secp256k1');
  try {
    const keyPair = secp256k1.keyFromPublic(Buffer.from(pub, 'hex'));
    const { result } = keyPair.validate();
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Returns whether or not the string is a valid protocol private key, or extended
 * private key.
 *
 * The protocol key format is described in the @stacks/transactions npm package, in the
 * createStacksPrivateKey function:
 * https://github.com/blockstack/stacks.js/blob/master/packages/transactions/src/keys.ts#L125
 *
 * @param {string} prv - the private key (or extended private key) to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPrivateKey(prv: string): boolean {
  if (isValidXprv(prv)) return true;

  if (prv.length !== 64 && prv.length !== 66) return false;

  if (prv.length === 66 && prv.slice(64) !== '01') return false;

  return allHexChars(prv);
}

/**
 * Returns whether or not the string is a composed of hex chars only
 *
 * @param {string} maybe - the  string to be validated
 * @returns {boolean} - the validation result
 */
function allHexChars(maybe: string): boolean {
  return /^([0-9a-f])+$/i.test(maybe);
  // return true;
}

