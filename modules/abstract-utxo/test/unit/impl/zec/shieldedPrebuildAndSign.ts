import * as assert from 'assert';

import * as sinon from 'sinon';
import nock = require('nock');
import { common, TxIntentMismatchError, VerificationOptions, Wallet } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import { defaultBitGo, getUtxoCoin, getUtxoWallet, keychainsBase58 } from '../../util';
import { getDefaultWasmWalletKeys } from '../../util/keychains';
import type { Zec } from '../../../../src/impl/zec';
import { UtxoWallet } from '../../../../src/wallet';
import type { TransactionParams, VerifyTransactionOptions } from '../../../../src/abstractUtxoCoin';

// ZIP-316 testnet vectors (testnetWallet from the wasm-utxo unified_address fixtures).
const TESTNET_UNIFIED =
  'utest1w5m0qcnp8egl8qa296n70n8nvj0tqnzk90p7f48v7mjhhdrdqs8vgqydslg5plmzefawefnpmgmlm6hcy38m972erwxs04s02cq2prhguz8kqly75m6zjy56m08d5jnycgtpqtjeprte576gkmrxyszepgx76yzuwhh7m4lfz9jaq7unjk0x5ant46juxz73hsc6q4v3dqtzww00vps';
const TESTNET_TRANSPARENT_ADDRESS = 'tmM4DvLVJKXZt5ydn1tqYTHvahpKSwgjuRk';

