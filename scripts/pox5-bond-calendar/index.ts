import * as fs from 'fs';
import * as path from 'path';
import { Anchor, AnchorProvider, getNetwork, NetworkConfig } from './networks';
import { BondInput, buildBondEvents, buildUpcomingCycleEvents, currentHeightAt, ResolvedNetwork } from './calendar';
import { parseBondsJson, validateSingleBond } from './bonds';
import { renderIcs, renderMarkdown, writePerNetworkOutputs } from './render';

const DEFAULT_SAFETY_MARGIN_BLOCKS = 6;
const DEFAULT_UPCOMING_CYCLES = 2;
const MAX_UNLOCK_HEIGHT = 500_000_000;

interface Args {
  help: boolean;
  network?: string;
  label?: string;
  amount?: string;
  unlockBurnHeight?: number;
  lockHeight?: number;
  startBurnHt?: number;
  numCycles?: number;
  bondsFile?: string;
  anchors: string[];
  activations: string[];
  live: string[];
  icsFile?: string;
  outDir?: string;
  json: boolean;
  upcomingCycles: number;
  safetyMargin: number;
}

const USAGE = `PoX-5 bond calendar

Usage:
  tsx scripts/pox5-bond-calendar/index.ts --network <coin> --unlock-burn-height <h> [bond flags]
  tsx scripts/pox5-bond-calendar/index.ts --bonds <bonds.json> [options]

Bond flags:
  --network <coin>              one of: btc, tbtcstx, tbtcstxsignet, tbtcbgsig, tstx, tstxsignet
  --label <text>                optional bond label used in event summaries and UIDs
  --amount <decimal>            optional amount (sats for BTC bonds, uSTX for STX-only)
  --unlock-burn-height <h>      BTC CLTV unlock height (required for BTC-backed networks)
  --lock-height <h>             optional burn height of the lockup funding tx
  --start-burn-ht <h>           optional stake start burn height
  --num-cycles <n>              optional number of reward cycles to schedule

Input file:
  --bonds <file.json>           JSON array of bond objects with the same fields as the CLI flags

Anchor options (height -> date estimates):
  --anchor <coin>=<height>@<ISO8601>      override the network anchor, repeatable
  --activation <coin>=<height>            override the pox-5 activation burn height, repeatable
  --live <coin>[=<provider>[:<baseUrl>]]  fetch the tip burn height and timestamp as anchor, repeatable
                                          providers: blockstream, hiro (default per network)

Output:
  --ics <file>                  write an iCalendar (.ics) file with all events
  --out-dir <dir>               write one <coin>.ics and <coin>.md per network into <dir>
  --json                        print events as JSON instead of the markdown report
  --upcoming-cycles <n>         upcoming reward-cycle boundaries per network (default 2, 0 disables)
  --safety-margin <blocks>      margin after CLTV unlock for the earliest recovery estimate (default 6)
`;

function parseArgs(argv: string[]): Args {
  const args: Args = {
    help: false,
    anchors: [],
    activations: [],
    live: [],
    json: false,
    upcomingCycles: DEFAULT_UPCOMING_CYCLES,
    safetyMargin: DEFAULT_SAFETY_MARGIN_BLOCKS,
  };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = (name: string): string => {
      if (arg !== name) {
        throw new Error(`${name} requires a value`);
      }
      i += 1;
      if (i >= argv.length) {
        throw new Error(`${name} requires a value`);
      }
      return argv[i];
    };
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--network') {
      args.network = value('--network');
    } else if (arg === '--label') {
      args.label = value('--label');
    } else if (arg === '--amount') {
      args.amount = value('--amount');
    } else if (arg === '--unlock-burn-height') {
      args.unlockBurnHeight = parseCount(value('--unlock-burn-height'), '--unlock-burn-height');
    } else if (arg === '--lock-height') {
      args.lockHeight = parseCount(value('--lock-height'), '--lock-height');
    } else if (arg === '--start-burn-ht') {
      args.startBurnHt = parseCount(value('--start-burn-ht'), '--start-burn-ht');
    } else if (arg === '--num-cycles') {
      args.numCycles = parseCount(value('--num-cycles'), '--num-cycles');
    } else if (arg === '--bonds') {
      args.bondsFile = value('--bonds');
    } else if (arg === '--anchor') {
      args.anchors.push(value('--anchor'));
    } else if (arg === '--activation') {
      args.activations.push(value('--activation'));
    } else if (arg === '--live') {
      args.live.push(value('--live'));
    } else if (arg === '--ics') {
      args.icsFile = value('--ics');
    } else if (arg === '--out-dir') {
      args.outDir = value('--out-dir');
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--upcoming-cycles') {
      args.upcomingCycles = parseCount(value('--upcoming-cycles'), '--upcoming-cycles');
    } else if (arg === '--safety-margin') {
      args.safetyMargin = parseCount(value('--safety-margin'), '--safety-margin');
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown option ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 0) {
    throw new Error(`unexpected positional arguments: ${positional.join(' ')}`);
  }
  return args;
}

