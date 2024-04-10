import * as assert from 'assert';

import * as bs58check from 'bs58check';

import { fromOutputScript } from '../../../src/address';
import { createOutputScriptP2shP2pk, scriptTypes2Of3 } from '../../../src/bitgo/outputScripts';
import { getDefaultWalletKeys, getKeyTriple, replayProtectionKeyPair } from '../../../src/testutil';
import { networks, testutil } from '../../../src';
import { addWalletOutputToPsbt, addXpubsToPsbt, getExternalChainCode, RootWalletKeys } from '../../../src/bitgo';
import {
  findInternalOutputIndices,
  findWalletOutputIndices,
  getTotalAmountOfInternalOutputs,
  getTotalAmountOfWalletOutputs,
} from '../../../src/bitgo/wallet/psbt/PsbtOutputs';
import { GlobalXpub } from 'bip174/src/lib/interfaces';

const network = networks.bitcoin;
const rootWalletKeys = getDefaultWalletKeys();

describe('psbt internal and wallet outputs', function () {
  const value = BigInt(1e8);
  const fee = BigInt(1000);
  const externalAddress = fromOutputScript(
    createOutputScriptP2shP2pk(replayProtectionKeyPair.publicKey).scriptPubKey,
    networks.bitcoin
  );

  describe('success', function () {
    it(`Find indices of psbt wallet & internal outputs`, function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'p2wsh', value: BigInt(value + value) },
          { scriptType: 'p2shP2wsh', value: BigInt(value) },
          { scriptType: 'p2trMusig2', value: BigInt(value) },
          { scriptType: 'p2tr', value: BigInt(value) },
          { scriptType: 'p2sh', value: BigInt(value) },
        ],
        [
          { scriptType: 'p2sh', value: BigInt(value) },
          { scriptType: 'p2shP2wsh', value: BigInt(value) },
          { scriptType: 'p2wsh', value: BigInt(value) },
          {
            address: externalAddress,
            value: BigInt(value - fee),
          },
          { scriptType: 'p2tr', value: BigInt(value), isInternalAddress: true },
          { scriptType: 'p2trMusig2', value: BigInt(value), isInternalAddress: true },
        ],
        network,
        rootWalletKeys,
        'unsigned'
      );
      const expected = [0, 1, 2, 4, 5];
      assert.deepEqual(findWalletOutputIndices(psbt, rootWalletKeys.triple), expected);
      addXpubsToPsbt(psbt, rootWalletKeys);
      assert.deepEqual(findInternalOutputIndices(psbt), expected);
    });

    scriptTypes2Of3.forEach((scriptType) => {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: scriptType, value: BigInt(value) },
          { scriptType: 'p2wsh', value: BigInt(value) },
          { scriptType: 'p2shP2wsh', value: BigInt(value) },
          { scriptType: 'p2trMusig2', value: BigInt(value) },
          { scriptType: 'p2tr', value: BigInt(value) },
          { scriptType: 'p2sh', value: BigInt(value) },
        ],
        [
          { scriptType: 'p2sh', value: BigInt(value) },
          { scriptType: 'p2shP2wsh', value: BigInt(value) },
          { scriptType: 'p2wsh', value: BigInt(value) },
          {
            address: externalAddress,
            value: BigInt(value - fee),
          },
          { scriptType: 'p2tr', value: BigInt(value), isInternalAddress: true },
          { scriptType: 'p2trMusig2', value: BigInt(value), isInternalAddress: true },
        ],
        network,
        rootWalletKeys,
        'unsigned'
      );

      addXpubsToPsbt(psbt, rootWalletKeys);

      const totalInternalAmount = value * BigInt(psbt.inputCount - 1);

      it(`PSBT with ${scriptType} input and globalXpub`, function () {
        assert.strictEqual(getTotalAmountOfInternalOutputs(psbt), totalInternalAmount);
      });

      it(`Cloned PSBT with ${scriptType} input and globalXpub`, function () {
        assert.strictEqual(getTotalAmountOfInternalOutputs(psbt.clone()), totalInternalAmount);
      });

      it(`PSBT with ${scriptType} input and ordered rootNodes`, function () {
        assert.strictEqual(getTotalAmountOfWalletOutputs(psbt, rootWalletKeys.triple), totalInternalAmount);
      });
    });

    it(`PSBT with p2shP2pk as first input`, function () {
      const psbt = testutil.constructPsbt(
        [
          { scriptType: 'p2shP2pk', value: BigInt(value) },
          { scriptType: 'p2wsh', value: BigInt(value) },
        ],
        [
          { scriptType: 'p2sh', value: BigInt(value) },
          {
            address: externalAddress,
            value: BigInt(value - fee),
          },
        ],
        network,
        rootWalletKeys,
        'unsigned'
      );
      addXpubsToPsbt(psbt, rootWalletKeys);
      assert.strictEqual(getTotalAmountOfInternalOutputs(psbt), value);
    });

    it(`PSBT with outputs of external wallet root nodes`, function () {
      const psbt = testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(value) }],
        [{ scriptType: 'p2sh', value: BigInt(value) }],
        network,
        rootWalletKeys,
        'unsigned'
      );
      const externalAmount = BigInt(8888);
      const externalRootWalletKeys = new RootWalletKeys(getKeyTriple('dummy'));
      const indices = [0, 1];
      indices.forEach((index) =>
        addWalletOutputToPsbt(psbt, externalRootWalletKeys, getExternalChainCode('p2wsh'), index, externalAmount)
      );
      assert.strictEqual(
        getTotalAmountOfWalletOutputs(psbt, externalRootWalletKeys.triple),
        externalAmount * BigInt(indices.length)
      );
    });

    it(`PSBT with no outputs of external wallet root nodes`, function () {
      const psbt = testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(value) }],
        [{ scriptType: 'p2sh', value: BigInt(value) }],
        network,
        rootWalletKeys,
        'unsigned'
      );
      assert.strictEqual(
        getTotalAmountOfWalletOutputs(psbt, new RootWalletKeys(getKeyTriple('dummy')).triple),
        BigInt(0)
      );
    });

    it(`PSBT with no internal output`, function () {
      const psbt = testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(value) }],
        [
          {
            address: externalAddress,
            value: BigInt(value - fee),
          },
        ],
        network,
        rootWalletKeys,
        'unsigned'
      );
      addXpubsToPsbt(psbt, rootWalletKeys);
      assert.strictEqual(getTotalAmountOfInternalOutputs(psbt), BigInt(0));
    });
  });

  describe('failure', function () {
    it('PSBT without globalXpub', function () {
      const psbt = testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
      assert.throws(
        () => getTotalAmountOfInternalOutputs(psbt),
        (e: any) => e.message === 'Could not find root nodes in PSBT'
      );
    });

    it('PSBT with invalid number of globalXpub', function () {
      const psbt = testutil.constructPsbt([], [], network, rootWalletKeys, 'unsigned');
      const globalXpub: GlobalXpub[] = [
        {
          extendedPubkey: bs58check.decode(rootWalletKeys.triple[0].neutered().toBase58()),
          masterFingerprint: rootWalletKeys.triple[0].fingerprint,
          path: 'm',
        },
      ];
      psbt.updateGlobal({ globalXpub });
      assert.throws(
        () => getTotalAmountOfInternalOutputs(psbt),
        (e: any) => e.message === 'Invalid globalXpubs in PSBT. Expected 3 or none. Got 1'
      );
    });

    it('PSBT without input scriptPubKey', function () {
      const psbt = testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(value) }],
        [
          {
            address: externalAddress,
            value: BigInt(value - fee),
          },
        ],
        network,
        rootWalletKeys,
        'unsigned'
      );
      psbt.data.inputs[0].witnessUtxo = undefined;
      addXpubsToPsbt(psbt, rootWalletKeys);
      assert.throws(
        () => getTotalAmountOfInternalOutputs(psbt),
        (e: any) => e.message === 'Input scriptPubKey can not be found'
      );
    });

    it('PSBT without input Bip32Derivation', function () {
      const psbt = testutil.constructPsbt(
        [{ scriptType: 'p2wsh', value: BigInt(value) }],
        [
          {
            address: externalAddress,
            value: BigInt(value - fee),
          },
        ],
        network,
        rootWalletKeys,
        'unsigned'
      );
      psbt.data.inputs[0].bip32Derivation = undefined;
      addXpubsToPsbt(psbt, rootWalletKeys);
      assert.throws(
        () => getTotalAmountOfInternalOutputs(psbt),
        (e: any) => e.message === 'Input Bip32Derivation can not be found'
      );
    });
  });
});
