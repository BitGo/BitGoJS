import * as assert from 'assert';

import { Transaction, networks } from '../../../src';
import {
  isWalletUnspent,
  isUnspentWithPrevTx,
  formatOutputId,
  getOutputIdForInput,
  parseOutputId,
  TxOutPoint,
  Unspent,
  createTransactionBuilderForNetwork,
  getInternalChainCode,
  getExternalChainCode,
  addToTransactionBuilder,
  signInputWithUnspent,
  WalletUnspentSigner,
  outputScripts,
  unspentSum,
  getWalletAddress,
  verifySignatureWithUnspent,
  toTNumber,
  WalletUnspent,
  UtxoTransaction,
  createPsbtForNetwork,
  createPsbtFromTransaction,
  addWalletUnspentToPsbt,
  addWalletOutputToPsbt,
  toPrevOutput,
  KeyName,
  signInputP2shP2pk,
  UnspentWithPrevTx,
} from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../testutil';
import {
  isReplayProtectionUnspent,
  mockReplayProtectionUnspent,
  mockWalletUnspent,
  replayProtectionKeyPair,
} from './util';
import { defaultTestOutputAmount } from '../../transaction_util';

const CHANGE_INDEX = 100;
const FEE = BigInt(100);

type InputType = outputScripts.ScriptType2Of3 | 'p2shP2pk';

