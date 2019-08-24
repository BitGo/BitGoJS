import { Network } from "src/types/bitgo-utxo-lib";

declare module 'src/types/bitgo-utxo-lib' {
  // HDNode from bitgo-utxo-lib
  export class HDNode {
    static fromBase58: (key: string) => HDNode;
    toBase58(): string;
    neutered(): HDNode;
    keyPair: KeyPair;

    // bitgojs augmentation
    getKey: (network: Network) => ECPair;
  }

  export class ECPair {
    static makeRandom: ({ network: Network }) => ECPair;
  }

  export class KeyPair {

  }

  export class Network {
    bech32: string;
  }

  export class networks {
    [index: string]: Network;
    bitcoin: Network;
    testnet: Network;
  }

  export class Transaction {
    static fromHex(hex: string, network: Network)
    static SIGHASH_ALL: number;
  }

  export interface Address {
    version: number;
    prefix: string;
  }
  export class address {
    static fromBase58Check: (address: string) => Address;
    static fromBech32: (address: string) => Address;
    static fromOutputScript: (script: string, network: Network) => Address;
  }

  export class TransactionBuilder {
    static fromTransaction(transaction: Transaction, network: Network): TransactionBuilder;
    sign: (index: number, privKey: string) => void;
  }

  export class crypto {
    static sha256: (buffer: Buffer) => Buffer;
    static hash160: (buffer: Buffer) => Buffer;
  }

  class ScriptImplementation {
    output: {
      encode: (script: Buffer) => void;
    }
  }

  export class script {
    static witnessScriptHash: ScriptImplementation;
    static pubKeyHash: ScriptImplementation;
    static scriptHash: ScriptImplementation;
    static types: {
      P2PKH: string;
      P2SH: string;
      P2PKH: string;
      P2WSH: string;
    };
    static classifyWitness: (script: string, something: boolean) => InputClassification;
    static classifyInput: (script: string, something: boolean) => InputClassification;
    static classifyWitness: (script: string, something: boolean) => InputClassification;
    static compile: (script: Buffer) => string;
    static decompile: (script: Buffer) => Buffer;
  }
}
