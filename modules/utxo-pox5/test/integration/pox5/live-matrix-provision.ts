import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import type { BitGoAPI } from '@bitgo/sdk-api';
import type { IWallet } from '@bitgo/sdk-core';

import {
  createBitGoApiClient,
  createBitGoWallet,
  isFixedScriptMainWallet,
  outpointFromUnspent,
  responseUnspents,
  summarizeBitGoWallet,
  summarizeUnspent,
} from './bitgo-api';
import { Cell, Checkpoint, Environment, MatrixPrerequisite } from './live-matrix';
import { isRecord, waitFor } from './rpc';
import { loadTestEnvOverlay } from './test-env-config';

export type LiveContext = { bitgo: BitGoAPI; enterprise: string; walletPassphrase?: string; userId: string };
export type LiveActorIdentity = { userId: string; username?: string };
export type LiveApprover = { bitgo: BitGoAPI; userId: string; username: string; otp: string };

function requiredLiveEnv(env: NodeJS.ProcessEnv, names: readonly string[], purpose: string): string {
  for (const name of names) {
    const value = env[name];
    if (value) return value;
  }
  throw new MatrixPrerequisite('BLOCKED', `Missing ${purpose}; set ${names.join(' or ')}`);
}

export function liveUnlockOtp(environment: Environment, env: NodeJS.ProcessEnv): string {
  return requiredLiveEnv(env, [`POX5_LIVE_UNLOCK_OTP_${environment.toUpperCase()}`, 'BITGO_TEST_OTP'], 'unlock OTP');
}

export async function loadLocalPox5Environment(): Promise<void> {
  const directory = join(process.cwd(), 'test/integration/pox5');
  let contents = '';
  try {
    contents = await readFile(join(directory, '.env'), 'utf8');
  } catch (error) {
    if (!(isRecord(error) && error.code === 'ENOENT'))
      throw new Error('Unable to read the local PoX-5 environment file');
  }
  Object.assign(process.env, parseEnv(contents), await loadTestEnvOverlay(directory));
}

export async function authenticateLiveActorIdentity(bitgo: BitGoAPI, otp: string): Promise<LiveActorIdentity> {
  const response: unknown = await bitgo.get(bitgo.url('/user/me')).result();
  const user = isRecord(response) && 'user' in response ? response.user : response;
  if (!isRecord(user) || typeof user.id !== 'string') {
    throw new Error('BitGo authentication did not return a user ID');
  }
  await bitgo.unlock({ otp, duration: 3600 });
  const username =
    typeof user.username === 'string' ? user.username : typeof user.email === 'string' ? user.email : undefined;
  return { userId: user.id, ...(username ? { username } : {}) };
}

export async function authenticateLiveActor(bitgo: BitGoAPI, otp: string): Promise<string> {
  return (await authenticateLiveActorIdentity(bitgo, otp)).userId;
}

export function requireAccessibleEnterprise(enterpriseId: string, accessibleEnterpriseIds: readonly string[]): void {
  if (!accessibleEnterpriseIds.includes(enterpriseId)) {
    throw new MatrixPrerequisite('BLOCKED', 'Configured enterprise ID is not accessible in the selected environment');
  }
}

export function liveWalletPassphrase(environment: Environment, env: NodeJS.ProcessEnv): string {
  return requiredLiveEnv(
    env,
    [`BITGO_WALLET_PASSPHRASE_${environment.toUpperCase()}`, 'BITGO_WALLET_PASSPHRASE'],
    'wallet passphrase'
  );
}

export function liveRecoverySeed(
  environment: Environment,
  walletPassphrase: string | undefined,
  env: NodeJS.ProcessEnv
): string {
  const seed = env[`POX5_LIVE_RECOVERY_SEED_${environment.toUpperCase()}`] ?? walletPassphrase;
  if (!seed || seed.length < 16) {
    throw new MatrixPrerequisite('NOT_READY', 'Stable recovery material is unavailable');
  }
  return seed;
}

