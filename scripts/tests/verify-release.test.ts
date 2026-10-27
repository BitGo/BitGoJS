import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';

import { waitForPackageVersions, type PackageVersionWaitOptions } from '../../scripts/prepareRelease/distTags';
import {
  type PackageJson,
  type WorkspaceModule,
  isRecoverablePublishConflict,
  getDistTagsWithRetry,
  publishWithRecovery,
  propagateVersionToDependents,
  readPackageJson,
  settleInDependencyOrder,
  topoOrder,
  verifyPackage,
} from '../../scripts/verify-release';

/** A clock that only moves when the code under test sleeps, so waits cost no real time. */
function fakeClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (delayMs: number): Promise<void> => {
      time += delayMs;
    },
  };
}

/** Runs fn while capturing console.log lines; restores the original afterwards. */
async function captureConsoleLog<T>(fn: () => Promise<T>): Promise<{ lines: string[]; result: T }> {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.join(' '));
  };
  try {
    const result = await fn();
    return { lines, result };
  } finally {
    console.log = original;
  }
}

/** Creates a temp dir with a package.json and returns read/write handles on it. */
function makePackageDir(fields: Record<string, unknown>): {
  dir: string;
  read: () => Record<string, unknown>;
  write: (json: Record<string, unknown>) => void;
} {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-test-'));
  const write = (json: Record<string, unknown>) => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(json, null, 2) + '\n');
  };
  write(fields);
  return {
    dir,
    read: () => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')),
    write,
  };
}

describe('waitForPackageVersions', function () {
  const request = { name: '@bitgo-beta/sdk-core', version: '1.2.3-beta.4' };

  function waitOptions(overrides: Partial<PackageVersionWaitOptions>): PackageVersionWaitOptions {
    const clock = fakeClock();
    return { timeoutMs: 60_000, delayMs: 30_000, now: clock.now, sleep: clock.sleep, ...overrides };
  }

  it('returns nothing to do for an empty request list', async function () {
    const missing = await waitForPackageVersions([], waitOptions({}));
    assert.deepEqual(missing, []);
  });

  it('does not wait when every version is immediately visible', async function () {
    const sleeps: number[] = [];
    const checked: string[] = [];
    const missing = await waitForPackageVersions(
      [request],
      waitOptions({
        sleep: async (delayMs) => {
          sleeps.push(delayMs);
        },
        versionExists: async (name, version) => {
          checked.push(`${name}@${version}`);
          return true;
        },
      })
    );
    assert.deepEqual(missing, []);
    assert.deepEqual(sleeps, []);
    assert.deepEqual(checked, ['@bitgo-beta/sdk-core@1.2.3-beta.4']);
  });

  it('waits for a version that appears on a later check', async function () {
    let checks = 0;
    const missing = await waitForPackageVersions(
      [request],
      waitOptions({
        versionExists: async () => {
          checks += 1;
          return checks >= 3;
        },
      })
    );
    assert.deepEqual(missing, []);
    assert.equal(checks, 3);
  });

  it('returns the versions still missing when the time budget runs out', async function () {
    const other = { name: '@bitgo-beta/account-lib', version: '2.3.4-beta.5' };
    const missing = await waitForPackageVersions(
      [request, other],
      waitOptions({
        versionExists: async (name) => name === other.name,
      })
    );
    assert.deepEqual(missing, [request]);
  });

  it('degrades persistently failing registry checks to not-visible instead of aborting', async function () {
    const missing = await waitForPackageVersions(
      [request],
      waitOptions({
        timeoutMs: 300_000,
        versionExists: async () => {
          throw new Error('502 Bad Gateway');
        },
      })
    );
    assert.deepEqual(missing, [request]);
  });

  it('treats a single failing round as transient and keeps polling', async function () {
    let checks = 0;
    const missing = await waitForPackageVersions(
      [request],
      waitOptions({
        versionExists: async () => {
          checks += 1;
          if (checks === 1) throw new Error('502 Bad Gateway');
          return true;
        },
      })
    );
    assert.deepEqual(missing, []);
    assert.equal(checks, 2);
  });

  it('does not drop a package from the wait for scattered (non-consecutive) failures', async function () {
    // six errors, each separated by a round that resolved (even to not-visible):
    // only consecutive failures may count toward the drop-out cap
    const behavior: (boolean | 'error')[] = [
      'error',
      false,
      'error',
      false,
      'error',
      false,
      'error',
      false,
      'error',
      false,
      'error',
      true,
    ];
    let calls = 0;
    const missing = await waitForPackageVersions(
      [request],
      waitOptions({
        timeoutMs: 600_000,
        versionExists: async () => {
          const b = behavior[calls];
          calls += 1;
          if (b === 'error') throw new Error('502 Bad Gateway');
          return b;
        },
      })
    );
    assert.deepEqual(missing, []);
    assert.equal(calls, behavior.length);
  });
});

