import * as assert from 'assert';
import { BufferWriter } from 'bitcoinjs-lib/src/bufferutils';

import { hasSaplingOrOrchardShieldedComponentsFromBuffer } from '../../../src/bitgo/zcash/ZcashBufferutils';

function finalize(w: BufferWriter): Buffer {
  return w.buffer.slice(0, w.offset);
}

describe('ZcashBufferutils.hasSaplingOrOrchardShieldedComponentsFromBuffer', function () {
  it('returns false for minimal v4 transparent-only (empty Sapling bundle)', function () {
    const w = new BufferWriter(Buffer.alloc(256));
    w.writeInt32((1 << 31) | 4);
    w.writeUInt32(0x892f2085); // SAPLING_VERSION_GROUP_ID
    w.writeVarInt(0); // vin
    w.writeVarInt(0); // vout
    w.writeUInt32(0); // locktime
    w.writeUInt32(0); // expiryHeight
    w.writeSlice(Buffer.alloc(8, 0)); // valueBalance
    w.writeVarInt(0); // vSpendsSapling
    w.writeVarInt(0); // vOutputsSapling
    // JoinSplits omitted: this helper does not read them.
    const tx = finalize(w);

    assert.strictEqual(hasSaplingOrOrchardShieldedComponentsFromBuffer(tx), false);
  });

  it('returns true for v4 when Sapling bundle is non-empty', function () {
    const w = new BufferWriter(Buffer.alloc(256));
    w.writeInt32((1 << 31) | 4);
    w.writeUInt32(0x892f2085);
    w.writeVarInt(0);
    w.writeVarInt(0);
    w.writeUInt32(0);
    w.writeUInt32(0);
    w.writeSlice(Buffer.alloc(8, 0));
    w.writeVarInt(1); // vSpendsSapling (non-empty -> readEmptySaplingBundle throws)
    const tx = finalize(w);

    assert.strictEqual(hasSaplingOrOrchardShieldedComponentsFromBuffer(tx), true);
  });

  it('returns false for minimal v5 transparent-only (empty Sapling + Orchard)', function () {
    const w = new BufferWriter(Buffer.alloc(256));
    w.writeInt32((1 << 31) | 5);
    w.writeUInt32(0x26a7270a); // ZIP225_VERSION_GROUP_ID
    w.writeUInt32(0xc2d6d0b4); // consensusBranchId (NU5; arbitrary for this test)
    w.writeUInt32(0); // locktime
    w.writeUInt32(0); // expiryHeight
    w.writeVarInt(0); // vin
    w.writeVarInt(0); // vout
    w.writeVarInt(0); // vSpendsSapling
    w.writeVarInt(0); // vOutputsSapling
    w.writeUInt8(0x00); // orchard bundle empty marker
    const tx = finalize(w);

    assert.strictEqual(hasSaplingOrOrchardShieldedComponentsFromBuffer(tx), false);
  });

  it('returns true for v5 when Orchard bundle is non-empty', function () {
    const w = new BufferWriter(Buffer.alloc(256));
    w.writeInt32((1 << 31) | 5);
    w.writeUInt32(0x26a7270a);
    w.writeUInt32(0xc2d6d0b4);
    w.writeUInt32(0);
    w.writeUInt32(0);
    w.writeVarInt(0);
    w.writeVarInt(0);
    w.writeVarInt(0);
    w.writeVarInt(0);
    w.writeUInt8(0x01); // orchard bundle present -> readEmptyOrchardBundle throws
    const tx = finalize(w);

    assert.strictEqual(hasSaplingOrOrchardShieldedComponentsFromBuffer(tx), true);
  });
});
