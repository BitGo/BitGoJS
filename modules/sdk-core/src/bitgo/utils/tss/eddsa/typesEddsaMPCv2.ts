import * as t from 'io-ts';
import {
  EddsaMPCv2KeyGenRound1Request,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Request,
  EddsaMPCv2KeyGenRound2Response,
} from '@bitgo/public-types';

export const generateEddsaMPCv2KeyRequestBody = t.union([EddsaMPCv2KeyGenRound1Request, EddsaMPCv2KeyGenRound2Request]);

export type GenerateEddsaMPCv2KeyRequestBody = t.TypeOf<typeof generateEddsaMPCv2KeyRequestBody>;

export const generateEddsaMPCv2KeyRequestResponse = t.union([
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Response,
]);

export type GenerateEddsaMPCv2KeyRequestResponse = t.TypeOf<typeof generateEddsaMPCv2KeyRequestResponse>;
