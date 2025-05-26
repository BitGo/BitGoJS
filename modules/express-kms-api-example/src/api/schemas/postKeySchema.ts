import { z } from 'zod';
import { KeySource, KeyType, MultiSigCoins } from './types';

export const ZodPostKeySchema = z.object({
  prv: z.string(), // TODO: min/max length?
  pub: z.string(), // TODO: min/max length?
  coin: z.enum(MultiSigCoins),
  source: z.enum(KeySource),
  type: z.enum(KeyType),
  userKeyProvider: z.any(), // TODO: move this away from schema
  backupKeyProvider: z.any(),
});
