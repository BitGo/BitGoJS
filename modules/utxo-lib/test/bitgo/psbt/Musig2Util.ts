import * as assert from 'assert';
import { BIP32Interface } from 'bip32';
import { TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { Transaction } from 'bitcoinjs-lib';

import {
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getExternalChainCode,
  getInternalChainCode,
  HDTaprootMusig2Signer,
  HDTaprootSigner,
  isWalletUnspent,
  KeyName,
  Musig2Signer,
  outputScripts,
  parsePsbtInput,
  parseSignatureScript2Of3,
  ProprietaryKeySubtype,
  PSBT_PROPRIETARY_IDENTIFIER,
  RootWalletKeys,
  scriptTypeForChain,
  Tuple,
  Unspent,
  unspentSum,
  UtxoPsbt,
  UtxoTransaction,
  WalletUnspent,
} from '../../../src/bitgo';
import {
  createKeyPathP2trMusig2,
  createPaymentP2trMusig2,
  ScriptType2Of3,
  toXOnlyPublicKey,
} from '../../../src/bitgo/outputScripts';
import { getDefaultWalletKeys, mockWalletUnspent } from '../../../src/testutil';
import { networks } from '../../../src';
import * as musig2 from '../../../src/bitgo/Musig2';
import { musig2DeterministicSign } from '../../../src/bitgo/Musig2';
import { checkForInput } from 'bip174/src/lib/utils';

export const network = networks.bitcoin;
const outputType = 'p2trMusig2';
const CHANGE_INDEX = 100;
const FEE = BigInt(100);
const rootWalletKeys = getDefaultWalletKeys();
const dummyKey1 = rootWalletKeys.deriveForChainAndIndex(50, 200);
const dummyKey2 = rootWalletKeys.deriveForChainAndIndex(60, 201);

export const dummyTapOutputKey = dummyKey1.user.publicKey.subarray(1, 33);
export const dummyTapInternalKey = dummyKey1.bitgo.publicKey.subarray(1, 33);
export const dummyParticipantPubKeys: Tuple<Buffer> = [dummyKey1.user.publicKey, dummyKey1.backup.publicKey];
export const dummyPubNonce = Buffer.concat([dummyKey2.user.publicKey, dummyKey2.bitgo.publicKey]);
export const dummyAggNonce = Buffer.concat([dummyKey2.backup.publicKey, dummyKey2.bitgo.publicKey]);
export const dummyPrivateKey = dummyKey2.user.privateKey!;
export const dummyPartialSig = dummyKey2.backup.privateKey!;

export const invalidTapOutputKey = Buffer.allocUnsafe(1);
export const invalidTapInputKey = Buffer.allocUnsafe(1);
export const invalidTxHash = Buffer.allocUnsafe(1);
export const invalidParticipantPubKeys: Tuple<Buffer> = [Buffer.allocUnsafe(1), Buffer.allocUnsafe(1)];
export const invalidPartialSig = Buffer.allocUnsafe(1);

export function constructPsbt(
  unspents: (Unspent<bigint> & { prevTx?: Buffer })[],
  rootWalletKeys: RootWalletKeys,
  signer: KeyName,
  cosigner: KeyName,
  outputType: outputScripts.ScriptType2Of3
): UtxoPsbt<UtxoTransaction<bigint>> {
  const psbt = createPsbtForNetwork({ network });
  const total = BigInt(unspentSum<bigint>(unspents, 'bigint'));
  addWalletOutputToPsbt(psbt, rootWalletKeys, getInternalChainCode(outputType), CHANGE_INDEX, total - FEE);
  unspents.forEach((u) => {
    if (isWalletUnspent(u)) {
      addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signer, cosigner);
    } else {
      throw new Error(`invalid unspent`);
    }
  });
  return psbt;
}

