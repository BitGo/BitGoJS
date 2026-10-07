/**
 * @prettier
 *
 * @experimental WRW-facing safe recovery entry points.
 */
import { Buffer } from 'buffer';
import { randomBytes } from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';
import { coins, MAX_BIP32_INDEX, SAFE_ROOT_SLOT_ORDINALS } from '@bitgo/statics';
import type { RootKeyType } from '@bitgo/public-types';
import { parseSafeKeycardBox } from '@bitgo/sdk-lib-safes';
import { DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { BitGoBase } from '../bitgoBase';
import { IncorrectPasswordError } from '../errors';
import { parseSafeMpcKeyEnvelopes } from '../utils/tss/keyShareEnvelope';

export type DecryptedMpcSafeRoot = { signing: Buffer; vrf: Buffer };

export type OnchainSafeRoot = { user: string; backup: string; bitgo: string };
export type MpcSafeRoot = { user: DecryptedMpcSafeRoot; backup: DecryptedMpcSafeRoot; bitgo: string };

export type Secp256k1MultisigChildKeys = {
  user: { prv: string; pub: string };
  backup: { prv: string; pub: string };
  bitgo: { pub: string };
};

export type EcdsaMpcChildKeys = {
  commonKeychain: string;
  user: string;
  backup: string;
};

export type DerivedSafeWalletKeys =
  | { slot: 'secp256k1Multisig'; path: string; keys: Secp256k1MultisigChildKeys }
  | { slot: 'ecdsaMpc'; path: string; keys: EcdsaMpcChildKeys };

export type SafeRecoverKeyParams = {
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  walletPassphrase?: string;
};

export type DecryptedSafeRoots = {
  secp256k1Multisig: OnchainSafeRoot;
  ed25519Multisig: OnchainSafeRoot;
  ecdsaMpc: MpcSafeRoot;
  eddsaMpc: MpcSafeRoot;
};

export async function decryptSafeKeycard(params: {
  bitgo: BitGoBase;
  userKeyBox: string;
  backupKeyBox: string;
  bitgoKeyBox: string;
  password: string;
}): Promise<DecryptedSafeRoots> {
  const { bitgo, userKeyBox, backupKeyBox, bitgoKeyBox, password } = params;

  const userRoots = parseSafeKeycardBox(userKeyBox);
  const backupRoots = parseSafeKeycardBox(backupKeyBox);
  const bitgoRoots = parseSafeKeycardBox(bitgoKeyBox);

  const decryptRoot = async (root: string): Promise<string> => {
    try {
      return await bitgo.decrypt({ input: root, password });
    } catch (e) {
      throw new IncorrectPasswordError('unable to decrypt the safe keycard with the provided password', e);
    }
  };

  const unwrapMpcRoot = (decrypted: string): DecryptedMpcSafeRoot => {
    try {
      return parseSafeMpcKeyEnvelopes(decrypted);
    } catch (e) {
      throw new IncorrectPasswordError('unable to decrypt the safe keycard with the provided password', e);
    }
  };

  return {
    secp256k1Multisig: {
      user: await decryptRoot(userRoots.secp256k1Multisig),
      backup: await decryptRoot(backupRoots.secp256k1Multisig),
      bitgo: bitgoRoots.secp256k1Multisig,
    },
    ed25519Multisig: {
      user: await decryptRoot(userRoots.ed25519Multisig),
      backup: await decryptRoot(backupRoots.ed25519Multisig),
      bitgo: bitgoRoots.ed25519Multisig,
    },
    ecdsaMpc: {
      user: unwrapMpcRoot(await decryptRoot(userRoots.ecdsaMpc)),
      backup: unwrapMpcRoot(await decryptRoot(backupRoots.ecdsaMpc)),
      bitgo: bitgoRoots.ecdsaMpc,
    },
    eddsaMpc: {
      user: unwrapMpcRoot(await decryptRoot(userRoots.eddsaMpc)),
      backup: unwrapMpcRoot(await decryptRoot(backupRoots.eddsaMpc)),
      bitgo: bitgoRoots.eddsaMpc,
    },
  };
}

function buildSafeUserPath(coinType: number, slotOrdinal: number, account: number): string {
  return `m/44'/${coinType}'/${slotOrdinal}'/${account}'`;
}

function buildSafeCosignerPath(coinType: number, slotOrdinal: number, account: number): string {
  return `m/44/${coinType}/${slotOrdinal}/${account}`;
}

/**
 * Derives a Safe wallet's child keys at the BIP44 path for a given slot and account.
 * Only `secp256k1Multisig` (slot 1) is supported for now; the remaining slots throw
 * until their derivation arms land (WCN-2736/WCN-2737/WCN-2894).
 */
export async function deriveSafeWalletKeys(params: {
  coin: string;
  slot: RootKeyType;
  account: number;
  roots: DecryptedSafeRoots;
}): Promise<DerivedSafeWalletKeys> {
  if (!Number.isInteger(params.account) || params.account < 0 || params.account > MAX_BIP32_INDEX) {
    throw new Error(`deriveSafeWalletKeys: invalid account '${params.account}'`);
  }

  const coinType = coins.get(params.coin).bip44CoinType;
  if (coinType === undefined) {
    throw new Error(`Coin '${params.coin}' has no BIP44 coin type and cannot derive a safe child`);
  }
  const slotOrdinal = SAFE_ROOT_SLOT_ORDINALS[params.slot];
  const { account, roots } = params;

  if (params.slot === 'secp256k1Multisig') {
    const root = roots.secp256k1Multisig;
    const user = bip32.fromBase58(root.user).derivePath(buildSafeUserPath(coinType, slotOrdinal, account));
    const backup = bip32.fromBase58(root.backup).derivePath(buildSafeCosignerPath(coinType, slotOrdinal, account));
    const bitgo = bip32.fromBase58(root.bitgo).derivePath(buildSafeCosignerPath(coinType, slotOrdinal, account));

    if (!user.privateKey || !backup.privateKey) {
      throw new Error('deriveSafeWalletKeys: user and backup roots must be private (xprv)');
    }
    if (bitgo.privateKey) {
      throw new Error('deriveSafeWalletKeys: bitgo root must be public (xpub)');
    }

    return {
      slot: 'secp256k1Multisig',
      path: buildSafeUserPath(coinType, slotOrdinal, account),
      keys: {
        user: { prv: user.toBase58(), pub: user.neutered().toBase58() },
        backup: { prv: backup.toBase58(), pub: backup.neutered().toBase58() },
        bitgo: { pub: bitgo.neutered().toBase58() },
      },
    };
  }

  if (params.slot === 'ecdsaMpc') {
    const { commonKeychain, userChild, backupChild } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot: roots.ecdsaMpc.user,
      backupRoot: roots.ecdsaMpc.backup,
      account,
      coinType,
    });
    return {
      slot: 'ecdsaMpc',
      path: buildSafeUserPath(coinType, slotOrdinal, account),
      keys: { commonKeychain, user: userChild, backup: backupChild },
    };
  }

  throw new Error(`deriveSafeWalletKeys: slot '${params.slot}' is not supported yet`);
}