function parseCount(text: string, flag: string): number {
  if (!/^\d+$/.test(text)) {
    throw new Error(`${flag} must be a non-negative integer, got ${text}`);
  }
  const count = Number(text);
  if (count >= MAX_UNLOCK_HEIGHT) {
    throw new Error(`${flag} must be below ${MAX_UNLOCK_HEIGHT}`);
  }
  return count;
}

function parseAmount(text: string, flag: string): bigint {
  if (!/^\d+$/.test(text)) {
    throw new Error(`${flag} must be a decimal string, got ${text}`);
  }
  return BigInt(text);
}

function parseActivationSpec(spec: string): { coin: string; height: number } {
  const match = /^(?<coin>[^=]+)=(?<height>\d+)$/.exec(spec);
  if (!match || !match.groups) {
    throw new Error(`--activation must be <coin>=<height>, got ${spec}`);
  }
  return { coin: match.groups.coin, height: Number(match.groups.height) };
}

function parseAnchorSpec(spec: string): { coin: string; anchor: Anchor } {
  const match = /^(?<coin>[^=]+)=(?<height>\d+)@(?<iso>.+)$/.exec(spec);
  if (!match || !match.groups) {
    throw new Error(`--anchor must be <coin>=<height>@<ISO8601>, got ${spec}`);
  }
  if (Number.isNaN(new Date(match.groups.iso).getTime())) {
    throw new Error(`--anchor date is not valid ISO 8601: ${match.groups.iso}`);
  }
  return { coin: match.groups.coin, anchor: { height: Number(match.groups.height), isoDate: match.groups.iso } };
}

