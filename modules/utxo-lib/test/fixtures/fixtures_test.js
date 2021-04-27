/* global describe, it */
const assert = require('assert')

const { networks } = require('../..')
const { ErrorMergeFixtures, mergeFixtures } = require('.')

describe('mergeFixtures', function () {
  // only used in error message
  const network = networks.bitcoin
  it('merges fixtures', function () {
    const base = { a: [1], b: [2] }
    const fork = { a: [2] }
    const merged = mergeFixtures(network, base, fork)
    // make sure inputs are not mutated
    assert.deepStrictEqual(base, { a: [1], b: [2] })
    assert.deepStrictEqual(fork, { a: [2] })
    assert.deepStrictEqual(merged, { a: [1, 2], b: [2] })
  })

  it('merges fixtures recursively', function () {
    const base = { a: [1], b: [2], c: { c1: { c2: [11] } } }
    const fork = { a: [2], c: { c1: { c2: [22] } } }
    const merged = mergeFixtures(network, base, fork)
    // make sure inputs are not mutated
    assert.deepStrictEqual(base, { a: [1], b: [2], c: { c1: { c2: [11] } } })
    assert.deepStrictEqual(fork, { a: [2], c: { c1: { c2: [22] } } })
    assert.deepStrictEqual(merged, { a: [1, 2], b: [2], c: { c1: { c2: [11, 22] } } })
  })

  it('does not merge for mismatched fields', function () {
    const expectedError = new ErrorMergeFixtures(network, undefined, [11], ['a', 'b'])
    assert.strictEqual(
      expectedError.message,
      'invalid fixtures for bitcoin: error merging fixtures at path a.b: ' +
      'fork fixture is object, base fixture is undefined'
    )
    assert.throws(
      () => mergeFixtures(network, { a: {} }, { a: { b: [11] } }),
      e => e.message === expectedError.message
    )

    const base = { a: [11], b: { c: [] } }
    const invalidForks = [
      // mismatched type (not an array)
      { a: 11 },
      // mismatched type (not an array)
      { a: { b: [11] } },
      // mismatched type (not an object)
      { b: [] },
      // missing key `c`
      { c: [11] },
      // missing key `b.d`
      { b: { d: [] } }
    ]

    for (const fork of invalidForks) {
      assert.throws(
        () => mergeFixtures(network, base, fork),
        ErrorMergeFixtures
      )
    }
  })
})
