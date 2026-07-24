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

// v8 bond/batch validation objects — no `controller` (stash is its own controller in v8).
export type V8BatchValidationObject = {
  amount: string;
  payee: string | { Account: string };
  validators: string[];
};

export type V8BondValidationObject = {
  value: string;
  payee: string | { Account: string };
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

// v8 identity.registerDid — unlike the v7 CDD path, this call only carries targetAccount
// (verified against the real testnetV8Material metadata; no secondaryKeys/expiry fields).
export const RegisterDidTransactionSchema = joi.object({
  targetAccount: addressSchema.required(),
});

export const PreApproveAssetTransactionSchema = joi.object({
  assetId: joi.string().required(),
});

export const AddAndAffirmWithMediatorsTransactionSchema = joi.object({
  venueId: joi.valid(null).required(),
  settlementType: joi
    .object({
      settleOnAffirmation: joi.valid(null),
    })
    .required(),
  tradeDate: joi.valid(null).required(),
  valueDate: joi.valid(null).required(),
  legs: joi
    .array()
    .items(
      joi.object({
        fungible: joi
          .object({
            sender: joi
              .object({
                did: addressSchema.required(),
                kind: joi
                  .object({
                    default: joi.valid(null),
                  })
                  .required(),
              })
              .required(),
            receiver: joi
              .object({
                did: addressSchema.required(),
                kind: joi
                  .object({
                    default: joi.valid(null),
                  })
                  .required(),
              })
              .required(),
            assetId: joi.string().required(),
            amount: joi.number().required(),
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
        kind: joi
          .object({
            default: joi.valid(null),
          })
          .required(),
      })
    )
    .required(),
  instructionMemo: joi.string().required(),
  mediators: joi.array().length(0).required(),
});

// v8 settlement.addAndAffirmWithMediators — legs/holderSet wrap the DID+kind in an AssetHolder
// enum. Decoded shape lowercases the variant name (`portfolio`, not `Portfolio`) — verified by
// round-tripping a sample value through the real v8 testnet metadata registry.
const assetHolderSchema = joi.object({
  portfolio: joi
    .object({
      did: addressSchema.required(),
      kind: joi
        .object({
          default: joi.valid(null),
        })
        .required(),
    })
    .required(),
});

export const V8AddAndAffirmWithMediatorsTransactionSchema = joi.object({
  venueId: joi.valid(null).required(),
  settlementType: joi
    .object({
      settleOnAffirmation: joi.valid(null),
    })
    .required(),
  tradeDate: joi.valid(null).required(),
  valueDate: joi.valid(null).required(),
  legs: joi
    .array()
    .items(
      joi.object({
        fungible: joi
          .object({
            sender: assetHolderSchema.required(),
            receiver: assetHolderSchema.required(),
            assetId: joi.string().required(),
            amount: joi.number().required(),
          })
          .required(),
      })
    )
    .required(),
  holderSet: joi.array().items(assetHolderSchema).required(),
  instructionMemo: joi.string().required(),
  mediators: joi.array().length(0).required(),
});

export const RejectInstructionTransactionSchema = joi.object({
  id: joi.string().required(),
  portfolio: joi
    .object({
      did: addressSchema.required(),
      kind: joi
        .object({
          default: joi.valid(null),
        })
        .required(),
    })
    .required(),
  numberOfAssets: joi
    .object({
      fungible: joi.number().required(),
      nonFungible: joi.number().required(),
      offChain: joi.number().required(),
    })
    .optional(),
});

// For standalone bondExtra transactions
export const BondExtraTransactionSchema = joi.object({
  value: joi.string().required(),
});

// For nominate transactions (standalone or in batch)
export const NominateTransactionSchema = joi.object({
  validators: joi.array().items(addressSchema).min(1).max(16).required(),
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
        validators: joi.array().items(addressSchema).min(1).max(16).required(),
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
        validators: joi.array().items(addressSchema).min(1).max(16).required(),
      })
      .validate(value),
};

// v8 batch validation — mirrors BatchTransactionSchema but drops the `controller` field, which
// v8 staking.bond no longer encodes.
export const V8BatchTransactionSchema = {
  validate: (value: V8BatchValidationObject): joi.ValidationResult =>
    joi
      .object({
        amount: joi.string().required(),
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
        validators: joi.array().items(addressSchema).min(1).max(16).required(),
      })
      .validate(value),

  validateBond: (value: V8BondValidationObject): joi.ValidationResult =>
    joi
      .object({
        value: joi.string().required(),
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
        validators: joi.array().items(addressSchema).min(1).max(16).required(),
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
