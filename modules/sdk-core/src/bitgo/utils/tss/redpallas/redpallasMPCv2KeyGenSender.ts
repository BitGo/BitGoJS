import * as t from 'io-ts';
import {
  KeyCurveEnum,
  KeyGenTypeEnum,
  MPCv2KeyGenState,
  RedpallasMPCv2KeyGenRound1Request,
  RedpallasMPCv2KeyGenRound1Response,
  RedpallasMPCv2KeyGenRound2Request,
  RedpallasMPCv2KeyGenRound2Response,
} from '@bitgo/public-types';
import { BitGoBase } from '../../../bitgoBase';

const generateRedpallasMPCv2KeyRequestBody = t.union([
  RedpallasMPCv2KeyGenRound1Request,
  RedpallasMPCv2KeyGenRound2Request,
]);
export type GenerateRedpallasMPCv2KeyRequestBody = t.TypeOf<typeof generateRedpallasMPCv2KeyRequestBody>;

const generateRedpallasMPCv2KeyRequestResponse = t.union([
  RedpallasMPCv2KeyGenRound1Response,
  RedpallasMPCv2KeyGenRound2Response,
]);
export type GenerateRedpallasMPCv2KeyRequestResponse = t.TypeOf<typeof generateRedpallasMPCv2KeyRequestResponse>;

export type RedpallasMPCv2KeyGenSendFn<T extends GenerateRedpallasMPCv2KeyRequestResponse> = (
  round: MPCv2KeyGenState,
  payload: GenerateRedpallasMPCv2KeyRequestBody
) => Promise<T>;

export function RedpallasKeyGenSenderForEnterprise<T extends GenerateRedpallasMPCv2KeyRequestResponse>(
  bitgo: BitGoBase,
  enterprise: string,
  safeId?: string
): RedpallasMPCv2KeyGenSendFn<T> {
  return (round, payload) => {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, safeId, type: KeyGenTypeEnum.MPCv2, curveType: KeyCurveEnum.RedPallas, round, payload })
      .result();
  };
}