export function liveApproverOtp(environment: Environment, env: NodeJS.ProcessEnv): string {
  return requiredLiveEnv(
    env,
    [`POX5_LIVE_APPROVER_OTP_${environment.toUpperCase()}`, 'BITGO_TEST_OTP'],
    'approval OTP'
  );
}

export async function liveContext(
  environment: Environment,
  coin: Cell['coin'],
  env: NodeJS.ProcessEnv
): Promise<LiveContext> {
  const suffix = environment.toUpperCase();
  const enterprise =
    env[`POX5_LIVE_ENTERPRISE_${suffix}`] ?? env[`POX5_BITGO_ENTERPRISE_ID_${suffix}`] ?? env.POX5_BITGO_ENTERPRISE_ID;
  if (!enterprise || !/^[a-zA-Z0-9_-]{1,128}$/.test(enterprise)) {
    throw new MatrixPrerequisite('BLOCKED', 'Missing mandatory environment enterprise ID');
  }
  const token = env[`BITGO_TOKEN_${suffix}`];
  if (!token) throw new MatrixPrerequisite('BLOCKED', 'Missing mandatory environment API token');
  const bitgo = createBitGoApiClient(environment, token);
  const enterprises = await bitgo.coin(coin).enterprises().list();
  requireAccessibleEnterprise(
    enterprise,
    enterprises.map((item) => item.id)
  );
  const userId = await authenticateLiveActor(bitgo, liveUnlockOtp(environment, env));
  return { bitgo, enterprise, walletPassphrase: liveWalletPassphrase(environment, env), userId };
}

export async function liveApprover(
  environment: Environment,
  actor: LiveContext,
  env: NodeJS.ProcessEnv
): Promise<LiveApprover> {
  const token = env[`BITGO_APPROVER_TOKEN_${environment.toUpperCase()}`];
  const otp = liveApproverOtp(environment, env);
  if (!token) throw new MatrixPrerequisite('BLOCKED', 'Separate custodial approver token is not configured');
  if (token === env[`BITGO_TOKEN_${environment.toUpperCase()}`]) {
    throw new MatrixPrerequisite('BLOCKED', 'Custodial approver must have distinct credentials');
  }
  const bitgo = createBitGoApiClient(environment, token);
  let identity: LiveActorIdentity;
  try {
    identity = await authenticateLiveActorIdentity(bitgo, liveUnlockOtp(environment, env));
  } catch (error) {
    const status =
      error && typeof error === 'object'
        ? 'status' in error
          ? error.status
          : 'statusCode' in error
          ? error.statusCode
          : undefined
        : undefined;
    if (
      status === 401 ||
      status === 403 ||
      (status === 400 && error instanceof Error && /otp|unlock|auth/i.test(error.message)) ||
      (error instanceof Error && /invalid.*otp|incorrect.*otp|unauthorized|forbidden/i.test(error.message))
    ) {
      throw new MatrixPrerequisite('BLOCKED', 'Distinct custodial actor could not authenticate or unlock');
    }
    throw error;
  }
  if (identity.userId === actor.userId) {
    throw new MatrixPrerequisite('BLOCKED', 'Custodial approver must be a different user');
  }
  if (!identity.username) {
    throw new MatrixPrerequisite('BLOCKED', 'Custodial approver profile has no enterprise invitation username');
  }
  return { bitgo, userId: identity.userId, username: identity.username, otp };
}

export type LiveCustodyAdmin = { bitgo: BitGoAPI; userId: string; username: string };

/**
 * Client for the custodyadmin actor that uploads the OVC half-signed
 * transaction and resolves the pending approval. Wallet Platform records one
 * resolution per user, so the uploader must be distinct from the policy
 * approver (verified on the test env: the approver's own upload fails with
 * "cannot approve an action multiple times"). This mirrors the BitGo Trust
 * operational split: the enterprise approver authorizes, BitGo Trust custody
 * uploads.
 */
