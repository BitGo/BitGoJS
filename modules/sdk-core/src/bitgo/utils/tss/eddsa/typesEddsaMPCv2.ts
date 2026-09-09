import * as t from 'io-ts';
import {
  EddsaMPCv2KeyGenRound1Request,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Request,
  EddsaMPCv2KeyGenRound2Response,
} from '@bitgo/public-types';

export const generateEddsaMPCv2KeyRequestBody = t.union([EddsaMPCv2KeyGenRound1Request, EddsaMPCv2KeyGenRound2Request]);

/** Opaque VRF DKG blobs carried by the existing MPS key-generation rounds. */
export const eddsaMPCv2VrfKeyGenRequestFields = t.partial({
  userVrfMsg1: t.string,
  backupVrfMsg1: t.string,
  userVrfMsg2: t.string,
  backupVrfMsg2: t.string,
});

export const eddsaMPCv2VrfKeyGenResponseFields = t.partial({
  bitgoVrfMsg1: t.string,
  bitgoVrfMsg2: t.string,
});

export type EddsaMPCv2VrfKeyGenRequestFields = t.TypeOf<typeof eddsaMPCv2VrfKeyGenRequestFields>;
export type EddsaMPCv2VrfKeyGenResponseFields = t.TypeOf<typeof eddsaMPCv2VrfKeyGenResponseFields>;

export type GenerateEddsaMPCv2KeyRequestBody = t.TypeOf<typeof generateEddsaMPCv2KeyRequestBody> &
  EddsaMPCv2VrfKeyGenRequestFields;

export const generateEddsaMPCv2KeyRequestResponse = t.union([
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Response,
]);

export type GenerateEddsaMPCv2KeyRequestResponse = t.TypeOf<typeof generateEddsaMPCv2KeyRequestResponse> &
  EddsaMPCv2VrfKeyGenResponseFields;
