import assert from 'assert';
import { createHash } from 'crypto';

import { pox5 } from '@bitgo/utxo-descriptors';
import { BIP32, bip32, Descriptor, Psbt } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import { getDescriptorFromBuilder } from '../../../src/descriptor/builder';
import { NamedDescriptor } from '../../../src/descriptor';
import { deriveKeyWithSeed } from '../../../src/deriveKeyWithSeed';
import { createHalfSigned, getTransactionExplanation } from '../../../src/offlineVault';
import { DescriptorTransaction } from '../../../src/offlineVault/descriptor';
import { UtxoCoinName } from '../../../src/names';

type BIP32Interface = bip32.BIP32Interface;

const UNLOCK_HEIGHT = 840_000;
const SEED = 'pox5-offline-vault';
const PRINCIPAL_PREIMAGE = Buffer.alloc(32, 0x42);
const LOCKUP_VALUE = 100_000n;
const EXTERNAL_VALUE = 50_000n;
const CHANGE_VALUE = 45_000n;

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

// the offline vault derives the user signing key from a root key and a seed
const rootUser = testutils.getKey('abstract-utxo-pox5-root');
const backupKey = testutils.getKey('abstract-utxo-pox5-backup');
const bitgoKey = testutils.getKey('abstract-utxo-pox5-bitgo');
const userKey = deriveKeyWithSeed(BIP32.fromBase58(rootUser.toBase58()), SEED).key;
const walletKeys: [BIP32Interface, BIP32Interface, BIP32Interface] = [userKey, backupKey, bitgoKey];

const EARLY_EXIT_KEY = Buffer.from(userKey.derive(9).publicKey);
const EXTERNAL_SCRIPT = Buffer.from(
  Descriptor.fromString(
    `wpkh(${Buffer.from(testutils.getKey('abstract-utxo-pox5-recipient').publicKey).toString('hex')})`,
    'definite'
  ).scriptPubkey()
);

function getLockupDescriptor(stakerKeys: [BIP32Interface, BIP32Interface, BIP32Interface] = walletKeys): Descriptor {
  return pox5.createPox5LockupDescriptor({
    unlockHeight: UNLOCK_HEIGHT,
    stakerCommitment: sha256(PRINCIPAL_PREIMAGE),
    earlyExitKey: EARLY_EXIT_KEY,
    stakerKeys,
  });
}

function getExternalDescriptor(): Descriptor {
  return getDescriptorFromBuilder({ name: 'Wsh2Of3', keys: walletKeys, path: '0/*' });
}

function getInternalDescriptor(): Descriptor {
  return getDescriptorFromBuilder({ name: 'Wsh2Of3', keys: walletKeys, path: '1/*' });
}

function getLockupName(): string {
  return `pox5-lockup-u${UNLOCK_HEIGHT}-${sha256(PRINCIPAL_PREIMAGE).toString('hex').slice(0, 16)}`;
}

function toNamedDescriptor(name: string, descriptor: Descriptor): NamedDescriptor {
  return { name, value: descriptor.toString() };
}

function assertInputHasValidSignatures(psbt: Psbt, inputIndex: number): void {
  assert(psbt.hasPartialSignatures(inputIndex));
  const partialSigs = psbt.getPartialSignatures(inputIndex);
  assert(partialSigs.length > 0);
  for (const sig of partialSigs) {
    assert(psbt.validateSignatureAtInput(inputIndex, sig.pubkey));
  }
}

function assertHalfSigned(tx: DescriptorTransaction, coinName: UtxoCoinName): void {
  const halfSigned = createHalfSigned(coinName, rootUser, SEED, tx);
  const psbt = Psbt.deserialize(Buffer.from(halfSigned.halfSigned.txHex, 'hex'));
  assertInputHasValidSignatures(psbt, 0);
}

type CreateDescriptorTransactionOptions = {
  /* descriptors funding the inputs, spent at derivation index 0 */
  input: Descriptor;
  /* change descriptor, paid at derivation index 0 */
  change: Descriptor;
  descriptors: NamedDescriptor[];
  lockTime?: number;
  sequence?: number;
  /* spend a second lockup input */
  extraLockupInput?: boolean;
  /* commit a principal preimage to mark an early exit */
  earlyExit?: boolean;
};

function createDescriptorTransaction(opts: CreateDescriptorTransactionOptions): DescriptorTransaction {
  const input = opts.input.atDerivationIndex(0);
  const change = opts.change.atDerivationIndex(0);
  const sequence = opts.sequence ?? 0xfffffffe;
  const psbt = Psbt.create(2, opts.lockTime ?? UNLOCK_HEIGHT);
  psbt.addInput('01'.repeat(32), 0, LOCKUP_VALUE, Buffer.from(input.scriptPubkey()), sequence);
  psbt.updateInputWithDescriptor(0, input);
  if (opts.extraLockupInput) {
    psbt.addInput('02'.repeat(32), 0, LOCKUP_VALUE, Buffer.from(input.scriptPubkey()), sequence);
    psbt.updateInputWithDescriptor(1, input);
  }
  psbt.addOutput(Buffer.from(change.scriptPubkey()), CHANGE_VALUE);
  psbt.updateOutputWithDescriptor(0, change);
  psbt.addOutput(EXTERNAL_SCRIPT, EXTERNAL_VALUE);
  if (opts.earlyExit) {
    psbt.addSha256Preimage(0, PRINCIPAL_PREIMAGE);
  }
  return {
    xpubsWithDerivationPath: {
      user: { xpub: walletKeys[0].neutered().toBase58(), derivedFromParentWithSeed: SEED },
      backup: { xpub: walletKeys[1].neutered().toBase58() },
      bitgo: { xpub: walletKeys[2].neutered().toBase58() },
    },
    coinSpecific: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
    descriptors: opts.descriptors,
  };
}

