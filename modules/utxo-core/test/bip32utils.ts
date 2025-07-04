import * as crypto from 'crypto';

import * as utxolib from '@bitgo/utxo-lib';
import 'should';

import { signMessage, verifyMessage } from '../src/bip32utils';

describe('bip32utils', function () {
  function getSeedBuffers(length: number) {
    return Array.from({ length }).map((_, i) => crypto.createHash('sha256').update(`${i}`).digest());
  }
  it('signMessage/verifyMessage', function () {
    const keys = getSeedBuffers(4).map((seed) => utxolib.bip32.fromSeed(seed));
    const messages = ['hello', 'goodbye'];
    keys.forEach((key) => {
      messages.forEach((message) => {
        const signature = signMessage(message, key, utxolib.networks.bitcoin);

        keys.forEach((otherKey) => {
          messages.forEach((otherMessage) => {
            verifyMessage(otherMessage, otherKey, signature, utxolib.networks.bitcoin).should.eql(
              message === otherMessage && key === otherKey
            );
          });
        });
      });
    });
  });
});
