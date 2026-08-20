/**
 * @prettier
 *
 * Reusable Token-2022 resolution logic (Transfer Hook extra accounts and sRFC-37
 * Token ACL permissionless thaw), decoupled from the `Sol` coin class so any caller
 * with its own account-fetcher (e.g. wallet-platform reading chain state via IMS RPC)
 * can resolve these dependencies offline of the SDK's node transport.
 *
 * The resolution functions take a `Connection` (only `getAccountInfo` is required);
 * {@link buildSolAccountConnection} adapts a plain {@link SolAccountFetcher} into the
 * shape `@solana/spl-token`'s transfer-hook helpers expect.
 */

import {
  TOKEN_2022_PROGRAM_ID,
  addExtraAccountMetasForExecute,
  createTransferCheckedInstruction,
  getExtraAccountMetas,
  getTransferHook,
  resolveExtraAccountMeta,
  unpackMint,
} from '@solana/spl-token';
import {
  AccountInfo,
  AccountMeta,
  Commitment,
  Connection,
  PublicKey as SolPublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  THAW_PERMISSIONLESS_IDEMPOTENT_DISCRIMINATOR,
  TOKEN_ACL_FLAG_ACCOUNT_SEED,
  TOKEN_ACL_MINT_CONFIG_SEED,
  TOKEN_ACL_PROGRAM_ID,
  TOKEN_ACL_THAW_EXTRA_METAS_SEED,
} from './constants';
import { ExtraAccountMeta } from './iface';

/**
 * A minimal account-fetcher: given a base58 address, return its on-chain
 * {@link AccountInfo} (with `data` already decoded into a `Buffer`) or `null`
 * when the account does not exist. Callers supply their own transport (SDK node
 * request, wallet-platform IMS RPC, a full `Connection`, etc.).
 */
export type SolAccountFetcher = (address: string) => Promise<AccountInfo<Buffer> | null>;

/**
 * Result of resolving the sRFC-37 Token ACL permissionless thaw for a mint / token account.
 *
 * When `applicable` is false (the mint has no Token ACL MintConfig, or permissionless thaw is
 * disabled) all other fields are omitted and the caller should not emit a thaw instruction.
 * When `applicable` is true, the fields are ready to thread into the token-transfer builder via
 * `permissionlessThaw(...)`.
 */
export interface ResolvePermissionlessThawResult {
  applicable: boolean;
  gatingProgram?: string;
  flagAccount?: string;
  mintConfig?: string;
  tokenProgram?: string;
  systemProgram?: string;
  extraAccounts?: ExtraAccountMeta[];
}

/**
 * Build a minimal `Connection`-like shim backed by a {@link SolAccountFetcher}.
 *
 * `@solana/spl-token`'s transfer-hook resolution helpers only require
 * `getAccountInfo(publicKey)` returning an `AccountInfo<Buffer>`. This adapts a
 * plain address-based fetcher to that shape so any transport can drive the
 * resolution below without opening a dedicated RPC connection.
 *
 * @param {SolAccountFetcher} fetch - fetcher returning decoded account info by address
 * @returns {Connection} a shim exposing `getAccountInfo`, cast to `Connection`
 */
export function buildSolAccountConnection(fetch: SolAccountFetcher): Connection {
  const getAccountInfo = async (
    publicKey: SolPublicKey,
    _commitmentOrConfig?: Commitment
  ): Promise<AccountInfo<Buffer> | null> => {
    return fetch(publicKey.toBase58());
  };
  return { getAccountInfo } as unknown as Connection;
}

/**
 * Map the extra keys appended to a resolved transfer instruction into the
 * serializable {@link ExtraAccountMeta} shape.
 */
function toExtraAccountMetas(instruction: TransactionInstruction, baseKeyCount: number): ExtraAccountMeta[] {
  return instruction.keys.slice(baseKeyCount).map((meta) => ({
    pubkey: meta.pubkey.toBase58(),
    isSigner: meta.isSigner,
    isWritable: meta.isWritable,
  }));
}

/**
 * Decode the fields of a Token ACL MintConfig account we depend on.
 *
 * Layout: `u8 discriminator, u8 bump, bool enablePermissionlessThaw, bool enablePermissionlessFreeze,
 * pubkey mint(32), pubkey freezeAuthority(32), pubkey gatingProgram(32)`.
 */
function decodeTokenAclMintConfig(data: Buffer): { enablePermissionlessThaw: boolean; gatingProgram: SolPublicKey } {
  const enablePermissionlessThaw = data[2] === 1;
  const gatingProgram = new SolPublicKey(data.subarray(68, 100));
  return { enablePermissionlessThaw, gatingProgram };
}

