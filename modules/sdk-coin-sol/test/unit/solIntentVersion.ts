import * as should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tsol } from '../../src';

describe('Sol.setCoinSpecificFieldsInIntent — SIMD-0296/0385 wire version', function () {
  const bitgo = new BitGoAPI({ env: 'test' });
  bitgo.register('tsol', Tsol.createInstance);
  const sol = bitgo.coin('tsol') as any;

  it('forwards version: 1 onto the intent', function () {
    const intent: any = { intentType: 'payment' };
    sol.setCoinSpecificFieldsInIntent(intent, { intentType: 'payment', version: 1 } as any);
    should.equal(intent.version, 1);
  });

  it('forwards version: 0 explicitly (v0 stays selectable)', function () {
    const intent: any = { intentType: 'payment' };
    sol.setCoinSpecificFieldsInIntent(intent, { intentType: 'payment', version: 0 } as any);
    should.equal(intent.version, 0);
  });

  it('leaves the intent without a version key when the option is absent', function () {
    const intent: any = { intentType: 'payment' };
    sol.setCoinSpecificFieldsInIntent(intent, { intentType: 'payment' } as any);
    should.equal('version' in intent, false);
  });
});