export async function liveCustodyAdmin(
  environment: Environment,
  env: NodeJS.ProcessEnv,
  distinctFrom: { userId: string }
): Promise<LiveCustodyAdmin> {
  const token = env[`BITGO_CUSTODYADMIN_TOKEN_${environment.toUpperCase()}`];
  if (!token) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'Custodial upload requires a custodyadmin session (BITGO_CUSTODYADMIN_TOKEN_... from the custodyadmin user session file)'
    );
  }
  if (
    token === env[`BITGO_TOKEN_${environment.toUpperCase()}`] ||
    token === env[`BITGO_APPROVER_TOKEN_${environment.toUpperCase()}`]
  ) {
    throw new MatrixPrerequisite('BLOCKED', 'Custodial uploader must have distinct credentials');
  }
  const bitgo = createBitGoApiClient(environment, token);
  let identity: LiveActorIdentity;
  try {
    identity = await authenticateLiveActorIdentity(bitgo, liveUnlockOtp(environment, env));
  } catch (error) {
    const status =
      error && typeof error === 'object'
        ? 'status' in error
          ? error.status
          : 'statusCode' in error
          ? error.statusCode
          : undefined
        : undefined;
    if (
      status === 401 ||
      status === 403 ||
      (status === 400 && error instanceof Error && /otp|unlock|auth/i.test(error.message)) ||
      (error instanceof Error && /invalid.*otp|incorrect.*otp|unauthorized|forbidden/i.test(error.message))
    ) {
      throw new MatrixPrerequisite('BLOCKED', 'Custodial upload actor could not authenticate or unlock');
    }
    throw error;
  }
  if (identity.userId === distinctFrom.userId) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'Custodial upload actor must be a different user than the policy approver (one resolution per user)'
    );
  }
  if (!identity.username) {
    throw new MatrixPrerequisite('BLOCKED', 'Custodial upload actor profile has no username');
  }
  return { bitgo, userId: identity.userId, username: identity.username };
}

type PendingEnterpriseInvite = { id: string; permissions: unknown };

function matchingPendingEnterpriseInvite(
  value: unknown,
  enterpriseId: string,
  userId: string
): PendingEnterpriseInvite | undefined {
  if (
    !isRecord(value) ||
    value.state !== 'pending' ||
    value.enterprise !== enterpriseId ||
    typeof value.id !== 'string'
  ) {
    return undefined;
  }
  const info = isRecord(value.info) ? value.info : undefined;
  const request = info && isRecord(info.enterpriseInviteRequest) ? info.enterpriseInviteRequest : undefined;
  if (info?.type !== 'enterpriseInviteRequest' || request?.action !== 'add' || request.userId !== userId) {
    return undefined;
  }
  return { id: value.id, permissions: request.permissions ?? request.permission };
}

async function pendingEnterpriseInvites(approver: LiveApprover): Promise<unknown[]> {
  const response: unknown = await approver.bitgo
    .get(approver.bitgo.url('/pendingApprovals', 2))
    .query({ requestType: 'enterpriseInviteRequest' })
    .result();
  if (!isRecord(response) || !Array.isArray(response.pendingApprovals)) {
    throw new Error('Approver pending enterprise invitations response is invalid');
  }
  return response.pendingApprovals;
}

function responseInviteId(response: unknown): string | undefined {
  if (!isRecord(response)) return undefined;
  const pendingApproval = isRecord(response.pendingApproval) ? response.pendingApproval : response;
  return typeof pendingApproval.id === 'string' ? pendingApproval.id : undefined;
}

