import * as assert from 'assert';

import * as sinon from 'sinon';
import nock = require('nock');
import { common, VerificationOptions, Wallet } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { defaultBitGo, getUtxoCoin, keychainsBase58 } from '../../util';
import { getDefaultWasmWalletKeys } from '../../util/keychains';
import type { Zec } from '../../../../src/impl/zec';
import { UtxoWallet } from '../../../../src/wallet';

// ZIP-316 testnet vectors (testnetWallet from the wasm-utxo unified_address fixtures).
const TESTNET_UNIFIED =
  'utest1w5m0qcnp8egl8qa296n70n8nvj0tqnzk90p7f48v7mjhhdrdqs8vgqydslg5plmzefawefnpmgmlm6hcy38m972erwxs04s02cq2prhguz8kqly75m6zjy56m08d5jnycgtpqtjeprte576gkmrxyszepgx76yzuwhh7m4lfz9jaq7unjk0x5ant46juxz73hsc6q4v3dqtzww00vps';
const TESTNET_TRANSPARENT_ADDRESS = 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk';

/**
 * Exercises every client-side flow that runs BEFORE verifyTransaction/signTransaction on a
 * shielded (v6 Ironwood) prebuild: prebuild post-processing, explanation, and recipient
 * validation. Each of them must decode the v6 PSBT — via `Zec.decodeTransaction` ->
 * `ZcashPsbt.fromBytes`, which auto-detects the transaction version — and handle the shielded
 * recipient without error.
 */
const IRONWOOD_RECEIVER = Buffer.from(
  'd632c28aa0831d671be17709a42c9627e2eb687a1b2a55768ea470c9bae7499cd0bd3d0eb0484e307236b5',
  'hex'
);
let unifiedAddress: string;
let walletKeys: fixedScriptWallet.RootWalletKeys;

before(function () {
  unifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
    new Uint8Array(IRONWOOD_RECEIVER),
    'tzec'
  );
  walletKeys = getDefaultWasmWalletKeys().walletKeys;
});

function buildShieldedV6PrebuildHex(): string {
  const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
  psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
    scriptId: { chain: 0, index: 0 },
  });
  psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
  psbt.addShieldedOutputs(
    [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
    new Uint8Array(32)
  );
  return Buffer.from(psbt.serialize()).toString('hex');
}

describe('Zec shielded pre-verify flows (v6 Ironwood PSBT)', function () {
  const zec = getUtxoCoin('tzec');
  const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;

  const keyDocumentObjects = keychainsBase58.map((keychain, keyIdx) => {
    return {
      id: getSeed(keychain.pub).toString('hex'),
      pub: keychain.pub,
      source: ['user', 'backup', 'bitgo'][keyIdx],
      coinSpecific: {},
    };
  });

  afterEach(function () {
    nock.cleanAll();
  });

  it('sendMany recipient validation accepts the unified address', function () {
    zec.checkRecipient({ address: unifiedAddress, amount: '5000' });
  });

  it('postProcessPrebuild decodes the v6 psbt and re-encodes it unchanged', async function () {
    const prebuildHex = buildShieldedV6PrebuildHex();
    nock(bgUrl).get('/api/v2/tzec/public/block/latest').reply(200, { height: 4200000 });
    const prebuild = await zec.postProcessPrebuild({ txHex: prebuildHex, txInfo: {} });
    assert.match(prebuild.txHex as string, /^70736274/); // PSBT magic preserved
    const decoded = zec.decodeTransaction(prebuild.txHex as string);
    assert.ok(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
  });

  it('explainTransaction decodes the v6 psbt and resolves the shielded recipient', async function () {
    const explained = await zec.explainTransaction({
      txHex: buildShieldedV6PrebuildHex(),
      pubs: [keyDocumentObjects[0].pub, keyDocumentObjects[1].pub, keyDocumentObjects[2].pub],
    });
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].address, unifiedAddress);
    assert.strictEqual(explained.outputs[0].amount.toString(), '5000');
    assert.strictEqual(explained.changeOutputs.length, 1);
  });
});

/**
 * `parseTransaction` must take `unifiedRecipientPreference` into account when decoding a
 * prebuild: a shielded recipient resolves to its 43-byte Orchard receiver, which only matches
 * the PSBT's shielded output when the decode uses the 'shielded' preference. The preference is
 * the caller's explicit `unifiedRecipientPreference`, or — when absent — inferred from the
 * recipients themselves.
 */
