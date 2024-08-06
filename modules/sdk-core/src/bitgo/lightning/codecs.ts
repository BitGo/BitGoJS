import * as t from 'io-ts';
import { isIP } from 'net';
import { NonEmptyString } from 'io-ts-types';

export function getCodecPair<C extends t.Mixed>(
  innerCodec: C
): t.UnionC<[t.TypeC<{ lnbtc: C }>, t.TypeC<{ tlnbtc: C }>]> {
  return t.union([t.type({ lnbtc: innerCodec }), t.type({ tlnbtc: innerCodec })]);
}

export const IPCustomCodec = new t.Type<string, string, unknown>(
  'IPAddress',
  t.string.is,
  (input, context) => (typeof input === 'string' && isIP(input) ? t.success(input) : t.failure(input, context)),
  t.identity
);

export type IPAddress = t.TypeOf<typeof IPCustomCodec>;

export const KeyPurposeCodec = t.union([t.literal('userAuth'), t.literal('nodeAuth')], 'KeyPurpose');

export type KeyPurpose = t.TypeOf<typeof KeyPurposeCodec>;

export const LightningAuthKeychainCoinSpecificCodec = getCodecPair(t.type({ purpose: KeyPurposeCodec }));

export const LightningKeychainCodec = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    coinSpecific: t.undefined,
    source: t.literal('user'),
  },
  'LightningKeychain'
);

export type LightningKeychain = t.TypeOf<typeof LightningKeychainCodec>;

export const LightningAuthKeychainCodec = t.strict(
  {
    id: NonEmptyString,
    pub: NonEmptyString,
    encryptedPrv: NonEmptyString,
    coinSpecific: LightningAuthKeychainCoinSpecificCodec,
    source: t.literal('user'),
  },
  'LightningAuthKeychain'
);

export type LightningAuthKeychain = t.TypeOf<typeof LightningAuthKeychainCodec>;
