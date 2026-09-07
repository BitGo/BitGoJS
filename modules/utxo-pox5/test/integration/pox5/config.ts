import { resolve } from 'node:path';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export type Pox5LocalConfig = {
  profile: 'local' | 'tbtcstx' | 'tbtcstxprivate1';
  fullnodeMode: 'indexer' | 'direct';
  coinName: 'tbtcstx' | 'tbtcstxprivate1';
  composeFiles: string[];
  composeProject: string;
  bitcoin: {
    network: 'regtest';
    composeService: string;
    canMine: boolean;
    rpcUrl: string;
    rpcUser: string;
    rpcPassword: string;
    mempoolApi: string;
    faucetUrl: string;
    timeoutMs: number;
    startupTimeoutMs: number;
  };
  stacks: {
    network: 'devnet' | 'testnet';
    addressNetwork: 'devnet' | 'testnet';
    chainId: number;
    nodeUrl: string;
    apiUrl: string;
    timeoutMs: number;
    pox5ActivationHeight: number;
    unlockHeight: number;
    pox5ContractId: string;
    bondIndex: number | undefined;
    signerManager: string | undefined;
  };
  stacksJs: {
    module: string;
    root: string | undefined;
    commit: string;
  };
  stacksCore: {
    root: string | undefined;
    commit: string;
    patchSha256: string;
  };
  sources: {
    stacksJsRoot: string | undefined;
    stacksCoreRoot: string | undefined;
    stacksRegtestEnvRoot: string | undefined;
  };
  accounts: {
    stakerAddress: string | undefined;
    stakerPrivateKey: string | undefined;
  };
};

type Pox5NetworkProfile = {
  profile: Pox5LocalConfig['profile'];
  coinName: Pox5LocalConfig['coinName'];
  composeService: string;
  bitcoinRpcUrl: string;
  bitcoinRpcUser: string;
  bitcoinRpcPassword: string;
  mempoolApi: string;
  faucetUrl: string;
  stacksUrl: string;
  chainId: number;
  activationHeight: number;
  composeProject: string;
};

const NETWORK_PROFILES: Record<Exclude<Pox5LocalConfig['profile'], 'local'>, Pox5NetworkProfile> = {
  tbtcstx: {
    profile: 'tbtcstx',
    coinName: 'tbtcstx',
    composeService: 'tbtcstx-bitcoin',
    bitcoinRpcUrl: 'http://127.0.0.1:18443',
    bitcoinRpcUser: 'btcuser',
    bitcoinRpcPassword: 'btcpass',
    mempoolApi: 'https://mempool.bitcoin.regtest.hiro.so/api',
    faucetUrl: 'https://api.testnet.hiro.so/extended/v1/faucets/btc',
    stacksUrl: 'https://api.testnet.hiro.so',
    chainId: 0x80000000,
    activationHeight: 2702,
    composeProject: 'bitgo-pox5-tbtcstx',
  },
  tbtcstxprivate1: {
    profile: 'tbtcstxprivate1',
    coinName: 'tbtcstxprivate1',
    composeService: 'tbtcstxprivate1-bitcoin',
    bitcoinRpcUrl: 'http://127.0.0.1:40443',
    bitcoinRpcUser: 'btcuser',
    bitcoinRpcPassword: 'btcpass',
    mempoolApi: 'https://mempool.bitcoin.private-1.hiro.so/api',
    faucetUrl: 'https://api.private-1.hiro.so/extended/v1/faucets/btc',
    stacksUrl: 'https://api.private-1.hiro.so',
    chainId: 0x100,
    activationHeight: 202,
    composeProject: 'bitgo-pox5-tbtcstxprivate1',
  },
};

const DEFAULT_SIGNER_MANAGERS: Partial<Record<Pox5LocalConfig['profile'], string>> = {
  // Deployed by the shared private-1 staking daemon. A redeployed network must
  // override POX5_SIGNER_MANAGER with its own contract principal.
  tbtcstxprivate1: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP.signer-manager',
};

function envValue(env: NodeJS.ProcessEnv, name: string, fallback?: string): string | undefined {
  const value = env[name];
  return value === undefined || value.length === 0 ? fallback : value;
}

