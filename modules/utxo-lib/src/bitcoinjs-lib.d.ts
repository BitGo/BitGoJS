/*
For unclear reasons, type definitions for sources in `bitcoinjs-lib/src/*` do not get picked up
 */

declare module 'bitcoinjs-lib/src/bufferutils' {
  export * from 'bitcoinjs-lib/types/bufferutils';
}

declare module 'bitcoinjs-lib/src/script_signature' {
  export * from 'bitcoinjs-lib/types/script_signature';
}

declare module 'bitcoinjs-lib/src/types' {
  export * from 'bitcoinjs-lib/types/types';
}
