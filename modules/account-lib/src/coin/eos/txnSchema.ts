import joi from 'joi';

const nameRegex = new RegExp(/^[.1-5a-z]{0,12}[.1-5a-j]?$/);

export const BaseTransactionSchema = joi.object({
  expiration: joi.string().required(),
  refBlockNum: joi.number().positive().required(),
  refBlockPrefix: joi.number().positive().required(),
  actions: joi.array().items(joi.object()).min(0),
});

export const TransferActionSchema = joi.object({
  from: joi.string().pattern(nameRegex).required(),
  to: joi.string().pattern(nameRegex).required(),
  quantity: joi.string().required(),
  memo: joi.string().required(),
});

export const StakeActionSchema = joi.object({
  from: joi.string().pattern(nameRegex).required(),
  receiver: joi.string().pattern(nameRegex).required(),
  stake_net_quantity: joi.string().required(),
  stake_cpu_quantity: joi.string().required(),
  transfer: joi.boolean().required(),
});

export const UnstakeActionSchema = joi.object({
  from: joi.string().pattern(nameRegex).required(),
  receiver: joi.string().pattern(nameRegex).required(),
  unstake_net_quantity: joi.string().required(),
  unstake_cpu_quantity: joi.string().required(),
});

export const PermissionAuthSchema = joi.object({
  threshold: joi.number().required(),
  accounts: joi
    .array()
    .items(
      joi.object({
        permission: joi.object({
          actor: joi.string().pattern(nameRegex).required(),
          permission: joi.string().pattern(nameRegex).required(),
        }),
        weight: joi.number().required(),
      }),
    )
    .min(1),
  keys: joi
    .array()
    .items(
      joi.object({
        key: joi.string().required(),
        weight: joi.number().required(),
      }),
    )
    .min(1),
  waits: joi.array().required(),
});

export const UpdateAuthActionSchema = joi.object({
  account: joi.string().pattern(nameRegex).required(),
  permission_name: joi.string().pattern(nameRegex).required(),
  parent: joi.string().pattern(nameRegex).required(),
  auth: PermissionAuthSchema.required(),
});

export const DeleteAuthActionSchema = joi.object({
  account: joi.string().pattern(nameRegex).required(),
  permission_name: joi.string().pattern(nameRegex).required(),
});

export const LinkAuthActionSchema = joi.object({
  account: joi.string().pattern(nameRegex).required(),
  code: joi.string().pattern(nameRegex).required(),
  type: joi.string().pattern(nameRegex).required(),
  requirement: joi.string().pattern(nameRegex).required(),
});

export const UnlinkAuthActionSchema = joi.object({
  account: joi.string().pattern(nameRegex).required(),
  code: joi.string().pattern(nameRegex).required(),
  type: joi.string().pattern(nameRegex).required(),
});

export const BuyRamBytesActionSchema = joi.object({
  payer: joi.string().pattern(nameRegex).required(),
  receiver: joi.string().pattern(nameRegex).required(),
  bytes: joi.number().positive().required(),
});

export const PowerupActionSchema = joi.object({
  payer: joi.string().pattern(nameRegex).required(),
  receiver: joi.string().pattern(nameRegex).required(),
  days: joi.number().positive().required(),
  net_frac: joi.string().required(),
  cpu_frac: joi.string().required(),
  max_payment: joi.string().required(),
});

export const VoteActionSchema = joi.alternatives().try(
  joi.object({
    voter: joi.string().pattern(nameRegex).required(),
    proxy: joi.string().pattern(nameRegex).required().max(0).allow(''),
    producers: joi.array().items(joi.string().pattern(nameRegex)).required().min(1),
  }),
  joi.object({
    voter: joi.string().pattern(nameRegex).required(),
    proxy: joi.string().pattern(nameRegex).required(),
    producers: joi.array().items(joi.string().pattern(nameRegex)).max(0),
  }),
);

export const NewAccoutActionSchema = joi.object({
  creator: joi.string().pattern(nameRegex).required(),
  name: joi.string().pattern(nameRegex).required(),
  owner: joi.object({
    threshold: joi.number().required(),
    keys: joi
      .array()
      .items(
        joi.object({
          key: joi.string().required(),
          weight: joi.number().required(),
        }),
      )
      .required()
      .min(1),
    accounts: joi.array().items(joi.string()).required().min(0),
    waits: joi.array().items(joi.string()).required().min(0),
  }),
  active: joi.object({
    threshold: joi.number().required(),
    keys: joi
      .array()
      .items(
        joi.object({
          key: joi.string().required(),
          weight: joi.number().required(),
        }),
      )
      .required()
      .min(1),
    accounts: joi.array().items(joi.string()).required().min(0),
    waits: joi.array().items(joi.string()).required().min(0),
  }),
});
