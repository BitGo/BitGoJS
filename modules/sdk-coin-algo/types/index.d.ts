// TODO: Remove augmentation after algosdk fork is completely replaced by
// account lib.
declare module 'algosdk' {
  interface Encoding {
    decode(_: unknown): any;
  }

  interface Seed {
    encode(secretKey: unknown): string;
    decode(seed: unknown): {
      checksum: Uint8Array;
      seed: Uint8Array;
    };
  }

  interface Address {
    decode(address: unknown): {
      publicKey: Uint8Array;
      checksum: Uint8Array;
    };
    encode(address: unknown): string;
  }

  class MultiSigTransaction {
    static from_obj_for_encoding(txnForEnc: unknown): any;
  }

  interface Multisig {
    MultiSigTransaction: typeof MultiSigTransaction;
  }

  interface Nacl {
    sign(msg: unknown, secretKey: unknown): Uint8Array;
    verify(msg: unknown, sig: unknown, publicKey: unknown): boolean;
  }

  export function generateAccountFromSeed(seed: Uint8Array | string): {
    sk: string;
    addr: string;
  };

  export function isValidSeed(seed: string): boolean;

  export function isValidAddress(address: string): boolean;

  export interface Account {
    addr: string;
    sk: Uint8Array;
  }

  export function generateAccount(): Account;

  export function mergeMultisigTransactions(multisigTxnBlobs: Uint8Array[]): Uint8Array;

  export const Encoding: Encoding;
  export const Seed: Seed;
  export const Address: Address;
  export const Multisig: Multisig;
  export const NaclWrapper: Nacl;
}
