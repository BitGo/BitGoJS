import { ECDSA } from '../../../../account-lib/mpc/tss';
import { ECDSAMethodTypes } from '../../../tss/ecdsa';

export type KeyShare = ECDSA.KeyShare;
export type DecryptableNShare = ECDSAMethodTypes.DecryptableNShare;
