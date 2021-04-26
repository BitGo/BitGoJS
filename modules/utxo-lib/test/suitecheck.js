/* global describe, it */
const assert = require('assert')

/**
 * Sums up tests. Since suites can have sub-suites we do it recursively.
 * @param suite
 * @returns {*}
 */
function countSuiteTests (suite) {
  return suite.suites.reduce((sum, s) => sum + countSuiteTests(s), 0) +
    suite.tests.length
}

/*
This is pretty meta:
We want a tests that checks the total number of tests (including this one).
This makes sure we don't lose tests during refactors.
 */
describe('Test Suite', function () {
  it('has expected count', function () {
    if (this.test === undefined) {
      throw new Error(`unexpected argument`)
    }

    const rootSuite = this.test.parent.parent
    if (rootSuite.title !== '') {
      throw new Error(`unexpected root suite`)
    }

    const testCount = countSuiteTests(rootSuite)

    const expectedCount = process.env.BITGO_UTXO_LIB_TEST_EXPECTED_COUNT
    if (expectedCount !== undefined) {
      assert.strictEqual(testCount, Number(expectedCount))
    } else {
      console.log(`test count: ${testCount}`)
    }
  })
})
