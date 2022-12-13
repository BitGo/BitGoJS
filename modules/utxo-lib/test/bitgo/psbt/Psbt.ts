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
  WalletUnspent,
  UtxoTransactionBuilder,
  scriptTypeForChain,
  UtxoPsbt,
  parseSignatureScript2Of3,
} from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../testutil';
import { mockWalletUnspent } from '../wallet/util';
import { defaultTestOutputAmount } from '../../transaction_util';
import { toWalletPsbt, signWalletPsbt } from '../../../src/bitgo/wallet/Psbt';

const CHANGE_INDEX = 100;
const FEE = BigInt(100);

type InputType = outputScripts.ScriptType2Of3 | 'p2shP2pk';
type SignatureTargetType = 'unsigned' | 'halfsigned' | 'fullsigned';

describe('Psbt from transaction using wallet unspents', function () {
  const network = networks.bitcoin;
  const rootWalletKeys = getDefaultWalletKeys();

  function signTxBuilder<TNumber extends number | bigint>(
    txb: UtxoTransactionBuilder<TNumber, UtxoTransaction<TNumber>>,
    unspents: Unspent<TNumber>[],
    signer: string,
    cosigner: string,
    signatureTarget: SignatureTargetType
  ) {
    let walletUnspentSigners: WalletUnspentSigner<RootWalletKeys>[] = [];

    if (signatureTarget === 'halfsigned') {
      walletUnspentSigners = [
        WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signer], rootWalletKeys[cosigner]),
      ];
    } else if (signatureTarget === 'fullsigned') {
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

    return signatureTarget === 'fullsigned' ? txb.build() : txb.buildIncomplete();
  }

  function verifyHalfSignedSignature(
    tx: UtxoTransaction<bigint>,
    psbt: UtxoPsbt<UtxoTransaction<bigint>>,
    unspents: WalletUnspent<bigint>[]
  ) {
    unspents.forEach((u, i) => {
      if (isWalletUnspent(u)) {
        const txScript = parseSignatureScript2Of3(tx.ins[i]);

        let psbtSigs: Buffer[] | undefined;
        if (psbt.data.inputs[i].tapScriptSig) {
          psbtSigs = psbt.data.inputs[i].tapScriptSig?.map((sig) => sig.signature);
        } else if (psbt.data.inputs[i].partialSig) {
          psbtSigs = psbt.data.inputs[i].partialSig?.map((sig) => sig.signature);
        } else {
          assert.fail(`missing half signed signatures in psbt for ${u.id}`);
        }

        assert.deepStrictEqual(
          psbtSigs && psbtSigs.length === 1,
          true,
          `Invalid half signed signatures count in psbt for ${u.id}`
        );

        const psbtSig = (psbtSigs as Buffer[])[0];
        const sigMatched = txScript.signatures.some((txSig) => Buffer.isBuffer(txSig) && txSig.equals(psbtSig));
        assert.deepStrictEqual(sigMatched, true);
      } else {
        throw new Error(`invalid input type at ${i}`);
      }
    });
  }

  function constructTransactionUsingTxBuilder<TNumber extends number | bigint>(
    unspents: Unspent<TNumber>[],
    signer: string,
    cosigner: string,
    amountType: 'number' | 'bigint' = 'number',
    outputType: outputScripts.ScriptType2Of3,
    signatureTarget: SignatureTargetType
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

    return signTxBuilder<TNumber>(txb, unspents, signer, cosigner, signatureTarget);
  }

  function constructPsbtUsingTransactionAndSign(
    tx: UtxoTransaction<bigint>,
    unspents: WalletUnspent<bigint>[],
    signer: KeyName,
    cosigner: KeyName,
    signatureTarget: SignatureTargetType
  ) {
    // converted psbt is signed as per signatureTarget
    const psbt = toWalletPsbt(tx, unspents, rootWalletKeys);
    if (signatureTarget === 'fullsigned') {
      return psbt;
    }

    if (signatureTarget === 'halfsigned') {
      verifyHalfSignedSignature(tx, psbt, unspents);
    }

    // Now signing to make it fully signed psbt.
    // So it will be easy to verify its validity with another similar tx to be built with tx builder.
    unspents.forEach((u, i) => {
      if (isWalletUnspent(u)) {
        try {
          if (signatureTarget === 'unsigned') {
            signWalletPsbt(psbt, i, rootWalletKeys[signer], u);
          }
          signWalletPsbt(psbt, i, rootWalletKeys[cosigner], u);

          // unsigned p2tr does not contain tapLeafScript & tapBip32Derivation.
          // So it's signing is expected to fail
          assert.deepStrictEqual(
            signatureTarget === 'unsigned' && scriptTypeForChain(u.chain) === 'p2tr',
            false,
            'unsigned p2tr sign should fail'
          );
        } catch (err) {
          if (err.message === 'unsigned p2tr sign should fail') {
            throw err;
          }
          assert.deepStrictEqual(signatureTarget, 'unsigned');
          assert.deepStrictEqual(scriptTypeForChain(u.chain), 'p2tr');
          assert.deepStrictEqual(psbt.data.inputs[i].tapLeafScript, undefined);
          assert.deepStrictEqual(psbt.data.inputs[i].tapBip32Derivation, undefined);
          assert.deepStrictEqual(psbt.data.inputs[i].tapScriptSig, undefined);
          assert.ok(psbt.data.inputs[i].witnessUtxo);
        }
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
    signatureTarget,
  }: {
    inputScriptTypes: InputType[];
    outputScriptType: outputScripts.ScriptType2Of3;
    signer: KeyName;
    cosigner: KeyName;
    amountType: 'number' | 'bigint';
    testOutputAmount: TNumber;
    signatureTarget: SignatureTargetType;
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
    it(`can be signed [inputs=${inputScriptTypes} signer=${signer} cosigner=${cosigner} amountType=${amountType} signatureTarget=${signatureTarget}]`, function () {
      const tx = constructTransactionUsingTxBuilder(
        unspents,
        signer,
        cosigner,
        amountType,
        outputScriptType,
        signatureTarget
      );

      const txBigInt = tx.clone<bigint>('bigint');
      const unspentsBigInt = unspents.map((u) => {
        if (isWalletUnspent(u)) {
          return { ...u, value: BigInt(u.value) };
        } else {
          throw new Error(`invalid unspent`);
        }
      });

      const psbt = constructPsbtUsingTransactionAndSign(txBigInt, unspentsBigInt, signer, cosigner, signatureTarget);

      // unsigned p2tr does not contain tapLeafScript & tapBip32Derivation.
      // So it's signature validation is expected to fail
      const containsP2trInput = inputScriptTypes.includes('p2tr');
      if (signatureTarget === 'unsigned' && containsP2trInput) {
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

  function getSignerPairs(containsTaprootInput: boolean): [signer: KeyName, cosigner: KeyName][] {
    const signaturePairs = [['user', 'bitgo'] as [signer: KeyName, cosigner: KeyName]];
    if (containsTaprootInput) {
      signaturePairs.push(['user', 'backup'] as [signer: KeyName, cosigner: KeyName]);
    }
    return signaturePairs;
  }

  (['unsigned', 'halfsigned', 'fullsigned'] as SignatureTargetType[]).forEach((signatureTarget) => {
    getInputScripts().forEach((inputScriptTypes) => {
      getSignerPairs(inputScriptTypes.includes('p2tr')).forEach(([signer, cosigner]) => {
        runTestSignUnspents({
          inputScriptTypes,
          outputScriptType: 'p2sh',
          signer,
          cosigner,
          amountType: 'number',
          testOutputAmount: defaultTestOutputAmount,
          signatureTarget,
        });
        runTestSignUnspents<bigint>({
          inputScriptTypes,
          outputScriptType: 'p2sh',
          signer,
          cosigner,
          amountType: 'bigint',
          testOutputAmount: BigInt('10000000000000000'),
          signatureTarget,
        });
      });
    });
  });
});
