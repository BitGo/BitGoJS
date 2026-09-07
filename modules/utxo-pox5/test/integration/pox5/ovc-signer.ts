import { spawn } from 'node:child_process';
import { join } from 'node:path';

import { redactBitGoError } from './bitgo-api';
import { MatrixPrerequisite } from './live-matrix';
import { isRecord } from './rpc';

/**
 * Spawns the OVC `sign-export` CLI (offline-vault-console, `yarn sign-export`)
 * so the harness can drive the real OVC custodial signing code without
 * importing OVC into BitGoJS. The CLI runs in OVC's own dependency tree and
 * Node version; the harness only ever sees the JSON contract below.
 *
 * Configuration (environment):
 *   POX5_OVC_DIR          path to the offline-vault-console checkout (repo root)
 *   POX5_OVC_COMMAND      optional runner prefix (default `yarn`), e.g.
 *                         `fnm exec --using=24.15.0 yarn`
 *   POX5_OVC_KEY_FILE     optional key file override (CLI defaults to the OVC
 *                         test custody key)
 *   POX5_OVC_KEY_PASSWORD OVC test custody key password; passed to the child
 *                         process via env, never via argv
 *   POX5_OVC_TIMEOUT_MS   spawn timeout (default 120000)
 *
 * CLI exit codes map to matrix statuses: 2 (bad input) and 3 (policy refusal)
 * are FAILs; 4 (key/password) and 5 (refused environment), runner problems and
 * timeouts are BLOCKED prerequisites. All error text is redacted against the
 * configured secrets.
 */

export type OvcSignMode = 'explain' | 'sign';

/** Env var that carries the OVC key password into the child process (never argv). */
export const OVC_KEY_PASSWORD_ENV = 'OVC_KEY_PASSWORD';

export const DEFAULT_OVC_COMMAND = 'yarn';
export const DEFAULT_OVC_TIMEOUT_MS = 120_000;

export type OvcSignerConfig = {
  /** Path to the offline-vault-console checkout (the repo root). */
  ovcDir: string;
  /** Runner prefix; `sign-export <mode> ...` is appended to it. */
  commandPrefix: string[];
  /** Optional key file override; the CLI defaults to the OVC test custody key. */
  keyFile?: string;
  /** OVC key password; handed to the child via env, never via argv. */
  keyPassword: string;
  timeoutMs: number;
};

export type OvcInputSignature = { user: boolean; backup: boolean; bitgo: boolean };

export type OvcSignerOutput = {
  mode: OvcSignMode;
  coin: string;
  pendingApprovalId?: string;
  explanation: {
    outputs: Record<string, unknown>[];
    changeOutputs: Record<string, unknown>[];
    fee?: unknown;
    locktime?: unknown;
  };
  signatures?: OvcInputSignature[];
  /** Sign mode only: exactly one entry, what OVC writes for upload. */
  transactions?: Record<string, unknown>[];
};

const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;

function redact(message: string, secrets: string[]): string {
  return redactBitGoError(new Error(message), secrets);
}

function excerpt(text: string, limit = 240): string {
  return text
    .trim()
    .slice(0, limit)
    .replace(/\s*\n\s*/g, ' | ');
}

function parseTimeoutMs(value: string | undefined): number {
  if (value === undefined || value.length === 0) {
    return DEFAULT_OVC_TIMEOUT_MS;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new MatrixPrerequisite('BLOCKED', `POX5_OVC_TIMEOUT_MS must be a positive integer (got ${value})`);
  }
  return parsed;
}

