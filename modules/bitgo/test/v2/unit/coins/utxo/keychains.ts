import * as assert from 'assert';
import 'should';
import { AbstractUtxoCoin } from '@bitgo-beta/abstract-utxo';
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
