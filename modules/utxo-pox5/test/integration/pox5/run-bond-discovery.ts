import { openAllowlistedBonds, scanBondWindow } from './bond-discovery';
import { parseNonNegativeInteger, parsePositiveSats } from './bitgo-api';
import { coins, type Coin } from './live-matrix';
import { liveEndpoints, liveNetworks, liveStakingAdapter } from './live-matrix-network';
import { loadLocalPox5Environment } from './live-matrix-provision';
import { createStacksNetwork } from './stacks-js';

const USAGE =
  'Usage: bonds --coin <tbtcstx|tbtcstxprivate1|tbtcstxsignet> [--staker STX_ADDRESS] [--amount-sats N] [--radius N]';

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value. ${USAGE}`);
  return value;
}

function parseCoin(value: string | undefined): Coin {
  const coin = coins.find((candidate) => candidate === value);
  if (coin === undefined) throw new Error(`--coin is required and must be one of ${coins.join(', ')}. ${USAGE}`);
  return coin;
}

/**
 * Read-only: prints the PoX-5 bond window around the current reward cycle with each
 * bond's staker allowance and status. Makes no BitGo calls and no transactions.
 */
async function run(): Promise<void> {
  await loadLocalPox5Environment();
  const args = process.argv.slice(2);
  const env = process.env;
  const coin = parseCoin(argumentValue(args, '--coin'));
  const stakerAddress = argumentValue(args, '--staker') ?? env.POX5_STACKS_STAKER_ADDRESS;
  if (stakerAddress === undefined) throw new Error(`Set --staker or POX5_STACKS_STAKER_ADDRESS. ${USAGE}`);
  const amountSats = BigInt(
    parsePositiveSats(argumentValue(args, '--amount-sats') ?? env.POX5_LIVE_STAKE_SATS, 'Stake amount')
  );
  const radius = parseNonNegativeInteger(argumentValue(args, '--radius') ?? env.POX5_BOND_SCAN_RADIUS ?? '8', 'Radius');

  const { stacksUrl } = liveEndpoints(coin, env);
  const network = createStacksNetwork({ stacks: { chainId: liveNetworks[coin].chainId, nodeUrl: stacksUrl } });
  const window = await scanBondWindow(
    { staking: liveStakingAdapter(env), network, client: network.client },
    { stakerAddress, amountSats, radius }
  );
  const open = openAllowlistedBonds(window);
  const selection = open.length === 1 ? 'unique' : open.length === 0 ? 'none' : 'ambiguous';
  process.stdout.write(
    JSON.stringify(
      {
        coin,
        stakerAddress,
        amountSats: amountSats.toString(),
        radius,
        rewardCycleId: window.rewardCycleId,
        firstRewardCycle: window.firstRewardCycle,
        bondGapCycles: window.bondGapCycles,
        currentBondIndex: window.currentBondIndex,
        candidates: window.candidates.map((candidate) => ({
          bondIndex: candidate.bondIndex,
          allowlisted: candidate.allowlisted,
          allowanceSats: candidate.allowanceSats.toString(),
          ...(candidate.status === undefined ? {} : { status: candidate.status }),
        })),
        openAllowlistedBonds: open,
        selection,
      },
      null,
      2
    ) + '\n'
  );
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`Bond discovery failed: ${message}\n`);
  process.exitCode = 1;
});
