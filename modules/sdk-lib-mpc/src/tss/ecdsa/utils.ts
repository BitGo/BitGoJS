import { bigIntToHex, convertBigIntArrToHexArr, convertHexArrToBigIntArr, hexToBigInt } from '@bitgo/sdk-core';
import {
  DeserializedNtilde,
  DeserializedNtildeWithProofs,
  SerializedNtilde,
  SerializedNtildeWithProofs,
} from './types';

/**
 * Deserializes a challenge from hex strings to bigint
 * @param challenge
 */
export function deserializeNtilde(challenge: SerializedNtilde): DeserializedNtilde {
  return {
    ntilde: hexToBigInt(challenge.ntilde),
    h1: hexToBigInt(challenge.h1),
    h2: hexToBigInt(challenge.h2),
  };
}

/**
 * Deserializes a challenge and it's proofs from hex strings to bigint
 * @param challenge
 */
export function deserializeNtildeWithProofs(challenge: SerializedNtildeWithProofs): DeserializedNtildeWithProofs {
  return {
    ...deserializeNtilde(challenge),
    ntildeProof: {
      h1WrtH2: {
        alpha: convertHexArrToBigIntArr(challenge.ntildeProof.h1WrtH2.alpha),
        t: convertHexArrToBigIntArr(challenge.ntildeProof.h1WrtH2.t),
      },
      h2WrtH1: {
        alpha: convertHexArrToBigIntArr(challenge.ntildeProof.h2WrtH1.alpha),
        t: convertHexArrToBigIntArr(challenge.ntildeProof.h2WrtH1.t),
      },
    },
  };
}

/**
 * Serializes a challenge from big int to hex strings.
 * @param challenge
 */
export function serializeNtilde(challenge: DeserializedNtilde): SerializedNtilde {
  return {
    ntilde: bigIntToHex(challenge.ntilde),
    h1: bigIntToHex(challenge.h1),
    h2: bigIntToHex(challenge.h2),
  };
}

/**
 * Serializes a challenge and it's proofs from big int to hex strings.
 * @param challenge
 */
export function serializeNtildeWithProofs(challenge: DeserializedNtildeWithProofs): SerializedNtildeWithProofs {
  return {
    ...serializeNtilde(challenge),
    ntildeProof: {
      h1WrtH2: {
        alpha: convertBigIntArrToHexArr(challenge.ntildeProof.h1WrtH2.alpha),
        t: convertBigIntArrToHexArr(challenge.ntildeProof.h1WrtH2.t),
      },
      h2WrtH1: {
        alpha: convertBigIntArrToHexArr(challenge.ntildeProof.h2WrtH1.alpha),
        t: convertBigIntArrToHexArr(challenge.ntildeProof.h2WrtH1.t),
      },
    },
  };
}