/**
 * Builds the key fields `coin.recover()` expects from derived Safe child keys.
 * Only `secp256k1Multisig` (slot 1) is supported for now. Signed mode re-encrypts the
 * child xprvs under a fresh ephemeral passphrase (v1/SJCL); unsigned mode returns pubs.
 */
export async function buildSafeRecoverKeyParams(params: {
  bitgo: BitGoBase;
  coin: string;
  slot: RootKeyType;
  keys: Secp256k1MultisigChildKeys;
  mode: 'signed' | 'unsigned';
}): Promise<SafeRecoverKeyParams> {
  if (params.slot !== 'secp256k1Multisig') {
    throw new Error(`buildSafeRecoverKeyParams: slot '${params.slot}' is not supported yet`);
  }
  const { bitgo, keys, mode } = params;

  if (mode === 'unsigned') {
    return {
      userKey: keys.user.pub,
      backupKey: keys.backup.pub,
      bitgoKey: keys.bitgo.pub,
    };
  }

  const userPrv = bip32.fromBase58(keys.user.prv);
  const backupPrv = bip32.fromBase58(keys.backup.prv);
  if (!userPrv.privateKey || !backupPrv.privateKey) {
    throw new Error('buildSafeRecoverKeyParams: keys.user.prv and keys.backup.prv must be private xprvs');
  }

  const walletPassphrase = randomBytes(32).toString('hex');
  const [userKey, backupKey] = await Promise.all([
    bitgo.encrypt({ input: keys.user.prv, password: walletPassphrase, encryptionVersion: 1 }),
    bitgo.encrypt({ input: keys.backup.prv, password: walletPassphrase, encryptionVersion: 1 }),
  ]);

  return {
    userKey,
    backupKey,
    bitgoKey: keys.bitgo.pub,
    walletPassphrase,
  };
}
