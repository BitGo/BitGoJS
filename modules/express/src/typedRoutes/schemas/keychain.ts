import * as t from 'io-ts';

// Base keychain fields
const BaseKeychainCodec = t.type({
  id: t.string,
  pub: t.string,
  source: t.string,
});

/**
 * User keychain: can have encryptedPrv and prv
 * - ethAddress: Ethereum address corresponding to this keychain
 * - coinSpecific: Coin specific key data
 * - encryptedPrv: User private key encrypted with the user passphrase
 * - prv: User private key
 */
export const UserKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.partial({
    ethAddress: t.string,
    coinSpecific: t.UnknownRecord,
    encryptedPrv: t.string,
    prv: t.string,
  }),
]);

/**
 * Backup keychain: can have prv
 * - ethAddress: Ethereum address corresponding to this keychain
 * - coinSpecific: Coin specific key data
 * - prv: User private key
 */
export const BackupKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.partial({
    ethAddress: t.string,
    coinSpecific: t.UnknownRecord,
    prv: t.string,
  }),
]);

/**
 * BitGo keychain: must have isBitGo
 * - ethAddress: Ethereum address corresponding to this keychain
 * - coinSpecific: Coin specific key data
 */
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
