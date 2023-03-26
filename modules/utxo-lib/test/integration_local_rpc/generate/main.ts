import * as assert from 'assert';

const utxolib = require('../../../src');

import { Network, getMainnet, getNetworkName, isTestnet } from '../../../src';

import { getRegtestNode, getRegtestNodeUrl, Node, getRegtestNodeHelp } from './regtestNode';
import {
  createScriptPubKey,
  createSpendTransaction,
  createPsbtSpendTransaction,
  isSupportedDepositType,
  ScriptType,
  scriptTypes,
  getP2trMusig2Index,
} from './outputScripts.util';
import { RpcClient } from './RpcClient';
import {
  fixtureKeys,
  getProtocolVersions,
  Protocol,
  wipeFixtures,
  writeTransactionFixtureWithInputs,
} from './fixtures';
import { isScriptType2Of3, isSupportedScriptType, ScriptType2Of3 } from '../../../src/bitgo/outputScripts';
import { sendFromFaucet, generateToFaucet } from './faucet';
import { getInternalChainCode, KeyName, RootWalletKeys, Tuple, ZcashTransaction } from '../../../src/bitgo';

function getScriptTypes() {
  // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
  //  because the test suite is written with TransactionBuilder
  return scriptTypes.filter((scriptType) => scriptType);
}

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
    case utxolib.networks.dogecoinTest:
      // Mine 1000 blocks to get at least 100 M doge to send
      minBlocks = 1000;
      break;
    case utxolib.networks.zcashTest:
      switch (protocol.version) {
        case ZcashTransaction.VERSION4_BRANCH_CANOPY:
          minBlocks = 400;
          break;
        case ZcashTransaction.VERSION4_BRANCH_NU5:
        case ZcashTransaction.VERSION5_BRANCH_NU5:
          minBlocks = 500;
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
  if (scriptType === 'p2wsh' || scriptType === 'p2wkh' || scriptType === 'p2tr' || scriptType === 'p2trMusig2') {
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

function getSpendTx(
  scriptType: ScriptType2Of3,
  inputTxs: Buffer[],
  script,
  protocol: Protocol,
  amountType: 'number' | 'bigint',
  p2trMusig2SpendType?: 'keyPath' | 'scriptPath'
) {
  if (scriptType === 'p2trMusig2') {
    if (!p2trMusig2SpendType) {
      throw new Error('Invalid p2tr spend type');
    }
    const index = getP2trMusig2Index(p2trMusig2SpendType);
    const signers: Tuple<KeyName> = p2trMusig2SpendType === 'keyPath' ? ['user', 'bitgo'] : ['user', 'backup'];
    const rootWalletKeys = new RootWalletKeys(fixtureKeys);
    return createPsbtSpendTransaction({
      rootWalletKeys,
      chain: getInternalChainCode(scriptType),
      index,
      signers,
      inputTxs,
      network: protocol.network,
      version: protocol.version,
      amountType,
    });
  } else {
    return createSpendTransaction(
      fixtureKeys,
      scriptType,
      inputTxs,
      script,
      protocol.network,
      protocol.version,
      amountType
    );
  }
}

async function createTransactionsForScriptType(
  rpc: RpcClient,
  scriptType: ScriptType,
  protocol: Protocol,
  p2trMusig2SpendType?: 'keyPath' | 'scriptPath'
): Promise<void> {
  const fullScriptType = `${scriptType}${p2trMusig2SpendType ? p2trMusig2SpendType : ''}`;
  const logTag = `createTransaction ${fullScriptType} ${getNetworkName(protocol.network)} v=${protocol.version}`;
  if (!isSupportedDepositType(protocol.network, scriptType)) {
    console.log(logTag + ': not supported, skipping');
    return;
  }
  console.log(logTag);

  let keys = fixtureKeys;
  if (scriptType === 'p2trMusig2') {
    if (!p2trMusig2SpendType) {
      throw new Error('Invalid p2tr spend type');
    }
    const index = getP2trMusig2Index(p2trMusig2SpendType);
    const rootWalletKeys = new RootWalletKeys(fixtureKeys);
    keys = rootWalletKeys.deriveForChainAndIndex(getInternalChainCode(scriptType), index).triple;
  }

  const script = createScriptPubKey(keys, scriptType, protocol.network);
  const address = toRegtestAddress(protocol.network as { bech32: string }, scriptType, script);
  const deposit1Txid = await sendFromFaucet(rpc, address, 1);
  const deposit1Tx = await rpc.getRawTransaction(deposit1Txid);
  await writeTransactionFixtureWithInputs(rpc, protocol, `deposit_${fullScriptType}.json`, deposit1Txid);
  if (!isScriptType2Of3(scriptType) || !isSupportedScriptType(protocol.network, scriptType)) {
    console.log(logTag + ': spend not supported, skipping spend');
    return;
  }

  let amount: number | string = 1;
  switch (protocol.network) {
    case utxolib.networks.dogecoinTest:
      // Exercise bigint precision with an amount > 100M and also where number would lose precision
      amount = 109999998.00000001;
      break;
  }
  const deposit2Txid = await sendFromFaucet(rpc, address, amount);
  const deposit2Tx = await rpc.getRawTransaction(deposit2Txid);
  let spendTx;
  switch (protocol.network) {
    case utxolib.networks.dogecoinTest:
      spendTx = getSpendTx(scriptType, [deposit1Tx, deposit2Tx], script, protocol, 'bigint');
      break;
    default:
      spendTx = getSpendTx(scriptType, [deposit1Tx, deposit2Tx], script, protocol, 'number', p2trMusig2SpendType);
      break;
  }
  const spendTxid = await rpc.sendRawTransaction(spendTx.toBuffer());
  assert.strictEqual(spendTxid, spendTx.getId());
  await writeTransactionFixtureWithInputs(rpc, protocol, `spend_${fullScriptType}.json`, spendTxid);
}

async function createTransactions(rpc: RpcClient, protocol: Protocol) {
  for (const scriptType of getScriptTypes()) {
    if (scriptType === 'p2trMusig2') {
      await createTransactionsForScriptType(rpc, scriptType, protocol, 'keyPath');
      await createTransactionsForScriptType(rpc, scriptType, protocol, 'scriptPath');
    } else {
      await createTransactionsForScriptType(rpc, scriptType, protocol);
    }
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
