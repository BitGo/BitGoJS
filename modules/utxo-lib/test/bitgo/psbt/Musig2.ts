import * as assert from 'assert';

import {
  createPsbtFromHex,
  getExternalChainCode,
  getInternalChainCode,
  isSegwit,
  parsePsbtInput,
  ProprietaryKeySubtype,
  PSBT_PROPRIETARY_IDENTIFIER,
  RootWalletKeys,
  scriptTypeForChain,
  UtxoTransaction,
  verifySignatureWithUnspent,
} from '../../../src/bitgo';

import { getKeyTriple, verifyFullySignedSignatures } from '../../../src/testutil';
import {
  createTapInternalKey,
  createTapOutputKey,
  createTapTweak,
  decodePsbtMusig2Nonce,
  decodePsbtMusig2Participants,
  encodePsbtMusig2PartialSig,
  musig2PartialSign,
  assertPsbtMusig2Nonces,
  Musig2NonceStore,
} from '../../../src/bitgo/Musig2';
import { scriptTypes2Of3, toXOnlyPublicKey } from '../../../src/bitgo/outputScripts';
import {
  constructPsbt,
  getUnspents,
  invalidPartialSig,
  invalidParticipantPubKeys,
  invalidTapInputKey,
  invalidTapOutputKey,
  invalidTxHash,
  dummyAggNonce,
  validateNoncesKeyVals,
  validatePartialSigKeyVals,
  validateParticipantsKeyVals,
  validatePsbtP2trMusig2Input,
  validatePsbtP2trMusig2Output,
  dummyParticipantPubKeys,
  dummyPrivateKey,
  dummyPubNonce,
  dummyTapInternalKey,
  dummyTapOutputKey,
  dummyPartialSig,
  validateFinalizedInput,
  network,
  validateParsedTaprootKeyPathTxInput,
  validateParsedTaprootScriptPathTxInput,
  validateParsedTaprootKeyPathPsbt,
  validateParsedTaprootScriptPathPsbt,
  rootWalletKeys,
} from './Musig2Util';

const p2trMusig2Unspent = getUnspents(['p2trMusig2'], rootWalletKeys);
const outputType = 'p2trMusig2';
const CHANGE_INDEX = 100;

