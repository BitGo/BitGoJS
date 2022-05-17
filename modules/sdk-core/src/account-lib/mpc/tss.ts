import { HDTree } from './hdTree';

export interface UShare {
  i: number;
  t: number;
  n: number;
  y: string;
  seed: string;
  chaincode: string;
}

export interface YShare {
  i: number;
  j: number;
  y: string;
  u: string;
  chaincode: string;
}

export interface KeyShare {
  uShare: UShare;
  yShares: Record<number, YShare>;
}

export interface PShare {
  i: number;
  t: number;
  n: number;
  y: string;
  u: string;
  prefix: string;
  chaincode: string;
}

export interface JShare {
  i: number;
  j: number;
}

interface KeyCombine {
  pShare: PShare;
  jShares: Record<number, JShare>;
}

interface SubkeyShare {
  pShare: PShare;
  yShares: Record<number, YShare>;
}

export interface XShare {
  i: number;
  y: string;
  u: string;
  r: string;
  R: string;
}

export interface RShare {
  i: number;
  j: number;
  u: string;
  r: string;
  R: string;
}

export interface SignShare {
  xShare: XShare;
  rShares: Record<number, RShare>;
}

export interface GShare {
  i: number;
  y: string;
  gamma: string;
  R: string;
}

interface Signature {
  y: string;
  R: string;
  sigma: string;
}

export interface IEddsa {
  initialize(hdTree: HDTree): Promise<IEddsa>;
  keyShare(index: number, threshold: number, numShares: number, seed: Buffer): KeyShare;
  keyCombine(uShare: UShare, yShares: YShare[]): KeyCombine;
  deriveUnhardened(commonKeychain: string, path: string): string;
  keyDerive(uShare: UShare, yShares: YShare[], path: string): SubkeyShare;
  signShare(message: Buffer, pShare: PShare, jShares: JShare[]): SignShare;
  sign(message: Buffer, playerShare: XShare, rShares: RShare[], yShares: YShare[]): GShare;
  signCombine(shares: GShare[]): Signature;
  verify(message: Buffer, signature: Signature): Buffer;
}
