import * as assert from 'assert';

import {
  addReplayProtectionUnspentToPsbt,
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getExternalChainCode,
  getInternalChainCode,
  isWalletUnspent,
  KeyName,
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
  ChainCode,
} from '../../../src/bitgo';
import {
  createKeyPathP2trMusig2,
  createOutputScriptP2shP2pk,
  createPaymentP2trMusig2,
  ScriptType2Of3,
  toXOnlyPublicKey,
} from '../../../src/bitgo/outputScripts';
import { mockWalletUnspent, replayProtectionKeyPair } from '../../../src/testutil';
import { bip32, networks } from '../../../src';
import { BIP32Interface } from 'bip32';
import { isPsbtInputFinalized } from '../../../src/bitgo/PsbtUtil';

export const network = networks.bitcoin;
const outputType = 'p2trMusig2';
const CHANGE_INDEX = 100;
const FEE = BigInt(100);

const keys = [1, 2, 3].map((v) => bip32.fromSeed(Buffer.alloc(16, `test/2/${v}`), network)) as BIP32Interface[];
export const rootWalletKeys = new RootWalletKeys([keys[0], keys[1], keys[2]]);

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
  outputs: { chain: ChainCode; index: number; value: bigint }[] | outputScripts.ScriptType2Of3
): UtxoPsbt {
  const psbt = createPsbtForNetwork({ network });

  if (Array.isArray(outputs)) {
    outputs.forEach((output) => addWalletOutputToPsbt(psbt, rootWalletKeys, output.chain, output.index, output.value));
  } else {
    const total = BigInt(unspentSum<bigint>(unspents, 'bigint'));
    addWalletOutputToPsbt(psbt, rootWalletKeys, getInternalChainCode(outputs), CHANGE_INDEX, total - FEE);
  }
  unspents.forEach((u) => {
    if (isWalletUnspent(u)) {
      addWalletUnspentToPsbt(psbt, u, rootWalletKeys, signer, cosigner);
    } else {
      const { redeemScript } = createOutputScriptP2shP2pk(replayProtectionKeyPair.publicKey);
      assert.ok(redeemScript);
      addReplayProtectionUnspentToPsbt(psbt, u, redeemScript);
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
  const input = psbt.data.inputs[index];
  assert.ok(isPsbtInputFinalized(input));
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
  const parsed = parsePsbtInput(psbt.data.inputs[0]);
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
  const parsed = parsePsbtInput(psbt.data.inputs[0]);
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
