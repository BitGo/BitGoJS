import joi from 'joi';
import { InvalidTransactionError } from '../baseCoin/errors';
import { KeyDilutionError } from './errors';
import utils from './utils';

const addressSchema = joi.string().custom((addr) => utils.isValidAddress(addr));

export const BaseTransactionSchema = joi
  .object({
    fee: joi.number().required(),
    firstRound: joi.number().positive().required(),
    genesisHash: joi.string().base64().required(),
    lastRound: joi.number().positive().required(),
    sender: addressSchema.required(),
    genesisId: joi.string().optional(),
    lease: joi.optional(),
    note: joi.optional(),
    reKeyTo: joi
      .string()
      .custom((addr) => utils.isValidAddress(addr))
      .optional(),
  })
  .custom((obj) => {
    const firstRound: number = obj.firstRound;
    const lastRound: number = obj.lastRound;

    if (firstRound < lastRound) {
      return obj;
    }

    throw new Error('lastRound cannot be greater than or equal to firstRound');
  });

export const TransferTransactionSchema = joi.object({
  amount: joi.custom((val) => typeof val === 'number' || typeof val === 'bigint').required(),
  to: joi
    .string()
    .custom((addr) => utils.isValidAddress(addr))
    .required(),
  closeRemainderTo: joi.string().optional(),
});

export const KeyRegTxnSchema = joi
  .object({
    voteKey: addressSchema.required(),
    selectionKey: addressSchema.required(),
    voteFirst: joi.number().positive().required(),
    voteLast: joi.number().positive().required(),
    voteKeyDilution: joi.number().positive().required(),
  })
  .custom((obj) => {
    const voteFirst: number = obj.voteFirst;
    const voteLast: number = obj.voteLast;
    const voteKeyDilution: number = obj.voteKeyDilution;

    if (voteFirst > voteLast) {
      throw new InvalidTransactionError('VoteKey last round must be greater than first round');
    }

    if (voteKeyDilution > Math.sqrt(voteLast - voteFirst)) {
      throw new KeyDilutionError(voteKeyDilution);
    }
    return obj;
  });

export const AssetTransferTxnSchema = joi.object({
  tokenId: joi.number().required(),
  assetAmount: joi.custom((val) => typeof val === 'number' || typeof val === 'bigint').required(),
  receiver: addressSchema.required(),
});