function envNumber(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const value = envValue(env, name);
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function envNonNegativeNumber(env: NodeJS.ProcessEnv, name: string): number | undefined {
  const value = envValue(env, name);
  if (value === undefined) return undefined;

  if (!/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${name} must be a non-negative integer`);
  return parsed;
}

function assertHttpUrl(name: string, value: string, allowedHosts: ReadonlySet<string>): string {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http or https`);
  }
  if (!allowedHosts.has(url.hostname)) {
    throw new Error(`${name} must point to localhost or an approved Hiro endpoint; refusing ${url.hostname}`);
  }
  return url.toString().replace(/\/$/, '');
}

export function loadPox5LocalConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): Pox5LocalConfig {
  const profile = envValue(env, 'POX5_NETWORK', 'local') as Pox5LocalConfig['profile'];
  if (profile !== 'local' && profile !== 'tbtcstx' && profile !== 'tbtcstxprivate1') {
    throw new Error(`POX5_NETWORK must be local, tbtcstx, or tbtcstxprivate1; received ${profile}`);
  }
  const networkProfile = profile === 'local' ? undefined : NETWORK_PROFILES[profile];
  const fullnodeMode = envValue(env, 'POX5_FULLNODE_MODE', 'indexer') as Pox5LocalConfig['fullnodeMode'];
  if (fullnodeMode !== 'indexer' && fullnodeMode !== 'direct') {
    throw new Error(`POX5_FULLNODE_MODE must be indexer or direct; received ${fullnodeMode}`);
  }
  if (profile === 'local' && fullnodeMode === 'direct') {
    throw new Error('POX5_FULLNODE_MODE=direct is only supported for the shared Hiro profiles');
  }
  const indexerRoot = envValue(env, 'POX5_INDEXER_UTXO_ROOT');
  const externalComposeFile =
    indexerRoot === undefined ? undefined : resolve(indexerRoot, 'containers/docker-compose.develop-tbtcstx.yml');
  const bitcoinRpcUrl = assertHttpUrl(
    'POX5_BITCOIN_RPC_URL',
    envValue(env, 'POX5_BITCOIN_RPC_URL', networkProfile?.bitcoinRpcUrl ?? 'http://127.0.0.1:18443') as string,
    LOOPBACK_HOSTS
  );
  const stacksHosts = new Set([...LOOPBACK_HOSTS, 'api.testnet.hiro.so', 'api.private-1.hiro.so']);
  const stacksNodeUrl = assertHttpUrl(
    'POX5_STACKS_NODE_URL',
    envValue(env, 'POX5_STACKS_NODE_URL', networkProfile?.stacksUrl ?? 'http://127.0.0.1:20443') as string,
    stacksHosts
  );
  const stacksApiUrl = assertHttpUrl(
    'POX5_STACKS_API_URL',
    envValue(env, 'POX5_STACKS_API_URL', networkProfile?.stacksUrl ?? 'http://127.0.0.1:3999') as string,
    stacksHosts
  );

  const stacksJsRoot = envValue(env, 'STACKS_JS_ROOT');
  const stacksCoreRoot = envValue(env, 'STACKS_CORE_ROOT');
  const stacksRegtestEnvRoot = envValue(env, 'STACKS_REGTEST_ENV_ROOT');
  const composeOverrideFile = resolve(
    cwd,
    envValue(env, 'POX5_COMPOSE_FILE', 'test/integration/pox5/compose.yaml') as string
  );
  const directComposeFile = resolve(__dirname, 'direct-fullnode.compose.yaml');
  const composeBaseFile = envValue(
    env,
    'POX5_COMPOSE_BASE_FILE',
    stacksRegtestEnvRoot === undefined ? undefined : resolve(stacksRegtestEnvRoot, 'docker-compose.yml')
  );
  if (profile === 'local' && composeBaseFile === undefined) {
    throw new Error('Set STACKS_REGTEST_ENV_ROOT to the cloned stacks-regtest-env checkout');
  }
  if (profile !== 'local' && fullnodeMode === 'indexer' && externalComposeFile === undefined) {
    throw new Error('Set POX5_INDEXER_UTXO_ROOT to the indexer-utxo checkout for an external network profile');
  }
  const stacksJsModule = envValue(
    env,
    'POX5_STACKS_BITCOIN_STAKING_MODULE',
    stacksJsRoot === undefined
      ? '@stacks/bitcoin-staking'
      : resolve(stacksJsRoot, 'packages/bitcoin-staking/dist/index.js')
  ) as string;

  return {
    profile,
    fullnodeMode,
    coinName: networkProfile?.coinName ?? 'tbtcstxprivate1',
    composeFiles:
      profile === 'local'
        ? [resolve(cwd, composeBaseFile as string), composeOverrideFile]
        : [fullnodeMode === 'direct' ? directComposeFile : (externalComposeFile as string)],
    composeProject: envValue(
      env,
      'POX5_COMPOSE_PROJECT',
      networkProfile?.composeProject ?? 'bitgo-pox5-local'
    ) as string,
    bitcoin: {
      network: 'regtest',
      composeService: networkProfile?.composeService ?? 'bitcoind',
      canMine: profile === 'local',
      rpcUrl: bitcoinRpcUrl,
      rpcUser: envValue(env, 'POX5_BITCOIN_RPC_USER', networkProfile?.bitcoinRpcUser ?? 'btc') as string,
      rpcPassword: envValue(env, 'POX5_BITCOIN_RPC_PASSWORD', networkProfile?.bitcoinRpcPassword ?? 'btc') as string,
      mempoolApi: envValue(env, 'POX5_MEMPOOL_API', networkProfile?.mempoolApi ?? '') as string,
      faucetUrl: envValue(env, 'POX5_BTC_FAUCET_URL', networkProfile?.faucetUrl ?? '') as string,
      timeoutMs: envNumber(env, 'POX5_RPC_TIMEOUT_MS', 10_000),
      startupTimeoutMs: envNumber(env, 'POX5_STARTUP_TIMEOUT_MS', 600_000),
    },
    stacks: {
      network: profile === 'local' ? 'devnet' : 'testnet',
      // Shared Hiro Bitcoin services run regtest locally, so PoX lock addresses
      // must use the bcrt1 regtest encoding even though Stacks uses testnet IDs.
      addressNetwork: 'devnet',
      chainId: networkProfile?.chainId ?? 0x80000000,
      nodeUrl: stacksNodeUrl,
      apiUrl: stacksApiUrl,
      timeoutMs: envNumber(env, 'POX5_STACKS_TIMEOUT_MS', 15_000),
      pox5ActivationHeight: networkProfile?.activationHeight ?? 223,
      unlockHeight: envNumber(env, 'POX5_UNLOCK_HEIGHT', networkProfile?.activationHeight ?? 840_000),
      pox5ContractId: 'ST000000000000000000002AMW42H.pox-5',
      bondIndex: envNonNegativeNumber(env, 'POX5_BOND_INDEX'),
      signerManager: envValue(env, 'POX5_SIGNER_MANAGER', DEFAULT_SIGNER_MANAGERS[profile]),
    },
    stacksJs: {
      module: stacksJsModule,
      root: stacksJsRoot,
      commit: envValue(env, 'POX5_STACKS_JS_COMMIT', '6101c99efe5a9616ce7e16cef68e28fd10676e7e') as string,
    },
    stacksCore: {
      root: profile === 'local' ? stacksCoreRoot : undefined,
      commit: envValue(env, 'POX5_STACKS_CORE_COMMIT', '3035f03393676ec5e139271101f63de27d3f4d78') as string,
      patchSha256: envValue(
        env,
        'POX5_STACKS_CORE_PATCH_SHA256',
        '9a4a75670c0204bb9ffeca1ac917123ec63c8953733532b2e3940c9bbd5842ba'
      ) as string,
    },
    sources: {
      stacksJsRoot,
      stacksCoreRoot: profile === 'local' ? stacksCoreRoot : undefined,
      stacksRegtestEnvRoot: profile === 'local' ? stacksRegtestEnvRoot : undefined,
    },
    accounts: {
      stakerAddress: envValue(
        env,
        'POX5_STACKS_STAKER_ADDRESS',
        profile === 'local' ? 'ST319CF5WV77KYR1H3GT0GZ7B8Q4AQPY42ETP1VPF' : undefined
      ),
      stakerPrivateKey: envValue(env, 'POX5_STACKS_PRIVATE_KEY'),
    },
  };
}
