/**
 * @prettier
 */
import * as crypto from 'crypto';
import * as bip32 from 'bip32';
import 'should';

import * as utxolib from '@bitgo/utxo-lib';
import * as bip32util from '../../src/bip32util';

describe('bip32util', function () {
  function getSeedBuffers(length: number) {
    return Array.from({ length }).map((_, i) => crypto.createHash('sha256').update(`${i}`).digest());
  }
  it('signMessage/verifyMessage', function () {
    const keys = getSeedBuffers(4).map((seed) => bip32.fromSeed(seed));
    const messages = ['hello', 'goodbye'];
    keys.forEach((key) => {
      messages.forEach((message) => {
        const signature = bip32util.signMessage(message, key, utxolib.networks.bitcoin);

        keys.forEach((otherKey) => {
          messages.forEach((otherMessage) => {
            bip32util
              .verifyMessage(otherMessage, otherKey, signature, utxolib.networks.bitcoin)
              .should.eql(message === otherMessage && key === otherKey);
          });
        });
      });
    });
  });
});
