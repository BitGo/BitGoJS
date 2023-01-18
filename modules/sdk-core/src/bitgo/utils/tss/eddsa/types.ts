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
