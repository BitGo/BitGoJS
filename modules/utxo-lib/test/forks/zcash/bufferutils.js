/* global describe, it */
const assert = require('assert')
const { ZcashBufferReader } = require('../../../src/forks/zcash/bufferutils')

describe('ZcashBufferReader', function () {
  // copied from test/bufferutils.js
  function concatToBuffer (values) {
    return Buffer.concat(values.map(data => Buffer.from(data)))
  }

  // copied from test/bufferutils.js
  function testValue (bufferReader, value, expectedValue, expectedOffset = Buffer.isBuffer(expectedValue)
    ? expectedValue.length
    : 0) {
    assert.strictEqual(bufferReader.offset, expectedOffset)
    if (Buffer.isBuffer(expectedValue)) {
      assert.deepStrictEqual(value.slice(0, expectedOffset), expectedValue.slice(0, expectedOffset))
    } else {
      assert.strictEqual(value, expectedValue)
    }
  }

  it('readInt64', () => {
    const values = [
      0,
      1,
      -1,
      Number.MIN_SAFE_INTEGER
    ]
    const buffer = concatToBuffer([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0],
      [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
      [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe0, 0xff]
    ])
    const bufferReader = new ZcashBufferReader(buffer)
    values.forEach((value) => {
      const expectedOffset = bufferReader.offset + 8
      const val = bufferReader.readInt64()
      testValue(bufferReader, val, value, expectedOffset)
    })
  })
})
