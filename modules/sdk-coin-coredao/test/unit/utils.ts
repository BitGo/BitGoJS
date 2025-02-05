import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'coredao mainnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '1116');
    should.equal(common.networkIdBN().toString(), '1116');
  });

  it('getCommon for testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'coredao testnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '1114');
    should.equal(common.networkIdBN().toString(), '1114');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
