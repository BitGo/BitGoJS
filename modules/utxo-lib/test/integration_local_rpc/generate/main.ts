/**
 * @prettier
 */
import * as assert from 'assert';

import { Network } from '../../../src/networkTypes';
import { getMainnet, getNetworkName, isTestnet } from '../../../src/coins';

const utxolib = require('../../../src');
import { getRegtestNode, getRegtestNodeUrl, Node } from './regtestNode';
import {
  createScriptPubKey,
  createSpendTransaction,
  getKeyTriple,
  isSupportedDepositType,
  isSupportedSpendType,
  ScriptType,
  scriptTypes,
} from './outputScripts.util';
import { RpcClient } from './RpcClient';
import { wipeFixtures, writeTransactionFixtureWithInputs } from './fixtures';

async function initBlockchain(rpc: RpcClient, network: Network): Promise<void> {
  switch (network) {
    case utxolib.networks.testnet:
      await rpc.createWallet('utxolibtest');
  }

  const minBlocks = 300;
  const diff = minBlocks - (await rpc.getBlockCount());

  if (diff > 0) {
    console.log(`mining ${diff} blocks to reach height ${minBlocks}`);
    const address = await rpc.getNewAddress();
    await rpc.generateToAddress(diff, address);
  }
}

function toRegtestAddress(network: { bech32?: string }, scriptType: ScriptType, script: Buffer): string {
  if (scriptType === 'p2wsh' || scriptType === 'p2wkh') {
    switch (network) {
      case utxolib.networks.testnet:
        network = { bech32: 'bcrt' };
        break;
      case utxolib.networks.litecoinTest:
        network = { bech32: 'rltc' };
        break;
      case utxolib.networks.bitcoingoldTestnet:
        network = { bech32: 'btgrt' };
        break;
    }
  }
  return utxolib.address.fromOutputScript(script, network);
}

async function createTransactionsForScriptType(
  rpc: RpcClient,
  scriptType: ScriptType,
  network: Network
): Promise<void> {
  const logTag = `createTransaction ${scriptType} ${getNetworkName(network)}`;
  if (!isSupportedDepositType(network, scriptType)) {
    console.log(logTag + ': not supported, skipping');
    return;
  }
  console.log(logTag);

  const keys = getKeyTriple('rpctest');
  const script = createScriptPubKey(keys, scriptType, network);
  const address = toRegtestAddress(network, scriptType, script);
  const depositTxid = await rpc.sendToAddress(address, 1);
  const depositTx = await rpc.getRawTransaction(depositTxid);
  await writeTransactionFixtureWithInputs(rpc, network, `deposit_${scriptType}.json`, depositTxid);
  if (!isSupportedSpendType(network, scriptType)) {
    console.log(logTag + ': spend not supported, skipping spend');
    return;
  }

  const spendTx = createSpendTransaction(keys, scriptType, depositTxid, depositTx, script, network);
  const spendTxid = await rpc.sendRawTransaction(spendTx.toBuffer());
  assert.strictEqual(spendTxid, spendTx.getId());
  await writeTransactionFixtureWithInputs(rpc, network, `spend_${scriptType}.json`, spendTxid);
}

async function createTransactions(rpc: RpcClient, network: Network) {
  for (const scriptType of scriptTypes) {
    await createTransactionsForScriptType(rpc, scriptType, network);
  }
}

async function run(network: Network) {
  await wipeFixtures(network);

  let rpc;
  let node: Node | undefined;
  if (process.env.UTXOLIB_TESTS_USE_DOCKER === '1') {
    node = await getRegtestNode(network);
    rpc = await RpcClient.forUrlWait(network, getRegtestNodeUrl(network));
  } else {
    rpc = await RpcClient.fromEnvvar(network);
  }

  try {
    await initBlockchain(rpc, network);
    await createTransactions(rpc, network);
  } catch (e) {
    console.error(`error for network ${getNetworkName(network)}`);
    throw e;
  } finally {
    if (node) {
      await node.stop();
    }
  }
}

async function main(args: string[]) {
  const allowedNetworks = args.map((name) => {
    const network = utxolib.networks[name];
    if (!network) {
      throw new Error(`invalid network ${name}`);
    }
    return getMainnet(network);
  });

  for (const networkName of Object.keys(utxolib.networks)) {
    const network = utxolib.networks[networkName];
    if (!isTestnet(network)) {
      continue;
    }

    if (allowedNetworks.length && !allowedNetworks.some((n) => n === getMainnet(network))) {
      console.log(`skipping ${networkName}`);
      continue;
    }

    await run(utxolib.networks[networkName]);
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
