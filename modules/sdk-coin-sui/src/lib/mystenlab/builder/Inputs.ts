// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { array, bigint, boolean, Infer, integer, object, string, union } from 'superstruct';
import { ObjectId, SharedObjectRef, SuiObjectRef } from '../types';
import { builder } from './bcs';

const ObjectArg = union([
  object({ ImmOrOwned: SuiObjectRef }),
  object({
    Shared: object({
      objectId: string(),
      initialSharedVersion: union([bigint(), integer()]),
      mutable: boolean(),
    }),
  }),
]);

export const PureCallArg = object({ Pure: array(integer()) });
export const ObjectCallArg = object({ Object: ObjectArg });
export type PureCallArg = Infer<typeof PureCallArg>;
export type ObjectCallArg = Infer<typeof ObjectCallArg>;

export const BuilderCallArg = union([PureCallArg, ObjectCallArg]);
export type BuilderCallArg = Infer<typeof BuilderCallArg>;

export const Inputs = {
  Pure(type: string, data: unknown): PureCallArg {
    return { Pure: Array.from(builder.ser(type, data).toBytes()) };
  },
  ObjectRef(ref: SuiObjectRef): ObjectCallArg {
    return { Object: { ImmOrOwned: ref } };
  },
  SharedObjectRef(ref: SharedObjectRef): ObjectCallArg {
    return { Object: { Shared: ref } };
  },
};

export function getIdFromCallArg(arg: ObjectId | ObjectCallArg) {
  if (typeof arg === 'string') {
    return arg;
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
  return getSharedObjectInput(arg) !== undefined;
}

export function isMutableSharedObjectInput(arg: BuilderCallArg): boolean {
  return getSharedObjectInput(arg)?.mutable ?? false;
}