export function getUnspents(
  inputScriptTypes: ScriptType2Of3[],
  rootWalletKeys: RootWalletKeys
): WalletUnspent<bigint>[] {
  return inputScriptTypes.map((t, i): WalletUnspent<bigint> => {
    if (!outputScripts.isScriptType2Of3(t)) {
      throw new Error(`invalid input type ${t}`);
    }
    const unspent = mockWalletUnspent(network, BigInt('10000000000000000'), {
      keys: rootWalletKeys,
      chain: getExternalChainCode(t),
      vout: i,
    });

    if (isWalletUnspent(unspent)) {
      return unspent;
    }
    throw new Error('Invalid unspent');
  });
}

export function validatePsbtP2trMusig2Input(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  unspent: WalletUnspent<bigint>,
  spendType: 'keyPath' | 'scriptPath'
): void {
  const input = psbt.data.inputs[index];
  assert.strictEqual(input.tapBip32Derivation?.length, 2);
  let leafHashesCount = 0;

  if (spendType === 'keyPath') {
    const inputWalletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
    const { internalPubkey, taptreeRoot } = createKeyPathP2trMusig2(inputWalletKeys.publicKeys);

    assert.ok(!input.tapLeafScript);
    assert.ok(input.tapInternalKey);
    assert.ok(input.tapMerkleRoot);
    assert.ok(input.tapInternalKey.equals(internalPubkey));
    assert.ok(input.tapMerkleRoot.equals(taptreeRoot));
  } else {
    assert.ok(input.tapLeafScript);
    assert.ok(!input.tapInternalKey);
    assert.ok(!input.tapMerkleRoot);
    leafHashesCount = 1;
  }
  input.tapBip32Derivation?.forEach((bv) => {
    assert.strictEqual(bv.leafHashes.length, leafHashesCount);
  });
}

export function validatePsbtP2trMusig2Output(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number): void {
  const outputWalletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode(outputType), CHANGE_INDEX);
  const payment = createPaymentP2trMusig2(outputWalletKeys.publicKeys);
  const output = psbt.data.outputs[index];
  assert.ok(!!payment.internalPubkey);
  assert.ok(!!output.tapInternalKey);
  assert.ok(output.tapInternalKey.equals(payment.internalPubkey));
  assert.strictEqual(output.tapBip32Derivation?.length, 3);
  output.tapBip32Derivation?.forEach((bv) => {
    const leafHashesCount = bv.pubkey.equals(toXOnlyPublicKey(outputWalletKeys.backup.publicKey)) ? 2 : 1;
    assert.strictEqual(bv.leafHashes.length, leafHashesCount);
  });
}

export function validateNoncesKeyVals(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  unspent: WalletUnspent<bigint>
): void {
  const keyVals = psbt.getProprietaryKeyVals(index);
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
  const { outputPubkey } = createKeyPathP2trMusig2(walletKeys.publicKeys);
  const participantPubKeys = [walletKeys.user.publicKey, walletKeys.bitgo.publicKey];

  const nonces = keyVals.filter((kv) => kv.key.subtype === ProprietaryKeySubtype.MUSIG2_PUB_NONCE);
  assert.strictEqual(nonces.length, 2);

  const nonceKeydata = participantPubKeys.map((p) => {
    const keydata = Buffer.alloc(65);
    p.copy(keydata);
    outputPubkey.copy(keydata, 33);
    return keydata;
  });

  nonces.forEach((kv) => {
    assert.strictEqual(kv.key.identifier, PSBT_PROPRIETARY_IDENTIFIER);
    assert.strictEqual(kv.value.length, 66);
    assert.strictEqual(nonceKeydata.filter((kd) => kd.equals(kv.key.keydata)).length, 1);
  });
}

export function validatePartialSigKeyVals(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  unspent: WalletUnspent<bigint>
): void {
  const keyVals = psbt.getProprietaryKeyVals(index);
  const inputWalletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
  const { outputPubkey } = createKeyPathP2trMusig2(inputWalletKeys.publicKeys);
  const participantPubKeys = [inputWalletKeys.user.publicKey, inputWalletKeys.bitgo.publicKey];

  const partialSigs = keyVals.filter((kv) => kv.key.subtype === ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG);
  assert.strictEqual(partialSigs.length, 2);

  const partialSigKeydata = participantPubKeys.map((p) => {
    const keydata = Buffer.alloc(65);
    p.copy(keydata);
    outputPubkey.copy(keydata, 33);
    return keydata;
  });

  partialSigs.forEach((kv) => {
    assert.strictEqual(kv.key.identifier, PSBT_PROPRIETARY_IDENTIFIER);
    assert.strictEqual(kv.value.length, 32);
    assert.strictEqual(partialSigKeydata.filter((kd) => kd.equals(kv.key.keydata)).length, 1);
  });
}

