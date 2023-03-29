import {
  any,
  array,
  assign,
  boolean,
  Infer,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
  is,
} from 'superstruct';
import { ObjectId, ObjectOwner, SequenceNumber, TransactionDigest } from './common';
import { OwnedObjectRef } from './transactions';

export const ObjectType = union([string(), literal('package')]);
export type ObjectType = Infer<typeof ObjectType>;

export const SuiObjectRef = object({
  /** Base64 string representing the object digest */
  digest: TransactionDigest,
  /** Hex code as string representing the object id */
  objectId: string(),
  /** Object version */
  version: union([number(), string()]),
});
export type SuiObjectRef = Infer<typeof SuiObjectRef>;

export const SuiGasData = object({
  payment: array(SuiObjectRef),
  /** Gas Object's owner */
  owner: string(),
  price: number(),
  budget: number(),
});
export type SuiGasData = Infer<typeof SuiGasData>;

export const SuiObjectInfo = assign(
  SuiObjectRef,
  object({
    type: string(),
    owner: ObjectOwner,
    previousTransaction: TransactionDigest,
  })
);
export type SuiObjectInfo = Infer<typeof SuiObjectInfo>;

export const ObjectContentFields = record(string(), any());
export type ObjectContentFields = Infer<typeof ObjectContentFields>;

export const MovePackageContent = record(string(), string());
export type MovePackageContent = Infer<typeof MovePackageContent>;

export const SuiMoveObject = object({
  /** Move type (e.g., "0x2::coin::Coin<0x2::sui::SUI>") */
  type: string(),
  /** Fields and values stored inside the Move object */
  fields: ObjectContentFields,
  hasPublicTransfer: boolean(),
});
export type SuiMoveObject = Infer<typeof SuiMoveObject>;

export const SuiMovePackage = object({
  /** A mapping from module name to disassembled Move bytecode */
  disassembled: MovePackageContent,
});
export type SuiMovePackage = Infer<typeof SuiMovePackage>;

export const SuiParsedData = union([
  assign(SuiMoveObject, object({ dataType: literal('moveObject') })),
  assign(SuiMovePackage, object({ dataType: literal('package') })),
]);
export type SuiParsedData = Infer<typeof SuiParsedData>;

export const SuiRawMoveObject = object({
  /** Move type (e.g., "0x2::coin::Coin<0x2::sui::SUI>") */
  type: string(),
  hasPublicTransfer: boolean(),
  version: SequenceNumber,
  bcsBytes: array(number()),
});
export type SuiRawMoveObject = Infer<typeof SuiRawMoveObject>;

export const SuiRawMovePackage = object({
  id: ObjectId,
  /** A mapping from module name to Move bytecode enocded in base64*/
  moduleMap: record(string(), string()),
});
export type SuiRawMovePackage = Infer<typeof SuiRawMovePackage>;

// TODO(chris): consolidate SuiRawParsedData and SuiRawObject using generics
export const SuiRawData = union([
  assign(SuiMoveObject, object({ dataType: literal('moveObject') })),
  assign(SuiRawMovePackage, object({ dataType: literal('package') })),
]);
export type SuiRawData = Infer<typeof SuiRawData>;

export const MIST_PER_SUI = BigInt(1000000000);

export const ObjectDigest = string();
export type ObjectDigest = Infer<typeof ObjectDigest>;

export const SuiObjectData = object({
  objectId: ObjectId,
  version: SequenceNumber,
  digest: ObjectDigest,
  /**
   * Type of the object, default to be undefined unless SuiObjectDataOptions.showType is set to true
   */
  type: optional(string()),
  /**
   * Move object content or package content, default to be undefined unless SuiObjectDataOptions.showContent is set to true
   */
  content: optional(SuiParsedData),
  /**
   * Move object content or package content in BCS bytes, default to be undefined unless SuiObjectDataOptions.showBcs is set to true
   */
  bcs: optional(SuiRawData),
  /**
   * The owner of this object. Default to be undefined unless SuiObjectDataOptions.showOwner is set to true
   */
  owner: optional(ObjectOwner),
  /**
   * The digest of the transaction that created or last mutated this object.
   * Default to be undefined unless SuiObjectDataOptions.showPreviousTransaction is set to true
   */
  previousTransaction: optional(TransactionDigest),
  /**
   * The amount of SUI we would rebate if this object gets deleted.
   * This number is re-calculated each time the object is mutated based on
   * the present storage gas price.
   * Default to be undefined unless SuiObjectDataOptions.showStorageRebate is set to true
   */
  storageRebate: optional(number()),
  /**
   * Display metadata for this object, default to be undefined unless SuiObjectDataOptions.showDisplay is set to true
   * This can also be None if the struct type does not have Display defined
   * See more details in https://forums.sui.io/t/nft-object-display-proposal/4872
   */
  display: optional(record(string(), string())),
});
export type SuiObjectData = Infer<typeof SuiObjectData>;

