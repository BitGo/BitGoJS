import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { TxIntentMismatchError } from '@bitgo/sdk-core';
import { fixedScriptWallet } from '@bitgo/wasm-utxo';

import {
  assertRebuiltShieldedSignable,
  computeShieldedSpendSighash,
  decodeShieldedPsbt,
  explainShieldedSpendPsbt,
  isShieldedSpendPsbt,
  resolveInstalledShieldedRks,
  ShieldedTransactionVerificationError,
  verifyShieldedSpendAgainstRecipients,
} from '../../../../src/impl/zec/shieldedVerify';
import type { Zec } from '../../../../src/impl/zec';
import { getUtxoCoin } from '../../util';
import { getDefaultWasmWalletKeys } from '../../util/keychains';

type IronwoodShieldedSpendFixture = {
  coin: 'tzec';
  /** Wallet-platform signing golden: IMS-built PSBT (ciphertexts + anchor applied, no rks). */
  transferSigning: {
    psbtHex: string;
    spends: { spendIndex: number; actionIndex: number; value: string; address: string }[];
    outputs: { actionIndex: number; address: string; amount: string; isShielded: boolean; isChange: boolean }[];
    /** Rerand round 2 rks, spend order. */
    rks: string[];
    sighash: string;
    ak: string;
  };
  /** A spendable note (with witness) to build keyless spend PSBTs from. */
  spendBuild: {
    blockHeight: number;
    anchor: string;
    spends: {
      cmx: string;
      nullifier: string;
      recipient: string;
      rho: string;
      rseed: string;
      value: string;
      witness: { position: number; authPath: string[] };
    }[];
    recipientReceiver: string;
  };
};

const fixture: IronwoodShieldedSpendFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'ironwoodShieldedSpend.json'), 'utf8')
);

const COIN = 'tzec' as const;
const SPEND_VALUE = 100_000_000n;
/** ZIP-317 conventional fee for a 2-action bundle (1 spend, 2 outputs). */
const FEE = 10_000n;

const hex = (value: string): Uint8Array => new Uint8Array(Buffer.from(value, 'hex'));
const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

/** The fixture spend note, with its witness rebuilt (and re-validated) from the raw auth path. */
function spendRequests(): fixedScriptWallet.ZcashShieldedSpendRequest[] {
  const { spends, anchor } = fixture.spendBuild;
  return spends.map((spend) => ({
    recipient: hex(spend.recipient),
    value: BigInt(spend.value),
    rho: hex(spend.rho),
    rseed: hex(spend.rseed),
    cmx: hex(spend.cmx),
    witness: fixedScriptWallet.ZcashIronwoodWitness.build(
      hex(spend.cmx),
      spend.witness.position,
      spend.witness.authPath.map(hex),
      hex(anchor)
    ),
    nullifier: hex(spend.nullifier),
  }));
}

/** Build a keyless 1-spend shielded PSBT paying `outputs`, plus change back to the spent note. */
function buildSpendPsbt(outputs: { receiver: Uint8Array; amount: bigint }[], change?: bigint): string {
  const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmptyKeyless(COIN, {
    blockHeight: fixture.spendBuild.blockHeight,
  });
  psbt.addShieldedSpends(
    spendRequests(),
    outputs.map(({ receiver, amount }) => ({ recipient: receiver, amount })),
    {
      anchor: hex(fixture.spendBuild.anchor),
      ...(change !== undefined ? { change: { amount: change, spendIndex: 0 } } : {}),
    }
  );
  return toHex(psbt.serialize());
}

const recipientReceiver = hex(fixture.spendBuild.recipientReceiver);
const recipientAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(recipientReceiver, COIN);
const spentNoteReceiver = hex(fixture.spendBuild.spends[0].recipient);
const spentNoteAddress = fixedScriptWallet.ZcashUnifiedAddress.encodeOrchardReceiver(spentNoteReceiver, COIN);
// An unrelated shielded address (a recipient of the transfer golden).
const otherAddress = fixture.transferSigning.outputs[0].address;
const otherReceiver = fixedScriptWallet.ZcashUnifiedAddress.parse(otherAddress, COIN).orchardReceiver as Uint8Array;