/**
 * Resolve the gating program's thaw ExtraAccountMetaList onto a can-thaw context.
 *
 * Mirrors the reference `resolveExtraMetas`: fetch the extra-metas account, unpack its
 * ExtraAccountMeta entries, then resolve each one (fixed address, PDA, or account-data derived)
 * against the accumulating metas using the spl-token transfer-hook helpers. When the extra-metas
 * account does not exist, there are no extras to append.
 */
async function resolveTokenAclExtraMetas(
  connection: Connection,
  extraMetasAddress: SolPublicKey,
  previousMetas: AccountMeta[],
  gatingProgram: SolPublicKey
): Promise<AccountMeta[]> {
  const instructionData = Buffer.from([THAW_PERMISSIONLESS_IDEMPOTENT_DISCRIMINATOR]);
  const resolvedMetas: AccountMeta[] = [...previousMetas];
  const extraMetasAccount = await connection.getAccountInfo(extraMetasAddress);
  if (!extraMetasAccount) {
    return resolvedMetas;
  }
  const extraAccountMetas = getExtraAccountMetas(extraMetasAccount);
  for (const extraAccountMeta of extraAccountMetas) {
    const resolvedMeta = await resolveExtraAccountMeta(
      connection,
      extraAccountMeta,
      resolvedMetas,
      instructionData,
      gatingProgram
    );
    resolvedMetas.push(resolvedMeta);
  }
  return resolvedMetas;
}

/**
 * Resolve the Token-2022 Transfer Hook extra accounts for a specific transfer.
 *
 * This is generic: it works for any Token-2022 mint by reading the mint's
 * TransferHook extension and the hook program's ExtraAccountMetaList live from
 * the node, then resolving each extra account (including seed-derived PDAs) via
 * the standard `spl-transfer-hook-interface` helpers. The returned metas are in
 * the exact order the hook requires and are suitable for
 * `TokenTransfer.params.transferHookAccounts`.
 *
 * When the mint has no Transfer Hook, this returns an empty array and callers can
 * omit the param.
 *
 * @param {Connection} connection - a `Connection` (or shim) exposing `getAccountInfo`
 * @param params - the transfer parameters
 * @param {string} params.mint - the Token-2022 mint address
 * @param {string} params.source - the source token account (sender ATA)
 * @param {string} params.destination - the destination token account (recipient ATA)
 * @param {string} params.owner - the source account owner / transfer authority
 * @param {string} params.amount - the raw transfer amount in base units
 * @returns {Promise<ExtraAccountMeta[]>} ordered extra account metas, or [] when no hook
 */
export async function resolveTransferHookAccounts(
  connection: Connection,
  params: { mint: string; source: string; destination: string; owner: string; amount: string }
): Promise<ExtraAccountMeta[]> {
  const { mint, source, destination, owner, amount } = params;
  const mintPubkey = new SolPublicKey(mint);

  // Read the mint and detect whether a Transfer Hook extension is configured.
  const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
  if (!mintAccountInfo) {
    return [];
  }
  const mintState = unpackMint(mintPubkey, mintAccountInfo, TOKEN_2022_PROGRAM_ID);
  const transferHook = getTransferHook(mintState);
  if (!transferHook || transferHook.programId.equals(SolPublicKey.default)) {
    return [];
  }

  const sourcePubkey = new SolPublicKey(source);
  const destinationPubkey = new SolPublicKey(destination);
  const ownerPubkey = new SolPublicKey(owner);
  const transferAmount = BigInt(amount);

  // Start from a base transferChecked instruction; addExtraAccountMetasForExecute
  // appends the resolved extra accounts, the hook program, and the validation
  // state account in the required order.
  const instruction = createTransferCheckedInstruction(
    sourcePubkey,
    mintPubkey,
    destinationPubkey,
    ownerPubkey,
    transferAmount,
    mintState.decimals,
    [],
    TOKEN_2022_PROGRAM_ID
  );
  const baseKeyCount = instruction.keys.length;
  await addExtraAccountMetasForExecute(
    connection,
    instruction,
    transferHook.programId,
    sourcePubkey,
    mintPubkey,
    destinationPubkey,
    ownerPubkey,
    transferAmount
  );

  return toExtraAccountMetas(instruction, baseKeyCount);
}

