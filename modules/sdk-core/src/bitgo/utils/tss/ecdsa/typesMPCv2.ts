import * as t from 'io-ts';
import {
  MPCv2DeriveRound1Request,
  MPCv2DeriveRound1Response,
  MPCv2DeriveRound2Request,
  MPCv2DeriveRound2Response,
  MPCv2DeriveRound3Request,
  MPCv2DeriveRound3Response,
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

/**
 * Round states for the safe-child hard-derivation ceremony (DKLS hard derive, VRF
 * backed); values come from `@bitgo/public-types` `MPCv2KeyGenStateEnum['MPCv2Derive-R*']`.
 * Three round trips wrap the two-broadcast-round derive protocol: the server
 * finalizes its pair sessions between the SDK's rounds and returns the child common
 * keychain on the third.
 */

/**
 * The safe-child hard-derivation ceremony rides the same signed broadcast message
 * shapes as MPCv2 keygen: the SDK drives user (0) and backup (1); the server runs
 * one hard-derive session per SDK party and returns a per-pair broadcast message on
 * every round. The request/response codecs are published by `@bitgo/public-types`;
 * the R1 request additionally carries `parentKeyId` (BitGo root key id) and
 * `derivationIndex` (sequential child index).
 */
export type GenerateMPCv2DeriveKeyRequest =
  | MPCv2DeriveRound1Request
  | MPCv2DeriveRound2Request
  | MPCv2DeriveRound3Request;

export type GenerateMPCv2DeriveKeyRequestResponse =
  | MPCv2DeriveRound1Response
  | MPCv2DeriveRound2Response
  | MPCv2DeriveRound3Response;
