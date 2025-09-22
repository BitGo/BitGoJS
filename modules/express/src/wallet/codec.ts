import * as t from 'io-ts';

// Base keychain fields
const BaseKeychainCodec = t.type({
  id: t.string,
  pub: t.string,
  source: t.string,
});

// User keychain: can have encryptedPrv and prv
export const UserKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.partial({
    ethAddress: t.string,
    coinSpecific: t.UnknownRecord,
    encryptedPrv: t.string,
    prv: t.string,
  }),
]);

// Backup keychain: can have prv
export const BackupKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.partial({
    ethAddress: t.string,
    coinSpecific: t.UnknownRecord,
    prv: t.string,
  }),
]);

// BitGo keychain: must have isBitGo
export const BitgoKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.type({
    isBitGo: t.boolean,
  }),
  t.partial({
    ethAddress: t.string,
    coinSpecific: t.UnknownRecord,
  }),
]);
