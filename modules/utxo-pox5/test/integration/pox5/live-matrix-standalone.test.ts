import { strict as assert } from 'node:assert';

import type { BitGoAPI } from '@bitgo/sdk-api';
import type { IWallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { MatrixPrerequisite } from './live-matrix';
import {
  resolveStandaloneDescriptorWallet,
  standaloneRecovery,
  standaloneStake,
  type StandaloneDescriptorWalletArgs,
  type StandaloneStakeArgs,
} from './live-matrix-standalone';

describe('standalone live matrix safety', function () {
  it('classifies unsupported custodial signing before any BitGo call', async function () {
    const unavailableClient = {
      coin() {
        throw new Error('unexpected BitGo call');
      },
    } as unknown as BitGoAPI;
    const args = {
      bitgo: unavailableClient,
      walletType: 'custodial',
    } as StandaloneStakeArgs;
    for (const run of [
      () => standaloneStake(args),
      () => standaloneRecovery({ ...args, outpoint: '01'.repeat(32) + ':0' }),
      () =>
        resolveStandaloneDescriptorWallet({
          ...args,
          protocolMinimumUnlockHeight: 900000,
          checkpointDescriptorIntent: async () => {
            throw new Error('unexpected descriptor creation');
          },
        } as StandaloneDescriptorWalletArgs),
    ]) {
      await assert.rejects(
        run,
        (error: unknown) => error instanceof MatrixPrerequisite && error.status === 'UNSUPPORTED'
      );
    }
  });

  it('fails closed on a coin/network mismatch without requesting a wallet or broadcasting', async function () {
    let checkpointCount = 0;
    const args: StandaloneStakeArgs = {
      bitgo: {
        coin() {
          throw new Error('unexpected BitGo call');
        },
      } as unknown as BitGoAPI,
      mainWallet: {} as IWallet,
      coinName: 'tbtcstx',
      network: utxolib.networks.bitcoin,
      walletType: 'hot',
      walletPassphrase: 'test passphrase',
      enterpriseId: 'dedicated-enterprise',
      mainWalletId: 'main',
      mainWalletLabel: 'main-test',
      descriptorWalletId: 'descriptor',
      descriptorWalletLabel: 'descriptor-test',
      stakerCommitment: Buffer.alloc(32),
      earlyExitKey: Buffer.alloc(33),
      maxAmountSats: '40000',
      maxFeeSats: '2000',
      feeRate: 1000,
      confirmTransaction: async () => {
        throw new Error('unexpected confirmation call');
      },
      checkpoint: async () => {
        checkpointCount++;
      },
      inputOutpoint: '01'.repeat(32) + ':0',
      amountSats: '30000',
      unlockHeight: 900000,
    };
    await assert.rejects(() => standaloneStake(args), /^Error: Standalone lock validation or submission failed$/);
    assert.equal(checkpointCount, 0);
  });
});
