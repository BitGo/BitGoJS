import { EDDSA } from '../../../../account-lib/mpc/tss';
import BaseTSSUtils from '../baseTSSUtils';
import { CreateKeychainParamsBase, UnsignedTransactionTss } from '../baseTypes';
import { SerializedKeyPair } from 'openpgp';

export type KeyShare = EDDSA.KeyShare;
export type YShare = EDDSA.YShare;
/** @deprected use UnsignedTransactionTss from baseTypes */
export type EddsaUnsignedTransaction = UnsignedTransactionTss;

export type IEddsaUtils = BaseTSSUtils<KeyShare>;
/** @deprecated Use IEddsaUtils */
export type ITssUtils = IEddsaUtils;

export type CreateEddsaKeychainParams = CreateKeychainParamsBase & {
  userKeyShare: EDDSA.KeyShare;
  backupGpgKey: SerializedKeyPair<string>;
  backupKeyShare: EDDSA.KeyShare;
};

export type CreateEddsaBitGoKeychainParams = Omit<CreateEddsaKeychainParams, 'bitgoKeychain'>;

// For backward compatibility
export {
  PrebuildTransactionWithIntentOptions,
  TxRequestVersion,
  TxRequestState,
  TransactionState,
  SignatureShareRecord,
  SignatureShareType,
} from '../baseTypes';

/* These types are temporary. To be used from publicTypes later*/

import * as t from 'io-ts';
import { MPCv2P2PMessage } from '@bitgo/public-types';

const MPCv2SigningState = t.union([
  t.literal('round1Input'),
  t.literal('round1Output'),
  t.literal('round2Input'),
  t.literal('round2Output'),
  t.literal('round3Input'),
]);

type MPCv2SigningState = t.TypeOf<typeof MPCv2SigningState>;
const MPCv2SignatureShareBase = t.type({
  type: MPCv2SigningState,
});

const MPCv2SignatureShareRound1Output = t.intersection([
  MPCv2SignatureShareBase,
  t.type(
    {
      type: t.literal('round1Output'),
      data: t.type({
        msg1: MPCv2P2PMessage,
        msg2: MPCv2P2PMessage,
      }),
    },
    'MPCv2SignatureShareRound1Output'
  ),
]);

export type MPCv2SignatureShareRound1Output = t.TypeOf<typeof MPCv2SignatureShareRound1Output>;

const MPCv2SignatureShareRound2Input = t.intersection([
  MPCv2SignatureShareBase,
  t.type({
    type: t.literal('round2Input'),
    data: t.type({
      msg2: MPCv2P2PMessage,
      msg3: MPCv2P2PMessage,
    }),
  }),
]);

export type MPCv2SignatureShareRound2Input = t.TypeOf<typeof MPCv2SignatureShareRound2Input>;
