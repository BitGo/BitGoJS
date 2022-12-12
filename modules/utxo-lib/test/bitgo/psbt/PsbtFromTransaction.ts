import * as assert from 'assert';

import { networks } from '../../../src';
import {
  isWalletUnspent,
  Unspent,
  createTransactionBuilderForNetwork,
  getInternalChainCode,
  getExternalChainCode,
  addToTransactionBuilder,
  signInputWithUnspent,
  WalletUnspentSigner,
  RootWalletKeys,
  outputScripts,
  unspentSum,
  getWalletAddress,
  toTNumber,
  UtxoTransaction,
  KeyName,
  createPsbtFromTransactionWithWalletUnspents,
  signPsbtInputWithWalletUnspent,
  WalletUnspent,
  UtxoTransactionBuilder,
} from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../testutil';
import { mockWalletUnspent } from '../wallet/util';
import { ScriptType2Of3 } from '../../../src/bitgo/outputScripts';
import { defaultTestOutputAmount } from '../../transaction_util';

const CHANGE_INDEX = 100;
const FEE = BigInt(100);

type InputType = outputScripts.ScriptType2Of3 | 'p2shP2pk';
type SignatureStatusType = 'unsigned' | 'halfsigned' | 'fullsigned';

describe('Psbt from transaction using wallet unspents', function () {
  const network = networks.bitcoin;
  const rootWalletKeys = getDefaultWalletKeys();

  function getMockedWalletUnspent(scriptTypes2Of3: ScriptType2Of3) {
    const unspent = mockWalletUnspent<bigint>(network, BigInt('10000000000000000'), {
      keys: rootWalletKeys,
      chain: getExternalChainCode(scriptTypes2Of3),
      vout: 0,
    });
    return [unspent];
  }

  it('fails for missing required keyNames for input unsigned Tx and metadataRequired=true', function () {
    const unspents = getMockedWalletUnspent(outputScripts.scriptTypes2Of3[0]);
    const tx = constructTransactionUsingTxBuilder(
      unspents,
      'user',
      'bitgo',
      'bigint',
      outputScripts.scriptTypes2Of3[0],
      'unsigned'
    );

    assert.throws(
      () => createPsbtFromTransactionWithWalletUnspents(tx, unspents, rootWalletKeys, undefined, true),
      (e) => e.message === 'keyNames are required for unsigned PSBT when metadataRequired is true'
    );
  });

  (['unsigned', 'halfsigned', 'fullsigned'] as SignatureStatusType[]).forEach((signatureStatus) => {
    const metadataRequired = signatureStatus === 'unsigned';
    it(`fails for missing required rootWalletKeys for signatureStatus=${signatureStatus} with metadataRequired=${metadataRequired}`, function () {
      const unspents = getMockedWalletUnspent(outputScripts.scriptTypes2Of3[0]);
      const tx = constructTransactionUsingTxBuilder(
        unspents,
        'user',
        'bitgo',
        'bigint',
        outputScripts.scriptTypes2Of3[0],
        signatureStatus
      );
      const keyNames = { signer: 'user' as KeyName, cosigner: 'bitgo' as KeyName };
      assert.throws(
        () => createPsbtFromTransactionWithWalletUnspents(tx, unspents, undefined, keyNames, metadataRequired),
        (e) =>
          e.message ===
          'rootWalletKeys is required for unsigned tx with metadataRequired=true and partially/fully signed tx'
      );
    });
  });

  function signTxBuilder<TNumber extends number | bigint>(
    txb: UtxoTransactionBuilder<TNumber, UtxoTransaction<TNumber>>,
    unspents: Unspent<TNumber>[],
    signer: string,
    cosigner: string,
    signatureStatus: SignatureStatusType
  ) {
    let walletUnspentSigners: WalletUnspentSigner<RootWalletKeys>[] = [];

    if (signatureStatus === 'halfsigned') {
      walletUnspentSigners = [
        WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signer], rootWalletKeys[cosigner]),
      ];
    } else if (signatureStatus === 'fullsigned') {
      walletUnspentSigners = [
        WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signer], rootWalletKeys[cosigner]),
        WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[cosigner], rootWalletKeys[signer]),
      ];
    }

    walletUnspentSigners.forEach((walletSigner, nSignature) => {
      unspents.forEach((u, i) => {
        if (isWalletUnspent(u)) {
          signInputWithUnspent(txb, i, u, walletSigner);
        } else {
          throw new Error(`unexpected unspent ${u.id}`);
        }
      });
    });

    return signatureStatus === 'fullsigned' ? txb.build() : txb.buildIncomplete();
  }

  function constructTransactionUsingTxBuilder<TNumber extends number | bigint>(
    unspents: Unspent<TNumber>[],
    signer: string,
    cosigner: string,
    amountType: 'number' | 'bigint' = 'number',
    outputType: outputScripts.ScriptType2Of3,
    signatureStatus: SignatureStatusType
  ) {
    const txb = createTransactionBuilderForNetwork<TNumber>(network);
    const total = BigInt(unspentSum<TNumber>(unspents, amountType));
    // Kinda weird, treating entire value as change, but tests the relevant paths
    txb.addOutput(
      getWalletAddress(rootWalletKeys, getInternalChainCode(outputType), CHANGE_INDEX, network),
      toTNumber<TNumber>(total - FEE, amountType)
    );
    unspents.forEach((u) => {
      addToTransactionBuilder(txb, u);
    });

    return signTxBuilder<TNumber>(txb, unspents, signer, cosigner, signatureStatus);
  }

  function constructPsbtUsingTransaction(
    tx: UtxoTransaction<bigint>,
    unspents: WalletUnspent<bigint>[],
    signer: KeyName,
    cosigner: KeyName,
    txSignatureStatus: SignatureStatusType,
    metadataRequired?: boolean
  ) {
    const keyNames = { signer, cosigner };
    const psbt = createPsbtFromTransactionWithWalletUnspents(tx, unspents, rootWalletKeys, keyNames, metadataRequired);
    if ((txSignatureStatus === 'unsigned' && !metadataRequired) || txSignatureStatus === 'fullsigned') {
      return psbt;
    }

    unspents.forEach((u, i) => {
      if (isWalletUnspent(u)) {
        if (txSignatureStatus === 'unsigned') {
          signPsbtInputWithWalletUnspent(psbt, i, rootWalletKeys[signer], u);
        }
        signPsbtInputWithWalletUnspent(psbt, i, rootWalletKeys[cosigner], u);
      } else {
        throw new Error(`invalid unspent`);
      }
    });

    return psbt;
  }

  function runTestSignUnspents<TNumber extends number | bigint>({
    inputScriptTypes,
    outputScriptType,
    signer,
    cosigner,
    amountType,
    testOutputAmount,
    signatureStatus,
    metadataRequired,
  }: {
    inputScriptTypes: InputType[];
    outputScriptType: outputScripts.ScriptType2Of3;
    signer: KeyName;
    cosigner: KeyName;
    amountType: 'number' | 'bigint';
    testOutputAmount: TNumber;
    signatureStatus: SignatureStatusType;
    metadataRequired?: boolean;
  }) {
    const unspents = inputScriptTypes.map((t, i): Unspent<TNumber> => {
      if (outputScripts.isScriptType2Of3(t)) {
        return mockWalletUnspent(network, testOutputAmount, {
          keys: rootWalletKeys,
          chain: getExternalChainCode(t),
          vout: i,
        });
      }

      throw new Error(`invalid input type ${t}`);
    });
    it(`can be signed [inputs=${inputScriptTypes} signer=${signer} cosigner=${cosigner} amountType=${amountType} signatureStatus=${signatureStatus} metadataRequired=${metadataRequired}]`, function () {
      const tx = constructTransactionUsingTxBuilder(
        unspents,
        signer,
        cosigner,
        amountType,
        outputScriptType,
        signatureStatus
      );

      const txBigInt = tx.clone<bigint>('bigint');
      const unspentsBigInt = unspents.map((u) => {
        if (isWalletUnspent(u)) {
          return { ...u, value: BigInt(u.value) };
        } else {
          throw new Error(`invalid unspent`);
        }
      });

      const psbt = constructPsbtUsingTransaction(
        txBigInt,
        unspentsBigInt,
        signer,
        cosigner,
        signatureStatus,
        metadataRequired
      );

      if (signatureStatus === 'unsigned' && !metadataRequired) {
        assert.throws(
          () => psbt.validateSignaturesOfAllInputs(),
          (e) => e.message === 'No signatures to validate'
        );
      } else {
        assert.deepStrictEqual(psbt.validateSignaturesOfAllInputs(), true);
        psbt.finalizeAllInputs();
        const txFromPsbt = psbt.extractTransaction();

        const txFromTxBuilder = constructTransactionUsingTxBuilder(
          unspents,
          signer,
          cosigner,
          amountType,
          outputScriptType,
          'fullsigned'
        );

        assert.deepStrictEqual(txFromPsbt.getHash(), txFromTxBuilder.getHash());
      }
    });
  }

  function getInputScripts(): InputType[][] {
    return outputScripts.scriptTypes2Of3.flatMap((t) => {
      return outputScripts.scriptTypes2Of3.flatMap((lastType) => {
        return [[t, t, lastType]];
      });
    });
  }

  function getSignerPairs(): [signer: KeyName, cosigner: KeyName][] {
    return [['user', 'bitgo']];
  }

  (['unsigned', 'halfsigned', 'fullsigned'] as SignatureStatusType[]).forEach((signatureStatus) => {
    getInputScripts().forEach((inputScriptTypes) => {
      getSignerPairs().forEach(([signer, cosigner]) => {
        runTestSignUnspents({
          inputScriptTypes,
          outputScriptType: 'p2sh',
          signer,
          cosigner,
          amountType: 'number',
          testOutputAmount: defaultTestOutputAmount,
          signatureStatus,
        });
        runTestSignUnspents<bigint>({
          inputScriptTypes,
          outputScriptType: 'p2sh',
          signer,
          cosigner,
          amountType: 'bigint',
          testOutputAmount: BigInt('10000000000000000'),
          signatureStatus,
        });
        if (signatureStatus === 'unsigned') {
          runTestSignUnspents<bigint>({
            inputScriptTypes,
            outputScriptType: 'p2sh',
            signer,
            cosigner,
            amountType: 'bigint',
            testOutputAmount: BigInt('10000000000000000'),
            signatureStatus,
            metadataRequired: true,
          });
        }
      });
    });
  });
});
