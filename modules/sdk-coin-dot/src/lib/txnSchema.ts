import joi from 'joi';
import Utils from './utils';

const addressSchema = joi.string().custom((addr) => Utils.isValidAddress(addr));

const proxyTypes = [
  'Any',
  'NonTransfer',
  'Governance',
  'Staking',
  'UnusedSudoBalances',
  'IdentityJudgement',
  'CancelProxy',
];

export const BaseTransactionSchema = joi.object({
  sender: addressSchema.required(),
  blockNumber: joi.number().required(),
  blockHash: joi.string().required(),
  genesisHash: joi.string().required(),
  specVersion: joi.number().required(),
  specName: joi.string().valid('kusama', 'polkadot', 'westend', 'statemint', 'statemine').required(),
  transactionVersion: joi.number().required(),
  chainName: joi.string().required(),
  eraPeriod: joi.number().required(),
  nonce: joi.number().required(),
  tip: joi.number().optional(),
});

export const SigningPayloadTransactionSchema = joi.object({
  eraPeriod: joi.number().optional(),
  blockHash: joi.string().required(),
  nonce: joi.number().required(),
  tip: joi.number().optional(),
});

export const SignedTransactionSchema = joi.object({
  sender: addressSchema.required(),
  nonce: joi.number().required(),
  eraPeriod: joi.number().optional(),
  tip: joi.number().optional(),
});

export const TransferTransactionSchema = joi.object({
  amount: joi.string().required(),
  to: addressSchema.required(),
});

export const TransferAllTransactionSchema = joi.object({
  to: addressSchema.required(),
});

const CreateStakeTransactionSchema = joi.object({
  value: joi.string().required(),
  controller: joi.string().optional(),
  payee: [
    joi.string(),
    joi.object({
      account: joi.string().optional(),
      controller: joi.equal(null).optional(),
      staked: joi.equal(null).optional(),
      stash: joi.equal(null).optional(),
    }),
    joi.object({
      Account: joi.string().required(),
    }),
  ],
  addToStake: joi.boolean().equal(false).optional(),
});

const StakeMoreTransactionSchema = joi.object({
  value: joi.string().required(),
  addToStake: joi.boolean().equal(true).required(),
  controller: joi.forbidden(), // Only allow undefined
  payee: joi.forbidden(), // Only allow undefined
});

export const StakeTransactionSchema = joi
  .alternatives(CreateStakeTransactionSchema, StakeMoreTransactionSchema)
  .match('one');

export const AddressInitializationSchema = joi.object({
  proxyType: joi
    .string()
    .valid(...proxyTypes)
    .required(),
  delegate: addressSchema.required(),
  delay: joi.string().required(),
});

export const AnonymousAddressInitializationSchema = joi.object({
  proxyType: joi
    .string()
    .valid(...proxyTypes)
    .required(),
  index: joi.number().required(),
  delay: joi.number().required(),
});

export const BatchTransactionSchema = joi.object({
  calls: joi
    .alternatives()
    .try(
      joi.array().items(joi.string()),
      joi.array().items(joi.object({ callIndex: joi.string(), args: joi.object() }))
    ),
});

export const ProxyTransactionSchema = joi.object({
  real: addressSchema.required(),
  forceProxyType: joi
    .string()
    .valid(...proxyTypes)
    .required(),
  amount: joi.string().required(),
  to: addressSchema.required(),
});

export const UnstakeTransactionSchema = joi.object({
  value: joi.string().required(),
});

export const WithdrawUnstakedTransactionSchema = joi.object({
  value: joi.number().required(),
});

export const ClaimTransactionSchema = joi.object({
  claimEra: joi.string().required(),
  validatorStash: addressSchema.required(),
});
