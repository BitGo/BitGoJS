import { Triple } from '@bitgo/sdk-core';
import { encrypt } from '@bitgo/sdk-api';
import { getSeed } from '@bitgo/sdk-test';
import { bip32, BIP32Interface, bitgo } from '@bitgo/utxo-lib';
import { BIP32 as WasmBIP32, fixedScriptWallet } from '@bitgo/wasm-utxo';

type RootWalletKeys = bitgo.RootWalletKeys;

export type KeychainBase58 = {
  pub: string;
  prv: string;
};

export type KeyDoc = {
  id: string;
  pub: string;
  source: string;
  encryptedPrv: string;
  coinSpecific: any;
};

export function toKeychainBase58(k: BIP32Interface): KeychainBase58 {
  if (k.isNeutered()) {
    throw new Error(`must provide private key`);
  }
  return {
    prv: k.toBase58(),
    pub: k.neutered().toBase58(),
  };
}

export function toKeychainObjects(rootWalletKeys: RootWalletKeys, walletPassphrase: string): KeyDoc[] {
  return rootWalletKeys.triple.map((bip32, keyIdx) => {
    const pub = bip32.neutered().toBase58();
    return {
      id: getSeed(pub).toString('hex'),
      pub,
      source: KeyNames[keyIdx],
      encryptedPrv: encrypt(walletPassphrase, bip32.toBase58()),
      coinSpecific: {},
    };
  });
}

export const KeyNames = ['user', 'backup', 'bitgo'];

export const keychainsBase58: Triple<KeychainBase58> = [
  {
    pub: 'xpub661MyMwAqRbcGiQhVk1J7cD1YodF9tc5Y1B8vpTjjB1pcB1J1m1QX8fMtYP2sYqFmW6J2ra69tNoARKjvTGo9cGUrbPbJdjwrSzGGzPzWWS',
    prv: 'xprv9s21ZrQH143K4ELEPiUHkUGGzmnkkRtEAnFY8S48AqUqjNg9UDh9yLLt3FcfATyCjbsMB9JCGHAD8MeBTAK1P7trFppkoswu5ZAsHYASfbk',
  },
  {
    pub: 'xpub661MyMwAqRbcFzLXuganogQvd7MrefQQqCcJP2ZDumnCdQecf5cw1P1nD5qBz8SNS1yCLSC9VqpNUWnQU3V6qmnPt2r21oXhicQFzPA6Lby',
    prv: 'xprv9s21ZrQH143K3WG4of3nSYUC55XNFCgZTyghae9cMSFDkcKU7YJgTahJMpdTY9CjCcjgSo2TJ635uUVx176BufUMBFpieKYVJD9J3VvrGRm',
  },
  {
    pub: 'xpub661MyMwAqRbcFHpwWrzPB61U2CgBmdD21WNVM1JKUn9rEExkoGE4yafUVFbPSd78vdX8tWcEUQWaALFkU9fUbUM4Cc49DKEJSCYGRnbzCym',
    prv: 'xprv9s21ZrQH143K2okUQqTNox4jUAqhNAVAeHStYcthvScsMSdcFiupRnLzdxzfJithak5Zs92FQJeeJ9Jiya63KfUNxawuMZDCp2cGT9cdMKs',
  },
];

export const keychains: Triple<BIP32Interface> = keychainsBase58.map(({ pub, prv }) => {
  const k = bip32.fromBase58(prv);
  if (k.neutered().toBase58() !== pub) {
    throw new Error(`mismatch`);
  }
  return k;
}) as Triple<BIP32Interface>;

export function getWalletUnspentSignerUserBitGo(
  keys: Triple<BIP32Interface>
): bitgo.WalletUnspentSigner<RootWalletKeys> {
  return new bitgo.WalletUnspentSigner(keys, keys[0], keys[2]);
}

export function getDefaultWalletKeys(): RootWalletKeys {
  return new bitgo.RootWalletKeys(keychains);
}

export function getDefaultWalletUnspentSigner(): bitgo.WalletUnspentSigner<RootWalletKeys> {
  return getWalletUnspentSignerUserBitGo(keychains);
}

export function encryptKeychain(password: string, keychain: KeychainBase58): string {
  return encrypt(password, keychain.prv);
}

export function getWalletKeys(seed: string): RootWalletKeys {
  return new bitgo.RootWalletKeys(
    Array.from({ length: 3 }).map((_, i) => bip32.fromSeed(getSeed(`${seed}/${i}`))) as Triple<BIP32Interface>
  );
}

/**
 * Create test wallet keys from a seed string.
 * Uses the same seed generation as getWalletKeys (getSeed('seed/i'))
 * to ensure compatibility with existing test fixtures.
 */
export function createTestWalletKeys(seed: string): {
  xpubs: Triple<string>;
  xprivs: Triple<string>;
} {
  const keys = Array.from({ length: 3 }).map((_, i) =>
    bip32.fromSeed(getSeed(`${seed}/${i}`))
  ) as Triple<BIP32Interface>;
  return {
    xpubs: keys.map((k) => k.neutered().toBase58()) as Triple<string>,
    xprivs: keys.map((k) => k.toBase58()) as Triple<string>,
  };
}

/**
 * Create wasm-utxo RootWalletKeys from a seed string.
 * Optionally specify custom derivation prefixes.
 */
export function createWasmWalletKeys(
  seed: string,
  derivationPrefixes: Triple<string> = ['m/0/0', 'm/0/0', 'm/0/0']
): {
  walletKeys: fixedScriptWallet.RootWalletKeys;
  xpubs: Triple<WasmBIP32>;
  xprivs: Triple<WasmBIP32>;
} {
  const { xpubs: xpubStrs, xprivs: xprivStrs } = createTestWalletKeys(seed);
  const xpubs = xpubStrs.map((xpub) => WasmBIP32.from(xpub)) as Triple<WasmBIP32>;
  const xprivs = xprivStrs.map((xpriv) => WasmBIP32.from(xpriv)) as Triple<WasmBIP32>;
  return {
    walletKeys: fixedScriptWallet.RootWalletKeys.from({
      triple: xpubs,
      derivationPrefixes,
    }),
    xpubs,
    xprivs,
  };
}

/**
 * Get wasm-utxo RootWalletKeys from the default hardcoded keychains.
 * Use this when you need wallet keys that match existing test fixtures.
 * Optionally specify custom derivation prefixes.
 */
export function getDefaultWasmWalletKeys(derivationPrefixes: Triple<string> = ['m/0/0', 'm/0/0', 'm/0/0']): {
  walletKeys: fixedScriptWallet.RootWalletKeys;
  xpubs: Triple<WasmBIP32>;
  xprivs: Triple<WasmBIP32>;
} {
  const xpubs = keychainsBase58.map((k) => WasmBIP32.from(k.pub)) as Triple<WasmBIP32>;
  const xprivs = keychainsBase58.map((k) => WasmBIP32.from(k.prv)) as Triple<WasmBIP32>;
  return {
    walletKeys: fixedScriptWallet.RootWalletKeys.from({
      triple: xpubs,
      derivationPrefixes,
    }),
    xpubs,
    xprivs,
  };
}
