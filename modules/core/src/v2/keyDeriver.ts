/**
 * @prettier
 */
import * as createHmac from 'create-hmac';

export interface HdKeypair {
  key: Buffer;
  chainCode: Buffer;
}

/**
 * Heirarchical determinisitic key derivation for the ed25519 elliptic curve,
 * as defined in SLIP-0010.
 *
 * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md
 * https://github.com/satoshilabs/slips/blob/master/slip-0010.md
 */
export class Ed25519KeyDeriver {
  /**
   * This key derivation code was copied and adapted from:
   * https://github.com/chatch/stellar-hd-wallet/blob/612c12325ca9047dce460016fb7d148f55f575ca/src/hd-key.js
   *
   * There have been some slight modifications to improve typescript support.
   *
   * The original ed25519-hd-key module is licensed under "GPL-3".
   */

  private static readonly ED25519_CURVE = 'ed25519 seed';
  private static readonly HARDENED_OFFSET = 0x80000000;
  private static readonly PATH_REGEX = new RegExp("^m(\\/[0-9]+')+$");

  /**
   * Derive a SLIP-0010 key given a path and master key seed.
   *
   * @param path derivation path
   * @param seed key seed
   */
  public static derivePath(path: string, seed: string): HdKeypair {
    if (!this.isValidPath(path)) {
      throw new Error('Invalid derivation path');
    }
    const { key, chainCode } = this.getMasterKeyFromSeed(seed);
    const segments = path
      .split('/')
      .slice(1)
      .map(this.replaceDerive);
    return segments.reduce(
      (parentKeys, segment) => this.CKDPriv(parentKeys, segment + Ed25519KeyDeriver.HARDENED_OFFSET),
      { key, chainCode }
    );
  }

  /**
   * Generate a SLIP-0010 master key from the entropy seed
   *
   * @param seed master key seed used to recreate master key
   */
  private static getMasterKeyFromSeed(seed: string) {
    const hmac = createHmac('sha512', Ed25519KeyDeriver.ED25519_CURVE);
    const I = hmac.update(Buffer.from(seed, 'hex')).digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
      key: IL,
      chainCode: IR,
    };
  }

  /**
   * Calculate a child private key given the parent key, the chain code, and the child index.
   *
   * @param key parent key
   * @param chainCode chain code for parent key
   * @param index index of child to derive
   */
  private static CKDPriv({ key, chainCode }: HdKeypair, index: number): HdKeypair {
    const indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(index, 0);
    const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);
    const I = createHmac('sha512', chainCode)
      .update(data)
      .digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
      key: IL,
      chainCode: IR,
    };
  }

  private static replaceDerive = (val: string): number => parseInt(val.replace("'", ''), 10);
  private static isValidPath(path: string) {
    if (!Ed25519KeyDeriver.PATH_REGEX.test(path)) {
      return false;
    }
    return !path
      .split('/')
      .slice(1)
      .map(this.replaceDerive)
      .some(isNaN);
  }
}
