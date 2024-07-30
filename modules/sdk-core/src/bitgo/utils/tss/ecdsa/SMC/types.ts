import { DklsTypes } from '@bitgo/sdk-lib-mpc';

export enum KeyCreationMPCv2States {
  WaitingForOVC1Round1Data = -1,
  WaitingForOVC2Round1Data,
  WaitingForBitgoRound1Data,
  WaitingForOVC1Round2Data,
  WaitingForOVC2Round2Data,
  WaitingForBitgoRound2Data,
  WaitingForOVC1Round3aData,
  WaitingForOVC2Round3Data,
  WaitingForOVC1Round3bData,
  WaitingForBitgoRound3Data,
  WaitingForOVC1GenerateKey,
  WaitingForOVC2GenerateKey,
  KeyGenerationComplete,
}
interface baseRoundPayload {
  tssVersion: string;
  walletType: string;
  coin: string;
  state: KeyCreationMPCv2States;
}

export const OVC_ONE = 1 as const;
export const OVC_TWO = 2 as const;

export interface OVC1ToOVC2Round1Payload extends baseRoundPayload {
  ovc: {
    [OVC_ONE]: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
    };
  };
}

export interface OVC2ToBitgoRound1Payload extends baseRoundPayload {
  ovc: {
    [key in typeof OVC_ONE | typeof OVC_TWO]: { gpgPubKey: string; ovcMsg1: DklsTypes.AuthBroadcastMessage };
  };
}

export interface PlatformRound1Payload {
  walletGpgPubKeySigs: string;
  sessionId: string;
  bitgoMsg1: DklsTypes.AuthBroadcastMessage;
  ovc: {
    [key in typeof OVC_ONE | typeof OVC_TWO]: {
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
    [OVC_ONE]: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
    };
    [OVC_TWO]: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
    };
  };
  platform: PlatformRound1Payload;
}

export interface OVC2ToBitgoRound2Payload extends baseRoundPayload {
  ovc: {
    [key in typeof OVC_ONE | typeof OVC_TWO]: {
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
    [key in typeof OVC_ONE | typeof OVC_TWO]: {
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
    [OVC_ONE]: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToBitgoMsg3: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg3: DklsTypes.AuthEncP2PMessage;
    };
    [OVC_TWO]: {
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
    [OVC_ONE]: {
      gpgPubKey: string;
      ovcMsg1: DklsTypes.AuthBroadcastMessage;
      ovcToBitgoMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg2: DklsTypes.AuthEncP2PMessage;
      ovcToBitgoMsg3: DklsTypes.AuthEncP2PMessage;
      ovcToOvcMsg3: DklsTypes.AuthEncP2PMessage;
    };
    [OVC_TWO]: {
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
    [key in typeof OVC_ONE | typeof OVC_TWO]: {
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
