import assert from 'assert';
import { writeFileSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';

import { checkDuplicates } from '../src/duplicateCheck';

function writeLockfile(dir: string, packages: Record<string, { version: string }>): void {
  writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages }));
}

describe('checkDuplicates', function () {
  it('returns no duplicates when single version exists', async function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeLockfile(tmpDir, {
      'node_modules/@bitgo-beta/utxo-lib': { version: '11.0.0-beta.1010' },
    });

    const report = await checkDuplicates(['@bitgo-beta/utxo-lib'], tmpDir);
    assert.strictEqual(report.hasDuplicates, false);
  });

  it('detects duplicates when multiple versions exist', async function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeLockfile(tmpDir, {
      'node_modules/@bitgo-beta/utxo-lib': { version: '11.0.0-beta.1010' },
      'node_modules/@bitgo-beta/sdk-core/node_modules/@bitgo-beta/utxo-lib': {
        version: '11.0.0-beta.1009',
      },
    });

    const report = await checkDuplicates(['@bitgo-beta/utxo-lib'], tmpDir);
    assert.strictEqual(report.hasDuplicates, true);
    const entries = report.details.get('@bitgo-beta/utxo-lib');
    assert.ok(entries);
    assert.strictEqual(entries.length, 2);
  });

  it('reports package not found when absent', async function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeLockfile(tmpDir, {});

    const report = await checkDuplicates(['@bitgo-beta/utxo-lib'], tmpDir);
    assert.strictEqual(report.hasDuplicates, false);
    const entries = report.details.get('@bitgo-beta/utxo-lib');
    assert.ok(entries);
    assert.strictEqual(entries.length, 0);
  });

  it('handles multiple packages to check', async function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeLockfile(tmpDir, {
      'node_modules/@bitgo-beta/utxo-lib': { version: '11.0.0-beta.1010' },
      'node_modules/@bitgo/wasm-utxo': { version: '2.0.0' },
      'node_modules/some-pkg/node_modules/@bitgo/wasm-utxo': { version: '1.9.0' },
    });

    const report = await checkDuplicates(['@bitgo-beta/utxo-lib', '@bitgo/wasm-utxo'], tmpDir);
    assert.strictEqual(report.hasDuplicates, true);
    assert.strictEqual(report.details.get('@bitgo-beta/utxo-lib')!.length, 1);
    assert.strictEqual(report.details.get('@bitgo/wasm-utxo')!.length, 2);
  });
});
