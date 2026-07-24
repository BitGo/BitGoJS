import * as t from 'io-ts';

// type definitions for user verification elements (returned by liability proofs route)
export const BalancesCodec = t.type({
  Asset: t.string,
  Amount: t.string,
});

export type Balance = t.TypeOf<typeof BalancesCodec>;

export const LowerProof = t.type({
  Proof: t.string,
  VerificationKey: t.string,
  MerkleRoot: t.string,
  MerkleRootWithAssetSumHash: t.string,
  MerklePath: t.array(t.string),
  MerklePosition: t.number,
});

export type LowerProof = t.TypeOf<typeof LowerProof>;

export const TopProof = t.type({
  Proof: t.string,
  VerificationKey: t.string,
  MerkleRoot: t.string,
  MerkleRootWithAssetSumHash: t.string,
  AssetSum: t.array(BalancesCodec),
});

export type TopProof = t.TypeOf<typeof TopProof>;

export const UserVerificationElements = t.type({
  AccountInfo: t.type({
    WalletId: t.string,
    Balance: t.array(BalancesCodec),
  }),
  ProofInfo: t.type({
    UserMerklePath: t.array(t.string),
    UserMerklePosition: t.number,
    BottomProof: LowerProof,
    MiddleProof: LowerProof,
    TopProof: TopProof,
  }),
});

export type UserVerificationElements = t.TypeOf<typeof UserVerificationElements>;

// type definitions for account snapshots
export const SnapshotBalance = t.type({
  asset: t.string,
  amount: t.string,
});

export type SnapshotBalance = t.TypeOf<typeof SnapshotBalance>;

export const AccountSnapshot = t.type({
  snapshotDate: t.string,
  balances: t.array(SnapshotBalance),
});

export type AccountSnapshot = t.TypeOf<typeof AccountSnapshot>;
