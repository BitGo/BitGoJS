const GITHUB_API = 'https://api.github.com';

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

interface WorkflowRun {
  id: number;
  created_at: string;
  head_sha: string;
}

interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
}

interface Job {
  id: number;
  name: string;
}

interface JobsResponse {
  jobs: Job[];
}

export async function getLatestPublishRunId(
  token: string,
  owner: string,
  repo: string,
  branch = 'master'
): Promise<number> {
  const params = new URLSearchParams({
    status: 'success',
    branch,
    per_page: '1',
  });
  const url = `${GITHUB_API}/repos/${owner}/${repo}/actions/workflows/publish.yml/runs?${params}`;
  const response = await fetch(url, { headers: headers(token) });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as WorkflowRunsResponse;
  const run = data.workflow_runs[0];
  if (!run) {
    throw new Error(`No successful publish workflow runs found on branch ${branch}`);
  }
  console.log(`Found publish run ${run.id} from ${run.created_at} (${run.head_sha.slice(0, 8)})`);
  return run.id;
}

export async function getPublishJobLogs(token: string, owner: string, repo: string, runId: number): Promise<string> {
  const jobsUrl = `${GITHUB_API}/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
  const jobsResponse = await fetch(jobsUrl, { headers: headers(token) });
  if (!jobsResponse.ok) {
    throw new Error(`GitHub API error fetching jobs: ${jobsResponse.status} ${jobsResponse.statusText}`);
  }
  const jobsData = (await jobsResponse.json()) as JobsResponse;
  const publishJob = jobsData.jobs.find((j) => j.name === 'Publish Release');
  if (!publishJob) {
    throw new Error(`No "Publish Release" job found in run ${runId}`);
  }

  const logsUrl = `${GITHUB_API}/repos/${owner}/${repo}/actions/jobs/${publishJob.id}/logs`;
  const logsResponse = await fetch(logsUrl, {
    headers: { ...headers(token), Accept: 'application/vnd.github.v3.raw' },
  });
  if (!logsResponse.ok) {
    throw new Error(`GitHub API error fetching logs: ${logsResponse.status} ${logsResponse.statusText}`);
  }
  return logsResponse.text();
}

/**
 * Parse verify-release output from GitHub Actions job logs.
 *
 * Log lines look like:
 *   2026-02-25T13:05:23.1416944Z @bitgo-beta/sdk-core matches expected version 8.2.1-beta.1613
 */
export function parseVersionsFromLogs(logs: string, scope: string): Map<string, string> {
  const escaped = scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${escaped}/[\\w-]+) matches expected version (\\S+)`, 'gm');
  const versions = new Map<string, string>();
  let match;
  while ((match = pattern.exec(logs)) !== null) {
    versions.set(match[1], match[2]);
  }
  return versions;
}
