import { bigIntToHex, convertBigIntArrToHexArr, convertHexArrToBigIntArr, hexToBigInt } from '@bitgo/sdk-core';
import { DeserializedNtilde, SerializedNtilde } from './types';

/**
 * Deserializes a challenge and it's proofs from hex strings to bigint
 * @param challenge
 */
export function deserializeNtilde(challenge: SerializedNtilde): DeserializedNtilde {
  const deserializedNtilde: DeserializedNtilde = {
    ntilde: hexToBigInt(challenge.ntilde),
    h1: hexToBigInt(challenge.h1),
    h2: hexToBigInt(challenge.h2),
  };
  if (challenge.ntildeProof) {
    deserializedNtilde.ntildeProof = {
      h1WrtH2: {
        alpha: convertHexArrToBigIntArr(challenge.ntildeProof.h1WrtH2.alpha),
        t: convertHexArrToBigIntArr(challenge.ntildeProof.h1WrtH2.t),
      },
      h2WrtH1: {
        alpha: convertHexArrToBigIntArr(challenge.ntildeProof.h2WrtH1.alpha),
        t: convertHexArrToBigIntArr(challenge.ntildeProof.h2WrtH1.t),
      },
    };
  }
  return deserializedNtilde;
}

/**
 * Serializes a challenge and it's proofs from big int to hex strings.
 * @param challenge
 */
export function serializeNtilde(challenge: DeserializedNtilde): SerializedNtilde {
  const serializedNtilde: SerializedNtilde = {
    ntilde: bigIntToHex(challenge.ntilde),
    h1: bigIntToHex(challenge.h1),
    h2: bigIntToHex(challenge.h2),
  };
  if (challenge.ntildeProof) {
    serializedNtilde.ntildeProof = {
      h1WrtH2: {
        alpha: convertBigIntArrToHexArr(challenge.ntildeProof.h1WrtH2.alpha),
        t: convertBigIntArrToHexArr(challenge.ntildeProof.h1WrtH2.t),
      },
      h2WrtH1: {
        alpha: convertBigIntArrToHexArr(challenge.ntildeProof.h2WrtH1.alpha),
        t: convertBigIntArrToHexArr(challenge.ntildeProof.h2WrtH1.t),
      },
    };
  }
  return serializedNtilde;
}
