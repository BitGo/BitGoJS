import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo-beta/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'oas mainnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '248');
    should.equal(common.networkIdBN().toString(), '248');
  });

  it('getCommon for testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'oas testnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '9372');
    should.equal(common.networkIdBN().toString(), '9372');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
