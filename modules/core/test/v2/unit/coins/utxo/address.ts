/**
 * @prettier
 */
import 'should';
import * as assert from 'assert';
import { Codes } from '@bitgo/unspents';
import { AbstractUtxoCoin } from '../../../../../src/v2/coins';

import { keychains } from './keychains.util';
import { utxoCoins } from './util';
import { shouldEqualJSON, getFixture } from './fixtures';
import { GenerateAddressOptions } from '../../../../../src/v2/coins/abstractUtxoCoin';

function isCompatibleAddress(a: AbstractUtxoCoin, b: AbstractUtxoCoin): boolean {
  if (a === b) {
    return true;
  }
  switch (a.getChain()) {
    case 'btc':
    case 'bsv':
    case 'bch':
      return ['btc', 'bsv', 'bch'].includes(b.getChain());
    case 'tbtc':
    case 'tbsv':
    case 'tbch':
      return ['tbtc', 'tbsv', 'tbch'].includes(b.getChain());
    default:
      return false;
  }
}

function run(coin: AbstractUtxoCoin) {
  const chains = [...Codes.all].sort((a, b) => a - b);

  function getParameters(): GenerateAddressOptions[] {
    return [undefined, ...chains].map((chain) => ({ keychains, chain }));
  }

  describe(`UTXO Addresses ${coin.getChain()}`, function () {
    it('fixtures', async function () {
      const addresses = getParameters().map((p) => {
        if (p.chain && !coin.supportsAddressChain(p.chain)) {
          assert.throws(() => coin.generateAddress(p));
        } else {
          coin.isValidAddress(coin.generateAddress(p).address).should.eql(true);
        }

        const label = { chain: p.chain === undefined ? 'default' : p.chain };
        try {
          return [label, coin.generateAddress(p)];
        } catch (e) {
          return [label, { error: e.message }];
        }
      });

      shouldEqualJSON(addresses, await getFixture(coin, 'addresses-by-chain', addresses));
    });

    it('defaults to canonical address', function () {
      getParameters().forEach((p) => {
        if (!p.chain || coin.supportsAddressChain(p.chain)) {
          const address = coin.generateAddress(p).address;
          coin.canonicalAddress(address).should.eql(address);
        }
      });
    });

    utxoCoins.forEach((otherCoin) => {
      it(`address compatability with ${otherCoin.getChain()}`, async function () {
        getParameters().forEach((p) => {
          if (p.chain && (!coin.supportsAddressChain(p.chain) || !otherCoin.supportsAddressChain(p.chain))) {
            return;
          }
          const address = coin.generateAddress(p);
          const otherAddress = otherCoin.generateAddress(p);
          (address.address === otherAddress.address).should.eql(isCompatibleAddress(coin, otherCoin));
          coin.isValidAddress(otherAddress.address).should.eql(isCompatibleAddress(coin, otherCoin));
        });
      });
    });
  });
}

utxoCoins.forEach((c) => run(c));
