/**
 * Commitment type IDs matching the Irys protocol.
 * STAKE is a flat value in RLP encoding.
 * PLEDGE is encoded as a nested array.
 */
export enum CommitmentTypeId {
  STAKE = 1,
  PLEDGE = 2,
}

export type StakeCommitmentType = { type: CommitmentTypeId.STAKE };
export type PledgeCommitmentType = { type: CommitmentTypeId.PLEDGE; pledgeCount: bigint };

export type CommitmentType = StakeCommitmentType | PledgeCommitmentType;

/** Version 2 is the current commitment transaction version */
export const COMMITMENT_TX_VERSION = 2;

/** Irys chain IDs */
export const IRYS_MAINNET_CHAIN_ID = 3282n;
export const IRYS_TESTNET_CHAIN_ID = 1270n;

/**
 * The 7 fields of an unsigned commitment transaction,
 * in the exact order required for RLP encoding.
 */
export interface CommitmentTransactionFields {
  version: number; // 1 byte, always 2 (V2)
  anchor: Uint8Array; // 32 bytes (block hash from /v1/anchor)
  signer: Uint8Array; // 20 bytes (Ethereum address)
  commitmentType: CommitmentType;
  chainId: bigint;
  fee: bigint;
  value: bigint;
}

/**
 * JSON payload for broadcasting a signed commitment transaction
 * via POST /v1/commitment-tx
 */
export interface EncodedSignedCommitmentTransaction {
  version: number;
  anchor: string; // base58
  signer: string; // base58
  commitmentType: EncodedCommitmentType;
  chainId: string; // decimal string
  fee: string; // decimal string
  value: string; // decimal string
  id: string; // base58(keccak256(signature))
  signature: string; // base58(65-byte raw signature)
}

export type EncodedCommitmentType = { type: 'stake' } | { type: 'pledge'; pledgeCountBeforeExecuting: string };

/**
 * Anchor info returned by GET /v1/anchor
 */
export interface AnchorInfo {
  blockHash: string; // base58-encoded 32-byte block hash
}

/**
 * Build result from the commitment transaction builder (wallet-platform / standard coin pattern).
 * Exposes serializedTxHex and signableHex for the signing pipeline and coinSpecific for HSM routing.
 */
export interface CommitmentTransactionBuildResult {
  /** Hex string of the RLP-encoded commitment transaction */
  serializedTxHex: string;
  /** Hex string of the prehash (keccak256 of RLP-encoded tx) for signing */
  signableHex: string;
  /** The transaction fields (for broadcast payload creation if needed) */
  fields: CommitmentTransactionFields;
  /** Coin-specific data for signing pipeline (e.g. keyServerPathPrefix for HSM routing) */
  coinSpecific: {
    keyServerPathPrefix: 'irys';
  };
}

/**
 * Result after signing. Contains everything needed for broadcast.
 */
export interface SignedCommitmentTransactionResult {
  /** Transaction ID: base58(keccak256(signature)) */
  txId: string;
  /** 65-byte raw ECDSA signature (r || s || v) */
  signature: Uint8Array;
  /** JSON payload ready for POST /v1/commitment-tx */
  broadcastPayload: EncodedSignedCommitmentTransaction;
}
