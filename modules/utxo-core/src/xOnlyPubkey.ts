export function toXOnlyPublicKey(b: Buffer): Buffer {
  if (b.length === 33) {
    if (b[0] === 0x02 || b[0] === 0x03) {
      return b.subarray(1);
    } else {
      throw new Error(`invalid pubkey leading byte ${b.subarray(0, 1).toString('hex')}`);
    }
  }

  if (b.length === 32) {
    return b;
  }

  throw new Error(`invalid pubkey buffer length ${b.length}`);
}
