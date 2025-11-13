import 'should';
import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
const { chainCodes } = utxolib.bitgo;

import { AbstractUtxoCoin, GenerateFixedScriptAddressOptions, generateAddress } from '../../src';

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
    case 'tbtcsig':
    case 'tbtc4':
    case 'tbtcbgsig':
    case 'tbsv':
    case 'tbch':
    case 'tdoge':
    case 'tbcha':
      return ['tbtc', 'tbtcsig', 'tbtc4', 'tbtcbgsig', 'tbsv', 'tbch', 'tbcha', 'tdoge'].includes(b.getChain());
    default:
      return false;
  }
}

function run(coin: AbstractUtxoCoin) {
  const keychains = keychainsBip32.map((k) => ({ pub: k.neutered().toBase58() }));

  function getParameters(): GenerateFixedScriptAddressOptions[] {
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
        case 'tbtcsig':
        case 'tbtc4':
        case 'tbtcbgsig':
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
          return [label, generateAddress(coin.network, p)];
        } catch (e) {
          return [label, { error: e.message }];
        }
      });

      shouldEqualJSON(addresses, await getFixture(coin, 'addresses-by-chain', addresses));
    });

    it('validates and verifies generated addresses', function () {
      getParameters().forEach((p) => {
        if (p.chain && !coin.supportsAddressChain(p.chain)) {
          assert.throws(() => generateAddress(coin.network, p));
          return;
        }

        const address = generateAddress(coin.network, p);
        coin.isValidAddress(address).should.eql(true);
        if (address !== address.toUpperCase()) {
          coin.isValidAddress(address.toUpperCase()).should.eql(false);
        }
        coin.verifyAddress({ address, keychains });
      });
    });

    it('defaults to canonical address', function () {
      getParameters().forEach((p) => {
        if (!p.chain || coin.supportsAddressChain(p.chain)) {
          const address = generateAddress(coin.network, p);
          coin.canonicalAddress(address).should.eql(address);
        }
      });
    });

    it('respects format parameter', function () {
      // Only test coins that actually support multiple address formats (BCH/BCHA)
      // These are the only coins where the format parameter matters
      const cashaddrPrefixes: Record<string, string> = {
        bch: 'bitcoincash:',
        tbch: 'bchtest:',
        bcha: 'ecash:',
        tbcha: 'ectest:',
      };

      const expectedPrefix = cashaddrPrefixes[coin.getChain()];
      if (!expectedPrefix) {
        this.skip();
      }

      const chain = chainCodes[0];
      const params = { keychains, chain };

      // Generate with cashaddr format
      const addressCashaddr = generateAddress(coin.network, { ...params, format: 'cashaddr' });
      coin.isValidAddress(addressCashaddr).should.eql(true);
      addressCashaddr.should.startWith(expectedPrefix, `cashaddr should start with ${expectedPrefix}`);

      // Generate with base58 format explicitly
      const addressBase58 = generateAddress(coin.network, { ...params, format: 'base58' });
      coin.isValidAddress(addressBase58).should.eql(true);
      addressBase58.should.not.match(/.*:.*/, 'base58 should not contain colon separator');

      // Verify formats produce different strings
      addressCashaddr.should.not.equal(addressBase58, 'cashaddr and base58 should produce different address strings');
    });

    utxoCoins.forEach((otherCoin) => {
      it(`has expected address compatability with ${otherCoin.getChain()}`, async function () {
        getParameters().forEach((p) => {
          if (p.chain && (!coin.supportsAddressChain(p.chain) || !otherCoin.supportsAddressChain(p.chain))) {
            return;
          }
          const address = generateAddress(coin.network, p);
          const otherAddress = generateAddress(otherCoin.network, p);
          (address === otherAddress).should.eql(isCompatibleAddress(coin, otherCoin));
          coin.isValidAddress(otherAddress).should.eql(isCompatibleAddress(coin, otherCoin));
        });
      });
    });
  });
}

utxoCoins.forEach((c) => run(c));