/**
 * Config for fetching object data
 */
export const SuiObjectDataOptions = object({
  /* Whether to fetch the object type, default to be true */
  showType: optional(boolean()),
  /* Whether to fetch the object content, default to be false */
  showContent: optional(boolean()),
  /* Whether to fetch the object content in BCS bytes, default to be false */
  showBcs: optional(boolean()),
  /* Whether to fetch the object owner, default to be false */
  showOwner: optional(boolean()),
  /* Whether to fetch the previous transaction digest, default to be false */
  showPreviousTransaction: optional(boolean()),
  /* Whether to fetch the storage rebate, default to be false */
  showStorageRebate: optional(boolean()),
  /* Whether to fetch the display metadata, default to be false */
  showDisplay: optional(boolean()),
});
export type SuiObjectDataOptions = Infer<typeof SuiObjectDataOptions>;

export const ObjectStatus = union([literal('Exists'), literal('NotExists'), literal('Deleted')]);
export type ObjectStatus = Infer<typeof ObjectStatus>;

export const GetOwnedObjectsResponse = array(SuiObjectInfo);
export type GetOwnedObjectsResponse = Infer<typeof GetOwnedObjectsResponse>;

export const SuiObjectResponseError = object({
  tag: string(),
  object_id: optional(ObjectId),
  version: optional(SequenceNumber),
  digest: optional(ObjectDigest),
});
export type SuiObjectResponseError = Infer<typeof SuiObjectResponseError>;

export const SuiObjectResponse = object({
  data: optional(SuiObjectData),
  error: optional(SuiObjectResponseError),
});
export type SuiObjectResponse = Infer<typeof SuiObjectResponse>;

export type Order = 'ascending' | 'descending';

/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

/* -------------------------- SuiObjectResponse ------------------------- */

export function getSuiObjectData(resp: SuiObjectResponse): SuiObjectData | undefined {
  return resp.data;
}

export function getObjectDeletedResponse(resp: SuiObjectResponse): SuiObjectRef | undefined {
  if (resp.error && 'object_id' in resp.error && 'version' in resp.error && 'digest' in resp.error) {
    const error = resp.error as SuiObjectResponseError;
    return {
      objectId: error.object_id,
      version: error.version,
      digest: error.digest,
    } as SuiObjectRef;
  }

  return undefined;
}

export function getObjectNotExistsResponse(resp: SuiObjectResponse): ObjectId | undefined {
  if (resp.error && 'object_id' in resp.error && !('version' in resp.error) && !('digest' in resp.error)) {
    return (resp.error as SuiObjectResponseError).object_id as ObjectId;
  }

  return undefined;
}

export function getObjectReference(resp: SuiObjectResponse | OwnedObjectRef): SuiObjectRef | undefined {
  if ('reference' in resp) {
    return resp.reference;
  }
  const exists = getSuiObjectData(resp);
  if (exists) {
    return {
      objectId: exists.objectId,
      version: exists.version,
      digest: exists.digest,
    };
  }
  return getObjectDeletedResponse(resp);
}

/* ------------------------------ SuiObjectRef ------------------------------ */

export function getObjectId(data: SuiObjectResponse | SuiObjectRef | OwnedObjectRef): ObjectId {
  if ('objectId' in data) {
    return data.objectId;
  }
  return getObjectReference(data)?.objectId ?? getObjectNotExistsResponse(data as SuiObjectResponse)!;
}

export function getObjectVersion(data: SuiObjectResponse | SuiObjectRef | SuiObjectData): string | number | undefined {
  if ('version' in data) {
    return data.version;
  }
  return getObjectReference(data)?.version;
}

/* -------------------------------- SuiObject ------------------------------- */