/**
 * Exercises the client-side flows over a shielded (v6 Ironwood) prebuild: prebuild
 * post-processing, explanation, recipient validation, and verifyTransaction against the
 * requested recipients. Each of them must decode the v6 PSBT — via `Zec.decodeTransaction` ->
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

describe('Zec verifyTransaction (v6 Ironwood PSBT)', function () {
  const tzec = getUtxoCoin('tzec');
  const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;

  const keyDocumentObjects = keychainsBase58.map((keychain, keyIdx) => {
    return {
      id: getSeed(keychain.pub).toString('hex'),
      pub: keychain.pub,
      source: ['user', 'backup', 'bitgo'][keyIdx],
      coinSpecific: {},
    };
  });

  const zecWallet = getUtxoWallet(tzec, {
    id: 'walletId',
    keys: keyDocumentObjects.map((k) => k.id),
    coinSpecific: { addressVersion: 'base58' },
  });
  let activeNocks: nock.Scope[] = [];

  /** Nock the keychain lookups (exactly one GET per key, consumed by fetchKeychains). PSBT
   * prebuilds carry their external/internal classification inline, so no address lookups
   * happen; any unexpected HTTP attempt would fail the test via nock activation. */
  function nockVerifyFlow(): void {
    nock.cleanAll();
    activeNocks = keyDocumentObjects.map((keyDocument) =>
      nock(bgUrl).get(`/api/v2/tzec/key/${keyDocument.id}`).reply(200, keyDocument)
    );
  }

  afterEach(function () {
    // every verify must consume the mocked keychain lookups; any leftover HTTP intent fails here
    activeNocks.forEach((scope) => assert.ok(scope.isDone(), 'nock interceptor not fully consumed'));
    nock.cleanAll();
    activeNocks = [];
  });

  /** Build verify params; `unifiedRecipientPreference` is omitted unless given, so the
   * coin-side inference runs — mirroring a client that did not pass the preference. */
  function shieldedVerifyParams(
    overrides: {
      recipients?: { address: string; amount: string }[];
      txHex?: string;
      unifiedRecipientPreference?: 'shielded' | 'transparent';
    } = {}
  ): VerifyTransactionOptions {
    const txParams: TransactionParams = {
      recipients: overrides.recipients ?? [{ address: unifiedAddress, amount: '5000' }],
    };
    if (overrides.unifiedRecipientPreference !== undefined) {
      txParams.unifiedRecipientPreference = overrides.unifiedRecipientPreference;
    }
    return {
      txParams,
      txPrebuild: { txHex: overrides.txHex ?? buildShieldedV6PrebuildHex(), txInfo: {} },
      wallet: zecWallet as UtxoWallet,
      verification: {},
    };
  }

  it('verifies recipients, amounts, and wallet change on a shielded prebuild', async function () {
    nockVerifyFlow();
    // First pin down exactly what the prebuild (the payload /tx/build returns) pays: the
    // shielded output must resolve to the requested Unified Address receiver and amount.
    // verifyTransaction then accepts the txParams only because they match this output.
    const prebuildHex = buildShieldedV6PrebuildHex();
    const prebuildRecipients = (tzec as Zec).resolveRecipientsFromPsbt(prebuildHex, walletKeys);
    assert.strictEqual(prebuildRecipients.length, 1);
    assert.strictEqual(prebuildRecipients[0].address, unifiedAddress);
    assert.strictEqual(prebuildRecipients[0].amount, 5000n);
    assert.strictEqual(
      await tzec.verifyTransaction(
        shieldedVerifyParams({ txHex: prebuildHex, unifiedRecipientPreference: 'shielded' })
      ),
      true
    );
  });

  it('infers the shielded preference from an Orchard-only recipient when the caller omits it', async function () {
    nockVerifyFlow();
    assert.strictEqual(await tzec.verifyTransaction(shieldedVerifyParams()), true);
  });
  it('infers shielded with no preference when every recipient is an orchard-only UA', async function () {
    // Two shielded outputs to two DISTINCT receivers from one prebuild (encoding the receiver
    // bytes as a UA is valid — the wasm crate validates receivers only when building PCZT
    // actions, and 43 arbitrary bytes encode fine). Inference requires every recipient to be
    // orchard-only for the shielded preference to apply.
    const secondReceiver = new Uint8Array(43).fill(9);
    const secondUnifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(secondReceiver, 'tzec');
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 188000n });
    psbt.addShieldedOutputs(
      [
        { recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress },
        { recipient: secondReceiver, amount: 7000n, unifiedAddress: secondUnifiedAddress },
      ],
      new Uint8Array(32)
    );
    nockVerifyFlow();
    assert.strictEqual(
      await tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          recipients: [
            { address: unifiedAddress, amount: '5000' },
            { address: secondUnifiedAddress, amount: '7000' },
          ],
        })
      ),
      true
    );
  });

  it('rejects when a recipient amount does not match the prebuild', async function () {
    nockVerifyFlow();
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: unifiedAddress, amount: '9999' }],
        })
      ),
      TxIntentMismatchError
    );
  });

  it('rejects when a recipient address does not match the prebuild', async function () {
    nockVerifyFlow();
    const otherAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(43).fill(1),
      'tzec'
    );
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: otherAddress, amount: '5000' }],
        })
      ),
      TxIntentMismatchError
    );
  });

  it('rejects when the prebuild pays a different amount than the recipients request', async function () {
    nockVerifyFlow();
    // Mirror image of the amount-mismatch test above: the payload returned by /tx/build
    // substitutes a 7000 zat shielded output for the requested 5000 zat one.
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 88000n });
    psbt.addShieldedOutputs(
      [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 7000n, unifiedAddress }],
      new Uint8Array(32)
    );
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: unifiedAddress, amount: '5000' }],
        })
      ),
      TxIntentMismatchError
    );
  });
  it('rejects when the prebuild pays a different receiver than the recipients request', async function () {
    nockVerifyFlow();
    // The /tx/build payload pays the transparent receiver instead of the requested shielded
    // recipient. Actual outputs are resolved intent-agnostically, so the transparent output
    // resolves to its script and the requested shielded recipient ends up missing from the
    // transaction.
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '22'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 1 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 100000n });
    psbt.addTransparentOutput(new Uint8Array(tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS)), 5000n);
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: unifiedAddress, amount: '5000' }],
        })
      ),
      TxIntentMismatchError
    );
  });

  it('rejects when the prebuild carries a transparent external output instead of wallet change', async function () {
    // The legitimate recipient is still paid, but the wallet-change output was replaced by an
    // external transparent output. Actual outputs are resolved intent-agnostically, so the
    // output resolves and lands in implicitExternalOutputs, which exceeds the paygo allowance.
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addTransparentOutput(new Uint8Array(tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS)), 90000n);
    psbt.addShieldedOutputs(
      [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
      new Uint8Array(32)
    );
    nockVerifyFlow();
    await assert.rejects(
      tzec.verifyTransaction(shieldedVerifyParams({ txHex: Buffer.from(psbt.serialize()).toString('hex') })),
      TxIntentMismatchError
    );
  });

  it('rejects mixed shielded and transparent recipients with no explicit preference', async function () {
    // rejected during preference inference, before any network access
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          recipients: [
            { address: unifiedAddress, amount: '5000' },
            { address: TESTNET_TRANSPARENT_ADDRESS, amount: '7000' },
          ],
        })
      ),
      /Mixed shielded and transparent recipients are not supported/
    );
  });

  it('rejects an explicit shielded preference when a plain transparent address is mixed in', async function () {
    // Rejected while validating the requested recipients against the preference, before any
    // network access. With an explicit 'shielded' preference inference never runs, so this is
    // what holds the caller to the preference: the plain transparent address carries no
    // Orchard receiver and fails with the accurate codec error.
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          unifiedRecipientPreference: 'shielded',
          recipients: [
            { address: unifiedAddress, amount: '5000' },
            { address: TESTNET_TRANSPARENT_ADDRESS, amount: '7000' },
          ],
        })
      ),
      /address .* has no Orchard receiver to resolve as shielded/
    );
  });

  it('rejects a prebuild carrying an extra attacker-controlled shielded output (explicit preference)', async function () {
    // The theft vector this feature exists to stop: the /tx/build payload appends a second
    // shielded output to an attacker receiver on top of the legitimate one. The extra output
    // is not in the recipients list, so it surfaces as an implicit external spend and blows
    // the paygo allowance.
    const attackerUnifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(43).fill(9),
      'tzec'
    );
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 188000n });
    psbt.addShieldedOutputs(
      [
        { recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress },
        { recipient: new Uint8Array(43).fill(9), amount: 6000n, unifiedAddress: attackerUnifiedAddress },
      ],
      new Uint8Array(32)
    );
    nockVerifyFlow();
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: unifiedAddress, amount: '5000' }],
        })
      ),
      TxIntentMismatchError
    );
  });

  it('rejects a prebuild carrying an extra attacker-controlled shielded output (inferred preference)', async function () {
    // Same theft vector, but the caller omitted unifiedRecipientPreference so the coin infers
    // 'shielded' from the orchard-only recipient — the path a normal sendMany takes.
    const attackerUnifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(
      new Uint8Array(43).fill(9),
      'tzec'
    );
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 188000n });
    psbt.addShieldedOutputs(
      [
        { recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress },
        { recipient: new Uint8Array(43).fill(9), amount: 6000n, unifiedAddress: attackerUnifiedAddress },
      ],
      new Uint8Array(32)
    );
    nockVerifyFlow();
    await assert.rejects(
      tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          recipients: [{ address: unifiedAddress, amount: '5000' }],
        })
      ),
      TxIntentMismatchError
    );
  });

  it('accepts a transparent pay-as-you-go output on a shielded transaction', async function () {
    // Regression guard for the actual-output resolution: a shielded transaction legitimately
    // carries BitGo's transparent paygo output, which has no Orchard receiver to resolve. It
    // has to resolve to its own script so it lands in implicitExternalOutputs and is weighed
    // against the paygo allowance — resolving strictly under the 'shielded' preference would
    // abort verification with a decode error and break every shielded send that pays a fee.
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    // 150 bps of the 5000 zat intended spend is 75 zat, so 70 zat is within the allowance
    psbt.addTransparentOutput(new Uint8Array(tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS)), 70n);
    psbt.addShieldedOutputs(
      [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress }],
      new Uint8Array(32)
    );
    nockVerifyFlow();
    assert.strictEqual(
      await tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: unifiedAddress, amount: '5000' }],
        })
      ),
      true
    );
  });

  it('rejects a v6 PSBT whose preserved UA metadata was mutated, at the verifyTransaction level', async function () {
    // UA-metadata tampering is covered at the decode/explain/parse level elsewhere in this
    // file; this pins the same rejection on the full verify path a sendMany uses.
    const mutatedHex = mutateSerializedUnifiedAddress(buildShieldedV6PrebuildHex(), unifiedAddress);
    nockVerifyFlow();
    await assert.rejects(
      tzec.verifyTransaction(shieldedVerifyParams({ txHex: mutatedHex, unifiedRecipientPreference: 'shielded' })),
      /does not match its raw script/
    );
  });

  it('verifies a dual-receiver UA paid via its Orchard receiver with an explicit shielded preference', async function () {
    // Regression guard: TESTNET_UNIFIED carries BOTH receivers. The prebuild pays its Orchard
    // receiver; actual-output resolution must try the transaction's 'shielded' preference
    // first — a transparent-first guess returns the 25-byte script of the UA's transparent
    // receiver and reports the user's own payment as missing.
    const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 4200000 });
    psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
      scriptId: { chain: 0, index: 0 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 90000n });
    psbt.addShieldedOutputs(
      [{ recipient: new Uint8Array(IRONWOOD_RECEIVER), amount: 5000n, unifiedAddress: TESTNET_UNIFIED }],
      new Uint8Array(32)
    );
    nockVerifyFlow();
    assert.strictEqual(
      await tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          unifiedRecipientPreference: 'shielded',
          recipients: [{ address: TESTNET_UNIFIED, amount: '5000' }],
        })
      ),
      true
    );
  });

  it('verifies an explicit transparent preference where the dual-receiver UA pays its transparent receiver', async function () {
    // TESTNET_UNIFIED carries BOTH a transparent and an Orchard receiver; with an explicit
    // 'transparent' preference it pays its transparent receiver.
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '22'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 1 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 100000n });
    psbt.addTransparentOutput(
      new Uint8Array(tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS)),
      12345n,
      TESTNET_UNIFIED
    );
    nockVerifyFlow();
    assert.strictEqual(
      await tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          unifiedRecipientPreference: 'transparent',
          recipients: [{ address: TESTNET_UNIFIED, amount: '12345' }],
        })
      ),
      true
    );
  });

  it('infers transparent with no preference when recipients are plain transparent addresses', async function () {
    const psbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty('tzec', walletKeys, { blockHeight: 3146400 });
    psbt.addWalletInput({ txid: '22'.repeat(32), vout: 0, value: 200000n }, walletKeys, {
      scriptId: { chain: 0, index: 1 },
    });
    psbt.addWalletOutput(walletKeys, { chain: 1, index: 0, value: 100000n });
    psbt.addTransparentOutput(new Uint8Array(tzec.addressCodec.decode(TESTNET_TRANSPARENT_ADDRESS)), 12345n);
    nockVerifyFlow();
    assert.strictEqual(
      await tzec.verifyTransaction(
        shieldedVerifyParams({
          txHex: Buffer.from(psbt.serialize()).toString('hex'),
          recipients: [{ address: TESTNET_TRANSPARENT_ADDRESS, amount: '12345' }],
        })
      ),
      true
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
