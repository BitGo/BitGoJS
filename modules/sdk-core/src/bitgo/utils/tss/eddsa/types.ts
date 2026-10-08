import * as t from 'io-ts';
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

export interface EddsaMPCv2RecoveryKeyShares {
  userKeyShare: Buffer;
  backupKeyShare: Buffer;
  commonKeyChain: string;
  /** Serialized VRF keyshares from safe-root envelopes, when present. */
  userVrfKeyShare?: Buffer;
  backupVrfKeyShare?: Buffer;
}

/** Codec for an MPCv1 SignShare decrypted from the external signer's persisted signing state */
export const SignShareCodec = t.type({
  xShare: t.type({ i: t.number, y: t.string, u: t.string, r: t.string, R: t.string }),
  rShares: t.record(
    t.string,
    t.intersection([
      t.type({ i: t.number, j: t.number, u: t.string, r: t.string, R: t.string, commitment: t.string }),
      t.partial({ v: t.string }),
    ])
  ),
});

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
