/**
 * V1 Safe Wallets are the oldest type of wallets that BitGo supports. They were
 * created back in 2013-14 and don't use HD chains. Instead, they have only one
 * P2SH address per wallet whose redeem script uses uncompressed public keys.
 * */

import * as assert from 'assert';
import { ecc as eccLib } from '../../noble_ecc';
import { isBitcoin, Network } from '../../networks';
import { isTriple } from '../types';
import * as bitcoinjs from 'bitcoinjs-lib';

function getPublicKeyBuffer(publicKey: Buffer, { compressed = true } = {}): Buffer {
  const res = eccLib.pointCompress(publicKey, compressed);
  if (res === null) {
    throw new Error('invalid public key');
  }
  const buffer = Buffer.from(res);

  assert.strictEqual(buffer.length, compressed ? 33 : 65);
  return buffer;
}

export function toUncompressedPub(pubkey: Buffer): Buffer {
  return getPublicKeyBuffer(pubkey, { compressed: false });
}

export function toCompressedPub(pubkey: Buffer): Buffer {
  return getPublicKeyBuffer(pubkey, { compressed: true });
}

/** create p2sh scripts with uncompressed pubkeys */
export function createLegacySafeOutputScript2of3(
  pubkeys: Buffer[],
  network?: Network
): {
  scriptPubKey: Buffer;
  redeemScript: Buffer;
} {
  if (network) {
    if (!isBitcoin(network)) {
      throw new Error(`unsupported network for legacy safe output script: ${network.coin}`);
    }
  }

  if (!isTriple(pubkeys)) {
    throw new Error(`must provide pubkey triple`);
  }

  pubkeys.forEach((key) => {
    if (key.length !== pubkeys[0].length) {
      throw new Error(`all pubkeys must have the same length`);
    }
    if (key.length !== 65 && key.length !== 33) {
      // V1 Safe BTC wallets could contain either uncompressed or compressed pubkeys
      throw new Error(`Unexpected key length ${key.length}, neither compressed nor uncompressed.`);
    }
  });

  const script2of3 = bitcoinjs.payments.p2ms({ m: 2, pubkeys });
  assert(script2of3.output);

  const scriptPubKey = bitcoinjs.payments.p2sh({ redeem: script2of3 });
  assert(scriptPubKey);
  assert(scriptPubKey.output);

  return {
    scriptPubKey: scriptPubKey.output,
    redeemScript: script2of3.output,
  };
}
