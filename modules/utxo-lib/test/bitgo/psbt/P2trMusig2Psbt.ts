import * as assert from 'assert';

import { networks } from '../../../src';
import {
  isWalletUnspent,
  Unspent,
  getInternalChainCode,
  getExternalChainCode,
  outputScripts,
  unspentSum,
  UtxoTransaction,
  createPsbtForNetwork,
  addWalletUnspentToPsbt,
  addWalletOutputToPsbt,
  KeyName,
  UtxoPsbt,
  PSBT_PROPRIETARY_IDENTIFIER,
  scriptTypeForChain,
  WalletUnspent,
  ProprietaryKeySubtype,
} from '../../../src/bitgo';

import { getDefaultWalletKeys } from '../../../src/testutil';
import { mockWalletUnspent } from '../../../src/testutil/mock';
import {
  createTapInternalKey,
  createTapOutputKey,
  decodePsbtMusig2ParticipantsKeyValData,
  setMusig2Nonces,
} from '../../../src/bitgo/Musig2';
import {
  createKeyPathP2trMusig2,
  createPaymentP2trMusig2,
  ScriptType2Of3,
  scriptTypes2Of3,
  toXOnlyPublicKey,
} from '../../../src/bitgo/outputScripts';

describe('p2trMusig2 PSBT Test Suite', function () {
  const network = networks.bitcoin;
  const rootWalletKeys = getDefaultWalletKeys();
  const outputType = 'p2trMusig2';
  const CHANGE_INDEX = 100;
  const FEE = BigInt(100);

  function constructPsbt(
    unspents: (Unspent<bigint> & { prevTx?: Buffer })[],
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

  function getUnspents(inputScriptTypes: ScriptType2Of3[]) {
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

  function validatePsbtP2trMusig2Input(
    psbt: UtxoPsbt<UtxoTransaction<bigint>>,
    index: number,
    unspent: WalletUnspent<bigint>,
    spendType: 'keyPath' | 'scriptPath'
  ) {
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

  function validatePsbtP2trMusig2Output(psbt: UtxoPsbt<UtxoTransaction<bigint>>, index: number) {
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

  function validateNoncesKeyVals(
    psbt: UtxoPsbt<UtxoTransaction<bigint>>,
    index: number,
    unspent: WalletUnspent<bigint>
  ) {
    const keyVals = psbt.getProprietaryKeyVals(index);
    const inputWalletKeys = rootWalletKeys.deriveForChainAndIndex(unspent.chain, unspent.index);
    const { outputPubkey } = createKeyPathP2trMusig2(inputWalletKeys.publicKeys);
    const derivedParticipantPubKeys = [inputWalletKeys.user.publicKey, inputWalletKeys.bitgo.publicKey];

    const noncesKeyVals = keyVals.filter((kv) => kv.key.subtype === ProprietaryKeySubtype.MUSIG2_PUB_NONCE);
    assert.strictEqual(noncesKeyVals.length, 2);

    const nonceKeydata = derivedParticipantPubKeys.map((p) => {
      const keydata = Buffer.alloc(65);
      p.copy(keydata);
      outputPubkey.copy(keydata, 33);
      return keydata;
    });

    noncesKeyVals.forEach((kv) => {
      assert.strictEqual(kv.key.identifier, PSBT_PROPRIETARY_IDENTIFIER);
      assert.strictEqual(kv.value.length, 66);
      assert.strictEqual(nonceKeydata.filter((kd) => kd.equals(kv.key.keydata)).length, 1);
    });
  }

  function validateParticipantsKeyVals(
    psbt: UtxoPsbt<UtxoTransaction<bigint>>,
    index: number,
    unspent: WalletUnspent<bigint>
  ) {
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

  describe('p2trMusig2 key path', function () {
    it(`psbt creation and nonce generation success`, function () {
      const unspents = getUnspents(scriptTypes2Of3.map((t) => t));
      const psbt = constructPsbt(unspents, 'user', 'bitgo', outputType);
      setMusig2Nonces(psbt, rootWalletKeys.user);
      setMusig2Nonces(psbt, rootWalletKeys.bitgo, Buffer.allocUnsafe(32));
      unspents.forEach((unspent, index) => {
        if (scriptTypeForChain(unspent.chain) !== 'p2trMusig2') {
          assert.strictEqual(psbt.getProprietaryKeyVals(index).length, 0);
          return;
        }
        validatePsbtP2trMusig2Input(psbt, index, unspent, 'keyPath');
        validatePsbtP2trMusig2Output(psbt, 0);
        validateParticipantsKeyVals(psbt, index, unspent);
        validateNoncesKeyVals(psbt, index, unspent);
      });
    });

    it(`nonce generation is skipped if tapInternalKey doesn't match participant pub keys agg`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].tapInternalKey = Buffer.allocUnsafe(32);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'tapInternalKey and aggregated participant pub keys does not match'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if sessionId size is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user, Buffer.allocUnsafe(33)),
        (e) => e.message === 'Invalid sessionId size 33'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if private key is missing`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user.neutered()),
        (e) => e.message === 'private key is required to generate nonce'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if tapBip32Derivation is missing`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].tapBip32Derivation = [];
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'tapBip32Derivation is required to generate nonce'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if participant pub keys is missing`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].unknownKeyVals = [];
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'Found 0 matching participant key value instead of 1'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
    });

    it(`nonce generation fails if participant pub keys keydata size is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.concat([keyVals[0].key.keydata, Buffer.from('dummy')]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid keydata size ${keyVals[0].key.keydata.length} for participant pub keys`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if participant keydata tapOutputKey in invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.concat([Buffer.allocUnsafe(32), keyVals[0].key.keydata.subarray(32)]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid participants keyata tapOutputKey`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if participant keydata tapInternalKey in invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.concat([keyVals[0].key.keydata.subarray(0, 32), Buffer.allocUnsafe(32)]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid participants keyata tapInternalKey`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if tapInternalKey and aggregated participant pub keys don't match`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);

      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), 1);
      const tapInternalKey = createTapInternalKey([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
      const tapOutputKey = createTapOutputKey(tapInternalKey, psbt.data.inputs[0].tapMerkleRoot!);

      keyVals[0].key.keydata = Buffer.concat([tapOutputKey, tapInternalKey]);
      keyVals[0].value = Buffer.concat([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);

      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `tapInternalKey and aggregated participant pub keys does not match`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if keydata size of participant pub keys is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].key.keydata = Buffer.allocUnsafe(65);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid keydata size 65 for participant pub keys`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if valuedata size of participant pub keys is invalid`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].value = Buffer.allocUnsafe(67);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Invalid valuedata size 67 for participant pub keys`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if duplicate participant pub keys found`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);
      keyVals[0].value = Buffer.concat([keyVals[0].value.subarray(33), keyVals[0].value.subarray(33)]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `Duplicate participant pub keys found`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if no fingerprint match`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      psbt.data.inputs[0].tapBip32Derivation?.forEach((bv) => (bv.masterFingerprint = Buffer.allocUnsafe(4)));
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'Need one tapBip32Derivation masterFingerprint to match the rootWalletKey fingerprint'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonces generation fails if rootWalletKey doesn't derive one tapBip32`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), CHANGE_INDEX);
      psbt.data.inputs[0].tapBip32Derivation?.forEach((bv) => {
        bv.path = walletKeys.paths[2];
      });
      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === 'root wallet key should derive one tapBip32Derivation'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });

    it(`nonce generation fails if derived wallet key does not match any participant key`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      const psbt = constructPsbt(unspents, 'user', 'bitgo', 'p2sh');
      const keyVals = psbt.getProprietaryKeyVals(0);

      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), 1);
      const tapInternalKey = createTapInternalKey([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
      psbt.data.inputs[0].tapInternalKey = tapInternalKey;

      keyVals[0].value = Buffer.concat([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
      const tapOutputKey = createTapOutputKey(tapInternalKey, psbt.data.inputs[0].tapMerkleRoot!);
      keyVals[0].key.keydata = Buffer.concat([tapOutputKey, tapInternalKey]);
      psbt.data.inputs[0].unknownKeyVals = [];
      psbt.addProprietaryKeyValToInput(0, keyVals[0]);

      assert.throws(
        () => setMusig2Nonces(psbt, rootWalletKeys.user),
        (e) => e.message === `participant plain pub key should match one tapBip32Derivation plain pub key`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
    });
  });

  describe('p2trMusig2 script path', function () {
    it(`psbt creation success and musig2 nonce generation skips`, function () {
      const unspents = getUnspents(['p2trMusig2']);
      let psbt = constructPsbt(unspents, 'user', 'backup', outputType);
      setMusig2Nonces(psbt, rootWalletKeys.user);
      setMusig2Nonces(psbt, rootWalletKeys.backup);
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      validatePsbtP2trMusig2Input(psbt, 0, unspents[0], 'scriptPath');
      validatePsbtP2trMusig2Output(psbt, 0);

      psbt = constructPsbt(unspents, 'bitgo', 'backup', outputType);
      setMusig2Nonces(psbt, rootWalletKeys.bitgo);
      setMusig2Nonces(psbt, rootWalletKeys.backup);
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      validatePsbtP2trMusig2Input(psbt, 0, unspents[0], 'scriptPath');
      validatePsbtP2trMusig2Output(psbt, 0);
    });
  });

  describe('Psbt musig2 util functions', function () {
    it(`getTaprootHashForSigChecked throws error if used for p2tr* input types`, function () {
      const unspents = getUnspents(scriptTypes2Of3.map((t) => t));
      const psbt = constructPsbt(unspents, 'user', 'bitgo', outputType);
      unspents.forEach((unspent, index) => {
        const scryptType = scriptTypeForChain(unspent.chain);
        if (scryptType === 'p2trMusig2' || scryptType === 'p2tr') {
          return;
        }
        assert.throws(
          () => psbt.getTaprootHashForSigChecked(index),
          (e) => e.message === `${index} input is not a taproot type to take taproot tx hash`
        );
      });
    });

    it(`decodePsbtMusig2ParticipantsKeyValData fails if invalid subtype or identifier is passed`, function () {
      const kv = {
        key: {
          identifier: 'dummy',
          subtype: 0x05,
          keydata: Buffer.allocUnsafe(1),
        },
        value: Buffer.allocUnsafe(1),
      };

      assert.throws(
        () => decodePsbtMusig2ParticipantsKeyValData(kv),
        (e) =>
          e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`
      );

      kv.key.identifier = PSBT_PROPRIETARY_IDENTIFIER;
      assert.throws(
        () => decodePsbtMusig2ParticipantsKeyValData(kv),
        (e) =>
          e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`
      );
    });

    it(`calculateTapInternalKey and calculateTapOutputKey fails for invalid size keys`, function () {
      assert.throws(
        () => createTapInternalKey([Buffer.allocUnsafe(33), Buffer.allocUnsafe(34)]),
        (e) => e.message === `invalid key size 34. Must use plain keys.`
      );
      assert.throws(
        () => createTapOutputKey(Buffer.allocUnsafe(34), Buffer.allocUnsafe(33)),
        (e) => e.message === `Invalid tapTreeRoot size 33`
      );
    });
  });
});
