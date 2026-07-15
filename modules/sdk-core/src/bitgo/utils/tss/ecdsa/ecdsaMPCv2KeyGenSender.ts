import { KeyGenTypeEnum, MPCv2KeyGenState } from '@bitgo/public-types';
import { GenerateMPCv2KeyRequestBody, GenerateMPCv2KeyRequestResponse } from './typesMPCv2';
import { BitGoBase } from '../../../bitgoBase';

export type EcdsaMPCv2KeyGenSendFn<T extends GenerateMPCv2KeyRequestResponse> = (
  round: MPCv2KeyGenState,
  payload: GenerateMPCv2KeyRequestBody & { walletId?: string }
) => Promise<T>;

export function KeyGenSenderForEnterprise<T extends GenerateMPCv2KeyRequestResponse>(
  bitgo: BitGoBase,
  enterprise: string,
  // Wallet Safes v1 (@experimental): when set, tags the resulting root keys with this safe. WP only reads it on
  // round MPCv2-R1; passing it on a sender used solely for round 1 is sufficient.
  safeId?: string
): EcdsaMPCv2KeyGenSendFn<T> {
  return (round, payload) => {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, safeId, type: KeyGenTypeEnum.MPCv2, round, payload })
      .result();
  };
}
