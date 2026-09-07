import assert from 'node:assert/strict';

import type { BitGoAPI } from '@bitgo/sdk-api';
import type { IWallet } from '@bitgo/sdk-core';

import { type PairedStakeArgs, pairedRecovery, pairedStake } from './live-matrix-paired';
import { MatrixPrerequisite } from './live-matrix';

describe('paired live-matrix safety gates', function () {
  const wallet = {
    id: () => 'main-wallet',
    coin: () => 'tbtcstx',
    type: () => 'hot',
    multisigType: () => 'onchain',
    coinSpecific: () => undefined,
    toJSON: () => ({ enterprise: 'enterprise-one' }),
  } as unknown as IWallet;
  const bitgo = {
    getEnv: () => 'test',
    url: (path: string) => path,
    get: () => ({ result: async () => ({ user: { id: 'initiator' } }) }),
  } as unknown as BitGoAPI;

  function stakeArgs(): PairedStakeArgs {
    return {
      cell: { environment: 'test', coin: 'tbtcstx', walletType: 'hot' },
      env: {},
      bitgo,
      mainWallet: wallet,
      mainWalletId: 'main-wallet',
      enterpriseId: 'enterprise-one',
      actorId: 'initiator',
      requestId: 'request-one',
      maxFeeSats: '1000',
      readiness: async () => true,
      getTip: async () => 100,
      confirm: async () => {
        throw new Error('No transaction may be broadcast');
      },
      indexed: async () => {
        throw new Error('No transaction may be indexed');
      },
      checkpoint: async () => {
        throw new Error('No checkpoint should be written');
      },
      input: { outpoint: `${'11'.repeat(32)}:0`, amountSats: '40000', confirmations: 1 },
      amountSats: '30000',
      maxStakeSats: '30000',
      protocolMinimumUnlockHeight: 120,
      unlockHeight: 120,
      descriptorIndex: 0,
      principalPreimage: Buffer.alloc(32, 1),
      earlyExitKey: Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex'),
      walletPassphrase: 'not-a-real-secret',
    };
  }

  it('rejects a height other than the caller-supplied protocol minimum before building', async function () {
    await assert.rejects(pairedStake({ ...stakeArgs(), unlockHeight: 121 }), /differs from the protocol minimum/);
  });

  it('rejects tip plus one without requesting a PSBT', async function () {
    await assert.rejects(
      pairedStake({ ...stakeArgs(), unlockHeight: 101, protocolMinimumUnlockHeight: 101 }),
      /implausibly close/
    );
  });

  it('reports a missing dedicated confirmed input as NOT_READY without building', async function () {
    const mainWallet = Object.assign({}, wallet, { unspents: async () => ({ unspents: [] }) });
    await assert.rejects(
      pairedStake({ ...stakeArgs(), mainWallet }),
      (error: unknown) => error instanceof MatrixPrerequisite && error.status === 'NOT_READY'
    );
  });

  describe('custodial post-CLTV recovery', function () {
    function custodialRecoveryArgs() {
      const common = stakeArgs();
      return {
        ...common,
        cell: { ...common.cell, walletType: 'custodial' as const },
        pairedWalletId: 'paired-wallet',
        fixture: { ...common.input, descriptorIndex: 0, unlockHeight: 100 },
        recoveryAddress: 'unreachable',
        maxRecoverySats: '40000',
      };
    }

    it('is blocked without a separate approver and approval checkpoint, before any network call', async function () {
      await assert.rejects(
        pairedRecovery(custodialRecoveryArgs()),
        (error: unknown) => error instanceof MatrixPrerequisite && error.status === 'BLOCKED'
      );
    });

    it('refuses to approve with the initiating client', async function () {
      await assert.rejects(
        pairedRecovery({
          ...custodialRecoveryArgs(),
          approver: { bitgo, actorId: 'approver' },
          checkpointApproval: async () => undefined,
        }),
        /separate client in the same environment/
      );
    });

    it('refuses an approver that is the initiating actor', async function () {
      const approverClient = { ...bitgo, getEnv: () => 'test' } as unknown as BitGoAPI;
      await assert.rejects(
        pairedRecovery({
          ...custodialRecoveryArgs(),
          approver: { bitgo: approverClient, actorId: 'initiator' },
          checkpointApproval: async () => undefined,
        }),
        /cannot approve its own request/
      );
    });
  });
});
