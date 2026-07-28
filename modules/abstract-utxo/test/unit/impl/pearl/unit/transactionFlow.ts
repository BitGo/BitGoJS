/**
 * Pearl (Duplex) end-to-end transaction flow.
 *
 * Exercises the full fixed-script lifecycle for a taproot-only, wasm-only coin:
 *
 *   address generation -> PSBT build -> sign -> verify -> finalize -> extract
 *   -> serialize round-trip -> parse
 *
 * Everything runs offline through `@bitgo/wasm-utxo`. Pearl has no
 * `@bitgo/utxo-lib` network, so none of the utxo-lib based helpers (`AcidTest`,
 * `testutil.constructPsbt`, the shared `utxoCoins` fixtures) can be used here -
 * the PSBT is built directly with `fixedScriptWallet.BitGoPsbt`.
 *
 * Two deliberate scope limits:
 *
 * - **Broadcasting** is not covered. It needs either a live pearld node or Pearl
 *   deployed to the BitGo test environment; neither exists yet (wallet-platform
 *   onboarding is CECHO-1802). The flow is verified as far as a fully-signed,
 *   finalized transaction with a real txid, which is the last offline step.
 * - **p2trMusig2 key-path signing** is not covered. It requires MuSig2 nonce
 *   exchange rounds and is explicitly a later phase in the onboarding TDD. The
 *   musig2 chains are still asserted to be *buildable* below.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../../../../../src/abstractUtxoCoin';
import { generateAddress } from '../../../../../src/address/fixedScript';
import { Pearl, Tpearl } from '../../../../../src/impl/pearl';

type CoinName = 'pearl' | 'tpearl';
type SignerKey = 'user' | 'backup' | 'bitgo';

/** Deterministic test keys, so extracted txids are stable across runs. */
const roots = ['pearl-e2e-user', 'pearl-e2e-backup', 'pearl-e2e-bitgo'].map((seed) => BIP32.fromSeedSha256(seed));
const xprvs = roots.map((k) => k.toBase58()) as [string, string, string];
const xpubs = roots.map((k) => k.neutered().toBase58()) as [string, string, string];

const walletKeys = fixedScriptWallet.RootWalletKeys.fromXpubs(xpubs);
const keychains = xpubs.map((pub) => ({ pub }));

const xprvFor: Record<SignerKey, string> = { user: xprvs[0], backup: xprvs[1], bitgo: xprvs[2] };
const xpubFor: Record<SignerKey, string> = { user: xpubs[0], backup: xpubs[1], bitgo: xpubs[2] };

/**
 * The three leaves of Pearl's 2-of-3 taptree.
 *
 * Order matters: wasm-utxo accepts exactly these signer/cosigner pairings and
 * rejects the reversed forms (`bitgo+user`, `backup+user`, `bitgo+backup`) with
 * "Could not find control block for leaf script". Note the third leaf is
 * `backup+bitgo`, not `bitgo+backup` as the TDD writes it.
 */
const SIGNER_PAIRS: { signer: SignerKey; cosigner: SignerKey }[] = [
  { signer: 'user', cosigner: 'bitgo' },
  { signer: 'user', cosigner: 'backup' },
  { signer: 'backup', cosigner: 'bitgo' },
];

/** p2tr external/internal - the script-path chains this flow signs. */
const P2TR_CHAINS = [30, 31] as const;
/** p2trMusig2 external/internal - buildable, but key-path signing is a later phase. */
const MUSIG2_CHAINS = [40, 41] as const;
const ALL_CHAINS = [...P2TR_CHAINS, ...MUSIG2_CHAINS];

const INPUT_VALUE = 100_000n;
const OUTPUT_VALUE = 90_000n;

/** A PSBT input needs a 32-byte txid; its provenance is irrelevant offline. */
function fakeTxid(seed: string): string {
  return createHash('sha256').update(seed).digest('hex');
}

/** Build a 1-in/1-out Pearl PSBT spending a wallet UTXO on the given chain. */
function buildPsbt(coinName: CoinName, { signer, cosigner }: { signer: SignerKey; cosigner: SignerKey }, chain = 30) {
  const psbt = fixedScriptWallet.BitGoPsbt.createEmpty(coinName, walletKeys);
  psbt.addWalletInput(
    { txid: fakeTxid(`${coinName}-${signer}-${cosigner}-${chain}`), vout: 0, value: INPUT_VALUE },
    walletKeys,
    { scriptId: { chain, index: 0 }, signPath: { signer, cosigner } }
  );
  // Pair each external chain with its internal (change) counterpart.
  psbt.addWalletOutput(walletKeys, { chain: chain % 2 === 0 ? chain + 1 : chain, index: 0, value: OUTPUT_VALUE });
  return psbt;
}

