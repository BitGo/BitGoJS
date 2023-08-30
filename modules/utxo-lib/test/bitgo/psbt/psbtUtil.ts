import {
  addToTransactionBuilder,
  getLeafVersion,
  calculateScriptPathLevel,
  createTransactionBuilderForNetwork,
  getInternalChainCode,
  getWalletAddress,
  isPlaceholderSignature,
  isValidControlBock,
  isWalletUnspent,
  outputScripts,
  ParsedSignatureScriptP2ms,
  ParsedSignatureScriptTaproot,
  ParsedSignatureScriptTaprootScriptPath,
  parseSignatureScript2Of3,
  RootWalletKeys,
  scriptTypeForChain,
  signInputWithUnspent,
  toTNumber,
  Unspent,
  unspentSum,
  UtxoPsbt,
  UtxoTransaction,
  UtxoTransactionBuilder,
  WalletUnspent,
  WalletUnspentSigner,
  KeyName,
  ParsedPsbtP2ms,
  ParsedPsbtTaproot,
} from '../../../src/bitgo';
import { parsePsbtInput, signWalletPsbt } from '../../../src/bitgo/wallet/Psbt';
import * as assert from 'assert';
import { SignatureTargetType } from './Psbt';
import { Network } from '../../../src';

function validateScript(
  psbtParsed: ParsedPsbtP2ms | ParsedPsbtTaproot,
  txParsed: ParsedSignatureScriptP2ms | ParsedSignatureScriptTaproot | undefined
) {
  if (txParsed === undefined) {
    assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.pubScript), true);

    if (psbtParsed.scriptType === 'p2sh') {
      assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.redeemScript), true);
      assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.witnessScript), false);
    } else if (psbtParsed.scriptType === 'p2wsh') {
      assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.redeemScript), false);
      assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.witnessScript), true);
    } else if (psbtParsed.scriptType === 'p2shP2wsh') {
      assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.redeemScript), true);
      assert.deepStrictEqual(Buffer.isBuffer(psbtParsed.witnessScript), true);
    } else if (psbtParsed.scriptType === 'taprootScriptPathSpend') {
      assert.deepStrictEqual(isValidControlBock(psbtParsed.controlBlock), true);
      assert.deepStrictEqual(psbtParsed.scriptPathLevel, calculateScriptPathLevel(psbtParsed.controlBlock));
      assert.deepStrictEqual(psbtParsed.leafVersion, getLeafVersion(psbtParsed.controlBlock));
    }
  } else {
    assert.ok(txParsed.scriptType !== 'taprootKeyPathSpend');
    assert.deepStrictEqual(txParsed.scriptType, psbtParsed.scriptType);
    assert.deepStrictEqual(txParsed.pubScript, psbtParsed.pubScript);

    if (
      (txParsed.scriptType === 'p2sh' && psbtParsed.scriptType === 'p2sh') ||
      (txParsed.scriptType === 'p2wsh' && psbtParsed.scriptType === 'p2wsh') ||
      (txParsed.scriptType === 'p2shP2wsh' && psbtParsed.scriptType === 'p2shP2wsh')
    ) {
      assert.deepStrictEqual(txParsed.redeemScript, psbtParsed.redeemScript);
      assert.deepStrictEqual(txParsed.witnessScript, psbtParsed.witnessScript);
    } else if (txParsed.scriptType === 'taprootScriptPathSpend' && psbtParsed.scriptType === 'taprootScriptPathSpend') {
      // To ensure script path p2tr
      assert.deepStrictEqual(txParsed.publicKeys, psbtParsed.publicKeys);
      const txParsedP2trScriptPath = txParsed as ParsedSignatureScriptTaprootScriptPath;
      assert.deepStrictEqual(txParsedP2trScriptPath.controlBlock, psbtParsed.controlBlock);
      assert.deepStrictEqual(txParsedP2trScriptPath.scriptPathLevel, psbtParsed.scriptPathLevel);
      assert.deepStrictEqual(txParsedP2trScriptPath.leafVersion, psbtParsed.leafVersion);
    }
  }
}

