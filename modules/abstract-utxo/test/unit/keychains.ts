import * as assert from 'assert';

import 'should';
import { type TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { AbstractUtxoCoin } from '../../src';
import { Tbtc } from '../../src/impl/btc';

import { utxoCoins } from './util';

function run(coin: AbstractUtxoCoin) {
  describe(`UTXO Keychains ${coin.getChain()}`, function () {
    it('validates pub', function () {
      const { pub } = coin.keychains().create();
      assert.ok(pub);
      coin.isValidPub(pub).should.equal(true);
    });
  });
}

utxoCoins.forEach((c) => run(c));

describe('Audit Key', function () {
  // Encrypted backup key fixture for testing assertIsValidKey
  const btcBackupKey = {
    key:
      '{"iv":"JgqqE4W45/tKBSMSYqD+qg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"' +
      ':"ccm","adata":"","cipher":"aes","salt":"kiLPf8VSdI0=","ct":"zUh4Oko/06g02E' +
      'wnqOfzJbTwtE2p3b19jDk8Tum07Jv3N/RP7Bo0w/ObLBO1uIJFossO3nJ1JS+7t/vPQhdCtN8oD' +
      '6YrZnEZYrRwN6JQkL1uYPnZ1PoWbYI9navK5CLU1KQwDTO9YEN46++OrzFH+CjpQVLblaw="}',
  };

  let bitgo: TestBitGoAPI;
  let coin: Tbtc;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    bitgo.initializeTestVars();
    coin = bitgo.coin('tbtc') as Tbtc;
  });

  it('should return for valid inputs', function () {
    coin.assertIsValidKey({
      encryptedPrv: btcBackupKey.key,
      walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
    });
  });

  it('should throw error if the walletPassphrase is incorrect', function () {
    assert.throws(
      () =>
        coin.assertIsValidKey({
          encryptedPrv: btcBackupKey.key,
          walletPassphrase: 'foo',
        }),
      { message: "failed to decrypt prv: ccm: tag doesn't match" }
    );
  });

  it('should throw if the key is altered', function () {
    const alteredKey = btcBackupKey.key.replace(/[0-9]/g, '0');
    assert.throws(
      () =>
        coin.assertIsValidKey({
          encryptedPrv: alteredKey,
          walletPassphrase: 'kAm[EFQ6o=SxlcLFDw%,',
        }),
      { message: 'failed to decrypt prv: json decrypt: invalid parameters' }
    );
  });
});