describe('getDistTagsWithRetry', function () {
  it('retries with backoff and succeeds once the read recovers', async function () {
    const sleeps: number[] = [];
    let calls = 0;
    const tags = await getDistTagsWithRetry(
      '@bitgo-beta/pkg',
      async () => {
        calls += 1;
        if (calls < 3) throw new Error('502 Bad Gateway');
        return { beta: '1.0.0-beta.1' };
      },
      3,
      5000,
      async (delayMs) => {
        sleeps.push(delayMs);
      }
    );
    assert.deepEqual(tags, { beta: '1.0.0-beta.1' });
    assert.equal(calls, 3);
    assert.deepEqual(sleeps, [5000, 5000]);
  });

  it('rethrows after exhausting the attempts', async function () {
    const sleeps: number[] = [];
    let calls = 0;
    await assert.rejects(
      () =>
        getDistTagsWithRetry(
          '@bitgo-beta/pkg',
          async () => {
            calls += 1;
            throw new Error('502 Bad Gateway');
          },
          3,
          5000,
          async (delayMs) => {
            sleeps.push(delayMs);
          }
        ),
      /502 Bad Gateway/
    );
    assert.equal(calls, 3);
    assert.deepEqual(sleeps, [5000, 5000]);
  });
});

describe('isRecoverablePublishConflict', function () {
  it('matches the sigstore transparency-log conflict', function () {
    assert.equal(
      isRecoverablePublishConflict(
        'npm error TLOG_CREATE_ENTRY_ERROR error creating tlog entry - (409) an equivalent entry already exists in the transparency log'
      ),
      true
    );
  });

  it('matches the staged-version and publish-over-published conflicts', function () {
    assert.equal(
      isRecoverablePublishConflict('npm error 403 You cannot publish over the previously staged version'),
      true
    );
    assert.equal(
      isRecoverablePublishConflict('npm error You cannot publish over the previously published versions 1.0.0'),
      true
    );
  });

  it('does not match unrelated failures', function () {
    assert.equal(isRecoverablePublishConflict('npm error 404 Not Found - PUT /x'), false);
    assert.equal(isRecoverablePublishConflict('network timeout'), false);
  });
});

