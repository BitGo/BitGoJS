import * as assert from 'assert';
import { ecc as eccLib /* , bip32 */ } from '../../noble_ecc';
// import { BIP32Interface } from 'bip32';
// import { ECPairInterface } from 'ecpair';
// import { networks } from 'bitcoinjs-lib';

function getPublicKeyBuffer(publicKey: Buffer, { compressed = true } = {}): Buffer {
  const res = eccLib.pointCompress(publicKey, compressed);
  if (res === null) {
    throw new Error('invalid public key');
  }
  const buffer = Buffer.from(res);

  assert.strictEqual(buffer.length, compressed ? 33 : 65);
  return buffer;
}

export function convertToUncompressedPub(compressedPub: Buffer): Buffer {
  return getPublicKeyBuffer(compressedPub, { compressed: false });
}

export function convertToCompressedPub(compressedPub: Buffer): Buffer {
  return getPublicKeyBuffer(compressedPub, { compressed: true });
}
