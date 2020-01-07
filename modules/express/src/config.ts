import { EnvironmentName, V1Network } from 'bitgo';
import { isNil, isNumber } from 'lodash';

import { args } from './args';

export interface Config {
  port: number;
  bind: string;
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
}

export const ArgConfig = (args): Partial<Config> => ({
  port: args.port,
  bind: args.bind,
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
});

export const EnvConfig = (): Partial<Config> => ({
  port: Number(process.env.BITGO_PORT),
  bind: process.env.BITGO_BIND || DefaultConfig.bind,
  env: (process.env.BITGO_ENV as EnvironmentName) || DefaultConfig.env,
  debugNamespace: (process.env.BITGO_DEBUG_NAMESPACE || '').split(','),
  keyPath: process.env.BITGO_KEYPATH,
  crtPath: process.env.BITGO_CRTPATH,
  logFile: process.env.BITGO_LOGFILE,
  disableSSL: (process.env.DISABLESSL || process.env.DISABLE_SSL) ?
    Boolean((process.env.DISABLESSL || process.env.DISABLE_SSL)) : undefined,
  disableProxy: process.env.DISABLE_PROXY ? Boolean(process.env.DISABLE_PROXY) : undefined,
  disableEnvCheck: process.env.DISABLE_ENV_CHECK ? Boolean(process.env.DISABLE_ENV_CHECK) : undefined,
  timeout: Number(process.env.BITGO_TIMEOUT),
  customRootUri: process.env.BITGO_CUSTOM_ROOT_URI,
  customBitcoinNetwork: (process.env.BITGO_CUSTOM_BITCOIN_NETWORK as V1Network),
});

export const DefaultConfig: Config = {
  port: 3080,
  bind: 'localhost',
  env: 'test',
  debugNamespace: [],
  logFile: '',
  disableSSL: false,
  disableProxy: false,
  disableEnvCheck: false,
  timeout: 305 * 1000,
};

/**
 * Helper function to merge config sources into a single config object.
 *
 * Earlier configs have higher precedence over subsequent configs.
 */
function mergeConfigs(...configs: Partial<Config>[]): Config {
  function isNilOrNaN(val: unknown): val is null | undefined | number {
    return isNil(val) || (isNumber(val) && isNaN(val));
  }
  // helper to get the first defined value for a given config key
  // from the config sources in a type safe manner
  function get<T extends keyof Config>(k: T): Config[T] {
    return configs
      .reverse()
      .reduce((entry: Config[T], config) => !isNilOrNaN(config[k]) ? config[k] as Config[T] : entry, DefaultConfig[k]);
  }

  return {
    port: get('port'),
    bind: get('bind'),
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
  };
}

export const config = () => {
  const arg = ArgConfig(args());
  const env = EnvConfig();
  return mergeConfigs(arg, env);
};