describe('publishWithRecovery', function () {
  const preid = 'beta';
  const conflictError = (message: string) => {
    const e = new Error(message) as Error & { stdout?: string };
    e.stdout = message;
    return e;
  };
  const tlogConflict = conflictError(
    'npm error TLOG_CREATE_ENTRY_ERROR error creating tlog entry - (409) an equivalent entry already exists in the transparency log'
  );

  function makePackageDir(version: string): { dir: string; readVersion: () => string } {
    const pkg = makePkg({ name: '@bitgo-beta/sdk-test-pkg', version, private: false });
    return {
      dir: pkg.dir,
      readVersion: () => {
        const json = pkg.read();
        return typeof json.version === 'string' ? json.version : '';
      },
    };
  }

  function makePkg(fields: Record<string, unknown>) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-release-test-'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(fields, null, 2) + '\n');
    return {
      dir,
      read: () => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')),
    };
  }

  function recoveryOptions(overrides: Partial<Parameters<typeof publishWithRecovery>[3]> = {}) {
    const clock = fakeClock();
    return {
      runPublish: async () => '',
      versionExists: async () => true,
      sleep: clock.sleep,
      now: clock.now,
      conflictPollTimeoutMs: 60_000,
      ...overrides,
    };
  }

  it('returns success when the publish succeeds on the first attempt', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    let publishCalls = 0;
    const result = await publishWithRecovery(
      pkg.dir,
      readPackageJson(pkg.dir),
      preid,
      recoveryOptions({
        runPublish: async () => {
          publishCalls += 1;
          return 'published';
        },
      })
    );
    assert.equal(result.exitCode, 0);
    assert.equal(publishCalls, 1);
    assert.equal(pkg.readVersion(), '1.0.0-beta.1');
  });

  it('treats a conflict as success once the version shows up on npm', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    let publishCalls = 0;
    const result = await publishWithRecovery(
      pkg.dir,
      readPackageJson(pkg.dir),
      preid,
      recoveryOptions({
        runPublish: async () => {
          publishCalls += 1;
          throw tlogConflict;
        },
        versionExists: async () => true,
      })
    );
    assert.equal(result.exitCode, 0);
    assert.equal(publishCalls, 1);
    assert.equal(pkg.readVersion(), '1.0.0-beta.1');
  });

  it('bumps the version and retries when the version never becomes visible', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    const publishedVersions: string[] = [];
    let publishCalls = 0;
    const result = await publishWithRecovery(
      pkg.dir,
      readPackageJson(pkg.dir),
      preid,
      recoveryOptions({
        runPublish: async (_cwd, tag) => {
          publishCalls += 1;
          if (publishCalls === 1) {
            throw tlogConflict;
          }
          publishedVersions.push(tag);
          return 'published';
        },
        versionExists: async () => false,
      })
    );
    assert.equal(result.exitCode, 0);
    assert.equal(publishCalls, 2);
    assert.deepEqual(publishedVersions, [preid]);
    assert.equal(pkg.readVersion(), '1.0.0-beta.2');
  });

  it('skips the poll for staged-version conflicts and bumps straight away', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    let publishCalls = 0;
    let versionChecks = 0;
    const stagedConflict = conflictError(
      'npm error 403 You cannot publish over the previously staged version of @bitgo-beta/sdk-test-pkg'
    );
    const result = await publishWithRecovery(
      pkg.dir,
      readPackageJson(pkg.dir),
      preid,
      recoveryOptions({
        runPublish: async () => {
          publishCalls += 1;
          if (publishCalls === 1) {
            throw stagedConflict;
          }
          return 'published';
        },
        versionExists: async () => {
          versionChecks += 1;
          return false;
        },
      })
    );
    assert.equal(result.exitCode, 0);
    assert.equal(publishCalls, 2);
    assert.equal(versionChecks, 0, 'staged conflicts must skip the visibility poll');
    assert.equal(pkg.readVersion(), '1.0.0-beta.2');
  });

  it('bumps immediately on later attempts without polling again', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    let publishCalls = 0;
    let versionChecks = 0;
    await assert.rejects(
      () =>
        publishWithRecovery(
          pkg.dir,
          readPackageJson(pkg.dir),
          preid,
          recoveryOptions({
            runPublish: async () => {
              publishCalls += 1;
              throw tlogConflict;
            },
            versionExists: async () => {
              versionChecks += 1;
              return false;
            },
          })
        ),
      /still hitting a publish conflict after 5 version bumps/
    );
    // only the first attempt polls (60s budget / 30s delay = 3 checks); a fresh
    // bumped version cannot hit an equivalent-entry false negative, so later
    // attempts bump straight away
    assert.equal(versionChecks, 3);
    assert.equal(publishCalls, 5);
  });

  it('gives up after the maximum number of bumped attempts', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    const clock = fakeClock();
    let publishCalls = 0;
    await assert.rejects(
      () =>
        publishWithRecovery(
          pkg.dir,
          readPackageJson(pkg.dir),
          preid,
          recoveryOptions({
            runPublish: async () => {
              publishCalls += 1;
              throw tlogConflict;
            },
            versionExists: async () => false,
            sleep: clock.sleep,
            now: clock.now,
          })
        ),
      /still hitting a publish conflict after 5 version bumps/
    );
    assert.equal(publishCalls, 5);
    assert.equal(pkg.readVersion(), '1.0.0-beta.5');
  });

  it('throws immediately on non-conflict failures', async function () {
    const pkg = makePackageDir('1.0.0-beta.1');
    let publishCalls = 0;
    await assert.rejects(
      () =>
        publishWithRecovery(
          pkg.dir,
          readPackageJson(pkg.dir),
          preid,
          recoveryOptions({
            runPublish: async () => {
              publishCalls += 1;
              throw conflictError('npm error 404 Not Found');
            },
          })
        ),
      /404 Not Found/
    );
    assert.equal(publishCalls, 1);
    assert.equal(pkg.readVersion(), '1.0.0-beta.1');
  });
});

