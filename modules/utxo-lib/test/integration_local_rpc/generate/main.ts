import * as assert from 'assert';

const utxolib = require('../../../src');

import { Network } from '../../../src/networkTypes';
import { getMainnet, getNetworkName, isBitcoin, isTestnet } from '../../../src/coins';

import { getRegtestNode, getRegtestNodeUrl, Node } from './regtestNode';
import {
  createScriptPubKey,
  createSpendTransaction,
  getKeyTriple,
  isSupportedDepositType,
  isSupportedSpendType,
  ScriptType,
} from './outputScripts.util';
import { Descriptor, RpcClient } from './RpcClient';
import { fixtureKeys, wipeFixtures, writeTransactionFixtureWithInputs } from './fixtures';
import { isScriptType2Of3 } from '../../../src/bitgo/outputScripts';
import { bip32 } from 'bitcoinjs-lib';

const nonce = new Date().getTime();

const faucetWallet = 'utxolibtest-' + nonce;

async function initBlockchain(rpc: RpcClient, network: Network): Promise<void> {
  let minBlocks = 300;
  switch (network) {
    case utxolib.networks.testnet:
      await rpc.createWallet(faucetWallet);
      break;
    case utxolib.networks.bitcoingoldTestnet:
      // The actual BTC/BTG fork flag only gets activated at this height.
      // On mainnet the height was at 491407 (Around 10/25/2017 12:00 UTC)
      // Prior to that, signatures that use the BIP143 sighash flag are invalid.
      // https://github.com/BTCGPU/BTCGPU/blob/71894be9/src/chainparams.cpp#L371
      minBlocks = 2001;
  }

  const diff = minBlocks - (await rpc.getBlockCount());

  if (diff > 0) {
    console.log(`mining ${diff} blocks to reach height ${minBlocks}`);
    const address = await rpc.getNewAddress();
    await rpc.generateToAddress(diff, address);
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
  network: Network
): Promise<void> {
  const logTag = `createTransaction ${scriptType} ${getNetworkName(network)}`;
  if (!isSupportedDepositType(network, scriptType)) {
    console.log(logTag + ': not supported, skipping');
    return;
  }
  console.log(logTag);

  const script = createScriptPubKey(fixtureKeys, scriptType, network);
  const address = toRegtestAddress(network, scriptType, script);
  const depositTxid = await rpc.sendToAddress(address, 1);
  const depositTx = await rpc.getRawTransaction(depositTxid);
  await writeTransactionFixtureWithInputs(rpc, network, `deposit_${scriptType}.json`, depositTxid);
  if (!isScriptType2Of3(scriptType) || !isSupportedSpendType(network, scriptType)) {
    console.log(logTag + ': spend not supported, skipping spend');
    return;
  }

  const spendTx = createSpendTransaction(fixtureKeys, scriptType, depositTxid, depositTx, script, network);
  const spendTxid = await rpc.sendRawTransaction(spendTx.toBuffer());
  assert.strictEqual(spendTxid, spendTx.getId());
  await writeTransactionFixtureWithInputs(rpc, network, `spend_${scriptType}.json`, spendTxid);
}

// https://gist.github.com/pinheadmz/cbf419396ac983ffead9670dde258a43
async function createWalletP2trSpend(faucetRpc: RpcClient, rpc: RpcClient, network: Network) {
  if (!isBitcoin(network)) {
    throw new Error(`invalid network`);
  }

  /*
  function pkToXOnlyHex(pk: bip32.BIP32Interface): string {
    return pk.publicKey.slice(1).toString('hex');
  }
  const [pk0, pk1, pk2] = getKeyTriple('taproot');
  function descMulti2of2(a: bip32.BIP32Interface, b: bip32.BIP32Interface) {
    return `multi(2,${pkToXOnlyHex(a)},${pkToXOnlyHex(b)})`;
  }
  const descMulti = `tr(${pkToXOnlyHex(pk0)},{${descMulti2of2(pk0, pk1)},${descMulti2of2(pk1, pk2)}})`;
  const { descriptor: descStr } = await rpc.getDescriptorInfo(descMulti);

   */

  const descTr =
    'tr(tprv8ZgxMBicQKsPdCttbKDzsuDzypKyWMDfGbzR5YsQe3dnPg6B69PPEaxawUuaanULMtgA8Etd9DaqDVSEBSbScA9xTsdR8PRfPsJZwKS3dJQ/*)#e05hhj4z';

  const descriptor: Descriptor = {
    desc: descTr as string,
    timestamp: 1633973910,
    active: true,
  };
  const walletName = 'p2tr-test-' + nonce;
  await rpc.createWalletWithDescriptor(walletName);
  const walletRpc = rpc.withWallet(walletName);
  const result = await walletRpc.importDescriptors([descriptor]);
  result.forEach((r) => {
    if (!r.success) {
      throw new Error(`error importing descriptor`);
    }
  });
  const address = await walletRpc.getNewAddress('p2tr-addr', 'bech32m');
  await walletRpc.exec('getaddressinfo', address);
  await faucetRpc.generateToAddress(200, await faucetRpc.getNewAddress());
  await faucetRpc.sendToAddress(address, 1);
  const txid = await walletRpc.sendToAddress(address, 0.5);
  await writeTransactionFixtureWithInputs(rpc, network, `spend_p2tr.json`, txid);
}

async function createTransactions(rpc: RpcClient, network: Network) {
  /*
  for (const scriptType of scriptTypes) {
    await createTransactionsForScriptType(rpc, scriptType, network);
  }
   */
  await createWalletP2trSpend(rpc.withWallet(faucetWallet), rpc, network);
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
