import * as t from 'io-ts';
import { JsonFromString } from 'io-ts-types';

export const JsonFromStringifiedJson = t.string.pipe(JsonFromString);
