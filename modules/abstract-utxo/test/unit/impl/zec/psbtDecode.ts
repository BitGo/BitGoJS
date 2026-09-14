import assert from 'node:assert/strict';

import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { getUtxoCoin, getDefaultWasmWalletKeys } from '../../util';

/**
 * Zec.decodeTransaction must deserialize both supported Zcash PSBT formats. `ZcashPsbt.fromBytes`
 * reads the Zcash transaction version from the parsed metadata and dispatches to the
 * format-specific implementation — `ZcashBitGoPsbt` for v4, `ZcashIronwoodBitGoPsbt` for v6 —
 * so a shielded (v6 Ironwood) PSBT decodes to a parser that understands its orchard PCZT
 * instead of silently degrading to the generic v4-shaped wrapper.
 */
describe('Zec PSBT decode (v4 + v6 Ironwood)', function () {
  const zec = getUtxoCoin('zec');
  const tzec = getUtxoCoin('tzec');
  const { walletKeys } = getDefaultWasmWalletKeys();

  function buildV4Psbt(): fixedScriptWallet.ZcashBitGoPsbt {
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('zec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    return psbt;
  }

  function buildV6Psbt(): fixedScriptWallet.ZcashIronwoodBitGoPsbt {
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '33'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    return psbt;
  }

  it('decodes a v4 (Sapling-shaped) PSBT as a ZcashBitGoPsbt', function () {
    const decoded = zec.decodeTransaction(Buffer.from(buildV4Psbt().serialize()));
    assert.ok(decoded instanceof fixedScriptWallet.ZcashBitGoPsbt);
    assert.ok(!(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt));
  });

  it('decodes a v6 (Ironwood) PSBT as a ZcashIronwoodBitGoPsbt', function () {
    const decoded = tzec.decodeTransaction(Buffer.from(buildV6Psbt().serialize()));
    assert.ok(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
    assert.strictEqual(decoded.getVersion(), 6);
  });

  it('decodes a v6 PSBT from a hex string', function () {
    const hex = Buffer.from(buildV6Psbt().serialize()).toString('hex');
    const decoded = tzec.decodeTransaction(hex);
    assert.ok(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
  });

  it('decodes a v6 PSBT from a base64 string', function () {
    const base64 = Buffer.from(buildV6Psbt().serialize()).toString('base64');
    const decoded = tzec.decodeTransaction(base64);
    assert.ok(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
  });

  it('decodeTransactionFromPrebuild decodes a v6 psbt hex', function () {
    const hex = Buffer.from(buildV6Psbt().serialize()).toString('hex');
    const decoded = tzec.decodeTransactionFromPrebuild({ txHex: hex });
    assert.ok(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
  });

  it('throws the legacy-format error for a non-PSBT transaction', function () {
    assert.throws(() => zec.decodeTransaction(Buffer.alloc(32)), /txFormat=legacy is deprecated/);
  });

  it('propagates deserializer errors for malformed PSBT bytes', function () {
    // PSBT magic followed by junk.
    assert.throws(() => zec.decodeTransaction(Buffer.from('70736274ff00', 'hex')), /Failed to deserialize PSBT/);
  });
});
