import assert from 'assert';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';

import { Sip10Token, Stx, Tstx, Tstxsignet, register } from '../../src';

describe('STX coin registration and base coin behaviour', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('stx', Stx.createInstance);
    bitgo.safeRegister('tstx', Tstx.createInstance);
    bitgo.safeRegister('tstxsignet', Tstxsignet.createInstance);
  });

  describe('register', function () {
    it('registers every coin and sip10 token constructor', function () {
      const registered: { name: string; coinConstructor: unknown }[] = [];
      const sdk = {
        register: (name: string, coinConstructor: unknown) => {
          registered.push({ name, coinConstructor });
        },
      } as never;

      register(sdk);

      const names = registered.map((entry) => entry.name);
      assert(names.includes('stx'), 'stx should be registered');
      assert(names.includes('tstx'), 'tstx should be registered');
      assert(names.includes('tstxsignet'), 'tstxsignet should be registered');

      const tokenConstructors = Sip10Token.createTokenConstructors();
      assert(tokenConstructors.length > 0, 'expected at least one sip10 token constructor');
      assert.strictEqual(registered.length, 3 + tokenConstructors.length);

      // the registered constructors must produce coins for their own chain
      for (const name of ['stx', 'tstx', 'tstxsignet']) {
        const ctor = registered.find((entry) => entry.name === name)?.coinConstructor as (
          bitgo: unknown,
          staticsCoin: unknown
        ) => Stx;
        assert.strictEqual(typeof ctor, 'function');
        assert.strictEqual(ctor(bitgo, coins.get(name)).getChain(), name);
      }

      for (const { name } of tokenConstructors) {
        assert(names.includes(name), `${name} should be registered`);
      }
    });
  });

  describe('constructor', function () {
    it('requires the statics coin', function () {
      assert.throws(() => new Stx(bitgo), /missing required constructor parameter staticsCoin/);
      assert.throws(() => new Tstx(bitgo), /missing required constructor parameter staticsCoin/);
      assert.throws(() => new Tstxsignet(bitgo), /missing required constructor parameter staticsCoin/);
    });
  });

  describe('tstx coin', function () {
    it('exposes the statics chain metadata', function () {
      const basecoin = bitgo.coin('tstx') as Tstx;
      assert.strictEqual(basecoin.getChain(), 'tstx');
      assert.strictEqual(basecoin.getFullName(), coins.get('tstx').fullName);
      assert.strictEqual(basecoin.getFamily(), 'stx');
    });
  });

  describe('stx base coin methods', function () {
    let basecoin: Stx;

    before(function () {
      basecoin = bitgo.coin('stx') as Stx;
    });

    it('returns the base factor and default multisig type', function () {
      assert.strictEqual(basecoin.getBaseFactor(), Math.pow(10, coins.get('stx').decimalPlaces));
      assert.strictEqual(basecoin.getDefaultMultisigType(), 'onchain');
    });

    it('returns a transfer builder from getTransaction', function () {
      const builder = basecoin.getTransaction(coins.get('stx'));
      assert.strictEqual(builder.coinName(), 'stx');
    });

    it('returns an empty object from parseTransaction', async function () {
      const parsed = await basecoin.parseTransaction({ anything: true });
      assert.deepStrictEqual(parsed, {});
    });

    it('rejects explainTransaction without txHex or feeInfo', async function () {
      await assert.rejects(basecoin.explainTransaction({} as never), /missing explain tx parameters/);
    });

    it('does not implement auditDecryptedKey', function () {
      assert.throws(() => basecoin.auditDecryptedKey({} as never));
    });

    it('rejects keychains that are not a 3-key wallet on isWalletAddress', async function () {
      await assert.rejects(
        basecoin.isWalletAddress({ address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6', keychains: [] } as never),
        /Invalid keychains/
      );
    });

    it('returns false for invalid public and private keys', function () {
      assert.strictEqual(basecoin.isValidPub(null as never), false);
      assert.strictEqual(basecoin.isValidPrv(null as never), false);
    });
  });
});
