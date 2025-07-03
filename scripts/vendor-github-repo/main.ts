import { execa, ResultPromise } from 'execa';
import * as fs from 'fs/promises';
import * as tmp from 'tmp';
import * as yargs from 'yargs';
import { GithubSource, VendorConfig } from './VendorConfig';
import { createPatchForCommit, getCommitsFromRange, getCommitsFromSpec } from './git';

function isErrorExists(e: NodeJS.ErrnoException): boolean {
  return e.code === 'EEXIST';
}

function getUrl(lib: GithubSource): string {
  if ('tag' in lib) {
    const { org, repo, tag } = lib;
    return `https://github.com/${org}/${repo}/archive/refs/tags/${tag}.tar.gz`;
  }
  if ('ref' in lib) {
    const { org, repo, ref } = lib;
    return `https://github.com/${org}/${repo}/tarball/${ref}`;
  }
  throw new Error('Unsupported lib');
}

function getArchivePath(lib: GithubSource): string {
  return tmp.fileSync({ postfix: `-${lib.repo}.tar.gz` }).name;
}

async function fetchArchive(lib: GithubSource, outfile: string): Promise<void> {
  try {
    const result = await fs.stat(outfile);
    if (result.size > 0) {
      console.log(`Archive already exists: ${outfile}`);
      return;
    }
  } catch (e) {}
  const url = getUrl(lib);
  const result = await fetch(url);
  if (!result.ok) {
    throw new Error(`Failed to fetch ${url}: ${result.status} ${result.statusText}`);
  }
  await fs.writeFile(outfile, Buffer.from(await result.arrayBuffer()));
}

function pipe(cmd: ResultPromise): ResultPromise {
  cmd.stdout?.pipe(process.stdout);
  cmd.stderr?.pipe(process.stderr);
  return cmd;
}

async function extractArchive(archivePath: string, targetDir: string): Promise<void> {
  try {
    await fs.mkdir(targetDir, { recursive: true });
  } catch (e) {
    if (!isErrorExists(e)) {
      throw e;
    }
  }
  await pipe(execa('tar', ['-C', targetDir, '--strip-components', '1', '-xzf', archivePath]));
}

async function cmdVendor(cfgs: VendorConfig[]) {
  for (const cfg of cfgs) {
    const archivePath = getArchivePath(cfg);
    await fetchArchive(cfg, archivePath);
    await extractArchive(archivePath, cfg.targetDir);
    if (cfg.postExtract) {
      console.log(`Running post-extract hook for ${cfg.repo}`);
      await cfg.postExtract(cfg, cfg.targetDir);
    }
  }
}

async function cmdGeneratePatches(cfgs: VendorConfig[], spec: string) {
  for (const cfg of cfgs) {
    const commitRange = await getCommitsFromSpec(spec);
    for (const commit of commitRange) {
      await createPatchForCommit(cfg, commit, cfg.targetDir);
    }
  }
}

const vendorConfigs: VendorConfig[] = [
  {
    org: 'babylonlabs-io',
    repo: 'btc-staking-ts',
    tag: 'v1.0.3',
    targetDir: 'modules/babylonlabs-io-btc-staking-ts',
    async postExtract(githubSource: GithubSource, targetDir: string) {
      const m = await import('./btc-staking-ts/postExtract');
      await m.default(githubSource, targetDir);
    },
  },
];

function getMatches(name: string): VendorConfig[] {
  const matches = vendorConfigs.filter((cfg) => name === cfg.repo);
  if (matches.length === 0) {
    throw new Error(`no such vendor config ${name}`);
  }
  if (matches.length > 1) {
    throw new Error(`ambiguous vendor config ${name}`);
  }
  return vendorConfigs.filter((cfg) => cfg.repo === name);
}

const optName = {
  type: 'string',
  demand: true,
  description: 'Name of the vendor config to use, e.g. btc-staking-ts',
} as const;

yargs
  .command({
    command: 'vendor',
    describe: 'Vendor a github repo',
    builder(a) {
      return a.options({
        name: optName,
      });
    },
    async handler(a) {
      await cmdVendor(getMatches(a.name));
    },
  })
  .command({
    command: 'generate-patches',
    describe: 'Convert a commit range to a set of patches',
    builder(a) {
      return a.options({
        name: optName,
        commitSpec: {
          type: 'string',
          demand: true,
          description: 'Commit range in the form of "from..to", e.g. "v1.0.0..v1.0.3" or a single commit "v1.0.3"',
        },
      });
    },
    async handler(a) {
      await cmdGeneratePatches(getMatches(a.name), a.commitSpec);
    },
  })
  .help()
  .strict()
  .demandCommand().argv;
