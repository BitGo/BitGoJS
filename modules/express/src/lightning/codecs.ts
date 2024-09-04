/* eslint-disable no-redeclare */
import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types';

export const LightningSignerConfig = t.type({
  url: NonEmptyString,
  tlsCert: NonEmptyString,
});

export type LightningSignerConfig = t.TypeOf<typeof LightningSignerConfig>;

export const LightningSignerConfigs = t.record(t.string, LightningSignerConfig);

export type LightningSignerConfigs = t.TypeOf<typeof LightningSignerConfigs>;