/**
 * Resolve the sRFC-37 Token ACL permissionless-thaw dependencies for a token account.
 *
 * This is generic: it works for ANY allowlist/blocklist (DefaultAccountState) Token-2022 mint
 * gated by the Token ACL program — no issuer is hardcoded. It reads the mint's MintConfig PDA
 * live from the node, and only when permissionless thaw is enabled does it derive the flag /
 * mint-config / thaw-extra-metas PDAs and resolve the gating program's extra account metas (in
 * the exact order the gating program requires, mirroring `resolveExtraMetas`).
 *
 * When the mint is not a Token ACL mint, or permissionless thaw is disabled, this returns
 * `{ applicable: false }` and callers skip the thaw.
 *
 * @param {Connection} connection - a `Connection` (or shim) exposing `getAccountInfo`
 * @param params - the thaw parameters
 * @param {string} params.mint - the Token-2022 mint address
 * @param {string} params.tokenAccount - the token account (ATA) to thaw
 * @param {string} params.tokenAccountOwner - the owner of the token account
 * @param {string} params.authority - the signer invoking the thaw (fee payer / authority)
 * @returns {Promise<ResolvePermissionlessThawResult>} the resolved thaw params, or `{ applicable: false }`
 */
export async function resolvePermissionlessThaw(
  connection: Connection,
  params: { mint: string; tokenAccount: string; tokenAccountOwner: string; authority: string }
): Promise<ResolvePermissionlessThawResult> {
  const { mint, tokenAccount, tokenAccountOwner, authority } = params;
  const mintPubkey = new SolPublicKey(mint);
  const tokenAccountPubkey = new SolPublicKey(tokenAccount);
  const tokenAccountOwnerPubkey = new SolPublicKey(tokenAccountOwner);
  const authorityPubkey = new SolPublicKey(authority);
  const tokenAclProgramId = new SolPublicKey(TOKEN_ACL_PROGRAM_ID);

  // 1. Read the mint's MintConfig PDA. Absent => the mint is not a Token ACL mint.
  const [mintConfigPda] = SolPublicKey.findProgramAddressSync(
    [Buffer.from(TOKEN_ACL_MINT_CONFIG_SEED), mintPubkey.toBuffer()],
    tokenAclProgramId
  );
  const mintConfigAccount = await connection.getAccountInfo(mintConfigPda);
  if (!mintConfigAccount) {
    return { applicable: false };
  }

  // 2. Decode the MintConfig; permissionless thaw must be enabled.
  const mintConfig = decodeTokenAclMintConfig(mintConfigAccount.data);
  if (!mintConfig.enablePermissionlessThaw) {
    return { applicable: false };
  }
  const gatingProgramPubkey = mintConfig.gatingProgram;

  // 3. Derive the remaining PDAs (flag account under Token ACL, thaw extra metas under gating).
  const [flagAccountPda] = SolPublicKey.findProgramAddressSync(
    [Buffer.from(TOKEN_ACL_FLAG_ACCOUNT_SEED), tokenAccountPubkey.toBuffer()],
    tokenAclProgramId
  );
  const [thawExtraMetasPda] = SolPublicKey.findProgramAddressSync(
    [Buffer.from(TOKEN_ACL_THAW_EXTRA_METAS_SEED), mintPubkey.toBuffer()],
    gatingProgramPubkey
  );

  // 4. Build the 6-account can-thaw context (all readonly), then resolve the gating program's
  //    extra account metas onto it.
  const canThawContext: AccountMeta[] = [
    { pubkey: authorityPubkey, isSigner: false, isWritable: false },
    { pubkey: tokenAccountPubkey, isSigner: false, isWritable: false },
    { pubkey: mintPubkey, isSigner: false, isWritable: false },
    { pubkey: tokenAccountOwnerPubkey, isSigner: false, isWritable: false },
    { pubkey: flagAccountPda, isSigner: false, isWritable: false },
    { pubkey: thawExtraMetasPda, isSigner: false, isWritable: false },
  ];
  const resolvedMetas = await resolveTokenAclExtraMetas(
    connection,
    thawExtraMetasPda,
    canThawContext,
    gatingProgramPubkey
  );

  // 5. Drop the first five context accounts; the remainder ([thawExtraMetas, ...extras]) are the
  //    accounts appended after the thaw instruction's fixed nine.
  const extraAccounts = resolvedMetas.slice(5).map((meta) => ({
    pubkey: meta.pubkey.toBase58(),
    isSigner: meta.isSigner,
    isWritable: meta.isWritable,
  }));

  return {
    applicable: true,
    gatingProgram: gatingProgramPubkey.toBase58(),
    flagAccount: flagAccountPda.toBase58(),
    mintConfig: mintConfigPda.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    systemProgram: SystemProgram.programId.toBase58(),
    extraAccounts,
  };
}
