const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');

const env = process.env;
const labels = ['automated', 'dependencies', 'security'];

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).replace(/\n+$/, '');
}

function setOutput(name, value) {
  if (String(value).includes('\n')) {
    const delimiter = `iyarc-${randomUUID()}`;
    fs.appendFileSync(env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
  } else {
    fs.appendFileSync(env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

function writeSummary(text) {
  fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

function installScanner() {
  const directory = path.join(env.RUNNER_TEMP, 'osv-scanner');
  const executable = path.join(directory, 'osv-scanner');
  fs.mkdirSync(directory, { recursive: true });
  run('curl', [
    '--fail',
    '--silent',
    '--show-error',
    '--location',
    '--retry',
    '3',
    'https://github.com/google/osv-scanner/releases/download/v2.3.8/osv-scanner_linux_amd64',
    '--output',
    executable,
  ]);
  const digest = createHash('sha256').update(fs.readFileSync(executable)).digest('hex');
  if (digest !== env.OSV_SCANNER_SHA256) {
    throw new Error('Downloaded osv-scanner checksum does not match OSV_SCANNER_SHA256');
  }
  fs.chmodSync(executable, 0o755);
  console.log(run(executable, ['--version']));
  fs.appendFileSync(env.GITHUB_PATH, `${directory}\n`);
}

function assumeInferenceRole() {
  const credentials = JSON.parse(
    run('aws', [
      'sts',
      'assume-role',
      '--role-arn',
      'arn:aws:iam::168000258654:role/BedrockInferenceRole',
      '--role-session-name',
      'iyarc-prune-session',
      '--query',
      'Credentials',
      '--output',
      'json',
    ])
  );
  console.log(`::add-mask::${credentials.SecretAccessKey}`);
  console.log(`::add-mask::${credentials.SessionToken}`);
  setOutput('aws-access-key-id', credentials.AccessKeyId);
  setOutput('aws-secret-access-key', credentials.SecretAccessKey);
  setOutput('aws-session-token', credentials.SessionToken);
}

function loadInstructions() {
  const instructions = fs.readFileSync('.claude/agents/iyarc-prune.md', 'utf8');
  const endOfFrontmatter = instructions.indexOf('\n---\n');
  setOutput('content', instructions.slice(endOfFrontmatter + '\n---\n'.length));
}

function readExecution() {
  if (!env.EXECUTION_FILE || !fs.existsSync(env.EXECUTION_FILE)) {
    throw new Error('no Claude execution file produced');
  }
  const execution = JSON.parse(fs.readFileSync(env.EXECUTION_FILE, 'utf8'));
  return Array.isArray(execution) ? execution : [execution];
}

function writeAgentSummary() {
  try {
    let events;
    try {
      events = readExecution();
    } catch {
      writeSummary(
        '## osv-scanner-prune report\n\n> No readable Claude execution file was produced — see the agent step logs.'
      );
      return;
    }
    const report = events
      .filter((event) => event?.type === 'assistant')
      .flatMap((event) => event.message?.content ?? [])
      .filter((content) => content?.type === 'text')
      .map((content) => content.text)
      .join('\n');
    const result = events.findLast((event) => event?.type === 'result');
    const parts = [
      '## osv-scanner-prune report',
      report || '> The agent produced no text output — see the agent step logs.',
    ];
    if (result) {
      // Upstream can add fields; publish only metadata we have audited.
      const metadata = Object.fromEntries(
        Object.entries({
          is_error: result.is_error,
          subtype: result.subtype,
          terminal_reason: result.terminal_reason,
          stop_reason: result.stop_reason,
          num_turns: result.num_turns,
          duration_ms: result.duration_ms,
          total_cost_usd: result.total_cost_usd,
          session_id: result.session_id,
          output_tokens: result.usage?.output_tokens,
        }).filter(([, value]) => value != null)
      );
      parts.push(
        `<details><summary>Run metadata</summary>\n\n\`\`\`json\n${JSON.stringify(
          metadata,
          null,
          2
        )}\n\`\`\`\n\n</details>`
      );
    }
    writeSummary(parts.join('\n\n'));
  } catch (error) {
    // Reporting must not turn an otherwise successful agent run into a failure.
    console.warn(`Could not write agent summary: ${error.message}`);
  }
}

function requireSuccessfulCompletion() {
  const result = readExecution().findLast((event) => event?.type === 'result');
  if (result?.is_error !== false || result?.subtype !== 'success') {
    throw new Error('Claude did not produce a successful result');
  }
}

function validateChanges(base, changedFiles) {
  for (const file of changedFiles) {
    if (
      !['osv-scanner.toml', 'package.json', 'yarn.lock'].includes(file) &&
      !/^modules\/[^/]+\/package\.json$/.test(file)
    ) {
      throw new Error(`Unexpected changed file: ${file}`);
    }
  }
  if (!run('git', ['diff', '--name-only', base, '--', 'osv-scanner.toml'])) {
    throw new Error('Dependency changes exist without an osv-scanner.toml change');
  }
  if (
    !env.IYARC_PRUNE_PR_BODY ||
    !fs.existsSync(env.IYARC_PRUNE_PR_BODY) ||
    fs.statSync(env.IYARC_PRUNE_PR_BODY).size === 0
  ) {
    throw new Error('Changes exist but the agent did not produce a validated pull request report');
  }
}

function ensureLabels() {
  const existingLabels = JSON.parse(
    run('gh', ['label', 'list', '--repo', env.GITHUB_REPOSITORY, '--limit', '1000', '--json', 'name'])
  ).map((label) => label.name.toLowerCase());
  for (const label of labels) {
    if (!existingLabels.includes(label)) {
      run('gh', ['label', 'create', label, '--repo', env.GITHUB_REPOSITORY]);
    }
  }
}

function preparePullRequest() {
  const base = env.BASE_SHA;
  if (!base || run('git', ['rev-parse', 'HEAD']) !== base) {
    throw new Error('Agent changed HEAD; validated edits must remain uncommitted');
  }
  const changedFiles = new Set(
    [
      ...run('git', ['diff', '--name-only', base]).split('\n'),
      ...run('git', ['diff', '--cached', '--name-only', base]).split('\n'),
      ...run('git', ['ls-files', '--others', '--exclude-standard']).split('\n'),
    ].filter(Boolean)
  );
  if (changedFiles.size === 0) {
    writeSummary('No dependency changes to publish.');
    return;
  }
  validateChanges(base, changedFiles);
  const openPullRequests = JSON.parse(
    run('gh', [
      'pr',
      'list',
      '--repo',
      env.GITHUB_REPOSITORY,
      '--state',
      'open',
      '--limit',
      '1000',
      '--json',
      'number,headRefName',
    ])
  ).filter((pullRequest) => pullRequest.headRefName.startsWith('osv-scanner-prune/'));
  if (openPullRequests.length > 0) {
    writeSummary(`An open prune pull request already exists: ${JSON.stringify(openPullRequests)}`);
    return;
  }
  ensureLabels();
  // The pinned publisher rebases detached HEAD onto newer master. Keep its local
  // base at the validated parent and stage only the validated working-tree bytes.
  run('git', ['reset', '--mixed', base]);
  run('git', ['checkout', '-B', 'master', base]);
  run('git', ['update-ref', 'refs/remotes/origin/master', base]);
  setOutput('ready', 'true');
}

function reportPullRequest() {
  if (!env.PR_URL) {
    throw new Error('Validated dependency changes did not produce a pull request');
  }
  writeSummary(`Pull request: ${env.PR_URL}`);
  writeSummary(
    '> **Action required:** Check the pull request for an **Approve workflows to run** banner. A maintainer must approve pending workflow runs and verify required checks pass before merging.'
  );
}

const operations = {
  'install-scanner': installScanner,
  'assume-inference-role': assumeInferenceRole,
  'load-instructions': loadInstructions,
  'write-agent-summary': writeAgentSummary,
  'require-successful-completion': requireSuccessfulCompletion,
  'prepare-pull-request': preparePullRequest,
  'report-pull-request': reportPullRequest,
};

try {
  const operation = operations[process.argv[2]];
  if (!Object.hasOwn(operations, process.argv[2])) {
    throw new Error(`Unknown iyarc-prune operation: ${process.argv[2]}`);
  }
  operation();
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
