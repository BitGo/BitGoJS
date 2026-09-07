import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MatrixPrerequisite } from './live-matrix';
import {
  DEFAULT_OVC_COMMAND,
  DEFAULT_OVC_TIMEOUT_MS,
  ovcSignerConfigFromEnv,
  parseOvcSignerOutput,
  signWithOvc,
  type OvcSignerConfig,
} from './ovc-signer';

const KEY_PASSWORD = 'unit-test-key-password';

// A fake sign-export runner: reads the case file, records what the harness passed it
// (argv, stdin, cwd, password env), then replays the scripted stdout/stderr/exit.
const FAKE_RUNNER = `
const fs = require('fs');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  fs.writeFileSync(
    spec.recordPath,
    JSON.stringify({
      argv: process.argv.slice(3),
      stdin: input,
      cwd: process.cwd(),
      passwordEnv: process.env.OVC_KEY_PASSWORD,
    })
  );
  if (spec.sleepMs) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, spec.sleepMs);
  }
  if (spec.stderr) {
    process.stderr.write(spec.stderr);
  }
  if (spec.stdout !== undefined) {
    process.stdout.write(spec.stdout);
  }
  process.exit(spec.exit ?? 0);
});
`;

const SIGN_OUTPUT = {
  ok: true,
  mode: 'sign',
  coin: 'tbtcstxsignet',
  pendingApprovalId: 'pa-1',
  explanation: {
    outputs: [{ address: 'tb1qy04q6g6jvah0ufk9g', amount: '30000' }],
    changeOutputs: [],
    fee: 2424,
  },
  signatures: [{ user: true, backup: false, bitgo: false }],
  transactions: [{ isHalfSigned: true, txHex: '70736274ff' }],
};

describe('OVC sign-export runner (ovc-signer)', function () {
  let ovcDir: string;
  let caseDir: string;
  let caseIndex = 0;

  before(async function () {
    ovcDir = await mkdtemp(join(tmpdir(), 'ovc-signer-'));
    caseDir = join(ovcDir, 'cases');
    await mkdir(caseDir, { recursive: true });
    await mkdir(join(ovcDir, 'app', 'frontend'), { recursive: true });
    await writeFile(join(ovcDir, 'fake-runner.cjs'), FAKE_RUNNER);
  });

  type Case = { exit?: number; stdout?: string; stderr?: string; sleepMs?: number };

  async function runner(caseSpec: Case, overrides: Partial<OvcSignerConfig> = {}): Promise<unknown> {
    const caseFile = join(caseDir, `${String(caseIndex).padStart(3, '0')}-case.json`);
    const recordPath = join(caseDir, `${String(caseIndex).padStart(3, '0')}-record.json`);
    caseIndex += 1;
    const config: OvcSignerConfig = {
      ovcDir,
      commandPrefix: [process.execPath, join(ovcDir, 'fake-runner.cjs'), caseFile],
      keyPassword: KEY_PASSWORD,
      timeoutMs: 10_000,
      ...overrides,
    };
    await writeFile(caseFile, JSON.stringify({ ...caseSpec, recordPath }));
    return signWithOvc({ transactions: [{ coin: 'tbtcstxsignet' }] }, 'sign', config);
  }

  function recordPathOf(index: number): string {
    return join(caseDir, `${String(index).padStart(3, '0')}-record.json`);
  }

  it('pipes the export over stdin, keeps the password out of argv, and parses the result', async function () {
    const index = caseIndex;
    const output = (await runner({ exit: 0, stdout: JSON.stringify(SIGN_OUTPUT) })) as ReturnType<
      typeof parseOvcSignerOutput
    >;
    assert.equal(output.mode, 'sign');
    assert.equal(output.coin, 'tbtcstxsignet');
    assert.equal(output.pendingApprovalId, 'pa-1');
    assert.equal(output.transactions!.length, 1);
    const recorded = JSON.parse(await readFile(recordPathOf(index), 'utf8'));
    assert.deepEqual(recorded.argv, ['sign-export', 'sign', '--in', '-', '--out', '-', '--env', 'test']);
    assert.equal(JSON.parse(recorded.stdin).transactions.length, 1);
    assert.equal(recorded.cwd, join(ovcDir, 'app', 'frontend'));
    assert.equal(recorded.passwordEnv, KEY_PASSWORD);
    assert(!recorded.argv.includes(KEY_PASSWORD), 'the key password must never appear in argv');
  });

  it('appends the key file override to the runner arguments', async function () {
    const index = caseIndex;
    await runner({ exit: 0, stdout: JSON.stringify(SIGN_OUTPUT) }, { keyFile: '/opt/keys/custody.json' });
    const recorded = JSON.parse(await readFile(recordPathOf(index), 'utf8'));
    assert.deepEqual(recorded.argv, [
      'sign-export',
      'sign',
      '--in',
      '-',
      '--out',
      '-',
      '--key-file',
      '/opt/keys/custody.json',
      '--env',
      'test',
    ]);
  });

  it('maps exit code 2 (bad input) to a FAIL error', async function () {
    await assert.rejects(runner({ exit: 2, stderr: 'expected exactly one transaction' }), /rejected the export input/);
  });

  it('maps exit code 3 (policy refusal) to a FAIL error and redacts secrets', async function () {
    await assert.rejects(runner({ exit: 3, stderr: `refused: ${KEY_PASSWORD} leaked?` }), (error: unknown) => {
      assert(!(error instanceof MatrixPrerequisite), 'policy refusals are failures, not blockers');
      assert.match((error as Error).message, /policy refusal/);
      assert(!(error as Error).message.includes(KEY_PASSWORD), 'the key password must be redacted');
      return true;
    });
  });

  it('maps exit code 4 (key/password) to BLOCKED', async function () {
    await assert.rejects(runner({ exit: 4 }), (error: unknown) => {
      assert((error as MatrixPrerequisite).status === 'BLOCKED');
      assert.match((error as Error).message, /POX5_OVC_KEY_PASSWORD/);
      return true;
    });
  });

  it('maps exit code 5 (refused environment) to BLOCKED', async function () {
    await assert.rejects(runner({ exit: 5 }), (error: unknown) => {
      assert((error as MatrixPrerequisite).status === 'BLOCKED');
      return true;
    });
  });

  it('rejects non-JSON output on exit code 0', async function () {
    await assert.rejects(runner({ exit: 0, stdout: 'not json at all' }), /not valid JSON/);
  });

  it('BLOCKs when the runner does not finish in time', async function () {
    await assert.rejects(runner({ sleepMs: 2_000 }, { timeoutMs: 100 }), (error: unknown) => {
      assert((error as MatrixPrerequisite).status === 'BLOCKED');
      assert.match((error as Error).message, /did not finish within 100ms/);
      return true;
    });
  });

  it('BLOCKs when the runner cannot be started', async function () {
    await assert.rejects(runner({}, { commandPrefix: ['/nonexistent/fake-runner'] }), (error: unknown) => {
      assert((error as MatrixPrerequisite).status === 'BLOCKED');
      assert.match((error as Error).message, /failed to start/);
      return true;
    });
  });
});

