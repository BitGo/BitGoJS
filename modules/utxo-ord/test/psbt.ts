import * as assert from 'assert';
import {
  InscriptionTransactionOutputs,
  createPsbtForSingleInscriptionPassingTransaction,
  createPsbtFromOutputLayout,
  findOutputLayoutForWalletUnspents,
  WalletInputBuilder,
  WalletUnspent,
  toArray,
} from '../src';
import { isSatPoint, OutputLayout, toParameters } from '../src';
import { fixedScriptWallet, BIP32, type CoinName } from '@bitgo/wasm-utxo';
import { getTestWalletKeys, mockWalletUnspent } from './testutils';

const coinName: CoinName = 'btc';

function assertValidPsbt(
  psbt: fixedScriptWallet.BitGoPsbt,
  rootWalletKeys: fixedScriptWallet.RootWalletKeys,
  signerKeys: [string, string], // xprvs for signer and cosigner
  expectedOutputs: number,
  expectedFee: bigint
) {
  const replayProtection = { publicKeys: [] as Uint8Array[] };
  const parsed = psbt.parseTransactionWithWalletKeys(rootWalletKeys, replayProtection);

  // Sign all inputs with both signers
  const signer1 = BIP32.fromBase58(signerKeys[0]);
  const signer2 = BIP32.fromBase58(signerKeys[1]);
  parsed.inputs.forEach((_input, inputIndex) => {
    psbt.sign(inputIndex, signer1);
    psbt.sign(inputIndex, signer2);
  });

  psbt.finalizeAllInputs();

  assert.strictEqual(parsed.outputs.length, expectedOutputs);
  assert.strictEqual(parsed.minerFee, expectedFee);
}

describe('OutputLayout to PSBT conversion', function () {
  const { rootWalletKeys, signerXprvs } = getTestWalletKeys();
  // Use wasm-utxo to derive the inscription recipient address (chain 0, index 0)
  const inscriptionRecipient = fixedScriptWallet.address(rootWalletKeys, 0, 0, coinName);
  const walletUnspent = mockWalletUnspent(BigInt(20_000));
  const inputBuilder: WalletInputBuilder = {
    walletKeys: rootWalletKeys,
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
      createPsbtFromOutputLayout(coinName, inputBuilder, [walletUnspent], outputs, layout),
      rootWalletKeys,
      signerXprvs,
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
    inscriptionUnspent: WalletUnspent,
    supplementaryUnspents: WalletUnspent[],
    expectedUnspentSelection: WalletUnspent[],
    expectedResult: OutputLayout | undefined,
    { minimizeInputs }: { minimizeInputs?: boolean } = {}
  ) {
    const values = [inscriptionUnspent, ...supplementaryUnspents].map((u) => u.value);
    it(`finds layout for unspents [${values}, {minimizeInputs=${minimizeInputs}]`, function () {
      const satPoint = inscriptionUnspent.id + ':0';
      assert.ok(isSatPoint(satPoint));
      const f = () =>
        createPsbtForSingleInscriptionPassingTransaction(
          coinName,
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
      const replayProtection = { publicKeys: [] as Uint8Array[] };
      const parsed1 = psbt1.parseTransactionWithWalletKeys(rootWalletKeys, replayProtection);
      assert.deepStrictEqual(
        parsed1.inputs.map((i) => `${i.previousOutput.txid}:${i.previousOutput.vout}`),
        expectedUnspentSelection.map((u) => u.id)
      );
      const result = findOutputLayoutForWalletUnspents(expectedUnspentSelection, satPoint, outputs, {
        feeRateSatKB: 1000,
      });
      assert.ok(result);
      assert.deepStrictEqual(result.layout, expectedResult);
      const expectedOutputs = toArray(expectedResult).filter((v) => v !== BigInt(0)).length - 1;
      const psbt = createPsbtFromOutputLayout(coinName, inputBuilder, expectedUnspentSelection, outputs, result.layout);
      assertValidPsbt(psbt, rootWalletKeys, signerXprvs, expectedOutputs, expectedResult.feeOutput);
      assertValidPsbt(psbt1, rootWalletKeys, signerXprvs, expectedOutputs, expectedResult.feeOutput);
      assert.strictEqual(
        Buffer.from(psbt.extractTransaction()).toString('hex'),
        Buffer.from(psbt1.extractTransaction()).toString('hex')
      );
    });
  }

  let nUnspent = 0;
  function unspent(v: number): WalletUnspent {
    return mockWalletUnspent(BigInt(v), { vout: nUnspent++ });
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
      secondChangeOutput: BigInt(199990007),
      feeOutput: BigInt(993),
    },
    { minimizeInputs: false }
  );
  testWithUnspents(u1k, [u5k1, u5k2, u10k], [u1k, u10k], {
    firstChangeOutput: BigInt(0),
    inscriptionOutput: BigInt(10_349),
    secondChangeOutput: BigInt(0),
    feeOutput: BigInt(651),
  });
});
