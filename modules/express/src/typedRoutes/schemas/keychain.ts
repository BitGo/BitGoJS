import * as t from 'io-ts';

// Base keychain fields
const BaseKeychainCodec = t.type({
  /** Keychain identifier (example: 59cd72485007a239fb00282ed480da1f) */
  id: t.string,
  /** Public part of a key pair (example: xpub661MyMwAqRbcGMVhmc7wqQRYMtcX9LAvSj1pjB213y5TsrkV2uuzJjWnjBrT1FUeNWGPjaVm5p7o6jdNcQJrV1cy3a1R8NQ9m7LuYKA8RpH) */
  pub: t.string,
  /** Party that created the key */
  source: t.string,
});

/**
 * User keychain with encrypted private key and public key
 */
export const UserKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.partial({
    /** Ethereum address corresponding to this keychain (example: 0xf5b7cca8621691f9dde304cb7128b6bb3d409363) */
    ethAddress: t.string,
    /** Coin specific key data */
    coinSpecific: t.UnknownRecord,
    /** User private key encrypted with the user passphrase (example: {"iv":"TEd5eouui6hKashuVi5WHQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"dHu4PWoX2M8=","ct":"fYr9Y/6kU40AosONkV0xi+fWsyhpYSew0L2YKH/qEZjOlxeDjpC2aTJ0Yc/KdmXheUGolcAxGSx93ykN21Zim1DGc/UGa25IUA/3ARgX7gBsYnYEy5e5Ol0YZYb9pa7KFeaDZSLMXrxxoahg5zL4AJsUx90Pwcg="}) */
    encryptedPrv: t.string,
    /** User private key (example: xprv9s21ZrQH143K3e1981rUcbKjJ9G57SDCDZ9HY4Sqhx5ZqMoyK1j49kAf1vuM1G9nhRr6kzqbUQb3gj5zuzrsvNRQ84tYf32EcyapRgBNpp4) */
    prv: t.string,
  }),
]);

/**
 * Backup keychain with private key
 */
export const BackupKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.partial({
    /** Ethereum address corresponding to this keychain (example: 0xf5b7cca8621691f9dde304cb7128b6bb3d409363) */
    ethAddress: t.string,
    /** Coin specific key data */
    coinSpecific: t.UnknownRecord,
    /** Backup private key (example: xprv9s21ZrQH143K47iEnAFZRJz36E5ZxuEDBJETFYxJTsTVxuPc9z7oGWADUK6icX5P3ruoe244yxMt9uZ2LjWhddvnJJ4zB7zK93qBtxYrmN6) */
    prv: t.string,
  }),
]);

/**
 * BitGo keychain (managed by BitGo)
 */
export const BitgoKeychainCodec = t.intersection([
  BaseKeychainCodec,
  t.type({
    /** Flag for identifying keychain as created by BitGo (example: true) */
    isBitGo: t.boolean,
  }),
  t.partial({
    /** Ethereum address corresponding to this keychain (example: 0xa487900d0de75107b1cc7ade0e2662980e5ce940) */
    ethAddress: t.string,
    /** Coin specific key data */
    coinSpecific: t.UnknownRecord,
  }),
]);
