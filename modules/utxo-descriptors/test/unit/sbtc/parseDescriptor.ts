import * as assert from 'assert';

import { ast, bip32, Descriptor, Miniscript } from '@bitgo/wasm-utxo';
import { getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  createSbtcDepositDescriptor,
  DEFAULT_MAX_SIGNER_FEE,
  DEFAULT_RECLAIM_LOCK_TIME,
  encodeDepositPayload,
  parseSbtcDepositDescriptor,
  SbtcDepositDescriptorParams,
  STACKS_RECIPIENT_BYTE_LENGTH,
  UNSPENDABLE_INTERNAL_KEY,
} from '../../../src/sbtc';

type BIP32Interface = bip32.BIP32Interface;

const SIGNERS_AGGREGATE_KEY = Buffer.from('c9c2312ca406dcb8eed50b829b5292f5fb3e846db0a556af61cc53834ce75421', 'hex');
const STACKS_RECIPIENT = Buffer.from('05' + '16' + '6d'.repeat(20), 'hex');

function getBip32Triple(): [BIP32Interface, BIP32Interface, BIP32Interface] {
  const [user, backup, bitgo] = getKeyTriple('default');
  return [user, backup, bitgo];
}

function buildParams(overrides: Partial<SbtcDepositDescriptorParams> = {}): SbtcDepositDescriptorParams {
  return {
    walletKeys: getBip32Triple(),
    lockTime: DEFAULT_RECLAIM_LOCK_TIME,
    maxFee: DEFAULT_MAX_SIGNER_FEE,
    stacksRecipient: STACKS_RECIPIENT,
    signersAggregateKey: SIGNERS_AGGREGATE_KEY,
    ...overrides,
  };
}

