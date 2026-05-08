import { StakeObject } from '../../src/lib/mystenlab/types/validator';

process.env.DEBUG = 'RpcClient,SuiTransactionTypes';

import assert from 'assert';
import util from 'util';
import { Faucet } from './faucet';
import buildDebug from 'debug';
import { createHash } from 'crypto';

import {
  KeyPair,
  StakingBuilder,
  StakingTransaction,
  TransferBuilder,
  TransferTransaction,
  UnstakingBuilder,
  UnstakingTransaction,
} from '../../src';
import { RpcClient } from './RpcClient';
import { getBuilderFactory } from '../unit/getBuilderFactory';
import { SuiTransactionType } from '../../src/lib/iface';
import { GasData, SuiObjectRef } from '../../src/lib/mystenlab/types';
import { DUMMY_SUI_GAS_PRICE, MIN_STAKING_THRESHOLD } from '../../src/lib/constants';

const debug = buildDebug('SuiTransactionTypes');

async function getAllCoins(conn: RpcClient, address: string): Promise<SuiObjectRef[]> {
  return (await conn.getCoins(address)).data.map((v) => {
    return {
      digest: v.digest,
      objectId: v.coinObjectId,
      version: v.version,
    };
  });
}

/**
 * @returns The stakes array with the stakedSui amount reduced by amount. If amount is undefined, the stakedSui is removed.
 */
function subtractStake(stakes: StakeObject[], stakedSui: StakeObject, amount: number | undefined): StakeObject[] {
  return stakes.flatMap((s): StakeObject[] => {
    if (s.stakedSuiId === stakedSui.stakedSuiId) {
      if (amount === undefined) {
        // remove the stake
        return [];
      } else {
        // reduce the stake by amount
        return [{ ...s, principal: Number(s.principal) - amount }];
      }
    } else {
      // keep the stake unchanged
      return [s];
    }
  });
}

/**
 * Asserts that the stakesAfter array is the same as the stakesBefore array with the stakedSui amount reduced by amount.
 */
function assertReducedStake(
  stakesBefore: StakeObject[],
  stakesAfter: StakeObject[],
  stakedSui: StakeObject,
  amount: number | undefined
) {
  /*
   * Normalize the stake objects by converting the principal to a number and removing the estimatedReward.
   */
  function normStake(s: StakeObject): StakeObject {
    return { ...s, principal: Number(s.principal), estimatedReward: undefined };
  }
  stakesBefore = stakesBefore.map(normStake);
  stakesAfter = stakesAfter.map(normStake);
  assert.deepStrictEqual(stakesAfter, subtractStake(stakesBefore, stakedSui, amount));
}

async function getStakes(
  conn: RpcClient,
  owner: string,
  params: {
    filterStatus?: StakeObject['status'];
    filterMinValue?: number;
    attempts?: number;
    sleepMs?: number;
  } = {}
): Promise<StakeObject[]> {
  const all = await conn.getStakes(owner);
  const result = await Promise.all(
    all.flatMap((s) =>
      s.stakes
        .filter((v) => params.filterStatus === undefined || v.status === params.filterStatus)
        .filter((v) => params.filterMinValue === undefined || params.filterMinValue <= Number(v.principal))
    )
  );
  if (result.length) {
    return result;
  }
  const { attempts = 60, sleepMs = 1000 } = params;
  if (0 < attempts) {
    await new Promise((resolve) => setTimeout(resolve, sleepMs));
    return await getStakes(conn, owner, { ...params, attempts: attempts - 1, sleepMs });
  } else {
    throw new Error('getAllActiveStakedSuis: no active staked suis found');
  }
}

async function resolveStakedSui(conn: RpcClient, stake: StakeObject): Promise<SuiObjectRef> {
  return (await conn.getObject(stake.stakedSuiId)).data;
}

function getKeyPair(seed: string): KeyPair {
  const seedBuf = createHash('sha256').update(seed).digest();
  return new KeyPair({ seed: seedBuf });
}

