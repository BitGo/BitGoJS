import * as assert from 'assert';
import {
  InscriptionTransactionOutputs,
  createPsbtForSingleInscriptionPassingTransaction,
  createPsbtFromOutputLayout,
  findOutputLayoutForWalletUnspents,
  WalletInputBuilder,
  toArray,
} from '../src';
import { isSatPoint, OutputLayout, toParameters } from '../src';
import { bitgo, networks, testutil } from '@bitgo/utxo-lib';

function assertValidPsbt(
  psbt: bitgo.UtxoPsbt,
  s: bitgo.WalletUnspentSigner<bitgo.RootWalletKeys>,
  expectedOutputs: number,
  expectedFee: bigint
) {
  psbt.signAllInputsHD(s.signer);
  psbt.signAllInputsHD(s.cosigner);
  psbt.finalizeAllInputs();
  assert.strictEqual(psbt.txOutputs.length, expectedOutputs);
  assert.strictEqual(psbt.getFee(), expectedFee);
}

describe('OutputLayout to PSBT conversion', function () {
  const network = networks.bitcoin;
  const walletKeys = testutil.getDefaultWalletKeys();
  const signer = bitgo.WalletUnspentSigner.from(walletKeys, walletKeys.user, walletKeys.bitgo);
  const inscriptionRecipient = bitgo.outputScripts.createOutputScript2of3(
    walletKeys.deriveForChainAndIndex(0, 0).publicKeys,
    'p2sh'
  ).scriptPubKey;
  const walletUnspent = testutil.mockWalletUnspent(network, BigInt(20_000), { keys: walletKeys });
  const inputBuilder: WalletInputBuilder = {
    walletKeys,
    signer: 'user',
    cosigner: 'bitgo',
  };
  const outputs: InscriptionTransactionOutputs = {
    changeOutputs: [
      { chain: 40, index: 0 },
      { chain: 40, index: 1 },
    ],
    inscriptionRecipient,
  };

  function testInscriptionTxWithLayout(layout: OutputLayout, expectedOutputs: number) {
    assertValidPsbt(
      createPsbtFromOutputLayout(network, inputBuilder, [walletUnspent], outputs, layout),
      signer,
      expectedOutputs,
      layout.feeOutput
    );
  }

  it('can convert zero-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(0), BigInt(19_800), BigInt(0), BigInt(200)), 1);
  });

  it('can convert start-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(1_000), BigInt(18_800), BigInt(0), BigInt(200)), 2);
  });

  it('can convert end-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(0), BigInt(18_800), BigInt(1_000), BigInt(200)), 2);
  });

  it('can convert double-padding layout to psbt', function () {
    testInscriptionTxWithLayout(toParameters(BigInt(1_000), BigInt(17_800), BigInt(1_000), BigInt(200)), 3);
  });

  function testWithUnspents(
    inscriptionUnspent: bitgo.WalletUnspent<bigint>,
    supplementaryUnspents: bitgo.WalletUnspent<bigint>[],
    expectedUnspentSelection: bitgo.WalletUnspent<bigint>[],
    expectedResult: OutputLayout | undefined,
    { minimizeInputs }: { minimizeInputs?: boolean } = {}
  ) {
    const values = [inscriptionUnspent, ...supplementaryUnspents].map((u) => u.value);
    it(`finds layout for unspents [${values}, {minimizeInputs=${minimizeInputs}]`, function () {
      const satPoint = inscriptionUnspent.id + ':0';
      assert(isSatPoint(satPoint));
      const f = () =>
        createPsbtForSingleInscriptionPassingTransaction(
          network,
          inputBuilder,
          [inscriptionUnspent],
          satPoint,
          outputs,
          {
            feeRateSatKB: 1000,
          },
          {
            supplementaryUnspents,
            minimizeInputs,
          }
        );
      if (expectedResult === undefined) {
        assert.throws(f);
        return;
      }
      const psbt1 = f();
      assert.deepStrictEqual(
        psbt1.txInputs.map((i) => bitgo.formatOutputId(bitgo.getOutputIdForInput(i))),
        expectedUnspentSelection.map((u) => u.id)
      );
      const result = findOutputLayoutForWalletUnspents(expectedUnspentSelection, satPoint, outputs, {
        feeRateSatKB: 1000,
      });
      assert(result);
      assert.deepStrictEqual(result.layout, expectedResult);
      const expectedOutputs = toArray(expectedResult).filter((v) => v !== BigInt(0)).length - 1;
      const psbt = createPsbtFromOutputLayout(network, inputBuilder, expectedUnspentSelection, outputs, result.layout);
      assertValidPsbt(psbt, signer, expectedOutputs, expectedResult.feeOutput);
      assertValidPsbt(psbt1, signer, expectedOutputs, expectedResult.feeOutput);
      assert.strictEqual(
        psbt.extractTransaction().toBuffer().toString('hex'),
        psbt1.extractTransaction().toBuffer().toString('hex')
      );
    });
  }

  let nUnspent = 0;
  function unspent(v: number): bitgo.WalletUnspent<bigint> {
    return testutil.mockWalletUnspent(network, BigInt(v), { vout: nUnspent++ });
  }

  const u1k = unspent(1_000);
  const u5k1 = unspent(5_000);
  const u5k2 = unspent(5_000);
  const u10k = unspent(10_000);
  const u20k = unspent(20_000);
  const u100m1 = unspent(100_000_000);
  const u100m2 = unspent(100_000_000);

  testWithUnspents(u20k, [], [u20k], {
    firstChangeOutput: BigInt(0),
    inscriptionOutput: BigInt(19648),
    secondChangeOutput: BigInt(0),
    feeOutput: BigInt(352),
  });
  testWithUnspents(u1k, [], [u1k], undefined);
  testWithUnspents(
    u1k,
    [u100m1, u100m2],
    [u1k, u100m1, u100m2],
    {
      firstChangeOutput: BigInt(0),
      inscriptionOutput: BigInt(10_000),
      secondChangeOutput: BigInt(199990009),
      feeOutput: BigInt(991),
    },
    { minimizeInputs: false }
  );
  testWithUnspents(u1k, [u5k1, u5k2, u10k], [u1k, u10k], {
    firstChangeOutput: BigInt(0),
    inscriptionOutput: BigInt(10_350),
    secondChangeOutput: BigInt(0),
    feeOutput: BigInt(650),
  });
});
