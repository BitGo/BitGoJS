import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';

describe('Network Common Configuration', () => {
  it('getCommon for mainnet', () => {
    const common = getCommon(NetworkType.MAINNET);
    should.equal(common.chainName(), 'mainnet');
    should.equal(common.hardfork(), 'petersburg');
    should.equal(common.chainIdBN().toString(), '56');
    should.equal(common.networkIdBN().toString(), '56');
  });

  it('getCommon for testnet', () => {
    const common = getCommon(NetworkType.TESTNET);
    should.equal(common.chainName(), 'testnet');
    should.equal(common.hardfork(), 'petersburg');
    should.equal(common.chainIdBN().toString(), '97');
    should.equal(common.networkIdBN().toString(), '97');
  });

  it('getCommon for invalid network', () => {
    assert.throws(
      () => getCommon('invalidNetwork' as NetworkType),
      (e: any) => e.message === 'Missing network common configuration'
    );
  });
});
