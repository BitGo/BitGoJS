import * as assert from 'assert';

import * as sinon from 'sinon';
import nock = require('nock');
import { common, Triple, VerificationOptions, Wallet } from '@bitgo/sdk-core';
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

function mutateSerializedUnifiedAddress(psbtHex: string, unifiedAddress: string): string {
  const bytes = Buffer.from(psbtHex, 'hex');
  const metadata = Buffer.from(unifiedAddress, 'utf8');
  const offset = bytes.indexOf(metadata);
  assert.notStrictEqual(offset, -1, 'Unified Address metadata must be present in the serialized PSBT');
  // Change only the metadata bytes. The resulting address is intentionally invalid, which
  // verifies that deserialization does not expose attacker-controlled proprietary metadata.
  bytes[offset] = bytes[offset] === 0x75 ? 0x76 : 0x75;
  return bytes.toString('hex');
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

  it('rejects a v6 PSBT whose preserved UA metadata was mutated after serialization', async function () {
    const mutatedHex = mutateSerializedUnifiedAddress(buildShieldedV6PrebuildHex(), unifiedAddress);
    await assert.rejects(
      zec.explainTransaction({
        txHex: mutatedHex,
        pubs: [keyDocumentObjects[0].pub, keyDocumentObjects[1].pub, keyDocumentObjects[2].pub],
      }),
      /does not match its raw script/
    );
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

  async function parseShieldedV6Prebuild(
    txParams: {
      recipients: { address: string; amount: string }[];
      unifiedRecipientPreference?: 'shielded' | 'transparent';
    },
    txHex = buildShieldedV6PrebuildHex()
  ) {
    return tzec.parseTransaction({
      wallet: getMockWallet(),
      txParams,
      txPrebuild: { txHex },
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
  it('rejects a v6 PSBT with mutated UA metadata during parseTransaction', async function () {
    const mutatedHex = mutateSerializedUnifiedAddress(buildShieldedV6PrebuildHex(), unifiedAddress);
    await assert.rejects(
      parseShieldedV6Prebuild({ recipients: [{ address: unifiedAddress, amount: '5000' }] }, mutatedHex),
      /does not match its raw script/
    );
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
  it('rejects a v4 PSBT whose preserved UA metadata was mutated after serialization', function () {
    const mutatedHex = mutateSerializedUnifiedAddress(
      Buffer.from(buildTransparentV4Psbt(TESTNET_UNIFIED).serialize()).toString('hex'),
      TESTNET_UNIFIED
    );
    assert.throws(() => tzec.resolveRecipientsFromPsbt(mutatedHex, walletKeys), /does not match its raw recipient/);
  });

  it('explainTransaction rejects a v4 PSBT whose preserved UA metadata was mutated', async function () {
    const mutatedHex = mutateSerializedUnifiedAddress(
      Buffer.from(buildTransparentV4Psbt(TESTNET_UNIFIED).serialize()).toString('hex'),
      TESTNET_UNIFIED
    );
    await assert.rejects(
      tzec.explainTransaction({
        txHex: mutatedHex,
        pubs: keychainsBase58.map((keychain) => keychain.pub) as [string, string, string],
      }),
      /does not match its raw script/
    );
  });
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

  it('rejects a v6 PSBT whose preserved UA metadata was mutated after serialization', function () {
    const mutatedHex = mutateSerializedUnifiedAddress(
      Buffer.from(buildShieldedV6Psbt(TESTNET_UNIFIED).serialize()).toString('hex'),
      TESTNET_UNIFIED
    );
    assert.throws(() => tzec.resolveRecipientsFromPsbt(mutatedHex, walletKeys), /does not match its raw recipient/);
  });

  it('explainTransaction rejects a v6 PSBT whose preserved UA metadata was mutated', async function () {
    const mutatedHex = mutateSerializedUnifiedAddress(
      Buffer.from(buildShieldedV6Psbt(TESTNET_UNIFIED).serialize()).toString('hex'),
      TESTNET_UNIFIED
    );
    await assert.rejects(
      tzec.explainTransaction({
        txHex: mutatedHex,
        pubs: keychainsBase58.map((keychain) => keychain.pub) as [string, string, string],
      }),
      /does not match its raw script/
    );
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

describe('Zec signTransaction (v6 Ironwood transparent-input signing)', function () {
  const zec = getUtxoCoin('tzec') as Zec;
  const { xpubs } = getDefaultWasmWalletKeys();
  const [userKeychain, backupKeychain, bitgoKeychain] = keychainsBase58;
  const pubs: Triple<string> = [userKeychain.pub, backupKeychain.pub, bitgoKeychain.pub];

  it('signs the transparent inputs with the user key and finalizes the shielded out_ciphertext (ovk via ECDH)', async function () {
    const signed = await zec.signTransaction({
      txPrebuild: { txHex: buildShieldedV6PrebuildHex() },
      prv: userKeychain.prv,
      pubs,
    });
    assert.ok('txHex' in signed);
    const { txHex } = signed;
    // The half-signed result is the v6 PSBT with the user's ECDSA signatures over the
    // ZIP-244 transparent sighash. Deriving the ovk (ECDH of the BitGo root pubkey and the
    // user root key) and finalizing out_ciphertext happens inside sign(), before any
    // sighash is computed — a failing ovk step aborts the whole round.
    const psbt = zec.decodeTransaction(Buffer.from(txHex, 'hex'));
    assert.ok(psbt instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
    assert.strictEqual(psbt.verifySignature(0, xpubs[0]), true);
    assert.strictEqual(psbt.verifySignature(0, xpubs[2]), false);
  });

  it('out_ciphertext survives the serialize round-trip: the BitGo countersigning round succeeds on it', async function () {
    const userRound = await zec.signTransaction({
      txPrebuild: { txHex: buildShieldedV6PrebuildHex() },
      prv: userKeychain.prv,
      pubs,
    });
    assert.ok('txHex' in userRound);
    const bitgoRound = await zec.signTransaction({
      txPrebuild: { txHex: userRound.txHex },
      prv: bitgoKeychain.prv,
      pubs,
    });
    assert.ok('txHex' in bitgoRound);
    const psbt = zec.decodeTransaction(Buffer.from(bitgoRound.txHex, 'hex'));
    assert.ok(psbt instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt);
    // Fully signed transparent inputs: both the user and BitGo signatures verify against
    // the v6 (ZIP-244) sighash — the proof service takes it from here via combineProof.
    assert.strictEqual(psbt.verifySignature(0, xpubs[0]), true);
    assert.strictEqual(psbt.verifySignature(0, xpubs[2]), true);
    assert.strictEqual(psbt.verifySignature(0, xpubs[1]), false);
  });

  it('rejects a first signing round opened by a non-user key', async function () {
    // The wasm derives the ovk from the first-round signer's key: a round opened by the
    // backup or BitGo key would produce an out_ciphertext neither the user nor the server
    // can re-derive, leaving the shielded output unrecoverable.
    await assert.rejects(
      zec.signTransaction({
        txPrebuild: { txHex: buildShieldedV6PrebuildHex() },
        prv: bitgoKeychain.prv,
        pubs,
      }),
      /user/
    );
  });

  it('requires rootWalletKeys when signing an Ironwood PSBT', function () {
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(
      Buffer.from(buildShieldedV6PrebuildHex(), 'hex'),
      'tzec'
    );
    const { xprivs } = getDefaultWasmWalletKeys();
    // Without rootWalletKeys the ovk step cannot run, so sign() throws at runtime rather
    // than silently skipping it — the signing dispatch must always pass rootWalletKeys.
    assert.throws(() => psbt.sign(xprivs[0]));
  });

  it('signs a v4 (Sapling-shaped) psbt through the generic signing path', async function () {
    // The signTransaction override routes only v6 (Ironwood) prebuilds; a v4 prebuild must
    // keep flowing through the generic path unchanged.
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '44'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    const signed = await zec.signTransaction({
      txPrebuild: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
      prv: userKeychain.prv,
      pubs,
    });
    assert.ok('txHex' in signed);
    const decoded = zec.decodeTransaction(Buffer.from(signed.txHex, 'hex'));
    assert.ok(decoded instanceof fixedScriptWallet.ZcashBitGoPsbt);
    assert.ok(!(decoded instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt));
    assert.strictEqual(decoded.verifySignature(0, xpubs[0]), true);
  });
});

describe('Zec shielded out_ciphertext (ovk derivation)', function () {
  const { xprivs } = getDefaultWasmWalletKeys();

  function buildPsbt(buildOvk?: Uint8Array): fixedScriptWallet.ZcashIronwoodBitGoPsbt {
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    psbt.addShieldedOutputs(
      [
        {
          recipient: new Uint8Array(IRONWOOD_RECEIVER),
          amount: 5000n,
          unifiedAddress,
          ...(buildOvk ? { ovk: buildOvk } : {}),
        },
      ],
      new Uint8Array(32)
    );
    return psbt;
  }

  function pcztOf(psbt: fixedScriptWallet.ZcashIronwoodBitGoPsbt): Buffer {
    const pczt = psbt.getPczt();
    assert.ok(pczt, 'expected the orchard PCZT to be present');
    return Buffer.from(pczt);
  }

  it('sign() finalizes out_ciphertext to the same bytes as the explicit client-managed-ovk derivation', function () {
    // out_ciphertext encryption is deterministic given the (identical) orchard action and the
    // ovk, so byte-equality of the PCZT proves sign()'s implicit derivation is exactly the
    // documented one: the ECDH agreement of rootWalletKeys.bitgoKey() and the user root key.
    const bytes = buildPsbt().serialize();
    const autoPsbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(bytes, 'tzec');
    autoPsbt.sign(xprivs[0], walletKeys);
    const manualPsbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(bytes, 'tzec');
    manualPsbt.setShieldedOutCiphertext(0, xprivs[0], walletKeys);
    assert.deepStrictEqual(pcztOf(autoPsbt), pcztOf(manualPsbt));
  });

  it('out_ciphertext differs when encrypted under different ovks', function () {
    // The binding between out_ciphertext and the ovk is real: two builds identical except for
    // the build-time ovk produce different PCZTs, so the equality assertions here are not
    // vacuous (out_ciphertext cannot be a constant).
    assert.notDeepStrictEqual(
      pcztOf(buildPsbt(new Uint8Array(32).fill(1))),
      pcztOf(buildPsbt(new Uint8Array(32).fill(2)))
    );
  });

  it('sign() overrides a build-time ovk with the wallet ovk', function () {
    const bytes = buildPsbt(new Uint8Array(32).fill(1)).serialize();
    const builtPsbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(bytes, 'tzec');
    const signedPsbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(bytes, 'tzec');
    signedPsbt.sign(xprivs[0], walletKeys);
    // The first signing round re-encrypts out_ciphertext under the wallet ovk, discarding the
    // build-time one...
    assert.notDeepStrictEqual(pcztOf(signedPsbt), pcztOf(builtPsbt));
    // ...and the result is byte-identical to the explicit wallet-ovk derivation.
    const manualPsbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(bytes, 'tzec');
    manualPsbt.setShieldedOutCiphertext(0, xprivs[0], walletKeys);
    assert.deepStrictEqual(pcztOf(signedPsbt), pcztOf(manualPsbt));
  });

  it('rejects an ovk derived from a non-user key', function () {
    // An ovk from the backup or BitGo key is one neither the user nor the server can
    // reproduce, which would leave the shielded output unrecoverable after broadcast.
    const psbt = buildPsbt();
    assert.throws(() => psbt.setShieldedOutCiphertext(0, xprivs[1], walletKeys));
    assert.throws(() => psbt.setShieldedOutCiphertext(0, xprivs[2], walletKeys));
  });
});
