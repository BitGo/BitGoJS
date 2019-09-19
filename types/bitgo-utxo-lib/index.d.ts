/**
 * @prettier
 */
import { BinaryLike } from 'crypto';

declare module 'bitgo-utxo-lib' {
  export class HDNode {
    static fromBase58(key: string): HDNode;
    static fromSeedHex(seed: string): HDNode;
    static fromSeedBuffer(seed: Buffer): HDNode;
    static HIGHEST_BIT: number;
    constructor(keypair: ECPair, chainCode: Buffer): ECPair;

    toBase58(): string;
    neutered(): HDNode;
    derive(index: number): HDNode;
    deriveHardened(index: number): HDNode;
    getFingerprint(): Buffer;

    keyPair: ECPair;
    chainCode: Buffer;
    depth: number;
    index: number;
    parentFingerprint: number;

    // bitgojs augmentation
    getKey: (network?: Network) => ECPair;
  }

  export class ECPair {
    static makeRandom({ network }: { network: Network }): ECPair;
    static fromWIF(wif: string, network: Network): ECPair;
    static fromPublicKeyBuffer(buffer: Buffer): ECPair;
    constructor(d: any, Q: any, options: any): ECPair;
    getPublicKeyBuffer(): Buffer;
    toWIF(): string;
    getAddress(): string;

    Q: any;
    d: any;
    __Q: any;
    network: Network;
    compressed: boolean;
  }

  export class Network {
    bech32: string;
    pubKeyHash: number;
    scriptHash: number;
    messagePrefix: string;
  }

  // eslint-disable-next-line @typescript-eslint/class-name-casing
  export class networks {
    static bitcoin: Network;
    static testnet: Network;
  }

  export class Transaction {
    static fromHex(hex: string, network?: Network): Transaction;
    static SIGHASH_ALL: number;
    static SIGHASH_BITCOINCASHBIP143: number;

    toHex(): string;
    outs: {
      script: string;
      value: number;
    }[];
    ins: {}[];
  }

  export interface Address {
    version: number;
    prefix: string;
    toBase58Check(): string;
  }

  // eslint-disable-next-line @typescript-eslint/class-name-casing
  export class address {
    static fromBase58Check(address: string): Address;
    static fromBech32(address: string): Address;
    static fromOutputScript(script: string, network?: Network): Address;
    static toOutputScript(address: string, network?: Network): Buffer;
  }

  export class TransactionBuilder {
    static fromTransaction(transaction: Transaction, network: Network): TransactionBuilder;
    constructor(network?: Network): TransactionBuilder;
    sign(index: number, privKey: string, subscript?: Buffer, sigHash?: number, value?: number, witness?: Buffer): void;
    addInput(txHash: string | Buffer | Transaction, vout: number, sequence?: number, prevOutScript?: Buffer): void;
    build(): Transaction;

    tx: Transaction;
    inputs: {
      signatures: string[];
    }[];
  }

  // eslint-disable-next-line @typescript-eslint/class-name-casing
  export class crypto {
    static sha256(buffer: BinaryLike): Buffer;
    static hash256(buffer: BinaryLike): Buffer;
    static hash160(buffer: BinaryLike): Buffer;
  }

  class ScriptImplementation {
    output: {
      encode(script: Buffer): Buffer;
    }
  }

  // eslint-disable-next-line @typescript-eslint/class-name-casing
  export class script {
    static witnessScriptHash: ScriptImplementation;
    static pubKeyHash: ScriptImplementation;
    static scriptHash: ScriptImplementation;
    static multisig: {
      output: {
        encode(m: number, script: Buffer[]): Buffer;
      }
    };
    static types: {
      P2PKH: string;
      P2SH: string;
      P2WSH: string;
    };
    static classifyWitness(script: string, something: boolean): InputClassification;
    static classifyInput(script: string, something: boolean): InputClassification;
    static compile(script: Buffer): string;
    static decompile(script: Buffer): Buffer;
    static fromASM(script: string): Buffer;
  }
}
