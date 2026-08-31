import assert from 'assert';

// Throwaway test for WAL-1475: fails only on Node 24 to verify branch protection
// actually blocks merge on a Node-24-only CI failure. Delete before merging.
describe('WAL-1475 node24 required-check verification', function () {
  it('should not be on node 24 (intentionally fails on node 24 only)', function () {
    assert.notStrictEqual(process.version.split('.')[0], 'v24');
  });
});
