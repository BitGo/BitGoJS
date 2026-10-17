import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';

import {
  getVisibilityTimeoutMs,
  isRecoverablePublishConflict,
  verify,
  verifyPackage,
  waitForVersionInfo,
  type VerifyDeps,
  type VersionInfo,
} from '../../scripts/verify-release';

/** A clock that only moves when the code under test sleeps, so polling costs no real time. */
function fakeClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (delayMs: number) => {
      time += delayMs;
    },
  };
}

function makeDeps(overrides: Partial<VerifyDeps> = {}) {
  const clock = fakeClock();
  const base: VerifyDeps = {
    fetchVersionInfo: async () => ({ found: true, hasShrinkwrap: true }),
    publish: async () => ({ stdout: 'published' }),
    sleep: clock.sleep,
    now: clock.now,
    getDistTags: async () => ({}),
    getLernaModules: async () => [],
    visibilityTimeoutMs: 60 * 60_000,
    visibilityDelayMs: 30_000,
  };
  return { deps: { ...base, ...overrides }, clock };
}

function tempModule(name: string, version: string, dirName = 'module'): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-'));
  const dir = path.join(root, dirName);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }, null, 2) + '\n');
  return dir;
}

function readVersion(dir: string): string {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')).version;
}

function publishOverError(name: string, version: string): Error {
  return Object.assign(new Error('execa: Command failed with exit code 1: npm publish'), {
    stdout: '',
    stderr:
      `npm error code E403\n` +
      `npm error 403 403 Forbidden - PUT https://registry.npmjs.org/${name.replace('/', '%2f')}\n` +
      `npm error 403 You cannot publish over the previously published versions: ${version}.`,
  });
}

describe('verify-release publish conflict classification', function () {
  it('classifies the Rekor duplicate-provenance conflict', function () {
    assert.equal(isRecoverablePublishConflict('lerna ERR! TLOG_CREATE_ENTRY_ERROR error creating tlog entry'), true);
  });

  it('classifies a 409 transparency-log conflict', function () {
    assert.equal(
      isRecoverablePublishConflict('Error: (409) an equivalent entry already exists in the transparency log'),
      true
    );
    assert.equal(isRecoverablePublishConflict('409 Conflict while writing to the transparency log'), true);
  });

  it('classifies a previously-staged-version conflict', function () {
    assert.equal(isRecoverablePublishConflict('You cannot publish over a previously staged version'), true);
  });

  it('classifies npm publish-over failures', function () {
    const output =
      'npm error code E403\n' +
      'npm error 403 You cannot publish over the previously published versions: 1.0.0-beta.1708.';
    assert.equal(isRecoverablePublishConflict(output), true);
    assert.equal(isRecoverablePublishConflict('npm ERR! code EPUBLISHCONFLICT'), true);
  });

  it('does not classify unrelated publish failures as recoverable', function () {
    assert.equal(isRecoverablePublishConflict('npm error code E401 Unable to authenticate'), false);
    assert.equal(isRecoverablePublishConflict('ENOSPC no space left on device'), false);
  });
});

describe('verify-release visibility budget', function () {
  it('defaults to one hour when unset', function () {
    assert.equal(getVisibilityTimeoutMs({}), 60 * 60_000);
  });

  it('reads the budget from the environment', function () {
    assert.equal(getVisibilityTimeoutMs({ BITGO_PUBLISH_VISIBILITY_TIMEOUT_MINUTES: '15' }), 15 * 60_000);
  });

  it('rejects an invalid budget', function () {
    assert.throws(() => getVisibilityTimeoutMs({ BITGO_PUBLISH_VISIBILITY_TIMEOUT_MINUTES: 'soon' }));
    assert.throws(() => getVisibilityTimeoutMs({ BITGO_PUBLISH_VISIBILITY_TIMEOUT_MINUTES: '-1' }));
  });
});

describe('waitForVersionInfo', function () {
  it('returns immediately when the version is already visible', async function () {
    const { deps } = makeDeps();
    let fetches = 0;
    let sleeps = 0;

    const info = await waitForVersionInfo('@bitgo-beta/sdk-core', '1.2.3-beta.4', {
      ...deps,
      fetchVersionInfo: async () => {
        fetches += 1;
        return { found: true, hasShrinkwrap: true };
      },
      sleep: async () => {
        sleeps += 1;
      },
    });

    assert.deepEqual(info, { found: true, hasShrinkwrap: true });
    assert.equal(fetches, 1);
    assert.equal(sleeps, 0);
  });

  it('polls until the version appears, as npm publish-time processing resolves', async function () {
    const { deps } = makeDeps();
    let fetches = 0;
    const sleeps: number[] = [];

    const info = await waitForVersionInfo('@bitgo-beta/sdk-coin-tao', '1.0.0-beta.1477', {
      ...deps,
      fetchVersionInfo: async () => {
        fetches += 1;
        return { found: fetches >= 3, hasShrinkwrap: true };
      },
      sleep: async (delayMs) => {
        sleeps.push(delayMs);
      },
    });

    assert.equal(info.found, true);
    assert.equal(fetches, 3);
    assert.deepEqual(sleeps, [30_000, 30_000]);
  });

  it('gives up at the budget and reports the version as not visible', async function () {
    const { deps } = makeDeps({ visibilityTimeoutMs: 2 * 60_000 });
    let fetches = 0;

    const info = await waitForVersionInfo('@bitgo-beta/sdk-coin-tao', '1.0.0-beta.1477', {
      ...deps,
      fetchVersionInfo: async (): Promise<VersionInfo> => {
        fetches += 1;
        return { found: false, hasShrinkwrap: false };
      },
    });

    assert.equal(info.found, false);
    // 2 minute budget at a 30s delay: checks at 0s, 30s, 60s, 90s and 120s; the 120s check exhausts
    // the budget (there is no room left for another sleep).
    assert.equal(fetches, 5);
  });
});

