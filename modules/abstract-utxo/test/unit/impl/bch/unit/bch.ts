import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Bch, Tbch } from '../../../../../src/impl/bch';

function eq(actual: string, expected: string) {
  assert.strictEqual(actual, expected);
}

describe('Custom BCH Tests', function () {
  const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.initializeTestVars();
  bitgo.safeRegister('bch', Bch.createInstance);
  bitgo.safeRegister('tbch', Tbch.createInstance);

  const bch = bitgo.coin('bch') as Bch;
  const tbch = bitgo.coin('tbch') as Tbch;

  // we use mainnet bch so we can reuse the mainnet address examples
  it('should correctly convert addresses', function () {
    // P2PKH cashaddr -> cashaddr
    eq(
      bch.canonicalAddress('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'cashaddr'),
      'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'
    );
    eq(
      bch.canonicalAddress('qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'cashaddr'),
      'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'
    );
    // P2PKH base58 -> cashaddr
    eq(
      bch.canonicalAddress('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', 'cashaddr'),
      'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'
    );
    // P2SH cashaddr -> cashaddr
    eq(
      bch.canonicalAddress('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'cashaddr'),
      'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
    );
    eq(
      bch.canonicalAddress('ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'cashaddr'),
      'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
    );
    // P2SH base58 -> cashaddr
    eq(
      bch.canonicalAddress('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC', 'cashaddr'),
      'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
    );
    // no 'bitcoincash:' prefix
    eq(
      bch.canonicalAddress('ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq', 'cashaddr'),
      'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
    );
    // P2PKH cashaddr -> base58
    eq(
      bch.canonicalAddress('bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r', 'base58'),
      '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb'
    );
    eq(
      bch.canonicalAddress('qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r', 'base58'),
      '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb'
    );
    // P2PKH base58 -> base58
    eq(bch.canonicalAddress('16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb', 'base58'), '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb');
    // P2SH cashaddr -> base58
    eq(
      bch.canonicalAddress('bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58'),
      '3LDsS579y7sruadqu11beEJoTjdFiFCdX4'
    );
    eq(
      bch.canonicalAddress('pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58'),
      '3LDsS579y7sruadqu11beEJoTjdFiFCdX4'
    );
    // P2SH base58 -> base58
    eq(bch.canonicalAddress('3LDsS579y7sruadqu11beEJoTjdFiFCdX4', 'base58'), '3LDsS579y7sruadqu11beEJoTjdFiFCdX4');
    // undefined version defaults to base58
    eq(
      bch.canonicalAddress('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'),
      '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC'
    );
    eq(bch.canonicalAddress('ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'), '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC');
    // all capitalized
    eq(
      bch.canonicalAddress('BITCOINCASH:QQQ3728YW0Y47SQN6L2NA30MCW6ZM78DZQRE909M2R', 'base58'),
      '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb'
    );
    eq(
      bch.canonicalAddress('QQQ3728YW0Y47SQN6L2NA30MCW6ZM78DZQRE909M2R', 'base58'),
      '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb'
    );
    // testnet addresses
    eq(
      tbch.canonicalAddress('2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X', 'cashaddr'),
      'bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f'
    );
    eq(
      tbch.canonicalAddress('n3jYBjCzgGNydQwf83Hz6GBzGBhMkKfgL1', 'cashaddr'),
      'bchtest:qremgr9dr9x5swv82k69qdjzrvdxgkaaesftdp5xla'
    );
    eq(
      tbch.canonicalAddress('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'cashaddr'),
      'bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f'
    );
    eq(
      tbch.canonicalAddress('bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'cashaddr'),
      'bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f'
    );
    eq(
      tbch.canonicalAddress('prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'base58'),
      '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'
    );
    eq(
      tbch.canonicalAddress('prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'base58'),
      '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'
    );
    eq(
      tbch.canonicalAddress('prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f', 'cashaddr'),
      'bchtest:prgrnjengs555k3cff2s3gqxg3xyyr9uzyh9js5m8f'
    );
  });

  it('should reject invalid addresses', function () {
    assert.throws(() => bch.canonicalAddress('bitcoincash:sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58'));
    assert.throws(() => bch.canonicalAddress('bitcoincash:yr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58'));
    assert.throws(() =>
      bch.canonicalAddress('bitcoincash:bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e', 'base58')
    );
    assert.throws(() => bch.canonicalAddress('3DDsS579y7sruadqu11beEJoTjdFiFCdX4', 'base58'));
    assert.throws(() => bch.canonicalAddress(':qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'base58'));
    assert.throws(() => bch.canonicalAddress('bitcoin:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'base58'));
    assert.throws(() => bch.canonicalAddress('bitcoincash:QPM2Qsznhks23z7629mms6s4cwef74vcwvy22gdx6a', 'cashaddr'));
    assert.throws(() => bch.canonicalAddress('bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r', 'blah'));
    assert.throws(() => bch.canonicalAddress(undefined as any, 'blah'));
  });
});