function validatePublicKeys(
  psbtParsed: ParsedPsbtP2ms | ParsedPsbtTaproot,
  txParsed: ParsedSignatureScriptP2ms | ParsedSignatureScriptTaproot | undefined
) {
  if (txParsed === undefined) {
    assert.deepStrictEqual(psbtParsed.publicKeys.length, 3);
    psbtParsed.publicKeys.forEach((publicKey) => {
      assert.deepStrictEqual(Buffer.isBuffer(publicKey), true);
    });
  } else {
    assert.ok(txParsed.scriptType !== 'taprootKeyPathSpend');
    assert.deepStrictEqual(txParsed.publicKeys.length, psbtParsed.publicKeys?.length);
    const pubKeyMatch = txParsed.publicKeys.every((txPubKey) =>
      psbtParsed.publicKeys?.some((psbtPubKey) => psbtPubKey.equals(txPubKey))
    );
    assert.deepStrictEqual(pubKeyMatch, true);
  }
}

function validateSignature(
  psbtParsed: ParsedPsbtP2ms | ParsedPsbtTaproot,
  txParsed: ParsedSignatureScriptP2ms | ParsedSignatureScriptTaproot | undefined
) {
  if (txParsed === undefined) {
    assert.deepStrictEqual(psbtParsed.signatures, undefined);
  } else {
    const txSignatures = txParsed.signatures.filter(
      (txSig) => Buffer.isBuffer(txSig) && !isPlaceholderSignature(txSig)
    );
    assert.deepStrictEqual(txSignatures.length, psbtParsed.signatures?.length);
    if (txSignatures.length < 1) {
      return;
    }
    const sigMatch = txSignatures.every((txSig) =>
      Buffer.isBuffer(txSig) ? psbtParsed.signatures?.some((psbtSig) => psbtSig.equals(txSig)) : true
    );
    assert.deepStrictEqual(sigMatch, true);
  }
}

export function validatePsbtParsing(
  tx: UtxoTransaction<bigint>,
  psbt: UtxoPsbt,
  unspents: WalletUnspent<bigint>[],
  signatureTarget: SignatureTargetType
): void {
  unspents.forEach((u, i) => {
    if (!isWalletUnspent(u)) {
      return;
    }
    const scriptType = scriptTypeForChain(u.chain);

    if (signatureTarget === 'unsigned') {
      if (scriptType === 'p2tr') {
        assert.throws(
          () => parsePsbtInput(psbt.data.inputs[i]),
          (e: any) => e.message === 'could not parse input'
        );
      } else {
        const psbtParsed = parsePsbtInput(psbt.data.inputs[i]);
        assert.deepStrictEqual(psbtParsed.scriptType, scriptType);
        validateScript(psbtParsed, undefined);
        validatePublicKeys(psbtParsed, undefined);
        validateSignature(psbtParsed, undefined);
      }
    } else {
      const psbtParsed = parsePsbtInput(psbt.data.inputs[i]);
      assert.strictEqual(psbtParsed.scriptType, scriptType === 'p2tr' ? 'taprootScriptPathSpend' : scriptType);
      assert.ok(psbtParsed.scriptType !== 'p2shP2pk');
      const txParsed = parseSignatureScript2Of3(tx.ins[i]);
      validateScript(psbtParsed, txParsed);
      validatePublicKeys(psbtParsed, txParsed);
      validateSignature(psbtParsed, txParsed);
    }
  });
}

