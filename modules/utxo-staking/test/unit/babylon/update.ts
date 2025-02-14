import { ChildProcess, execFile } from 'child_process';
// import { promisify } from 'util';
import * as fs from 'fs/promises';

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

function getUrl(tag: string): string {
  // https://github.com/babylonlabs-io/btc-staking-ts/archive/refs/tags/v0.4.0-rc.2.tar.gz
  return `https://github.com/babylonlabs-io/btc-staking-ts/archive/refs/tags/${tag}.tar.gz`;
}

async function readManifest(): Promise<string[]> {
  return (await fs.readFile(__dirname + '/vendor/manifest.txt', 'utf-8')).split('\n');
}

async function fetchArchive(tag: string, outfile: string): Promise<void> {
  try {
    await fs.stat(outfile);
    console.log(`Archive already exists: ${outfile}`);
    return;
  } catch (e) {}
  const buffer = await fetch(getUrl(tag)).then((res) => res.arrayBuffer());
  await fs.writeFile(outfile, Buffer.from(buffer));
}

async function extractArchive(tag: string, archivePath: string): Promise<void> {
  const archivePrefix = `btc-staking-ts-${tag.slice(1)}`;
  const localPrefix = 'btc-staking-ts';
  const manifest = (await readManifest()).map((line) => line.replace(new RegExp('^' + localPrefix), archivePrefix));
  await wait(
    execFile('tar', [
      '-C',
      __dirname + `/vendor/${localPrefix}`,
      `--transform=s/^${archivePrefix}//`,
      '-xzf',
      archivePath,
      ...manifest,
    ])
  );
}

async function patch(filename: string): Promise<void> {
  // await cmd('patch', ['-p0', '-i', __dirname + `/vendor/${filename}`]);
  await wait(
    execFile('patch', ['-p1', '-i', __dirname + `/vendor/${filename}`], {
      cwd: __dirname + '/vendor/',
    })
  );
}

async function main(tag: string) {
  const archivePath = __dirname + `/vendor/${tag}.tar.gz`;
  await fetchArchive(tag, archivePath);
  await extractArchive(tag, archivePath);
  await patch('limited-vendor.patch');
}

if (require.main === module) {
  const tag = 'v0.4.0-rc.2';
  main(tag)
    .then(() => console.log(`Successfully extracted ${tag}`))
    .catch((e) => {
      console.error(`Failed to extract ${tag}`, e);
      process.exit(1);
    });
}
