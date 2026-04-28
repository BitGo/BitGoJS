import * as t from 'io-ts';
import {
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound2Response,
} from '@bitgo/public-types';

export const generateEddsaMPCv2KeyRequestBody = t.union([MPCv2KeyGenRound1Request, MPCv2KeyGenRound2Request]);

export type GenerateEddsaMPCv2KeyRequestBody = t.TypeOf<typeof generateEddsaMPCv2KeyRequestBody>;

export const generateEddsaMPCv2KeyRequestResponse = t.union([MPCv2KeyGenRound1Response, MPCv2KeyGenRound2Response]);

export type GenerateEddsaMPCv2KeyRequestResponse = t.TypeOf<typeof generateEddsaMPCv2KeyRequestResponse>;