describe('topoOrder', function () {
  function module(
    dir: string,
    name: string,
    dependencies: Record<string, string>,
    privateField = false
  ): WorkspaceModule {
    return {
      dir,
      json: { name, version: '1.0.0-beta.1', private: privateField, dependencies },
    };
  }

  it('orders dependencies first with bitgo last', function () {
    const modules = [
      module('/w/bitgo', '@bitgo-beta/bitgo', {
        '@bitgo-beta/sdk-lib-a': '1.0.0-beta.1',
        '@bitgo-beta/sdk-coin-b': '1.0.0-beta.1',
      }),
      module('/w/sdk-coin-b', '@bitgo-beta/sdk-coin-b', { '@bitgo-beta/sdk-lib-a': '1.0.0-beta.1' }),
      module('/w/sdk-lib-a', '@bitgo-beta/sdk-lib-a', {}),
    ];
    const order = topoOrder(modules).map((m) => m.json.name);
    assert.deepEqual(order, ['@bitgo-beta/sdk-lib-a', '@bitgo-beta/sdk-coin-b', '@bitgo-beta/bitgo']);
  });

  it('excludes unpublished private modules but keeps bitgo', function () {
    const modules = [
      module('/w/bitgo', '@bitgo-beta/bitgo', { '@bitgo-beta/sdk-lib-a': '1.0.0-beta.1' }, true),
      module('/w/sdk-test', '@bitgo-beta/sdk-test', { '@bitgo-beta/sdk-lib-a': '1.0.0-beta.1' }, true),
      module('/w/sdk-lib-a', '@bitgo-beta/sdk-lib-a', {}),
    ];
    const order = topoOrder(modules).map((m) => m.json.name);
    assert.deepEqual(order, ['@bitgo-beta/sdk-lib-a', '@bitgo-beta/bitgo']);
  });

  it('throws on a dependency cycle', function () {
    const modules = [module('/w/a', '@x/a', { '@x/b': '1.0.0' }), module('/w/b', '@x/b', { '@x/a': '1.0.0' })];
    assert.throws(() => topoOrder(modules), /cycle/);
  });
});

