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

export const generateMPCv2KeyRequestResponse = t.union([
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Response,
]);

/**
 * Optional VRF DKG message fields carried on the MPCv2-R1/R2 keygen round payloads as
 * opaque base64 blobs. Only set when the ceremony runs the VRF DKG alongside the
 * signing DKG (safe root keys); ordinary TSS wallet creation payloads are unchanged.
 */
export type MpcV2VrfKeyGenRequestFields = {
  userVrfMsg1?: string;
  backupVrfMsg1?: string;
  userVrfMsg2?: string;
  backupVrfMsg2?: string;
};

export type MpcV2VrfKeyGenResponseFields = {
  bitgoVrfMsg1?: string;
  bitgoVrfMsg2?: string;
};

export type GenerateMPCv2KeyRequestBody = t.TypeOf<typeof generateMPCv2KeyRequestBody> & MpcV2VrfKeyGenRequestFields;

export type GenerateMPCv2KeyRequestResponse = t.TypeOf<typeof generateMPCv2KeyRequestResponse> &
  MpcV2VrfKeyGenResponseFields;
