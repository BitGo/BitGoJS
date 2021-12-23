import * as assert from 'assert';

const utxolib = require('../../../src');

import { Network, getMainnet, getNetworkName, isTestnet } from '../../../src';

import { getRegtestNode, getRegtestNodeUrl, Node, getRegtestNodeHelp } from './regtestNode';
import {
  createScriptPubKey,
  createSpendTransaction,
  isSupportedDepositType,
  ScriptType,
  scriptTypes,
} from './outputScripts.util';
import { RpcClient } from './RpcClient';
import {
  fixtureKeys,
  getProtocolVersions,
  Protocol,
  wipeFixtures,
  writeTransactionFixtureWithInputs,
} from './fixtures';
import { isScriptType2Of3, isSupportedScriptType } from '../../../src/bitgo/outputScripts';
import { sendFromFaucet, generateToFaucet } from './faucet';

async function printRpcHelp(rpc: RpcClient, network: Network): Promise<void> {
  console.log(await rpc.getHelp());
}

async function printNodeHelp(network: Network): Promise<void> {
  const { stdout, stderr } = await getRegtestNodeHelp(network);
  if (stderr) {
    console.error(stderr);
    throw new Error(`stderr`);
  }
  console.log(stdout);
}

async function initBlockchain(rpc: RpcClient, protocol: Protocol): Promise<void> {
  let minBlocks = 300;
  switch (protocol.network) {
    case utxolib.networks.bitcoingoldTestnet:
      // The actual BTC/BTG fork flag only gets activated at this height.
      // On mainnet the height was at 491407 (Around 10/25/2017 12:00 UTC)
      // Prior to that, signatures that use the BIP143 sighash flag are invalid.
      // https://github.com/BTCGPU/BTCGPU/blob/71894be9/src/chainparams.cpp#L371
      minBlocks = 2000;
      break;
    case utxolib.networks.zcashTest:
      switch (protocol.version) {
        case 4:
          minBlocks = 400;
          break;
        default:
          throw new Error(`unexpected protocol version ${protocol.version}`);
      }
      break;
  }

  const diff = minBlocks - (await rpc.getBlockCount());

  if (diff > 0) {
    console.log(`mining ${diff} blocks to reach height ${minBlocks}`);
    await generateToFaucet(rpc, diff);
  }
}

function toRegtestAddress(network: { bech32?: string }, scriptType: ScriptType, script: Buffer): string {
  if (scriptType === 'p2wsh' || scriptType === 'p2wkh' || scriptType === 'p2tr') {
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
  protocol: Protocol
): Promise<void> {
  const logTag = `createTransaction ${scriptType} ${getNetworkName(protocol.network)} v=${protocol.version}`;
  if (!isSupportedDepositType(protocol.network, scriptType)) {
    console.log(logTag + ': not supported, skipping');
    return;
  }
  console.log(logTag);

  const script = createScriptPubKey(fixtureKeys, scriptType, protocol.network);
  const address = toRegtestAddress(protocol.network as { bech32: string }, scriptType, script);
  const deposit1Txid = await sendFromFaucet(rpc, address, 1);
  const deposit1Tx = await rpc.getRawTransaction(deposit1Txid);
  await writeTransactionFixtureWithInputs(rpc, protocol, `deposit_${scriptType}.json`, deposit1Txid);
  if (!isScriptType2Of3(scriptType) || !isSupportedScriptType(protocol.network, scriptType)) {
    console.log(logTag + ': spend not supported, skipping spend');
    return;
  }

  const deposit2Txid = await sendFromFaucet(rpc, address, 1);
  const deposit2Tx = await rpc.getRawTransaction(deposit2Txid);
  const spendTx = createSpendTransaction(
    fixtureKeys,
    scriptType,
    [deposit1Tx, deposit2Tx],
    script,
    protocol.network,
    protocol.version
  );
  const spendTxid = await rpc.sendRawTransaction(spendTx.toBuffer());
  assert.strictEqual(spendTxid, spendTx.getId());
  await writeTransactionFixtureWithInputs(rpc, protocol, `spend_${scriptType}.json`, spendTxid);
}

async function createTransactions(rpc: RpcClient, protocol: Protocol) {
  for (const scriptType of scriptTypes) {
    await createTransactionsForScriptType(rpc, scriptType, protocol);
  }
}

async function withRpcClient(protocol: Protocol, f: (c: RpcClient) => Promise<void>): Promise<void> {
  await wipeFixtures(protocol);

  let rpc;
  let node: Node | undefined;
  if (process.env.UTXOLIB_TESTS_USE_DOCKER === '1') {
    node = await getRegtestNode(protocol.network);
    rpc = await RpcClient.forUrlWait(protocol.network, getRegtestNodeUrl(protocol.network));
  } else {
    rpc = await RpcClient.fromEnvvar(protocol.network);
  }

  try {
    await f(rpc);
  } catch (e) {
    console.error(`error for network ${getNetworkName(protocol.network)}`);
    throw e;
  } finally {
    if (node) {
      await node.stop();
    }
  }
}

async function run(protocol: Protocol) {
  await withRpcClient(protocol, async (rpc) => {
    if (process.env.UTXOLIB_TESTS_PRINT_RPC_HELP === '1') {
      await printRpcHelp(rpc, protocol.network);
    } else {
      await initBlockchain(rpc, protocol);
      await createTransactions(rpc, protocol);
    }
  });
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
    const network: Network = utxolib.networks[networkName];
    if (!isTestnet(network)) {
      continue;
    }

    if (allowedNetworks.length && !allowedNetworks.some((n) => n === getMainnet(network))) {
      console.log(`skipping ${networkName}`);
      continue;
    }

    if (process.env.UTXOLIB_TESTS_PRINT_NODE_HELP === '1') {
      await printNodeHelp(network);
      continue;
    }

    for (const version of getProtocolVersions(network)) {
      await run({ network, version });
    }
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
