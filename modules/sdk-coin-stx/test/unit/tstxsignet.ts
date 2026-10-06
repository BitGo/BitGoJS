import assert from 'assert';

import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { TransactionVersion } from '@stacks/transactions';
import should from 'should';

import { StxLib, Tstxsignet } from '../../src';

describe('tstxsignet', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tstxsignet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tstxsignet', Tstxsignet.createInstance);
    basecoin = bitgo.coin('tstxsignet') as Tstxsignet;
  });

  it('uses the statics tstxsignet coin', function () {
    assert.strictEqual(basecoin.getChain(), 'tstxsignet');
    assert.strictEqual(basecoin.getFullName(), 'Testnet Stacks (Signet)');
    assert.strictEqual(basecoin.getFamily(), 'stx');
  });

  it('resolves the staking-testnet public node url', function () {
    assert.strictEqual(basecoin.getPublicNodeUrl(), 'https://api.staking-testnet.hiro.so');
  });

  describe('wallet creation', function () {
    it('generates a wallet keypair from the coin', function () {
      const keyPair = basecoin.generateKeyPair();
      const { pub, prv } = keyPair;
      if (pub === undefined || prv === undefined) {
        throw new Error('wallet keypair is missing key material');
      }
      pub.should.match(/^xpub/);
      prv.should.match(/^xprv/);
    });

    it('derives a valid testnet wallet address from the generated key', function () {
      const keyPair = basecoin.generateKeyPair();
      if (keyPair.pub === undefined) {
        throw new Error('wallet keypair is missing the extended public key');
      }
      const address = new StxLib.KeyPair({ pub: keyPair.pub }).getSTXAddress(false, TransactionVersion.Testnet);
      address.startsWith('ST').should.be.true();
      basecoin.isValidAddress(address).should.be.true();
    });

    it('creates a wallet bound to the tstxsignet coin', function () {
      // mirrors the wallet data the API returns for a created tstxsignet wallet
      const wallet = new Wallet(bitgo, basecoin, { coin: 'tstxsignet' } as never);
      should.equal(wallet.coin(), 'tstxsignet');
    });

    it('validates testnet wallet addresses', function () {
      basecoin.isValidAddress('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').should.be.true();
      basecoin.isValidAddress('not-an-address').should.be.false();
    });
  });
});