describe('propagateVersionToDependents', function () {
  it('updates prod and dev pins but reports only prod-pin changers', function () {
    const prodDep = makePackageDir({
      name: '@bitgo-beta/sdk-coin-prod',
      version: '1.0.0-beta.1',
      dependencies: { '@bitgo-beta/sdk-lib-x': '1.0.0-beta.1' },
    });
    const devDep = makePackageDir({
      name: '@bitgo-beta/sdk-coin-dev',
      version: '1.0.0-beta.1',
      devDependencies: { '@bitgo-beta/sdk-lib-x': '1.0.0-beta.1' },
    });
    const unrelated = makePackageDir({ name: '@bitgo-beta/sdk-coin-y', version: '1.0.0-beta.1' });
    const modules: WorkspaceModule[] = [prodDep, devDep, unrelated].map((pkg) => ({
      dir: pkg.dir,
      json: readPackageJson(pkg.dir),
    }));

    const changed = propagateVersionToDependents(modules, '@bitgo-beta/sdk-lib-x', '1.0.0-beta.2');

    assert.deepEqual(changed, ['@bitgo-beta/sdk-coin-prod']);
    assert.equal(readPackageJson(prodDep.dir).dependencies?.['@bitgo-beta/sdk-lib-x'], '1.0.0-beta.2');
    assert.equal(readPackageJson(devDep.dir).devDependencies?.['@bitgo-beta/sdk-lib-x'], '1.0.0-beta.2');
    assert.equal(unrelated.read().dependencies, undefined);
  });

  it('does not mark a module dirty when only its dev pin changed', function () {
    const libX = makePackageDir({ name: '@bitgo-beta/sdk-lib-x2', version: '1.0.0-beta.1' });
    const bothPins = makePackageDir({
      name: '@bitgo-beta/sdk-coin-both',
      version: '1.0.0-beta.1',
      dependencies: { '@bitgo-beta/sdk-lib-x2': '1.0.0-beta.2' },
      devDependencies: { '@bitgo-beta/sdk-lib-x2': '1.0.0-beta.1' },
    });
    const modules: WorkspaceModule[] = [libX, bothPins].map((pkg) => ({
      dir: pkg.dir,
      json: readPackageJson(pkg.dir),
    }));

    const changed = propagateVersionToDependents(modules, '@bitgo-beta/sdk-lib-x2', '1.0.0-beta.2');

    // the prod pin already pointed at the new version, so only the dev pin was
    // rewritten — the module must not be flagged for a redundant republish
    assert.deepEqual(changed, []);
    assert.equal(readPackageJson(bothPins.dir).devDependencies?.['@bitgo-beta/sdk-lib-x2'], '1.0.0-beta.2');
  });
});

