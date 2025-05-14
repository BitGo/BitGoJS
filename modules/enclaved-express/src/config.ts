/**
 * @prettier
 */

export interface Config {
  port: number;
  bind: string;
  ipc?: string;
  debugNamespace?: string[];
  keyPath?: string;
  crtPath?: string;
  sslKey?: string;
  sslCert?: string;
  logFile?: string;
  disableSSL?: boolean;
  timeout: number;
  keepAliveTimeout?: number;
  headersTimeout?: number;
}

const defaultConfig: Config = {
  port: 3080,
  bind: 'localhost',
  timeout: 305 * 1000,
  logFile: '',
  disableSSL: false,
};

function readEnvVar(name: string, ...deprecatedAliases: string[]): string | undefined {
  if (process.env[name] !== undefined && process.env[name] !== '') {
    return process.env[name];
  }
  for (const deprecatedAlias of deprecatedAliases) {
    if (process.env[deprecatedAlias] !== undefined) {
      console.warn(
        `warning: using deprecated environment variable '${deprecatedAlias}'. Please use the '${name}' environment variable instead.`
      );
      return process.env[deprecatedAlias];
    }
  }
}

export function config(): Config {
  const envConfig: Partial<Config> = {
    port: Number(readEnvVar('MASTER_BITGO_EXPRESS_PORT')) || defaultConfig.port,
    bind: readEnvVar('MASTER_BITGO_EXPRESS_BIND') || defaultConfig.bind,
    ipc: readEnvVar('MASTER_BITGO_EXPRESS_IPC'),
    debugNamespace: (readEnvVar('MASTER_BITGO_EXPRESS_DEBUG_NAMESPACE') || '').split(',').filter(Boolean),
    keyPath: readEnvVar('MASTER_BITGO_EXPRESS_KEYPATH'),
    crtPath: readEnvVar('MASTER_BITGO_EXPRESS_CRTPATH'),
    sslKey: readEnvVar('MASTER_BITGO_EXPRESS_SSL_KEY'),
    sslCert: readEnvVar('MASTER_BITGO_EXPRESS_SSL_CERT'),
    logFile: readEnvVar('MASTER_BITGO_EXPRESS_LOGFILE'),
    disableSSL: readEnvVar(
      'MASTER_BITGO_EXPRESS_DISABLE_SSL',
      'MASTER_BITGO_EXPRESS_DISABLESSL',
      'DISABLESSL',
      'DISABLE_SSL'
    )
      ? true
      : undefined,
    timeout: Number(readEnvVar('MASTER_BITGO_EXPRESS_TIMEOUT')) || defaultConfig.timeout,
    keepAliveTimeout: Number(readEnvVar('MASTER_BITGO_EXPRESS_KEEP_ALIVE_TIMEOUT')),
    headersTimeout: Number(readEnvVar('MASTER_BITGO_EXPRESS_HEADERS_TIMEOUT')),
  };

  // Support loading key/cert from file if keyPath/crtPath are set and sslKey/sslCert are not
  if (!envConfig.sslKey && envConfig.keyPath) {
    try {
      envConfig.sslKey = require('fs').readFileSync(envConfig.keyPath, 'utf-8');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      throw new Error(`Failed to read sslKey from keyPath: ${err.message}`);
    }
  }
  if (!envConfig.sslCert && envConfig.crtPath) {
    try {
      envConfig.sslCert = require('fs').readFileSync(envConfig.crtPath, 'utf-8');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      throw new Error(`Failed to read sslCert from crtPath: ${err.message}`);
    }
  }

  return { ...defaultConfig, ...envConfig };
}
