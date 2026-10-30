const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const helper = path.resolve(__dirname, '../iyarc-prune.js');

describe('iyarc-prune workflow operations', function () {
  this.timeout(30000);
  let directory;
  let repository;
  let base;
  let env;

  function git(...args) {
    return execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  }

  function execute(operation, overrides = {}, source) {
    return spawnSync(process.execPath, [source === undefined ? helper : '-', operation], {
      cwd: repository,
      env: { ...env, ...overrides },
      input: source,
      encoding: 'utf8',
    });
  }

  function validatedChanges() {
    fs.writeFileSync(path.join(repository, 'osv-scanner.toml'), 'validated exclusion removal\n');
    fs.writeFileSync(env.IYARC_PRUNE_PR_BODY, 'Validated dependency changes\n');
  }

  beforeEach(function () {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'iyarc-prune-test-'));
    repository = path.join(directory, 'repository');
    fs.mkdirSync(repository);
    git('init', '--quiet', '-b', 'master');
    git('config', 'user.name', 'Workflow Test');
    git('config', 'user.email', 'workflow-test@example.invalid');
    git('config', 'commit.gpgsign', 'false');
    git('config', 'core.hooksPath', '/dev/null');
    for (const file of ['osv-scanner.toml', 'package.json', 'yarn.lock', 'source.ts', 'modules/sample/package.json']) {
      fs.mkdirSync(path.dirname(path.join(repository, file)), { recursive: true });
      fs.writeFileSync(path.join(repository, file), 'baseline\n');
    }
    fs.mkdirSync(path.join(repository, 'scripts'));
    fs.copyFileSync(helper, path.join(repository, 'scripts/iyarc-prune.js'));
    git('add', '.');
    git('commit', '--quiet', '-m', 'fixture');
    base = git('rev-parse', 'HEAD');
    git('checkout', '--quiet', '--detach', base);
    const bin = path.join(directory, 'bin');
    fs.mkdirSync(bin);
    fs.writeFileSync(
      path.join(bin, 'gh'),
      `#!/usr/bin/env node
const fs = require('node:fs');
const state = JSON.parse(fs.readFileSync(process.env.TEST_GH_STATE, 'utf8'));
const command = process.argv.slice(2, 4).join(' ');
if (state.fail === command) process.exit(1);
if (command === 'pr list') console.log(JSON.stringify(state.pullRequests || []));
else if (command === 'label list') console.log(JSON.stringify(state.labels || [{name:'automated'},{name:'dependencies'},{name:'security'}]));
else if (command !== 'label create') process.exit(99);
`,
      { mode: 0o755 }
    );
    env = {
      ...process.env,
      BASE_SHA: base,
      GITHUB_REPOSITORY: 'BitGo/BitGoJS',
      GITHUB_OUTPUT: path.join(directory, 'output'),
      GITHUB_STEP_SUMMARY: path.join(directory, 'summary'),
      GITHUB_PATH: path.join(directory, 'github-path'),
      IYARC_PRUNE_PR_BODY: path.join(directory, 'report.md'),
      EXECUTION_FILE: path.join(directory, 'execution.json'),
      RUNNER_TEMP: directory,
      TEST_GH_STATE: path.join(directory, 'github-state.json'),
      PATH: bin + path.delimiter + process.env.PATH,
    };
    for (const file of [env.GITHUB_OUTPUT, env.GITHUB_STEP_SUMMARY, env.GITHUB_PATH]) fs.writeFileSync(file, '');
    fs.writeFileSync(env.TEST_GH_STATE, '{}');
  });

  afterEach(function () {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('does not publish when the working tree and index are unchanged', function () {
    assert.equal(execute('prepare-pull-request').status, 0);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
  });

  it('accepts validated direct workspace manifests and preserves the checkout parent', function () {
    validatedChanges();
    fs.mkdirSync(path.join(repository, 'modules/new'));
    fs.writeFileSync(path.join(repository, 'modules/new/package.json'), '{}\n');
    assert.equal(execute('prepare-pull-request').status, 0);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), 'ready=true\n');
    assert.equal(git('symbolic-ref', '--short', 'HEAD'), 'master');
    assert.equal(git('rev-parse', 'refs/remotes/origin/master'), base);
    assert.equal(git('rev-parse', 'HEAD'), base);
  });

  for (const file of [
    'source.ts',
    'modules/sample/test/package.json',
    'modules/sample/src/nested/package.json',
    'package.json ',
  ]) {
    it(`rejects changes to ${JSON.stringify(file)}`, function () {
      validatedChanges();
      fs.mkdirSync(path.dirname(path.join(repository, file)), { recursive: true });
      fs.writeFileSync(path.join(repository, file), 'unexpected\n');
      const result = execute('prepare-pull-request');
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(file));
      assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
    });
  }

  it('rejects source changes hidden in the index while the working tree matches baseline', function () {
    validatedChanges();
    fs.writeFileSync(path.join(repository, 'source.ts'), 'hidden source change\n');
    git('add', 'source.ts');
    fs.writeFileSync(path.join(repository, 'source.ts'), 'baseline\n');
    const result = execute('prepare-pull-request');
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('source.ts'));
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
  });

  it('publishes the validated working-tree bytes rather than a different staged dependency value', function () {
    validatedChanges();
    const manifest = path.join(repository, 'package.json');
    fs.writeFileSync(manifest, '{"version":2}\n');
    git('add', '.');
    const validatedTree = git('write-tree');
    fs.writeFileSync(manifest, '{"version":99}\n');
    git('add', 'package.json');
    fs.writeFileSync(manifest, '{"version":2}\n');
    assert.equal(execute('prepare-pull-request').status, 0);
    assert.equal(git('diff', '--cached', '--name-only', base), '');
    git('add', '.');
    assert.equal(git('write-tree'), validatedTree);
  });

  it('rejects an agent-created commit even when its working tree is clean', function () {
    git('commit', '--quiet', '--allow-empty', '-m', 'unexpected agent commit');
    assert.equal(execute('prepare-pull-request').status, 1);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
  });

  it('rejects dependency changes without a changed exclusion file', function () {
    fs.writeFileSync(path.join(repository, 'package.json'), 'changed\n');
    fs.writeFileSync(env.IYARC_PRUNE_PR_BODY, 'validated\n');
    assert.equal(execute('prepare-pull-request').status, 1);
  });

  for (const report of [undefined, '']) {
    it(`rejects ${report === undefined ? 'a missing' : 'an empty'} validation report`, function () {
      validatedChanges();
      if (report === undefined) fs.unlinkSync(env.IYARC_PRUNE_PR_BODY);
      else fs.writeFileSync(env.IYARC_PRUNE_PR_BODY, report);
      assert.equal(execute('prepare-pull-request').status, 1);
      assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
    });
  }

  it('skips an existing prune pull request but not unrelated pull requests', function () {
    validatedChanges();
    fs.writeFileSync(env.TEST_GH_STATE, JSON.stringify({ pullRequests: [{ number: 1, headRefName: 'unrelated' }] }));
    assert.equal(execute('prepare-pull-request').status, 0);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), 'ready=true\n');
    fs.writeFileSync(env.GITHUB_OUTPUT, '');
    fs.writeFileSync(
      env.TEST_GH_STATE,
      JSON.stringify({ pullRequests: [{ number: 2, headRefName: 'osv-scanner-prune/previous' }] })
    );
    assert.equal(execute('prepare-pull-request').status, 0);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
  });

  for (const command of ['pr list', 'label list', 'label create']) {
    it(`fails publication when ${command} fails`, function () {
      validatedChanges();
      fs.writeFileSync(env.TEST_GH_STATE, JSON.stringify({ fail: command, labels: [] }));
      assert.equal(execute('prepare-pull-request').status, 1);
      assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), '');
    });
  }

  it('preserves existing labels regardless of case', function () {
    validatedChanges();
    fs.writeFileSync(
      env.TEST_GH_STATE,
      JSON.stringify({
        fail: 'label create',
        labels: [{ name: 'Automated' }, { name: 'Dependencies' }, { name: 'Security' }],
      })
    );
    assert.equal(execute('prepare-pull-request').status, 0);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), 'ready=true\n');
  });

  it('validates the trusted committed helper even if the agent overwrites the working copy', function () {
    validatedChanges();
    fs.writeFileSync(path.join(repository, 'scripts/iyarc-prune.js'), 'process.exit(0);\n');
    const trustedSource = git('show', `${base}:scripts/iyarc-prune.js`);
    const result = execute('prepare-pull-request', {}, trustedSource);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('scripts/iyarc-prune.js'));
  });

  it('accepts successful completion in both supported execution encodings', function () {
    const success = { type: 'result', is_error: false, subtype: 'success' };
    for (const execution of [success, [success]]) {
      fs.writeFileSync(env.EXECUTION_FILE, JSON.stringify(execution));
      assert.equal(execute('require-successful-completion').status, 0);
    }
  });

  for (const execution of [
    '{',
    '[]',
    JSON.stringify([{ type: 'result', subtype: 'success' }]),
    JSON.stringify([{ type: 'result', is_error: true, subtype: 'error_max_turns' }]),
  ]) {
    it(`rejects unsuccessful or unreadable execution ${execution}`, function () {
      fs.writeFileSync(env.EXECUTION_FILE, execution);
      assert.equal(execute('require-successful-completion').status, 1);
    });
  }

  it('uses the final result rather than an earlier success', function () {
    fs.writeFileSync(
      env.EXECUTION_FILE,
      JSON.stringify([
        { type: 'result', is_error: false, subtype: 'success' },
        { type: 'result', is_error: true, subtype: 'error' },
      ])
    );
    assert.equal(execute('require-successful-completion').status, 1);
  });

  it('treats missing execution as a completion failure but not a reporting failure', function () {
    assert.equal(execute('require-successful-completion').status, 1);
    assert.equal(execute('write-agent-summary').status, 0);
  });

  it('keeps tool output and unaudited result fields out of the published summary', function () {
    fs.writeFileSync(
      env.EXECUTION_FILE,
      JSON.stringify([
        {
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'public report' },
              { type: 'tool_use', input: 'private tool input' },
            ],
          },
        },
        {
          type: 'result',
          is_error: false,
          subtype: 'success',
          result: 'private result',
          future_secret: 'private new metadata',
          usage: { output_tokens: 12 },
        },
      ])
    );
    assert.equal(execute('write-agent-summary').status, 0);
    const summary = fs.readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8');
    assert.ok(summary.includes('public report'));
    assert.ok(!summary.includes('private'));
    assert.ok(summary.includes('output_tokens'));
  });

  it('does not fail completion because the summary cannot be written', function () {
    fs.writeFileSync(env.EXECUTION_FILE, JSON.stringify([{ type: 'result', is_error: false, subtype: 'success' }]));
    assert.equal(execute('write-agent-summary', { GITHUB_STEP_SUMMARY: directory }).status, 0);
    assert.equal(execute('require-successful-completion').status, 0);
  });

  it('fails when publication did not return a pull request URL', function () {
    assert.equal(execute('report-pull-request', { PR_URL: '' }).status, 1);
  });

  it('never executes a downloaded scanner whose checksum is wrong', function () {
    const marker = path.join(directory, 'untrusted-executed');
    const scanner = path.join(directory, 'download');
    fs.writeFileSync(scanner, `#!/bin/sh\ntouch '${marker}'\n`);
    const curl = path.join(directory, 'bin/curl');
    fs.writeFileSync(
      curl,
      `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.copyFileSync(process.env.TEST_DOWNLOAD, args[args.indexOf('--output') + 1]);
`,
      { mode: 0o755 }
    );
    const result = execute('install-scanner', { TEST_DOWNLOAD: scanner, OSV_SCANNER_SHA256: '0'.repeat(64) });
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(marker), false);
    assert.equal(fs.readFileSync(env.GITHUB_PATH, 'utf8'), '');
  });
});