export async function ensureEnterpriseApproverMembership(
  cell: Cell,
  actor: LiveContext,
  approver: LiveApprover,
  checkpoint: Checkpoint
): Promise<{ enterpriseAccess: 'PROVISIONED' | 'REUSED'; enterpriseInviteApprovalId?: string }> {
  const accessible = await approver.bitgo.coin(cell.coin).enterprises().list();
  if (accessible.some((enterprise) => enterprise.id === actor.enterprise)) {
    await checkpoint({ enterpriseAccess: 'REUSED' });
    return { enterpriseAccess: 'REUSED' };
  }

  let matches = (await pendingEnterpriseInvites(approver))
    .map((invite) => matchingPendingEnterpriseInvite(invite, actor.enterprise, approver.userId))
    .filter((invite): invite is PendingEnterpriseInvite => invite !== undefined);
  if (matches.length > 1) {
    throw new MatrixPrerequisite('BLOCKED', 'Multiple enterprise invitations exist for the custodial approver');
  }

  let invite = matches[0];
  if (!invite) {
    const created: unknown = await actor.bitgo
      .post(actor.bitgo.url(`/enterprise/${actor.enterprise}/user`, 2))
      .send({ username: approver.username, invite: true })
      .result();
    const inviteId = responseInviteId(created);
    if (inviteId) await checkpoint({ enterpriseInviteApprovalId: inviteId });
    matches = (await pendingEnterpriseInvites(approver))
      .map((pending) => matchingPendingEnterpriseInvite(pending, actor.enterprise, approver.userId))
      .filter((pending): pending is PendingEnterpriseInvite => pending !== undefined);
    if (matches.length > 1) {
      throw new MatrixPrerequisite('BLOCKED', 'Multiple enterprise invitations exist for the custodial approver');
    }
    invite = matches[0];
  }

  if (!invite) {
    throw new MatrixPrerequisite('NOT_READY', 'Enterprise invitation is not visible in the approver inbox');
  }
  if (invite.permissions !== undefined && (!Array.isArray(invite.permissions) || invite.permissions.length !== 0)) {
    throw new MatrixPrerequisite('BLOCKED', 'Enterprise invitation requests permissions beyond basic membership');
  }

  await checkpoint({ enterpriseInviteApprovalId: invite.id });
  await approver.bitgo
    .put(approver.bitgo.url(`/pendingapprovals/${invite.id}`, 2))
    .send({ state: 'approved', otp: approver.otp })
    .result();

  const response: unknown = await approver.bitgo.get(approver.bitgo.url('/user/settings', 2)).result();
  const settings = isRecord(response) && isRecord(response.settings) ? response.settings : undefined;
  const memberships = settings && Array.isArray(settings.enterprises) ? settings.enterprises : [];
  const membership = memberships.find((entry) => isRecord(entry) && entry.id === actor.enterprise);
  if (!isRecord(membership) || membership.acceptedInvite !== true) {
    throw new MatrixPrerequisite('NOT_READY', 'Accepted enterprise invitation is not visible in approver settings');
  }
  if (!Array.isArray(membership.permissions) || membership.permissions.length !== 0) {
    throw new MatrixPrerequisite('BLOCKED', 'Accepted enterprise invitation did not grant zero enterprise permissions');
  }

  await checkpoint({ enterpriseInviteApprovalId: invite.id, enterpriseAccess: 'PROVISIONED' });
  return { enterpriseInviteApprovalId: invite.id, enterpriseAccess: 'PROVISIONED' };
}

function hasApproverWalletPermissions(permissions: readonly string[] | undefined): boolean {
  return !!permissions?.includes('admin') && permissions.includes('view') && !permissions.includes('spend');
}

function shareIdFromResponse(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') return undefined;
  if ('id' in response && typeof response.id === 'string') return response.id;
  if ('walletShareId' in response && typeof response.walletShareId === 'string') return response.walletShareId;
  return undefined;
}

function checkSharePermissions(permissions: readonly string[] | undefined, hasKeychain: boolean): void {
  if (!hasApproverWalletPermissions(permissions) || hasKeychain) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'Custodial approver wallet access must be admin/view without spend or shared key material'
    );
  }
}

async function verifyApproverWalletAccess(
  cell: Cell,
  walletId: string,
  enterpriseId: string,
  approver: { bitgo: BitGoAPI; userId: string }
): Promise<void> {
  const coin = approver.bitgo.coin(cell.coin);
  const [wallet, enterprises] = await Promise.all([coin.wallets().get({ id: walletId }), coin.enterprises().list()]);
  const member = wallet.toJSON().users?.find((user) => user.user === approver.userId);
  checkSharePermissions(member?.permissions, false);
  if (!enterprises.some((enterprise) => enterprise.id === enterpriseId)) {
    throw new MatrixPrerequisite('BLOCKED', 'Custodial approver does not have access to the dedicated enterprise');
  }
}