/** BitGoPsbt exposes serialization through the underlying wasm object. */
function serialize(psbt: ReturnType<typeof buildPsbt>): Buffer {
  return Buffer.from(psbt.wasm.serialize());
}

describe('Pearl - end-to-end transaction flow', function () {
  let bitgo: TestBitGoAPI;

  function getCoin(coinName: CoinName): AbstractUtxoCoin {
    return bitgo.coin(coinName) as unknown as AbstractUtxoCoin;
  }

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('pearl', Pearl.createInstance);
    bitgo.safeRegister('tpearl', Tpearl.createInstance);
  });

  describe('address generation', function () {
    it('derives bech32m addresses with the correct HRP per network', function () {
      const mainnet = generateAddress('pearl', { keychains, chain: 30, index: 0 });
      const testnet = generateAddress('tpearl', { keychains, chain: 30, index: 0 });

      assert.ok(mainnet.startsWith('prl1p'), `expected prl1p... got ${mainnet}`);
      assert.ok(testnet.startsWith('tprl1p'), `expected tprl1p... got ${testnet}`);
      // Same keys and script id on both networks - only the HRP differs.
      assert.notStrictEqual(mainnet, testnet);
    });

    it('derives a distinct address for every supported chain and index', function () {
      const seen = new Set<string>();
      for (const chain of ALL_CHAINS) {
        for (const index of [0, 1, 7]) {
          const address = generateAddress('pearl', { keychains, chain, index });
          assert.ok(address.startsWith('prl1p'), `chain ${chain}/${index}: ${address}`);
          assert.ok(!seen.has(address), `duplicate address for chain ${chain} index ${index}`);
          seen.add(address);
        }
      }
      assert.strictEqual(seen.size, ALL_CHAINS.length * 3);
    });

    it('is deterministic for the same keys and script id', function () {
      assert.strictEqual(
        generateAddress('pearl', { keychains, chain: 30, index: 0 }),
        generateAddress('pearl', { keychains, chain: 30, index: 0 })
      );
    });

    it('accepts its own generated addresses as valid', function () {
      for (const coinName of ['pearl', 'tpearl'] as const) {
        const coin = getCoin(coinName);
        for (const chain of ALL_CHAINS) {
          const address = generateAddress(coinName, { keychains, chain, index: 0 });
          assert.strictEqual(coin.isValidAddress(address), true, `${coinName} chain ${chain}: ${address}`);
        }
      }
    });

    it('rejects addresses from the other network', function () {
      const mainnet = generateAddress('pearl', { keychains, chain: 30, index: 0 });
      const testnet = generateAddress('tpearl', { keychains, chain: 30, index: 0 });
      assert.strictEqual(getCoin('pearl').isValidAddress(testnet), false);
      assert.strictEqual(getCoin('tpearl').isValidAddress(mainnet), false);
    });
  });

  describe('build -> sign -> finalize -> extract', function () {
    for (const coinName of ['pearl', 'tpearl'] as const) {
      for (const pair of SIGNER_PAIRS) {
        it(`${coinName}: produces a broadcast-ready transaction signed by ${pair.signer}+${pair.cosigner}`, function () {
          const psbt = buildPsbt(coinName, pair);

          psbt.sign(xprvFor[pair.signer]);
          psbt.sign(xprvFor[pair.cosigner]);

          // verifySignature is the source of truth - sign() reports the inputs it
          // touched, not whether a usable signature landed on the chosen leaf.
          assert.strictEqual(psbt.verifySignature(0, xpubFor[pair.signer]), true);
          assert.strictEqual(psbt.verifySignature(0, xpubFor[pair.cosigner]), true);

          psbt.finalizeAllInputs();
          const tx = psbt.extractTransaction();

          assert.match(tx.getId(), /^[0-9a-f]{64}$/, `unexpected txid ${tx.getId()}`);

          // A taproot script-path spend carries two 64-byte Schnorr signatures plus
          // the leaf script and control block, so it is well clear of a bare skeleton.
          const raw = Buffer.from(tx.toBytes());
          assert.ok(raw.length > 200, `expected a witness-bearing tx, got ${raw.length} bytes`);
        });
      }
    }

    it('signs both p2tr chains', function () {
      for (const chain of P2TR_CHAINS) {
        const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' }, chain);
        psbt.sign(xprvFor.user);
        psbt.sign(xprvFor.bitgo);
        psbt.finalizeAllInputs();
        assert.match(psbt.extractTransaction().getId(), /^[0-9a-f]{64}$/, `chain ${chain} failed`);
      }
    });

    it('builds p2trMusig2 inputs even though key-path signing is a later phase', function () {
      for (const chain of MUSIG2_CHAINS) {
        const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' }, chain);

        // sign() reports these input indices even for musig2, but a partial
        // signature without a prior nonce exchange verifies as invalid - it is
        // not a usable signature yet.
        psbt.sign(xprvFor.user);
        psbt.sign(xprvFor.bitgo);
        assert.strictEqual(psbt.verifySignature(0, xpubFor.user), false, `chain ${chain}: no nonce exchange yet`);
        assert.strictEqual(psbt.verifySignature(0, xpubFor.bitgo), false, `chain ${chain}: no nonce exchange yet`);

        // Finalizing must fail specifically because nonces are missing, not for
        // the generic reason an unsigned input would fail for.
        assert.throws(
          () => psbt.finalizeAllInputs(),
          /At least 2 public nonces are required/,
          `chain ${chain} should fail on missing nonces, not on missing signatures`
        );
      }
    });

    it('is deterministic - identical inputs produce an identical txid', function () {
      const ids = [0, 1].map(() => {
        const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
        psbt.sign(xprvFor.user);
        psbt.sign(xprvFor.bitgo);
        psbt.finalizeAllInputs();
        return psbt.extractTransaction().getId();
      });
      assert.strictEqual(ids[0], ids[1]);
    });
  });

  describe('signing policy', function () {
    it('does not finalize while only half-signed', function () {
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      psbt.sign(xprvFor.user);

      assert.strictEqual(psbt.verifySignature(0, xpubFor.user), true);
      assert.strictEqual(psbt.verifySignature(0, xpubFor.bitgo), false);
      assert.throws(() => psbt.finalizeAllInputs(), 'a half-signed 2-of-3 input must not finalize');
    });

    it('produces no valid signature for a key outside the chosen leaf', function () {
      // The leaf is user+bitgo, so backup is not a participant.
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      psbt.sign(xprvFor.user);
      psbt.sign(xprvFor.backup);

      assert.strictEqual(psbt.verifySignature(0, xpubFor.user), true);
      assert.strictEqual(psbt.verifySignature(0, xpubFor.backup), false, 'backup is not in the user+bitgo leaf');
    });

    it('cannot finalize with a signer pair that does not match the leaf', function () {
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      psbt.sign(xprvFor.user);
      psbt.sign(xprvFor.backup);
      // Two keys signed, but not the two the leaf requires.
      assert.throws(() => psbt.finalizeAllInputs(), 'wrong pair must not satisfy the taproot leaf');
    });
  });

  describe('serialize / deserialize round-trip', function () {
    it('survives an unsigned PSBT round-trip and stays signable', function () {
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      const bytes = serialize(psbt);

      const reloaded = fixedScriptWallet.BitGoPsbt.fromBytes(bytes, 'pearl');
      assert.deepStrictEqual(serialize(reloaded), bytes, 'round-trip must be byte-identical');

      reloaded.sign(xprvFor.user);
      reloaded.sign(xprvFor.bitgo);
      reloaded.finalizeAllInputs();
      assert.match(reloaded.extractTransaction().getId(), /^[0-9a-f]{64}$/);
    });

    it('carries a half-signed signature across the hand-off', function () {
      // This is the production co-sign shape: one party signs and passes the PSBT on.
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      psbt.sign(xprvFor.user);

      const reloaded = fixedScriptWallet.BitGoPsbt.fromBytes(serialize(psbt), 'pearl');
      assert.strictEqual(reloaded.verifySignature(0, xpubFor.user), true, 'user signature should survive');

      reloaded.sign(xprvFor.bitgo);
      reloaded.finalizeAllInputs();
      assert.match(reloaded.extractTransaction().getId(), /^[0-9a-f]{64}$/);
    });

    it('reaches the same txid whether signed in one pass or two', function () {
      const onePass = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      onePass.sign(xprvFor.user);
      onePass.sign(xprvFor.bitgo);
      onePass.finalizeAllInputs();

      const halfSigned = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      halfSigned.sign(xprvFor.user);
      const twoPass = fixedScriptWallet.BitGoPsbt.fromBytes(serialize(halfSigned), 'pearl');
      twoPass.sign(xprvFor.bitgo);
      twoPass.finalizeAllInputs();

      assert.strictEqual(onePass.extractTransaction().getId(), twoPass.extractTransaction().getId());
    });
  });

  describe('parse', function () {
    const parseOptions = { replayProtection: { publicKeys: [] } };

    it('attributes input and output values to the wallet', function () {
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      const parsed = psbt.parseTransactionWithWalletKeys(walletKeys, parseOptions);

      assert.strictEqual(parsed.inputs.length, 1);
      assert.strictEqual(parsed.outputs.length, 1);
      assert.strictEqual(BigInt(parsed.inputs[0].value), INPUT_VALUE);
      assert.strictEqual(BigInt(parsed.outputs[0].value), OUTPUT_VALUE);
    });

    it('parses a fully-signed PSBT the same way', function () {
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      psbt.sign(xprvFor.user);
      psbt.sign(xprvFor.bitgo);

      const parsed = psbt.parseTransactionWithWalletKeys(walletKeys, parseOptions);
      assert.strictEqual(BigInt(parsed.inputs[0].value), INPUT_VALUE);
      assert.strictEqual(BigInt(parsed.outputs[0].value), OUTPUT_VALUE);
    });

    it('resolves output addresses with the Pearl HRP', function () {
      for (const [coinName, hrp] of [
        ['pearl', 'prl1'],
        ['tpearl', 'tprl1'],
      ] as const) {
        const psbt = buildPsbt(coinName, { signer: 'user', cosigner: 'bitgo' });
        const outputs = psbt.getOutputsWithAddress();
        assert.ok(outputs.length > 0);
        for (const output of outputs) {
          assert.ok(output.address.startsWith(hrp), `${coinName}: unexpected address ${output.address}`);
        }
      }
    });

    it('implies a fee from the input/output difference', function () {
      const psbt = buildPsbt('pearl', { signer: 'user', cosigner: 'bitgo' });
      const parsed = psbt.parseTransactionWithWalletKeys(walletKeys, parseOptions);
      const inputTotal = parsed.inputs.reduce((sum, i) => sum + BigInt(i.value), 0n);
      const outputTotal = parsed.outputs.reduce((sum, o) => sum + BigInt(o.value), 0n);
      assert.strictEqual(inputTotal - outputTotal, INPUT_VALUE - OUTPUT_VALUE);
    });
  });

  describe('script type restrictions', function () {
    it('refuses to build a wallet input for a non-taproot chain', function () {
      // 0 = p2sh, 10 = p2shP2wsh, 20 = p2wsh - none of these exist on Pearl.
      //
      // A signPath is supplied so the rejection cannot be confused with the
      // "sign_path is required" error that taproot chains raise without one, and
      // the message is matched so a taproot chain slipping into this list would
      // fail the test rather than pass for the wrong reason.
      for (const chain of [0, 10, 20]) {
        const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('pearl', walletKeys);
        assert.throws(
          () =>
            psbt.addWalletInput({ txid: fakeTxid(`reject-${chain}`), vout: 0, value: INPUT_VALUE }, walletKeys, {
              scriptId: { chain, index: 0 },
              signPath: { signer: 'user', cosigner: 'bitgo' },
            }),
          /Unsupported script type/,
          `chain ${chain} must be rejected for a taproot-only coin`
        );
      }
    });

    it('requires a signPath for taproot chains', function () {
      const psbt = fixedScriptWallet.BitGoPsbt.createEmpty('pearl', walletKeys);
      assert.throws(
        () =>
          psbt.addWalletInput({ txid: fakeTxid('no-signpath'), vout: 0, value: INPUT_VALUE }, walletKeys, {
            scriptId: { chain: 30, index: 0 },
          }),
        /sign_path is required/
      );
    });

    it('refuses the reversed signer orderings that have no leaf', function () {
      for (const pair of [
        { signer: 'bitgo', cosigner: 'user' },
        { signer: 'backup', cosigner: 'user' },
        { signer: 'bitgo', cosigner: 'backup' },
      ] as const) {
        assert.throws(() => buildPsbt('pearl', pair), `${pair.signer}+${pair.cosigner} is not a leaf in the taptree`);
      }
    });
  });
});
