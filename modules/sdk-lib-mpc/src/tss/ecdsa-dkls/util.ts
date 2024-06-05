import { secp256k1 as secp } from '@noble/curves/secp256k1';
import { HDTree, Secp256k1Bip32HdTree, Secp256k1Curve } from '../../curves';
import { bigIntFromBufferBE, bigIntToBufferBE } from '../../util';
import { DeserializedDklsSignature, DeserializedMessages, RetrofitData } from './types';
import { decode } from 'cbor-x';
import * as secp256k1 from 'secp256k1';
import { createHash, Hash } from 'crypto';
import { Dsg } from './dsg';
import { Dkg } from './dkg';
import assert from 'assert';

const delimeter = ':';

/**
 * Combines partial signatures from parties participating in DSG.
 * @param round4MessagePayloads - round 4 message payloads from participating parties
 * @param rHex - hex representation of the r value in the signature
 * @returns {DeserializedMessages} - messages to send to other parties for the next round
 */
export function combinePartialSignatures(round4MessagePayloads: Uint8Array[], rHex: string): DeserializedDklsSignature {
  const r = bigIntFromBufferBE(Buffer.from(rHex, 'hex').subarray(1));
  const s0Arr = round4MessagePayloads.map((p) => decode(p).s_0);
  const s1Arr = round4MessagePayloads.map((p) => decode(p).s_1);
  const s0BigInts = s0Arr.map((s0) => bigIntFromBufferBE(Buffer.from(s0)));
  const s1BigInts = s1Arr.map((s1) => bigIntFromBufferBE(Buffer.from(s1)));
  const secp256k1Curve = new Secp256k1Curve();
  const s0Sum = s0BigInts.slice(1).reduce((sumSoFar, s0) => secp256k1Curve.scalarAdd(sumSoFar, s0), s0BigInts[0]);
  const s1Sum = s1BigInts.slice(1).reduce((sumSoFar, s1) => secp256k1Curve.scalarAdd(sumSoFar, s1), s1BigInts[0]);
  const s = secp256k1Curve.scalarMult(s0Sum, secp256k1Curve.scalarInvert(s1Sum));
  const sig = new secp.Signature(r, s);
  const normalizedSig = sig.normalizeS();
  return {
    R: new Uint8Array(bigIntToBufferBE(normalizedSig.r, 32)),
    S: new Uint8Array(bigIntToBufferBE(normalizedSig.s, 32)),
  };
}

/**
 * Verify a DKLs Signature and serialize it to recid:r:s:publickey format.
 * @param message - message that was signed.
 * @param dklsSignature - R and S values of the ECDSA signature.
 * @param commonKeychain - public key appended to chaincode in hex.
 * @param derivationPath - optional derivation path to derive on the commonkeychain before verification.
 * @param hash - optional hash function to apply on message before verifying. Default is sha256.
 * @param shouldHash - flag to determine whether message should be hashed before verifying.
 * @returns {string} - serialized signature in `recid:r:s:publickey` format
 */
export function verifyAndConvertDklsSignature(
  message: Buffer,
  dklsSignature: DeserializedDklsSignature,
  commonKeychain: string,
  derivationPath?: string,
  hash?: Hash,
  shouldHash = true
): string {
  let truePub = '';
  if (derivationPath && derivationPath !== 'm') {
    const hdTree: HDTree = new Secp256k1Bip32HdTree();
    const derivedPub = hdTree.publicDerive(
      {
        pk: bigIntFromBufferBE(Buffer.from(commonKeychain.slice(0, 66), 'hex')),
        chaincode: bigIntFromBufferBE(Buffer.from(commonKeychain.slice(66), 'hex')),
      },
      derivationPath
    );
    truePub = bigIntToBufferBE(derivedPub.pk).toString('hex');
  } else {
    truePub = commonKeychain.slice(0, 66);
  }
  const messageToVerify = shouldHash ? (hash || createHash('sha256')).update(message).digest() : message;
  const pub0 = secp256k1.ecdsaRecover(Buffer.concat([dklsSignature.R, dklsSignature.S]), 0, messageToVerify, true);
  const pub1 = secp256k1.ecdsaRecover(Buffer.concat([dklsSignature.R, dklsSignature.S]), 1, messageToVerify, true);
  let recId: number;
  if (truePub === Buffer.from(pub0).toString('hex')) {
    recId = 0;
  } else if (truePub === Buffer.from(pub1).toString('hex')) {
    recId = 1;
  } else {
    throw Error('Invalid Signature');
  }
  return `${recId}${delimeter}${Buffer.from(dklsSignature.R).toString('hex')}${delimeter}${Buffer.from(
    dklsSignature.S
  ).toString('hex')}${delimeter}${truePub}`;
}

