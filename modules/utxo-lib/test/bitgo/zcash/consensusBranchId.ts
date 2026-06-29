import * as assert from 'assert';
import { networks } from '../../../src';
import {
  ZcashTransaction,
  getDefaultConsensusBranchIdForVersion,
  getDefaultTransactionVersion,
} from '../../../src/bitgo';

// NU6.2 emergency hard fork re-enabling Orchard (mainnet block 3364600, testnet 4052000).
describe('Zcash consensus branch id (NU6.2)', function () {
  const NU6_1_BRANCH_ID = 0x4dec4df0;
  const NU6_2_BRANCH_ID = 0x5437f330;

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

  it('keeps testnet on NU6.1 (NU6.2 not yet activated on testnet)', function () {
    assert.strictEqual(getDefaultTransactionVersion(networks.zcashTest), ZcashTransaction.VERSION4_BRANCH_NU6_1);
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcashTest, 4), NU6_1_BRANCH_ID);
    assert.strictEqual(getDefaultConsensusBranchIdForVersion(networks.zcashTest, 5), NU6_1_BRANCH_ID);
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