export function assertEqualTransactions<TNumber extends number | bigint>(
  txOne: UtxoTransaction<TNumber>,
  txTwo: UtxoTransaction<TNumber>
): void {
  assert.ok(txOne.network === txTwo.network);
  assert.ok(txOne.getId() === txTwo.getId());
  assert.ok(txOne.toHex() === txTwo.toHex());
  assert.ok(txOne.virtualSize() === txTwo.virtualSize());
  assert.ok(txOne.locktime === txTwo.locktime);
  assert.ok(txOne.version === txTwo.version);
  assert.ok(txOne.weight() === txTwo.weight());

  assert.ok(txOne.ins.length === txTwo.ins.length);
  assert.ok(txOne.outs.length === txTwo.outs.length);
  txOne.ins.forEach((_, i) => {
    const parsedInputOne = parseSignatureScript2Of3(txOne.ins[i]);
    const parsedInputTwo = parseSignatureScript2Of3(txTwo.ins[i]);
    assert.deepStrictEqual(parsedInputOne, parsedInputTwo);
  });
  txOne.outs.forEach((_, i) => {
    assert.deepStrictEqual(txOne.outs[i], txTwo.outs[i]);
  });
  assert.ok(txOne.toBuffer().equals(txTwo.toBuffer()));
}

export function toBigInt<TNumber extends number | bigint>(unspents: Unspent<TNumber>[]): WalletUnspent<bigint>[] {
  return unspents.map((u) => {
    if (isWalletUnspent(u)) {
      return { ...u, value: BigInt(u.value) };
    }
    throw new Error('invalid unspent');
  });
}

export function signPsbt(
  psbt: UtxoPsbt,
  unspents: Unspent<bigint>[],
  rootWalletKeys: RootWalletKeys,
  signer: string,
  cosigner: string,
  signatureTarget: SignatureTargetType
): void {
  unspents.forEach((u, i) => {
    if (!isWalletUnspent(u)) {
      throw new Error('invalid unspent');
    }
    try {
      if (signatureTarget === 'unsigned') {
        signWalletPsbt(psbt, i, rootWalletKeys[signer], u);
      }
      signWalletPsbt(psbt, i, rootWalletKeys[cosigner], u);
    } catch (err) {
      assert.deepStrictEqual(signatureTarget, 'unsigned');
      assert.deepStrictEqual(scriptTypeForChain(u.chain), 'p2tr');
      assert.deepStrictEqual(psbt.data.inputs[i].tapLeafScript, undefined);
      assert.deepStrictEqual(psbt.data.inputs[i].tapBip32Derivation, undefined);
      assert.deepStrictEqual(psbt.data.inputs[i].tapScriptSig, undefined);
      assert.ok(psbt.data.inputs[i].witnessUtxo);
    }
  });
}

export function signTxBuilder<TNumber extends number | bigint>(
  txb: UtxoTransactionBuilder<TNumber, UtxoTransaction<TNumber>>,
  unspents: Unspent<TNumber>[],
  rootWalletKeys: RootWalletKeys,
  signer: string,
  cosigner: string,
  signatureTarget: SignatureTargetType
): UtxoTransaction<TNumber> {
  let walletUnspentSigners: WalletUnspentSigner<RootWalletKeys>[] = [];

  if (signatureTarget === 'halfsigned') {
    walletUnspentSigners = [WalletUnspentSigner.from(rootWalletKeys, rootWalletKeys[signer], rootWalletKeys[cosigner])];
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

export function constructTransactionUsingTxBuilder<TNumber extends number | bigint>(
  unspents: Unspent<TNumber>[],
  rootWalletKeys: RootWalletKeys,
  params: {
    signer: KeyName;
    cosigner: KeyName;
    amountType: 'number' | 'bigint';
    outputType: outputScripts.ScriptType2Of3;
    signatureTarget: SignatureTargetType;
    network: Network;
    changeIndex: number;
    fee: bigint;
  }
): UtxoTransaction<bigint> {
  const txb = createTransactionBuilderForNetwork<TNumber>(params.network);
  const total = BigInt(unspentSum<TNumber>(unspents, params.amountType));
  // Kinda weird, treating entire value as change, but tests the relevant paths
  txb.addOutput(
    getWalletAddress(rootWalletKeys, getInternalChainCode(params.outputType), params.changeIndex, params.network),
    toTNumber<TNumber>(total - params.fee, params.amountType)
  );
  unspents.forEach((u) => {
    addToTransactionBuilder(txb, u);
  });

  return signTxBuilder<TNumber>(
    txb,
    unspents,
    rootWalletKeys,
    params.signer,
    params.cosigner,
    params.signatureTarget
  ).clone<bigint>('bigint');
}