describe('OVC sign-export configuration', function () {
  it('BLOCKs without POX5_OVC_DIR', function () {
    assert.throws(() => ovcSignerConfigFromEnv({ POX5_OVC_KEY_PASSWORD: KEY_PASSWORD }), MatrixPrerequisite);
    assert.throws(() => ovcSignerConfigFromEnv({ POX5_OVC_KEY_PASSWORD: KEY_PASSWORD }), /POX5_OVC_DIR/);
  });

  it('BLOCKs without POX5_OVC_KEY_PASSWORD', function () {
    assert.throws(() => ovcSignerConfigFromEnv({ POX5_OVC_DIR: '/opt/ovc' }), /POX5_OVC_KEY_PASSWORD/);
  });

  it('defaults to yarn and 120s, and splits the runner template on whitespace', function () {
    const config = ovcSignerConfigFromEnv({ POX5_OVC_DIR: '/opt/ovc', POX5_OVC_KEY_PASSWORD: KEY_PASSWORD });
    assert.deepEqual(config.commandPrefix, [DEFAULT_OVC_COMMAND]);
    assert.equal(config.timeoutMs, DEFAULT_OVC_TIMEOUT_MS);
    const configured = ovcSignerConfigFromEnv({
      POX5_OVC_DIR: '/opt/ovc',
      POX5_OVC_KEY_PASSWORD: KEY_PASSWORD,
      POX5_OVC_COMMAND: 'fnm exec --using=24.15.0 yarn',
      POX5_OVC_KEY_FILE: '/opt/keys/custody.json',
      POX5_OVC_TIMEOUT_MS: '30000',
    });
    assert.deepEqual(configured.commandPrefix, ['fnm', 'exec', '--using=24.15.0', 'yarn']);
    assert.equal(configured.keyFile, '/opt/keys/custody.json');
    assert.equal(configured.timeoutMs, 30_000);
  });

  it('rejects a non-positive timeout', function () {
    assert.throws(
      () =>
        ovcSignerConfigFromEnv({
          POX5_OVC_DIR: '/opt/ovc',
          POX5_OVC_KEY_PASSWORD: KEY_PASSWORD,
          POX5_OVC_TIMEOUT_MS: 'soon',
        }),
      MatrixPrerequisite
    );
  });
});

describe('OVC sign-export output guards', function () {
  const base = {
    ok: true,
    mode: 'sign',
    coin: 'tbtcstxsignet',
    explanation: { outputs: [], changeOutputs: [] },
    transactions: [{ txHex: 'aa' }],
  };

  it('rejects ok:false payloads', function () {
    assert.throws(() => parseOvcSignerOutput(JSON.stringify({ ...base, ok: false }), 'sign'), /not ok/);
  });

  it('rejects a mode mismatch', function () {
    assert.throws(() => parseOvcSignerOutput(JSON.stringify({ ...base, mode: 'explain' }), 'sign'), /mode/);
  });

  it('requires exactly one signed transaction in sign mode', function () {
    assert.throws(
      () => parseOvcSignerOutput(JSON.stringify({ ...base, transactions: [{ txHex: 'aa' }, { txHex: 'bb' }] }), 'sign'),
      /expected exactly one/
    );
    assert.throws(
      () => parseOvcSignerOutput(JSON.stringify({ ...base, transactions: [{ isHalfSigned: true }] }), 'sign'),
      /neither txHex nor halfSigned/
    );
  });

  it('rejects malformed explanations and signatures', function () {
    assert.throws(
      () => parseOvcSignerOutput(JSON.stringify({ ...base, explanation: { outputs: 'nope' } }), 'sign'),
      /explanation.outputs/
    );
    assert.throws(
      () => parseOvcSignerOutput(JSON.stringify({ ...base, signatures: [{ user: 'yes' }] }), 'sign'),
      /signatures/
    );
  });

  it('accepts a valid sign payload and normalizes signatures', function () {
    const output = parseOvcSignerOutput(JSON.stringify(SIGN_OUTPUT), 'sign');
    assert.deepEqual(output.signatures, [{ user: true, backup: false, bitgo: false }]);
    assert.equal(output.explanation.fee, 2424);
  });
});
