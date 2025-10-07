import type { IPreparedTransaction } from '../../src/lib/iface';

declare module '../../resources/hash/hash.js' {
  export function computePreparedTransaction(preparedTransaction: IPreparedTransaction): Promise<Uint8Array>;
}
