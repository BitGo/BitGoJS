import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'sgb mainnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '19');
    should.equal(common.networkIdBN().toString(), '19');
  });

  it('getCommon for testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'sgb testnet');
    should.equal(common.hardfork(), 'london');
    should.equal(common.chainIdBN().toString(), '16');
    should.equal(common.networkIdBN().toString(), '16');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
