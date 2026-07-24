import * as assert from 'assert';

import { address, ast, bip32, Descriptor } from '@bitgo/wasm-utxo';
import { getKeyTriple } from '@bitgo/wasm-utxo/testutils';
import { getFixture } from '@bitgo/utxo-core/testutil';

import {
  createSbtcDepositDescriptor,
  createSbtcDepositScriptPubKey,
  DEFAULT_MAX_SIGNER_FEE,
  DEFAULT_RECLAIM_LOCK_TIME,
  deriveReclaimKeys,
  encodeDepositPayload,
  SbtcDepositDescriptorParams,
  STACKS_RECIPIENT_BYTE_LENGTH,
  UNSPENDABLE_INTERNAL_KEY,
} from '../../../src/sbtc';

type BIP32Interface = bip32.BIP32Interface;

const FIXTURE_BASE = 'test/fixtures/sbtc/descriptor/';

// Deterministic test inputs.
const SIGNERS_AGGREGATE_KEY = Buffer.from('c9c2312ca406dcb8eed50b829b5292f5fb3e846db0a556af61cc53834ce75421', 'hex');
const STACKS_RECIPIENT = Buffer.from(
  // 1-byte Clarity principal type (0x05 standard) + 1-byte address version
  // (0x16 mainnet) + 20-byte hash160 of the principal
  '05' + '16' + '6d'.repeat(20),
  'hex'
);

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

describe('encodeDepositPayload', function () {
  it('encodes max fee as 8-byte big-endian followed by the 22-byte recipient', function () {
    const payload = encodeDepositPayload(DEFAULT_MAX_SIGNER_FEE, STACKS_RECIPIENT);
    assert.strictEqual(payload.length, 8 + STACKS_RECIPIENT_BYTE_LENGTH);
    // 80_000 == 0x13880; left-padded into 8 bytes big-endian
    assert.strictEqual(payload.subarray(0, 8).toString('hex'), '0000000000013880');
    assert.deepStrictEqual(payload.subarray(8), STACKS_RECIPIENT);
  });

  it('accepts bigint fees up to 2^64 - 1', function () {
    const max = 0xffffffffffffffffn;
    const payload = encodeDepositPayload(max, STACKS_RECIPIENT);
    assert.strictEqual(payload.subarray(0, 8).toString('hex'), 'f'.repeat(16));
  });

  it('rejects fees outside the unsigned 64-bit range', function () {
    assert.throws(() => encodeDepositPayload(-1, STACKS_RECIPIENT));
    assert.throws(() => encodeDepositPayload(0x10000000000000000n, STACKS_RECIPIENT));
  });

  it('rejects recipients of the wrong length', function () {
    assert.throws(() => encodeDepositPayload(0, Buffer.alloc(STACKS_RECIPIENT_BYTE_LENGTH - 1)));
    assert.throws(() => encodeDepositPayload(0, Buffer.alloc(STACKS_RECIPIENT_BYTE_LENGTH + 1)));
  });
});

