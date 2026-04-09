import { array, boolean, define, Infer, integer, object, string, union } from 'superstruct';
import { normalizeSuiAddress, ObjectId, SharedObjectRef, SuiObjectRef, TypeTag } from '../types';
import { builder } from './bcs';

const ObjectArg = union([
  object({ ImmOrOwned: SuiObjectRef }),
  object({
    Shared: object({
      objectId: string(),
      initialSharedVersion: union([integer(), string()]),
      mutable: boolean(),
    }),
  }),
]);

// @mysten/bcs v0.7 decodes U64 as string; bigint/number are used at build time.
const bigintOrInteger = define<bigint | number | string>('bigintOrInteger', (value) => {
  if (typeof value === 'bigint') return true;
  if (typeof value === 'number') return Number.isInteger(value);
  if (typeof value === 'string') {
    try {
      BigInt(value);
      return true;
    } catch {
      return false;
    }
  }
  return false;
});

export const PureCallArg = object({ Pure: array(integer()) });
export const ObjectCallArg = object({ Object: ObjectArg });
export const BalanceWithdrawalCallArg = object({
  BalanceWithdrawal: object({
    amount: bigintOrInteger,
    // TypeTag is a recursive union; object() ensures the value is a non-null object
    // matching all TypeTag variants ({ bool: null }, { struct: StructTag }, etc.)
    type_: object(),
  }),
});
export type PureCallArg = Infer<typeof PureCallArg>;
export type ObjectCallArg = Infer<typeof ObjectCallArg>;
export type BalanceWithdrawalCallArg = Infer<typeof BalanceWithdrawalCallArg>;

export const BuilderCallArg = union([PureCallArg, ObjectCallArg, BalanceWithdrawalCallArg]);
export type BuilderCallArg = Infer<typeof BuilderCallArg>;

export const Inputs = {
  Pure(data: unknown, type?: string): PureCallArg {
    return {
      Pure: Array.from(data instanceof Uint8Array ? data : builder.ser(type!, data).toBytes()),
    };
  },
  ObjectRef(ref: SuiObjectRef): ObjectCallArg {
    return { Object: { ImmOrOwned: ref } };
  },
  SharedObjectRef(ref: SharedObjectRef): ObjectCallArg {
    return { Object: { Shared: ref } };
  },
  /**
   * Create a BalanceWithdrawal CallArg that withdraws `amount` from the sender's
   * address balance at execution time. Use with `0x2::coin::redeem_funds` to
   * convert the withdrawal into a `Coin<T>` object.
   *
   * @param amount - amount in base units (MIST for SUI)
   * @param type_ - the TypeTag of the coin (defaults to SUI)
   */
  BalanceWithdrawal(amount: bigint | number, type_: TypeTag): BalanceWithdrawalCallArg {
    return { BalanceWithdrawal: { amount, type_ } };
  },
};

export function getIdFromCallArg(arg: ObjectId | ObjectCallArg | BalanceWithdrawalCallArg): string {
  if (typeof arg === 'string') {
    return normalizeSuiAddress(arg);
  }
  if ('BalanceWithdrawal' in arg) {
    // BalanceWithdrawal inputs have no object ID; they cannot be deduplicated by ID
    return '';
  }
  if ('ImmOrOwned' in arg.Object) {
    return arg.Object.ImmOrOwned.objectId;
  }
  return arg.Object.Shared.objectId;
}

export function getSharedObjectInput(arg: BuilderCallArg): SharedObjectRef | undefined {
  return typeof arg === 'object' && 'Object' in arg && 'Shared' in arg.Object ? arg.Object.Shared : undefined;
}

export function isSharedObjectInput(arg: BuilderCallArg): boolean {
  return !!getSharedObjectInput(arg);
}

export function isMutableSharedObjectInput(arg: BuilderCallArg): boolean {
  return getSharedObjectInput(arg)?.mutable ?? false;
}
