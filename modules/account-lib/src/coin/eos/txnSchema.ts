import joi from 'joi';

export const BaseTransactionSchema = joi.object({
  expiration: joi.string().required(),
  refBlockNum: joi.number().positive().required(),
  refBlockPrefix: joi.number().positive().required(),
  actions: joi.array().items(joi.object()).min(0),
});

export const TransferActionSchema = joi.object({
  from: joi.string().required(),
  to: joi.string().required(),
  quantity: joi.string().required(),
  memo: joi.string().required(),
});

export const StakeActionSchema = joi.object({
  from: joi.string().required(),
  receiver: joi.string().required(),
  stake_net_quantity: joi.string().required(),
  stake_cpu_quantity: joi.string().required(),
  transfer: joi.boolean().required(),
});

export const UnstakeActionSchema = joi.object({
  from: joi.string().required(),
  receiver: joi.string().required(),
  unstake_net_quantity: joi.string().required(),
  unstake_cpu_quantity: joi.string().required(),
});
