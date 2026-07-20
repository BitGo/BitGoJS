import type { BitGoRequest, DecryptOptions, EncryptionVersion, EncryptOptions } from '../api';

/**
 * Minimal BitGo client surface used by the **v1** Wallets facade
 * (`modules/sdk-api/src/v1/wallets.ts`).
 *
 * Intentionally **not** {@link BitGoBase}: importing `BitGoBase` here would
 * create a circular module dependency with `bitgoBase.ts`.
 * Import graph: `bitgoBase → v1Wallets → api` (acyclic).
 *
 * @see BitGoApiV1Wallets for the collection returned by `bitgo.wallets()`
 * @see IWallets for the **v2** coin wallets API (`bitgo.coin(name).wallets()`)
 */
export type BitGoApiV1BitGo = {
  get(url: string): BitGoRequest;
  post(url: string): BitGoRequest;
  del(url: string): BitGoRequest;
  url(path: string, version?: number): string;
  encrypt(params: EncryptOptions): Promise<string>;
  decrypt(params: DecryptOptions): Promise<string>;
  getECDHKeychain(): Promise<{ encryptedXprv?: string; xprv?: string }>;
  keychains(): BitGoApiV1Keychains;
};

/**
 * v1 keychains surface used by `createWalletWithKeychains` on
 * {@link BitGoApiV1Wallets}. Distinct from the v2 `IKeychains` API.
 */
export type BitGoApiV1Keychains = {
  create(): { xpub: string; xprv?: string; encryptedXprv?: string };
  add(keychainData: Record<string, unknown>): Promise<unknown>;
  createBackup(params: { provider: string; disableKRSEmail?: boolean }): Promise<{ xpub: string }>;
  createBitGo(): Promise<{ xpub: string }>;
};

/** Legacy Node-style callback used by v1 wallet APIs. */
export type BitGoApiV1Callback<T = unknown> = (err?: Error | null, result?: T) => void;

/**
 * Structural hints for a CommonJS v1 Wallet instance
 * (`modules/sdk-api/src/v1/wallet.ts`) when used as a **parameter**.
 *
 * Not the v2 {@link IWallet} / {@link Wallet} class.
 *
 * Methods that **return** a v1 wallet (`get` / `getWallet` / `add`) still use
 * `Promise<any>`: a stub return type with an index signature broke consumers
 * (e.g. `abstract-utxo` recovery expects `.recover` / `.sweep` and a local
 * `WalletV1` shape). Full typing of `v1/wallet.ts` is a follow-up.
 */
export type BitGoApiV1Wallet = {
  id?: string;
  createAddress?: (params?: Record<string, unknown>) => Promise<unknown>;
};

/** Params for {@link BitGoApiV1Wallets.list}. */
export type BitGoApiV1ListWalletsParams = {
  skip?: number;
  prevId?: string;
  limit?: number;
  getbalances?: boolean;
};

/** Params for {@link BitGoApiV1Wallets.get} / {@link BitGoApiV1Wallets.getWallet}. */
export type BitGoApiV1GetWalletParams = {
  id: string;
  gpk?: boolean | number;
};

/** Params for {@link BitGoApiV1Wallets.cancelInvite}. */
export type BitGoApiV1WalletInviteParams = {
  walletInviteId: string;
};

/** Params for v1 wallet-share methods on {@link BitGoApiV1Wallets}. */
export type BitGoApiV1WalletShareParams = {
  walletShareId: string;
  state?: string;
  encryptedXprv?: string;
  userPassword?: string;
  newWalletPassphrase?: string;
  overrideEncryptedXprv?: string;
  encryptionVersion?: EncryptionVersion;
};

/** Params for {@link BitGoApiV1Wallets.createWalletWithKeychains}. */
export type BitGoApiV1CreateWalletWithKeychainsParams = {
  passphrase: string;
  label?: string;
  backupXpub?: string;
  backupXpubProvider?: string;
  enterprise?: string;
  passcodeEncryptionCode?: string;
  disableTransactionNotifications?: boolean;
  disableKRSEmail?: boolean;
  encryptionVersion?: EncryptionVersion;
};

/** Params for {@link BitGoApiV1Wallets.createForwardWallet}. */
export type BitGoApiV1CreateForwardWalletParams = {
  privKey: string;
  sourceAddress: string;
  destinationWallet: BitGoApiV1Wallet;
  label?: string;
  enterprise?: string;
};

/** Params for {@link BitGoApiV1Wallets.add}. */
export type BitGoApiV1AddWalletParams = {
  label?: string;
  m: number;
  n: number;
  keychains: { xpub: string }[];
  enterprise?: string;
  disableTransactionNotifications?: boolean;
};

/** Params for {@link BitGoApiV1Wallets.remove}. */
export type BitGoApiV1RemoveWalletParams = {
  id: string;
};

/**
 * **Deprecated v1** wallet collection facade returned by
 * {@link BitGoBase.wallets} / `BitGoAPI.wallets()`.
 *
 * Source of truth: `modules/sdk-api/src/v1/wallets.ts` (CommonJS prototype).
 *
 * | Accessor | Type | API |
 * | --- | --- | --- |
 * | `bitgo.wallets()` | {@link BitGoApiV1Wallets} | **v1** (this type) |
 * | `bitgo.coin(name).wallets()` | {@link IWallets} | **v2** (not this type) |
 *
 * Replaces the previous `wallets(): any` on {@link BitGoBase}.
 *
 * @deprecated Prefer `bitgo.coin(coinName).wallets()` ({@link IWallets}).
 */
export type BitGoApiV1Wallets = {
  /** Owning BitGo client (v1 surface only; see {@link BitGoApiV1BitGo}). */
  bitgo: BitGoApiV1BitGo;
  list(params?: BitGoApiV1ListWalletsParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  /**
   * Returns a CommonJS v1 Wallet instance.
   * Typed as `any` until `sdk-api/src/v1/wallet.ts` is fully typed (call sites
   * use `.recover` / `.sweep` / local `WalletV1` shapes).
   */
  getWallet(params: BitGoApiV1GetWalletParams, callback?: BitGoApiV1Callback): Promise<any>;
  /** Shorthand for {@link BitGoApiV1Wallets.getWallet}. */
  get(params: BitGoApiV1GetWalletParams, callback?: BitGoApiV1Callback): Promise<any>;
  listInvites(params?: Record<string, unknown>, callback?: BitGoApiV1Callback): Promise<unknown>;
  cancelInvite(params: BitGoApiV1WalletInviteParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  listShares(params?: Record<string, unknown>, callback?: BitGoApiV1Callback): Promise<unknown>;
  resendShareInvite(params: BitGoApiV1WalletShareParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  getShare(params: BitGoApiV1WalletShareParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  updateShare(params: BitGoApiV1WalletShareParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  cancelShare(params: BitGoApiV1WalletShareParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  acceptShare(params: BitGoApiV1WalletShareParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  createKey(params?: Record<string, unknown>): { address: string; key: string };
  createWalletWithKeychains(
    params: BitGoApiV1CreateWalletWithKeychainsParams,
    callback?: BitGoApiV1Callback
  ): Promise<unknown>;
  createForwardWallet(params: BitGoApiV1CreateForwardWalletParams, callback?: BitGoApiV1Callback): Promise<unknown>;
  /** Returns a CommonJS v1 Wallet instance (`any` — see {@link BitGoApiV1Wallets.getWallet}). */
  add(params: BitGoApiV1AddWalletParams, callback?: BitGoApiV1Callback): Promise<any>;
  remove(params: BitGoApiV1RemoveWalletParams, callback?: BitGoApiV1Callback): Promise<unknown>;
};