export async function ensureCustodialApproverWalletAccess(
  cell: Cell,
  ownerWallet: IWallet,
  actorId: string,
  approver: { bitgo: BitGoAPI; userId: string },
  checkpoint: Checkpoint
): Promise<{ approverWalletShareId?: string; approverAccess: 'PROVISIONED' | 'REUSED' }> {
  if (cell.walletType !== 'custodial') {
    throw new MatrixPrerequisite('UNSUPPORTED', 'Approver wallet sharing is only for custodial wallets');
  }

  const walletId = ownerWallet.id();
  const enterpriseId = ownerWallet.toJSON().enterprise;
  if (typeof enterpriseId !== 'string') {
    throw new MatrixPrerequisite('BLOCKED', 'Dedicated custodial wallet has no enterprise association');
  }
  const member = ownerWallet.toJSON().users?.find((user) => user.user === approver.userId);
  if (member) {
    checkSharePermissions(member.permissions, false);
    await verifyApproverWalletAccess(cell, walletId, enterpriseId, approver);
    await checkpoint({ approverAccess: 'REUSED' });
    return { approverAccess: 'REUSED' };
  }

  const approverWallets = approver.bitgo.coin(cell.coin).wallets();
  const shares = await approverWallets.listSharesV2();
  const walletShares = shares.incoming.filter((share) => share.wallet === walletId && share.toUser === approver.userId);
  if (walletShares.some((share) => share.fromUser !== actorId)) {
    throw new MatrixPrerequisite('BLOCKED', 'A different user invited the custodial approver to this wallet');
  }
  const incoming = walletShares;
  if (incoming.length > 1) {
    throw new MatrixPrerequisite('BLOCKED', 'Multiple pending wallet shares exist for the custodial approver');
  }

  let shareId: string;
  let shareState: string | undefined;
  let sharePermissions: readonly string[] | undefined;
  let hasKeychain = false;
  if (incoming.length === 1) {
    const share = incoming[0];
    shareId = share.id;
    shareState = share.state;
    sharePermissions = share.permissions;
    hasKeychain = share.keychain !== undefined;
    if (shareState === 'canceled' || shareState === 'rejected') {
      throw new MatrixPrerequisite('BLOCKED', 'Existing custodial approver wallet share was canceled or rejected');
    }
    checkSharePermissions(sharePermissions, hasKeychain);
  } else {
    // Custodial approval needs wallet admin access, but not signing or spend key material.
    const response: unknown = await ownerWallet.createShare({
      user: approver.userId,
      permissions: 'admin,view',
      skipKeychain: true,
      disableEmail: true,
    });
    const createdShareId = shareIdFromResponse(response);
    if (!createdShareId) {
      throw new Error('Custodial approver wallet share response has no identifier');
    }
    shareId = createdShareId;
  }

  await checkpoint({ approverWalletShareId: shareId });
  // 'active' means approved but not yet accepted by the recipient; only 'accepted' is terminal.
  if (shareState !== 'accepted') {
    await approverWallets.acceptShare({ walletShareId: shareId });
  }

  await verifyApproverWalletAccess(cell, walletId, enterpriseId, approver);
  await checkpoint({ approverWalletShareId: shareId, approverAccess: 'PROVISIONED' });
  return { approverWalletShareId: shareId, approverAccess: 'PROVISIONED' };
}

export function dedicatedLabel(
  cell: Cell,
  purpose: 'create' | 'fund' | 'stake' | 'standalone',
  runId?: string
): string {
  return `pox5-live-${cell.environment}-${cell.coin}-${cell.walletType}-${purpose}${
    runId ? `-${runId.slice(0, 8)}` : ''
  }`;
}