describe('Zec parseTransaction unifiedRecipientPreference (v6 Ironwood PSBT)', function () {
  const tzec = getUtxoCoin('tzec');

  function getMockWallet(): UtxoWallet {
    const mockWallet = sinon.createStubInstance(Wallet);
    mockWallet.id.returns('test-wallet-id');
    mockWallet.coin.returns('tzec');
    mockWallet.coinSpecific.returns(undefined);
    return mockWallet as unknown as UtxoWallet;
  }

  function getVerification(): VerificationOptions {
    const pubs = keychainsBase58.map((k) => k.pub);
    return {
      disableNetworking: true,
      keychains: {
        user: { id: '0', pub: pubs[0], type: 'independent' },
        backup: { id: '1', pub: pubs[1], type: 'independent' },
        bitgo: { id: '2', pub: pubs[2], type: 'independent' },
      },
    };
  }

  async function parseShieldedV6Prebuild(txParams: {
    recipients: { address: string; amount: string }[];
    unifiedRecipientPreference?: 'shielded' | 'transparent';
  }) {
    return tzec.parseTransaction({
      wallet: getMockWallet(),
      txParams,
      txPrebuild: { txHex: buildShieldedV6PrebuildHex() },
      verification: getVerification(),
    });
  }

  it('infers the shielded preference from an Orchard-only Unified Address recipient', async function () {
    const parsed = await parseShieldedV6Prebuild({
      recipients: [{ address: unifiedAddress, amount: '5000' }],
    });
    const externalOutputs = parsed.outputs.filter((o) => o.external);
    assert.strictEqual(externalOutputs.length, 1);
    assert.strictEqual(externalOutputs[0].address, unifiedAddress);
  });

  it('honors an explicit shielded preference', async function () {
    const parsed = await parseShieldedV6Prebuild({
      recipients: [{ address: unifiedAddress, amount: '5000' }],
      unifiedRecipientPreference: 'shielded',
    });
    const externalOutputs = parsed.outputs.filter((o) => o.external);
    assert.strictEqual(externalOutputs.length, 1);
    assert.strictEqual(externalOutputs[0].address, unifiedAddress);
  });

  it('rejects a transparent resolution of a shielded recipient (intent mismatch)', async function () {
    // Forcing the 'transparent' preference resolves the recipient's script — but an
    // Orchard-only UA has no transparent receiver, so the decode must fail rather than
    // silently mismatch.
    await assert.rejects(
      parseShieldedV6Prebuild({
        recipients: [{ address: unifiedAddress, amount: '5000' }],
        unifiedRecipientPreference: 'transparent',
      })
    );
  });
});

