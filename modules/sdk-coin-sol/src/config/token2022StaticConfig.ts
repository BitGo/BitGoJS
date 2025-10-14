import type { Token2022Config } from '../lib/token2022Config';

export const TOKEN_2022_STATIC_CONFIGS: Token2022Config[] = [
  {
    mintAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6',
    transferHook: {
      extraAccountMetas: [
        {
          pubkey: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ',
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A',
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm',
          isSigner: false,
          isWritable: false,
        },
      ],
    },
  },
  {
    mintAddress: '3BW95VLH2za2eUQ1PGfjxwMbpsnDFnmkA7m5LDgMKbX7',
    transferHook: {
      extraAccountMetas: [
        {
          pubkey: 'GbQ8ZiEFzGGTeYoXwtZtcoxwPcMyUcmZDduMVNdUPKpX',
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: '2Te6MFDwstRP2sZi6DLbkhVcSfaQVffmpbudN6pmvAXo',
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: 'FR5YBEisx8mDe4ruhWKmpH5nirdJopj4uStBAVufqjMo',
          isSigner: false,
          isWritable: false,
        },
      ],
    },
  },
];