describe('createSbtcDepositDescriptor', function () {
  describe('argument validation', function () {
    it('rejects a non-positive locktime', function () {
      assert.throws(() => createSbtcDepositDescriptor(buildParams({ lockTime: 0 })));
      assert.throws(() => createSbtcDepositDescriptor(buildParams({ lockTime: -1 })));
    });

    it('rejects a signers key that is not 32 bytes (x-only)', function () {
      assert.throws(() => createSbtcDepositDescriptor(buildParams({ signersAggregateKey: Buffer.alloc(33) })));
      assert.throws(() => createSbtcDepositDescriptor(buildParams({ signersAggregateKey: Buffer.alloc(31) })));
    });

    it('rejects a recipient that is not 22 bytes', function () {
      assert.throws(() => createSbtcDepositDescriptor(buildParams({ stacksRecipient: Buffer.alloc(21) })));
    });
  });

  describe('default parameters', function () {
    const fixturePath = FIXTURE_BASE + 'default';

    it('emits the expected descriptor string', async function () {
      const descriptorString = createSbtcDepositDescriptor(buildParams());
      assert.strictEqual(
        descriptorString,
        await getFixture(fixturePath + '-string.txt', descriptorString),
        descriptorString
      );
    });

    it('uses the unspendable internal key for the tr() and contains both leaves as miniscript', function () {
      const descriptorString = createSbtcDepositDescriptor(buildParams());
      assert.ok(descriptorString.startsWith(`tr(${UNSPENDABLE_INTERNAL_KEY},{`));
      // No raw() leaf inside the tr() tree.
      assert.ok(!/raw\(/.test(descriptorString), `descriptor must not contain raw(): ${descriptorString}`);
      // Both leaves expressed via miniscript fragments.
      assert.ok(descriptorString.includes('payload_drop('));
      assert.ok(descriptorString.includes('r:older('));
      assert.ok(descriptorString.includes('multi_a('));
    });

    it('parses as a derivable descriptor', function () {
      const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(buildParams()), 'derivable');
      assert.ok(descriptor);
    });

    it('matches the expected AST', async function () {
      const descriptor = Descriptor.fromString(createSbtcDepositDescriptor(buildParams()), 'derivable');
      const node = descriptor.node();
      assert.deepStrictEqual(node, await getFixture(fixturePath + '-ast.json', node));
    });

    it('matches the expected scriptPubKey at derivation index 0', async function () {
      const spk = createSbtcDepositScriptPubKey(buildParams(), 0);
      assert.strictEqual(spk.length, 34, 'P2TR scriptPubKey is OP_1 + 32-byte tweaked key');
      assert.strictEqual(spk[0], 0x51, 'first byte is OP_1');
      assert.strictEqual(spk[1], 0x20, 'second byte is push-32');
      assert.deepStrictEqual(spk, await getFixture(fixturePath + '-spk.hex', spk));
    });
  });

  describe('changing parameters changes the address', function () {
    it('different lockTime → different scriptPubKey', function () {
      const a = createSbtcDepositScriptPubKey(buildParams({ lockTime: 100 }), 0);
      const b = createSbtcDepositScriptPubKey(buildParams({ lockTime: 200 }), 0);
      assert.notDeepStrictEqual(a, b);
    });

    it('different maxFee → different scriptPubKey', function () {
      const a = createSbtcDepositScriptPubKey(buildParams({ maxFee: 1 }), 0);
      const b = createSbtcDepositScriptPubKey(buildParams({ maxFee: 2 }), 0);
      assert.notDeepStrictEqual(a, b);
    });

    it('different recipient → different scriptPubKey', function () {
      const r1 = Buffer.alloc(STACKS_RECIPIENT_BYTE_LENGTH, 0x11);
      const r2 = Buffer.alloc(STACKS_RECIPIENT_BYTE_LENGTH, 0x22);
      const a = createSbtcDepositScriptPubKey(buildParams({ stacksRecipient: r1 }), 0);
      const b = createSbtcDepositScriptPubKey(buildParams({ stacksRecipient: r2 }), 0);
      assert.notDeepStrictEqual(a, b);
    });

    it('different derivation index → different scriptPubKey', function () {
      const a = createSbtcDepositScriptPubKey(buildParams(), 0);
      const b = createSbtcDepositScriptPubKey(buildParams(), 1);
      assert.notDeepStrictEqual(a, b);
    });
  });
});

