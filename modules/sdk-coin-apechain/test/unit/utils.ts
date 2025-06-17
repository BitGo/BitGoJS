import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for ApeChain mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'ApeChain');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '33139');
    should.equal(common.networkIdBN().toString(), '33139');
  });

  it('getCommon for ApeChain testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'tapechain testnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '33111');
    should.equal(common.networkIdBN().toString(), '33111');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
