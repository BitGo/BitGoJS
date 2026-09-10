import { KeyGenTypeEnum, MPCv2KeyGenState } from '@bitgo/public-types';
import {
  GenerateMPCv2DeriveKeyRequest,
  GenerateMPCv2DeriveKeyRequestResponse,
  GenerateMPCv2KeyRequestBody,
  GenerateMPCv2KeyRequestResponse,
} from './typesMPCv2';
import { BitGoBase } from '../../../bitgoBase';

export type EcdsaMPCv2KeyGenSendFn<T extends GenerateMPCv2KeyRequestResponse> = (
  round: MPCv2KeyGenState,
  payload: GenerateMPCv2KeyRequestBody & { walletId?: string }
) => Promise<T>;

export function KeyGenSenderForEnterprise<T extends GenerateMPCv2KeyRequestResponse>(
  bitgo: BitGoBase,
  enterprise: string,
  // @experimental: when set, tags the resulting root keys with this safe. Only read
  // on round MPCv2-R1; passing it on a sender used solely for round 1 is sufficient.
  safeId?: string
): EcdsaMPCv2KeyGenSendFn<T> {
  return (round, payload) => {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, safeId, type: KeyGenTypeEnum.MPCv2, round, payload })
      .result();
  };
}

export type EcdsaMPCv2DeriveKeySendFn<T extends GenerateMPCv2DeriveKeyRequestResponse> = (
  round: MPCv2KeyGenState,
  payload: GenerateMPCv2DeriveKeyRequest
) => Promise<T>;

/**
 * Round sender for the safe-child hard-derivation ceremony. The derive rounds use
 * the same endpoint as MPCv2 keygen (`/mpc/generatekey`), dispatched by the
 * `MPCv2Derive-R*` round values. `parentKeyId` and `derivationIndex` live on the
 * R1 payload (public-types' `MPCv2DeriveRound1Request`), not on the generatekey body.
 */
export function KeyGenSenderForSafeChild<T extends GenerateMPCv2DeriveKeyRequestResponse>(
  bitgo: BitGoBase,
  enterprise: string,
  safeId: string
): EcdsaMPCv2DeriveKeySendFn<T> {
  return (round, payload) => {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({
        enterprise,
        safeId,
        type: KeyGenTypeEnum.MPCv2,
        round,
        payload,
      })
      .result();
  };
}
