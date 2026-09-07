import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as sinon from 'sinon';
import { fixedScriptWallet, isWasmUtxoError } from '@bitgo/wasm-utxo';
import { ExtraPrebuildParamsOptions, Wallet } from '@bitgo/sdk-core';

import { getUtxoCoin, defaultBitGo, getDefaultWasmWalletKeys } from '../../util';
import { Zec } from '../../../../src/impl/zec';

type UaVector = {
  network: 'zec' | 'tzec';
  unified: string;
  transparentAddress?: string;
  orchardReceiverHex?: string;
  ironwoodReceiverHex?: string;
  transparentPubkeyHashHex: string;
};

const MAINNET_UA = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../fixtures/zec/unified_address.json'), 'utf8')
) as UaVector;
const TESTNET_UA = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../fixtures/tzec/unified_address.json'), 'utf8')
) as UaVector;

describe('Zec Unified Address support', function () {
  const zec = getUtxoCoin('zec');
  const tzec = getUtxoCoin('tzec');

  describe('isValidAddress', function () {
    it('accepts a mainnet unified address (transparent + Orchard receivers)', function () {
      assert.strictEqual(zec.isValidAddress(MAINNET_UA.unified), true);
    });

    it('accepts a testnet unified address (transparent + Ironwood receivers)', function () {
      assert.strictEqual(tzec.isValidAddress(TESTNET_UA.unified), true);
    });

    it('accepts an Orchard-only (single-receiver) unified address', function () {
      const orchardOnlyUa = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
        Buffer.from(TESTNET_UA.ironwoodReceiverHex as string, 'hex'),
        'tzec'
      );
      assert.strictEqual(tzec.isValidAddress(orchardOnlyUa), true);
    });

    it('rejects a malformed unified address', function () {
      assert.strictEqual(zec.isValidAddress('u1notavalidunifiedaddress'), false);
    });

    it('rejects a unified address on the wrong network', function () {
      // MAINNET_UA has the "u1..." HRP; tzec expects "utest1...".
      assert.strictEqual(tzec.isValidAddress(MAINNET_UA.unified), false);
    });

    it('still validates ordinary transparent addresses', function () {
      assert.strictEqual(tzec.isValidAddress(TESTNET_UA.transparentAddress as string), true);
      assert.strictEqual(tzec.isValidAddress('not-an-address'), false);
    });
  });

  describe('resolveOutputScript', function () {
    it("resolves a unified address's Orchard/Ironwood receiver when preference is 'shielded'", function () {
      const script = tzec.resolveOutputScript(TESTNET_UA.unified, 'shielded');
      assert.strictEqual(Buffer.from(script).toString('hex'), TESTNET_UA.ironwoodReceiverHex);
      assert.strictEqual(script.length, 43);
    });

    it("resolves a mainnet unified address's Orchard receiver when preference is 'shielded'", function () {
      const script = zec.resolveOutputScript(MAINNET_UA.unified, 'shielded');
      assert.strictEqual(Buffer.from(script).toString('hex'), MAINNET_UA.orchardReceiverHex);
    });

    it("resolves a unified address's transparent receiver when preference is not shielded", function () {
      const expectedScript = `76a914${TESTNET_UA.transparentPubkeyHashHex}88ac`;
      assert.strictEqual(Buffer.from(tzec.resolveOutputScript(TESTNET_UA.unified)).toString('hex'), expectedScript);
      assert.strictEqual(
        Buffer.from(tzec.resolveOutputScript(TESTNET_UA.unified, 'transparent')).toString('hex'),
        expectedScript
      );
    });

    it('throws when a shielded-only unified address is resolved without the shielded preference', function () {
      const orchardOnlyUa = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
        Buffer.from(TESTNET_UA.ironwoodReceiverHex as string, 'hex'),
        'tzec'
      );
      assert.throws(() => tzec.resolveOutputScript(orchardOnlyUa), /Could not decode|no transparent receiver/);
      assert.throws(() => tzec.resolveOutputScript(orchardOnlyUa, 'transparent'));
    });

    it('resolves an ordinary transparent address regardless of preference', function () {
      const expectedScript = `76a914${TESTNET_UA.transparentPubkeyHashHex}88ac`;
      assert.strictEqual(
        Buffer.from(tzec.resolveOutputScript(TESTNET_UA.transparentAddress as string)).toString('hex'),
        expectedScript
      );
      assert.strictEqual(
        Buffer.from(tzec.resolveOutputScript(TESTNET_UA.transparentAddress as string, 'shielded')).toString('hex'),
        expectedScript
      );
    });
  });

  describe('getExtraPrebuildParams', function () {
    function mockWallet(coin = zec) {
      return new Wallet(defaultBitGo, coin, { id: '5b34252f1bf349930e34020a', coin: coin.getChain(), type: 'hot' });
    }

    it('forwards unifiedRecipientPreference when present', async function () {
      const wallet = mockWallet();
      const result: Record<string, unknown> = await zec.getExtraPrebuildParams({
        wallet,
        unifiedRecipientPreference: 'shielded',
      } as ExtraPrebuildParamsOptions & { wallet: Wallet });
      assert.strictEqual(result.unifiedRecipientPreference, 'shielded');
    });

    it('does not set unifiedRecipientPreference when absent', async function () {
      const wallet = mockWallet();
      const result = await zec.getExtraPrebuildParams({ wallet } as ExtraPrebuildParamsOptions & { wallet: Wallet });
      assert.strictEqual('unifiedRecipientPreference' in result, false);
    });

    it('still returns the standard extra prebuild params (txFormat) unchanged', async function () {
      const wallet = mockWallet();
      const result = await zec.getExtraPrebuildParams({
        wallet,
        unifiedRecipientPreference: 'shielded',
      } as ExtraPrebuildParamsOptions & { wallet: Wallet });
      assert.strictEqual(result.txFormat, 'psbt-lite');
    });
  });

  describe('decodeTransaction / decodeTransactionFromPrebuild', function () {
    const { walletKeys } = getDefaultWasmWalletKeys();

    function buildV4Psbt(): fixedScriptWallet.ZcashBitGoPsbt {
      const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('zec', walletKeys, { blockHeight: 3146400 });
      psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
        scriptId: { chain: 0, index: 0 },
      });
      psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
      return psbt;
    }

    it('decodes a v4 (Sapling-shaped) PSBT as a ZcashBitGoPsbt', function () {
      const bytes = Buffer.from(buildV4Psbt().serialize());
      const decoded = zec.decodeTransaction(bytes);
      assert.ok(decoded instanceof fixedScriptWallet.ZcashBitGoPsbt);
      assert.ok(!(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt));
    });

    it('decodeTransactionFromPrebuild decodes a v4 txHex the same way', function () {
      const bytes = Buffer.from(buildV4Psbt().serialize());
      const decoded = zec.decodeTransactionFromPrebuild({ txHex: bytes.toString('hex') });
      assert.ok(decoded instanceof fixedScriptWallet.ZcashBitGoPsbt);
    });

    it('falls back to ZcashIronwoodBitGoPsbt.fromBytes for v6-shaped bytes', function () {
      // ZcashBitGoPsbt.fromBytes throws (a real WasmUtxoError) for v6-shaped bytes, telling the
      // caller to use ZcashIronwoodBitGoPsbt.fromBytes instead; stub both statics to prove
      // Zec.decodeTransaction actually performs that fallback dispatch rather than propagating
      // the first error.
      class FakeWasmUtxoError extends Error {
        code = 'WasmUtxoError.StringError';
      }
      Object.defineProperty(FakeWasmUtxoError.prototype, Symbol.for('@bitgo/wasm-utxo/error'), { value: true });
      assert.ok(isWasmUtxoError(new FakeWasmUtxoError('this is a v6 (Ironwood) PSBT')));

      const fakeIronwoodPsbt = Object.create(fixedScriptWallet.ZcashIronwoodBitGoPsbt.prototype);
      const v4Stub = sinon
        .stub(fixedScriptWallet.ZcashBitGoPsbt, 'fromBytes')
        .throws(new FakeWasmUtxoError('this is a v6 (Ironwood) PSBT: use ZcashIronwoodBitGoPsbt.fromBytes instead'));
      const v6Stub = sinon.stub(fixedScriptWallet.ZcashIronwoodBitGoPsbt, 'fromBytes').returns(fakeIronwoodPsbt);

      try {
        const psbtMagicBytes = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff, 0x00]);
        const decoded = zec.decodeTransaction(psbtMagicBytes);
        assert.strictEqual(decoded, fakeIronwoodPsbt);
        assert.strictEqual(v4Stub.calledOnce, true);
        assert.strictEqual(v6Stub.calledOnce, true);
      } finally {
        v4Stub.restore();
        v6Stub.restore();
      }
    });

    it('propagates a non-wasm-utxo error from the v4 decode path without attempting the v6 fallback', function () {
      const v4Stub = sinon.stub(fixedScriptWallet.ZcashBitGoPsbt, 'fromBytes').throws(new Error('boom'));
      const v6Stub = sinon.stub(fixedScriptWallet.ZcashIronwoodBitGoPsbt, 'fromBytes');

      try {
        const psbtMagicBytes = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff, 0x00]);
        assert.throws(() => zec.decodeTransaction(psbtMagicBytes), /boom/);
        assert.strictEqual(v6Stub.called, false);
      } finally {
        v4Stub.restore();
        v6Stub.restore();
      }
    });
  });

  describe('resolveRecipientsFromPsbt', function () {
    const { walletKeys } = getDefaultWasmWalletKeys();
    const IRONWOOD_HEIGHT = 4200000; // after the NU6.3 testnet activation (4134000)
    const IRONWOOD_RECEIVER = Buffer.from(TESTNET_UA.ironwoodReceiverHex as string, 'hex');

    function buildShieldedV6Psbt(
      unifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
        new Uint8Array(IRONWOOD_RECEIVER),
        'tzec'
      )
    ): fixedScriptWallet.ZcashIronwoodBitGoPsbt {
      const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, {
        blockHeight: IRONWOOD_HEIGHT,
      });
      psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
        scriptId: { chain: 0, index: 0 },
      });
      psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
      psbt.addShieldedOutputs(
        [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
        new Uint8Array(32) // all-zero anchor, as in the utxo-core shielded build tests
      );
      return psbt;
    }

    function buildTransparentV4Psbt(unifiedAddress?: string): fixedScriptWallet.ZcashBitGoPsbt {
      const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
      psbt.addWalletInput({ txid: '22'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
        scriptId: { chain: 0, index: 1 },
      });
      psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 100000n });
      const externalScript = tzec.resolveOutputScript(TESTNET_UA.transparentAddress as string);
      psbt.addTransparentOutput(externalScript, 12345n, unifiedAddress);
      return psbt;
    }

    /** Decode a UA back to its receivers and assert they match the testnet fixture. */
    function assertDecodesBackToFixtureRecipients(unifiedAddress: string, zec: Zec): void {
      const parsed = fixedScriptWallet.ZcashUnifiedAddress.parse(unifiedAddress, 'tzec');
      assert.strictEqual(parsed.hasOrchardReceiver, true);
      assert.ok(parsed.orchardReceiver);
      assert.strictEqual(Buffer.from(parsed.orchardReceiver).toString('hex'), TESTNET_UA.ironwoodReceiverHex);
      assert.strictEqual(parsed.hasTransparentReceiver, true);
      assert.ok(parsed.transparentScript);
      assert.strictEqual(
        Buffer.from(parsed.transparentScript).toString('hex'),
        Buffer.from(zec.resolveOutputScript(TESTNET_UA.transparentAddress as string)).toString('hex')
      );
    }
    const tzecCoin = tzec as Zec;

    it('resolves a shielded v6 (Ironwood) output to its Orchard Unified Address recipient', function () {
      const recipients = tzecCoin.resolveRecipientsFromPsbt(Buffer.from(buildShieldedV6Psbt().serialize()), walletKeys);
      assert.strictEqual(recipients.length, 1);
      const recipient = recipients[0];
      assert.strictEqual(recipient.destination.kind, 'zcashShielded');
      assert.strictEqual(recipient.amount, 5000n);
      assert.ok(recipient.address.startsWith('utest1'));
      assert.strictEqual(recipient.address, recipient.destination.unifiedAddress);
      assert.strictEqual(Buffer.from(recipient.script).toString('hex'), TESTNET_UA.ironwoodReceiverHex);
    });

    it('resolves transparent external outputs and excludes change', function () {
      const recipients = tzecCoin.resolveRecipientsFromPsbt(
        Buffer.from(buildTransparentV4Psbt().serialize()),
        walletKeys
      );
      assert.strictEqual(recipients.length, 1);
      const recipient = recipients[0];
      assert.strictEqual(recipient.destination.kind, 'transparent');
      assert.strictEqual(recipient.address, TESTNET_UA.transparentAddress);
      assert.strictEqual(recipient.amount, 12345n);
    });

    it('reports the original multi-receiver UA for a shielded output and decodes it back', function () {
      // The client passed the full multi-receiver UA; the v6 PCZT stores it verbatim in the
      // PSBT's key-value pairs, so the resolved recipient must report that same string.
      const recipients = tzecCoin.resolveRecipientsFromPsbt(
        Buffer.from(buildShieldedV6Psbt(TESTNET_UA.unified).serialize()),
        walletKeys
      );
      assert.strictEqual(recipients.length, 1);
      const recipient = recipients[0];
      assert.strictEqual(recipient.destination.kind, 'zcashShielded');
      assert.strictEqual(recipient.address, TESTNET_UA.unified);
      assert.strictEqual(recipient.unifiedAddress, TESTNET_UA.unified);
      assert.strictEqual(recipient.destination.unifiedAddress, TESTNET_UA.unified);
      assert.strictEqual(Buffer.from(recipient.script).toString('hex'), TESTNET_UA.ironwoodReceiverHex);
      assertDecodesBackToFixtureRecipients(recipient.unifiedAddress as string, tzecCoin);
    });

    it('reports the original multi-receiver UA for a transparent v4 output and decodes it back', function () {
      // The original UA is stored in the transparent-output proprietary key-value map and read
      // back via transparentOutputUnifiedAddress.
      const recipients = tzecCoin.resolveRecipientsFromPsbt(
        Buffer.from(buildTransparentV4Psbt(TESTNET_UA.unified).serialize()),
        walletKeys
      );
      assert.strictEqual(recipients.length, 1);
      const recipient = recipients[0];
      assert.strictEqual(recipient.destination.kind, 'zcashUnifiedTransparent');
      assert.strictEqual(recipient.address, TESTNET_UA.unified);
      assert.strictEqual(recipient.unifiedAddress, TESTNET_UA.unified);
      assert.strictEqual(recipient.destination.unifiedAddress, TESTNET_UA.unified);
      assertDecodesBackToFixtureRecipients(recipient.unifiedAddress as string, tzecCoin);
    });

    it('resolves recipients from a hex PSBT string', function () {
      const hex = Buffer.from(buildShieldedV6Psbt().serialize()).toString('hex');
      const recipients = tzecCoin.resolveRecipientsFromPsbt(hex, walletKeys);
      assert.strictEqual(recipients.length, 1);
      assert.strictEqual(recipients[0].destination.kind, 'zcashShielded');
    });

    it('throws for a non-Zcash PSBT', function () {
      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, {});
      psbt.addWalletInput({ txid: '33'.repeat(32), vout: 0, value: 1000n }, walletKeys, {
        scriptId: { chain: 0, index: 0 },
      });
      // Zec.decodeTransaction attempts ZcashBitGoPsbt.fromBytes, which rejects a btc PSBT for
      // its missing Zcash consensus branch ID before the Zcash-type guard is ever reached.
      assert.throws(() => tzecCoin.resolveRecipientsFromPsbt(Buffer.from(psbt.serialize()), walletKeys));
    });
  });
});
