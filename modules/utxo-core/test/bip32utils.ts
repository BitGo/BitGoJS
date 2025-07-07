import * as crypto from 'crypto';
import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';

import { signMessage, verifyMessage } from '../src/bip32utils';

describe('bip32utils', function () {
  function getSeedBuffers(length: number) {
    return Array.from({ length }).map((_, i) => crypto.createHash('sha256').update(`${i}`).digest());
  }
  it('signMessage/verifyMessage', function () {
    const keys = getSeedBuffers(4).map((seed) => utxolib.bip32.fromSeed(seed));
    const messages = ['hello', 'goodbye', Buffer.from('\x01\x02\x03'), Buffer.from('')];
    keys.forEach((key) => {
      messages.forEach((message) => {
        const signature = signMessage(message, key, utxolib.networks.bitcoin);

        keys.forEach((otherKey) => {
          messages.forEach((otherMessage) => {
            const expectValid = message === otherMessage && key === otherKey;
            assert.strictEqual(verifyMessage(otherMessage, otherKey, signature, utxolib.networks.bitcoin), expectValid);
            assert.strictEqual(
              verifyMessage(Buffer.from(otherMessage), otherKey, signature, utxolib.networks.bitcoin),
              expectValid
            );
          });
        });
      });
    });
  });
});