export function validateParticipantsKeyVals(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  unspent: WalletUnspent<bigint>
): void {
  const keyVals = psbt.getProprietaryKeyVals(index);
  const walletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
  const { internalPubkey, outputPubkey } = createKeyPathP2trMusig2(walletKeys.publicKeys);
  const participantPubKeys = [walletKeys.user.publicKey, walletKeys.bitgo.publicKey];

  const participantsKeyVals = keyVals.filter(
    (kv) => kv.key.subtype === ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS
  );
  assert.strictEqual(participantsKeyVals.length, 1);

  const kv = participantsKeyVals[0];
  assert.strictEqual(kv.key.identifier, PSBT_PROPRIETARY_IDENTIFIER);
  assert.ok(Buffer.concat([outputPubkey, internalPubkey]).equals(kv.key.keydata));
  const valueMatch = [Buffer.concat(participantPubKeys), Buffer.concat(participantPubKeys.reverse())].some((pks) => {
    return pks.equals(kv.value);
  });
  assert.ok(valueMatch);
}

export function validateFinalizedInput(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  unspent: WalletUnspent<bigint>,
  spendType?: 'keyPath' | 'scriptPath'
): void {
  assert.ok(psbt.isInputFinalized(index));
  const input = psbt.data.inputs[index];
  if (scriptTypeForChain(unspent.chain) === 'p2trMusig2' && spendType === 'keyPath') {
    assert.strictEqual(input.finalScriptWitness?.length, 66);
  }
  assert.ok(!input.unknownKeyVals?.length);
}

export function validateParsedTaprootKeyPathPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  signature: 'unsigned' | 'halfsigned' | 'fullysigned'
): void {
  const parsed = parsePsbtInput(psbt, 0);
  assert.ok(parsed);
  assert.ok(parsed.scriptType === 'taprootKeyPathSpend');
  assert.strictEqual(parsed.pubScript.length, 34);
  assert.strictEqual(parsed.publicKeys.length, 1);
  assert.strictEqual(parsed.publicKeys[0].length, 32);

  if (signature === 'unsigned') {
    assert.strictEqual(parsed.signatures, undefined);
    assert.strictEqual(parsed.participantPublicKeys, undefined);
  } else {
    const expected = signature === 'halfsigned' ? 1 : 2;
    assert.strictEqual(parsed.signatures?.length, expected);
    parsed.signatures.forEach((sig) => {
      assert.strictEqual(sig.length, 32);
    });
    assert.strictEqual(parsed.participantPublicKeys?.length, expected);
    parsed.participantPublicKeys.forEach((pk) => {
      assert.strictEqual(pk.length, 33);
    });
  }
}

export function validateParsedTaprootScriptPathPsbt(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  index: number,
  signature: 'unsigned' | 'halfsigned' | 'fullysigned'
): void {
  const input = psbt.data.inputs[index];
  const parsed = parsePsbtInput(psbt, 0);
  assert.ok(parsed);
  assert.ok(parsed.scriptType === 'taprootScriptPathSpend');
  assert.ok(input.tapLeafScript);
  assert.ok(parsed.pubScript.equals(input.tapLeafScript[0].script));
  assert.ok(parsed.controlBlock.equals(input.tapLeafScript[0].controlBlock));
  assert.strictEqual(parsed.scriptPathLevel, 1);
  assert.strictEqual(parsed.leafVersion, input.tapLeafScript[0].leafVersion);
  parsed.publicKeys.forEach((pk) => {
    assert.strictEqual(pk.length, 32);
  });
  if (signature === 'unsigned') {
    assert.strictEqual(parsed.signatures, undefined);
  } else {
    const expected = signature === 'halfsigned' ? 1 : 2;
    assert.strictEqual(parsed.signatures?.length, expected);
    parsed.signatures.forEach((sig) => {
      assert.strictEqual(sig.length, 64);
    });
  }
}

