import 'ethereumjs-util';
import BN from 'bn.js';

// Why are all these function types missing from @types/ethereumjs-util???
declare module 'ethereumjs-util' {
  function intToHex(num: number): string;
  function pubToAddress(pubKey: Buffer, sanitize: boolean = false): Buffer;
  const publicToAddress = pubToAddress;
  function stripHexPrefix(hexPrefixedString: string): string;
  function stripZeros<T extends number[] | Buffer | string>(input: T): T;
  function toBuffer(input?: unknown): Buffer;
  function setLengthLeft(msg: Buffer, length: number): Buffer;
  const BN: typeof BN;
/*
  function addHexPrefix(unprefixedString: string): string;
  function bufferToHex(buffer: Buffer): string;
  function bufferToInt(buffer: Buffer): number;
  function generateAddress(from: Buffer, nonce: Buffer): Buffer;
  function isValidAddress(hexAddress: string): boolean;
 */
}
