import * as crypto from 'crypto';
import * as assert from 'assert';

import { bip32, bip32utils } from '../src';

const { signMessage, verifyMessage } = bip32utils;

// Bitcoin mainnet message prefix - matches utxolib.networks.bitcoin.messagePrefix
const bitcoinNetwork = {
  messagePrefix: '\x18Bitcoin Signed Message:\n',
};

describe('bip32utils', function () {
  function getSeedBuffers(length: number) {
    return Array.from({ length }).map((_, i) => crypto.createHash('sha256').update(`${i}`).digest());
  }

  it('signMessage/verifyMessage', function () {
    const keys = getSeedBuffers(4).map((seed) => bip32.fromSeed(seed));
    const messages = ['hello', 'goodbye', Buffer.from('\x01\x02\x03'), Buffer.from('')];
    keys.forEach((key) => {
      messages.forEach((message) => {
        const signature = signMessage(message, key, bitcoinNetwork);

        keys.forEach((otherKey) => {
          messages.forEach((otherMessage) => {
            const expectValid = message === otherMessage && key === otherKey;
            assert.strictEqual(verifyMessage(otherMessage, otherKey, signature, bitcoinNetwork), expectValid);
            assert.strictEqual(
              verifyMessage(Buffer.from(otherMessage), otherKey, signature, bitcoinNetwork),
              expectValid
            );
          });
        });
      });
    });
  });

  it('signMessage throws on missing privateKey', function () {
    const key = bip32.fromSeed(getSeedBuffers(1)[0]);
    const neutered = key.neutered();
    assert.throws(() => signMessage('hello', neutered, bitcoinNetwork), /must provide privateKey/);
  });

  it('signMessage throws on invalid network', function () {
    const key = bip32.fromSeed(getSeedBuffers(1)[0]);
    assert.throws(() => signMessage('hello', key, null as any), /invalid argument 'network'/);
    assert.throws(() => signMessage('hello', key, {} as any), /invalid argument 'network'/);
  });

  it('verifyMessage throws on invalid network', function () {
    const key = bip32.fromSeed(getSeedBuffers(1)[0]);
    const signature = signMessage('hello', key, bitcoinNetwork);
    assert.throws(() => verifyMessage('hello', key, signature, null as any), /invalid argument 'network'/);
    assert.throws(() => verifyMessage('hello', key, signature, {} as any), /invalid argument 'network'/);
  });
});
