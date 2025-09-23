try {
  const mod = require('bigint-buffer');
  const le = typeof mod.toBigIntLE === 'function' ? mod.toBigIntLE : undefined;
  const be = typeof mod.toBigIntBE === 'function' ? mod.toBigIntBE : undefined;

  const isBufferLike = (b: unknown) => (typeof Buffer !== 'undefined' && Buffer.isBuffer(b)) || b instanceof Uint8Array;

  const byteLen = (b: any) =>
    typeof Buffer !== 'undefined' && Buffer.isBuffer(b) ? b.length : (b as Uint8Array).byteLength;

  const assertBuf = (b: unknown) => {
    if (!isBufferLike(b)) throw new TypeError('toBigInt*: input must be Buffer/Uint8Array');
    if (byteLen(b as any) > 1_000_000) throw new RangeError('toBigInt*: buffer too large');
  };

  if (le)
    mod.toBigIntLE = (buf: Buffer | Uint8Array) => {
      assertBuf(buf);
      return le(buf);
    };
  if (be)
    mod.toBigIntBE = (buf: Buffer | Uint8Array) => {
      assertBuf(buf);
      return be(buf);
    };
} catch {
  /* noop */
}