describe('Zec shielded (RedPallas TSS) keyless verification', function () {
  describe('verifyShieldedSpendAgainstRecipients', function () {
    it('accepts the requested recipient plus parser-marked change', function () {
      const txHex = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_990_000n);
      const parsed = verifyShieldedSpendAgainstRecipients(
        txHex,
        [{ address: recipientAddress, amount: '30000000' }],
        COIN
      );
      assert.strictEqual(parsed.fee, FEE);
      assert.deepStrictEqual(
        parsed.outputs.map((o) => o.isChange),
        parsed.outputs.map((o) => o.value === 69_990_000n)
      );
    });

    it('accepts duplicate recipients as separate outputs', function () {
      const txHex = buildSpendPsbt(
        [
          { receiver: recipientReceiver, amount: 10_000_000n },
          { receiver: recipientReceiver, amount: 10_000_000n },
        ],
        SPEND_VALUE - 20_000_000n - 15_000n
      );
      verifyShieldedSpendAgainstRecipients(
        txHex,
        [
          { address: recipientAddress, amount: 10_000_000 },
          { address: recipientAddress, amount: '10000000' },
        ],
        COIN
      );
    });

    it('accepts a recipient paying a spent note address (note split)', function () {
      // Both outputs are parser-marked change; the recipient still consumes one of them.
      const txHex = buildSpendPsbt([{ receiver: spentNoteReceiver, amount: 30_000_000n }], 69_990_000n);
      verifyShieldedSpendAgainstRecipients(txHex, [{ address: spentNoteAddress, amount: '30000000' }], COIN);
    });

    it('accepts the transfer golden paying both of its recipients', function () {
      verifyShieldedSpendAgainstRecipients(
        fixture.transferSigning.psbtHex,
        fixture.transferSigning.outputs.map((o) => ({ address: o.address, amount: o.amount })),
        COIN
      );
    });

    it('rejects a recipient amount that differs from the output', function () {
      const txHex = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_990_000n);
      assert.throws(
        () => verifyShieldedSpendAgainstRecipients(txHex, [{ address: recipientAddress, amount: '30000001' }], COIN),
        (e: unknown) => e instanceof ShieldedTransactionVerificationError && /expected output missing/.test(e.message)
      );
    });

    it('rejects a requested recipient missing from the transaction', function () {
      const txHex = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_990_000n);
      assert.throws(
        () =>
          verifyShieldedSpendAgainstRecipients(
            txHex,
            [
              { address: recipientAddress, amount: '30000000' },
              { address: otherAddress, amount: '1000' },
            ],
            COIN
          ),
        /expected output missing/
      );
    });

    it('rejects an output to an unrequested external recipient', function () {
      const txHex = buildSpendPsbt([
        { receiver: recipientReceiver, amount: 30_000_000n },
        { receiver: otherReceiver, amount: 69_990_000n },
      ]);
      assert.throws(
        () => verifyShieldedSpendAgainstRecipients(txHex, [{ address: recipientAddress, amount: '30000000' }], COIN),
        /unintended external recipients/
      );
    });

    it('rejects the transfer golden when only one of its recipients was requested', function () {
      const [first] = fixture.transferSigning.outputs;
      assert.throws(
        () =>
          verifyShieldedSpendAgainstRecipients(
            fixture.transferSigning.psbtHex,
            [{ address: first.address, amount: first.amount }],
            COIN
          ),
        /unintended external recipients/
      );
    });

    it('rejects a fee above the ZIP-317 bounds (change burned as fee)', function () {
      const txHex = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_980_000n);
      assert.throws(
        () => verifyShieldedSpendAgainstRecipients(txHex, [{ address: recipientAddress, amount: '30000000' }], COIN),
        /outside the ZIP-317 bounds/
      );
    });

    it('rejects a transparent-input (non-RedPallas) v6 PSBT', function () {
      const { walletKeys } = getDefaultWasmWalletKeys();
      const psbt = fixedScriptWallet.ZcashIronwoodBitGoPsbt.createEmpty(COIN, walletKeys, { blockHeight: 4200000 });
      psbt.addWalletInput({ txid: '11'.repeat(32), vout: 0, value: 100000n }, walletKeys, {
        scriptId: { chain: 0, index: 0 },
      });
      psbt.addShieldedOutputs([{ recipient: recipientReceiver, amount: 90000n }], new Uint8Array(32));
      const txHex = toHex(psbt.serialize());
      assert.strictEqual(isShieldedSpendPsbt(txHex, COIN), false);
      assert.throws(
        () => verifyShieldedSpendAgainstRecipients(txHex, [{ address: recipientAddress, amount: '90000' }], COIN),
        /spends no shielded notes/
      );
    });

    it('rejects bytes that are not a v6 PSBT', function () {
      assert.throws(() => verifyShieldedSpendAgainstRecipients('deadbeef', [], COIN), /not a Zcash Ironwood/);
    });
  });

  describe('explainShieldedSpendPsbt', function () {
    it('splits parser-marked change from recipients and reports the fee and spends', function () {
      const txHex = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_990_000n);
      const explanation = explainShieldedSpendPsbt(decodeShieldedPsbt(txHex, COIN));
      assert.deepStrictEqual(explanation.outputs, [{ address: recipientAddress, amount: '30000000', external: true }]);
      assert.deepStrictEqual(explanation.changeOutputs, [
        { address: spentNoteAddress, amount: '69990000', external: false },
      ]);
      assert.strictEqual(explanation.outputAmount, '30000000');
      assert.strictEqual(explanation.changeAmount, '69990000');
      assert.strictEqual(explanation.fee, FEE.toString());
      assert.strictEqual(explanation.inputAmount, SPEND_VALUE.toString());
      assert.deepStrictEqual(explanation.inputs, [{ address: spentNoteAddress, value: SPEND_VALUE.toString() }]);
      assert.strictEqual(explanation.shieldedSpends.length, 1);
      assert.strictEqual(explanation.shieldedSpends[0].nullifier, fixture.spendBuild.spends[0].nullifier);
    });
  });

  describe('Zec.verifyTransaction / explainTransaction (TSS wallet)', function () {
    const zec = getUtxoCoin(COIN) as unknown as Zec;
    const txHex = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_990_000n);
    // A TSS wallet stub: the shielded path must need nothing from the wallet but its type.
    const tssWallet = { multisigType: () => 'tss' } as unknown as Parameters<Zec['verifyTransaction']>[0]['wallet'];

    it('verifies a shielded prebuild without wallet keys or a receive address', async function () {
      const ok = await zec.verifyTransaction({
        txParams: { recipients: [{ address: recipientAddress, amount: '30000000' }] },
        txPrebuild: { txHex },
        wallet: tssWallet,
      });
      assert.strictEqual(ok, true);
    });

    it('takes the shielded path from walletType alone', async function () {
      const ok = await zec.verifyTransaction({
        txParams: { recipients: [{ address: recipientAddress, amount: '30000000' }] },
        txPrebuild: { txHex },
        wallet: undefined as unknown as typeof tssWallet,
        walletType: 'tss',
      });
      assert.strictEqual(ok, true);
    });

    it('throws TxIntentMismatchError (with an explanation) on a recipient mismatch', async function () {
      await assert.rejects(
        zec.verifyTransaction({
          txParams: { recipients: [{ address: recipientAddress, amount: '29000000' }] },
          txPrebuild: { txHex },
          wallet: tssWallet,
        }),
        (e: unknown) => {
          assert.ok(e instanceof TxIntentMismatchError);
          assert.match(e.message, /expected output missing/);
          assert.strictEqual(JSON.parse(e.txExplanation as string).fee, FEE.toString());
          return true;
        }
      );
    });

    it('throws TxIntentMismatchError when txHex is missing', async function () {
      await assert.rejects(
        zec.verifyTransaction({ txParams: { recipients: [] }, txPrebuild: {}, wallet: tssWallet }),
        (e: unknown) =>
          e instanceof TxIntentMismatchError && /missing required txPrebuild property txHex/.test(e.message)
      );
    });

    it('explains a shielded spend PSBT without pubs or a wallet', async function () {
      const explanation = await zec.explainTransaction({ txHex });
      assert.strictEqual(explanation.fee, FEE.toString());
      assert.deepStrictEqual(
        explanation.outputs.map((o) => [o.address, o.amount]),
        [[recipientAddress, '30000000']]
      );
      assert.deepStrictEqual(
        explanation.changeOutputs.map((o) => [o.address, o.amount]),
        [[spentNoteAddress, '69990000']]
      );
    });

    it('explains a shielded spend PSBT for a TSS wallet', async function () {
      const explanation = await zec.explainTransaction({ txHex }, tssWallet);
      assert.strictEqual(explanation.changeOutputs.length, 1);
    });
  });

  describe('post-rerand rebuild (offline vault console)', function () {
    const { psbtHex, spends, rks, sighash } = fixture.transferSigning;

    /** wallet-platform's rebuildShieldedSignableAfterRerand: install rks at each spend's action. */
    function rebuild(entries: { actionIndex: number; rk: string }[]): string {
      const psbt = decodeShieldedPsbt(psbtHex, COIN);
      psbt.addSpendRks(entries.map(({ actionIndex, rk }) => ({ actionIndex, rk: hex(rk) })));
      return toHex(psbt.serialize());
    }
    const platformEntries = spends.map((spend) => ({ actionIndex: spend.actionIndex, rk: rks[spend.spendIndex] }));
    const rebuiltTxHex = rebuild(platformEntries);

    it('computes the platform sighash from the original PSBT and the rks', function () {
      assert.strictEqual(computeShieldedSpendSighash(psbtHex, platformEntries, COIN), sighash);
    });

    it('accepts the platform rebuild and resolves each rk to its action', function () {
      const installed = assertRebuiltShieldedSignable({
        coinName: COIN,
        originalTxHex: psbtHex,
        rebuiltTxHex,
        signableHex: sighash,
        rks,
      });
      assert.deepStrictEqual(
        installed.map((entry) => entry.actionIndex),
        spends.map((spend) => spend.actionIndex)
      );
    });

    it('accepts an upper-case signableHex', function () {
      assertRebuiltShieldedSignable({
        coinName: COIN,
        originalTxHex: psbtHex,
        rebuiltTxHex,
        signableHex: sighash.toUpperCase(),
        rks: rks.map(hex),
      });
    });

    it('rejects a signableHex that does not commit to the reviewed transaction', function () {
      assert.throws(
        () =>
          assertRebuiltShieldedSignable({
            coinName: COIN,
            originalTxHex: psbtHex,
            rebuiltTxHex,
            signableHex: 'ff'.repeat(32),
            rks,
          }),
        /rebuilt signable does not commit to the reviewed shielded transaction/
      );
    });

    it('rejects a rebuild of a different transaction than the one reviewed', function () {
      const reviewed = buildSpendPsbt([{ receiver: recipientReceiver, amount: 30_000_000n }], 69_990_000n);
      assert.throws(
        () =>
          assertRebuiltShieldedSignable({
            coinName: COIN,
            originalTxHex: reviewed,
            rebuiltTxHex,
            signableHex: sighash,
            rks,
          }),
        /different number of notes|does not commit to the reviewed/
      );
    });

    it('rejects a rebuild that installed an rk the signer did not produce', function () {
      const foreign = rebuild([
        { actionIndex: spends[0].actionIndex, rk: fixture.transferSigning.ak },
        { actionIndex: spends[1].actionIndex, rk: rks[1] },
      ]);
      assert.throws(
        () =>
          assertRebuiltShieldedSignable({
            coinName: COIN,
            originalTxHex: psbtHex,
            rebuiltTxHex: foreign,
            signableHex: sighash,
            rks,
          }),
        /rerandomized key for spend 0 is not installed/
      );
    });

    it('rejects a rebuilt serializedTxHex without the rks installed', function () {
      assert.throws(
        () =>
          assertRebuiltShieldedSignable({
            coinName: COIN,
            originalTxHex: psbtHex,
            rebuiltTxHex: psbtHex,
            signableHex: sighash,
            rks,
          }),
        /is not installed in the rebuilt shielded transaction/
      );
    });

    it('rejects a serializedTxHex whose sighash differs from the signable', function () {
      // The rks swapped between the two spends: the signer's own keys, but a different
      // transaction (the sighash commits each action's rk).
      const swapped = rebuild([
        { actionIndex: spends[0].actionIndex, rk: rks[1] },
        { actionIndex: spends[1].actionIndex, rk: rks[0] },
      ]);
      assert.throws(
        () =>
          assertRebuiltShieldedSignable({
            coinName: COIN,
            originalTxHex: psbtHex,
            rebuiltTxHex: swapped,
            signableHex: sighash,
            rks,
          }),
        /does not commit to the reviewed shielded transaction/
      );
    });

    it('rejects a wrong number of rerandomized keys', function () {
      assert.throws(
        () => resolveInstalledShieldedRks(decodeShieldedPsbt(rebuiltTxHex, COIN), [rks[0]]),
        /has 2 spends but 1 rerandomized keys/
      );
    });
  });
});
