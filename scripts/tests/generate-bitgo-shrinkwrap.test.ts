import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'mocha';

import {
  ensureWorkspaceSiblingVersionsAvailable,
  getWorkspacePackageVersions,
  getWorkspaceSiblingDependencies,
  type WorkspaceSibling,
} from '../../scripts/generate-bitgo-shrinkwrap';

const sibling: WorkspaceSibling = { name: '@bitgo-beta/sdk-core', version: '1.2.3-beta.4' };

function response(status: number, statusText?: string) {
  return { status, statusText };
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

  it('performs three checks and reports every missing version', async function () {
    const secondSibling: WorkspaceSibling = { name: '@bitgo-beta/account-lib', version: '2.3.4-beta.5' };
    let requests = 0;
    const sleeps: number[] = [];

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling, secondSibling], {
          registryFetcher: async () => {
            requests += 1;
            return response(404, 'Not Found');
          },
          sleep: async (delayMs) => {
            sleeps.push(delayMs);
          },
        }),
      (error: Error) => {
        assert.match(error.message, /@bitgo-beta\/sdk-core@1\.2\.3-beta\.4/);
        assert.match(error.message, /@bitgo-beta\/account-lib@2\.3\.4-beta\.5/);
        assert.match(error.message, /recovery mode/);
        return true;
      }
    );

    assert.equal(requests, 6);
    assert.deepEqual(sleeps, [30_000, 30_000]);
  });

  it('surfaces unexpected registry responses without retrying them', async function () {
    let requests = 0;
    const sleeps: number[] = [];

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling], {
          registryFetcher: async () => {
            requests += 1;
            return response(500, 'Internal Server Error');
          },
          sleep: async (delayMs) => {
            sleeps.push(delayMs);
          },
        }),
      /HTTP 500 Internal Server Error/
    );

    assert.equal(requests, 1);
    assert.deepEqual(sleeps, []);
  });

  it('surfaces network errors without retrying them', async function () {
    let requests = 0;
    const sleeps: number[] = [];

    await assert.rejects(
      () =>
        ensureWorkspaceSiblingVersionsAvailable([sibling], {
          registryFetcher: async () => {
            requests += 1;
            throw new Error('connection reset');
          },
          sleep: async (delayMs) => {
            sleeps.push(delayMs);
          },
        }),
      /connection reset/
    );

    assert.equal(requests, 1);
    assert.deepEqual(sleeps, []);
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
