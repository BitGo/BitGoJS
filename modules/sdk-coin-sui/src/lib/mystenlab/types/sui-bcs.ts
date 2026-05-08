import { BCS, EnumTypeDefinition, getSuiMoveConfig, StructTypeDefinition } from '@mysten/bcs';
import { SuiObjectRef } from './objects';

function registerUTF8String(bcs: BCS) {
  bcs.registerType(
    'utf8string',
    (writer, str) => {
      const bytes = Array.from(new TextEncoder().encode(str));
      return writer.writeVec(bytes, (writer, el) => writer.write8(el));
    },
    (reader) => {
      const bytes = reader.readVec((reader) => reader.read8());
      return new TextDecoder().decode(new Uint8Array(bytes));
    }
  );
}

/**
 * A reference to a shared object.
 */
export type SharedObjectRef = {
  /** Hex code as string representing the object id */
  objectId: string;

  /** The version the object was shared at */
  initialSharedVersion: number | string;

  /** Whether reference is mutable */
  mutable: boolean;
};

/**
 * An object argument.
 */
export type ObjectArg = { ImmOrOwned: SuiObjectRef } | { Shared: SharedObjectRef };

/**
 * A pure argument.
 */
export type PureArg = { Pure: ArrayLike<number> };

export function isPureArg(arg: any): arg is PureArg {
  return (arg as PureArg).Pure !== undefined;
}

/** Inner types for the FundsWithdrawal (BalanceWithdrawal) CallArg variant. */
export type BalanceWithdrawalReservation = { MaxAmountU64: string };
export type BalanceWithdrawalTypeArg = { Balance: TypeTag };
export type BalanceWithdrawalFrom = { Sender: null } | { Sponsor: null };

/**
 * An argument for a programmable transaction. Exactly one property must be set.
 *
 * - `Pure` — BCS-serialized bytes for a primitive value
 * - `Object` — a reference to an owned or shared object
 * - `BalanceWithdrawal` — a FundsWithdrawal (SIP-58) that draws from the sender's
 *   address balance at execution time; use with `0x2::coin::redeem_funds` to obtain
 *   a `Coin<T>` object
 */
export type CallArg =
  | PureArg
  | { Object: ObjectArg }
  | { BalanceWithdrawal: { reservation: BalanceWithdrawalReservation; typeArg: BalanceWithdrawalTypeArg; withdrawFrom: BalanceWithdrawalFrom } };

/**
 * Kind of a TypeTag which is represented by a Move type identifier.
 */
export type StructTag = {
  address: string;
  module: string;
  name: string;
  typeParams: TypeTag[];
};

/**
 * Sui TypeTag object. A decoupled `0x...::module::Type<???>` parameter.
 */
export type TypeTag =
  | { bool: null }
  | { u8: null }
  | { u64: null }
  | { u128: null }
  | { address: null }
  | { signer: null }
  | { vector: TypeTag }
  | { struct: StructTag }
  | { u16: null }
  | { u32: null }
  | { u256: null };

// ========== TransactionData ===========

/**
 * The GasData to be used in the transaction.
 */
export type GasData = {
  payment: SuiObjectRef[];
  owner: string; // Gas Object's owner
  price: number;
  budget: number;
};

type OptionU64 = { Some: number } | { None: null };

/**
 * ValidDuring expiration — used when gasData.payment is empty (address-balance-funded gas).
 * Both minEpoch and maxEpoch are Option<u64> matching the Sui protocol BCS layout.
 * minTimestamp/maxTimestamp are not yet used by the protocol and must be None.
 * chain is the Base58-encoded genesis checkpoint digest (32 bytes).
 * nonce (u32) prevents duplicate transaction digests across same-epoch builds.
 */
export type ValidDuringExpiration = {
  minEpoch: OptionU64;
  maxEpoch: OptionU64;
  minTimestamp: OptionU64;
  maxTimestamp: OptionU64;
  chain: string;
  nonce: number;
};

/**
 * TransactionExpiration
 *
 * Indications the expiration time for a transaction.
 */
export type TransactionExpiration = { None: null } | { Epoch: number | bigint | string } | { ValidDuring: ValidDuringExpiration };

// Move name of the Vector type.
const VECTOR = 'vector';

// Imported to explicitly tell typescript that types match
type TypeSchema = {
  structs?: { [key: string]: StructTypeDefinition };
  enums?: { [key: string]: EnumTypeDefinition };
  aliases?: { [key: string]: string };
};

const TransactionDataV1 = {
  kind: 'TransactionKind',
  sender: BCS.ADDRESS,
  gasData: 'GasData',
  expiration: 'TransactionExpiration',
};

const BCS_SPEC: TypeSchema = {
  enums: {
    'Option<T>': {
      None: null,
      Some: 'T',
    },
    ObjectArg: {
      ImmOrOwned: 'SuiObjectRef',
      Shared: 'SharedObjectRef',
    },
    CallArg: {
      Pure: [VECTOR, BCS.U8],
      Object: 'ObjectArg',
      BalanceWithdrawal: 'FundsWithdrawal',
    },
    Reservation: {
      MaxAmountU64: BCS.U64,
    },
    WithdrawalType: {
      Balance: 'TypeTag',
    },
    WithdrawFrom: {
      Sender: null,
      Sponsor: null,
    },
    TypeTag: {
      bool: null,
      u8: null,
      u64: null,
      u128: null,
      address: null,
      signer: null,
      vector: 'TypeTag',
      struct: 'StructTag',
      u16: null,
      u32: null,
      u256: null,
    },
    TransactionKind: {
      // can not be called from sui.js; dummy placement
      // to set the enum counter right for ProgrammableTransact
      ProgrammableTransaction: 'ProgrammableTransaction',
      ChangeEpoch: null,
      Genesis: null,
      ConsensusCommitPrologue: null,
    },
    TransactionExpiration: {
      None: null,
      Epoch: BCS.U64,
      ValidDuring: 'ValidDuringExpiration',
    },
    TransactionData: {
      V1: 'TransactionDataV1',
    },
  },
  structs: {
    FundsWithdrawal: {
      reservation: 'Reservation',
      typeArg: 'WithdrawalType',
      withdrawFrom: 'WithdrawFrom',
    },
    ValidDuringExpiration: {
      minEpoch: 'Option<u64>',
      maxEpoch: 'Option<u64>',
      minTimestamp: 'Option<u64>',
      maxTimestamp: 'Option<u64>',
      chain: 'ObjectDigest',
      nonce: BCS.U32,
    },
    SuiObjectRef: {
      objectId: BCS.ADDRESS,
      version: BCS.U64,
      digest: 'ObjectDigest',
    },
    SharedObjectRef: {
      objectId: BCS.ADDRESS,
      initialSharedVersion: BCS.U64,
      mutable: BCS.BOOL,
    },
    StructTag: {
      address: BCS.ADDRESS,
      module: BCS.STRING,
      name: BCS.STRING,
      typeParams: [VECTOR, 'TypeTag'],
    },
    GasData: {
      payment: [VECTOR, 'SuiObjectRef'],
      owner: BCS.ADDRESS,
      price: BCS.U64,
      budget: BCS.U64,
    },
    // Signed transaction data needed to generate transaction digest.
    SenderSignedData: {
      data: 'TransactionData',
      txSignatures: [VECTOR, [VECTOR, BCS.U8]],
    },
    TransactionDataV1,
  },
  aliases: {
    ObjectDigest: BCS.BASE58,
  },
};

const bcs = new BCS({ ...getSuiMoveConfig(), types: BCS_SPEC });
registerUTF8String(bcs);

export { bcs };
