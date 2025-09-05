import { expect } from 'chai';
import { BitGoBase } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Flrp } from '../../src/flrp';
import { coins } from '@bitgo/statics';

describe('Flrp', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    // Attempt to register the coin symbol; safeRegister is idempotent.
    (bitgo as unknown as { safeRegister?: (n: string, f: (bg: BitGoBase) => unknown) => void }).safeRegister?.(
      'flrp',
      Flrp.createInstance
    );
  });

  it('createInstance returns a Flrp instance', function () {
    const staticsCoin = coins.get('flrp');
    const coin = Flrp.createInstance(bitgo as unknown as BitGoBase, staticsCoin);
    expect(coin).to.be.instanceOf(Flrp);
  });

  it('multiple createInstance calls produce distinct objects', function () {
    const sc = coins.get('flrp');
    const a = Flrp.createInstance(bitgo as unknown as BitGoBase, sc);
    const b = Flrp.createInstance(bitgo as unknown as BitGoBase, sc);
    expect(a).to.not.equal(b);
    expect(a).to.be.instanceOf(Flrp);
    expect(b).to.be.instanceOf(Flrp);
  });
});
