import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const TEST_ENV_CONFIG_FILE = 'test-env.config.json';

export type TestEnvUser = { username: string; userId: string; bitgoAdmin: boolean };

export type TestEnvConfig = {
  environment: 'test';
  coin: 'tbtcstxsignet';
  enterprise: { id: string };
  users: { initiator: TestEnvUser; approver: TestEnvUser; custodyadmin?: TestEnvUser };
  wallets: { custodialStake: { label: string; id: string } };
  staker: { address: string };
  sessionDir: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Test env config: ${name} is required`);
  return value;
}

function parseUser(value: unknown, name: string): TestEnvUser {
  if (!isRecord(value)) throw new Error(`Test env config: ${name} must be an object`);
  return {
    username: requiredText(value.username, `${name}.username`),
    userId: requiredText(value.userId, `${name}.userId`),
    bitgoAdmin: value.bitgoAdmin === true,
  };
}

/** Validates the shape of test-env.config.json; throws on anything unexpected. */
export function parseTestEnvConfig(value: unknown): TestEnvConfig {
  if (!isRecord(value)) throw new Error('Test env config must be a JSON object');
  if (value.environment !== 'test') throw new Error('Test env config: environment must be "test"');
  if (value.coin !== 'tbtcstxsignet') throw new Error('Test env config: coin must be "tbtcstxsignet"');
  if (!isRecord(value.enterprise) || !isRecord(value.users) || !isRecord(value.wallets) || !isRecord(value.staker)) {
    throw new Error('Test env config: enterprise, users, wallets and staker sections are required');
  }
  const wallets = value.wallets;
  if (!isRecord(wallets.custodialStake)) throw new Error('Test env config: wallets.custodialStake is required');
  return {
    environment: 'test',
    coin: 'tbtcstxsignet',
    enterprise: { id: requiredText(value.enterprise.id, 'enterprise.id') },
    users: {
      initiator: parseUser(value.users.initiator, 'users.initiator'),
      approver: parseUser(value.users.approver, 'users.approver'),
      ...(isRecord(value.users.custodyadmin)
        ? { custodyadmin: parseUser(value.users.custodyadmin, 'users.custodyadmin') }
        : {}),
    },
    wallets: {
      custodialStake: {
        label: requiredText(wallets.custodialStake.label, 'wallets.custodialStake.label'),
        id: requiredText(wallets.custodialStake.id, 'wallets.custodialStake.id'),
      },
    },
    staker: { address: requiredText(value.staker.address, 'staker.address') },
    sessionDir: requiredText(value.sessionDir, 'sessionDir'),
  };
}

function expandHome(path: string): string {
  return path.startsWith('~/') ? join(homedir(), path.slice(2)) : path;
}

/** Session file written by `bitgo-http login` for a regular (non-admin) user. */
export function userSessionPath(sessionDir: string, username: string): string {
  return join(expandHome(sessionDir), `test-${username.replace(/[^a-z0-9@.+_-]/g, '_')}.json`);
}

/** Reads a fresh access token; expired or missing sessions fail with the login command to run. */
export async function readUserSessionToken(path: string, nowSeconds: number): Promise<string> {
  let contents: string;
  try {
    contents = await readFile(path, 'utf8');
  } catch {
    throw new Error(`No session at ${path}; run: bitgo-http login --env test --username <user>`);
  }
  const session: unknown = JSON.parse(contents);
  if (!isRecord(session) || typeof session.accessToken !== 'string') {
    throw new Error(`Invalid session file ${path}; rerun: bitgo-http login`);
  }
  if (typeof session.expiresAt !== 'number' || session.expiresAt <= nowSeconds + 300) {
    throw new Error(`Session ${path} is expired or near expiry; rerun: bitgo-http login`);
  }
  return session.accessToken;
}

/** Maps the config onto the env keys the harness already reads for the test environment. */
export async function testEnvConfigOverlay(config: TestEnvConfig, nowSeconds: number): Promise<Record<string, string>> {
  const initiatorToken = await readUserSessionToken(
    userSessionPath(config.sessionDir, config.users.initiator.username),
    nowSeconds
  );
  const approverToken = await readUserSessionToken(
    userSessionPath(config.sessionDir, config.users.approver.username),
    nowSeconds
  );
  // The custodyadmin session is optional: it is only required for the opt-in
  // OVC upload, so a missing or expired session omits the overlay keys and the
  // upload BLOCKs with a dedicated message instead of breaking sign-only runs.
  const custodyadminToken = config.users.custodyadmin
    ? await readUserSessionToken(
        userSessionPath(config.sessionDir, config.users.custodyadmin.username),
        nowSeconds
      ).catch(() => undefined)
    : undefined;
  return {
    POX5_LIVE_ENTERPRISE_TEST: config.enterprise.id,
    BITGO_TOKEN_TEST: initiatorToken,
    BITGO_APPROVER_TOKEN_TEST: approverToken,
    ...(custodyadminToken && config.users.custodyadmin
      ? {
          BITGO_CUSTODYADMIN_TOKEN_TEST: custodyadminToken,
          POX5_LIVE_CUSTODYADMIN_USERNAME_TEST: config.users.custodyadmin.username,
          POX5_LIVE_CUSTODYADMIN_USER_ID_TEST: config.users.custodyadmin.userId,
        }
      : {}),
    POX5_LIVE_INITIATOR_USER_ID_TEST: config.users.initiator.userId,
    POX5_LIVE_APPROVER_USERNAME_TEST: config.users.approver.username,
    POX5_LIVE_APPROVER_USER_ID_TEST: config.users.approver.userId,
    POX5_LIVE_APPROVER_BITGO_ADMIN_TEST: config.users.approver.bitgoAdmin ? 'true' : 'false',
    POX5_STACKS_STAKER_ADDRESS: config.staker.address,
  };
}

/** Reads test-env.config.json if present and returns the env overlay; absent file means no overlay. */
export async function loadTestEnvOverlay(
  directory: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): Promise<Record<string, string>> {
  let contents: string;
  try {
    contents = await readFile(join(directory, TEST_ENV_CONFIG_FILE), 'utf8');
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return {};
    throw new Error('Unable to read the test env config');
  }
  return testEnvConfigOverlay(parseTestEnvConfig(JSON.parse(contents)), nowSeconds);
}
