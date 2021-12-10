import * as fs from 'fs-extra';
import * as childProcess from 'child_process';

import { Network, getNetworkList, getNetworkName, isMainnet } from '../../src';
import { getArchiveUrl, getFixtureInfo, getArchiveRoot, sigHashTestFile, txValidTestFile } from './fixtures';

function downloadAndUnpackTestFixtures(network: Network) {
  const fixtureInfo = getFixtureInfo(network);
  const archivePath = `/tmp/${getNetworkName(network)}.tar.gz`;
  if (!fs.existsSync(archivePath)) {
    childProcess.execFileSync('wget', [getArchiveUrl(fixtureInfo), '--quiet', `-O${archivePath}`, '--no-clobber']);
  }

  childProcess.execFileSync('tar', [
    '-xf',
    archivePath,
    `--directory=test/fixtures_thirdparty/nodes/`,
    `${getArchiveRoot(fixtureInfo)}/src/test/data/${sigHashTestFile}`,
    `${getArchiveRoot(fixtureInfo)}/src/test/data/${txValidTestFile}`,
  ]);
}

async function main() {
  for (const network of getNetworkList().filter(isMainnet)) {
    downloadAndUnpackTestFixtures(network);
    console.log(`${getNetworkName(network)} done`);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