describe('parseSbtcDepositDescriptor', function () {
  describe('definite descriptor (concrete x-only reclaim keys)', function () {
    const reclaimKeyHex: [string, string, string] = [
      '4d838759b2a74616a2298e0580ca815874f5e5a9d2dd1b2f0203b68c66fc6c1e',
      '639779c4b700dc51ece012a0e20325fcafada22a4a122ffaa04d0c0ccae83943',
      'd1d6084eac98303e9d28e082bfd9eadf0b8be033e223a17ad01df81bdaa8c7b2',
    ];
    const reclaimKeys: [Buffer, Buffer, Buffer] = [
      Buffer.from(reclaimKeyHex[0], 'hex'),
      Buffer.from(reclaimKeyHex[1], 'hex'),
      Buffer.from(reclaimKeyHex[2], 'hex'),
    ];
    const params: SbtcDepositDescriptorParams = {
      walletKeys: reclaimKeys,
      lockTime: 144,
      maxFee: 80_000,
      stacksRecipient: STACKS_RECIPIENT,
      signersAggregateKey: SIGNERS_AGGREGATE_KEY,
    };
    const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(params), 'definite');

    it('round-trips all high-level fields', function () {
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      assert.deepStrictEqual(parsed.signersAggregateKey, SIGNERS_AGGREGATE_KEY);
      assert.strictEqual(parsed.maxFee, 80_000n);
      assert.deepStrictEqual(parsed.stacksRecipient, STACKS_RECIPIENT);
      assert.strictEqual(parsed.lockTime, 144);
    });

    it('returns reclaim keys as 32-byte buffers in the descriptor order', function () {
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      assert.ok(parsed.reclaimKeys);
      // multi_a sorts keys by hex; verify the parser returns whatever order
      // the descriptor library produced rather than the original input order.
      const sortedInput = [...reclaimKeyHex].sort().map((k) => Buffer.from(k, 'hex'));
      assert.deepStrictEqual(parsed.reclaimKeys, sortedInput);
    });

    it('returns miniscript AST nodes for both leaves', function () {
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      const payloadHex = encodeDepositPayload(params.maxFee, params.stacksRecipient).toString('hex');
      assert.deepStrictEqual(parsed.depositMiniscriptNode, {
        and_v: [{ payload_drop: payloadHex }, { pk: SIGNERS_AGGREGATE_KEY.toString('hex') }],
      } as unknown as ast.MiniscriptNode);
      // r:older + multi_a must be present and correctly ordered in the AST.
      assert.deepStrictEqual(parsed.reclaimMiniscriptNode, {
        and_v: [{ 'r:older': 144 }, { multi_a: [2, ...[...reclaimKeyHex].sort()] }],
      });
    });
  });

  describe('derivable descriptor (xpub/* reclaim keys)', function () {
    const params = buildParams();
    const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(params), 'derivable');

    it('round-trips lockTime, maxFee, recipient, and signers key', function () {
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      assert.deepStrictEqual(parsed.signersAggregateKey, SIGNERS_AGGREGATE_KEY);
      assert.strictEqual(parsed.maxFee, BigInt(DEFAULT_MAX_SIGNER_FEE));
      assert.deepStrictEqual(parsed.stacksRecipient, STACKS_RECIPIENT);
      assert.strictEqual(parsed.lockTime, DEFAULT_RECLAIM_LOCK_TIME);
    });

    it('returns reclaimKeys=undefined for derivable inputs', function () {
      // Derivable descriptors render multi_a entries as `xpub.../*`, not as
      // 32-byte hex — they can't be reduced to bytes without picking an index.
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      assert.strictEqual(parsed.reclaimKeys, undefined);
    });

    it('resolves to concrete reclaim keys after atDerivationIndex(0) and compiles to a tap Miniscript', function () {
      assert.strictEqual(descriptor.hasWildcard(), true);
      const derivedZero = descriptor.atDerivationIndex(0);
      const derivedOne = descriptor.atDerivationIndex(1);
      assert.strictEqual(derivedZero.hasWildcard(), false);

      const parsedZero = parseSbtcDepositDescriptor(derivedZero);
      assert.ok(parsedZero);
      assert.ok(parsedZero.reclaimKeys);
      for (const k of parsedZero.reclaimKeys) {
        assert.strictEqual(k.length, 32, `expected 32-byte x-only key, got ${k.length}`);
      }
      // Deposit-leaf fields are derivation-independent.
      assert.deepStrictEqual(parsedZero.signersAggregateKey, SIGNERS_AGGREGATE_KEY);
      assert.strictEqual(parsedZero.lockTime, DEFAULT_RECLAIM_LOCK_TIME);

      const parsedOne = parseSbtcDepositDescriptor(derivedOne);
      assert.ok(parsedOne?.reclaimKeys);
      assert.notDeepStrictEqual(parsedZero.reclaimKeys, parsedOne.reclaimKeys);

      // The rewritten reclaim leaf carries concrete hex in multi_a, so the
      // formatted string compiles as a tap-context Miniscript. `fromStringExt`
      // is required because the leaf contains the `r:older` (drop) wrapper.
      const reclaimMs = Miniscript.fromStringExt(ast.formatNode(parsedZero.reclaimMiniscriptNode), 'tap', {});
      assert.ok(reclaimMs);
    });
  });

  describe('rejection paths', function () {
    const params = buildParams();
    const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(params), 'derivable');

    it('returns null for a non-sBTC descriptor', function () {
      const wpkhDescriptor = Descriptor.fromString(`wpkh(${getBip32Triple()[0].neutered().toBase58()}/*)`, 'derivable');
      assert.strictEqual(parseSbtcDepositDescriptor(wpkhDescriptor), null);
    });

    it('returns null for a tr() that has a different internal key', function () {
      // Swap UNSPENDABLE for an arbitrary 32-byte key — pattern match must
      // require the canonical unspendable point, not just any tr().
      const tampered = createSbtcDepositDescriptor(buildParams()).replace(UNSPENDABLE_INTERNAL_KEY, 'a'.repeat(64));
      const node = ast.fromDescriptor(Descriptor.fromString(tampered, 'derivable'));
      assert.strictEqual(parseSbtcDepositDescriptor(node), null);
    });

    it('accepts a pre-extracted ast.DescriptorNode', function () {
      const node = ast.fromDescriptor(descriptor);
      const parsed = parseSbtcDepositDescriptor(node);
      assert.ok(parsed);
      assert.strictEqual(parsed.lockTime, DEFAULT_RECLAIM_LOCK_TIME);
    });
  });

  describe('parameter round-trip', function () {
    it('extracts the same maxFee and recipient that encodeDepositPayload produced', function () {
      const recipient = Buffer.alloc(STACKS_RECIPIENT_BYTE_LENGTH, 0x11);
      const params = buildParams({ maxFee: 12345n, stacksRecipient: recipient });
      const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(params), 'derivable');
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      assert.strictEqual(parsed.maxFee, 12345n);
      assert.deepStrictEqual(parsed.stacksRecipient, recipient);
    });

    it('accepts the full unsigned 64-bit maxFee range', function () {
      const max = 0xffffffffffffffffn;
      const params = buildParams({ maxFee: max });
      const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(params), 'derivable');
      const parsed = parseSbtcDepositDescriptor(descriptor);
      assert.ok(parsed);
      assert.strictEqual(parsed.maxFee, max);
    });
  });
});
