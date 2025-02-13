/* eslint-disable no-redeclare */
import * as t from 'io-ts';
import { IPAddress } from '@bitgo/sdk-core';

export const LightningSignerConfig = t.type({
  url: t.string,
  tlsCert: t.string,
});

export type LightningSignerConfig = t.TypeOf<typeof LightningSignerConfig>;

export const LightningSignerConfigs = t.record(t.string, LightningSignerConfig);

export type LightningSignerConfigs = t.TypeOf<typeof LightningSignerConfigs>;

export const WalletState = t.keyof({
  NON_EXISTING: 1,
  LOCKED: 1,
  UNLOCKED: 1,
  RPC_ACTIVE: 1,
  SERVER_ACTIVE: 1,
  WAITING_TO_START: 1,
});

export type WalletState = t.TypeOf<typeof WalletState>;

export const GetWalletStateResponse = t.type(
  {
    state: WalletState,
  },
  'GetWalletStateResponse'
);

export type GetWalletStateResponse = t.TypeOf<typeof GetWalletStateResponse>;

export const InitLightningWalletRequest = t.strict(
  {
    walletId: t.string,
    passphrase: t.string,
    signerIP: IPAddress,
    signerTlsCert: t.string,
    signerTlsKey: t.string,
    expressIP: IPAddress,
  },
  'InitLightningWalletRequest'
);

export type InitLightningWalletRequest = t.TypeOf<typeof InitLightningWalletRequest>;

export const CreateSignerMacaroonRequest = t.strict(
  {
    walletId: t.string,
    passphrase: t.string,
    watchOnlyIP: IPAddress,
  },
  'CreateSignerMacaroonRequest'
);

export type CreateSignerMacaroonRequest = t.TypeOf<typeof CreateSignerMacaroonRequest>;

export const InitWalletResponse = t.type(
  {
    admin_macaroon: t.string,
  },
  'InitWalletResponse'
);

export type InitWalletResponse = t.TypeOf<typeof InitWalletResponse>;

export const BakeMacaroonResponse = t.type(
  {
    macaroon: t.string,
  },
  'BakeMacaroonResponse'
);

export type BakeMacaroonResponse = t.TypeOf<typeof BakeMacaroonResponse>;

export const UnlockLightningWalletRequest = t.strict(
  {
    walletId: t.string,
    passphrase: t.string,
  },
  'UnlockLightningWalletRequest'
);

export type UnlockLightningWalletRequest = t.TypeOf<typeof UnlockLightningWalletRequest>;