describe('p2trMusig2', function () {
  describe('p2trMusig2 key path', function () {
    it(`create psbt, nonces, sign (internal verify) - success`, function () {
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(getExternalChainCode('p2trMusig2'), 0);
      const unspents = getUnspents(
        scriptTypes2Of3.map((t) => t),
        rootWalletKeys
      );
      // WP creates PSBT during build API, serializes it, and sends the psbt to user
      const buildPsbt = constructPsbt(unspents, rootWalletKeys, 'bitgo', 'user', outputType);
      const buildPsbtSer = buildPsbt.toHex();

      // User de-serialises the psbt, ands the user nonce, and sends it to the hsm so that it can add the bitgo nonce
      const userPsbt = createPsbtFromHex(buildPsbtSer, network);
      userPsbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      const userPsbtSer = userPsbt.toHex();

      // HSM deserializes the user psbt, adds the deterministic bitgo nonce, and sends that back to the user
      const bitgoPsbt = createPsbtFromHex(userPsbtSer, network);
      bitgoPsbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: true });
      const bitgoPsbtSer = bitgoPsbt.toHex();

      // User combines the psbt with the bitgo nonce, adds user signature, and sends half-signed to hsm
      const bitgoPsbtDeser = createPsbtFromHex(bitgoPsbtSer, network);
      userPsbt.combine(bitgoPsbtDeser);
      userPsbt.signAllInputsHD(rootWalletKeys.user);
      const userPsbtHalfSignedHex = userPsbt.toHex();

      // WP de-serialises the psbt and validates user sig
      const userPsbtDes = createPsbtFromHex(userPsbtHalfSignedHex, network);
      assert.ok(userPsbtDes.validateTaprootMusig2SignaturesOfInput(4, walletKeys.user.publicKey));

      // WP sends to hsm for signature and returns a fully signed psbt
      const psbt = createPsbtFromHex(userPsbtHalfSignedHex, network);
      psbt.signAllInputsHD(rootWalletKeys.bitgo, { deterministic: true });

      unspents.forEach((unspent, index) => {
        if (scriptTypeForChain(unspent.chain) !== 'p2trMusig2') {
          assert.strictEqual(psbt.getProprietaryKeyVals(index).length, 0);
          return;
        }
        validatePsbtP2trMusig2Input(psbt, index, unspent, 'keyPath');
        validatePsbtP2trMusig2Output(psbt, 0);
        validateParticipantsKeyVals(psbt, index, unspent);
        validateNoncesKeyVals(psbt, index, unspent);
        validatePartialSigKeyVals(psbt, index, unspent);
      });

      assert.ok(psbt.validateSignaturesOfAllInputs());
      psbt.finalizeAllInputs();
      unspents.forEach((unspent, index) => {
        validateFinalizedInput(psbt, index, unspent);
      });
      const tx = psbt.extractTransaction() as UtxoTransaction<bigint>;
      assert.ok(verifyFullySignedSignatures(tx, unspents, rootWalletKeys, 'bitgo', 'user'));
      unspents.map((unspent, inputIndex) => {
        assert.deepStrictEqual(verifySignatureWithUnspent(tx, inputIndex, unspents, rootWalletKeys), [
          true,
          false,
          true,
        ]);
      });
    });

    it(`parse tx`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'bitgo', 'user', outputType);
      validateParsedTaprootKeyPathPsbt(psbt, 0, 'unsigned');

      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      validateParsedTaprootKeyPathPsbt(psbt, 0, 'halfsigned');

      psbt.signAllInputsHD(rootWalletKeys.bitgo);
      validateParsedTaprootKeyPathPsbt(psbt, 0, 'fullysigned');

      psbt.finalizeAllInputs();
      assert.throws(
        () => parsePsbtInput(psbt.data.inputs[0]),
        (e: any) => e.message === 'Finalized PSBT parsing is not supported'
      );

      const tx = psbt.extractTransaction() as UtxoTransaction<bigint>;
      validateParsedTaprootKeyPathTxInput(psbt, tx);
    });

    describe('create nonce', function () {
      it(`update with new nonce should be allowed`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');

        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);

        let noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 1);
        const userNonceKey = noncesKeyVals[0].key.keydata;
        const userNonceValue = noncesKeyVals[0].value;

        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);

        noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 2);

        noncesKeyVals = noncesKeyVals.filter((kv) => kv.key.keydata.equals(userNonceKey));
        assert.strictEqual(noncesKeyVals.length, 1);
        assert.ok(!noncesKeyVals[0].value.equals(userNonceValue));
      });

      it(`Cosigner nonce creation fail should not enforce the signer to recreate nonce`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');

        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);

        const tapBip32Derivation = psbt.data.inputs[0].tapBip32Derivation;
        psbt.data.inputs[0].tapBip32Derivation = undefined;

        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo),
          (e: any) => e.message === 'tapBip32Derivation is required to create nonce'
        );

        psbt.data.inputs[0].tapBip32Derivation = tapBip32Derivation;

        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

        psbt.signAllInputsHD(rootWalletKeys.user);
        psbt.signAllInputsHD(rootWalletKeys.bitgo);

        const noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 2);

        const partialSigKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
        });
        assert.strictEqual(partialSigKeyVals.length, 2);

        const participantKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
        });
        assert.strictEqual(participantKeyVals.length, 1);
      });

      it('Cosigner can create a deterministic nonce', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: true });

        const noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 2);
      });

      it('Cosigner cannot create a deterministic nonce if there is no signer nonce', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');

        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: true }),
          (e: any) => e.message === 'No nonces found on input #0'
        );

        let noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 0);

        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: true }),
          (e: any) => e.message === 'signer nonce must be set if cosigner nonce is to be derived deterministically'
        );

        noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 1);
      });

      it('Cosigner cannot add entropy to deterministic nonce creation', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        assert.throws(
          () =>
            psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, {
              deterministic: true,
              sessionId: Buffer.allocUnsafe(32),
            }),
          (e: any) => e.message === 'Cannot add extra entropy when generating a deterministic nonce'
        );
        const noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 1);
      });

      it('Signer cannot create a deterministic nonce', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user, { deterministic: true }),
          (e: any) => e.message === `Only the cosigner's nonce can be set deterministically`
        );
        const noncesKeyVals = psbt.getProprietaryKeyVals(0, {
          identifier: PSBT_PROPRIETARY_IDENTIFIER,
          subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
        });
        assert.strictEqual(noncesKeyVals.length, 0);
      });

      it(`skipped if tapInternalKey doesn't match participant pub keys agg`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.data.inputs[0].tapInternalKey = dummyTapInternalKey;
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === 'tapInternalKey and aggregated participant pub keys does not match'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if sessionId size is invalid`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user, { sessionId: Buffer.allocUnsafe(33) }),
          (e: any) => e.message === 'Invalid sessionId size 33'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if private key is missing`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user.neutered()),
          (e: any) => e.message === 'private key is required to generate nonce'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if tapBip32Derivation is missing`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.data.inputs[0].tapBip32Derivation = [];
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === 'tapBip32Derivation is required to create nonce'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if participant pub keys is missing`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.data.inputs[0].unknownKeyVals = [];
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === 'Found 0 matching participant key value instead of 1'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      });

      it(`fails if participant pub keys keydata size is invalid`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);
        keyVals[0].key.keydata = Buffer.concat([keyVals[0].key.keydata, Buffer.from('dummy')]);
        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `Invalid keydata size ${keyVals[0].key.keydata.length} for participant pub keys`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if participant keydata tapOutputKey in invalid`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);
        keyVals[0].key.keydata = Buffer.concat([dummyTapOutputKey, keyVals[0].key.keydata.subarray(32)]);
        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `Invalid participants keydata tapOutputKey`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if participant keydata tapInternalKey in invalid`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);
        keyVals[0].key.keydata = Buffer.concat([keyVals[0].key.keydata.subarray(0, 32), dummyTapInternalKey]);
        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `Invalid participants keydata tapInternalKey`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if tapInternalKey and aggregated participant pub keys don't match`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);

        const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), 1);
        const tapInternalKey = createTapInternalKey([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);
        const tapOutputKey = createTapOutputKey(tapInternalKey, psbt.data.inputs[0].tapMerkleRoot!);

        keyVals[0].key.keydata = Buffer.concat([tapOutputKey, tapInternalKey]);
        keyVals[0].value = Buffer.concat([walletKeys.user.publicKey, walletKeys.bitgo.publicKey]);

        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `tapInternalKey and aggregated participant pub keys does not match`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if keydata size of participant pub keys is invalid`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);
        keyVals[0].key.keydata = Buffer.allocUnsafe(65);
        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `Invalid keydata size 65 for participant pub keys`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if valuedata size of participant pub keys is invalid`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);
        keyVals[0].value = Buffer.allocUnsafe(67);
        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `Invalid valuedata size 67 for participant pub keys`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if duplicate participant pub keys found`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const keyVals = psbt.getProprietaryKeyVals(0);
        keyVals[0].value = Buffer.concat([keyVals[0].value.subarray(33), keyVals[0].value.subarray(33)]);
        psbt.data.inputs[0].unknownKeyVals = [];
        psbt.addProprietaryKeyValToInput(0, keyVals[0]);
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `Duplicate participant pub keys found`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if no fingerprint match`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.data.inputs[0].tapBip32Derivation?.forEach((bv) => (bv.masterFingerprint = Buffer.allocUnsafe(4)));
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === 'No bip32Derivation masterFingerprint matched the HD keyPair fingerprint'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if pubkey did not match tapBip32Derivation`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const walletKeys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode('p2trMusig2'), CHANGE_INDEX);
        psbt.data.inputs[0].tapBip32Derivation?.forEach((bv) => {
          bv.path = walletKeys.paths[2];
        });
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === 'pubkey did not match bip32Derivation'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if root wallet key derive more than one tapBip32Derivation`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        const walletKeys = rootWalletKeys.deriveForChainAndIndex(
          p2trMusig2Unspent[0].chain,
          p2trMusig2Unspent[0].index
        );
        psbt.data.inputs[0].tapBip32Derivation?.forEach((bv, index) => {
          bv.path = walletKeys.paths[0];
          bv.pubkey = toXOnlyPublicKey(walletKeys.publicKeys[0]);
          bv.masterFingerprint = rootWalletKeys.user.fingerprint;
        });
        assert.throws(
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message.startsWith('more than one matching derivation for fingerprint')
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });

      it(`fails if derived wallet key does not match any participant key`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
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
          () => psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user),
          (e: any) => e.message === `participant plain pub key should match one bip32Derivation plain pub key`
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 1);
      });
    });

    describe('sign', function () {
      it(`fails if privateKey is missing`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
        assert.throws(
          () => psbt.signTaprootInputHD(0, rootWalletKeys.user.neutered()),
          (e: any) => e.message === 'privateKey is required to sign p2tr musig2'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
      });

      it(`fails if tapInternalKey is missing`, function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');

        const walletKeys = rootWalletKeys.deriveForChainAndIndex(
          p2trMusig2Unspent[0].chain,
          p2trMusig2Unspent[0].index
        );

        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

        psbt.data.inputs[0].tapInternalKey = undefined;
        assert.throws(
          () =>
            psbt.signTaprootMusig2Input(0, {
              publicKey: walletKeys.user.publicKey,
              privateKey: walletKeys.user.privateKey!,
            }),
          (e: any) => e.message === 'not a taproot musig2 input'
        );
        assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
      });

      it('only the cosigner can add a deterministic signature', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: true });
        assert.throws(
          () => psbt.signInputHD(0, rootWalletKeys.user, { deterministic: true }),
          (e: any) => e.message === 'can only add a deterministic signature on the cosigner'
        );
      });

      it('cosigner can sign deterministically', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: true });
        psbt.signAllInputsHD(rootWalletKeys.user);
        psbt.signAllInputsHD(rootWalletKeys.bitgo, { deterministic: true });
        assert.ok(psbt.validateSignaturesOfAllInputs());
        assert.ok(psbt.finalizeAllInputs());
      });

      it('cosigner can sign non-deterministically', function () {
        const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
        psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo, { deterministic: false });
        psbt.signAllInputsHD(rootWalletKeys.user);
        psbt.signAllInputsHD(rootWalletKeys.bitgo, { deterministic: false });
        assert.ok(psbt.validateSignaturesOfAllInputs());
        assert.ok(psbt.finalizeAllInputs());
      });
    });

    it(`fails if tapMerkleRoot is missing`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');

      const walletKeys = rootWalletKeys.deriveForChainAndIndex(p2trMusig2Unspent[0].chain, p2trMusig2Unspent[0].index);

      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

      psbt.data.inputs[0].tapMerkleRoot = undefined;
      assert.throws(
        () =>
          psbt.signTaprootMusig2Input(0, {
            publicKey: walletKeys.user.publicKey,
            privateKey: walletKeys.user.privateKey!,
          }),
        (e: any) => e.message === 'not a taproot musig2 input'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
    });

    it(`fails if participant pub keys is missing`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.data.inputs[0].unknownKeyVals = [];
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === 'Found 0 matching participant key value instead of 1'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
    });

    it(`fails if signer pub key is not matching any participant pub keys`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      assert.throws(
        () =>
          psbt.signTaprootMusig2Input(0, {
            privateKey: rootWalletKeys.backup.privateKey!,
            publicKey: rootWalletKeys.backup.publicKey!,
          }),
        (e: any) => e.message === 'signer pub key should match one of participant pub keys'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
    });

    it(`fails if more than 2 nonce key value exists`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.data.inputs[0].unknownKeyVals?.push(psbt.data.inputs[0].unknownKeyVals[2]);
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === 'Found 3 matching nonce key value instead of 1 or 2'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 4);
    });

    it(`fails if 2 nonce key value do not exist`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.data.inputs[0].unknownKeyVals?.splice(2);
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === 'Found 1 matching nonce key value instead of 2'
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 2);
    });

    it(`fails if nonce keydata size is invalid`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

      const keyVals = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
      });
      keyVals[1].key.keydata = Buffer.concat([keyVals[1].key.keydata, Buffer.from('dummy')]);
      psbt.data.inputs[0].unknownKeyVals?.splice(2);
      psbt.addProprietaryKeyValToInput(0, keyVals[1]);
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === `Invalid keydata size ${keyVals[1].key.keydata.length} for nonce`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
    });

    it(`fails if nonce valuedata size is invalid`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

      const keyVals = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
      });
      keyVals[1].value = Buffer.concat([keyVals[1].value, Buffer.from('dummy')]);
      psbt.data.inputs[0].unknownKeyVals?.splice(2);
      psbt.addProprietaryKeyValToInput(0, keyVals[1]);
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === `Invalid valuedata size ${keyVals[1].value.length} for nonce`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
    });

    it(`fails if nonce keydata is invalid`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

      const dummyRootWalletKeys = new RootWalletKeys(getKeyTriple('dummy'));
      const dummyP2trMusig2Unspent = getUnspents(['p2trMusig2'], dummyRootWalletKeys);
      const dummyPsbt = constructPsbt(dummyP2trMusig2Unspent, dummyRootWalletKeys, 'user', 'bitgo', 'p2sh');
      dummyPsbt.setAllInputsMusig2NonceHD(dummyRootWalletKeys.user);
      dummyPsbt.setAllInputsMusig2NonceHD(dummyRootWalletKeys.bitgo);

      const dummyKeyVals = dummyPsbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
      });

      psbt.data.inputs[0].unknownKeyVals?.splice(1);
      dummyKeyVals.forEach((kv, i) => psbt.addProprietaryKeyValToInput(0, dummyKeyVals[i]));
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === `Invalid nonce keydata participant pub key`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
    });

    it(`fails if nonce keydata tapOutputKey is invalid`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', 'p2sh');
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

      const keyVals = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
      });

      keyVals[1].key.keydata = Buffer.concat([keyVals[1].key.keydata.subarray(0, 33), dummyTapOutputKey]);

      psbt.data.inputs[0].unknownKeyVals?.splice(2);
      psbt.addProprietaryKeyValToInput(0, keyVals[1]);
      assert.throws(
        () => psbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === `Invalid nonce keydata tapOutputKey`
      );
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 3);
    });
  });

  describe('p2trMusig2 script path', function () {
    it(`psbt creation success and musig2 skips`, function () {
      let psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'backup', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.backup);
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.backup);
      validatePsbtP2trMusig2Input(psbt, 0, p2trMusig2Unspent[0], 'scriptPath');
      validatePsbtP2trMusig2Output(psbt, 0);
      assert.ok(psbt.validateSignaturesOfAllInputs());
      psbt.finalizeAllInputs();
      validateFinalizedInput(psbt, 0, p2trMusig2Unspent[0], 'scriptPath');
      let tx = psbt.extractTransaction() as UtxoTransaction<bigint>;
      assert.ok(verifyFullySignedSignatures(tx, p2trMusig2Unspent, rootWalletKeys, 'user', 'backup'));

      psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'bitgo', 'backup', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.backup);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.backup);
      assert.strictEqual(psbt.getProprietaryKeyVals(0).length, 0);
      validatePsbtP2trMusig2Input(psbt, 0, p2trMusig2Unspent[0], 'scriptPath');
      validatePsbtP2trMusig2Output(psbt, 0);
      assert.ok(psbt.validateSignaturesOfAllInputs());
      psbt.finalizeAllInputs();
      validateFinalizedInput(psbt, 0, p2trMusig2Unspent[0], 'scriptPath');
      tx = psbt.extractTransaction() as UtxoTransaction<bigint>;
      assert.ok(verifyFullySignedSignatures(tx, p2trMusig2Unspent, rootWalletKeys, 'bitgo', 'backup'));
    });

    it(`parse tx`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'backup', outputType);
      validateParsedTaprootScriptPathPsbt(psbt, 0, 'unsigned');

      psbt.signAllInputsHD(rootWalletKeys.user);
      validateParsedTaprootScriptPathPsbt(psbt, 0, 'halfsigned');

      psbt.signAllInputsHD(rootWalletKeys.backup);
      validateParsedTaprootScriptPathPsbt(psbt, 0, 'fullysigned');

      psbt.finalizeAllInputs();
      const tx = psbt.extractTransaction() as UtxoTransaction<bigint>;

      const psbtDuplicate = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'backup', outputType);
      validateParsedTaprootScriptPathTxInput(psbtDuplicate, tx, 0);
    });
  });

  describe('validate p2tr Musig2 signatures', function () {
    it(`validate with pubkey`, function () {
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(p2trMusig2Unspent[0].chain, p2trMusig2Unspent[0].index);
      let psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2Nonce(walletKeys.user);
      psbt.setAllInputsMusig2Nonce(walletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      assert.ok(psbt.validateTaprootMusig2SignaturesOfInput(0, walletKeys.user.publicKey));

      psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setInputMusig2Nonce(0, walletKeys.user);
      psbt.setInputMusig2NonceHD(0, rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      assert.ok(psbt.validateTaprootMusig2SignaturesOfInput(0, walletKeys.user.publicKey));
      psbt.signAllInputsHD(rootWalletKeys.bitgo);
      assert.ok(psbt.validateTaprootMusig2SignaturesOfInput(0, walletKeys.bitgo.publicKey));
    });

    it(`fails if no sig`, function () {
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(p2trMusig2Unspent[0].chain, p2trMusig2Unspent[0].index);
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      assert.throws(
        () => psbt.validateSignaturesOfAllInputs(),
        (e: any) => e.message === `No signatures to validate`
      );

      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);

      psbt.signAllInputsHD(rootWalletKeys.user);

      assert.throws(
        () => psbt.validateTaprootMusig2SignaturesOfInput(0, walletKeys.bitgo.publicKey),
        (e: any) => e.message === `No signatures for this pubkey`
      );
    });

    it(`fails if no tapInternalKey and tapMerkleRoot`, function () {
      const walletKeys = rootWalletKeys.deriveForChainAndIndex(p2trMusig2Unspent[0].chain, p2trMusig2Unspent[0].index);
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);

      const tapInternalKey = psbt.data.inputs[0].tapInternalKey;
      psbt.data.inputs[0].tapInternalKey = undefined;
      assert.throws(
        () => psbt.validateTaprootMusig2SignaturesOfInput(0),
        (e: any) => e.message === `both tapInternalKey and tapMerkleRoot are required`
      );

      psbt.data.inputs[0].tapInternalKey = tapInternalKey;
      psbt.data.inputs[0].tapMerkleRoot = undefined;
      assert.throws(
        () => psbt.validateTaprootMusig2SignaturesOfInput(0, walletKeys.bitgo.publicKey),
        (e: any) => e.message === `both tapInternalKey and tapMerkleRoot are required`
      );
    });

    it(`fails if no nonce and sig pub key match`, function () {
      let psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);

      const partialSigs = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
      });

      const myRootWalletKeys = new RootWalletKeys(getKeyTriple('dummy'));
      const myUnspents = getUnspents(['p2trMusig2'], myRootWalletKeys);
      psbt = constructPsbt(myUnspents, myRootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2NonceHD(myRootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(myRootWalletKeys.bitgo);
      psbt.signAllInputsHD(myRootWalletKeys.user);
      psbt.signAllInputsHD(myRootWalletKeys.bitgo);

      const participants = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
      });

      const nonces = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
      });

      psbt.data.inputs[0].unknownKeyVals = undefined;
      psbt.addProprietaryKeyValToInput(0, participants[0]);
      psbt.addProprietaryKeyValToInput(0, nonces[0]);
      psbt.addProprietaryKeyValToInput(0, nonces[1]);
      psbt.addProprietaryKeyValToInput(0, partialSigs[0]);
      psbt.addProprietaryKeyValToInput(0, partialSigs[1]);

      assert.throws(
        () => psbt.validateSignaturesOfAllInputs(),
        (e: any) => e.message === `Found no pub nonce for pubkey`
      );
    });

    it(`fails if no valid sig`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);
      psbt.signAllInputsHD(rootWalletKeys.bitgo);

      const partialSigs = psbt.getProprietaryKeyVals(0, {
        identifier: PSBT_PROPRIETARY_IDENTIFIER,
        subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
      });

      partialSigs[1].value = dummyPartialSig;
      psbt.addOrUpdateProprietaryKeyValToInput(0, partialSigs[1]);

      assert.ok(!psbt.validateSignaturesOfAllInputs());
    });
  });

  describe('finalizeTaprootMusig2Input', function () {
    it('fails if invalid number for sigs', function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      psbt.signAllInputsHD(rootWalletKeys.user);

      assert.throws(
        () => psbt.finalizeAllInputs(),
        (e: any) => e.message === `invalid number of partial signatures 1 to finalize`
      );
    });
  });

  describe('Psbt musig2 common functions', function () {
    it('output script should match the scriptPubKey in the prevout', function () {
      const myRootWalletKeys = new RootWalletKeys(getKeyTriple('dummy'));
      const unspents = getUnspents(
        scriptTypes2Of3.map((t) => t),
        myRootWalletKeys
      );

      const psbt = constructPsbt(unspents, rootWalletKeys, 'user', 'bitgo', outputType);
      unspents.forEach((u, index) => {
        const scriptType = scriptTypeForChain(u.chain);
        assert.throws(
          () =>
            scriptType === 'p2trMusig2'
              ? psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user)
              : scriptType === 'p2tr'
              ? psbt.signTaprootInputHD(index, rootWalletKeys.user)
              : psbt.signInputHD(index, rootWalletKeys.user),
          (e: any) =>
            isSegwit(u.chain) && scriptType !== 'p2shP2wsh'
              ? e.message === `Witness script for input #${index} doesn't match the scriptPubKey in the prevout`
              : e.message === `Redeem script for input #${index} doesn't match the scriptPubKey in the prevout`
        );
      });

      const p2trMusig2ScriptPathPsbt = constructPsbt([unspents[4]], rootWalletKeys, 'user', 'backup', outputType);
      assert.throws(
        () => p2trMusig2ScriptPathPsbt.signTaprootInputHD(0, rootWalletKeys.user),
        (e: any) => e.message === `Witness script for input #0 doesn't match the scriptPubKey in the prevout`
      );
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
        () => decodePsbtMusig2Participants(kv),
        (e: any) =>
          e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`
      );

      kv.key.identifier = PSBT_PROPRIETARY_IDENTIFIER;
      assert.throws(
        () => decodePsbtMusig2Participants(kv),
        (e: any) =>
          e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`
      );
    });

    it(`decodePsbtMusig2NonceKeyValData fails if invalid subtype or identifier is passed`, function () {
      const kv = {
        key: {
          identifier: 'dummy',
          subtype: 0x05,
          keydata: Buffer.allocUnsafe(1),
        },
        value: Buffer.allocUnsafe(1),
      };

      assert.throws(
        () => decodePsbtMusig2Nonce(kv),
        (e: any) => e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for nonce`
      );

      kv.key.identifier = PSBT_PROPRIETARY_IDENTIFIER;
      assert.throws(
        () => decodePsbtMusig2Nonce(kv),
        (e: any) => e.message === `Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for nonce`
      );
    });

    it(`validatePsbtMusig2NoncesKeyValData fails if participant pub keys are duplicate`, function () {
      const nonceKeyValData = [0, 1].map((i) => ({
        participantPubKey: dummyParticipantPubKeys[i],
        tapOutputKey: dummyTapOutputKey,
        pubNonce: dummyPubNonce,
      }));

      let participantKeyValData = {
        participantPubKeys: dummyParticipantPubKeys,
        tapInternalKey: dummyTapInternalKey,
        tapOutputKey: invalidTapOutputKey,
      };

      assert.throws(
        () => assertPsbtMusig2Nonces(nonceKeyValData, participantKeyValData),
        (e: any) => e.message === `invalid size 1. Must use x-only key.`
      );

      participantKeyValData = {
        participantPubKeys: [invalidParticipantPubKeys[0], dummyParticipantPubKeys[0]],
        tapInternalKey: dummyTapInternalKey,
        tapOutputKey: dummyTapOutputKey,
      };
      assert.throws(
        () => assertPsbtMusig2Nonces(nonceKeyValData, participantKeyValData),
        (e: any) => e.message === `invalid size 1. Must use plain key.`
      );

      participantKeyValData = {
        participantPubKeys: [dummyParticipantPubKeys[0], dummyParticipantPubKeys[0]],
        tapInternalKey: dummyTapInternalKey,
        tapOutputKey: dummyTapOutputKey,
      };
      assert.throws(
        () => assertPsbtMusig2Nonces(nonceKeyValData, participantKeyValData),
        (e: any) => e.message === `Duplicate participant pub keys found`
      );
    });

    it(`createTapTweak fails if invalid tapInternalKey or tapMerkleRoot is passed`, function () {
      assert.throws(
        () => createTapTweak(invalidTapInputKey, dummyTapOutputKey),
        (e: any) => e.message === `invalid size 1. Must use x-only key.`
      );

      assert.throws(
        () => createTapTweak(dummyTapInternalKey, invalidTapOutputKey),
        (e: any) => e.message === `invalid size 1. Must use tap merkle root.`
      );
    });

    it(`musig2PartialSign fails if invalid txHash is passed`, function () {
      assert.throws(
        () =>
          musig2PartialSign(
            dummyPrivateKey,
            dummyPubNonce,
            {
              publicKey: dummyParticipantPubKeys[0],
              aggNonce: dummyAggNonce,
              msg: invalidTxHash,
            },
            new Musig2NonceStore()
          ),
        (e: any) => e.message === `invalid size 1. Must use tx hash.`
      );
    });

    it(`encodePsbtMusig2PartialSigKeyKeyValData fails if invalid txHash is passed`, function () {
      assert.throws(
        () =>
          encodePsbtMusig2PartialSig({
            partialSig: invalidPartialSig,
            participantPubKey: dummyParticipantPubKeys[0],
            tapOutputKey: dummyTapOutputKey,
          }),
        (e: any) => e.message === `Invalid partialSig length 1`
      );
    });

    it(`deleteProprietaryKeyVals`, function () {
      const psbt = constructPsbt(p2trMusig2Unspent, rootWalletKeys, 'user', 'bitgo', outputType);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.user);
      psbt.setAllInputsMusig2NonceHD(rootWalletKeys.bitgo);
      const key = {
        identifier: 'DUMMY',
        subtype: 100,
        keydata: dummyTapOutputKey,
      };
      psbt.addProprietaryKeyValToInput(0, { key, value: dummyTapInternalKey });
      psbt.deleteProprietaryKeyVals(0, { identifier: PSBT_PROPRIETARY_IDENTIFIER });
      const keyVal = psbt.getProprietaryKeyVals(0);
      assert.strictEqual(keyVal.length, 1);
      assert.strictEqual(keyVal[0].key.identifier, 'DUMMY');
    });
  });
});
