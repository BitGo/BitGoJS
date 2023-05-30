import { SessionKey } from '@brandonblack/musig';

import {
  checkPlainPublicKey,
  checkTapMerkleRoot,
  checkTxHash,
  checkXOnlyPublicKey,
  toXOnlyPublicKey,
} from './outputScripts';
import { ecc, musig } from '../noble_ecc';
import { Tuple } from './types';
import { calculateTapTweak, tapTweakPubkey } from '../taproot';
import { Transaction } from '../index';
import { PsbtInput } from 'bip174/src/lib/interfaces';
import {
  getPsbtInputProprietaryKeyVals,
  ProprietaryKeySubtype,
  ProprietaryKeyValue,
  PSBT_PROPRIETARY_IDENTIFIER,
} from './PsbtUtil';

/**
 *  Participant key value object.
 */
export interface PsbtMusig2Participants {
  tapOutputKey: Buffer;
  tapInternalKey: Buffer;
  participantPubKeys: Tuple<Buffer>;
}

export interface PsbtMusig2DeterministicParams {
  privateKey: Buffer;
  otherNonce: Buffer;
  publicKeys: Tuple<Buffer>;
  internalPubKey: Buffer;
  tapTreeRoot: Buffer;
  hash: Buffer;
}

/**
 *  Nonce key value object.
 */
export interface PsbtMusig2PubNonce {
  participantPubKey: Buffer;
  tapOutputKey: Buffer;
  pubNonce: Buffer;
}

/**
 *  Partial signature key value object.
 */
export interface PsbtMusig2PartialSig {
  participantPubKey: Buffer;
  tapOutputKey: Buffer;
  partialSig: Buffer;
}

/**
 * Because musig uses reference-equal buffers to cache nonces, we wrap it here to allow using
 * nonces that are byte-equal but not reference-equal.
 */
export class Musig2NonceStore {
  private nonces: Uint8Array[] = [];

  /**
   * Get original Buffer instance for nonce (which may be a copy).
   * @return byte-equal buffer that is reference-equal to what was stored earlier in createMusig2Nonce
   */
  getRef(nonce: Uint8Array): Uint8Array {
    for (const b of this.nonces) {
      if (Buffer.from(b).equals(nonce)) {
        return b;
      }
    }
    throw new Error(`unknown nonce`);
  }

  /**
   * Creates musig2 nonce and stores buffer reference.
   * tapInternalkey, tapMerkleRoot, tapBip32Derivation for rootWalletKey are required per p2trMusig2 key path input.
   * Also participant keys are required from psbt proprietary key values.
   * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
   * @param privateKey - signer private key
   * @param publicKey - signer xy public key
   * @param xOnlyPublicKey - tweaked aggregated key (tapOutputKey)
   * @param sessionId Additional entropy. If provided it must either be a counter unique to this secret key,
   * (converted to an array of 32 bytes), or 32 uniformly random bytes.
   */
  createMusig2Nonce(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    xOnlyPublicKey: Uint8Array,
    txHash: Uint8Array,
    sessionId?: Buffer
  ): Uint8Array {
    if (txHash.length != 32) {
      throw new Error(`Invalid txHash size ${txHash}`);
    }
    const buf = musig.nonceGen({ secretKey: privateKey, publicKey, xOnlyPublicKey, msg: txHash, sessionId });
    this.nonces.push(buf);
    return buf;
  }
}

/**
 * Psbt proprietary key val util function for participants pub keys. SubType is 0x01
 * Ref: https://gist.github.com/sanket1729/4b525c6049f4d9e034d27368c49f28a6
 * @return x-only tapOutputKey||tapInternalKey as sub keydata, plain sigining participant keys as valuedata
 */
export function encodePsbtMusig2Participants(participants: PsbtMusig2Participants): ProprietaryKeyValue {
  const keydata = [participants.tapOutputKey, participants.tapInternalKey].map((pubkey) => checkXOnlyPublicKey(pubkey));
  const value = participants.participantPubKeys.map((pubkey) => checkPlainPublicKey(pubkey));
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
export function encodePsbtMusig2PubNonce(nonce: PsbtMusig2PubNonce): ProprietaryKeyValue {
  if (nonce.pubNonce.length !== 66) {
    throw new Error(`Invalid pubNonces length ${nonce.pubNonce.length}`);
  }
  const keydata = Buffer.concat([
    checkPlainPublicKey(nonce.participantPubKey),
    checkXOnlyPublicKey(nonce.tapOutputKey),
  ]);
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
    keydata,
  };
  return { key, value: nonce.pubNonce };
}