function parseLiveSpec(spec: string): { coin: string; provider?: AnchorProvider; baseUrl?: string } {
  const match = /^(?<coin>[^=]+?)(?:=(?<provider>[a-z]+)(?::(?<baseUrl>.+))?)?$/.exec(spec);
  if (!match || !match.groups) {
    throw new Error(`--live must be <coin>[=<provider>[:<baseUrl>]], got ${spec}`);
  }
  const provider = match.groups.provider;
  if (provider !== undefined && provider !== 'blockstream' && provider !== 'hiro') {
    throw new Error(`--live provider must be blockstream or hiro, got ${provider}`);
  }
  return { coin: match.groups.coin, provider: provider as AnchorProvider | undefined, baseUrl: match.groups.baseUrl };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} failed: HTTP ${response.status}`);
  }
  return response.text();
}

export async function fetchLiveAnchor(provider: AnchorProvider, baseUrl: string): Promise<Anchor> {
  if (provider === 'blockstream') {
    const heightText = (await fetchText(`${baseUrl}/api/blocks/tip/height`)).trim();
    const height = Number(heightText);
    if (!Number.isInteger(height)) {
      throw new Error(`blockstream tip height is not an integer: ${heightText}`);
    }
    const hash = (await fetchText(`${baseUrl}/api/block-height/${height}`)).trim();
    const block = (await fetchJson(`${baseUrl}/api/block/${hash}`)) as { timestamp?: number };
    if (typeof block.timestamp !== 'number') {
      throw new Error(`blockstream block ${hash} has no timestamp`);
    }
    return { height, isoDate: new Date(block.timestamp * 1000).toISOString() };
  }
  const info = (await fetchJson(`${baseUrl}/v2/info`)) as { burn_block_height?: number };
  if (typeof info.burn_block_height !== 'number') {
    throw new Error('hiro /v2/info response has no burn_block_height');
  }
  const block = (await fetchJson(`${baseUrl}/extended/v1/block/by_burn_block_height/${info.burn_block_height}`)) as {
    burn_block_time?: number;
  };
  if (typeof block.burn_block_time !== 'number') {
    throw new Error(`hiro block at burn height ${info.burn_block_height} has no burn_block_time`);
  }
  return { height: info.burn_block_height, isoDate: new Date(block.burn_block_time * 1000).toISOString() };
}

function requireActivation(net: NetworkConfig): number {
  if (net.activationBurnHeight === null) {
    throw new Error(
      `network ${net.coin} has no recorded pox-5 activation height; pass --activation ${net.coin}=<height>`
    );
  }
  return net.activationBurnHeight;
}

function requireRewardCycle(net: NetworkConfig): number {
  if (net.rewardCycleBlocks === null) {
    throw new Error(`network ${net.coin} has no reward-cycle length`);
  }
  return net.rewardCycleBlocks;
}

function toResolvedNetwork(
  net: NetworkConfig,
  anchor: Anchor,
  anchorSource: ResolvedNetwork['anchorSource'],
  activationOverride?: number
): ResolvedNetwork {
  const activation = activationOverride ?? requireActivation(net);
  if (anchor.height < activation) {
    throw new Error(
      `network ${net.coin}: anchor height ${anchor.height} precedes pox-5 activation height ${activation}`
    );
  }
  return {
    coin: net.coin,
    burnChain: net.burnChain,
    stacksOnly: net.stacksOnly,
    activationBurnHeight: activation,
    rewardCycleBlocks: requireRewardCycle(net),
    preparePhaseBlocks: net.preparePhaseBlocks ?? 0,
    avgBlockSeconds: net.avgBlockSeconds ?? 600,
    anchor,
    anchorSource,
    sources: net.sources,
  };
}

async function resolveNetworks(
  coins: string[],
  anchorOverrides: Map<string, Anchor>,
  activationOverrides: Map<string, number>,
  liveSpecs: Map<string, { provider?: AnchorProvider; baseUrl?: string }>
): Promise<ResolvedNetwork[]> {
  const networks: ResolvedNetwork[] = [];
  for (const coin of coins) {
    const net = getNetwork(coin);
    let anchor: Anchor | undefined = anchorOverrides.get(coin);
    let anchorSource: ResolvedNetwork['anchorSource'] = 'override';
    if (!anchor && liveSpecs.has(coin)) {
      const spec = liveSpecs.get(coin);
      if (!spec) {
        throw new Error(`internal error: live spec for ${coin} disappeared`);
      }
      const provider = spec.provider ?? net.liveProvider;
      const baseUrl = spec.baseUrl ?? net.liveBaseUrl;
      if (!provider || !baseUrl) {
        throw new Error(
          `network ${coin} has no built-in live anchor provider; pass --live ${coin}=<provider>:<baseUrl> with provider blockstream or hiro`
        );
      }
      anchor = await fetchLiveAnchor(provider, baseUrl);
      anchorSource = 'live';
    }
    if (!anchor) {
      const fallback = net.anchor;
      if (!fallback) {
        throw new Error(
          `network ${coin} has no default anchor (private networks publish none); pass --anchor ${coin}=<height>@<ISO8601> or --live ${coin}`
        );
      }
      anchor = fallback;
      anchorSource = 'default';
    }
    networks.push(toResolvedNetwork(net, anchor, anchorSource, activationOverrides.get(coin)));
  }
  return networks;
}

async function main(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(USAGE);
    return;
  }
  if (args.network === undefined && args.bondsFile === undefined) {
    throw new Error('either --network (single bond) or --bonds (JSON file) is required; see --help');
  }

  const bonds: BondInput[] = [];
  if (args.network !== undefined) {
    bonds.push(
      validateSingleBond(args.network, {
        label: args.label,
        amount: args.amount === undefined ? undefined : parseAmount(args.amount, '--amount'),
        unlockBurnHeight: args.unlockBurnHeight,
        lockHeight: args.lockHeight,
        startBurnHt: args.startBurnHt,
        numCycles: args.numCycles,
      })
    );
  }
  if (args.bondsFile !== undefined) {
    bonds.push(...parseBondsJson(fs.readFileSync(args.bondsFile, 'utf8')));
  }

  const anchorOverrides = new Map<string, Anchor>();
  for (const spec of args.anchors) {
    const { coin, anchor } = parseAnchorSpec(spec);
    getNetwork(coin);
    anchorOverrides.set(coin, anchor);
  }
  const activationOverrides = new Map<string, number>();
  for (const spec of args.activations) {
    const { coin, height } = parseActivationSpec(spec);
    getNetwork(coin);
    activationOverrides.set(coin, height);
  }
  const liveSpecs = new Map<string, { provider?: AnchorProvider; baseUrl?: string }>();
  for (const spec of args.live) {
    const parsed = parseLiveSpec(spec);
    getNetwork(parsed.coin);
    liveSpecs.set(parsed.coin, parsed);
  }

  const networks = await resolveNetworks(
    [...new Set(bonds.map((bond) => bond.network))],
    anchorOverrides,
    activationOverrides,
    liveSpecs
  );
  const resolved = new Map(networks.map((net) => [net.coin, net] as const));

  const now = new Date();
  const cycleEvents: Record<string, ReturnType<typeof buildUpcomingCycleEvents>> = {};
  if (args.upcomingCycles > 0) {
    for (const net of networks) {
      cycleEvents[net.coin] = buildUpcomingCycleEvents(net, args.upcomingCycles, currentHeightAt(net, now));
    }
  }

  const bondEvents: Record<string, Record<string, ReturnType<typeof buildBondEvents>>> = {};
  for (const bond of bonds) {
    const net = resolved.get(bond.network);
    if (!net) {
      throw new Error(`internal error: no resolved network for bond on ${bond.network}`);
    }
    const existing = Object.keys(bondEvents[net.coin] ?? {}).length;
    const key = bond.label ?? `bond-${existing + 1}`;
    (bondEvents[net.coin] ??= {})[key] = buildBondEvents(net, bond, args.safetyMargin);
  }

  const allEvents = networks.flatMap((net) => [
    ...(cycleEvents[net.coin] ?? []),
    ...Object.values(bondEvents[net.coin] ?? {}).flat(),
  ]);

  if (args.outDir !== undefined) {
    const written = writePerNetworkOutputs(args.outDir, networks, cycleEvents, bondEvents, args.safetyMargin, now);
    process.stderr.write(`wrote ${written.length} files to ${args.outDir}\n`);
  }

  if (args.icsFile !== undefined) {
    const dir = path.dirname(args.icsFile);
    if (dir !== '.' && dir !== '') {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(args.icsFile, renderIcs(allEvents, 'PoX-5 Bond Calendar', now));
    process.stderr.write(`wrote ${allEvents.length} events to ${args.icsFile}\n`);
  }

  if (args.json) {
    process.stdout.write(
      JSON.stringify(
        {
          generatedAt: now.toISOString(),
          networks,
          events: allEvents.map((event) => ({ ...event, date: event.date.toISOString() })),
        },
        null,
        2
      ) + '\n'
    );
    return;
  }
  process.stdout.write(renderMarkdown(networks, cycleEvents, bondEvents, args.safetyMargin, now));
}

main(process.argv.slice(2)).catch((error: Error) => {
  process.stderr.write(`error: ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
