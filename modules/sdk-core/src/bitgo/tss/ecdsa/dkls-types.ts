import * as t from 'io-ts';
import { NonEmptyString } from 'io-ts-types';
import { createStringObject } from '@bitgo-private/common-interface';

/**
 * Note these types are temporarily till we move types to wallet-platform-types from WP.
 * Ignore any comiple changes on this file
 */

export const MpcPartyEnum = createStringObject(['1', '2', '3']);

export const MpcParty = t.keyof(MpcPartyEnum, 'MpcParty');

export type MpcParty = t.TypeOf<typeof MpcParty>;

export const BroadcastMessage = t.type(
  {
    from: MpcParty,
    message: t.string,
    signature: t.string,
  },
  'BroadcastMessage',
);

export type BroadcastMessage = t.TypeOf<typeof BroadcastMessage>;

export const P2PMessage = t.type(
  {
    from: MpcParty,
    to: MpcParty,
    encryptedMessage: t.string,
    signature: t.string,
  },
  'P2PMessage',
);

export type P2PMessage = t.TypeOf<typeof P2PMessage>;

export const MPCv2SignatureShareBase = t.type({
  type: t.union([
    t.literal('round1Input'),
    t.literal('round1Output'),
    t.literal('round2Input'),
    t.literal('round2Output'),
    t.literal('round3Input'),
  ]),
});

export const MPCv2SignatureShareRound1Input = t.intersection([
  MPCv2SignatureShareBase,
  t.type(
    {
      type: t.literal('round1Input'),
      data: t.type({
        msg1: BroadcastMessage,
      }),
    },
    'MPCv2SignatureShareRound1',
  ),
]);

export type MPCv2SignatureShareRound1Input = t.TypeOf<typeof MPCv2SignatureShareRound1Input>;

export const MPCv2SignatureShareRound1Output = t.intersection([
  MPCv2SignatureShareBase,
  t.type(
    {
      type: t.literal('round1Output'),
      data: t.type({
        msg1: BroadcastMessage,
        msg2: P2PMessage,
      }),
    },
    'MPCv2SignatureShareRound1Output',
  ),
]);

export type MPCv2SignatureShareRound1Output = t.TypeOf<typeof MPCv2SignatureShareRound1Output>;

export const MPCv2SignatureShareRound2Input = t.intersection([
  MPCv2SignatureShareBase,
  t.type(
    {
      type: t.literal('round2Input'),
      data: t.type({
        msg2: P2PMessage,
        msg3: P2PMessage,
      }),
    },
    'MPCv2SignatureShareRound2Input',
  ),
]);

export type MPCv2SignatureShareRound2Input = t.TypeOf<typeof MPCv2SignatureShareRound2Input>;

export const MPCv2SignatureShareRound2Output = t.intersection([
  MPCv2SignatureShareBase,
  t.type(
    {
      type: t.literal('round2Output'),
      data: t.type({
        msg3: P2PMessage,
        msg4: BroadcastMessage,
      }),
    },
    'MPCv2SignatureShareRound2Output',
  ),
]);

export type MPCv2SignatureShareRound2Output = t.TypeOf<typeof MPCv2SignatureShareRound2Output>;

/**
 * User to BitGo round 3
 */
export const MPCv2SignatureShareRound3Input = t.intersection([
  MPCv2SignatureShareBase,
  t.type(
    {
      type: t.literal("round3Input"),
      data: t.type({
        msg4: BroadcastMessage,
      }),
    },
    "MPCv2SignatureShareRound3Input",
  ),
]);

export type MPCv2SignatureShareRound3Input = t.TypeOf<
  typeof MPCv2SignatureShareRound3Input
>;
