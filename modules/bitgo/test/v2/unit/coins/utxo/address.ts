/**
 * @prettier
 */
import 'should';
import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
const { chainCodes } = utxolib.bitgo;

import { AbstractUtxoCoin, GenerateAddressOptions } from '@bitgo/abstract-utxo';

import { utxoCoins, keychains as keychainsBip32, getFixture, shouldEqualJSON } from './util';

// TODO (@rushilbg): Delete these tests because they are redundant (similar tests are in utxo-lib)
function isCompatibleAddress(a: AbstractUtxoCoin, b: AbstractUtxoCoin): boolean {
  if (a === b) {
    return true;
  }
  switch (a.getChain()) {
    case 'btc':
    case 'bsv':
    case 'bch':
    case 'bcha':
      return ['btc', 'bsv', 'bch', 'bcha'].includes(b.getChain());
    case 'tbtc':
    case 'tbsv':
    case 'tbch':
    case 'tdoge':
    case 'tbcha':
      return ['tbtc', 'tbsv', 'tbch', 'tbcha', 'tdoge'].includes(b.getChain());
    default:
      return false;
  }
}

function run(coin: AbstractUtxoCoin) {
  const keychains = keychainsBip32.map((k) => ({ pub: k.neutered().toBase58() }));

  function getParameters(): GenerateAddressOptions[] {
    return [undefined, ...chainCodes].map((chain) => ({ keychains, chain }));
  }

  describe(`UTXO Addresses ${coin.getChain()}`, function () {
    it('address support', function () {
      const supportedAddressTypes = utxolib.bitgo.outputScripts.scriptTypes2Of3.filter((t) =>
        coin.supportsAddressType(t)
      );
      switch (coin.getChain()) {
        case 'btc':
        case 'tbtc':
          supportedAddressTypes.should.eql(['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2']);
          break;
        case 'btg':
        case 'tbtg':
        case 'ltc':
        case 'tltc':
          supportedAddressTypes.should.eql(['p2sh', 'p2shP2wsh', 'p2wsh']);
          break;
        case 'bch':
        case 'tbch':
        case 'bcha':
        case 'tbcha':
        case 'bsv':
        case 'tbsv':
        case 'dash':
        case 'tdash':
        case 'doge':
        case 'tdoge':
        case 'zec':
        case 'tzec':
          supportedAddressTypes.should.eql(['p2sh']);
          break;
        default:
          throw new Error(`unexpected coin ${coin.getChain()}`);
      }
    });

    it('generates address matching the fixtures', async function () {
      const addresses = getParameters().map((p) => {
        const label = { chain: p.chain === undefined ? 'default' : p.chain };
        try {
          return [label, coin.generateAddress(p)];
        } catch (e) {
          return [label, { error: e.message }];
        }
      });

      shouldEqualJSON(addresses, await getFixture(coin, 'addresses-by-chain', addresses));
    });

    it('validates and verifies generated addresses', function () {
      getParameters().forEach((p) => {
        if (p.chain && !coin.supportsAddressChain(p.chain)) {
          assert.throws(() => coin.generateAddress(p));
          return;
        }

        const a = coin.generateAddress(p);
        coin.isValidAddress(a.address).should.eql(true);
        if (a.address !== a.address.toUpperCase()) {
          coin.isValidAddress(a.address.toUpperCase()).should.eql(false);
        }
        coin.verifyAddress({ ...a, keychains });
      });
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
      it(`has expected address compatability with ${otherCoin.getChain()}`, async function () {
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
