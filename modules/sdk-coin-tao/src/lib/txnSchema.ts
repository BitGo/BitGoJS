import * as joi from 'joi';

export const StakeTransactionSchema = joi.object({
  amount: joi.string().required(),
  hotkey: joi.string().required(),
  netuid: joi.string().required(),
});

export const NetuidTransactionSchema = joi.object({
  netuid: joi.string().required(),
  amount: joi.string().required(),
  hotkey: joi.string().required(),
});