/** Resolves the signer configuration; BLOCKs when mandatory pieces are missing. */
export function ovcSignerConfigFromEnv(env: NodeJS.ProcessEnv): OvcSignerConfig {
  const ovcDir = env.POX5_OVC_DIR;
  if (!ovcDir) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'POX5_OVC_DIR is not set (path to the offline-vault-console checkout that includes the sign-export CLI)'
    );
  }
  const keyPassword = env.POX5_OVC_KEY_PASSWORD;
  if (!keyPassword) {
    throw new MatrixPrerequisite('BLOCKED', 'POX5_OVC_KEY_PASSWORD is not set (the OVC test custody key password)');
  }
  const command = env.POX5_OVC_COMMAND?.trim();
  const keyFile = env.POX5_OVC_KEY_FILE?.trim();
  return {
    ovcDir,
    commandPrefix: command ? command.split(/\s+/) : [DEFAULT_OVC_COMMAND],
    ...(keyFile ? { keyFile } : {}),
    keyPassword,
    timeoutMs: parseTimeoutMs(env.POX5_OVC_TIMEOUT_MS),
  };
}

function expectRecord(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`OVC sign-export output field ${what} is not an object`);
  }
  return value;
}

function expectString(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`OVC sign-export output field ${what} is not a non-empty string`);
  }
  return value;
}

function expectRecordArray(value: unknown, what: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    throw new Error(`OVC sign-export output field ${what} is not an array of objects`);
  }
  return value as Record<string, unknown>[];
}

function parseInputSignatures(value: unknown): OvcInputSignature[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  const signatures = expectRecordArray(value, 'signatures');
  return signatures.map((signature) => {
    for (const key of ['user', 'backup', 'bitgo'] as const) {
      if (typeof signature[key] !== 'boolean') {
        throw new Error(`OVC sign-export output field signatures.${key} is not a boolean`);
      }
    }
    return {
      user: signature.user === true,
      backup: signature.backup === true,
      bitgo: signature.bitgo === true,
    };
  });
}

/** Validates the CLI JSON contract with hand-written type guards. */
export function parseOvcSignerOutput(text: string, mode: OvcSignMode): OvcSignerOutput {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`OVC sign-export stdout is not valid JSON: ${excerpt(text)}`);
  }
  const payload = expectRecord(value, '(root)');
  if (payload.ok !== true) {
    throw new Error(`OVC sign-export output is not ok: ${excerpt(text)}`);
  }
  if (payload.mode !== mode) {
    throw new Error(`OVC sign-export output mode is ${String(payload.mode)}, expected ${mode}`);
  }
  const explanation = expectRecord(payload.explanation, 'explanation');
  const output: OvcSignerOutput = {
    mode,
    coin: expectString(payload.coin, 'coin'),
    explanation: {
      outputs: expectRecordArray(explanation.outputs, 'explanation.outputs'),
      changeOutputs: expectRecordArray(explanation.changeOutputs, 'explanation.changeOutputs'),
      ...(explanation.fee !== undefined ? { fee: explanation.fee } : {}),
      ...(explanation.locktime !== undefined ? { locktime: explanation.locktime } : {}),
    },
    ...(parseInputSignatures(payload.signatures) !== undefined
      ? { signatures: parseInputSignatures(payload.signatures) }
      : {}),
  };
  if (typeof payload.pendingApprovalId === 'string' && payload.pendingApprovalId.length > 0) {
    output.pendingApprovalId = payload.pendingApprovalId;
  }
  if (mode === 'sign') {
    const transactions = expectRecordArray(payload.transactions, 'transactions');
    if (transactions.length !== 1) {
      throw new Error(`OVC sign-export returned ${transactions.length} transactions, expected exactly one`);
    }
    const transaction = transactions[0];
    const txHex =
      typeof transaction.txHex === 'string'
        ? transaction.txHex
        : isRecord(transaction.halfSigned) && typeof transaction.halfSigned.txHex === 'string'
        ? transaction.halfSigned.txHex
        : undefined;
    if (!txHex) {
      throw new Error('OVC sign-export transaction has neither txHex nor halfSigned.txHex');
    }
    output.transactions = transactions;
  }
  return output;
}

