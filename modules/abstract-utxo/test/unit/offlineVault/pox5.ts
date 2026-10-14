import assert from 'assert';
import { createHash } from 'crypto';

import { pox5 } from '@bitgo/utxo-descriptors';
import { ast, BIP32, bip32, Descriptor, descriptorWallet, Psbt } from '@bitgo/wasm-utxo';
import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import { createHalfSigned, getTransactionExplanation } from '../../../src/offlineVault';
import { DescriptorTransaction } from '../../../src/offlineVault/descriptor';
import { getDescriptorFromBuilder } from '../../../src/descriptor/builder';
import {
  assertDescriptorPolicy,
  getPolicyForEnv,
  getValidatorDescriptorTemplate,
} from '../../../src/descriptor/validatePolicy';
import { toNamedDescriptorNative } from '../../../src/descriptor';
import { deriveKeyWithSeed } from '../../../src/deriveKeyWithSeed';
import { UtxoCoinName } from '../../../src/names';

const UNLOCK_HEIGHT = 840_000;
const DERIVATION_ID = 'pox5-test-seed';
const INPUT_VALUE = 100_000n;
const CHANGE_VALUE = 60_000n;
const EXTERNAL_VALUE = 30_000n;

const coinNames: UtxoCoinName[] = ['btc', 'tbtcstxsignet'];

type KeyTriple = [BIP32, BIP32, BIP32];

function sha256(value: Uint8Array): Buffer {
  return createHash('sha256').update(value).digest();
}

function getWalletKeys(): { rootPrv: BIP32; keys: KeyTriple } {
  const rootPrv = getKey('pox5-offline-vault-root');
  const userPrv = deriveKeyWithSeed(rootPrv, DERIVATION_ID).key;
  const [, backup, bitgo] = getKeyTriple('pox5-offline-vault');
  return { rootPrv, keys: [userPrv.neutered(), backup.neutered(), bitgo.neutered()] };
}

function getForeignKeys(): KeyTriple {
  const [a, b, c] = getKeyTriple('pox5-offline-vault-foreign');
  return [a.neutered(), b.neutered(), c.neutered()];
}

function createLockupDescriptor(keys: KeyTriple, unlockHeight = UNLOCK_HEIGHT): Descriptor {
  return pox5.createPox5LockupDescriptor({
    unlockHeight,
    stakerCommitment: sha256(Buffer.alloc(32, 0x42)),
    earlyExitKey: Buffer.from(getKey('pox5-offline-vault-early-exit').publicKey),
    stakerKeys: keys,
  });
}

type Pox5TxParams = {
  /** keys used in the lockup descriptor, defaults to the wallet keys */
  lockupKeys?: KeyTriple;
  lockupDescriptor?: Descriptor;
  locktime?: number;
  sequence?: number;
  lockupInputs?: number;
};

function createPox5Tx(params: Pox5TxParams = {}): { tx: DescriptorTransaction; rootPrv: BIP32 } {
  const { rootPrv, keys } = getWalletKeys();
  const external = getDescriptorFromBuilder({ name: 'Wsh2Of3', keys, path: '0/*' });
  const internal = getDescriptorFromBuilder({ name: 'Wsh2Of3', keys, path: '1/*' });
  const lockup = params.lockupDescriptor ?? createLockupDescriptor(params.lockupKeys ?? keys);
  const lockupAtIndex = lockup.atDerivationIndex(0);

  const inputs = Array.from({ length: params.lockupInputs ?? 1 }, (_, i) => ({
    hash: Buffer.alloc(32, i + 1).toString('hex'),
    index: 0,
    witnessUtxo: { script: lockupAtIndex.scriptPubkey(), value: INPUT_VALUE },
    descriptor: lockupAtIndex,
    sequence: params.sequence ?? 0xfffffffe,
  }));
  const psbt = descriptorWallet.createPsbt({ version: 2, locktime: params.locktime ?? UNLOCK_HEIGHT }, inputs, [
    { script: external.atDerivationIndex(7).scriptPubkey(), value: EXTERNAL_VALUE },
    {
      script: internal.atDerivationIndex(3).scriptPubkey(),
      value: CHANGE_VALUE,
      descriptor: internal.atDerivationIndex(3),
    },
  ]);

  const tx: DescriptorTransaction = {
    xpubsWithDerivationPath: {
      user: { xpub: keys[0].toBase58(), derivedFromParentWithSeed: DERIVATION_ID },
      backup: { xpub: keys[1].toBase58() },
      bitgo: { xpub: keys[2].toBase58() },
    },
    coinSpecific: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
    descriptors: [
      { name: 'external', value: external.toString() },
      { name: 'internal', value: internal.toString() },
      { name: `pox5-lockup-u${UNLOCK_HEIGHT}-test`, value: lockup.toString() },
    ],
  };
  return { tx, rootPrv };
}

