import 'mocha';
import assert from 'assert';
import { createHash } from 'crypto';

import { pox5 } from '@bitgo/utxo-descriptors';
import { Descriptor, descriptorWallet, Psbt } from '@bitgo/wasm-utxo';
import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import { getPolicyForEnv } from '../../../../src/descriptor/validatePolicy';
import type { UtxoWallet } from '../../../../src/wallet';
import { getUtxoCoin } from '../../util/utxoCoins';
import { nockBitGo } from '../../util/nockBitGo';

const UNLOCK_HEIGHT = 840_000;
const PRINCIPAL_PREIMAGE = Buffer.alloc(32, 0x42);

type Pox5SpendParams = {
  locktime: number;
  sequence?: number;
  /** adds the principal preimage to the lockup input, which makes the spend an early exit */
  preimage?: Uint8Array;
};

// Hot descriptor wallets sign through coin.signTransaction. The PoX-5 spend policy that applies to the
// offline vault must apply here as well: the SDK must not sign an exit that spends the lockup incorrectly.
describe('signTransaction: PoX-5 lockup spend of a descriptor wallet', function () {
  const coin = getUtxoCoin('btc');
  const keys = getKeyTriple('pox5-hot-wallet');
  const keyIds = ['kU', 'kB', 'kG'];

  const lockup: Descriptor = pox5.createPox5LockupDescriptor({
    unlockHeight: UNLOCK_HEIGHT,
    stakerCommitment: createHash('sha256').update(PRINCIPAL_PREIMAGE).digest(),
    earlyExitKey: Buffer.from(getKey('pox5-hot-wallet-early-exit').publicKey),
    stakerKeys: [keys[0].neutered(), keys[1].neutered(), keys[2].neutered()],
  });

  function createPsbt({ locktime, sequence = 0xfffffffe, preimage }: Pox5SpendParams): Psbt {
    const lockupAtIndex = lockup.atDerivationIndex(0);
    const psbt = descriptorWallet.createPsbt(
      { version: 2, locktime },
      [
        {
          hash: '01'.repeat(32),
          index: 0,
          witnessUtxo: { script: lockupAtIndex.scriptPubkey(), value: 100_000n },
          descriptor: lockupAtIndex,
          sequence,
        },
      ],
      [{ script: lockupAtIndex.scriptPubkey(), value: 90_000n }]
    );
    if (preimage) {
      psbt.addSha256Preimage(0, preimage);
    }
    return psbt;
  }

  async function sign(params: Pox5SpendParams): Promise<Psbt> {
    const wallet = {
      coinSpecific: () => ({ descriptors: [{ name: 'pox5-lockup', value: lockup.toString() }] }),
      keyIds: () => keyIds,
    } as unknown as UtxoWallet;
    keyIds.forEach((id, i) => {
      nockBitGo().get(`/api/v2/${coin.getChain()}/key/${id}`).reply(200, { pub: keys[i].neutered().toBase58() });
    });
    const result = await coin.signTransaction({
      txPrebuild: { txHex: Buffer.from(createPsbt(params).serialize()).toString('hex'), decodeWith: 'wasm-utxo' },
      prv: keys[0].toBase58(),
      wallet,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    assert.ok('txHex' in result);
    return Psbt.deserialize(Buffer.from(result.txHex, 'hex'));
  }

  function assertSigned(psbt: Psbt): void {
    const sigs = psbt.getPartialSignatures(0);
    assert.strictEqual(sigs.length, 1);
    assert.ok(psbt.validateSignatureAtInput(0, sigs[0].pubkey));
  }

  describe('late exit', function () {
    it('signs with nLockTime at the unlock height', async function () {
      assertSigned(await sign({ locktime: UNLOCK_HEIGHT }));
    });

    it('rejects nLockTime below the unlock height', async function () {
      await assert.rejects(sign({ locktime: UNLOCK_HEIGHT - 1 }), /nLockTime must be at least/);
    });

    it('rejects a final sequence', async function () {
      await assert.rejects(sign({ locktime: UNLOCK_HEIGHT, sequence: 0xffffffff }), /non-final sequence/);
    });
  });

  describe('early exit', function () {
    it('signs with a zero nLockTime and keeps the principal preimage', async function () {
      const signed = await sign({ locktime: 0, preimage: PRINCIPAL_PREIMAGE });
      assertSigned(signed);
      assert.ok(signed.getInputKeyValues(0).some((r) => r.type === 'known' && r.key === 'PSBT_IN_SHA256'));
    });

    it('rejects a non-zero nLockTime', async function () {
      await assert.rejects(sign({ locktime: UNLOCK_HEIGHT, preimage: PRINCIPAL_PREIMAGE }), /nLockTime must be 0/);
    });

    it('rejects a principal preimage that does not match the descriptor commitment', async function () {
      await assert.rejects(
        sign({ locktime: 0, preimage: Buffer.alloc(32, 0x43) }),
        /expected exactly one PSBT_IN_SHA256 record/
      );
    });
  });

  describe('policy', function () {
    for (const env of ['prod', 'adminProd', 'test', 'mock'] as const) {
      it(`checks the spend in the ${env} policy`, function () {
        const spend = createPsbt({ locktime: UNLOCK_HEIGHT - 1 });
        const descriptorMap = new Map([['pox5-lockup', lockup]]);
        assert.throws(() => getPolicyForEnv(env).validateSpend?.(spend, descriptorMap), /nLockTime must be at least/);
      });
    }
  });
});
