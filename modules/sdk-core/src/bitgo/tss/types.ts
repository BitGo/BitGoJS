import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';

export enum ShareKeyPosition {
  USER = 1,
  BACKUP = 2,
  BITGO = 3,
}

export type TxRequestChallengeResponse = EcdsaTypes.SerializedEcdsaChallenges & {
  n: string;
};