function halfSign(coinName: UtxoCoinName, { tx, rootPrv }: { tx: DescriptorTransaction; rootPrv: BIP32 }): Psbt {
  const { halfSigned } = createHalfSigned(coinName, rootPrv, DERIVATION_ID, tx);
  return Psbt.deserialize(Buffer.from(halfSigned.txHex, 'hex'));
}

describe('OfflineVault PoX-5 lockup descriptor', function () {
  for (const coinName of coinNames) {
    describe(coinName, function () {
      it('explains a late exit including nLockTime', function () {
        const { tx } = createPox5Tx();
        const explanation = getTransactionExplanation(coinName, tx);
        assert.strictEqual(explanation.locktime, UNLOCK_HEIGHT);
        assert.strictEqual(explanation.outputs.length, 1);
        assert.strictEqual(explanation.outputs[0].amount, EXTERNAL_VALUE.toString());
        assert.strictEqual(explanation.changeOutputs.length, 1);
        assert.strictEqual(explanation.changeOutputs[0].amount, CHANGE_VALUE.toString());
        assert.strictEqual(explanation.fee.fee, (INPUT_VALUE - EXTERNAL_VALUE - CHANGE_VALUE).toString());
      });

      it('half-signs a late exit', function () {
        const signed = halfSign(coinName, createPox5Tx());
        assert.ok(signed.hasPartialSignatures(0));
        const sigs = signed.getPartialSignatures(0);
        assert.strictEqual(sigs.length, 1);
        assert.ok(signed.validateSignatureAtInput(0, sigs[0].pubkey));
      });

      it('half-signs a late exit with nLockTime above the unlock height', function () {
        halfSign(coinName, createPox5Tx({ locktime: UNLOCK_HEIGHT + 100 }));
      });

      describe('rejects', function () {
        function assertRejected(params: Pox5TxParams, message: RegExp) {
          const tx = createPox5Tx(params);
          assert.throws(() => halfSign(coinName, tx), message);
        }

        it('lockup descriptors with foreign staker keys', function () {
          const params = { lockupKeys: getForeignKeys() };
          assert.throws(() => getTransactionExplanation(coinName, createPox5Tx(params).tx), /does not match policy/);
          assertRejected(params, /does not match policy/);
        });

        it('lockup descriptors with only one foreign staker key', function () {
          const { keys } = getWalletKeys();
          const [foreign] = getForeignKeys();
          assertRejected({ lockupKeys: [keys[0], keys[1], foreign] }, /does not match policy/);
        });

        it('lockup descriptors with permuted staker keys', function () {
          const { keys } = getWalletKeys();
          assertRejected({ lockupKeys: [keys[1], keys[0], keys[2]] }, /does not match policy/);
        });

        it('malformed lockup descriptors', function () {
          const { keys } = getWalletKeys();
          // unlock height is outside of the block height range
          const node = ast.fromDescriptor(createLockupDescriptor(keys)) as {
            wsh: { and_v: [{ 'v:or_i': [{ after: number }, unknown] }, unknown] };
          };
          node.wsh.and_v[0]['v:or_i'][0] = { after: 600_000_000 };
          const malformed = Descriptor.fromString(ast.formatNode(node as ast.DescriptorNode), 'derivable');
          assertRejected({ lockupDescriptor: malformed }, /does not match policy/);
        });

        it('non-canonical lockup descriptors', function () {
          const { keys } = getWalletKeys();
          const xpubs = keys.map((k) => k.toBase58() + '/*');
          // plain 2-of-3 with the early exit branch removed
          const other = Descriptor.fromString(`wsh(and_v(v:pk(${xpubs[0]}),multi(2,${xpubs.join(',')})))`, 'derivable');
          assertRejected({ lockupDescriptor: other }, /does not match policy/);
        });

        it('nLockTime below the unlock height', function () {
          assertRejected({ locktime: UNLOCK_HEIGHT - 1 }, /nLockTime must be at least/);
        });

        it('nLockTime that is a timestamp', function () {
          assertRejected({ locktime: 500_000_000 }, /nLockTime must be a block height/);
        });

        it('final sequence on the lockup input', function () {
          assertRejected({ sequence: 0xffffffff }, /non-final sequence/);
        });

        it('more than one lockup input', function () {
          assertRejected({ lockupInputs: 2 }, /exactly one PoX-5 lockup input/);
        });
      });

      it('still explains and signs a regular Wsh2Of3 transaction', function () {
        const { rootPrv, keys } = getWalletKeys();
        const external = getDescriptorFromBuilder({ name: 'Wsh2Of3', keys, path: '0/*' });
        const input = external.atDerivationIndex(1);
        const psbt = descriptorWallet.createPsbt(
          { version: 2, locktime: 0 },
          [
            {
              hash: '01'.repeat(32),
              index: 0,
              witnessUtxo: { script: input.scriptPubkey(), value: INPUT_VALUE },
              descriptor: input,
            },
          ],
          [{ script: external.atDerivationIndex(2).scriptPubkey(), value: 90_000n }]
        );
        const tx: DescriptorTransaction = {
          xpubsWithDerivationPath: {
            user: { xpub: keys[0].toBase58(), derivedFromParentWithSeed: DERIVATION_ID },
            backup: { xpub: keys[1].toBase58() },
            bitgo: { xpub: keys[2].toBase58() },
          },
          coinSpecific: { txHex: Buffer.from(psbt.serialize()).toString('hex') },
          descriptors: [{ name: 'external', value: external.toString() }],
        };
        assert.strictEqual(getTransactionExplanation(coinName, tx).locktime, 0);
        assert.ok(halfSign(coinName, { tx, rootPrv }).hasPartialSignatures(0));
      });
    });
  }

  describe('getPolicyForEnv(prod)', function () {
    function validate(descriptors: Descriptor[], keys: bip32.BIP32Interface[]) {
      assertDescriptorPolicy(
        descriptors.map((value, i) =>
          toNamedDescriptorNative({ name: String(i), value: value.toString() }, 'derivable')
        ),
        getPolicyForEnv('prod'),
        [keys[0], keys[1], keys[2]]
      );
    }

    it('accepts wallet descriptors together with the PoX-5 lockup descriptor', function () {
      const { keys } = getWalletKeys();
      const external = getDescriptorFromBuilder({ name: 'Wsh2Of3', keys, path: '0/*' });
      validate([external, createLockupDescriptor(keys)], keys);
      validate([createLockupDescriptor(keys, 900_000)], keys);
    });

    it('rejects a lockup descriptor with foreign keys', function () {
      const { keys } = getWalletKeys();
      assert.throws(() => validate([createLockupDescriptor(getForeignKeys())], keys), /does not match policy/);
    });

    it('accepts Wsh2Of3CltvDrop descriptors', function () {
      const { keys } = getWalletKeys();
      const cltvDrop = getDescriptorFromBuilder({ name: 'Wsh2Of3CltvDrop', keys, path: '0/*', locktime: 1_000 });
      validate([cltvDrop], keys);
    });

    it('returns false instead of throwing for descriptors a template cannot parse', function () {
      const { keys } = getWalletKeys();
      const lockup = toNamedDescriptorNative(
        { name: 'lockup', value: createLockupDescriptor(keys).toString() },
        'derivable'
      );
      for (const name of ['Wsh2Of3', 'Wsh2Of3CltvDrop', 'ShWsh2Of3CltvDrop', 'SbtcDeposit']) {
        assert.strictEqual(getValidatorDescriptorTemplate(name).validate([lockup], [keys[0], keys[1], keys[2]]), false);
      }
    });
  });
});