export async function dedicatedMainWallet(
  cell: Cell,
  context: LiveContext,
  label: string,
  fresh: boolean,
  checkpoint: Checkpoint,
  allowCreate = true
): Promise<{ wallet: IWallet; provisioning: 'CREATED' | 'REUSED' }> {
  const wallets = context.bitgo.coin(cell.coin).wallets();
  const matches: ReturnType<typeof summarizeBitGoWallet>[] = [];
  for (let skip = 0; skip < 10_000; skip += 100) {
    const page = await wallets.list({ limit: 100, skip });
    matches.push(...page.wallets.map(summarizeBitGoWallet).filter((item) => item.label === label));
    if (page.wallets.length < 100) break;
    if (skip === 9_900) throw new Error('Wallet list size prevents checking dedicated label uniqueness');
  }
  if (matches.length > 1 || (fresh && matches.length !== 0)) {
    throw new Error('Dedicated wallet label is ambiguous or was previously created');
  }
  if (matches.length === 0 && !allowCreate) {
    throw new MatrixPrerequisite('NOT_READY', 'Dedicated fixture wallet has not been provisioned');
  }
  if (matches.length === 0 && cell.walletType === 'custodial') {
    const enterprise = await context.bitgo.coin(cell.coin).enterprises().get({ id: context.enterprise });
    const data = isRecord(enterprise) && isRecord(enterprise._enterprise) ? enterprise._enterprise : undefined;
    if (data?.canCreateCustodialWallet === false) {
      throw new MatrixPrerequisite('UNSUPPORTED', 'Configured enterprise is not enabled to create custodial wallets');
    }
  }
  if (cell.walletType === 'hot' && !context.walletPassphrase) {
    throw new MatrixPrerequisite('BLOCKED', 'Hot wallet passphrase is not configured');
  }
  await checkpoint({ label });
  const summary =
    matches[0] ??
    (await createBitGoWallet(context.bitgo, cell.coin, {
      label,
      walletType: cell.walletType,
      walletPassphrase: context.walletPassphrase,
      enterprise: context.enterprise,
    }));
  const wallet = await wallets.get({ id: summary.id });
  const verified = summarizeBitGoWallet(wallet);
  if (
    verified.id !== summary.id ||
    verified.label !== label ||
    verified.coin !== cell.coin ||
    !isFixedScriptMainWallet(verified, cell.walletType) ||
    wallet.toJSON().enterprise !== context.enterprise
  ) {
    throw new Error('Dedicated wallet ownership or type does not match this matrix cell');
  }
  const provisioning = matches.length ? 'REUSED' : 'CREATED';
  await checkpoint({ walletId: wallet.id(), provisioning });
  return { wallet, provisioning };
}

export async function indexedDeposit(
  wallet: IWallet,
  txid: string,
  address: string,
  timeoutMs: number
): Promise<{ outpoint: string; amountSats: number; confirmations: number }> {
  let indexed: { outpoint: string; amountSats: number; confirmations: number } | undefined;
  await waitFor(
    'BitGo to index the confirmed dedicated deposit',
    async () => {
      const unspents = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1 }));
      for (const unspent of unspents) {
        const outpoint = outpointFromUnspent(unspent);
        const summary = summarizeUnspent(unspent);
        if (!outpoint?.startsWith(`${txid.toLowerCase()}:`) || summary.address !== address) continue;
        const amountSats = typeof summary.amountSats === 'string' ? Number(summary.amountSats) : NaN;
        // BitGo filters this query with minConfirms: 1 but may omit the count field.
        const confirmations = typeof summary.confirmations === 'number' ? summary.confirmations : 1;
        if (!Number.isSafeInteger(amountSats) || amountSats <= 0 || confirmations < 1) continue;
        indexed = { outpoint, amountSats, confirmations };
        return true;
      }
      return false;
    },
    timeoutMs,
    15_000
  );
  if (!indexed) throw new Error('Confirmed faucet deposit was not indexed on the exact wallet address');
  return indexed;
}
