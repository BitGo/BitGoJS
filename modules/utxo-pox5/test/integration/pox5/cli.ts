import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { bootstrapPox5 } from './bootstrap';
import type { Pox5LocalConfig } from './config';
import { runCompose, startCompose, stopCompose } from './compose';
import { runL1FundingScenario, runL1RegisterScenario, runOfflinePox5Scenario } from './scenario';
import { prepareLiveConfig, printPublicStatus, runDefault, runMine, runTest } from './run';
import { runBitGoApiCommand } from './api-cli';

type CliArgs = {
  network?: Pox5LocalConfig['profile'];
  keep?: boolean;
  volumes?: boolean;
  count?: number;
  service?: string;
  tail?: number;
};

function applyNetwork(args: CliArgs): void {
  if (args.network !== undefined) process.env.POX5_NETWORK = args.network;
}

async function getConfig(args: CliArgs): Promise<Pox5LocalConfig> {
  applyNetwork(args);
  return await prepareLiveConfig();
}

async function runWithConfig(args: unknown, action: (config: Pox5LocalConfig) => Promise<void>): Promise<void> {
  await action(await getConfig(args as CliArgs));
}

const cli = yargs(hideBin(process.argv))
  .scriptName('pox5-debug')
  .strict()
  .recommendCommands()
  .option('network', {
    choices: ['local', 'tbtcstx', 'tbtcstxprivate1'] as const,
    describe: 'Network profile; overrides POX5_NETWORK',
  })
  .command(
    'api <area> [action]',
    'Build BTC-side PoX-5 transactions through BitGo API',
    (command) =>
      command
        .positional('area', { choices: ['auth', 'wallet', 'stake', 'exit'] as const })
        .positional('action', {
          type: 'string',
          describe: 'wallet list/create, stake build/status, or exit early/late',
        })
        .option('api-env', {
          choices: ['test', 'staging'] as const,
          default: 'staging',
          describe: 'BitGo API environment; production is intentionally not supported',
        })
        .option('coin', {
          choices: ['tbtcstx', 'tbtcstxprivate1'] as const,
          default: 'tbtcstxprivate1',
          describe: 'BitGo test coin',
        })
        .option('wallet-id', { type: 'string', describe: 'Fixed-script wallet ID' })
        .option('label', { type: 'string', describe: 'New fixed-script wallet label' })
        .option('enterprise', { type: 'string', describe: 'Enterprise ID for wallet creation' })
        .option('amount-sats', { type: 'string', describe: 'PoX-5 deposit amount in satoshis' })
        .option('unlock-height', { type: 'number', describe: 'Bitcoin block height for the lockup descriptor' })
        .option('principal-preimage-file', { type: 'string', describe: '0600 file containing 32-byte hex preimage' })
        .option('early-exit-key-file', { type: 'string', describe: '0600 file containing the disposable test WIF key' })
        .option('outpoint', { type: 'string', describe: 'Paired-wallet UTXO as <txid>:<vout>' })
        .option('psbt-out', { type: 'string', describe: 'Write unsigned/partially signed PSBT to this new file' })
        .option('build-only', {
          type: 'boolean',
          default: false,
          describe: 'Build and review without wallet signing or submission',
        })
        .option('yes', {
          type: 'boolean',
          default: false,
          describe: 'Confirm remote test/staging changes without prompts',
        })
        .option('json', { type: 'boolean', default: false, describe: 'Print safe summaries as JSON' }),
    async (args) => {
      if (args.network !== undefined) {
        throw new Error('--network selects the local harness; use --api-env and --coin for BitGo API commands');
      }
      await runBitGoApiCommand({
        area: args.area,
        action: args.action,
        apiEnv: args.apiEnv,
        coin: args.coin,
        walletId: args.walletId,
        label: args.label,
        enterprise: args.enterprise,
        amountSats: args.amountSats,
        unlockHeight: args.unlockHeight,
        principalPreimageFile: args.principalPreimageFile,
        earlyExitKeyFile: args.earlyExitKeyFile,
        outpoint: args.outpoint,
        psbtOut: args.psbtOut,
        buildOnly: args.buildOnly,
        yes: args.yes,
        json: args.json,
      });
    }
  )
  .command('up', 'Start the selected Bitcoin/Stacks services', {}, async (args) => {
    await runWithConfig(args, async (config) => {
      await startCompose(config);
      if (config.profile === 'local') await bootstrapPox5(config);
      printPublicStatus(config);
    });
  })
  .command(
    'down',
    'Stop services and optionally remove volumes',
    (command) => command.option('volumes', { type: 'boolean', default: false, describe: 'Remove disposable volumes' }),
    async (args) => {
      await runWithConfig(args, async (config) => stopCompose(config, args.volumes));
    }
  )
  .command('status', 'Print sanitized endpoints and Docker status', {}, async (args) => {
    await runWithConfig(args, async (config) => {
      printPublicStatus(config);
      await runCompose(config, ['ps']);
    });
  })
  .command(
    'logs',
    'Show Compose logs for debugging',
    (command) =>
      command
        .option('service', { type: 'string', describe: 'Service to inspect' })
        .option('tail', { type: 'number', default: 200, describe: 'Number of log lines' }),
    async (args) => {
      await runWithConfig(args, async (config) => {
        const commandArgs = ['logs', '--no-log-prefix', '--tail', String(args.tail)];
        if (args.service !== undefined) commandArgs.push(args.service);
        await runCompose(config, commandArgs);
      });
    }
  )
  .command('smoke', 'Run offline checks and live RPC/script smoke tests', {}, async (args) => {
    await runWithConfig(args, runTest);
  })
  .command('offline', 'Run deterministic BitGoJS-only PoX-5 checks', {}, async () => {
    runOfflinePox5Scenario();
    console.log('PoX-5 deterministic offline scenario passed');
  })
  .command(
    'mine',
    'Mine local-only regtest blocks',
    (command) => command.option('count', { type: 'number', default: 1, describe: 'Number of blocks' }),
    async (args) => {
      await runWithConfig(args, (config) => runMine(config, args.count));
    }
  )
  .command('fund', 'Faucet-fund and confirm one PoX-5 lock output', {}, async (args) => {
    await runWithConfig(args, runL1FundingScenario);
  })
  .command('register', 'Register one confirmed PoX-5 BTC lock on Stacks', {}, async (args) => {
    await runWithConfig(args, runL1RegisterScenario);
  })
  .command(
    'run',
    'Reset, start, test, and tear down the selected profile',
    (command) =>
      command.option('keep', { type: 'boolean', default: false, describe: 'Keep services running for diagnosis' }),
    async (args) => {
      await runWithConfig(args, (config) => runDefault(config, args.keep));
    }
  );

cli.parseAsync().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