describe('verifyPackage reconciliation', function () {
  it('treats an already-published version as done without publishing it again', async function () {
    const dir = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4');
    const published: string[] = [];
    const { deps } = makeDeps({
      publish: async (cwd) => {
        published.push(cwd);
        return { stdout: '' };
      },
      getDistTags: async () => ({ beta: '1.2.3-beta.4' }),
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
    assert.deepEqual(published, []);
  });

  it('warns but does not fail when the dist-tag has not moved to the published version', async function () {
    const dir = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4');
    const { deps } = makeDeps({ getDistTags: async () => ({ beta: '1.2.3-beta.3' }) });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
  });

  it('publishes a missing version and accepts it once the registry serves it', async function () {
    const dir = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4');
    const published: string[] = [];
    let visible = false;
    const { deps } = makeDeps({
      fetchVersionInfo: async () => ({ found: visible, hasShrinkwrap: true }),
      publish: async () => {
        published.push('publish');
        visible = true;
        return { stdout: '' };
      },
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
    assert.deepEqual(published, ['publish']);
  });

  it('reconciles an npm publish-over conflict instead of bumping the version', async function () {
    const dir = tempModule('@bitgo-beta/sdk-opensslbytes', '1.0.0-beta.1708');
    let visible = false;
    let publishCalls = 0;
    const { deps } = makeDeps({
      fetchVersionInfo: async () => ({ found: visible, hasShrinkwrap: true }),
      publish: async () => {
        publishCalls += 1;
        // The registry already holds this exact version, so npm refuses the upload; the version
        // becomes visible on the next read (lag), which is what the reconcile path waits for.
        visible = true;
        throw publishOverError('@bitgo-beta/sdk-opensslbytes', '1.0.0-beta.1708');
      },
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
    assert.equal(publishCalls, 1);
    // The version must not be bumped: the release's own version is already published.
    assert.equal(readVersion(dir), '1.0.0-beta.1708');
  });

  it('fails the package when publish reports success but the version never becomes visible', async function () {
    const dir = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4');
    const { deps } = makeDeps({
      visibilityTimeoutMs: 0,
      fetchVersionInfo: async () => ({ found: false, hasShrinkwrap: false }),
      publish: async () => ({ stdout: '' }),
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), false);
  });

  it('fails the package on an unrelated publish error', async function () {
    const dir = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4');
    const { deps } = makeDeps({
      fetchVersionInfo: async () => ({ found: false, hasShrinkwrap: false }),
      publish: async () => {
        throw Object.assign(new Error('npm publish failed'), { stderr: 'npm error code E401' });
      },
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), false);
  });

  it('accepts a bitgo version only when it carries shrinkwrap metadata', async function () {
    const dir = tempModule('@bitgo-beta/bitgo', '14.2.1-beta.2203', 'bitgo');
    const { deps } = makeDeps({
      fetchVersionInfo: async () => ({ found: true, hasShrinkwrap: true }),
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
  });

  it('re-publishes a bitgo version that is on npm without shrinkwrap metadata', async function () {
    const dir = tempModule('@bitgo-beta/bitgo', '14.2.1-beta.2203', 'bitgo');
    let published = false;
    const { deps } = makeDeps({
      fetchVersionInfo: async () => ({ found: true, hasShrinkwrap: published }),
      publish: async () => {
        published = true;
        return { stdout: '' };
      },
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
    assert.equal(published, true);
  });

  it('skips private modules other than bitgo', async function () {
    const dir = tempModule('@bitgo-beta/private-tool', '1.0.0', 'private-tool');
    const pkgPath = path.join(dir, 'package.json');
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({ name: '@bitgo-beta/private-tool', version: '1.0.0', private: true }, null, 2) + '\n'
    );

    const { deps } = makeDeps({
      fetchVersionInfo: async () => {
        throw new Error('should not be queried');
      },
    });

    assert.equal(await verifyPackage(dir, 'beta', deps), true);
  });
});

describe('verify fail-closed behaviour', function () {
  it('fails the run when a package could not be published, in normal mode too', async function () {
    const good = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4', 'sdk-core');
    const bad = tempModule('@bitgo-beta/sdk-coin-tao', '1.0.0-beta.1477', 'sdk-coin-tao');
    const previousExitCode = process.exitCode;

    try {
      process.exitCode = undefined;
      const { deps } = makeDeps({
        getLernaModules: async () => [{ location: good }, { location: bad }],
        fetchVersionInfo: async (name: string) => ({
          found: name === '@bitgo-beta/sdk-core',
          hasShrinkwrap: true,
        }),
        publish: async () => {
          throw Object.assign(new Error('npm publish failed'), { stderr: 'npm error code E401' });
        },
      });

      const failed = await verify('beta', deps);

      assert.deepEqual(failed, ['sdk-coin-tao']);
      assert.equal(process.exitCode, 1);
    } finally {
      process.exitCode = previousExitCode;
    }
  });

  it('reports no failures and leaves the exit code untouched when everything is published', async function () {
    const dir = tempModule('@bitgo-beta/sdk-core', '1.2.3-beta.4', 'sdk-core');
    const previousExitCode = process.exitCode;

    try {
      process.exitCode = undefined;
      const { deps } = makeDeps({ getLernaModules: async () => [{ location: dir }] });

      const failed = await verify('beta', deps);

      assert.deepEqual(failed, []);
      assert.equal(process.exitCode, undefined);
    } finally {
      process.exitCode = previousExitCode;
    }
  });
});