function createLateExitTransaction(
  opts: Partial<Omit<CreateDescriptorTransactionOptions, 'input' | 'change' | 'descriptors'>> & {
    input?: Descriptor;
  } = {}
): DescriptorTransaction {
  const input = opts.input ?? getLockupDescriptor();
  return createDescriptorTransaction({
    ...opts,
    input,
    change: getInternalDescriptor(),
    descriptors: [
      toNamedDescriptor('external', getExternalDescriptor()),
      toNamedDescriptor('internal', getInternalDescriptor()),
      toNamedDescriptor(getLockupName(), input),
    ],
  });
}

describe('OfflineVault PoX-5 late exit', function () {
  for (const coinName of ['btc', 'tbtcstxsignet'] as const) {
    describe(coinName, function () {
      it('explains a late exit and includes the locktime', function () {
        const tx = createLateExitTransaction();
        const explanation = getTransactionExplanation(coinName, tx);
        assert.strictEqual(explanation.locktime, UNLOCK_HEIGHT);
        assert.strictEqual(explanation.outputs.length, 1);
        assert.strictEqual(explanation.outputs[0].amount, EXTERNAL_VALUE.toString());
        assert.strictEqual(explanation.changeOutputs.length, 1);
        assert.strictEqual(explanation.changeOutputs[0].amount, CHANGE_VALUE.toString());
        assert.strictEqual(explanation.fee.fee, (LOCKUP_VALUE - EXTERNAL_VALUE - CHANGE_VALUE).toString());
      });

      it('half-signs a late exit', function () {
        assertHalfSigned(createLateExitTransaction(), coinName);
      });

      it('rejects lockup descriptors with foreign staker keys', function () {
        const foreignKeys: [BIP32Interface, BIP32Interface, BIP32Interface] = [
          testutils.getKey('abstract-utxo-pox5-foreign-1'),
          testutils.getKey('abstract-utxo-pox5-foreign-2'),
          testutils.getKey('abstract-utxo-pox5-foreign-3'),
        ];
        const tx = createLateExitTransaction({ input: getLockupDescriptor(foreignKeys) });
        assert.throws(() => getTransactionExplanation(coinName, tx), /does not match policy/);
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /does not match policy/);
      });

      it('rejects malformed lockup descriptors', function () {
        const malformed = Descriptor.fromString(
          getLockupDescriptor().toString().split('#')[0].replace('multi(2,', 'multi(3,'),
          'derivable'
        );
        const tx = createLateExitTransaction({ input: malformed });
        assert.throws(() => getTransactionExplanation(coinName, tx), /does not match policy/);
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /does not match policy/);
      });

      it('rejects non-canonical lockup descriptors', function () {
        const nonCanonical = Descriptor.fromString(`wsh(pk(${walletKeys[0].neutered().toBase58()}/*))`, 'derivable');
        const tx = createLateExitTransaction({ input: nonCanonical });
        assert.throws(() => getTransactionExplanation(coinName, tx), /does not match policy/);
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /does not match policy/);
      });

      it('explains but does not half-sign before the unlock height', function () {
        const tx = createLateExitTransaction({ lockTime: UNLOCK_HEIGHT - 1 });
        assert.strictEqual(getTransactionExplanation(coinName, tx).locktime, UNLOCK_HEIGHT - 1);
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /nLockTime must be at least/);
      });

      it('explains but does not half-sign a timestamp locktime', function () {
        const tx = createLateExitTransaction({ lockTime: 500_000_000 });
        assert.strictEqual(getTransactionExplanation(coinName, tx).locktime, 500_000_000);
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /block height below/);
      });

      it('does not half-sign a final lockup input sequence', function () {
        const tx = createLateExitTransaction({ sequence: 0xffffffff });
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /non-final sequence/);
      });

      it('does not half-sign early exits', function () {
        const tx = createLateExitTransaction({ earlyExit: true });
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /early exit/);
      });

      it('does not half-sign multiple lockup inputs', function () {
        const tx = createLateExitTransaction({ extraLockupInput: true });
        assert.throws(() => createHalfSigned(coinName, rootUser, SEED, tx), /exactly one lockup input/);
      });
    });
  }
});

describe('OfflineVault descriptor transaction regressions', function () {
  it('explains and half-signs Wsh2Of3 descriptor transactions', function () {
    const external = getExternalDescriptor();
    const internal = getInternalDescriptor();
    const tx = createDescriptorTransaction({
      input: external,
      change: internal,
      descriptors: [toNamedDescriptor('external', external), toNamedDescriptor('internal', internal)],
      lockTime: 0,
      sequence: 0xffffffff,
    });
    const explanation = getTransactionExplanation('btc', tx);
    assert.strictEqual(explanation.locktime, 0);
    assert.strictEqual(explanation.outputs.length, 1);
    assertHalfSigned(tx, 'btc');
  });

  it('explains and half-signs Wsh2Of3CltvDrop descriptor transactions', function () {
    const external = getDescriptorFromBuilder({
      name: 'Wsh2Of3CltvDrop',
      keys: walletKeys,
      path: '0/*',
      locktime: 1_500_000,
    });
    const internal = getDescriptorFromBuilder({
      name: 'Wsh2Of3CltvDrop',
      keys: walletKeys,
      path: '1/*',
      locktime: 1_500_000,
    });
    const tx = createDescriptorTransaction({
      input: external,
      change: internal,
      descriptors: [toNamedDescriptor('external', external), toNamedDescriptor('internal', internal)],
    });
    const explanation = getTransactionExplanation('btc', tx);
    assert.strictEqual(explanation.outputs.length, 1);
    assertHalfSigned(tx, 'btc');
  });
});