export function validateParsedTaprootKeyPathTxInput(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  tx: UtxoTransaction<bigint>
): void {
  const parsedTxInput = parseSignatureScript2Of3(tx.ins[0]);
  assert.ok(parsedTxInput.scriptType === 'taprootKeyPathSpend');
  assert.strictEqual(parsedTxInput.signatures.length, 1);
  assert.strictEqual(parsedTxInput.signatures[0].length, 64);
}

export function validateParsedTaprootScriptPathTxInput(
  psbt: UtxoPsbt<UtxoTransaction<bigint>>,
  tx: UtxoTransaction<bigint>,
  index: number
): void {
  const input = psbt.data.inputs[index];
  const parsedTxInput = parseSignatureScript2Of3(tx.ins[0]);
  assert.ok(parsedTxInput);
  assert.ok(parsedTxInput.scriptType === 'taprootScriptPathSpend');
  assert.ok(input.tapLeafScript);
  assert.ok(parsedTxInput.pubScript.equals(input.tapLeafScript[0].script));
  assert.ok(parsedTxInput.controlBlock.equals(input.tapLeafScript[0].controlBlock));
  assert.strictEqual(parsedTxInput.scriptPathLevel, 1);
  assert.strictEqual(parsedTxInput.leafVersion, input.tapLeafScript[0].leafVersion);
  parsedTxInput.publicKeys.forEach((pk) => {
    assert.strictEqual(pk.length, 32);
  });
  assert.strictEqual(parsedTxInput.signatures?.length, 2);
  parsedTxInput.signatures.forEach((sig) => {
    assert.strictEqual(sig.length, 64);
  });
}

export function getTaprootSigners(
  psbt: UtxoPsbt,
  inputIndex: number,
  keypair: BIP32Interface
): HDTaprootSigner[] | HDTaprootMusig2Signer[] {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  if (!input.tapBip32Derivation || input.tapBip32Derivation.length === 0) {
    throw new Error('Need tapBip32Derivation to sign Taproot with HD');
  }
  const myDerivations = input.tapBip32Derivation
    .map((bipDv) => {
      if (bipDv.masterFingerprint.equals(keypair.fingerprint)) {
        return bipDv;
      }
    })
    .filter((v) => !!v) as TapBip32Derivation[];
  if (myDerivations.length === 0) {
    throw new Error('Need one tapBip32Derivation masterFingerprint to match the HDSigner fingerprint');
  }

  function getDerivedNode(bipDv: TapBip32Derivation): HDTaprootMusig2Signer | HDTaprootSigner {
    const node = keypair.derivePath(bipDv.path);
    if (!bipDv.pubkey.equals(node.publicKey.slice(1))) {
      throw new Error('pubkey did not match tapBip32Derivation');
    }
    return node;
  }

  if (input.tapLeafScript?.length) {
    return myDerivations.map((bipDv) => {
      const signer = getDerivedNode(bipDv);
      if (!('signSchnorr' in signer)) {
        throw new Error('signSchnorr function is required to sign p2tr');
      }
      return signer;
    });
  } else if (input.tapInternalKey?.length) {
    return myDerivations.map((bipDv) => {
      const signer = getDerivedNode(bipDv);
      if (!('privateKey' in signer) || !signer.privateKey) {
        throw new Error('privateKey is required to sign p2tr musig2');
      }
      return signer;
    });
  }
  throw new Error(`taproot input #${inputIndex} failed to get signers`);
}