export function isSuiObjectResponse(resp: SuiObjectResponse | SuiObjectData): resp is SuiObjectResponse {
  return (resp as SuiObjectResponse).data !== undefined;
}

/**
 * Deriving the object type from the object response
 * @returns 'package' if the object is a package, move object type(e.g., 0x2::coin::Coin<0x2::sui::SUI>)
 * if the object is a move object
 */
export function getObjectType(resp: SuiObjectResponse | SuiObjectData): ObjectType | undefined {
  const data = isSuiObjectResponse(resp) ? resp.data : resp;

  if (!data?.type && 'data' in resp) {
    if (data?.content?.dataType === 'package') {
      return 'package';
    }
    return getMoveObjectType(resp);
  }
  return data?.type;
}

export function getObjectPreviousTransactionDigest(resp: SuiObjectResponse): TransactionDigest | undefined {
  return getSuiObjectData(resp)?.previousTransaction;
}

export function getObjectOwner(resp: SuiObjectResponse | ObjectOwner): ObjectOwner | undefined {
  if (is(resp, ObjectOwner)) {
    return resp;
  }
  return getSuiObjectData(resp)?.owner;
}

export function getObjectDisplay(resp: SuiObjectResponse): Record<string, string> | undefined {
  return getSuiObjectData(resp)?.display;
}

export function getSharedObjectInitialVersion(resp: SuiObjectResponse | ObjectOwner): number | undefined {
  const owner = getObjectOwner(resp);
  if (typeof owner === 'object' && 'Shared' in owner) {
    return owner.Shared.initial_shared_version;
  } else {
    return undefined;
  }
}

export function isSharedObject(resp: SuiObjectResponse | ObjectOwner): boolean {
  const owner = getObjectOwner(resp);
  return typeof owner === 'object' && 'Shared' in owner;
}

export function isImmutableObject(resp: SuiObjectResponse | ObjectOwner): boolean {
  const owner = getObjectOwner(resp);
  return owner === 'Immutable';
}

export function getMoveObjectType(resp: SuiObjectResponse): string | undefined {
  return getMoveObject(resp)?.type;
}

export function getObjectFields(
  resp: SuiObjectResponse | SuiMoveObject | SuiObjectData
): ObjectContentFields | undefined {
  if ('fields' in resp) {
    return resp.fields;
  }
  return getMoveObject(resp)?.fields;
}

export interface SuiObjectDataWithContent extends SuiObjectData {
  content: SuiParsedData;
}

function isSuiObjectDataWithContent(data: SuiObjectData): data is SuiObjectDataWithContent {
  return data.content !== undefined;
}

export function getMoveObject(data: SuiObjectResponse | SuiObjectData): SuiMoveObject | undefined {
  const suiObject = 'data' in data ? getSuiObjectData(data) : (data as SuiObjectData);

  if (!suiObject || !isSuiObjectDataWithContent(suiObject) || suiObject.content.dataType !== 'moveObject') {
    return undefined;
  }

  return suiObject.content as SuiMoveObject;
}

export function hasPublicTransfer(data: SuiObjectResponse | SuiObjectData): boolean {
  return getMoveObject(data)?.hasPublicTransfer ?? false;
}

export function getMovePackageContent(data: SuiObjectResponse | SuiMovePackage): MovePackageContent | undefined {
  if ('disassembled' in data) {
    return data.disassembled;
  }
  const suiObject = getSuiObjectData(data);
  if (suiObject?.content?.dataType !== 'package') {
    return undefined;
  }
  return (suiObject.content as SuiMovePackage).disassembled;
}

export const CheckpointedObjectId = object({
  objectId: ObjectId,
  atCheckpoint: optional(number()),
});
export type CheckpointedObjectId = Infer<typeof CheckpointedObjectId>;

export const PaginatedObjectsResponse = object({
  data: array(SuiObjectResponse),
  nextCursor: optional(CheckpointedObjectId),
  hasNextPage: boolean(),
});
export type PaginatedObjectsResponse = Infer<typeof PaginatedObjectsResponse>;

// mirrors sui_json_rpc_types:: SuiObjectDataFilter
export type SuiObjectDataFilter =
  | { Package: ObjectId }
  | { MoveModule: { package: ObjectId; module: string } }
  | { StructType: string };

export type SuiObjectResponseQuery = {
  filter?: SuiObjectDataFilter;
  options?: SuiObjectDataOptions;
};
