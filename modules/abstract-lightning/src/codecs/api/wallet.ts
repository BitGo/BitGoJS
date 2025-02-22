import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types';
import { getCodecPair } from '../shared';

// codec for lightning wallet and keychain related apis

export const KeyPurpose = t.union([t.literal('userAuth'), t.literal('nodeAuth')], 'KeyPurpose');

export type KeyPurpose = t.TypeOf<typeof KeyPurpose>;

export const LightningAuthKeychainCoinSpecific = getCodecPair(t.type({ purpose: KeyPurpose }));

export const LightningKeychain = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    source: t.literal('user'),
  },
  'LightningKeychain'
);

export type LightningKeychain = t.TypeOf<typeof LightningKeychain>;

export const LightningAuthKeychain = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    coinSpecific: LightningAuthKeychainCoinSpecific,
    source: t.literal('user'),
  },
  'LightningAuthKeychain'
);

export type LightningAuthKeychain = t.TypeOf<typeof LightningAuthKeychain>;

export const WatchOnlyAccount = t.type({
  purpose: t.number,
  coin_type: t.number,
  account: t.number,
  xpub: t.string,
});

export type WatchOnlyAccount = t.TypeOf<typeof WatchOnlyAccount>;

export const WatchOnly = t.type({
  master_key_birthday_timestamp: t.string,
  master_key_fingerprint: t.string,
  accounts: t.array(WatchOnlyAccount),
});

export type WatchOnly = t.TypeOf<typeof WatchOnly>;

export const UpdateLightningWalletSignedRequest = t.partial({
  encryptedSignerMacaroon: t.string,
  encryptedSignerAdminMacaroon: t.string,
  signerHost: t.string,
  encryptedSignerTlsKey: t.string,
  signerTlsCert: t.string,
  watchOnlyAccounts: WatchOnly,
});

export type UpdateLightningWalletSignedRequest = t.TypeOf<typeof UpdateLightningWalletSignedRequest>;
