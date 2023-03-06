import { PSBT_PROPRIETARY_IDENTIFIER, ProprietaryKeyValueData, UtxoPsbt, ProprietaryKeySubtype } from './UtxoPsbt';
import { checkPlainPublicKey, checkXOnlyPublicKey, toXOnlyPublicKey } from './outputScripts';
import { BIP32Interface } from 'bip32';
import { ecc, musig } from '../noble_ecc';
import { Tuple } from './types';
import { tapTweakPubkey } from '../taproot';
import { TapBip32Derivation } from 'bip174/src/lib/interfaces';
import { checkForInput } from 'bip174/src/lib/utils';

/**
 *  Participant key value object.
 */
export interface PsbtMusig2ParticipantsKeyValueData {
  tapOutputKey: Buffer;
  tapInternalKey: Buffer;
  participantPubKeys: Tuple<Buffer>;
}

/**
 *  Nonce key value object.
 */
export interface PsbtMusig2NoncesKeyValueData {
  participantPubKey: Buffer;
  tapOutputKey: Buffer;
  pubNonces: Buffer;
}

/**
 * Psbt proprietary key val util function for participants pub keys. SubType is 0x01
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return x-only tapOutputKey||tapInternalKey as sub keydata, plain sigining participant keys as valuedata
 */
export function encodePsbtMusig2ParticipantsKeyValData(
  participantsKeyValData: PsbtMusig2ParticipantsKeyValueData
): ProprietaryKeyValueData {
  const keydata = [participantsKeyValData.tapOutputKey, participantsKeyValData.tapInternalKey].map((pubkey) =>
    checkXOnlyPublicKey(pubkey)
  );
  const value = participantsKeyValData.participantPubKeys.map((pubkey) => checkPlainPublicKey(pubkey));
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
    keydata: Buffer.concat(keydata),
  };
  return { key, value: Buffer.concat(value) };
}

/**
 * Psbt proprietary key val util function for pub nonce. SubType is 0x02
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return plain-participantPubKey||x-only-tapOutputKey as sub keydata, 66 bytes of 2 pub nonces as valuedata
 */
export function encodePsbtMusig2PubNonceKeyValData(
  noncesKeyValueData: PsbtMusig2NoncesKeyValueData
): ProprietaryKeyValueData {
  if (noncesKeyValueData.pubNonces.length !== 66) {
    throw new Error(`Invalid pubNonces length ${noncesKeyValueData.pubNonces.length}`);
  }
  const keydata = Buffer.concat([
    checkPlainPublicKey(noncesKeyValueData.participantPubKey),
    checkXOnlyPublicKey(noncesKeyValueData.tapOutputKey),
  ]);
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
    keydata,
  };
  return { key, value: noncesKeyValueData.pubNonces };
}

/**
 * Decodes proprietary key value data for participant pub keys
 * @param kv
 */
