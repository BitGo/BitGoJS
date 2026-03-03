import assert from 'assert';
import { writeFileSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';

import { detectPackageManager } from '../src/packageManager';

describe('detectPackageManager', function () {
  it('detects npm from package-lock.json', function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeFileSync(path.join(tmpDir, 'package-lock.json'), '{}');
    assert.strictEqual(detectPackageManager(tmpDir), 'npm');
  });

  it('detects yarn from yarn.lock', function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
    assert.strictEqual(detectPackageManager(tmpDir), 'yarn');
  });

  it('detects pnpm from pnpm-lock.yaml', function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    assert.strictEqual(detectPackageManager(tmpDir), 'pnpm');
  });

  it('prefers pnpm when multiple lockfiles exist', function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    writeFileSync(path.join(tmpDir, 'yarn.lock'), '');
    writeFileSync(path.join(tmpDir, 'package-lock.json'), '{}');
    assert.strictEqual(detectPackageManager(tmpDir), 'pnpm');
  });

  it('throws when no lockfile found', function () {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
    assert.throws(() => detectPackageManager(tmpDir), /Could not detect package manager/);
  });
});
