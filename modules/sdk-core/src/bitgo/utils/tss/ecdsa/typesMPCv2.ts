import * as t from 'io-ts';
import {
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Request,
  MPCv2KeyGenRound3Response,
} from '@bitgo/public-types';
import { DklsTypes } from '@bitgo/sdk-lib-mpc';

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

// #region MPCv2 SMC

interface baseRoundPayload {
  tssVersion: string;
  walletType: string;
  coin: string;
  state: number;
}
export interface OVC1ToOVC2Round1Payload extends baseRoundPayload {
  ovc: {
    1: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
    };
  };
}

export interface OVC2ToBitgoRound1Payload extends baseRoundPayload {
  ovc: {
    [key in '1' | '2']: { gpgPubKey: string; ovcMsg1: DklsTypes.AuthBroadcastMessage };
  };
}

export interface PlatformRound1Payload {
  walletGpgPubKeySigs: string;
  sessionId: string;
  bitgoMsg1: DklsTypes.AuthBroadcastMessage;
  ovc: {
    [key in '1' | '2']: {
      bitgoToOvcMsg2: DklsTypes.AuthEncP2PMessage;
    };
  };
}
export interface BitgoToOVC1Round1Response {
  wallet: OVC2ToBitgoRound1Payload & {
    platform: PlatformRound1Payload;
  };
}

export interface OVC1ToOVC2Round2Payload extends baseRoundPayload {
  ovc: {
    1: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
    };
    2: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
    };
  };
  platform: PlatformRound1Payload;
}

export interface OVC2ToBitgoRound2Payload extends baseRoundPayload {
  ovc: {
    [key in '1' | '2']: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
    };
  };
  platform: PlatformRound1Payload;
}

export interface PlatformRound2Payload {
  sessionId: string;
  bitgoMsg1: DklsTypes.AuthBroadcastMessage;
  bitgoCommitment2: string;
  ovc: {
    [key in '1' | '2']: {
      bitgoToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      bitgoToOvcMsg3: DklsTypes.AuthEncP2PMessage;
    };
  };
}

export interface BitgoToOVC1Round2Response {
  wallet: OVC2ToBitgoRound2Payload & {
    platform: PlatformRound2Payload;
  };
}

export interface OVC1ToOVC2Round3Payload extends baseRoundPayload {
  ovc: {
    1: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToBitgoMsg3: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg3: DklsTypes.AuthEncP2PMessage;
    };
    2: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
    };
  };
  platform: PlatformRound2Payload;
}
export interface OVC2ToOVC1Round3Payload extends baseRoundPayload {
  ovc: {
    1: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToBitgoMsg3: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg3: DklsTypes.AuthEncP2PMessage;
    };
    2: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToBitgoMsg3: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg3: DklsTypes.AuthEncP2PMessage;
      ovcMsg4: DklsTypes.AuthBroadcastMessage;
    };
  };
  platform: PlatformRound2Payload;
}

export interface OVC1ToBitgoRound3Payload extends baseRoundPayload {
  ovc: {
    [key in '1' | '2']: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToBitgoMsg3: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg3: DklsTypes.AuthEncP2PMessage;
      ovcMsg4: DklsTypes.AuthBroadcastMessage;
    };
  };
  platform: PlatformRound2Payload;
}

export interface PlatformRound3Payload extends PlatformRound2Payload {
  commonKeychain: string;
  bitgoMsg4: DklsTypes.AuthBroadcastMessage;
}

export interface BitgoToOVC1Round3Response {
  bitGoKeyId: string;
  wallet: OVC1ToBitgoRound3Payload & {
    platform: PlatformRound3Payload;
  };
}

// #endregion
