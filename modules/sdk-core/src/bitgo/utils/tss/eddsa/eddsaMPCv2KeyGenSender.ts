import {
  EddsaMPCv2KeyGenRound1Request,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Request,
  EddsaMPCv2KeyGenRound2Response,
  KeyGenTypeEnum,
} from '@bitgo/public-types';
import { BitGoBase } from '../../../bitgoBase';

export type EddsaMPCv2KeyGenSendFn<Req, Res> = (round: string, payload: Req) => Promise<Res>;

export function MPSKeyGenSenderForEnterprise(
  bitgo: BitGoBase,
  enterprise: string
): {
  round1: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound1Request, EddsaMPCv2KeyGenRound1Response>;
  round2: EddsaMPCv2KeyGenSendFn<EddsaMPCv2KeyGenRound2Request, EddsaMPCv2KeyGenRound2Response>;
} {
  function send<Req, Res>(round: string, payload: Req): Promise<Res> {
    return bitgo
      .post(bitgo.url('/mpc/generatekey', 2))
      .send({ enterprise, type: KeyGenTypeEnum.MPCv2, keyCurve: 'EdDSA', round, payload })
      .result();
  }

  return {
    round1: (round, payload) => send<EddsaMPCv2KeyGenRound1Request, EddsaMPCv2KeyGenRound1Response>(round, payload),
    round2: (round, payload) => send<EddsaMPCv2KeyGenRound2Request, EddsaMPCv2KeyGenRound2Response>(round, payload),
  };
}
