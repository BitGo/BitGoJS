import * as t from 'io-ts';
import {
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Request,
  MPCv2KeyGenRound3Response,
} from '@bitgo/public-types';

export enum MPCv2PartiesEnum {
  USER = 0,
  BACKUP = 1,
  BITGO = 2,
}

export const generateMPCv2KeyRequestBody = t.union([
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound3Request,
]);

export type GenerateMPCv2KeyRequestBody = t.TypeOf<typeof generateMPCv2KeyRequestBody>;

export const generateMPCv2KeyRequestResponse = t.union([
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Response,
]);

export type GenerateMPCv2KeyRequestResponse = t.TypeOf<typeof generateMPCv2KeyRequestResponse>;
