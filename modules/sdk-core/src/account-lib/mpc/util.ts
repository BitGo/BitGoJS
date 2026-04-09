import {
  bigIntFromBufferLE,
  bigIntToBufferLE,
  bigIntFromU8ABE,
  bigIntFromBufferBE,
  bigIntToBufferBE,
  clamp,
  getPaillierPublicKey,
  DklsUtils,
  DklsTypes,
} from '@bitgo/sdk-lib-mpc';

/**
 * Combines serialized partial signatures from parties participating in DSG.
 * @param round4DsgMessages - round 4 serialized broadcast messages payloads from participating parties
 * @returns {DklsTypes.SerializedDklsSignature} - serialized final signature
 */
export function combineRound4DklsDsgMessages(
  round4DsgMessages: DklsTypes.SerializedBroadcastMessage[]
): DklsTypes.SerializedDklsSignature {
  const round4DsgMessagesDeser = round4DsgMessages.map(DklsTypes.deserializeBroadcastMessage);
  const messagesWithR = round4DsgMessagesDeser.filter((m) => m.signatureR !== undefined);
  if (messagesWithR.length === 0) {
    throw Error('None of the round 4 Dkls messages contain a Signature.R value.');
  }
  const rValues = messagesWithR.map((m) => Buffer.from(m.signatureR as Uint8Array).toString('hex'));
  if (!rValues.every((r) => r === rValues[0])) {
    throw new Error('signatureR mismatch across parties — possible protocol attack');
  }
  const signatureR = messagesWithR[0].signatureR as Uint8Array;
  const signatureDeser = DklsUtils.combinePartialSignatures(
    round4DsgMessagesDeser.map((m) => m.payload),
    Buffer.from(signatureR).toString('hex')
  );
  return {
    R: Buffer.from(signatureDeser.R).toString('hex'),
    S: Buffer.from(signatureDeser.S).toString('hex'),
  };
}

/**
 * @deprecated - use exported methods from @bitgo/sdk-lib-mpc instead
 */
export {
  bigIntFromBufferLE,
  bigIntToBufferLE,
  bigIntFromU8ABE,
  bigIntFromBufferBE,
  bigIntToBufferBE,
  clamp,
  getPaillierPublicKey,
};
