import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'Mon mainnet');
    should.equal(common.hardfork(), 'london');
    //TODO: WIN-5225: add chain id related checks once mainnet is release
  });

  it('getCommon for testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'mon testnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '10143');
    should.equal(common.networkIdBN().toString(), '10143');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