describe('WalletUnspent', function () {
  const network = networks.bitcoin;
  const walletKeys = getDefaultWalletKeys();
  const hash = Buffer.alloc(32).fill(0xff);
  hash[0] = 0; // show endianness
  const input = { hash, index: 0 };
  const expectedOutPoint: TxOutPoint = {
    txid: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00',
    vout: 0,
  };

  it('parses and formats txid', function () {
    assert.deepStrictEqual(getOutputIdForInput(input), expectedOutPoint);
    assert.deepStrictEqual(
      formatOutputId(expectedOutPoint),
      'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00:0'
    );
    assert.deepStrictEqual(parseOutputId(formatOutputId(expectedOutPoint)), expectedOutPoint);
  });

  it('identifies wallet unspents', function () {
    const unspent: Unspent = {
      id: formatOutputId(expectedOutPoint),
      address: getWalletAddress(walletKeys, 0, 0, network),
      value: 1e8,
    };
    assert.strictEqual(isWalletUnspent(unspent), false);
    assert.strictEqual(isWalletUnspent({ ...unspent, chain: 0, index: 0 } as Unspent), true);
  });

  function constructAndSignTransactionUsingPsbt(
    unspents: Unspent<bigint>[],
    signer: KeyName,
    cosigner: KeyName,
    outputType: outputScripts.ScriptType2Of3
  ): Transaction<bigint> {
    const psbt = createPsbtForNetwork({ network });
    const total = BigInt(unspentSum<bigint>(unspents, 'bigint'));
    addWalletOutputToPsbt(psbt, walletKeys, getInternalChainCode(outputType), CHANGE_INDEX, total - FEE);

    unspents.forEach((u) => {
      if (isWalletUnspent(u)) {
        addWalletUnspentToPsbt(psbt, u, walletKeys, signer, cosigner, network);
      } else {
        throw new Error(`invalid unspent`);
      }
    });

    // TODO: Test rederiving scripts from PSBT and keys only
    psbt.signAllInputsHD(walletKeys[signer]);
    psbt.signAllInputsHD(walletKeys[cosigner]);
    assert(psbt.validateSignaturesOfAllInputs());
    psbt.finalizeAllInputs();
    // extract transaction has a return type of Transaction instead of UtxoTransaction
    const tx = psbt.extractTransaction() as UtxoTransaction<bigint>;

    const psbt2 = createPsbtFromTransaction(
      tx,
      unspents.map((u) => toPrevOutput<bigint>(u, network))
    );
    const nonWitnessUnspents = unspents.filter((u): u is WalletUnspent<bigint> & UnspentWithPrevTx =>
      isUnspentWithPrevTx(u)
    );
    const txBufs = Object.fromEntries(
      psbt2.getNonWitnessPreviousTxids().map((txid) => {
        const u = nonWitnessUnspents.find((u) => parseOutputId(u.id).txid === txid);
        if (u === undefined) throw new Error('No prevtx found');
        return [txid, u.prevTx];
      })
    );
    psbt2.addNonWitnessUtxos(txBufs);
    assert(psbt2.validateSignaturesOfAllInputs());
    return tx;
  }

  function constructAndSignTransactionUsingTransactionBuilder<TNumber extends number | bigint>(
    unspents: Unspent<TNumber>[],
    signer: string,
    cosigner: string,
    amountType: 'number' | 'bigint' = 'number',
    outputType: outputScripts.ScriptType2Of3
  ): UtxoTransaction<TNumber> {
    const txb = createTransactionBuilderForNetwork<TNumber>(network);
    const total = BigInt(unspentSum<TNumber>(unspents, amountType));
    // Kinda weird, treating entire value as change, but tests the relevant paths
    txb.addOutput(
      getWalletAddress(walletKeys, getInternalChainCode(outputType), CHANGE_INDEX, network),
      toTNumber<TNumber>(total - FEE, amountType)
    );
    unspents.forEach((u) => {
      addToTransactionBuilder(txb, u);
    });
    unspents.forEach((u, i) => {
      if (isReplayProtectionUnspent(u, network)) {
        signInputP2shP2pk(txb, i, replayProtectionKeyPair);
      }
    });

    [
      WalletUnspentSigner.from(walletKeys, walletKeys[signer], walletKeys[cosigner]),
      WalletUnspentSigner.from(walletKeys, walletKeys[cosigner], walletKeys[signer]),
    ].forEach((walletSigner, nSignature) => {
      unspents.forEach((u, i) => {
        if (isWalletUnspent(u)) {
          signInputWithUnspent(txb, i, u, walletSigner);
        } else if (isReplayProtectionUnspent(u, network)) {
          return;
        } else {
          throw new Error(`unexpected unspent ${u.id}`);
        }
      });

      const tx = nSignature === 0 ? txb.buildIncomplete() : txb.build();
      // Verify each signature for the unspent
      unspents.forEach((u, i) => {
        if (isReplayProtectionUnspent(u, network)) {
          // signature verification not implemented for replay protection unspents
          return;
        }
        assert.deepStrictEqual(
          verifySignatureWithUnspent(tx, i, unspents, walletKeys),
          walletKeys.triple.map((k) => k === walletKeys[signer] || (nSignature === 1 && k === walletKeys[cosigner]))
        );
      });
    });

    return txb.build();
  }

  function runTestSignUnspents<TNumber extends number | bigint>({
    inputScriptTypes,
    outputScriptType,
    signer,
    cosigner,
    amountType,
    testOutputAmount,
  }: {
    inputScriptTypes: InputType[];
    outputScriptType: outputScripts.ScriptType2Of3;
    signer: KeyName;
    cosigner: KeyName;
    amountType: 'number' | 'bigint';
    testOutputAmount: TNumber;
  }) {
    it(`can be signed [inputs=${inputScriptTypes} signer=${signer} cosigner=${cosigner} amountType=${amountType}]`, function () {
      const unspents = inputScriptTypes.map((t, i): Unspent<TNumber> => {
        if (outputScripts.isScriptType2Of3(t)) {
          return mockWalletUnspent(network, testOutputAmount, {
            keys: walletKeys,
            chain: getExternalChainCode(t),
            vout: i,
          });
        }

        if (t === 'p2shP2pk') {
          return mockReplayProtectionUnspent(network, toTNumber(1_000, amountType));
        }

        throw new Error(`invalid input type ${t}`);
      });

      const txbTransaction = constructAndSignTransactionUsingTransactionBuilder(
        unspents,
        signer,
        cosigner,
        amountType,
        outputScriptType
      );
      if (amountType === 'bigint') {
        if (inputScriptTypes.includes('p2shP2pk')) {
          // FIMXE(BG-47824): add p2shP2pk support for Psbt
          return;
        }
        const psbtTransaction = constructAndSignTransactionUsingPsbt(
          unspents as Unspent<bigint>[],
          signer,
          cosigner,
          outputScriptType
        );
        assert.deepStrictEqual(txbTransaction.toBuffer(), psbtTransaction.toBuffer());
      }
    });
  }

  function getInputScripts(): InputType[][] {
    return outputScripts.scriptTypes2Of3.flatMap((t) => [
      [t, t],
      [t, t, 'p2shP2pk'],
    ]);
  }

  function getSignerPairs(): [signer: KeyName, cosigner: KeyName][] {
    const keyNames: KeyName[] = ['user', 'backup', 'bitgo'];
    return keyNames.flatMap((signer) =>
      keyNames.flatMap((cosigner): [KeyName, KeyName][] => (signer === cosigner ? [] : [[signer, cosigner]]))
    );
  }

  getInputScripts().forEach((inputScriptTypes) => {
    getSignerPairs().forEach(([signer, cosigner]) => {
      runTestSignUnspents({
        inputScriptTypes,
        outputScriptType: 'p2sh',
        signer,
        cosigner,
        amountType: 'number',
        testOutputAmount: defaultTestOutputAmount,
      });
      runTestSignUnspents<bigint>({
        inputScriptTypes,
        outputScriptType: 'p2sh',
        signer,
        cosigner,
        amountType: 'bigint',
        testOutputAmount: BigInt('10000000000000000'),
      });
    });
  });
});
