/**
 * @prettier
 *
 * io-ts codecs for the vault REST surface. These are the single source of truth for the
 * vault data shapes: the TypeScript interfaces in `iVault.ts` are derived from them via
 * `t.TypeOf`, request bodies are encoded with `postWithCodec`, and responses are decoded
 * (and validated) with `decodeWithCodec` — so there are no `as VaultData` casts.
 *
 * Timestamps use `DateFromISOString`: the wire representation stays an ISO-8601 string while
 * the decoded object exposes a real `Date`.
 */
import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types';

/**
 * The four static root-key slots of a vault, keyed by (curve, scheme):
 * - secp256k1Multisig ① — ex. UTXO/XRP/XTZ/TRX/EOS
 * - ecdsaMpc          ② — ex. EVM/Cosmos (DKLS)
 * - eddsaMpc          ③ — ex. SOL/SUI/NEAR/TON/APT/DOT
 * - ed25519Multisig   ④ — ex. ALGO/XLM/HBAR
 */
export const RootKeyType = t.keyof(
  {
    secp256k1Multisig: null,
    ecdsaMpc: null,
    eddsaMpc: null,
    ed25519Multisig: null,
  },
  'RootKeyType'
);

export const VaultPermission = t.keyof(
  {
    view: null,
    spend: null,
    admin: null,
    dapp: null,
  },
  'VaultPermission'
);

/** An ordered [userKeyId, backupKeyId, bitgoKeyId] triplet — same shape/order as wallet.keys[]. */
export const RootKeyTriplet = t.tuple([t.string, t.string, t.string], 'RootKeyTriplet');

/** The 12 static root key ids, by (curve, scheme). */
export const VaultRootKeys = t.type(
  {
    secp256k1Multisig: RootKeyTriplet,
    ecdsaMpc: RootKeyTriplet,
    eddsaMpc: RootKeyTriplet,
    ed25519Multisig: RootKeyTriplet,
  },
  'VaultRootKeys'
);

export const VaultMembershipData = t.intersection(
  [
    t.type({
      userId: t.string,
      permissions: t.array(VaultPermission),
    }),
    t.partial({
      needsRecovery: t.boolean,
    }),
  ],
  'VaultMembershipData'
);

/** A pending UMS spend grant awaiting a key share — mirror of the wallet's walletShareRequests[]. */
export const VaultShareRequest = t.type(
  {
    userId: t.string,
    permissions: t.array(VaultPermission),
    createdAt: DateFromISOString,
  },
  'VaultShareRequest'
);

export const VaultFreeze = t.partial(
  {
    time: DateFromISOString,
    expires: DateFromISOString,
    reason: t.string,
  },
  'VaultFreeze'
);

export const VaultStatus = t.keyof(
  {
    initializing: null,
    active: null,
    archived: null,
  },
  'VaultStatus'
);

export const VaultData = t.intersection(
  [
    t.type({
      id: t.string,
      enterpriseId: t.string,
      label: t.string,
      // freeze is NOT a status — a frozen vault stays 'active' with the freeze field set (wallet precedent)
      status: VaultStatus,
      creator: t.string,
      users: t.array(VaultMembershipData),
      createdAt: DateFromISOString,
    }),
    t.partial({
      vaultShareRequests: t.array(VaultShareRequest),
      freeze: VaultFreeze,
      rootKeys: VaultRootKeys,
      archivedAt: DateFromISOString,
    }),
  ],
  'VaultData'
);

/** Vault key-share states — identical to WalletShare states, no new states. */
export const VaultShareState = t.keyof(
  {
    pendingapproval: null,
    active: null,
    accepted: null,
    canceled: null,
    rejected: null,
  },
  'VaultShareState'
);

/** One of the 4 root USER keyshares carried on a VaultShare, ECDH-re-encrypted to the recipient. */
export const VaultShareKeychain = t.type(
  {
    rootKeyType: RootKeyType,
    rootKeyId: t.string,
    encryptedPrv: t.string,
    publicIdentifier: t.string,
    fromPubKey: t.string,
    toPubKey: t.string,
    path: t.string,
  },
  'VaultShareKeychain'
);

export const VaultShareData = t.intersection(
  [
    t.type({
      id: t.string,
      enterpriseId: t.string,
      vaultId: t.string,
      fromUser: t.string,
      toUser: t.string,
      permissions: t.array(VaultPermission),
      state: VaultShareState,
      createdAt: DateFromISOString,
    }),
    t.partial({
      vaultLabel: t.string,
      message: t.string,
      pendingApprovalId: t.string,
      isUMSInitiated: t.boolean,
      keychains: t.array(VaultShareKeychain),
      updatedAt: DateFromISOString,
    }),
  ],
  'VaultShareData'
);

// ---- request bodies ----

/** POST /enterprise/:eId/vaults — Phase 1 carries no key material. */
export const InitializeVaultBody = t.type({ label: t.string }, 'InitializeVaultBody');

/** POST /enterprise/:eId/vaults/:vId/finalize — the 12 key ids as 4 ordered triplets. */
export const FinalizeVaultBody = t.type({ rootKeys: VaultRootKeys }, 'FinalizeVaultBody');

/** POST/DELETE /enterprise/:eId/vaults/:vId/freeze */
export const FreezeVaultBody = t.partial({ duration: t.number }, 'FreezeVaultBody');
