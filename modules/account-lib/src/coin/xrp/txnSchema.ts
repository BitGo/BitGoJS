import joi from 'joi';
import utils from './utils';

const addressSchema = joi.string().custom((addr) => utils.isValidAddress(addr));

export const BaseTransactionSchema = joi.object({
  sender: addressSchema.required(),
  type: joi.string().required(),
  fee: joi.string().optional(),
  flags: joi.number().optional(),
  memos: joi
    .array()
    .items(
      joi.object({
        Memo: joi.object({
          MemoData: joi.string().optional(),
          MemoType: joi.string().optional(),
          MemoFormat: joi.string().optional(),
        }),
      }),
    )
    .optional(),
  fulfillment: joi.string().optional(),
  sequence: joi.number().positive().optional(),
  lastLedgerSequence: joi.number().positive().optional(),
});