export function encodePsbtMusig2PartialSig(partialSig: PsbtMusig2PartialSig): ProprietaryKeyValue {
  if (partialSig.partialSig.length !== 32 && partialSig.partialSig.length !== 33) {
    throw new Error(`Invalid partialSig length ${partialSig.partialSig.length}`);
  }
  const keydata = Buffer.concat([
    checkPlainPublicKey(partialSig.participantPubKey),
    checkXOnlyPublicKey(partialSig.tapOutputKey),
  ]);
  const key = {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
    keydata,
  };
  return { key, value: partialSig.partialSig };
}

/**
 * Decodes proprietary key value data for participant pub keys
 * @param kv
 */
export function decodePsbtMusig2Participants(kv: ProprietaryKeyValue): PsbtMusig2Participants {
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

/**
 * Decodes proprietary key value data for musig2 nonce
 * @param kv
 */
export function decodePsbtMusig2Nonce(kv: ProprietaryKeyValue): PsbtMusig2PubNonce {
  if (kv.key.identifier !== PSBT_PROPRIETARY_IDENTIFIER || kv.key.subtype !== ProprietaryKeySubtype.MUSIG2_PUB_NONCE) {
    throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for nonce`);
  }

  const key = kv.key.keydata;
  if (key.length !== 65) {
    throw new Error(`Invalid keydata size ${key.length} for nonce`);
  }

  const value = kv.value;
  if (value.length !== 66) {
    throw new Error(`Invalid valuedata size ${value.length} for nonce`);
  }

  return { participantPubKey: key.subarray(0, 33), tapOutputKey: key.subarray(33), pubNonce: value };
}

/**
 * Decodes proprietary key value data for musig2 partial sig
 * @param kv
 */
export function decodePsbtMusig2PartialSig(kv: ProprietaryKeyValue): PsbtMusig2PartialSig {
  if (
    kv.key.identifier !== PSBT_PROPRIETARY_IDENTIFIER ||
    kv.key.subtype !== ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG
  ) {
    throw new Error(`Invalid identifier ${kv.key.identifier} or subtype ${kv.key.subtype} for partial sig`);
  }

  const key = kv.key.keydata;
  if (key.length !== 65) {
    throw new Error(`Invalid keydata size ${key.length} for partial sig`);
  }

  const value = kv.value;
  if (value.length !== 32 && value.length !== 33) {
    throw new Error(`Invalid valuedata size ${value.length} for partial sig`);
  }

  return { participantPubKey: key.subarray(0, 33), tapOutputKey: key.subarray(33), partialSig: value };
}

export function createTapInternalKey(plainPubKeys: Buffer[]): Buffer {
  return Buffer.from(musig.getXOnlyPubkey(musig.keyAgg(plainPubKeys)));
}

export function createTapOutputKey(internalPubKey: Buffer, tapTreeRoot: Buffer): Buffer {
  return Buffer.from(
    tapTweakPubkey(ecc, toXOnlyPublicKey(internalPubKey), checkTapMerkleRoot(tapTreeRoot)).xOnlyPubkey
  );
}

export function createAggregateNonce(pubNonces: Tuple<Buffer>): Buffer {
  return Buffer.from(musig.nonceAgg(pubNonces));
}

export function createTapTweak(tapInternalKey: Buffer, tapMerkleRoot: Buffer): Buffer {
  return Buffer.from(calculateTapTweak(checkXOnlyPublicKey(tapInternalKey), checkTapMerkleRoot(tapMerkleRoot)));
}

function startMusig2SigningSession(
  aggNonce: Buffer,
  hash: Buffer,
  publicKeys: Tuple<Buffer>,
  tweak: Buffer
): SessionKey {
  return musig.startSigningSession(aggNonce, hash, publicKeys, { tweak, xOnly: true });
}

export function musig2PartialSign(
  privateKey: Buffer,
  publicNonce: Uint8Array,
  sessionKey: SessionKey,
  nonceStore: Musig2NonceStore
): Buffer {
  checkTxHash(Buffer.from(sessionKey.msg));
  return Buffer.from(
    musig.partialSign({
      secretKey: privateKey,
      publicNonce: nonceStore.getRef(publicNonce),
      sessionKey,
    })
  );
}

export function musig2PartialSigVerify(
  sig: Buffer,
  publicKey: Buffer,
  publicNonce: Buffer,
  sessionKey: SessionKey
): boolean {
  checkTxHash(Buffer.from(sessionKey.msg));
  return musig.partialVerify({ sig, publicKey, publicNonce, sessionKey });
}

export function musig2AggregateSigs(sigs: Buffer[], sessionKey: SessionKey): Buffer {
  return Buffer.from(musig.signAgg(sigs, sessionKey));
}

/** @return session key that can be used to reference the session later */
export function createMusig2SigningSession(sessionArgs: {
  pubNonces: Tuple<Buffer>;
  txHash: Buffer;
  pubKeys: Tuple<Buffer>;
  internalPubKey: Buffer;
  tapTreeRoot: Buffer;
}): SessionKey {
  checkTxHash(sessionArgs.txHash);
  const aggNonce = createAggregateNonce(sessionArgs.pubNonces);
  const tweak = createTapTweak(sessionArgs.internalPubKey, sessionArgs.tapTreeRoot);
  return startMusig2SigningSession(aggNonce, sessionArgs.txHash, sessionArgs.pubKeys, tweak);
}

/**
 * @returns psbt proprietary key for musig2 participant key value data
 * If no key value exists, undefined is returned.
 */
export function parsePsbtMusig2Participants(input: PsbtInput): PsbtMusig2Participants | undefined {
  const participantsKeyVals = getPsbtInputProprietaryKeyVals(input, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTICIPANT_PUB_KEYS,
  });

  if (!participantsKeyVals.length) {
    return undefined;
  }

  if (participantsKeyVals.length > 1) {
    throw new Error(`Found ${participantsKeyVals.length} matching participant key value instead of 1`);
  }

  return decodePsbtMusig2Participants(participantsKeyVals[0]);
}

/**
 * @returns psbt proprietary key for musig2 public nonce key value data
 * If no key value exists, undefined is returned.
 */
export function parsePsbtMusig2Nonces(input: PsbtInput): PsbtMusig2PubNonce[] | undefined {
  const nonceKeyVals = getPsbtInputProprietaryKeyVals(input, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PUB_NONCE,
  });

  if (!nonceKeyVals.length) {
    return undefined;
  }

  if (nonceKeyVals.length > 2) {
    throw new Error(`Found ${nonceKeyVals.length} matching nonce key value instead of 1 or 2`);
  }

  return nonceKeyVals.map((kv) => decodePsbtMusig2Nonce(kv));
}

/**
 * @returns psbt proprietary key for musig2 partial sig key value data
 * If no key value exists, undefined is returned.
 */
export function parsePsbtMusig2PartialSigs(input: PsbtInput): PsbtMusig2PartialSig[] | undefined {
  const sigKeyVals = getPsbtInputProprietaryKeyVals(input, {
    identifier: PSBT_PROPRIETARY_IDENTIFIER,
    subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
  });

  if (!sigKeyVals.length) {
    return undefined;
  }

  if (sigKeyVals.length > 2) {
    throw new Error(`Found ${sigKeyVals.length} matching partial signature key value instead of 1 or 2`);
  }

  return sigKeyVals.map((kv) => decodePsbtMusig2PartialSig(kv));
}

/**
 * Assert musig2 participant key value data with tapInternalKey and tapMerkleRoot.
 * <tapOutputKey><tapInputKey> => <participantKey1><participantKey2>
 * Using tapMerkleRoot and 2 participant keys, the tapInputKey is validated and using tapMerkleRoot and tapInputKey,
 * the tapOutputKey is validated.
 */
export function assertPsbtMusig2Participants(
  participantKeyValData: PsbtMusig2Participants,
  tapInternalKey: Buffer,
  tapMerkleRoot: Buffer
): void {
  checkXOnlyPublicKey(tapInternalKey);
  checkTapMerkleRoot(tapMerkleRoot);

  const participantPubKeys = participantKeyValData.participantPubKeys;

  const internalKey = createTapInternalKey(participantPubKeys);
  if (!internalKey.equals(participantKeyValData.tapInternalKey)) {
    throw new Error('Invalid participants keydata tapInternalKey');
  }

  const outputKey = createTapOutputKey(internalKey, tapMerkleRoot);
  if (!outputKey.equals(participantKeyValData.tapOutputKey)) {
    throw new Error('Invalid participants keydata tapOutputKey');
  }

  if (!internalKey.equals(tapInternalKey)) {
    throw new Error('tapInternalKey and aggregated participant pub keys does not match');
  }
}

/**
 * Assert musig2 public nonce key value data with participant key value data
 * (refer assertPsbtMusig2ParticipantsKeyValData).
 * <participantKey1><tapOutputKey> => <pubNonce1>
 * <participantKey2><tapOutputKey> => <pubNonce2>
 * Checks against participant keys and tapOutputKey
 */
export function assertPsbtMusig2Nonces(
  noncesKeyValData: PsbtMusig2PubNonce[],
  participantKeyValData: PsbtMusig2Participants
): void {
  checkXOnlyPublicKey(participantKeyValData.tapOutputKey);
  participantKeyValData.participantPubKeys.forEach((kv) => checkPlainPublicKey(kv));
  if (participantKeyValData.participantPubKeys[0].equals(participantKeyValData.participantPubKeys[1])) {
    throw new Error(`Duplicate participant pub keys found`);
  }

  if (noncesKeyValData.length > 2) {
    throw new Error(`Invalid nonce key value count ${noncesKeyValData.length}`);
  }

  noncesKeyValData.forEach((nonceKv) => {
    const index = participantKeyValData.participantPubKeys.findIndex((pubKey) =>
      nonceKv.participantPubKey.equals(pubKey)
    );
    if (index < 0) {
      throw new Error('Invalid nonce keydata participant pub key');
    }

    if (!nonceKv.tapOutputKey.equals(participantKeyValData.tapOutputKey)) {
      throw new Error('Invalid nonce keydata tapOutputKey');
    }
  });
}

/**
 * @returns Input object but sig hash type data is taken out from partialSig field.
 * If sig hash type is not common for all sigs, error out, otherwise returns the modified object and single hash type.
 */
export function getSigHashTypeFromSigs(partialSigs: PsbtMusig2PartialSig[]): {
  partialSigs: PsbtMusig2PartialSig[];
  sigHashType: number;
} {
  if (!partialSigs.length) {
    throw new Error('partialSigs array can not be empty');
  }
  const pSigsWithHashType = partialSigs.map((kv) => {
    const { partialSig, participantPubKey, tapOutputKey } = kv;
    return partialSig.length === 33
      ? { pSig: { partialSig: partialSig.slice(0, 32), participantPubKey, tapOutputKey }, sigHashType: partialSig[32] }
      : { pSig: { partialSig, participantPubKey, tapOutputKey }, sigHashType: Transaction.SIGHASH_DEFAULT };
  });

  const sigHashType = pSigsWithHashType[0].sigHashType;
  if (!pSigsWithHashType.every((pSig) => pSig.sigHashType === sigHashType)) {
    throw new Error('signatures must use same sig hash type');
  }

  return { partialSigs: pSigsWithHashType.map(({ pSig }) => pSig), sigHashType };
}

export function createMusig2DeterministicNonce(params: PsbtMusig2DeterministicParams): Buffer {
  return Buffer.from(
    musig.deterministicNonceGen({
      secretKey: params.privateKey,
      aggOtherNonce: musig.nonceAgg([params.otherNonce]),
      publicKeys: params.publicKeys,
      tweaks: [{ tweak: createTapTweak(params.internalPubKey, params.tapTreeRoot), xOnly: true }],
      msg: params.hash,
    }).publicNonce
  );
}

export function musig2DeterministicSign(params: PsbtMusig2DeterministicParams): {
  sig: Buffer;
  sessionKey: SessionKey;
  publicNonce: Buffer;
} {
  const { sig, sessionKey, publicNonce } = musig.deterministicSign({
    secretKey: params.privateKey,
    aggOtherNonce: musig.nonceAgg([params.otherNonce]),
    publicKeys: params.publicKeys,
    tweaks: [{ tweak: createTapTweak(params.internalPubKey, params.tapTreeRoot), xOnly: true }],
    msg: params.hash,
  });
  return { sig: Buffer.from(sig), sessionKey, publicNonce: Buffer.from(publicNonce) };
}
