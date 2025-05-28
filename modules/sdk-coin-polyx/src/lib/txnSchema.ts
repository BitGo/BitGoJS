import joi from 'joi';
import Utils from './utils';

const addressSchema = joi.string().custom((addr) => Utils.isValidAddress(addr));

export const RegisterDidWithCDDTransactionSchema = joi.object({
  targetAccount: addressSchema.required(),
  secondaryKeys: joi.array().length(0).required(),
  expiry: joi.valid(null).required(),
});

export const BatchUnstakingTransactionSchema = {
  validate: (value: { value: string }): joi.ValidationResult =>
    joi
      .object({
        value: joi.string().required(),
      })
      .validate(value),
};

export const WithdrawUnbondedTransactionSchema = {
  validate: (value: { slashingSpans: number }): joi.ValidationResult =>
    joi
      .object({
        slashingSpans: joi.number().min(0).required(),
      })
      .validate(value),
};
