import { EnvironmentName, V1Network } from 'bitgo';
import { isNil, isNumber } from 'lodash';

import { args } from './args';

function readEnvVar(name, ...deprecatedAliases): string | undefined {
  if (process.env[name] !== undefined) {
    return process.env[name];
  }

  for (const deprecatedAlias of deprecatedAliases) {
    if (process.env[deprecatedAlias] !== undefined) {
      console.warn(`warning: using deprecated environment variable '${deprecatedAlias}'. Please use the '${name}' environment variable instead.`);
      return process.env[deprecatedAlias];
    }
  }
}

export interface Config {
  port: number;
  bind: string;
  ipc?: string;
  env: EnvironmentName;
  debugNamespace: string[];
  keyPath?: string;
  crtPath?: string;
  logFile?: string;
  disableSSL: boolean;
  disableProxy: boolean;
  disableEnvCheck: boolean;
  timeout: number;
  customRootUri?: string;
  customBitcoinNetwork?: V1Network;
  authVersion: number;
  externalSignerUrl?: string;
  signerMode?: boolean;
  signerFileSystemPath?: string;
}

export const ArgConfig = (args): Partial<Config> => ({
  port: args.port,
  bind: args.bind,
  ipc: args.ipc,
  env: args.env,
  debugNamespace: args.debugnamespace,
  keyPath: args.keypath,
  crtPath: args.crtpath,
  logFile: args.logfile,
  disableSSL: args.disablessl,
  disableProxy: args.disableproxy,
  disableEnvCheck: args.disableenvcheck,
  timeout: args.timeout,
  customRootUri: args.customrooturi,
  customBitcoinNetwork: args.custombitcoinnetwork,
  authVersion: args.authVersion,
  externalSignerUrl: args.externalSignerUrl,
  signerMode: args.signerMode,
  signerFileSystemPath: args.signerFileSystemPath,
});

export const EnvConfig = (): Partial<Config> => ({
  port: Number(readEnvVar('BITGO_PORT')),
  bind: readEnvVar('BITGO_BIND'),
  ipc: readEnvVar('BITGO_IPC'),
  env: (readEnvVar('BITGO_ENV') as EnvironmentName),
  debugNamespace: (readEnvVar('BITGO_DEBUG_NAMESPACE') || '').split(','),
  keyPath: readEnvVar('BITGO_KEYPATH'),
  crtPath: readEnvVar('BITGO_CRTPATH'),
  logFile: readEnvVar('BITGO_LOGFILE'),
  disableSSL: readEnvVar('BITGO_DISABLE_SSL', 'BITGO_DISABLESSL', 'DISABLESSL', 'DISABLE_SSL') ?
    true : undefined,
  disableProxy: readEnvVar('BITGO_DISABLE_PROXY', 'DISABLE_PROXY') ? true : undefined,
  disableEnvCheck: readEnvVar('BITGO_DISABLE_ENV_CHECK', 'DISABLE_ENV_CHECK') ? true : undefined,
  timeout: Number(readEnvVar('BITGO_TIMEOUT')),
  customRootUri: readEnvVar('BITGO_CUSTOM_ROOT_URI'),
  customBitcoinNetwork: (readEnvVar('BITGO_CUSTOM_BITCOIN_NETWORK') as V1Network),
  authVersion: Number(readEnvVar('BITGO_AUTH_VERSION')),
  externalSignerUrl: readEnvVar('BITGO_EXTERNAL_SIGNER_URL'),
  signerMode: readEnvVar('BITGO_SIGNER_MODE') ? true : undefined,
  signerFileSystemPath: readEnvVar('BITGO_SIGNER_FILE_SYSTEM_PATH'),
});

export const DefaultConfig: Config = {
  port: 3080,
  bind: 'localhost',
  env: 'test',
  debugNamespace: [],
  logFile: '',
  disableSSL: false,
  disableProxy: false,
  // BG-9584: temporarily disable env check while we give users time to react to change in runtime behavior
  // This will require a major version bump, since this is a breaking change to default behavior.
  disableEnvCheck: true,
  timeout: 305 * 1000,
  authVersion: 2,
};

/**
 * Helper function to merge config sources into a single config object.
 *
 * Later configs have higher precedence over earlier configs.
 */
function mergeConfigs(...configs: Partial<Config>[]): Config {
  function isNilOrNaN(val: unknown): val is null | undefined | number {
    return isNil(val) || (isNumber(val) && isNaN(val));
  }

  // helper to get the last defined value for a given config key
  // from each of the config sources in a type safe manner.
  function get<T extends keyof Config>(k: T): Config[T] {
    return configs.reduce(
      (entry: Config[T], config) => !isNilOrNaN(config[k]) ? config[k] as Config[T] : entry,
      DefaultConfig[k],
    );
  }

  return {
    port: get('port'),
    bind: get('bind'),
    ipc: get('ipc'),
    env: get('env'),
    debugNamespace: get('debugNamespace'),
    keyPath: get('keyPath'),
    crtPath: get('crtPath'),
    logFile: get('logFile'),
    disableSSL: get('disableSSL'),
    disableProxy: get('disableProxy'),
    disableEnvCheck: get('disableEnvCheck'),
    timeout: get('timeout'),
    customRootUri: get('customRootUri'),
    customBitcoinNetwork: get('customBitcoinNetwork'),
    authVersion: get('authVersion'),
    externalSignerUrl: get('externalSignerUrl'),
    signerMode: get('signerMode'),
    signerFileSystemPath: get('signerFileSystemPath'),
  };
}

export const config = () => {
  const arg = ArgConfig(args());
  const env = EnvConfig();
  return mergeConfigs(env, arg);
};
