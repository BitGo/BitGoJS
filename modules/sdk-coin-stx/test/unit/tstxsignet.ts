import assert from 'assert';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Tstxsignet } from '../../src';

describe('tstxsignet', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tstxsignet', Tstxsignet.createInstance);
  });

  it('uses the statics tstxsignet coin', function () {
    const basecoin = bitgo.coin('tstxsignet');
    assert.strictEqual(basecoin.getChain(), 'tstxsignet');
    assert.strictEqual(basecoin.getFullName(), 'Testnet Stacks (Signet)');
    assert.strictEqual(basecoin.getFamily(), 'stx');
  });

  it('resolves the staking-testnet public node url', function () {
    const basecoin = bitgo.coin('tstxsignet') as Tstxsignet;
    assert.strictEqual(basecoin.getPublicNodeUrl(), 'https://api.staking-testnet.hiro.so');
  });
});
