import assert from 'assert';
import { writeFileSync, mkdtempSync } from 'fs';
import path from 'path';
import os from 'os';
import sinon from 'sinon';

import { resolveVersions } from '../src/resolveVersions';

const SCOPE = '@bitgo-beta';
const REGISTRY = 'https://registry.npmjs.org';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function failResponse(status = 404): Response {
  return new Response('Not Found', { status, statusText: 'Not Found' });
}

describe('resolveVersions', function () {
  let fetchStub: sinon.SinonStub;

  beforeEach(function () {
    fetchStub = sinon.stub(global, 'fetch');
    // Default: reject unknown requests
    fetchStub.rejects(new Error('Unexpected fetch call'));
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('megapackage strategy (default)', function () {
    it('resolves versions from the megapackage dependencies', async function () {
      fetchStub.withArgs(`${REGISTRY}/@bitgo-beta/bitgo/beta`).resolves(
        jsonResponse({
          version: '14.2.1-beta.1823',
          dependencies: {
            '@bitgo-beta/sdk-core': '8.2.1-beta.1613',
            '@bitgo-beta/statics': '15.1.1-beta.1616',
            '@bitgo-beta/utxo-lib': '8.0.3-beta.1615',
          },
        })
      );

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/statics'],
        tag: 'beta',
        scope: SCOPE,
      });

      assert.strictEqual(result.versions.get('@bitgo-beta/sdk-core'), '8.2.1-beta.1613');
      assert.strictEqual(result.versions.get('@bitgo-beta/statics'), '15.1.1-beta.1616');
      assert.strictEqual(result.versions.size, 2);
    });

    it('falls back to dist-tags for packages not in the megapackage', async function () {
      fetchStub.withArgs(`${REGISTRY}/@bitgo-beta/bitgo/beta`).resolves(
        jsonResponse({
          version: '14.2.1-beta.1823',
          dependencies: {
            '@bitgo-beta/sdk-core': '8.2.1-beta.1613',
          },
        })
      );
      fetchStub
        .withArgs(`${REGISTRY}/-/package/@bitgo-beta/abstract-cosmos/dist-tags`)
        .resolves(jsonResponse({ beta: '1.0.1-beta.500', latest: '1.0.0' }));

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/abstract-cosmos'],
        tag: 'beta',
        scope: SCOPE,
      });

      assert.strictEqual(result.versions.get('@bitgo-beta/sdk-core'), '8.2.1-beta.1613');
      assert.strictEqual(result.versions.get('@bitgo-beta/abstract-cosmos'), '1.0.1-beta.500');
    });

    it('falls back entirely to dist-tags if megapackage fetch fails', async function () {
      fetchStub.withArgs(`${REGISTRY}/@bitgo-beta/bitgo/beta`).resolves(failResponse());
      fetchStub
        .withArgs(`${REGISTRY}/-/package/@bitgo-beta/sdk-core/dist-tags`)
        .resolves(jsonResponse({ beta: '8.2.1-beta.1613', latest: '8.2.0' }));

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core'],
        tag: 'beta',
        scope: SCOPE,
      });

      assert.strictEqual(result.versions.get('@bitgo-beta/sdk-core'), '8.2.1-beta.1613');
    });

    it('skips packages with no dist-tag and not in megapackage', async function () {
      fetchStub.withArgs(`${REGISTRY}/@bitgo-beta/bitgo/beta`).resolves(
        jsonResponse({
          version: '14.2.1-beta.1823',
          dependencies: { '@bitgo-beta/sdk-core': '8.2.1-beta.1613' },
        })
      );
      fetchStub.withArgs(`${REGISTRY}/-/package/@bitgo-beta/missing/dist-tags`).resolves(failResponse());

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/missing'],
        tag: 'beta',
        scope: SCOPE,
      });

      assert.strictEqual(result.versions.size, 1);
      assert.strictEqual(result.versions.has('@bitgo-beta/missing'), false);
    });
  });

  describe('GitHub Actions strategy', function () {
    const VERIFY_LOGS = [
      '2026-02-25T13:05:23.0000000Z @bitgo-beta/sdk-core matches expected version 8.2.1-beta.1613',
      '2026-02-25T13:05:23.1000000Z @bitgo-beta/statics matches expected version 15.1.1-beta.1616',
      '2026-02-25T13:05:23.2000000Z @bitgo-beta/utxo-lib matches expected version 8.0.3-beta.1615',
    ].join('\n');

    function stubGitHubApi(): void {
      fetchStub.withArgs(sinon.match(/workflows\/publish.yml\/runs/)).resolves(
        jsonResponse({
          workflow_runs: [{ id: 99, created_at: '2026-02-25T12:47:06Z', head_sha: 'abc123' }],
        })
      );
      fetchStub
        .withArgs(sinon.match(/actions\/runs\/99\/jobs/))
        .resolves(jsonResponse({ jobs: [{ id: 555, name: 'Publish Release' }] }));
      fetchStub.withArgs(sinon.match(/actions\/jobs\/555\/logs/)).resolves(new Response(VERIFY_LOGS, { status: 200 }));
    }

    it('resolves versions from publish run logs when githubToken is set', async function () {
      stubGitHubApi();

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/statics'],
        tag: 'beta',
        scope: SCOPE,
        githubToken: 'ghp_test',
      });

      assert.strictEqual(result.versions.get('@bitgo-beta/sdk-core'), '8.2.1-beta.1613');
      assert.strictEqual(result.versions.get('@bitgo-beta/statics'), '15.1.1-beta.1616');
      assert.strictEqual(result.versions.size, 2);
      // Verify it called GitHub, not npm registry
      assert.ok(fetchStub.calledWith(sinon.match(/^https:\/\/api\.github\.com\//)));
      assert.ok(!fetchStub.calledWith(sinon.match(/^https:\/\/registry\.npmjs\.org\//)));
    });

    it('warns about packages not in the publish run', async function () {
      stubGitHubApi();

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/nonexistent'],
        tag: 'beta',
        scope: SCOPE,
        githubToken: 'ghp_test',
      });

      assert.strictEqual(result.versions.size, 1);
      assert.strictEqual(result.versions.has('@bitgo-beta/nonexistent'), false);
    });

    it('throws when GitHub API fails (does not fall back to registry)', async function () {
      fetchStub
        .withArgs(sinon.match(/workflows\/publish.yml\/runs/))
        .resolves(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

      await assert.rejects(
        () =>
          resolveVersions({
            packages: ['@bitgo-beta/sdk-core'],
            tag: 'beta',
            scope: SCOPE,
            githubToken: 'ghp_expired',
          }),
        /403 Forbidden/
      );
    });
  });

  describe('from manifest', function () {
    it('reads versions from JSON file', async function () {
      const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
      const manifestPath = path.join(tmpDir, 'versions.json');
      writeFileSync(
        manifestPath,
        JSON.stringify({
          '@bitgo-beta/sdk-core': '8.2.1-beta.788',
          '@bitgo-beta/statics': '15.1.1-beta.791',
        })
      );

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/statics'],
        tag: 'beta',
        scope: SCOPE,
        manifestPath,
      });

      assert.strictEqual(result.versions.get('@bitgo-beta/sdk-core'), '8.2.1-beta.788');
      assert.strictEqual(result.versions.get('@bitgo-beta/statics'), '15.1.1-beta.791');
    });

    it('warns about missing packages in manifest', async function () {
      const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'beta-tools-test-'));
      const manifestPath = path.join(tmpDir, 'versions.json');
      writeFileSync(manifestPath, JSON.stringify({ '@bitgo-beta/sdk-core': '8.2.1-beta.788' }));

      const result = await resolveVersions({
        packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/statics'],
        tag: 'beta',
        scope: SCOPE,
        manifestPath,
      });

      assert.strictEqual(result.versions.size, 1);
      assert.strictEqual(result.versions.has('@bitgo-beta/statics'), false);
    });
  });
});
