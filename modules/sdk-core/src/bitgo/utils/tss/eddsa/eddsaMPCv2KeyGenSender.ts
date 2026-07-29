import { KeyCurveEnum, KeyGenTypeEnum, MPCv2KeyGenState } from '@bitgo/public-types';
import { BitGoBase } from '../../../bitgoBase';
import { GenerateEddsaMPCv2KeyRequestBody, GenerateEddsaMPCv2KeyRequestResponse } from './typesEddsaMPCv2';

export type EddsaMPCv2KeyGenSendFn<T extends GenerateEddsaMPCv2KeyRequestResponse> = (
  round: MPCv2KeyGenState,
  payload: GenerateEddsaMPCv2KeyRequestBody
) => Promise<T>;

export function KeyGenSenderForEnterprise<T extends GenerateEddsaMPCv2KeyRequestResponse>(
  bitgo: BitGoBase,
  enterprise: string,
  // Wallet Safes v1 (@experimental): when set, tags the resulting root keys with this safe. WP only reads it on
  // round MPCv2-R1; passing it on a sender used solely for round 1 is sufficient.
  safeId?: string
): EddsaMPCv2KeyGenSendFn<T> {
  return (round, payload) => {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, safeId, type: KeyGenTypeEnum.MPCv2, curveType: KeyCurveEnum.EdDSA, round, payload })
      .result();
  };
}
