import * as assert from 'assert';
import {
  addWalletOutputToPsbt,
  addWalletUnspentToPsbt,
  createPsbtForNetwork,
  getExternalChainCode,
  getInternalChainCode,
  isWalletUnspent,
  KeyName,
  outputScripts,
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
