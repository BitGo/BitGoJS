import joi from 'joi';
import Utils from './utils';

const addressSchema = joi.string().custom((addr) => Utils.isValidAddress(addr));

export const RegisterDidWithCDDTransactionSchema = joi.object({
  targetAccount: addressSchema.required(),
  secondaryKeys: joi.array().length(0).required(),
  expiry: joi.valid(null).required(),
});
