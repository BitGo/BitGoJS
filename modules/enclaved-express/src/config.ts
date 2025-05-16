/**
 * @prettier
 */

export enum TlsMode {
  DISABLED = 'disabled',   // No TLS (plain HTTP)
  ENABLED = 'enabled',     // TLS with server cert only
  MTLS = 'mtls'           // TLS with both server and client certs
}

export interface Config {
  port: number;
  bind: string;
  ipc?: string;
  debugNamespace?: string[];
  // TLS settings
  keyPath?: string;
  crtPath?: string;
  tlsKey?: string;
  tlsCert?: string;
  tlsMode: TlsMode;
  // mTLS settings
  mtlsRequestCert?: boolean;
  mtlsRejectUnauthorized?: boolean;
  mtlsAllowedClientFingerprints?: string[];
  // Other settings
  logFile?: string;
  timeout: number;
  keepAliveTimeout?: number;
  headersTimeout?: number;
}

const defaultConfig: Config = {
  port: 3080,
  bind: 'localhost',
  timeout: 305 * 1000,
  logFile: '',
  tlsMode: TlsMode.ENABLED,  // Default to TLS enabled
  mtlsRequestCert: false,
  mtlsRejectUnauthorized: false,
};

function readEnvVar(name: string): string | undefined {
  if (process.env[name] !== undefined && process.env[name] !== '') {
    return process.env[name];
  }
}

export function config(): Config {
  const envConfig: Partial<Config> = {
    port: Number(readEnvVar('MASTER_BITGO_EXPRESS_PORT')) || defaultConfig.port,
    bind: readEnvVar('MASTER_BITGO_EXPRESS_BIND') || defaultConfig.bind,
    ipc: readEnvVar('MASTER_BITGO_EXPRESS_IPC'),
    debugNamespace: (readEnvVar('MASTER_BITGO_EXPRESS_DEBUG_NAMESPACE') || '').split(',').filter(Boolean),
    // Basic TLS settings from MASTER_BITGO_EXPRESS
    keyPath: readEnvVar('MASTER_BITGO_EXPRESS_KEYPATH'),
    crtPath: readEnvVar('MASTER_BITGO_EXPRESS_CRTPATH'),
    tlsKey: readEnvVar('MASTER_BITGO_EXPRESS_TLS_KEY'),
    tlsCert: readEnvVar('MASTER_BITGO_EXPRESS_TLS_CERT'),
    // Determine TLS mode
    tlsMode: readEnvVar('MASTER_BITGO_EXPRESS_DISABLE_TLS') === 'true'
      ? TlsMode.DISABLED
      : readEnvVar('MTLS_ENABLED') === 'true'
        ? TlsMode.MTLS
        : TlsMode.ENABLED,
    // mTLS settings
    mtlsRequestCert: readEnvVar('MTLS_REQUEST_CERT') === 'true',
    mtlsRejectUnauthorized: readEnvVar('MTLS_REJECT_UNAUTHORIZED') === 'true',
    mtlsAllowedClientFingerprints: readEnvVar('MTLS_ALLOWED_CLIENT_FINGERPRINTS')?.split(','),
    // Other settings
    logFile: readEnvVar('MASTER_BITGO_EXPRESS_LOGFILE'),
    timeout: Number(readEnvVar('MASTER_BITGO_EXPRESS_TIMEOUT')) || defaultConfig.timeout,
    keepAliveTimeout: Number(readEnvVar('MASTER_BITGO_EXPRESS_KEEP_ALIVE_TIMEOUT')),
    headersTimeout: Number(readEnvVar('MASTER_BITGO_EXPRESS_HEADERS_TIMEOUT')),
  };

  // Support loading key/cert from file if keyPath/crtPath are set and tlsKey/tlsCert are not
  if (!envConfig.tlsKey && envConfig.keyPath) {
    try {
      envConfig.tlsKey = require('fs').readFileSync(envConfig.keyPath, 'utf-8');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      throw new Error(`Failed to read TLS key from keyPath: ${err.message}`);
    }
  }
  if (!envConfig.tlsCert && envConfig.crtPath) {
    try {
      envConfig.tlsCert = require('fs').readFileSync(envConfig.crtPath, 'utf-8');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      throw new Error(`Failed to read TLS certificate from crtPath: ${err.message}`);
    }
  }

  return { ...defaultConfig, ...envConfig };
}