async function signAndSubmit(
  conn: RpcClient,
  keyPair: KeyPair,
  txb: TransferBuilder | StakingBuilder | UnstakingBuilder
): Promise<void> {
  txb.sign({ key: keyPair.getKeys().prv });
  const tx = (await txb.build()) as TransferTransaction | StakingTransaction | UnstakingTransaction;
  debug('tx', util.inspect(tx.suiTransaction.tx, { depth: 10 }));
  const result = await conn.executeTransactionBlock(tx.toBroadcastFormat(), [
    Buffer.from(tx.serializedSig).toString('base64'),
  ]);
  if (result.effects?.status.status !== 'success') {
    throw new Error(`Transaction failed: ${JSON.stringify(result.effects?.status)}`);
  }
}

async function fundFromFaucet(url: string, v: KeyPair | string, amount = 100e9): Promise<void> {
  if (typeof v !== 'string') {
    v = v.getAddress();
  }
  await new Faucet(url).getCoins(v, 10e9);
}

describe('Sui Transaction Types', function () {
  if (process.env.DRONE) {
    console.log('skipping local_fullnode/transactions.ts on drone');
    return;
  }

  const keyPair = getKeyPair('test');
  const address = keyPair.getAddress();
  debug('address', address);

  const fullnodeUrl = process.env.SUI_FULLNODE_URL || 'http://127.0.0.1:9000';
  const faucetUrl = process.env.SUI_FAUCET_URL || 'http://127.0.0.1:9123';

  async function getDefaultGasData(keyPair: KeyPair): Promise<GasData> {
    return {
      owner: keyPair.getAddress(),
      payment: await getAllCoins(conn, keyPair.getAddress()),
      budget: 100_000_000,
      price: DUMMY_SUI_GAS_PRICE,
    };
  }

  let conn: RpcClient;
  let validator: string;
  before('establish connection', async function () {
    conn = await RpcClient.createCheckedConnection(fullnodeUrl);
    const { apys } = await conn.getValidatorsApy();
    validator = apys[0].address;
  });

  before('fund via faucet', async function () {
    if (faucetUrl) {
      await fundFromFaucet(faucetUrl, address);
    }
  });

  it('has coins', async function () {
    const { data } = await conn.getCoins(address);
    assert.notStrictEqual(data.length, 0);
  });

  it('can transfer coins', async function () {
    const builder = getBuilderFactory('tsui').getTransferBuilder();
    const txb = builder
      .type(SuiTransactionType.Transfer)
      .sender(address)
      .send([{ address, amount: (111_111).toString() }])
      .gasData(await getDefaultGasData(keyPair));

    await signAndSubmit(conn, keyPair, txb);
  });

  async function stakeAmount(keyPair: KeyPair, amount: number): Promise<void> {
    const builder = getBuilderFactory('tsui').getStakingBuilder();
    const txb = builder
      .type(SuiTransactionType.AddStake)
      .sender(keyPair.getAddress())
      .stake([{ amount, validatorAddress: validator }])
      .gasData(await getDefaultGasData(keyPair));

    await signAndSubmit(conn, keyPair, txb);
  }

  it('can stake coins', async function () {
    await stakeAmount(keyPair, 1e9);
  });

  function testUnstake(amount: number | undefined) {
    describe(`unstake (amount=${amount})`, function () {
      const keyPairStakeTest = getKeyPair(`stake-test-amount-${amount !== undefined}`);
      const address = keyPairStakeTest.getAddress();

      before('stake coins', async function () {
        await fundFromFaucet(faucetUrl, address);
        await stakeAmount(keyPairStakeTest, 10e9);
      });

      it(`can unstake`, async function () {
        const activeStakedSui = await getStakes(conn, address, {
          filterStatus: 'Active',
          filterMinValue: MIN_STAKING_THRESHOLD + (amount || 0),
        });
        assert(activeStakedSui.length > 0, 'No staked coins found');

        for (const stakedSui of activeStakedSui.slice(0, 3)) {
          debug('unstaking', stakedSui);
          const builder = getBuilderFactory('tsui').getUnstakingBuilder();
          const stakedBefore = await getStakes(conn, address);
          const txb = builder
            .type(SuiTransactionType.WithdrawStake)
            .sender(address)
            .unstake({ stakedSui: await resolveStakedSui(conn, stakedSui), amount })
            .gasData(await getDefaultGasData(keyPairStakeTest));
          await signAndSubmit(conn, keyPairStakeTest, txb);

          assertReducedStake(stakedBefore, await getStakes(conn, address), stakedSui, amount);
        }
      });
    });
  }

  testUnstake(undefined);
  testUnstake(1e9);
});
