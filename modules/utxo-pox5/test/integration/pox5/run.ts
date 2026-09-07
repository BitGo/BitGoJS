import { dirname, resolve } from 'node:path';

import { BitcoinCoreAdapter } from './bitcoin';
import { loadPox5LocalConfig, type Pox5LocalConfig } from './config';
import { startCompose, stopCompose, runCompose, validateDockerTooling } from './compose';
import { bootstrapPox5 } from './bootstrap';
import { JsonRpcClient } from './rpc';
import { runL1FundingScenario, runL1RegisterScenario, runLocalRpcSmoke, runOfflinePox5Scenario } from './scenario';
import { validatePox5SourceRoots } from './sources';

export function printPublicStatus(config: Pox5LocalConfig): void {
  console.log(
    JSON.stringify(
      {
        fullnodeMode: config.fullnodeMode,
        endpoints: {
          bitcoinRpc: config.bitcoin.rpcUrl,
          stacksNode: config.stacks.nodeUrl,
          stacksApi: config.stacks.apiUrl,
        },
        containers: ['bitcoind', 'bitcoind-miner', 'stacks-node', 'stacks-api', 'stacks-signer-1/2/3'],
      },
      null,
      2
    )
  );
}

export async function prepareLiveConfig(): Promise<Pox5LocalConfig> {
  const config = loadPox5LocalConfig();
  await validatePox5SourceRoots(config);
  if (config.profile !== 'local') {
    await validateDockerTooling(config);
    return config;
  }
  const harnessRoot = dirname(config.composeFiles[1]);
  process.env.POX5_STACKS_CORE_COMMIT = config.stacksCore.commit;
  process.env.POX5_STACKS_CORE_PATCH_SHA256 = config.stacksCore.patchSha256;
  process.env.POX5_STACKS_NODE_CONFIG = resolve(harnessRoot, 'stacks-node.toml');
  process.env.POX5_STACKS_NODE_DOCKERFILE = resolve(harnessRoot, 'Dockerfile.stacks-node');
  process.env.POX5_SNAPSHOT_CONFIG = resolve(harnessRoot, 'stacks-snapshot.toml');
  process.env.POX5_INIT_DATA_ROOT = resolve(harnessRoot, 'init-data');
  const stacksRegtestEnvRoot = config.sources.stacksRegtestEnvRoot;
  if (stacksRegtestEnvRoot === undefined) throw new Error('STACKS_REGTEST_ENV_ROOT is required');
  process.env.POX5_BITCOIN_CONF = resolve(stacksRegtestEnvRoot, 'bitcoin.conf');
  await validateDockerTooling(config);
  return config;
}

export async function runTest(config: Pox5LocalConfig): Promise<void> {
  if (config.profile === 'local') await bootstrapPox5(config);
  runOfflinePox5Scenario();
  await runLocalRpcSmoke(config);
  console.log('PoX-5 live RPC smoke scenario passed');
}

export async function runMine(config: Pox5LocalConfig, count: number): Promise<void> {
  if (!config.bitcoin.canMine) {
    throw new Error(
      `${config.coinName} is connected to a shared Hiro regtest burnchain; do not mine locally. ` +
        'Wait for the corresponding network or use POX5_NETWORK=local for a disposable miner.'
    );
  }
  if (!Number.isSafeInteger(count) || count <= 0) throw new Error('mine count must be a positive integer');
  const rpc = new JsonRpcClient(
    config.bitcoin.rpcUrl,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs
  );
  const walletRpc = new JsonRpcClient(
    `${config.bitcoin.rpcUrl}/wallet/main`,
    config.bitcoin.rpcUser,
    config.bitcoin.rpcPassword,
    config.bitcoin.timeoutMs
  );
  const bitcoin = new BitcoinCoreAdapter(rpc, walletRpc);
  const address = await bitcoin.getNewAddress('pox5-local-mine');
  const blocks = await bitcoin.mine(count, address);
  console.log(`Bitcoin regtest mined ${blocks.length} block(s), latest=${blocks[blocks.length - 1]}`);
}

export async function runDefault(config: Pox5LocalConfig, keep: boolean): Promise<void> {
  let started = false;
  try {
    await stopCompose(config, true);
    started = true;
    await startCompose(config);
    await runTest(config);
  } finally {
    if (keep) printPublicStatus(config);
    else if (started) await stopCompose(config, false);
  }
}

async function main(args: readonly string[]): Promise<void> {
  const command = args[0] ?? 'run';
  if (command === 'status') {
    const config = await prepareLiveConfig();
    printPublicStatus(config);
    await runCompose(config, ['ps']);
    return;
  }
  if (command === 'down') {
    const config = await prepareLiveConfig();
    await stopCompose(config, args.includes('--volumes'));
    return;
  }
  if (command === 'offline') {
    runOfflinePox5Scenario();
    console.log('PoX-5 deterministic offline scenario passed');
    return;
  }

  const config = await prepareLiveConfig();
  if (command === 'up') {
    await startCompose(config);
    if (config.profile === 'local') await bootstrapPox5(config);
    printPublicStatus(config);
    return;
  }
  if (command === 'test') {
    await runTest(config);
    return;
  }
  if (command === 'fund') {
    await runL1FundingScenario(config);
    return;
  }
  if (command === 'register') {
    await runL1RegisterScenario(config);
    return;
  }
  if (command === 'mine') {
    await runMine(config, Number(args[1] ?? '1'));
    return;
  }
  if (command === 'run') {
    await runDefault(config, args.includes('--keep'));
    return;
  }
  throw new Error(`Unknown PoX-5 integration command: ${command}`);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
