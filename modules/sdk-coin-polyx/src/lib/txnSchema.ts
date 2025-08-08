import joi from 'joi';
import Utils from './utils';

export type BatchValidationObject = {
  amount: string;
  controller: string;
  payee: string | { Account: string };
  validators: string[];
};

export type BondValidationObject = {
  value: string;
  controller: string;
  payee: string | { Account: string };
};

export type NominateValidationObject = {
  validators: string[];
};

export type BondExtraValidationObject = {
  value: string;
};

const addressSchema = joi.string().custom((addr) => Utils.isValidAddress(addr));

export const RegisterDidWithCDDTransactionSchema = joi.object({
  targetAccount: addressSchema.required(),
  secondaryKeys: joi.array().length(0).required(),
  expiry: joi.valid(null).required(),
});

export const PreApproveAssetTransactionSchema = joi.object({
  assetId: joi.string().required(),
});

export const AddAndAffirmWithMediatorsTransactionSchema = joi.object({
  venueId: joi.valid(null).required(),
  settlementType: joi.string().valid('SettleOnAffirmation').required(),
  tradeDate: joi.valid(null).required(),
  valueDate: joi.valid(null).required(),
  legs: joi
    .array()
    .items(
      joi.object({
        Fungible: joi
          .object({
            sender: joi
              .object({
                did: addressSchema.required(),
                kind: joi.string().valid('Default').required(),
              })
              .required(),
            receiver: joi
              .object({
                did: addressSchema.required(),
                kind: joi.string().valid('Default').required(),
              })
              .required(),
            assetId: joi.string().required(),
            amount: joi.string().required(),
          })
          .required(),
      })
    )
    .required(),
  portfolios: joi
    .array()
    .items(
      joi.object({
        did: addressSchema.required(),
        kind: joi.string().valid('Default').required(),
      })
    )
    .required(),
  instructionMemo: joi.string().required(),
  mediators: joi.array().length(0).required(),
});

// For standalone bondExtra transactions
export const BondExtraTransactionSchema = joi.object({
  value: joi.string().required(),
});

// For nominate transactions in batch
export const NominateTransactionSchema = joi.object({
  validators: joi.array().items(addressSchema).min(1).required(),
});

// For batch validation
export const BatchTransactionSchema = {
  validate: (value: BatchValidationObject): joi.ValidationResult =>
    joi
      .object({
        amount: joi.string().required(),
        controller: addressSchema.required(),
        // Payee can be a string or an object with Account property
        payee: joi
          .alternatives()
          .try(
            joi.string(),
            joi.object({
              Account: addressSchema,
            })
          )
          .required(),
        validators: joi.array().items(addressSchema).min(1).required(),
      })
      .validate(value),

  validateBond: (value: BondValidationObject): joi.ValidationResult =>
    joi
      .object({
        value: joi.string().required(),
        controller: addressSchema.required(),
        payee: joi
          .alternatives()
          .try(
            joi.string(),
            joi.object({
              Account: addressSchema,
            })
          )
          .required(),
      })
      .validate(value),

  validateNominate: (value: NominateValidationObject): joi.ValidationResult =>
    joi
      .object({
        validators: joi.array().items(addressSchema).min(1).required(),
      })
      .validate(value),
};

export const bondSchema = joi.object({
  value: joi.string().required(),
  controller: addressSchema.required(),
  payee: joi
    .alternatives()
    .try(
      joi.string().valid('Staked', 'Stash', 'Controller'),
      joi.object({
        Account: addressSchema.required(),
      })
    )
    .required(),
});

export const BatchUnstakingTransactionSchema = {
  validate: (value: { value: string }): joi.ValidationResult =>
    joi
      .object({
        value: joi.string().required(),
      })
      .validate(value),
};

export const UnbondTransactionSchema = {
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
