import joi from 'joi';

export const StakeTransactionSchema = joi.object({
  amount: joi.string().required(),
  hotkey: joi.string().required()
});