describe('verifyPackage', function () {
  function makeTarget(version: string) {
    return makePackageDir({ name: '@bitgo-beta/sdk-verify-target', version, private: false });
  }

  it('reports success without publishing when the version is on npm and pins are clean', async function () {
    const pkg = makeTarget('1.0.0-beta.1');
    let publishCalls = 0;
    const { lines, result } = await captureConsoleLog(() =>
      verifyPackage(pkg.dir, 'beta', false, {
        versionExists: async () => true,
        fetchDistTags: async () => ({ beta: '1.0.0-beta.1' }),
        runPublish: async () => {
          publishCalls += 1;
          return 'published';
        },
      })
    );
    assert.equal(result, true);
    assert.equal(publishCalls, 0);
    assert.ok(lines.includes('@bitgo-beta/sdk-verify-target matches expected version 1.0.0-beta.1'));
  });

  it('bumps and republishes a published package whose pins went dirty', async function () {
    const pkg = makeTarget('1.0.0-beta.1');
    let publishCalls = 0;
    const { lines, result } = await captureConsoleLog(() =>
      verifyPackage(pkg.dir, 'beta', true, {
        versionExists: async () => true,
        fetchDistTags: async () => ({ beta: '1.0.0-beta.1' }),
        runPublish: async () => {
          publishCalls += 1;
          return 'published';
        },
      })
    );
    assert.equal(result, true);
    assert.equal(publishCalls, 1);
    // canonical line must carry the FINAL (bumped) version for beta-tools
    assert.ok(lines.includes('@bitgo-beta/sdk-verify-target matches expected version 1.0.0-beta.2'));
    assert.equal(pkg.read().version, '1.0.0-beta.2');
  });

  it('bumps a dirty package even when the visibility read fails or lags', async function () {
    // regression: a failed or false visibility read used to skip the dirty
    // bump, republishing the stale version itself — the conflict poll then
    // saw it as published and the run went green shipping stale pins
    const pkg = makeTarget('1.0.0-beta.1');
    let publishCalls = 0;
    const { lines, result } = await captureConsoleLog(() =>
      verifyPackage(pkg.dir, 'beta', true, {
        versionExists: async () => {
          throw new Error('502 Bad Gateway');
        },
        fetchDistTags: async () => ({ beta: '1.0.0-beta.1' }),
        runPublish: async () => {
          publishCalls += 1;
          return 'published';
        },
      })
    );
    assert.equal(result, true);
    assert.equal(publishCalls, 1);
    assert.ok(lines.includes('@bitgo-beta/sdk-verify-target matches expected version 1.0.0-beta.2'));
    assert.equal(pkg.read().version, '1.0.0-beta.2');
  });

  it('publishes a missing package with a diagnostic', async function () {
    const pkg = makeTarget('1.0.0-beta.1');
    let publishCalls = 0;
    const { lines, result } = await captureConsoleLog(() =>
      verifyPackage(pkg.dir, 'beta', false, {
        versionExists: async () => false,
        fetchDistTags: async () => ({ beta: '0.9.9-beta.1' }),
        runPublish: async () => {
          publishCalls += 1;
          return 'published';
        },
      })
    );
    assert.equal(result, true);
    assert.equal(publishCalls, 1);
    assert.ok(lines.some((l) => l.includes('missing from npm')));
    assert.ok(lines.includes('@bitgo-beta/sdk-verify-target matches expected version 1.0.0-beta.1'));
  });

  it('skips unpublished private modules without any registry access', async function () {
    const pkg = makePackageDir({ name: '@bitgo-beta/sdk-test', version: '1.0.0-beta.1', private: true });
    let versionChecks = 0;
    const result = await verifyPackage(pkg.dir, 'beta', false, {
      versionExists: async () => {
        versionChecks += 1;
        return false;
      },
    });
    assert.equal(result, true);
    assert.equal(versionChecks, 0);
  });
});