describe('Zec resolveRecipientsFromPsbt (decode + recipient resolution)', function () {
  const tzec = getUtxoCoin('tzec') as Zec;
  const { walletKeys } = getDefaultWasmWalletKeys();
  const IRONWOOD_HEIGHT = 4200000; // after the NU6.3 testnet activation (4134000)

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
    const externalScript = tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS);
    psbt.addTransparentOutput(externalScript, 12345n, unifiedAddress);
    return psbt;
  }

  /** Decode a UA back to its receivers and assert they match the testnet fixture. */
  function assertDecodesBackToFixtureRecipients(unifiedAddress: string): void {
    const parsed = fixedScriptWallet.ZcashUnifiedAddress.parse(unifiedAddress, 'tzec');
    assert.strictEqual(parsed.hasOrchardReceiver, true);
    assert.ok(parsed.orchardReceiver);
    assert.strictEqual(Buffer.from(parsed.orchardReceiver).toString('hex'), IRONWOOD_RECEIVER.toString('hex'));
    assert.strictEqual(parsed.hasTransparentReceiver, true);
    assert.ok(parsed.transparentScript);
    assert.strictEqual(
      Buffer.from(parsed.transparentScript).toString('hex'),
      Buffer.from(tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS)).toString('hex')
    );
  }

  it('resolves a shielded v6 (Ironwood) output to its Orchard Unified Address recipient', function () {
    const recipients = tzec.resolveRecipientsFromPsbt(Buffer.from(buildShieldedV6Psbt().serialize()), walletKeys);
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.strictEqual(recipient.destination.kind, 'zcashShielded');
    assert.strictEqual(recipient.amount, 5000n);
    assert.ok(recipient.address.startsWith('utest1'));
    assert.strictEqual(recipient.address, recipient.destination.unifiedAddress);
    assert.strictEqual(Buffer.from(recipient.script).toString('hex'), IRONWOOD_RECEIVER.toString('hex'));
  });

  it('resolves transparent external outputs and excludes change', function () {
    const recipients = tzec.resolveRecipientsFromPsbt(Buffer.from(buildTransparentV4Psbt().serialize()), walletKeys);
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.strictEqual(recipient.destination.kind, 'transparent');
    assert.strictEqual(recipient.address, TESTNET_TRANSPARENT_ADDRESS);
    assert.strictEqual(recipient.amount, 12345n);
  });

  it('reports the original multi-receiver UA for a shielded output and decodes it back', function () {
    const recipients = tzec.resolveRecipientsFromPsbt(
      Buffer.from(buildShieldedV6Psbt(TESTNET_UNIFIED).serialize()),
      walletKeys
    );
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.strictEqual(recipient.destination.kind, 'zcashShielded');
    assert.strictEqual(recipient.address, TESTNET_UNIFIED);
    assert.strictEqual(recipient.unifiedAddress, TESTNET_UNIFIED);
    assert.strictEqual(recipient.destination.unifiedAddress, TESTNET_UNIFIED);
    assert.strictEqual(Buffer.from(recipient.script).toString('hex'), IRONWOOD_RECEIVER.toString('hex'));
    assertDecodesBackToFixtureRecipients(recipient.unifiedAddress as string);
  });

  it('reports the original multi-receiver UA for a transparent v4 output and decodes it back', function () {
    const recipients = tzec.resolveRecipientsFromPsbt(
      Buffer.from(buildTransparentV4Psbt(TESTNET_UNIFIED).serialize()),
      walletKeys
    );
    assert.strictEqual(recipients.length, 1);
    const recipient = recipients[0];
    assert.strictEqual(recipient.destination.kind, 'zcashUnifiedTransparent');
    assert.strictEqual(recipient.address, TESTNET_UNIFIED);
    assert.strictEqual(recipient.unifiedAddress, TESTNET_UNIFIED);
    assert.strictEqual(recipient.destination.unifiedAddress, TESTNET_UNIFIED);
    assertDecodesBackToFixtureRecipients(recipient.unifiedAddress as string);
  });

  it('resolves recipients from a hex PSBT string', function () {
    const hex = Buffer.from(buildShieldedV6Psbt().serialize()).toString('hex');
    const recipients = tzec.resolveRecipientsFromPsbt(hex, walletKeys);
    assert.strictEqual(recipients.length, 1);
    assert.strictEqual(recipients[0].destination.kind, 'zcashShielded');
  });

  it('throws for a non-Zcash PSBT', function () {
    const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('btc', walletKeys, {});
    psbt.addWalletInput({ txid: '33'.repeat(32), vout: 0, value: 1000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    // Zec.decodeTransaction hands the btc PSBT to ZcashPsbt.fromBytes, which rejects it for
    // its missing Zcash consensus branch ID before the Zcash-type guard is ever reached.
    assert.throws(() => tzec.resolveRecipientsFromPsbt(Buffer.from(psbt.serialize()), walletKeys));
  });
});

describe('Zec getExtraPrebuildParams (unifiedRecipientPreference forwarding)', function () {
  const zec = getUtxoCoin('zec');

  function mockWallet(coin = zec): Wallet {
    return new Wallet(defaultBitGo, coin, { id: '5b34252f1bf349930e34020a', coin: coin.getChain(), type: 'hot' });
  }

  it('forwards unifiedRecipientPreference when present', async function () {
    const wallet = mockWallet();
    const result: Record<string, unknown> = await zec.getExtraPrebuildParams({
      wallet,
      unifiedRecipientPreference: 'shielded',
    });
    assert.strictEqual(result.unifiedRecipientPreference, 'shielded');
  });

  it('does not set unifiedRecipientPreference when absent', async function () {
    const wallet = mockWallet();
    const result = await zec.getExtraPrebuildParams({ wallet });
    assert.strictEqual('unifiedRecipientPreference' in result, false);
  });

  it('still returns the standard extra prebuild params (txFormat) unchanged', async function () {
    const wallet = mockWallet();
    const result = await zec.getExtraPrebuildParams({
      wallet,
      unifiedRecipientPreference: 'shielded',
    });
    assert.strictEqual(result.txFormat, 'psbt-lite');
  });
});