/** Maps a non-zero CLI exit code to a FAIL or BLOCKED error. */
export function ovcExitCodeError(exitCode: number, stderr: string, secrets: string[]): Error {
  const detail = excerpt(stderr);
  switch (exitCode) {
    case 2:
      return new Error(redact(`OVC sign-export rejected the export input (exit 2): ${detail}`, secrets));
    case 3:
      return new Error(
        redact(
          `OVC refused to sign the export — policy refusal, e.g. wrong keys, locktime or derivation id (exit 3): ${detail}`,
          secrets
        )
      );
    case 4:
      return new MatrixPrerequisite(
        'BLOCKED',
        redact('OVC key or password error (exit 4); check POX5_OVC_KEY_PASSWORD and POX5_OVC_KEY_FILE', secrets)
      );
    case 5:
      return new MatrixPrerequisite(
        'BLOCKED',
        redact('OVC refused the target environment (exit 5); the CLI only supports --env test', secrets)
      );
    default:
      return new Error(redact(`OVC sign-export exited with code ${exitCode}: ${detail}`, secrets));
  }
}

/**
 * Runs the OVC sign-export CLI against an awaiting-signature export response.
 * The response JSON is piped to the child's stdin; the result JSON is read
 * from stdout and validated. No shell is involved.
 */
export async function signWithOvc(
  exportResponse: unknown,
  mode: OvcSignMode,
  config: OvcSignerConfig,
  environment: string = 'test'
): Promise<OvcSignerOutput> {
  const secrets = [config.keyPassword];
  const args = [
    ...config.commandPrefix,
    'sign-export',
    mode,
    '--in',
    '-',
    '--out',
    '-',
    ...(config.keyFile ? ['--key-file', config.keyFile] : []),
    '--env',
    environment,
  ];
  const cwd = join(config.ovcDir, 'app/frontend');
  const child = spawn(args[0], args.slice(1), {
    cwd,
    env: { ...process.env, [OVC_KEY_PASSWORD_ENV]: config.keyPassword },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  let outputTooLarge = false;
  child.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8');
    if (stdout.length > MAX_OUTPUT_BYTES) {
      outputTooLarge = true;
      child.kill('SIGTERM');
    }
  });
  child.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  const finished = new Promise<{ exitCode: number | null; signal: string | null }>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (exitCode, signal) => resolve({ exitCode, signal }));
  });
  const timedOut = new Promise<'timeout'>((resolve) => {
    const timer = setTimeout(() => resolve('timeout'), config.timeoutMs);
    const clear = () => clearTimeout(timer);
    finished.then(clear, clear);
  });

  child.stdin.on('error', () => {
    // the CLI may exit before reading all of stdin; the close event reports the real outcome
  });
  child.stdin.end(`${JSON.stringify(exportResponse)}\n`);

  let outcome: { exitCode: number | null; signal: string | null } | 'timeout';
  try {
    outcome = await Promise.race([finished, timedOut]);
  } catch (error) {
    // the runner binary could not be started at all
    const reason = error instanceof Error ? error.message : String(error);
    throw new MatrixPrerequisite(
      'BLOCKED',
      redact(
        `OVC sign-export runner failed to start (${reason}); check POX5_OVC_COMMAND (got ${config.commandPrefix.join(
          ' '
        )}) and POX5_OVC_DIR`,
        secrets
      )
    );
  }
  if (outcome === 'timeout') {
    child.kill('SIGTERM');
    throw new MatrixPrerequisite(
      'BLOCKED',
      `OVC sign-export did not finish within ${config.timeoutMs}ms (check POX5_OVC_COMMAND and the OVC checkout)`
    );
  }
  if (outputTooLarge) {
    throw new Error('OVC sign-export produced more than 16MB of output');
  }
  const { exitCode, signal } = outcome;
  if (exitCode === 0) {
    return parseOvcSignerOutput(stdout, mode);
  }
  if (exitCode !== null) {
    throw ovcExitCodeError(exitCode, stderr, secrets);
  }
  throw new Error(
    redact(`OVC sign-export was terminated by ${signal ?? 'an unknown signal'}: ${excerpt(stderr)}`, secrets)
  );
}
