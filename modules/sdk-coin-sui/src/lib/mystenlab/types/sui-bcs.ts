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

/**
 * An argument for the transaction. It is a 'meant' enum which expects to have
 * one of the optional properties. If not, the BCS error will be thrown while
 * attempting to form a transaction.
 *
 * Example:
 * ```js
 * let arg1: CallArg = { Object: { Shared: {
 *   objectId: '5460cf92b5e3e7067aaace60d88324095fd22944',
 *   initialSharedVersion: 1,
 *   mutable: true,
 * } } };
 * let arg2: CallArg = { Pure: bcs.ser(BCS.STRING, 100000).toBytes() };
 * let arg3: CallArg = { Object: { ImmOrOwned: {
 *   objectId: '4047d2e25211d87922b6650233bd0503a6734279',
 *   version: 1,
 *   digest: 'bCiANCht4O9MEUhuYjdRCqRPZjr2rJ8MfqNiwyhmRgA='
 * } } };
 * ```
 *
 * For `Pure` arguments BCS is required. You must encode the values with BCS according
 * to the type required by the called function. Pure accepts only serialized values
 */
export type CallArg = PureArg | { Object: ObjectArg } | { BalanceWithdrawal: { amount: bigint | number; type_: TypeTag } };

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

/**
 * ValidDuring expiration — used when gasData.payment is empty (address-balance-funded gas).
 * Both minEpoch and maxEpoch must be set; maxEpoch must equal minEpoch or minEpoch + 1.
 * The nonce (u32) prevents duplicate transaction digests across same-epoch builds.
 */
export type ValidDuringExpiration = {
  minEpoch: number;
  maxEpoch: number;
  chain: string;
  nonce: number;
};

/**
 * TransactionExpiration
 *
 * Indications the expiration time for a transaction.
 */
export type TransactionExpiration = { None: null } | { Epoch: number } | { ValidDuring: ValidDuringExpiration };

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
      ObjVec: [VECTOR, 'ObjectArg'],
      BalanceWithdrawal: 'BalanceWithdrawal',
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
    BalanceWithdrawal: {
      amount: BCS.U64,
      type_: 'TypeTag',
    },
    ValidDuringExpiration: {
      minEpoch: BCS.U64,
      maxEpoch: BCS.U64,
      chain: BCS.STRING,
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
