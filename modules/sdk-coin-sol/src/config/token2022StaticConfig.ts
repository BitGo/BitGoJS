import type { Token2022Config } from '../lib/token2022Config';

export const TOKEN_2022_STATIC_CONFIGS: Token2022Config[] = [
  {
    mintAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
    symbol: 'tbill',
    name: 'OpenEden T-Bills',
    decimals: 6,
    programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    transferHook: {
      programId: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A',
      authority: 'CPNEkz5SaAcWqGMezXTti39ekErzMpDCtuPMGw9tt4CZ',
      extraAccountMetas: [
        {
          pubkey: '4zDeEh2D6K39H8Zzn99CpQkaUApbpUWfbCgqbwgZ2Yf',
          isSigner: false,
          isWritable: true,
        },
      ],
      extraAccountMetasPDA: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm',
    },
  },
  {
    mintAddress: '3BW95VLH2za2eUQ1PGfjxwMbpsnDFnmkA7m5LDgMKbX7',
    symbol: 't1test',
    name: 'T1TEST',
    decimals: 6,
    programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    transferHook: {
      programId: '2Te6MFDwstRP2sZi6DLbkhVcSfaQVffmpbudN6pmvAXo',
      authority: 'BLZvvaQgPUvL2RWoJeovudbHMhqH4S3kdenN5eg1juDr',
      extraAccountMetas: [
        {
          pubkey: '4zDeEh2D6K39H8Zzn99CpQkaUApbpUWfbCgqbwgZ2Yf',
          isSigner: false,
          isWritable: true,
        },
      ],
      extraAccountMetasPDA: 'FR5YBEisx8mDe4ruhWKmpH5nirdJopj4uStBAVufqjMo',
    },
  },
];
