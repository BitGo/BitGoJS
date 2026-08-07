import * as assert from 'assert';
import { networks } from '../../../src';
import { ZcashTransaction } from '../../../src/bitgo';

// Minimal Sapling v4 transaction with valueBalance = -5 (t->z shielding).
// Built as: header(0x80000004) | versionGroupId(0x892F2085) | vin(0) | vout(0) |
//           locktime(0) | expiryHeight(0) | valueBalance(-5 as int64le) |
//           vSpendsSapling(0) | vOutputsSapling(0) | vJoinSplit(0)
const SHIELDING_TX_HEX = '0400008085202f8900000000000000000000fbffffffffffffff000000';

describe('ZcashTransaction (Sapling valueBalance)', function () {
  describe('round-trip for t->z shielding tx (negative valueBalance)', function () {
    it('parses without throwing', function () {
      const tx = ZcashTransaction.fromBuffer(Buffer.from(SHIELDING_TX_HEX, 'hex'), false, 'number', networks.zcash);
      // saplingValueBalance stores raw bytes; -5 in int64le is fb ff ff ff ff ff ff ff
      assert.strictEqual(tx.saplingValueBalance.toString('hex'), 'fbffffffffffffff');
    });

    it('re-serializes to the same hex (toBuffer round-trip)', function () {
      const tx = ZcashTransaction.fromBuffer(Buffer.from(SHIELDING_TX_HEX, 'hex'), false, 'number', networks.zcash);
      assert.strictEqual(tx.toBuffer().toString('hex'), SHIELDING_TX_HEX);
    });

    it('computes getId() without throwing', function () {
      const tx = ZcashTransaction.fromBuffer(Buffer.from(SHIELDING_TX_HEX, 'hex'), false, 'number', networks.zcash);
      // Just verify it does not throw; the exact txid is deterministic from the hex above.
      assert.doesNotThrow(() => tx.getId());
    });

    it('clones correctly', function () {
      const tx = ZcashTransaction.fromBuffer(Buffer.from(SHIELDING_TX_HEX, 'hex'), false, 'number', networks.zcash);
      const cloned = tx.clone();
      assert.strictEqual(cloned.toBuffer().toString('hex'), SHIELDING_TX_HEX);
    });
  });

  describe('round-trip for transparent tx (zero valueBalance)', function () {
    it('saplingValueBalance defaults to all-zero bytes', function () {
      const tx = new ZcashTransaction(networks.zcash);
      assert.strictEqual(tx.saplingValueBalance.toString('hex'), '0000000000000000');
    });
  });
});
