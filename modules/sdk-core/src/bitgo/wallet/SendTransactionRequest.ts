/* eslint no-redeclare: off */
import * as t from 'io-ts';
import { BuildParams } from './BuildParams';

export const SendTransactionRequest = t.exact(
  t.intersection([
    t.partial({
      otp: t.string,
      txHex: t.string,
      halfSigned: t.unknown,
      comment: t.unknown,
      suppressBroadcast: t.boolean,
      txRequestId: t.unknown,
      sequenceId: t.unknown,
      consolidateId: t.unknown,
      invoice: t.unknown,
      videoApprovers: t.array(t.unknown),
    }),
    BuildParams.type,
  ])
);

export type SendTransactionRequest = t.TypeOf<typeof SendTransactionRequest>;
