import joi from 'joi';
import Utils from './utils';

const addressSchema = joi.string().custom((addr) => Utils.isValidAddress(addr));

export const BaseTransactionSchema = joi.object({
  sender: addressSchema.required(),
  blockNumber: joi.number().required(),
  blockHash: joi.string().required(),
  genesisHash: joi.string().required(),
  metadataRpc: joi.string().required(),
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
