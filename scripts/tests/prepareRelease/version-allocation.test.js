require('tsx/cjs');

const assert = require('node:assert/strict');
const {
  findFirstUnpublishedVersion,
  getDistTags,
  getDistTagsForModuleNames,
} = require('../../prepareRelease/distTags.ts');

describe('prerelease version allocation', function () {
  it('keeps an unoccupied candidate', async function () {
    const version = await findFirstUnpublishedVersion(
      '@bitgo-beta/sdk-core',
      '1.2.3-beta.8',
      'beta',
      async () => false,
    );

    assert.equal(version, '1.2.3-beta.8');
  });

  it('skips consecutive occupied candidates', async function () {
    const occupied = new Set(['1.2.3-beta.8', '1.2.3-beta.9']);
    const version = await findFirstUnpublishedVersion(
      '@bitgo-beta/sdk-core',
      '1.2.3-beta.8',
      'beta',
      async (_name, candidate) => occupied.has(candidate),
    );

    assert.equal(version, '1.2.3-beta.10');
  });

  it('fails instead of guessing when the registry probe fails', async function () {
    await assert.rejects(
      findFirstUnpublishedVersion(
        '@bitgo-beta/sdk-core',
        '1.2.3-beta.8',
        'beta',
        async () => {
          throw new Error('registry unavailable');
        },
      ),
      /registry unavailable/,
    );
  });

  it('treats a missing dist-tag document as a new package', async function () {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response('', { status: 404, statusText: 'Not Found' });

    try {
      assert.deepEqual(await getDistTags('@bitgo-beta/new-package'), {});
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('fails instead of dropping a module when dist-tag lookup fails', async function () {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response('unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });

    try {
      await assert.rejects(
        getDistTagsForModuleNames(['@bitgo-beta/sdk-core']),
        /503 Service Unavailable/,
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
