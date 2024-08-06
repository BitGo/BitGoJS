import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types';
import { IPCustomCodec } from '@bitgo/sdk-core';

export const WalletStateCodec = t.keyof({
  NON_EXISTING: 1,
  LOCKED: 1,
  UNLOCKED: 1,
  RPC_ACTIVE: 1,
  SERVER_ACTIVE: 1,
  WAITING_TO_START: 1,
});

export type WalletState = t.TypeOf<typeof WalletStateCodec>;

export const LightningSignerConfigCodec = t.type({
  url: NonEmptyString,
  tlsCert: NonEmptyString,
});

export type LightningSignerConfig = t.TypeOf<typeof LightningSignerConfigCodec>;

export const LightningSignerConfigsCodec = t.record(t.string, LightningSignerConfigCodec);

export type LightningSignerConfigs = t.TypeOf<typeof LightningSignerConfigsCodec>;

export const GetWalletStateResponseCodec = t.type(
  {
    state: WalletStateCodec,
  },
  'GetWalletStateResponse'
);

export type GetWalletStateResponse = t.TypeOf<typeof GetWalletStateResponseCodec>;

export const InitLightningWalletRequestCodec = t.strict(
  {
    walletId: NonEmptyString,
    passphrase: NonEmptyString,
    signerIP: IPCustomCodec,
    signerTlsCert: NonEmptyString,
    signerTlsKey: NonEmptyString,
    expressIP: IPCustomCodec,
  },
  'InitLightningWalletRequest'
);

export type InitLightningWalletRequest = t.TypeOf<typeof InitLightningWalletRequestCodec>;

export const CreateSignerMacaroonRequestCodec = t.strict(
  {
    walletId: NonEmptyString,
    passphrase: NonEmptyString,
    watchOnlyIP: IPCustomCodec,
  },
  'CreateSignerMacaroonRequest'
);

export type CreateSignerMacaroonRequest = t.TypeOf<typeof CreateSignerMacaroonRequestCodec>;

export const InitWalletResponseCodec = t.type(
  {
    admin_macaroon: NonEmptyString,
  },
  'InitWalletResponse'
);

export type InitWalletResponse = t.TypeOf<typeof InitWalletResponseCodec>;

export const BakeMacaroonResponseCodec = t.type(
  {
    macaroon: NonEmptyString,
  },
  'BakeMacaroonResponse'
);

export type BakeMacaroonResponse = t.TypeOf<typeof BakeMacaroonResponseCodec>;
