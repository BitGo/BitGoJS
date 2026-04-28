import * as t from 'io-ts';

// Base keychain fields
const BaseKeychainCodec = t.type({
  id: t.string,
  pub: t.string,
  source: t.string,
});

/**
 * User keychain: can have encryptedPrv and prv
 *
 * Properties:
 * - id: Keychain identifier
 * - pub: Public key
 * - source: Party that created the key (example: "user")
 * - ethAddress: Ethereum address corresponding to this keychain (example: 0xf5b7cca8621691f9dde304cb7128b6bb3d409363)
 * - coinSpecific: Coin specific key data
 * - encryptedPrv: User private key encrypted with the user passphrase
 *   Example: {"iv":"TEd5eouui6hKashuVi5WHQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"dHu4PWoX2M8=","ct":"fYr9Y/6kU40AosONkV0xi+fWsyhpYSew0L2YKH/qEZjOlxeDjpC2aTJ0Yc/KdmXheUGolcAxGSx93ykN21Zim1DGc/UGa25IUA/3ARgX7gBsYnYEy5e5Ol0YZYb9pa7KFeaDZSLMXrxxoahg5zL4AJsUx90Pwcg="}
 * - prv: User private key (example: xprv9s21ZrQH143K3e1981rUcbKjJ9G57SDCDZ9HY4Sqhx5ZqMoyK1j49kAf1vuM1G9nhRr6kzqbUQb3gj5zuzrsvNRQ84tYf32EcyapRgBNpp4)
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
 *
 * Properties:
 * - id: Keychain identifier
 * - pub: Public key
 * - source: Party that created the key (example: "backup")
 * - ethAddress: Ethereum address corresponding to this keychain (example: 0xf5b7cca8621691f9dde304cb7128b6bb3d409363)
 * - coinSpecific: Coin specific key data
 * - prv: Backup private key (example: xprv9s21ZrQH143K47iEnAFZRJz36E5ZxuEDBJETFYxJTsTVxuPc9z7oGWADUK6icX5P3ruoe244yxMt9uZ2LjWhddvnJJ4zB7zK93qBtxYrmN6)
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
 *
 * Properties:
 * - id: Keychain identifier
 * - pub: Public key
 * - source: Party that created the key (example: "bitgo")
 * - isBitGo: Flag for identifying keychain as created by BitGo (example: true)
 * - ethAddress: Ethereum address corresponding to this keychain (example: 0xa487900d0de75107b1cc7ade0e2662980e5ce940)
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
