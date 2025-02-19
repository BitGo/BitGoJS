import * as joi from 'joi';

export const StakeTransactionSchema = joi.object({
  amountStaked: joi.number().required(),
  hotkey: joi.string().required(),
  netuid: joi.number().required(),
});

export const NetuidTransactionSchema = joi.object({
  netuid: joi.string().required(),
  amount: joi.string().required(),
  hotkey: joi.string().required(),
});
