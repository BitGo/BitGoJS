import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import type { IWallet } from '@bitgo/sdk-core';
import { pox5 } from '@bitgo/utxo-descriptors';
import { getKey, getKeyTriple } from '@bitgo/wasm-utxo/testutils';

import {
  assertEarlyExitMaterials,
  confirmAndSubmit,
  descriptorDetails,
  makePox5ExitBuildParams,
  makePox5StakingBuildParams,
  parseOutpoint,
} from './api-cli';

describe('BitGo BTC-only PoX-5 CLI helpers', function () {
  it('builds wallet-platform staking params from BTC-only inputs', function () {
    const principalPreimage = Buffer.alloc(32, 0x42);
    const earlyExitKey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
    const params = makePox5StakingBuildParams({
      amountSats: '30000',
      unlockHeight: 300_100,
      principalPreimage,
      earlyExitKey,
      requestId: 'test-request',
      unspents: [`${'ab'.repeat(32)}:0`],
    });

    assert.equal(params.type, 'staking');
    assert.deepEqual(params.recipients, []);
    assert.equal(params.stakingParams.requestId, 'test-request');
    assert.equal(params.stakingParams.pox5.amount, '30000');
    assert.equal(params.stakingParams.pox5.unlockHeight, 300_100);
    assert.equal(
      params.stakingParams.pox5.stakerCommitment,
      createHash('sha256').update(principalPreimage).digest('hex')
    );
    assert.equal(params.stakingParams.pox5.earlyExitKey, earlyExitKey.toString('hex'));
    assert.equal('signerManager' in params.stakingParams.pox5, false);
    assert.deepEqual(params.unspents, [`${'ab'.repeat(32)}:0`]);
  });

  it('builds the API request shape for both PoX-5 recovery branches', function () {
    const preimage = Buffer.alloc(32, 0x42);
    const sharedParams = { address: 'tb1qtest', outpoint: `${'ab'.repeat(32)}:1` };
    const early = makePox5ExitBuildParams({ ...sharedParams, branch: 'early', principalPreimage: preimage });
    const late = makePox5ExitBuildParams({ ...sharedParams, branch: 'late' });

    assert.deepEqual(early.recipients, [{ address: 'tb1qtest', amount: 'max' }]);
    assert.deepEqual(early.unspents, [`${'ab'.repeat(32)}:1`]);
    assert.deepEqual(early.unstakingParams, {
      pox5: { branch: 'early-exit', principalPreimage: preimage.toString('hex') },
    });
    assert.equal(late.unstakingParams, undefined);
    assert.throws(() => makePox5ExitBuildParams({ ...sharedParams, branch: 'early' }), /32-byte principal preimage/);
  });

  it('parses only explicit Bitcoin outpoints', function () {
    const parsed = parseOutpoint(`${'AB'.repeat(32)}:3`);
    assert.equal(parsed.txid, 'ab'.repeat(32));
    assert.equal(parsed.vout, 3);
    assert.equal(parsed.id, `${'ab'.repeat(32)}:3`);
    assert.throws(() => parseOutpoint('not-an-outpoint'), /64-character txid/);
  });

  it('requires the early-exit preimage and test key to match the descriptor', function () {
    const principalPreimage = Buffer.alloc(32, 0x42);
    const earlyExitKey = Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex');
    const descriptor = {
      unlockHeight: 300_000,
      stakerCommitment: createHash('sha256').update(principalPreimage).digest(),
      earlyExitKey,
    };

    assert.doesNotThrow(() => assertEarlyExitMaterials(principalPreimage, earlyExitKey, descriptor));
    assert.throws(() => assertEarlyExitMaterials(Buffer.alloc(32), earlyExitKey, descriptor), /does not match/);
    assert.throws(
      () => assertEarlyExitMaterials(principalPreimage, Buffer.alloc(33, 0x03), descriptor),
      /does not match/
    );
  });

  it('reads PoX-5 descriptors from the wallet coin-specific descriptor list', function () {
    const principalPreimage = Buffer.alloc(32, 0x42);
    const [user, backup, bitgo] = getKeyTriple('utxo-pox5-descriptor-details');
    const earlyExitKey = getKey('utxo-pox5-descriptor-details-early-exit');
    const descriptor = pox5.createPox5LockupDescriptor({
      unlockHeight: 840_000,
      stakerCommitment: createHash('sha256').update(principalPreimage).digest(),
      earlyExitKey: Buffer.from(earlyExitKey.publicKey),
      stakerKeys: [Buffer.from(user.publicKey), Buffer.from(backup.publicKey), Buffer.from(bitgo.publicKey)],
    });
    const wallet = {
      coinSpecific: () => ({
        descriptors: [{ name: 'pox5', value: descriptor.toString() }],
        staking: { pox5: { descriptors: [] } },
      }),
      toJSON: () => ({}),
    } as unknown as IWallet;

    const descriptors = descriptorDetails(wallet);
    assert.equal(descriptors.length, 1);
    assert.equal(descriptors[0].unlockHeight, 840_000);
  });

  it('does not submit when build-only or when confirmation is declined', async function () {
    let confirmationCount = 0;
    let submissionCount = 0;
    const confirm = async (): Promise<boolean> => {
      confirmationCount += 1;
      return false;
    };
    const submit = async (): Promise<string> => {
      submissionCount += 1;
      return 'submitted';
    };

    assert.deepEqual(await confirmAndSubmit(true, confirm, submit), { status: 'build-only' });
    assert.deepEqual(await confirmAndSubmit(false, confirm, submit), { status: 'cancelled' });
    assert.equal(confirmationCount, 1);
    assert.equal(submissionCount, 0);
  });
});