describe('definite descriptor (concrete x-only reclaim keys)', function () {
  // Reference vectors — match the on-chain leaves the user gave.
  // Deposit leaf: 1e <30B-payload> 75 20 <signersKey> ac
  // Reclaim leaf: 51 b2 75 20 <k1> ac 20 <k2> ba 20 <k3> ba 52 9c
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
  const stacksRecipient = Buffer.from('051ad206838b7981a116c334e8cb1b950afb73eb54a5', 'hex');
  const signersAggregateKeyHex = 'c9c2312ca406dcb8eed50b829b5292f5fb3e846db0a556af61cc53834ce75421';
  const signersAggregateKey = Buffer.from(signersAggregateKeyHex, 'hex');
  const lockTime = 1;
  const maxFee = 80_000;
  const params: SbtcDepositDescriptorParams = {
    walletKeys: reclaimKeys,
    lockTime,
    maxFee,
    stacksRecipient,
    signersAggregateKey,
  };

  // Reference values for the on-chain regtest deposit
  // (txid 7db56e1e6705ea4f2ee68cb075b27a2c80d44aca1f9ffd48e6f196e578a911e0).
  // Build the expected descriptor structurally so any divergence in the AST or
  // formatter shows up as a structural diff rather than a string mismatch.
  const payloadHex = encodeDepositPayload(maxFee, stacksRecipient).toString('hex');
  const expectedDescriptor = ast.formatNode({
    tr: [
      UNSPENDABLE_INTERNAL_KEY,
      [
        {
          'c:and_v': [{ payload_drop: payloadHex }, { pk_k: signersAggregateKeyHex }],
        } as unknown as ast.MiniscriptNode,
        {
          and_v: [{ 'r:older': lockTime }, { multi_a: [2, ...reclaimKeyHex] }],
        },
      ],
    ],
  });
  const expectedTweakedKey = 'f3b3930e1e7103753b62e5cfee821b5bfa942eacb868e1d625243df606882dff';
  const expectedScriptPubKey = '5120' + expectedTweakedKey;
  const expectedAddress = 'bcrt1p7weexrs7wyph2wmzuh87aqsmt0afgt4vhp5wr439ys7lvp5g9hlsjq4cvx';

  it('emits the BIP-380 reference descriptor exactly', function () {
    const desc = createSbtcDepositDescriptor(params);
    assert.strictEqual(desc, expectedDescriptor);
    // Sanity: the descriptor is definite (no wildcards) and contains both leaves as miniscript.
    assert.ok(!desc.includes('/*'));
    assert.ok(!/raw\(/.test(desc));
    assert.ok(desc.includes('payload_drop('));
    assert.ok(desc.includes('r:older('));
    assert.ok(desc.includes('multi_a('));
  });

  it('produces the reference 34-byte P2TR scriptPubKey (5120 + tweaked x-only key)', function () {
    const spk = createSbtcDepositScriptPubKey(params);
    assert.strictEqual(spk.toString('hex'), expectedScriptPubKey);
    assert.strictEqual(spk.length, 34);
    assert.strictEqual(spk[0], 0x51, 'OP_1 (Taproot witness version)');
    assert.strictEqual(spk[1], 0x20, 'push-32');
    assert.strictEqual(spk.subarray(2).toString('hex'), expectedTweakedKey);
  });

  it('derives the expected regtest address bcrt1p7wee...sjq4cvx', function () {
    const spk = createSbtcDepositScriptPubKey(params);
    // 'tbtcreg' is the wasm-utxo CoinName for Bitcoin regtest (bcrt bech32 HRP).
    const addr = address.fromOutputScriptWithCoin(spk, 'tbtcreg');
    assert.strictEqual(addr, expectedAddress);
  });

  it('rejects raw reclaim key buffers that are not 32 bytes', function () {
    const bad: SbtcDepositDescriptorParams = {
      ...params,
      walletKeys: [Buffer.alloc(31), reclaimKeys[1], reclaimKeys[2]],
    };
    assert.throws(() => createSbtcDepositDescriptor(bad));
  });
});

describe('deriveReclaimKeys', function () {
  it('returns three 32-byte x-only keys derived at the given index', function () {
    const [k1, k2, k3] = deriveReclaimKeys(getBip32Triple(), 0);
    for (const k of [k1, k2, k3]) {
      assert.strictEqual(k.length, 32, `expected 32-byte x-only key, got ${k.length}`);
    }
  });

  it('produces keys consistent with the descriptor library', function () {
    const triple = getBip32Triple();
    const [k1, k2, k3] = deriveReclaimKeys(triple, 0);
    const derivedFromXpub = triple.map((k) => Buffer.from(k.neutered().derive(0).publicKey.subarray(1)));
    assert.deepStrictEqual([k1, k2, k3], derivedFromXpub);
  });
});
