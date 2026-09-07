import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { IWallet } from '@bitgo/sdk-core';
import type { BitGoAPI } from '@bitgo/sdk-api';

import {
  checkedEvidence,
  executeMatrix,
  type Evidence,
  Handlers,
  isStrictFailure,
  matrixCells,
  matrixSummary,
  MatrixPrerequisite,
  newReport,
  operations,
  type Handler,
  type Operation,
} from './live-matrix';
import { confirmedInput, createLiveHandlers } from './live-matrix-live';
import {
  authenticateLiveActor,
  authenticateLiveActorIdentity,
  ensureEnterpriseApproverMembership,
  ensureCustodialApproverWalletAccess,
  indexedDeposit,
  liveApproverOtp,
  liveUnlockOtp,
  liveRecoverySeed,
  liveWalletPassphrase,
  type LiveApprover,
  type LiveContext,
  requireAccessibleEnterprise,
} from './live-matrix-provision';

describe('live PoX-5 matrix bookkeeping (offline)', function () {
  it('enumerates every environment, coin, wallet type and operation independently', function () {
    assert.equal(matrixCells().length, 12);
    assert.deepEqual(operations, [
      'walletCreation',
      'faucetFunding',
      'pairedStake',
      'pairedPostCltvRecovery',
      'standaloneStake',
      'standalonePostCltvRecovery',
    ]);
    assert.equal(
      operations.some((operation) => operation.toLowerCase().includes('early')),
      false
    );
    assert.equal(newReport().rows.length, 12 * operations.length);
    assert.deepEqual(
      newReport({ environment: 'staging', coin: 'tbtcstxsignet', walletType: 'hot' }, ['pairedStake']).rows.map(
        (row) => row.operation
      ),
      ['pairedStake']
    );
    assert.match(matrixSummary(newReport()), /Early exit is a separate diagnostic, not post-CLTV recovery/);
    assert.equal(matrixCells({ environment: 'test', coin: 'tbtcstxsignet', walletType: 'custodial' }).length, 1);
    assert.equal(
      newReport().rows.every((row) => row.status === 'NOT_RUN'),
      true
    );
  });

  it('only treats a verified fresh wallet creation as creation coverage', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-matrix-'));
    try {
      const handler: Handler = async () => ({ walletId: 'wallet' });
      const handlers: Handlers = {
        walletCreation: handler,
        faucetFunding: handler,
        pairedStake: handler,
        pairedPostCltvRecovery: handler,
        standaloneStake: handler,
        standalonePostCltvRecovery: handler,
      };
      handlers.walletCreation = async () => ({ walletId: 'wallet', provisioning: 'REUSED' });
      const report = await executeMatrix(join(dir, 'report.json'), handlers, { coin: 'tbtcstxsignet' });
      assert.equal(report.rows[0].status, 'FAIL');
      assert.equal(isStrictFailure(report), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('persists partial evidence, redacts unknown errors, and does not repeat finished calls', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-matrix-'));
    const path = join(dir, 'report.json');
    let calls = 0;
    try {
      const handler =
        (operation: (typeof operations)[number]): Handler =>
        async (_cell, _row, checkpoint) => {
          calls++;
          if (operation === 'walletCreation') return { walletId: 'w1', provisioning: 'CREATED' };
          if (operation === 'pairedStake') {
            await checkpoint({ txid: 'abc123' });
            throw new Error('secret token and wallet passphrase');
          }
          if (operation === 'standalonePostCltvRecovery')
            throw new MatrixPrerequisite('NOT_READY', 'No mature fixture');
          return { walletId: 'w1' };
        };
      const handlers: Handlers = {
        walletCreation: handler('walletCreation'),
        faucetFunding: handler('faucetFunding'),
        pairedStake: handler('pairedStake'),
        pairedPostCltvRecovery: handler('pairedPostCltvRecovery'),
        standaloneStake: handler('standaloneStake'),
        standalonePostCltvRecovery: handler('standalonePostCltvRecovery'),
      };
      const selection = { environment: 'test' as const, coin: 'tbtcstx' as const, walletType: 'hot' as const };
      const first = await executeMatrix(path, handlers, selection);
      const stored = await readFile(path, 'utf8');
      assert.equal(stored.includes('secret token'), false);
      assert.equal(first.rows[2].status, 'FAIL');
      assert.equal(first.rows[2].evidence.txid, 'abc123');
      assert.equal(first.rows[5].status, 'NOT_READY');
      assert.equal(isStrictFailure(first), true);
      await executeMatrix(path, handlers, selection);
      assert.equal(calls, 6);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('fails closed for unsupported and blocked paths, but not optional NOT_READY', function () {
    const report = newReport({ environment: 'test', coin: 'tbtcstx', walletType: 'hot' });
    for (const row of report.rows) {
      row.status = row.operation === 'walletCreation' || row.operation === 'faucetFunding' ? 'PASS' : 'NOT_READY';
    }
    assert.equal(isStrictFailure(report), false);
    report.rows[3].status = 'BLOCKED';
    assert.equal(isStrictFailure(report), true);
    report.rows[3].status = 'UNSUPPORTED';
    assert.equal(isStrictFailure(report), true);
  });

  it('rejects evidence that could contain secrets or invalid amounts', function () {
    assert.throws(() => checkedEvidence({ walletId: 'token with spaces' }), /Unsafe walletId/);
    assert.throws(() => checkedEvidence({ amountSats: -1 }), /Invalid amountSats/);
    assert.deepEqual(checkedEvidence({ txid: 'abc', amountSats: 42 }), { txid: 'abc', amountSats: 42 });
  });

  it('does not replay an interrupted wallet creation attempt', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-matrix-'));
    const path = join(dir, 'report.json');
    try {
      const selection = { environment: 'test' as const, coin: 'tbtcstx' as const, walletType: 'hot' as const };
      const report = newReport(selection);
      report.rows[0].startedAt = new Date().toISOString();
      report.rows[0].evidence.label = 'dedicated-wallet-label';
      await writeFile(path, JSON.stringify(report));
      let creationCalls = 0;
      const handler: Handler = async () => ({});
      const handlers: Handlers = {
        walletCreation: async () => {
          creationCalls++;
          return { provisioning: 'CREATED' };
        },
        faucetFunding: handler,
        pairedStake: handler,
        pairedPostCltvRecovery: handler,
        standaloneStake: handler,
        standalonePostCltvRecovery: handler,
      };
      const resumed = await executeMatrix(path, handlers, selection);
      assert.equal(creationCalls, 0);
      assert.equal(resumed.rows[0].status, 'BLOCKED');
      assert.equal(resumed.rows[0].evidence.label, 'dedicated-wallet-label');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('executes only an explicitly selected operation', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-matrix-'));
    const calls = new Map<Operation, number>();
    const handler =
      (operation: Operation): Handler =>
      async () => {
        calls.set(operation, (calls.get(operation) ?? 0) + 1);
        return {};
      };
    try {
      const handlers: Handlers = {
        walletCreation: handler('walletCreation'),
        faucetFunding: handler('faucetFunding'),
        pairedStake: handler('pairedStake'),
        pairedPostCltvRecovery: handler('pairedPostCltvRecovery'),
        standaloneStake: handler('standaloneStake'),
        standalonePostCltvRecovery: handler('standalonePostCltvRecovery'),
      };
      const report = await executeMatrix(
        join(dir, 'report.json'),
        handlers,
        { environment: 'staging', coin: 'tbtcstxsignet', walletType: 'hot' },
        0,
        ['pairedStake']
      );
      assert.equal(report.rows.length, 1);
      assert.equal(report.rows[0].operation, 'pairedStake');
      assert.deepEqual([...calls.entries()], [['pairedStake', 1]]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('persists mandatory credential blockers without contacting a live service', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-matrix-'));
    try {
      const report = await executeMatrix(
        join(dir, 'report.json'),
        createLiveHandlers({
          POX5_LIVE_STAKE_SATS: '30000',
          POX5_LIVE_MAX_STAKE_SATS: '30000',
          POX5_LIVE_MAX_FEE_SATS: '5000',
          POX5_LIVE_TIMEOUT_MS: '600000',
        }),
        { environment: 'test', coin: 'tbtcstx', walletType: 'hot' }
      );
      assert.equal(report.rows.length, 6);
      assert.equal(report.rows[0].status, 'BLOCKED');
      assert.equal(report.rows[1].status, 'BLOCKED');
      assert.equal(report.rows[2].status, 'BLOCKED');
      assert.equal(isStrictFailure(report), true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('selects only the explicitly pinned confirmed outpoint on a reusable fixture', async function () {
    const other = 'a'.repeat(64) + ':0';
    const selected = 'b'.repeat(64) + ':1';
    const wallet = {
      unspents: async () => ({
        unspents: [
          { id: other, valueString: '1000000', confirmations: 5, address: 'other' },
          { id: selected, valueString: '40000', address: 'selected' },
        ],
      }),
    } as unknown as IWallet;
    assert.deepEqual(await confirmedInput(wallet, 35_000, selected), {
      outpoint: selected,
      amountSats: '40000',
      confirmations: 1,
    });
    assert.equal(await confirmedInput(wallet, 35_000, 'c'.repeat(64) + ':0'), undefined);
    await assert.rejects(confirmedInput(wallet, 35_000, 'not-an-outpoint'), /invalid/);
  });

  it('accepts BitGo confirmed-unspent results that omit their confirmation count', async function () {
    const txid = 'c'.repeat(64);
    const wallet = {
      unspents: async (query: { minConfirms?: number }) => {
        assert.equal(query.minConfirms, 1);
        return { unspents: [{ id: `${txid}:0`, valueString: '10000', address: 'bcrt1controlled' }] };
      },
    } as unknown as IWallet;
    assert.deepEqual(await indexedDeposit(wallet, txid, 'bcrt1controlled', 1000), {
      outpoint: `${txid}:0`,
      amountSats: 10_000,
      confirmations: 1,
    });
  });

  it('uses separate SDK-unlock and Wallet Platform approval OTP defaults', async function () {
    const unlocks: { otp: string; duration: number }[] = [];
    const bitgo = {
      get: () => ({ result: async () => ({ user: { id: 'actor' } }) }),
      url: (path: string) => path,
      unlock: async (options: { otp: string; duration: number }) => {
        unlocks.push(options);
      },
    } as unknown as Parameters<typeof authenticateLiveActor>[0];

    assert.equal(await authenticateLiveActor(bitgo, 'fake-unlock-otp'), 'actor');
    assert.deepEqual(unlocks, [{ otp: 'fake-unlock-otp', duration: 3600 }]);
    assert.throws(
      () => liveApproverOtp('test', {}),
      /Missing approval OTP; set POX5_LIVE_APPROVER_OTP_TEST or BITGO_TEST_OTP/
    );
    assert.equal(liveApproverOtp('staging', { BITGO_TEST_OTP: '111111' }), '111111');
    assert.equal(liveUnlockOtp('test', { BITGO_TEST_OTP: '222222' }), '222222');
    assert.equal(liveUnlockOtp('test', { BITGO_TEST_OTP: '222222', POX5_LIVE_UNLOCK_OTP_TEST: '333333' }), '333333');
    assert.throws(() => liveUnlockOtp('staging', {}), /Missing unlock OTP/);
    assert.equal(liveApproverOtp('test', { POX5_LIVE_APPROVER_OTP_TEST: '123456' }), '123456');
    assert.equal(liveApproverOtp('staging', { POX5_LIVE_APPROVER_OTP_STAGING: '654321' }), '654321');
  });

  it('reads the approver username without exposing it in matrix evidence', async function () {
    const unlocks: { otp: string; duration: number }[] = [];
    const bitgo = {
      get: () => ({ result: async () => ({ user: { id: 'actor', username: 'approver@example.test' } }) }),
      url: (path: string) => path,
      unlock: async (options: { otp: string; duration: number }) => {
        unlocks.push(options);
      },
    } as unknown as Parameters<typeof authenticateLiveActorIdentity>[0];

    assert.deepEqual(await authenticateLiveActorIdentity(bitgo, 'fake-unlock-otp'), {
      userId: 'actor',
      username: 'approver@example.test',
    });
    assert.deepEqual(unlocks, [{ otp: 'fake-unlock-otp', duration: 3600 }]);
  });

  it('blocks an inaccessible enterprise before any wallet provisioning write', function () {
    assert.doesNotThrow(() => requireAccessibleEnterprise('enterprise-a', ['enterprise-a', 'enterprise-b']));
    assert.throws(
      () => requireAccessibleEnterprise('invalid-enterprise', ['enterprise-a', 'enterprise-b']),
      (error: unknown) => error instanceof MatrixPrerequisite && error.status === 'BLOCKED'
    );
  });

  it('invites an enterprise approver with no permissions and accepts with the WP OTP', async function () {
    const enterpriseId = 'test-enterprise';
    const approverId = 'approver-user';
    const approverUsername = 'approver@example.test';
    const checkpoints: Evidence[] = [];
    let inviteBody: unknown;
    let approvalBody: unknown;
    let inviteCreated = false;
    let inviteAccepted = false;

    const actorBitgo = {
      url: (path: string, version?: number) => `/api/v${version ?? 1}${path}`,
      post: (path: string) => {
        assert.equal(path, `/api/v2/enterprise/${enterpriseId}/user`);
        return {
          send: (body: unknown) => {
            inviteBody = body;
            return {
              result: async () => {
                inviteCreated = true;
                return { id: 'invite-approval' };
              },
            };
          },
        };
      },
    } as unknown as BitGoAPI;
    const pendingInvite = {
      id: 'invite-approval',
      state: 'pending',
      enterprise: enterpriseId,
      info: {
        type: 'enterpriseInviteRequest',
        enterpriseInviteRequest: { action: 'add', userId: approverId, permissions: [] },
      },
    };
    const approverBitgo = {
      url: (path: string, version?: number) => `/api/v${version ?? 1}${path}`,
      get: (path: string) => {
        if (path === '/api/v2/pendingApprovals') {
          return {
            query: (params: unknown) => {
              assert.deepEqual(params, { requestType: 'enterpriseInviteRequest' });
              return { result: async () => ({ pendingApprovals: inviteCreated ? [pendingInvite] : [] }) };
            },
          };
        }
        if (path === '/api/v2/user/settings') {
          return {
            result: async () => ({
              settings: {
                enterprises: inviteAccepted
                  ? [{ id: enterpriseId, permissions: [], beneficialOwner: false, acceptedInvite: true }]
                  : [],
              },
            }),
          };
        }
        throw new Error('Unexpected approver GET route');
      },
      put: (path: string) => {
        assert.equal(path, '/api/v2/pendingapprovals/invite-approval');
        return {
          send: (body: unknown) => {
            assert.equal(
              checkpoints.some((evidence) => evidence.enterpriseInviteApprovalId === 'invite-approval'),
              true
            );
            approvalBody = body;
            return {
              result: async () => {
                inviteAccepted = true;
                return { state: 'approved' };
              },
            };
          },
        };
      },
      coin: () => ({ enterprises: () => ({ list: async () => (inviteAccepted ? [{ id: enterpriseId }] : []) }) }),
    } as unknown as BitGoAPI;
    const actor: LiveContext = {
      bitgo: actorBitgo,
      enterprise: enterpriseId,
      userId: 'initiator-user',
    };
    const approver: LiveApprover = {
      bitgo: approverBitgo,
      userId: approverId,
      username: approverUsername,
      otp: 'fake-approval-otp',
    };

    const result = await ensureEnterpriseApproverMembership(
      { environment: 'staging', coin: 'tbtcstxsignet', walletType: 'custodial' },
      actor,
      approver,
      async (evidence) => {
        checkpoints.push(evidence);
      }
    );

    assert.deepEqual(inviteBody, { username: approverUsername, invite: true });
    assert.deepEqual(approvalBody, { state: 'approved', otp: 'fake-approval-otp' });
    assert.deepEqual(result, { enterpriseInviteApprovalId: 'invite-approval', enterpriseAccess: 'PROVISIONED' });
    assert.equal(checkpoints[checkpoints.length - 1]?.enterpriseAccess, 'PROVISIONED');
    assert.deepEqual(
      checkedEvidence({ enterpriseInviteApprovalId: 'invite-approval', enterpriseAccess: 'PROVISIONED' }),
      { enterpriseInviteApprovalId: 'invite-approval', enterpriseAccess: 'PROVISIONED' }
    );
  });

  it('reuses existing enterprise membership without issuing another invite', async function () {
    const enterpriseId = 'test-enterprise';
    const actor: LiveContext = {
      bitgo: {} as BitGoAPI,
      enterprise: enterpriseId,
      userId: 'initiator-user',
    };
    const approver: LiveApprover = {
      bitgo: {
        coin: () => ({ enterprises: () => ({ list: async () => [{ id: enterpriseId }] }) }),
      } as unknown as BitGoAPI,
      userId: 'approver-user',
      username: 'approver@example.test',
      otp: 'fake-approval-otp',
    };
    const checkpoints: Evidence[] = [];

    const result = await ensureEnterpriseApproverMembership(
      { environment: 'test', coin: 'tbtcstxsignet', walletType: 'custodial' },
      actor,
      approver,
      async (evidence) => {
        checkpoints.push(evidence);
      }
    );

    assert.deepEqual(result, { enterpriseAccess: 'REUSED' });
    assert.deepEqual(checkpoints, [{ enterpriseAccess: 'REUSED' }]);
  });

  it('does not accept an enterprise invite that carries elevated permissions', async function () {
    const enterpriseId = 'test-enterprise';
    const approverId = 'approver-user';
    const approverBitgo = {
      url: (path: string, version?: number) => `/api/v${version ?? 1}${path}`,
      get: () => ({
        query: () => ({
          result: async () => ({
            pendingApprovals: [
              {
                id: 'privileged-invite',
                state: 'pending',
                enterprise: enterpriseId,
                info: {
                  type: 'enterpriseInviteRequest',
                  enterpriseInviteRequest: { action: 'add', userId: approverId, permissions: ['admin'] },
                },
              },
            ],
          }),
        }),
      }),
      put: () => {
        throw new Error('a privileged invite must not be accepted');
      },
      coin: () => ({ enterprises: () => ({ list: async () => [] }) }),
    } as unknown as BitGoAPI;
    const actor: LiveContext = { bitgo: {} as BitGoAPI, enterprise: enterpriseId, userId: 'initiator-user' };
    const approver: LiveApprover = {
      bitgo: approverBitgo,
      userId: approverId,
      username: 'approver@example.test',
      otp: 'fake-approval-otp',
    };

    await assert.rejects(
      ensureEnterpriseApproverMembership(
        { environment: 'staging', coin: 'tbtcstxsignet', walletType: 'custodial' },
        actor,
        approver,
        async () => undefined
      ),
      (error: unknown) => error instanceof MatrixPrerequisite && error.status === 'BLOCKED'
    );
  });

  it('accepts an approved but not yet accepted (active) custodial approver share', async function () {
    const walletId = 'custodial-wallet';
    const enterpriseId = 'test-enterprise';
    const approverId = 'approver-user';
    let acceptedShareId: string | undefined;

    const ownerWallet = {
      id: () => walletId,
      toJSON: () => ({ enterprise: enterpriseId, users: [] }),
      createShare: async () => {
        throw new Error('an existing share must be reused');
      },
    } as unknown as IWallet;
    const wallets = {
      listSharesV2: async () => ({
        incoming: [
          {
            id: 'share-id',
            wallet: walletId,
            toUser: approverId,
            fromUser: 'initiator-user',
            state: 'active',
            permissions: ['admin', 'view'],
          },
        ],
        outgoing: [],
      }),
      acceptShare: async ({ walletShareId }: { walletShareId: string }) => {
        acceptedShareId = walletShareId;
      },
      get: async () =>
        ({ toJSON: () => ({ users: [{ user: approverId, permissions: ['admin', 'view'] }] }) } as unknown as IWallet),
    };
    const bitgo = {
      coin: () => ({ wallets: () => wallets, enterprises: () => ({ list: async () => [{ id: enterpriseId }] }) }),
    } as unknown as BitGoAPI;

    const result = await ensureCustodialApproverWalletAccess(
      { environment: 'test', coin: 'tbtcstxsignet', walletType: 'custodial' },
      ownerWallet,
      'initiator-user',
      { bitgo, userId: approverId },
      async () => undefined
    );

    assert.equal(acceptedShareId, 'share-id');
    assert.deepEqual(result, { approverWalletShareId: 'share-id', approverAccess: 'PROVISIONED' });
  });

  it('creates and accepts a wallet-scoped custodial approver share without keychain or email', async function () {
    const walletId = 'custodial-wallet';
    const enterpriseId = 'test-enterprise';
    const approverId = 'approver-user';
    const checkpoints: Evidence[] = [];
    let shareOptions: unknown;
    let acceptedShareId: string | undefined;

    const ownerWallet = {
      id: () => walletId,
      toJSON: () => ({ enterprise: enterpriseId, users: [] }),
      createShare: async (options: unknown) => {
        shareOptions = options;
        return { id: 'share-id' };
      },
    } as unknown as IWallet;
    const approverWallet = {
      toJSON: () => ({ users: [{ user: approverId, permissions: ['admin', 'view'] }] }),
    } as unknown as IWallet;
    const wallets = {
      listSharesV2: async () => ({ incoming: [], outgoing: [] }),
      acceptShare: async ({ walletShareId }: { walletShareId: string }) => {
        assert.equal(
          checkpoints.some((evidence) => evidence.approverWalletShareId === walletShareId),
          true
        );
        acceptedShareId = walletShareId;
      },
      get: async ({ id }: { id: string }) => {
        assert.equal(id, walletId);
        return approverWallet;
      },
    };
    const bitgo = {
      coin: () => ({ wallets: () => wallets, enterprises: () => ({ list: async () => [{ id: enterpriseId }] }) }),
    } as unknown as BitGoAPI;

    const result = await ensureCustodialApproverWalletAccess(
      { environment: 'staging', coin: 'tbtcstxsignet', walletType: 'custodial' },
      ownerWallet,
      'initiator-user',
      { bitgo, userId: approverId },
      async (evidence) => {
        checkpoints.push(evidence);
      }
    );

    assert.deepEqual(shareOptions, {
      user: approverId,
      permissions: 'admin,view',
      skipKeychain: true,
      disableEmail: true,
    });
    assert.equal(acceptedShareId, 'share-id');
    assert.deepEqual(result, { approverWalletShareId: 'share-id', approverAccess: 'PROVISIONED' });
    assert.deepEqual(checkedEvidence({ approverWalletShareId: 'share-id', approverAccess: 'PROVISIONED' }), {
      approverWalletShareId: 'share-id',
      approverAccess: 'PROVISIONED',
    });
  });

  it('reuses existing custodial approver wallet access without creating another share', async function () {
    const walletId = 'custodial-wallet';
    const enterpriseId = 'test-enterprise';
    const approverId = 'approver-user';
    const checkpoints: Evidence[] = [];
    const existingWallet = {
      id: () => walletId,
      toJSON: () => ({ enterprise: enterpriseId, users: [{ user: approverId, permissions: ['admin', 'view'] }] }),
    } as unknown as IWallet;
    const wallets = {
      listSharesV2: async () => {
        throw new Error('existing access should not list shares');
      },
      get: async ({ id }: { id: string }) => {
        assert.equal(id, walletId);
        return existingWallet;
      },
    };
    const bitgo = {
      coin: () => ({ wallets: () => wallets, enterprises: () => ({ list: async () => [{ id: enterpriseId }] }) }),
    } as unknown as BitGoAPI;
    const createShare = async () => {
      throw new Error('existing access should not create another share');
    };
    const ownerWallet = {
      id: () => walletId,
      toJSON: () => ({ enterprise: enterpriseId, users: [{ user: approverId, permissions: ['admin', 'view'] }] }),
      createShare,
    } as unknown as IWallet;

    const result = await ensureCustodialApproverWalletAccess(
      { environment: 'test', coin: 'tbtcstxsignet', walletType: 'custodial' },
      ownerWallet,
      'initiator-user',
      { bitgo, userId: approverId },
      async (evidence) => {
        checkpoints.push(evidence);
      }
    );

    assert.deepEqual(result, { approverAccess: 'REUSED' });
    assert.deepEqual(checkpoints, [{ approverAccess: 'REUSED' }]);
  });

  it('refuses an existing approver wallet share with spend access or keychain material', async function () {
    const walletId = 'custodial-wallet';
    const enterpriseId = 'test-enterprise';
    const approverId = 'approver-user';
    const ownerWallet = {
      id: () => walletId,
      toJSON: () => ({ enterprise: enterpriseId, users: [] }),
      createShare: async () => {
        throw new Error('an unsafe existing share must not be replaced automatically');
      },
    } as unknown as IWallet;
    const wallets = {
      listSharesV2: async () => ({
        incoming: [
          {
            id: 'unsafe-share',
            wallet: walletId,
            fromUser: 'initiator-user',
            toUser: approverId,
            permissions: ['admin', 'view', 'spend'],
            keychain: { encryptedPrv: 'fixture-only' },
            state: 'pendingapproval',
          },
        ],
        outgoing: [],
      }),
      acceptShare: async () => {
        throw new Error('an unsafe existing share must not be accepted');
      },
    };
    const bitgo = { coin: () => ({ wallets: () => wallets }) } as unknown as BitGoAPI;

    await assert.rejects(
      ensureCustodialApproverWalletAccess(
        { environment: 'staging', coin: 'tbtcstxsignet', walletType: 'custodial' },
        ownerWallet,
        'initiator-user',
        { bitgo, userId: approverId },
        async () => undefined
      ),
      (error: unknown) => error instanceof MatrixPrerequisite && error.status === 'BLOCKED'
    );
  });

  it('defaults the live hot wallet passphrase independently in each environment', function () {
    assert.throws(
      () => liveWalletPassphrase('test', {}),
      /Missing wallet passphrase; set BITGO_WALLET_PASSPHRASE_TEST or BITGO_WALLET_PASSPHRASE/
    );
    assert.equal(
      liveWalletPassphrase('staging', { BITGO_WALLET_PASSPHRASE: 'shared-passphrase' }),
      'shared-passphrase'
    );
    assert.equal(liveWalletPassphrase('test', { BITGO_WALLET_PASSPHRASE_TEST: 'test-override' }), 'test-override');
    assert.equal(
      liveWalletPassphrase('staging', { BITGO_WALLET_PASSPHRASE_STAGING: 'staging-override' }),
      'staging-override'
    );
  });

  it('derives stable recovery material from the effective disposable wallet passphrase by default', function () {
    assert.equal(liveRecoverySeed('staging', 'fake-passphrase-for-tests', {}), 'fake-passphrase-for-tests');
    assert.equal(
      liveRecoverySeed('staging', 'fake-passphrase-for-tests', {
        POX5_LIVE_RECOVERY_SEED_STAGING: 'stable-recovery-seed',
      }),
      'stable-recovery-seed'
    );
    assert.throws(() => liveRecoverySeed('staging', undefined, {}), MatrixPrerequisite);
  });
});