export function addDeterministicNoncesToPsbt(psbt: UtxoPsbt, keypair: BIP32Interface): UtxoPsbt {
  psbt.data.inputs.forEach((input, inputIndex) => {
    if (!input.tapMerkleRoot || !input.tapInternalKey) {
      return;
    }
    const derivedKey = input.tapBip32Derivation ? UtxoPsbt.deriveKeyPair(keypair, input.tapBip32Derivation) : keypair;
    assert.ok(derivedKey);
    assert.ok(derivedKey.privateKey);

    const participants = musig2.parsePsbtMusig2Participants(psbt, inputIndex);
    assert.ok(participants);
    musig2.assertPsbtMusig2Participants(participants, input.tapInternalKey, input.tapMerkleRoot);
    const { tapOutputKey, participantPubKeys } = participants;
    const participantPubKey = participantPubKeys.find((pubKey) => pubKey.equals(derivedKey.publicKey));

    // If the bitgo pubkey is not within the participants, then this musig2 input doesnt use this key. Skip
    if (!participantPubKey) {
      return;
    }
    assert.ok(participantPubKeys[1].equals(derivedKey.publicKey));

    const { hash } = psbt.getTaprootHashForSig(inputIndex);

    const musigNonces = musig2.parsePsbtMusig2Nonces(psbt, inputIndex);
    assert.ok(musigNonces);
    const userNonce = musigNonces.find((kv) => kv.participantPubKey.equals(participantPubKeys[0]));
    assert.ok(userNonce);

    const pubNonce = musig2.createMusig2DeterministicNonce({
      privateKey: derivedKey.privateKey,
      otherNonce: userNonce.pubNonce,
      publicKeys: participantPubKeys,
      internalPubKey: input.tapInternalKey,
      tapTreeRoot: input.tapMerkleRoot,
      hash,
    });
    const nonce = { tapOutputKey, participantPubKey, pubNonce };
    psbt.addOrUpdateProprietaryKeyValToInput(inputIndex, musig2.encodePsbtMusig2PubNonce(nonce));
  });
  return psbt;
}

/**
 * General flow is copied from UtxoPsbt.signAllInputsHD going into UtxoPsbt.signTaprootMusig2Input.
 *
 * This only adds signatures to musig2 inputs
 * @param psbt
 * @param keypair
 */
export function addDerterministicMusig2SignaturesToPsbt(
  psbt: UtxoPsbt,
  inputIndex: number,
  signer: Musig2Signer,
  sighashTypes: number[] = [Transaction.SIGHASH_DEFAULT, Transaction.SIGHASH_ALL]
): void {
  const input = checkForInput(psbt.data.inputs, inputIndex);

  if (!input.tapBip32Derivation?.length) {
    return;
  }

  if (!input.tapInternalKey || !input.tapMerkleRoot) {
    return;
  }
  assert.ok(input.tapInternalKey);
  assert.ok(input.tapMerkleRoot);

  const participants = musig2.parsePsbtMusig2Participants(psbt, inputIndex);
  assert.ok(participants);
  const { tapOutputKey, participantPubKeys } = participants;
  const signerPubKey = participantPubKeys.find((pubKey) => pubKey.equals(signer.publicKey));
  assert.ok(signerPubKey);
  if (!participantPubKeys[1].equals(signer.publicKey)) {
    return;
  }

  const nonces = musig2.parsePsbtMusig2Nonces(psbt, inputIndex);
  assert.ok(nonces);
  const userNonce = nonces.find((n) => !n.participantPubKey.equals(signerPubKey));
  assert.ok(userNonce);

  const { hash, sighashType } = psbt.getTaprootHashForSig(inputIndex, sighashTypes);

  let partialSig = musig2DeterministicSign({
    privateKey: signer.privateKey,
    otherNonce: userNonce.pubNonce,
    publicKeys: participantPubKeys,
    internalPubKey: input.tapInternalKey,
    tapTreeRoot: input.tapMerkleRoot,
    hash,
  }).sig;

  if (sighashType !== Transaction.SIGHASH_DEFAULT) {
    partialSig = Buffer.concat([partialSig, Buffer.of(sighashType)]);
  }

  const sig = musig2.encodePsbtMusig2PartialSig({
    participantPubKey: signerPubKey,
    tapOutputKey,
    partialSig: partialSig,
  });
  psbt.addProprietaryKeyValToInput(inputIndex, sig);
}
