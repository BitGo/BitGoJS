process.env.DEBUG = 'RpcClient,SuiTransactionTypes';

import assert from 'assert';
import util from 'util';
import { Faucet } from './faucet';
import buildDebug from 'debug';

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
import { DUMMY_SUI_GAS_PRICE } from '../../src/lib/constants';

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

async function getAllActiveStakedSuis(conn: RpcClient, owner: string): Promise<SuiObjectRef[]> {
  const all = await conn.getStakes(owner);
  return Promise.all(
    all
      .flatMap((s) => s.stakes.flatMap((v) => (v.status === 'Active' ? [v.stakedSuiId] : [])))
      .map(async (id) => (await conn.getObject(id)).data)
  );
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

describe('Sui Transaction Types', function () {
  if (process.env.DRONE) {
    console.log('skipping local_fullnode/transactions.ts on drone');
    return;
  }

  const keyPair = new KeyPair({ seed: Buffer.alloc(32).fill(1) });
  const address = keyPair.getAddress();
  debug('address', address);

  const fullnodeUrl = process.env.SUI_FULLNODE_URL || 'http://127.0.0.1:9000';
  const faucetUrl = process.env.SUI_FAUCET_URL || 'http://127.0.0.1:9123';

  async function getDefaultGasData(): Promise<GasData> {
    return {
      owner: address,
      payment: await getAllCoins(conn, address),
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
      await new Faucet(faucetUrl).getCoins(address, 10e9);
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
      .gasData(await getDefaultGasData());

    await signAndSubmit(conn, keyPair, txb);
  });

  it('can stake coins', async function () {
    const builder = getBuilderFactory('tsui').getStakingBuilder();
    const txb = builder
      .type(SuiTransactionType.AddStake)
      .sender(address)
      .stake({ amount: 1e9, validatorAddress: validator })
      .gasData(await getDefaultGasData());

    await signAndSubmit(conn, keyPair, txb);
  });

  it('can unstake all coins', async function () {
    const activeStakedSui = await getAllActiveStakedSuis(conn, address);
    assert(activeStakedSui.length > 0, 'No staked coins found');

    for (const stakedSui of activeStakedSui) {
      const builder = getBuilderFactory('tsui').getUnstakingBuilder();
      const txb = builder
        .type(SuiTransactionType.WithdrawStake)
        .sender(address)
        .unstake({ stakedSui })
        .gasData(await getDefaultGasData());

      await signAndSubmit(conn, keyPair, txb);
    }
  });
});
