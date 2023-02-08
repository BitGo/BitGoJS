import joi from 'joi';

const SuiObjectRefSchema = joi.object({
  objectId: joi.string().required(),
  version: joi.number().required(),
  digest: joi.string().required(),
});

const SharedObjectRefSchema = joi.object({
  objectId: joi.string().required(),
  initialSharedVersion: joi.number().required(),
});

const ImmOrOwnedArgSchema = joi.object({
  ImmOrOwned: SuiObjectRefSchema.required(),
});

const SharedArgSchema = joi.object({
  Shared: SharedObjectRefSchema.required(),
});

const ObjectArgSchema = joi.alternatives().try(ImmOrOwnedArgSchema, SharedArgSchema);

const ObjVecArgSchema = joi.object({
  ObjVec: joi.array().items(ObjectArgSchema).required(),
});

const CallArgSchema = joi.alternatives().try(
  joi.object({
    Pure: joi.array().items(joi.number()).required(),
  }),
  joi.object({
    Object: ObjectArgSchema.required(),
  }),
  ObjVecArgSchema
);

const SuiJsonValueSchema = joi
  .alternatives()
  .try(
    joi.boolean(),
    joi.number(),
    joi.string(),
    SuiObjectRefSchema,
    SharedObjectRefSchema,
    CallArgSchema,
    joi.array().items(joi.any())
  );

const StructTagSchema = joi.object({
  address: joi.string().required(),
  module: joi.string().required(),
  name: joi.string().required(),
  typeParams: joi.array().items(joi.any()).optional(),
});

const TypeTagSchema = joi
  .alternatives()
  .try(
    joi.object({ bool: joi.equal(null).required() }),
    joi.object({ u8: joi.equal(null).required() }),
    joi.object({ u64: joi.equal(null).required() }),
    joi.object({ u128: joi.equal(null).required() }),
    joi.object({ address: joi.equal(null).required() }),
    joi.object({ signer: joi.equal(null).required() }),
    joi.object({ vector: joi.any().required() }),
    joi.object({ struct: StructTagSchema.required() }),
    joi.object({ u16: joi.equal(null).required() }),
    joi.object({ u32: joi.equal(null).required() }),
    joi.object({ u256: joi.equal(null).required() })
  );

const TypeArgumentsSchema = joi.array().items(TypeTagSchema).required();
const RequestAddDelegationArgumentsSchema = joi.array().length(4).items(SuiJsonValueSchema).required();

export const RequestAddDelegationTransactionSchema = joi.object({
  package: joi.alternatives(SuiObjectRefSchema).match('one').required(),
  module: joi.string().required(),
  function: joi.string().required(),
  typeArguments: TypeArgumentsSchema.optional(),
  arguments: RequestAddDelegationArgumentsSchema.required(),
});

export const StakeTransactionSchema = joi.alternatives(RequestAddDelegationTransactionSchema).match('one');
export const SuiMoveCallTransactionSchema = joi.object({
  type: joi.string().required(),
  sender: joi.string().required(),
  tx: joi.alternatives(RequestAddDelegationTransactionSchema).match('one').required(),
  gasBudget: joi.number().required(),
  gasPrice: joi.number().required(),
  gasPayment: joi.alternatives(SuiObjectRefSchema).match('one').required(),
});
