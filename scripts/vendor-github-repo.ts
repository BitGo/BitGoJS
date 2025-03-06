import { ChildProcess, execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as tmp from 'tmp';
import * as yargs from 'yargs';

function isErrorExists(e: NodeJS.ErrnoException): boolean {
  return e.code === 'EEXIST';
}

type GithubSource = {
  org: string;
  repo: string;
} & ({ tag: string } | { ref: string });

async function wait(p: ChildProcess): Promise<void> {
  p.stderr?.pipe(process.stderr);
  p.stdout?.pipe(process.stdout);
  return new Promise((resolve, reject) => {
    p.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
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
    await fs.stat(outfile);
    console.log(`Archive already exists: ${outfile}`);
    return;
  } catch (e) {}
  const buffer = await fetch(getUrl(lib)).then((res) => res.arrayBuffer());
  await fs.writeFile(outfile, Buffer.from(buffer));
}

async function extractArchive(archivePath: string, targetDir: string): Promise<void> {
  try {
    await fs.mkdir(targetDir, { recursive: true });
  } catch (e) {
    if (!isErrorExists(e)) {
      throw e;
    }
  }
  await wait(execFile('tar', ['-C', targetDir, '--strip-components', '1', '-xzf', archivePath]));
}

type VendorConfig = GithubSource & {
  targetDir: string;
};

async function main(cfgs: VendorConfig[]) {
  for (const cfg of cfgs) {
    const archivePath = getArchivePath(cfg);
    await fetchArchive(cfg, archivePath);
    await extractArchive(archivePath, cfg.targetDir);
  }
}

const vendorConfigs: VendorConfig[] = [
  {
    org: 'babylonlabs-io',
    repo: 'btc-staking-ts',
    tag: 'v0.4.0-rc.2',
    targetDir: 'modules/babylonlabs-io-btc-staking-ts',
  },
];

yargs
  .command({
    command: 'vendor',
    builder(a) {
      return a.options({ name: { type: 'string' } });
    },
    handler(a) {
      const matches = vendorConfigs.filter((cfg) => a.name === cfg.repo);
      if (matches.length === 0) {
        throw new Error(`no such vendor config ${a.name}`);
      }
      if (matches.length > 1) {
        throw new Error(`ambiguous vendor config ${a.name}`);
      }
      main(matches);
    },
  })
  .help()
  .strict()
  .demandCommand().argv;
