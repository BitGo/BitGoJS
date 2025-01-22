import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'xdc mainnet');
    should.equal(common.chainIdBN().toString(), '50');
    should.equal(common.networkIdBN().toString(), '50');
  });

  it('getCommon for testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'xdc testnet');
    should.equal(common.chainIdBN().toString(), '51');
    should.equal(common.networkIdBN().toString(), '51');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
