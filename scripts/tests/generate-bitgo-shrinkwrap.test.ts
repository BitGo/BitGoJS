import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';

import {
  ensureWorkspaceSiblingVersionsAvailable,
  getSiblingAvailabilityTimeoutMs,
  getWorkspacePackageVersions,
  getWorkspaceSiblingDependencies,
  type WorkspaceSibling,
} from '../../scripts/generate-bitgo-shrinkwrap';

const sibling: WorkspaceSibling = { name: '@bitgo-beta/sdk-core', version: '1.2.3-beta.4' };

function response(status: number, statusText?: string) {
  return { status, statusText };
}

/** A clock that only moves when the code under test sleeps, so waits cost no real time. */
function fakeClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (delayMs: number) => {
      time += delayMs;
    },
  };
}

describe('generate-bitgo-shrinkwrap workspace sibling availability', function () {
  it('checks exact scoped package versions and does not wait when all are available', async function () {
    const secondSibling: WorkspaceSibling = { name: '@bitgo-beta/account-lib', version: '2.3.4-beta.5' };
    const requests: string[] = [];
    const sleeps: number[] = [];

    await ensureWorkspaceSiblingVersionsAvailable([sibling, secondSibling], {
      registryFetcher: async (url) => {
        requests.push(url);
        return response(200);
      },
      sleep: async (delayMs) => {
        sleeps.push(delayMs);
      },
    });

    assert.deepEqual(
      requests.sort(),
      [
        'https://registry.npmjs.org/%40bitgo-beta%2Fsdk-core/1.2.3-beta.4',
        'https://registry.npmjs.org/%40bitgo-beta%2Faccount-lib/2.3.4-beta.5',
      ].sort()
    );
    assert.deepEqual(sleeps, []);
  });

  it('waits once when a sibling becomes available on the second check', async function () {
    let requests = 0;
    const sleeps: number[] = [];

    await ensureWorkspaceSiblingVersionsAvailable([sibling], {
      registryFetcher: async () => {
        requests += 1;
        return response(requests === 1 ? 404 : 200, requests === 1 ? 'Not Found' : 'OK');
      },
      sleep: async (delayMs) => {
        sleeps.push(delayMs);
      },
    });

    assert.equal(requests, 2);
    assert.deepEqual(sleeps, [30_000]);
  });

  it('waits twice when a sibling becomes available on the third check', async function () {
    let requests = 0;
    const sleeps: number[] = [];

    await ensureWorkspaceSiblingVersionsAvailable([sibling], {
      registryFetcher: async () => {
        requests += 1;
        return response(requests < 3 ? 404 : 200, requests < 3 ? 'Not Found' : 'OK');
      },
      sleep: async (delayMs) => {
        sleeps.push(delayMs);
      },
    });

    assert.equal(requests, 3);
    assert.deepEqual(sleeps, [30_000, 30_000]);
  });

  it('only re-checks siblings that were missing on the previous check', async function () {
    const secondSibling: WorkspaceSibling = { name: '@bitgo-beta/account-lib', version: '2.3.4-beta.5' };
    const clock = fakeClock();
    const requestsByCheck: string[][] = [[]];
    let accountLibRequests = 0;

    await ensureWorkspaceSiblingVersionsAvailable([sibling, secondSibling], {
      registryFetcher: async (url) => {
        requestsByCheck[requestsByCheck.length - 1].push(url);
        if (!url.includes('account-lib')) return response(200);
        accountLibRequests += 1;
        return response(accountLibRequests < 3 ? 404 : 200);
      },
      now: clock.now,
      sleep: async (delayMs) => {
        await clock.sleep(delayMs);
        requestsByCheck.push([]);
      },
    });

    const accountLibUrl = 'https://registry.npmjs.org/%40bitgo-beta%2Faccount-lib/2.3.4-beta.5';
    assert.equal(requestsByCheck.length, 3);
    assert.equal(requestsByCheck[0].length, 2);
    assert.deepEqual(requestsByCheck[1], [accountLibUrl]);
    assert.deepEqual(requestsByCheck[2], [accountLibUrl]);
  });

  it('keeps waiting past the old three-check limit until the sibling appears', async function () {
    const clock = fakeClock();
    let requests = 0;

    await ensureWorkspaceSiblingVersionsAvailable([sibling], {
      registryFetcher: async () => {
        requests += 1;
        return response(requests < 11 ? 404 : 200, requests < 11 ? 'Not Found' : 'OK');
      },
      now: clock.now,
      sleep: clock.sleep,
      timeoutMs: 30 * 60_000,
    });

    assert.equal(requests, 11);
    assert.equal(clock.now(), 10 * 30_000);
  });

  it('stops after the time budget and reports every missing version', async function () {
    const secondSibling: WorkspaceSibling = { name: '@bitgo-beta/account-lib', version: '2.3.4-beta.5' };
    const clock = fakeClock();
    let requests = 0;

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling, secondSibling], {
          registryFetcher: async () => {
            requests += 1;
            return response(404, 'Not Found');
          },
          now: clock.now,
          sleep: clock.sleep,
          timeoutMs: 90_000,
        }),
      (error: Error) => {
        assert.match(error.message, /still unavailable from npm after 4 checks over 1\.5 min/);
        assert.match(error.message, /@bitgo-beta\/sdk-core@1\.2\.3-beta\.4/);
        assert.match(error.message, /@bitgo-beta\/account-lib@2\.3\.4-beta\.5/);
        assert.match(error.message, /recovery mode/);
        return true;
      }
    );

    assert.equal(requests, 8);
    assert.equal(clock.now(), 90_000);
  });

  it('checks once and does not wait when the time budget is zero', async function () {
    let requests = 0;
    const sleeps: number[] = [];

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling], {
          registryFetcher: async () => {
            requests += 1;
            return response(404, 'Not Found');
          },
          sleep: async (delayMs) => {
            sleeps.push(delayMs);
          },
          timeoutMs: 0,
        }),
      /still unavailable from npm after 1 checks/
    );

    assert.equal(requests, 1);
    assert.deepEqual(sleeps, []);
  });

  it('keeps waiting through transient registry errors', async function () {
    const clock = fakeClock();
    let requests = 0;

    await ensureWorkspaceSiblingVersionsAvailable([sibling], {
      registryFetcher: async () => {
        requests += 1;
        if (requests === 1) throw new Error('connection reset');
        if (requests === 2) return response(503, 'Service Unavailable');
        return response(200, 'OK');
      },
      now: clock.now,
      sleep: clock.sleep,
      timeoutMs: 10 * 60_000,
    });

    assert.equal(requests, 3);
    assert.equal(clock.now(), 2 * 30_000);
  });

  it('gives up after repeated transient registry errors', async function () {
    const clock = fakeClock();
    let requests = 0;

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling], {
          registryFetcher: async () => {
            requests += 1;
            throw new Error('connection reset');
          },
          now: clock.now,
          sleep: clock.sleep,
          timeoutMs: 60 * 60_000,
        }),
      /connection reset/
    );

    assert.equal(requests, 6);
    assert.equal(clock.now(), 5 * 30_000);
  });

  it('reports the registry error when the budget runs out before any check succeeds', async function () {
    const clock = fakeClock();
    let requests = 0;

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling], {
          registryFetcher: async () => {
            requests += 1;
            throw new Error('connection reset');
          },
          now: clock.now,
          sleep: clock.sleep,
          timeoutMs: 60_000,
        }),
      /connection reset/
    );

    assert.equal(requests, 3);
  });

  it('surfaces registry responses that are not transient without retrying them', async function () {
    let requests = 0;
    const sleeps: number[] = [];

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling], {
          registryFetcher: async () => {
            requests += 1;
            return response(403, 'Forbidden');
          },
          sleep: async (delayMs) => {
            sleeps.push(delayMs);
          },
        }),
      /HTTP 403 Forbidden/
    );

    assert.equal(requests, 1);
    assert.deepEqual(sleeps, []);
  });

  it('reads the wait budget from the environment', function () {
    const envVar = 'BITGO_SIBLING_AVAILABILITY_TIMEOUT_MINUTES';

    assert.equal(getSiblingAvailabilityTimeoutMs({}), 20 * 60_000);
    assert.equal(getSiblingAvailabilityTimeoutMs({ [envVar]: '  ' }), 20 * 60_000);
    assert.equal(getSiblingAvailabilityTimeoutMs({ [envVar]: '90' }), 90 * 60_000);
    assert.equal(getSiblingAvailabilityTimeoutMs({ [envVar]: '0' }), 0);
    assert.throws(() => getSiblingAvailabilityTimeoutMs({ [envVar]: 'abc' }), /must be zero or more minutes/);
    assert.throws(() => getSiblingAvailabilityTimeoutMs({ [envVar]: '-5' }), /must be zero or more minutes/);
  });

  it('uses package names and versions from workspace manifests', function () {
    const modulesDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bitgo-workspace-packages-'));
    try {
      const packageDirectory = path.join(modulesDirectory, 'sdk-core');
      fs.mkdirSync(packageDirectory);
      fs.writeFileSync(
        path.join(packageDirectory, 'package.json'),
        JSON.stringify({ name: '@bitgo-beta/sdk-core', version: '9.8.7-beta.6' })
      );

      const versions = getWorkspacePackageVersions(modulesDirectory);
      const siblings = getWorkspaceSiblingDependencies({ '@bitgo-beta/sdk-core': '^9.8.7-beta.6' }, versions);

      assert.deepEqual(siblings, [{ name: '@bitgo-beta/sdk-core', version: '9.8.7-beta.6' }]);
    } finally {
      fs.rmSync(modulesDirectory, { recursive: true, force: true });
    }
  });

  it('skips the guard when there are no workspace siblings', async function () {
    let requests = 0;

    await ensureWorkspaceSiblingVersionsAvailable([], {
      registryFetcher: async () => {
        requests += 1;
        return response(200);
      },
    });

    assert.equal(requests, 0);
  });
});
