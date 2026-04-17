import { KeyGenTypeEnum, MPCv2KeyGenState } from '@bitgo/public-types';
import { BitGoBase } from '../../../bitgoBase';
import { GenerateEddsaMPCv2KeyRequestBody, GenerateEddsaMPCv2KeyRequestResponse } from './typesEddsaMPCv2';

// TODO: move to @bitgo/public-types
export enum KeyCurveEnum {
  EdDSA = 'EdDSA',
}

export type EddsaMPCv2KeyGenSendFn<T extends GenerateEddsaMPCv2KeyRequestResponse> = (
  round: MPCv2KeyGenState,
  payload: GenerateEddsaMPCv2KeyRequestBody
) => Promise<T>;

export function KeyGenSenderForEnterprise<T extends GenerateEddsaMPCv2KeyRequestResponse>(
  bitgo: BitGoBase,
  enterprise: string
): EddsaMPCv2KeyGenSendFn<T> {
  return (round, payload) => {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, type: KeyGenTypeEnum.MPCv2, keyCurve: KeyCurveEnum.EdDSA, round, payload })
      .result();
  };
}
