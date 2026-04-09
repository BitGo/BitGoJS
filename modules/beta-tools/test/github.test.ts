import assert from 'assert';
import sinon from 'sinon';

import { getLatestPublishRunId, getPublishJobLogs, parseVersionsFromLogs } from '../src/github';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });
}

describe('github', function () {
  let fetchStub: sinon.SinonStub;

  beforeEach(function () {
    fetchStub = sinon.stub(global, 'fetch');
    fetchStub.rejects(new Error('Unexpected fetch call'));
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('parseVersionsFromLogs', function () {
    it('parses versions from GitHub Actions log lines', function () {
      const logs = [
        '2026-02-25T13:05:23.1416944Z @bitgo-beta/sdk-core matches expected version 8.2.1-beta.1613',
        '2026-02-25T13:05:23.3282652Z @bitgo-beta/statics matches expected version 15.1.1-beta.1616',
        '2026-02-25T13:05:23.6045279Z @bitgo-beta/utxo-lib matches expected version 8.0.3-beta.1615',
      ].join('\n');

      const versions = parseVersionsFromLogs(logs, '@bitgo-beta');
      assert.strictEqual(versions.size, 3);
      assert.strictEqual(versions.get('@bitgo-beta/sdk-core'), '8.2.1-beta.1613');
      assert.strictEqual(versions.get('@bitgo-beta/statics'), '15.1.1-beta.1616');
      assert.strictEqual(versions.get('@bitgo-beta/utxo-lib'), '8.0.3-beta.1615');
    });

    it('ignores non-matching lines', function () {
      const logs = [
        '2026-02-25T13:04:00.0000000Z Verifying packages...',
        '2026-02-25T13:05:23.1416944Z @bitgo-beta/sdk-core matches expected version 8.2.1-beta.1613',
        '2026-02-25T13:05:24.0000000Z Done.',
        '2026-02-25T13:05:25.0000000Z @bitgo-beta/missing-pkg missing. Expected 1.0.0-beta.1, latest is 1.0.0-beta.0',
      ].join('\n');

      const versions = parseVersionsFromLogs(logs, '@bitgo-beta');
      assert.strictEqual(versions.size, 1);
      assert.strictEqual(versions.has('@bitgo-beta/missing-pkg'), false);
    });

    it('only matches the specified scope', function () {
      const logs = [
        '2026-02-25T13:05:23.0000000Z @bitgo-beta/sdk-core matches expected version 1.0.0',
        '2026-02-25T13:05:23.0000000Z @other-scope/sdk-core matches expected version 2.0.0',
      ].join('\n');

      const versions = parseVersionsFromLogs(logs, '@bitgo-beta');
      assert.strictEqual(versions.size, 1);
      assert.strictEqual(versions.get('@bitgo-beta/sdk-core'), '1.0.0');
    });

    it('returns empty map for empty logs', function () {
      assert.strictEqual(parseVersionsFromLogs('', '@bitgo-beta').size, 0);
    });
  });

  describe('getLatestPublishRunId', function () {
    it('returns the run ID from the latest successful workflow run', async function () {
      fetchStub.withArgs(sinon.match(/repos\/BitGo\/BitGoJS\/actions\/workflows\/publish.yml\/runs/)).resolves(
        jsonResponse({
          workflow_runs: [{ id: 12345, created_at: '2026-01-01T00:00:00Z', head_sha: 'abc123' }],
        })
      );

      const runId = await getLatestPublishRunId('test-token', 'BitGo', 'BitGoJS');
      assert.strictEqual(runId, 12345);

      const [url, opts] = fetchStub.firstCall.args;
      assert.ok(url.includes('status=success'));
      assert.ok(url.includes('branch=master'));
      const hdrs = (opts as RequestInit).headers as Record<string, string> | undefined;
      assert.strictEqual(hdrs?.['Authorization'], 'Bearer test-token');
    });

    it('throws when no runs found', async function () {
      fetchStub.withArgs(sinon.match(/workflows\/publish.yml\/runs/)).resolves(jsonResponse({ workflow_runs: [] }));

      await assert.rejects(() => getLatestPublishRunId('token', 'BitGo', 'BitGoJS'), /No successful publish/);
    });

    it('throws on API error', async function () {
      fetchStub
        .withArgs(sinon.match(/workflows\/publish.yml\/runs/))
        .resolves(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

      await assert.rejects(() => getLatestPublishRunId('token', 'BitGo', 'BitGoJS'), /403 Forbidden/);
    });
  });

  describe('getPublishJobLogs', function () {
    it('fetches logs for the Publish Release job', async function () {
      fetchStub
        .withArgs(sinon.match(/actions\/runs\/999\/jobs/))
        .resolves(jsonResponse({ jobs: [{ id: 555, name: 'Publish Release' }] }));
      fetchStub.withArgs(sinon.match(/actions\/jobs\/555\/logs/)).resolves(textResponse('log line 1\nlog line 2\n'));

      const logs = await getPublishJobLogs('token', 'BitGo', 'BitGoJS', 999);
      assert.strictEqual(logs, 'log line 1\nlog line 2\n');
    });

    it('throws when Publish Release job not found', async function () {
      fetchStub
        .withArgs(sinon.match(/actions\/runs\/999\/jobs/))
        .resolves(jsonResponse({ jobs: [{ id: 1, name: 'Other Job' }] }));

      await assert.rejects(() => getPublishJobLogs('token', 'BitGo', 'BitGoJS', 999), /No "Publish Release" job/);
    });
  });
});
