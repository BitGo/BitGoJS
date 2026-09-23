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

// MPC (TSS) keychains carry `commonKeychain` rather than `pub`, so they get their own codecs.
const MpcKeychainBaseCodec = t.type({
  id: t.string,
  source: t.string,
  type: t.string,
  commonKeychain: t.string,
});

// MPC user keychain: carries the encrypted user key share
export const MpcUserKeychainCodec = t.intersection([
  MpcKeychainBaseCodec,
  t.partial({
    encryptedPrv: t.string,
    reducedEncryptedPrv: t.string,
  }),
]);

// MPC backup keychain: carries the encrypted backup key share
export const MpcBackupKeychainCodec = t.intersection([
  MpcKeychainBaseCodec,
  t.partial({
    encryptedPrv: t.string,
    reducedEncryptedPrv: t.string,
  }),
]);

// MPC BitGo keychain: must have isBitGo; hsmType/isTrust describe the HSM signing setup
export const MpcBitgoKeychainCodec = t.intersection([
  MpcKeychainBaseCodec,
  t.type({
    isBitGo: t.boolean,
  }),
  t.partial({
    hsmType: t.string,
    isTrust: t.boolean,
  }),
]);
