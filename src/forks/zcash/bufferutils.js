const { BufferReader } = require('../../bufferutils')

class ZcashBufferReader extends BufferReader {
  readInt64 () {
    const a = this.buffer.readUInt32LE(this.offset)
    let b = this.buffer.readInt32LE(this.offset + 4)
    b *= 0x100000000
    this.offset += 8
    return b + a
  }
}

module.exports = { ZcashBufferReader }
