import joi from 'joi';
import algosdk from 'algosdk';
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
    txType: joi
      .string()
      .valid(...Object.values(algosdk.TransactionType))
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
