import { describe, it } from 'mocha';
import * as path from 'path';
import { runTestAndCompare } from './util';

// Reference commit SHA to test against
const referenceSha = 'e4ecd59509e02db753c099e95330d6654b80fbfd';

describe('Prepare Release Main Script', () => {
  it('should produce expected changes for beta prerelease', function () {
    this.timeout(10_000);

    const referenceDiffPath = path.join(__dirname, 'fixtures', 'diffs', 'beta-prerelease.diff');
    const distTagsCachePath = path.join(__dirname, 'fixtures', 'dist-tags.json');

    runTestAndCompare(referenceSha, referenceDiffPath, {
      preid: 'beta',
      tempDir: '/tmp/prepare-release-test',
      pathFilter: 'modules/bitgo/',
      distTagsCachePath, // Pass the cache path here
    });
  });
});
