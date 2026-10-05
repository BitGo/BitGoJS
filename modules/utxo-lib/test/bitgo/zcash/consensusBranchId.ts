import * as assert from 'assert';
import { networks } from '../../../src';
import {
  ZcashTransaction,
  getDefaultConsensusBranchIdForVersion,
  getDefaultTransactionVersion,
} from '../../../src/bitgo';

// NU6.2 emergency hard fork re-enabling Orchard (mainnet block 3364600, testnet 4052000).
// NU7 network upgrade (https://zips.z.cash/zip-0259): testnet activation block 4465026,
// mainnet activation height not yet set.
describe('Zcash consensus branch id (NU6.2 / NU7)', function () {
  const NU6_1_BRANCH_ID = 0x4dec4df0;
  const NU6_2_BRANCH_ID = 0x5437f330;
  const NU7_BRANCH_ID = 0x77190ad9;

  it('defaults mainnet transaction builds to NU6.2', function () {
    assert.strictEqual(getDefaultTransactionVersion(networks.zcash), ZcashTransaction.VERSION4_BRANCH_NU6_2);
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcash, ZcashTransaction.VERSION4_BRANCH_NU6_2),
      NU6_2_BRANCH_ID
    );
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcash, ZcashTransaction.VERSION5_BRANCH_NU6_2),
      NU6_2_BRANCH_ID
    );
    // Bare version 4/5 on mainnet resolve to the current upgrade (NU6.2).
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcash, 4), NU6_2_BRANCH_ID);
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcash, 5), NU6_2_BRANCH_ID);
  });

  it('defaults testnet transaction builds to NU7 version 5 (activated at block 4465026)', function () {
    // Per ZIP-259, version 4 transactions are invalid once NU7 activates -- only version 5
    // (ZIP-225) remains valid -- so the default build version on testnet must now be 5.
    assert.strictEqual(getDefaultTransactionVersion(networks.zcashTest), ZcashTransaction.VERSION5_BRANCH_NU7);
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcashTest, ZcashTransaction.VERSION5_BRANCH_NU7),
      NU7_BRANCH_ID
    );
    // Bare version 5 on testnet resolves to the current upgrade (NU7).
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcashTest, 5), NU7_BRANCH_ID);
    // Bare version 4 on testnet still resolves to NU6.1 -- the last branch id for which v4 was
    // valid -- since a v4 tx can never be valid under NU7 regardless of which branch id it carries.
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcashTest, 4), NU6_1_BRANCH_ID);
  });

  it('still resolves explicit NU6.1 versions to the NU6.1 branch id', function () {
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcash, ZcashTransaction.VERSION4_BRANCH_NU6_1),
      NU6_1_BRANCH_ID
    );
    assert.strictEqual(
      getDefaultConsensusBranchIdForVersion(networks.zcash, ZcashTransaction.VERSION5_BRANCH_NU6_1),
      NU6_1_BRANCH_ID
    );
  });
});