describe('settleInDependencyOrder', function () {
  function makeChain(): { libB: string; coinA: string; bitgo: string } {
    const libB = makePackageDir({ name: '@bitgo-beta/sdk-lib-b', version: '1.0.0-beta.1' });
    const coinA = makePackageDir({
      name: '@bitgo-beta/sdk-coin-a',
      version: '1.0.0-beta.1',
      dependencies: { '@bitgo-beta/sdk-lib-b': '1.0.0-beta.1' },
    });
    const bitgo = makePackageDir({
      name: '@bitgo-beta/bitgo',
      version: '1.0.0-beta.1',
      dependencies: {
        '@bitgo-beta/sdk-lib-b': '1.0.0-beta.1',
        '@bitgo-beta/sdk-coin-a': '1.0.0-beta.1',
      },
    });
    return { libB: libB.dir, coinA: coinA.dir, bitgo: bitgo.dir };
  }

  it('settles a staged-conflict chain in one ordered pass', async function () {
    const chain = makeChain();
    const modules: WorkspaceModule[] = [chain.bitgo, chain.coinA, chain.libB].map((dir) => ({
      dir,
      json: readPackageJson(dir),
    }));
    const calls: Array<{ dir: string; pinsDirty: boolean }> = [];
    const bumpTo = (dir: string, version: string) => {
      const json = readPackageJson(dir);
      json.version = version;
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(json, null, 2) + '\n');
    };

    const anyFailed = await settleInDependencyOrder(modules, 'beta', {
      verifyPackage: async (dir, _preid, pinsDirty) => {
        calls.push({ dir, pinsDirty });
        // libB hits a staged-version conflict in its turn and recovers via a
        // bump; the dependents are then dirty and republish with final pins
        if (dir === chain.libB) {
          bumpTo(dir, '1.0.0-beta.2');
        } else if (dir === chain.coinA) {
          assert.equal(pinsDirty, true, 'coinA must be dirty after libB settled');
          bumpTo(dir, '1.0.0-beta.2');
        } else if (dir === chain.bitgo) {
          assert.equal(pinsDirty, true, 'bitgo must be dirty after coinA settled');
          bumpTo(dir, '1.0.0-beta.2');
        }
        return true;
      },
    });

    assert.equal(anyFailed, false);
    // dependency-first order with bitgo last
    assert.deepEqual(
      calls.map((c) => c.dir),
      [chain.libB, chain.coinA, chain.bitgo]
    );
    assert.deepEqual(
      calls.map((c) => c.pinsDirty),
      [false, true, true]
    );
    // every dependent's pins were propagated before its own turn
    assert.equal(readPackageJson(chain.coinA).dependencies?.['@bitgo-beta/sdk-lib-b'], '1.0.0-beta.2');
    const bitgoDeps = readPackageJson(chain.bitgo).dependencies;
    assert.equal(bitgoDeps?.['@bitgo-beta/sdk-lib-b'], '1.0.0-beta.2');
    assert.equal(bitgoDeps?.['@bitgo-beta/sdk-coin-a'], '1.0.0-beta.2');
  });

  it('stops at the first failed package in fail-fast mode', async function () {
    const chain = makeChain();
    const modules: WorkspaceModule[] = [chain.bitgo, chain.coinA, chain.libB].map((dir) => ({
      dir,
      json: readPackageJson(dir),
    }));
    const calls: string[] = [];
    const anyFailed = await settleInDependencyOrder(modules, 'beta', {
      failFast: true,
      verifyPackage: async (dir) => {
        calls.push(dir);
        return false;
      },
    });
    assert.equal(anyFailed, true);
    // only the deepest dependency was attempted before aborting
    assert.deepEqual(calls, [chain.libB]);
  });

  it('blocks dependents of a failed package instead of publishing broken pins', async function () {
    // npm is append-only: a red run must not publish a dependent pinning a
    // version that never settled, or the broken artifact stays live after the run
    const chain = makeChain();
    const modules: WorkspaceModule[] = [chain.bitgo, chain.coinA, chain.libB].map((dir) => ({
      dir,
      json: readPackageJson(dir),
    }));
    const calls: string[] = [];
    const anyFailed = await settleInDependencyOrder(modules, 'beta', {
      verifyPackage: async (dir) => {
        calls.push(dir);
        // the deepest dependency fails to publish; its dependents must never be
        // attempted, transitively up to bitgo
        return dir !== chain.libB;
      },
    });
    assert.equal(anyFailed, true);
    assert.deepEqual(calls, [chain.libB]);
    // nothing was published downstream, so no dependent pins an unsettled version
    assert.equal(readPackageJson(chain.coinA).version, '1.0.0-beta.1');
    assert.equal(readPackageJson(chain.bitgo).version, '1.0.0-beta.1');
  });

  it('blocks transitively through an intermediate dependent', async function () {
    const chain = makeChain();
    const modules: WorkspaceModule[] = [chain.bitgo, chain.coinA, chain.libB].map((dir) => ({
      dir,
      json: readPackageJson(dir),
    }));
    const calls: string[] = [];
    const anyFailed = await settleInDependencyOrder(modules, 'beta', {
      verifyPackage: async (dir) => {
        calls.push(dir);
        // coinA fails after libB succeeded; bitgo (depends on coinA) must be skipped
        return dir !== chain.coinA;
      },
    });
    assert.equal(anyFailed, true);
    assert.deepEqual(calls, [chain.libB, chain.coinA]);
    assert.equal(readPackageJson(chain.bitgo).version, '1.0.0-beta.1');
  });
});
