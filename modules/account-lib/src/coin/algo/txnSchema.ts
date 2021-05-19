import joi from 'joi';
import utils from './utils';

export const BaseTransactionSchema = joi
  .object({
    fee: joi.number().required(),
    firstRound: joi.number().positive().required(),
    genesisHash: joi.string().base64().required(),
    lastRound: joi.number().positive().required(),
    sender: joi
      .string()
      .custom((addr) => utils.isValidAddress(addr))
      .required(),
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
