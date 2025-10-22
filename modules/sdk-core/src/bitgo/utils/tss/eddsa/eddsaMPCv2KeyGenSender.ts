import { MPCv2KeyGenState } from '@bitgo/public-types';
import { BitGoBase } from '../../../bitgoBase';

export type EddsaMPCv2KeyGenSendFn<T extends any> = (round: MPCv2KeyGenState, payload: any) => Promise<T>;

export function EDDSAMPCv2KeyGenSenderForEnterprise<T extends any>(
  bitgo: BitGoBase,
  enterprise: string
): EddsaMPCv2KeyGenSendFn<T> {
  return (round, payload) => {
    return (
      bitgo
        .post(bitgo.url('/mpc/generatekey', 2))
        .send({ enterprise, type: 'EDDSA_MPCv2', round, payload })
        // have to use KeyGenTypeEnum.EDDSA_MPCv2
        .result()
    );
  };
}
