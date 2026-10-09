import * as t from 'io-ts';
import {
  type EddsaMPCv2DeriveRound1Request,
  type EddsaMPCv2DeriveRound1Response,
  type EddsaMPCv2DeriveRound2Request,
  type EddsaMPCv2DeriveRound2Response,
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

export type GenerateEddsaMPCv2DeriveKeyRequest = EddsaMPCv2DeriveRound1Request | EddsaMPCv2DeriveRound2Request;
export type GenerateEddsaMPCv2DeriveKeyRequestResponse =
  | EddsaMPCv2DeriveRound1Response
  | EddsaMPCv2DeriveRound2Response;
