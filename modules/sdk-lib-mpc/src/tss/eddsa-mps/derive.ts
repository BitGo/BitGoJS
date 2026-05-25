import { createHmac } from 'crypto';
import { ed25519 } from '@noble/curves/ed25519';
import { pathToIndices } from '../../curves/util';

/**
 * Derives a child public key from a common keychain using the Silence Labs
 * BIP32-Ed25519 non-hardened derivation formula:
 *
 *   HMAC = HMAC-SHA512(key=chaincode, data=pk_bytes || index_BE_4)
 *   child_pk = parent_pk + 8 * LE(trunc28(HMAC_left)) * G
 *   child_chaincode = HMAC_right (right 32 bytes)
 *
 * This differs from the Cardano BIP32-Ed25519 formula used by
 * `Eddsa.deriveUnhardened` in three ways: no 0x02 prefix byte, big-endian
 * index, and a single HMAC instead of two. The formulas produce completely
 * different child keys at every derived level.
 *
 * Returns the same on-the-wire format as `Eddsa.deriveUnhardened`:
 *   128-char hex = 64-char derived pk + 64-char derived chaincode
 */
export function deriveUnhardenedMps(commonKeychainHex: string, path: string): string {
  if (commonKeychainHex.length !== 128) {
    throw new Error(
      `Invalid commonKeychain: expected 128 hex chars (32-byte pk + 32-byte chaincode), got ${commonKeychainHex.length}`
    );
  }

  const buf = Buffer.from(commonKeychainHex, 'hex');
  let pkBytes = Buffer.from(buf.subarray(0, 32));
  let ccBytes = Buffer.from(buf.subarray(32, 64));

  const indices = path === '' || path === 'm' ? [] : pathToIndices(path);
  for (const index of indices) {
    const indexBuf = Buffer.alloc(4);
    indexBuf.writeUInt32BE(index, 0);

    const hmac = createHmac('sha512', ccBytes)
      .update(Buffer.concat([pkBytes, indexBuf]))
      .digest();

    const zl = hmac.subarray(0, 32);
    const zr = hmac.subarray(32);

    // parse_offset: 8 * LE(zl[0..28] || zeroes)
    // Mirrors Rust: U256::from_le_slice(&z_l).shl(3), where z_l[28..32] = 0.
    const truncZl = Buffer.alloc(32);
    zl.copy(truncZl, 0, 0, 28);
    const offset = BigInt('0x' + Buffer.from(truncZl).reverse().toString('hex')) * 8n;

    // child_pk = offset * G + parent_pk
    const childPoint = ed25519.ExtendedPoint.BASE.multiply(offset).add(ed25519.ExtendedPoint.fromHex(pkBytes));
    pkBytes = Buffer.from(childPoint.toRawBytes());
    ccBytes = Buffer.from(zr);
  }

  return pkBytes.toString('hex') + ccBytes.toString('hex');
}