export async function executeTillRound(
  round: number,
  party1Dsg: Dsg,
  party2Dsg: Dsg
): Promise<DeserializedMessages[] | DeserializedDklsSignature> {
  if (round < 1 || round > 5) {
    throw Error('Invalid round number');
  }
  const party1Round1Message = await party1Dsg.init();
  const party2Round1Message = await party2Dsg.init();

  const party2Round2Messages = party2Dsg.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [party1Round1Message],
  });
  const party1Round2Messages = party1Dsg.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [party2Round1Message],
  });
  if (round === 2) return [party1Round2Messages, party2Round2Messages];

  const party1Round3Messages = party1Dsg.handleIncomingMessages({
    p2pMessages: party2Round2Messages.p2pMessages,
    broadcastMessages: [],
  });
  const party2Round3Messages = party2Dsg.handleIncomingMessages({
    p2pMessages: party1Round2Messages.p2pMessages,
    broadcastMessages: [],
  });
  if (round === 3) return [party1Round3Messages, party2Round3Messages];

  const party2Round4Messages = party2Dsg.handleIncomingMessages({
    p2pMessages: party1Round3Messages.p2pMessages,
    broadcastMessages: [],
  });
  const party1Round4Messages = party1Dsg.handleIncomingMessages({
    p2pMessages: party2Round3Messages.p2pMessages,
    broadcastMessages: [],
  });
  if (round === 4) return [party1Round4Messages, party2Round4Messages];

  party1Dsg.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: party2Round4Messages.broadcastMessages,
  });
  party2Dsg.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: party1Round4Messages.broadcastMessages,
  });
  assert(Buffer.from(party1Dsg.signature.R).toString('hex') === Buffer.from(party2Dsg.signature.R).toString('hex'));
  assert(Buffer.from(party1Dsg.signature.S).toString('hex') === Buffer.from(party2Dsg.signature.S).toString('hex'));
  return party1Dsg.signature;
}

export async function generateDKGKeyShares(
  retrofitDataA?: RetrofitData,
  retrofitDataB?: RetrofitData,
  retrofitDataC?: RetrofitData
): Promise<[Dkg, Dkg, Dkg]> {
  const user = new Dkg(3, 2, 0, retrofitDataA);
  const backup = new Dkg(3, 2, 1, retrofitDataB);
  const bitgo = new Dkg(3, 2, 2, retrofitDataC);
  const userRound1Message = await user.initDkg();
  const backupRound1Message = await backup.initDkg();
  const bitgoRound1Message = await bitgo.initDkg();
  const userRound2Messages = user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [bitgoRound1Message, backupRound1Message],
  });
  const backupRound2Messages = backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [userRound1Message, bitgoRound1Message],
  });
  const bitgoRound2Messages = bitgo.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [userRound1Message, backupRound1Message],
  });
  const userRound3Messages = user.handleIncomingMessages({
    p2pMessages: backupRound2Messages.p2pMessages
      .filter((m) => m.to === 0)
      .concat(bitgoRound2Messages.p2pMessages.filter((m) => m.to === 0)),
    broadcastMessages: [],
  });
  const backupRound3Messages = backup.handleIncomingMessages({
    p2pMessages: bitgoRound2Messages.p2pMessages
      .filter((m) => m.to === 1)
      .concat(userRound2Messages.p2pMessages.filter((m) => m.to === 1)),
    broadcastMessages: [],
  });
  const bitgoRound3Messages = bitgo.handleIncomingMessages({
    p2pMessages: backupRound2Messages.p2pMessages
      .filter((m) => m.to === 2)
      .concat(userRound2Messages.p2pMessages.filter((m) => m.to === 2)),
    broadcastMessages: [],
  });
  const userRound4Messages = user.handleIncomingMessages({
    p2pMessages: backupRound3Messages.p2pMessages
      .filter((m) => m.to === 0)
      .concat(bitgoRound3Messages.p2pMessages.filter((m) => m.to === 0)),
    broadcastMessages: [],
  });
  const backupRound4Messages = backup.handleIncomingMessages({
    p2pMessages: bitgoRound3Messages.p2pMessages
      .filter((m) => m.to === 1)
      .concat(userRound3Messages.p2pMessages.filter((m) => m.to === 1)),
    broadcastMessages: [],
  });
  const bitgoRound4Messages = bitgo.handleIncomingMessages({
    p2pMessages: backupRound3Messages.p2pMessages
      .filter((m) => m.to === 2)
      .concat(userRound3Messages.p2pMessages.filter((m) => m.to === 2)),
    broadcastMessages: [],
  });
  user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: bitgoRound4Messages.broadcastMessages.concat(backupRound4Messages.broadcastMessages),
  });
  bitgo.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: backupRound4Messages.broadcastMessages.concat(userRound4Messages.broadcastMessages),
  });
  backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: bitgoRound4Messages.broadcastMessages.concat(userRound4Messages.broadcastMessages),
  });
  return [user, backup, bitgo];
}

export async function generate2of2KeyShares(
  retrofitDataA?: RetrofitData,
  retrofitDataB?: RetrofitData
): Promise<[Dkg, Dkg]> {
  const partyA = new Dkg(2, 2, 0, retrofitDataA);
  const partyB = new Dkg(2, 2, 1, retrofitDataB);
  const partyARound1Message = await partyA.initDkg();
  const partyBRound1Message = await partyB.initDkg();
  const partyARound2Messages = partyA.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [partyBRound1Message],
  });
  const partyBRound2Messages = partyB.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [partyARound1Message],
  });
  const partyARound3Messages = partyA.handleIncomingMessages({
    p2pMessages: partyBRound2Messages.p2pMessages.filter((m) => m.to === 0),
    broadcastMessages: [],
  });
  const partyBRound3Messages = partyB.handleIncomingMessages({
    p2pMessages: partyARound2Messages.p2pMessages.filter((m) => m.to === 1),
    broadcastMessages: [],
  });
  const partyARound4Messages = partyA.handleIncomingMessages({
    p2pMessages: partyBRound3Messages.p2pMessages.filter((m) => m.to === 0),
    broadcastMessages: [],
  });
  const partyBRound4Messages = partyB.handleIncomingMessages({
    p2pMessages: partyARound3Messages.p2pMessages.filter((m) => m.to === 1),
    broadcastMessages: [],
  });
  partyA.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: partyBRound4Messages.broadcastMessages,
  });
  partyB.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: partyARound4Messages.broadcastMessages,
  });
  return [partyA, partyB];
}