export function decodePsbtMusig2ParticipantsKeyValData(
  kv: ProprietaryKeyValueData
): PsbtMusig2ParticipantsKeyValueData {
  if (
    kv.key.identifier !== PSBT_PROPRIETARY_IDENTIFIER ||
    kv.key.subtype !== ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS
  ) {
    throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for participants pub keys`);
  }

  const key = kv.key.keydata;
  if (key.length !== 64) {
    throw new Error(`Invalid keydata size ${key.length} for participant pub keys`);
  }

  const value = kv.value;
  if (value.length !== 66) {
    throw new Error(`Invalid valuedata size ${value.length} for participant pub keys`);
  }
  const participantPubKeys: Tuple<Buffer> = [value.subarray(0, 33), value.subarray(33)];
  if (participantPubKeys[0].equals(participantPubKeys[1])) {
    throw new Error(`Duplicate participant pub keys found`);
  }

  return { tapOutputKey: key.subarray(0, 32), tapInternalKey: key.subarray(32), participantPubKeys };
}

export function createTapInternalKey(plainPubKeys: Buffer[]): Buffer {
  plainPubKeys.forEach((pubKey) => checkPlainPublicKey(pubKey));
  return Buffer.from(musig.getXOnlyPubkey(musig.keyAgg(musig.keySort(plainPubKeys))));
}

export function createTapOutputKey(internalPubKey: Buffer, tapTreeRoot: Buffer): Buffer {
  if (tapTreeRoot.length !== 32) {
    throw new Error(`Invalid tapTreeRoot size ${tapTreeRoot.length}`);
  }
  return Buffer.from(tapTweakPubkey(ecc, toXOnlyPublicKey(internalPubKey), tapTreeRoot).xOnlyPubkey);
}

function deriveWalletPubKey(tapBip32Derivations: TapBip32Derivation[], rootWalletKey: BIP32Interface): Buffer {
  const myDerivations = tapBip32Derivations.filter((bipDv) => {
    return bipDv.masterFingerprint.equals(rootWalletKey.fingerprint);
  });

  if (!myDerivations.length) {
    throw new Error('Need one tapBip32Derivation masterFingerprint to match the rootWalletKey fingerprint');
  }

  const myDerivation = myDerivations.filter((bipDv) => {
    const publicKey = rootWalletKey.derivePath(bipDv.path).publicKey;
    return bipDv.pubkey.equals(toXOnlyPublicKey(publicKey));
  });

  if (myDerivation.length !== 1) {
    throw new Error('root wallet key should derive one tapBip32Derivation');
  }
  return rootWalletKey.derivePath(myDerivation[0].path).publicKey;
}

function getMusig2NonceKeyValueData(
  psbt: UtxoPsbt,
  inputIndex: number,
  rootWalletKey: BIP32Interface,
  sessionId?: Buffer
): ProprietaryKeyValueData | undefined {
  const input = checkForInput(psbt.data.inputs, inputIndex);
  if (!input.tapInternalKey) {
    return;
  }

  if (!input.tapMerkleRoot) {
    throw new Error('tapMerkleRoot is required to generate nonce');
  }

  if (!input.tapBip32Derivation?.length) {
    throw new Error('tapBip32Derivation is required to generate nonce');
  }

  const participantsKeyVals = psbt.getProprietaryKeyVals(inputIndex, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
  });

  if (participantsKeyVals.length !== 1) {
    throw new Error(`Found ${participantsKeyVals.length} matching participant key value instead of 1`);
  }

  const participantKeyValData = decodePsbtMusig2ParticipantsKeyValData(participantsKeyVals[0]);
  const participantPubKeys = participantKeyValData.participantPubKeys;

  const tapInternalKey = createTapInternalKey(participantPubKeys);
  if (!tapInternalKey.equals(participantKeyValData.tapInternalKey)) {
    throw new Error('Invalid participants keyata tapInternalKey');
  }

  const tapOutputKey = createTapOutputKey(tapInternalKey, input.tapMerkleRoot);
  if (!tapOutputKey.equals(participantKeyValData.tapOutputKey)) {
    throw new Error('Invalid participants keyata tapOutputKey');
  }

  if (!tapInternalKey.equals(input.tapInternalKey)) {
    throw new Error('tapInternalKey and aggregated participant pub keys does not match');
  }

  const derivedPubKey = deriveWalletPubKey(input.tapBip32Derivation, rootWalletKey);
  const participantPubKey = participantPubKeys.find((pubKey) => pubKey.equals(derivedPubKey));

  if (!Buffer.isBuffer(participantPubKey)) {
    throw new Error('participant plain pub key should match one tapBip32Derivation plain pub key');
  }

  const { hash } = psbt.getTaprootHashForSigChecked(inputIndex);

  const nonceGenArgs = {
    sessionId,
    publicKey: participantPubKey,
    xOnlyPublicKey: tapOutputKey,
    msg: hash,
    secretKey: rootWalletKey.privateKey,
  };

  const pubNonces = Buffer.from(musig.nonceGen(nonceGenArgs));

  return encodePsbtMusig2PubNonceKeyValData({
    participantPubKey,
    tapOutputKey,
    pubNonces,
  });
}

/**
 * Generates and sets Musig2 nonces to p2trMusig2 key path spending inputs.
 * tapInternalkey, tapMerkleRoot, tapBip32Derivation for rootWalletKey are required per p2trMusig2 key path input.
 * Also participant keys are required from psbt proprietary key values.
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @param psbt
 * @param rootWalletKey
 * @param sessionId If provided it must either be a counter unique to this secret key,
 * (converted to an array of 32 bytes), or 32 uniformly random bytes.
 */
export function setMusig2Nonces(psbt: UtxoPsbt, rootWalletKey: BIP32Interface, sessionId?: Buffer): void {
  if (rootWalletKey.isNeutered()) {
    throw new Error('private key is required to generate nonce');
  }
  if (Buffer.isBuffer(sessionId) && sessionId.length !== 32) {
    throw new Error(`Invalid sessionId size ${sessionId.length}`);
  }
  psbt.data.inputs.forEach((input, inputIndex) => {
    const noncesKeyValueData = getMusig2NonceKeyValueData(psbt, inputIndex, rootWalletKey, sessionId);
    if (noncesKeyValueData) {
      psbt.addProprietaryKeyValToInput(inputIndex, noncesKeyValueData);
    }
  });
}
