import joi from 'joi';

export const BaseTransactionSchema = joi.object({
  expiration: joi.string().required(),
  refBlockNum: joi.number().positive().required(),
  refBlockPrefix: joi.number().positive().required(),
  actions: joi.array().items(joi.object()).min(1),
});
