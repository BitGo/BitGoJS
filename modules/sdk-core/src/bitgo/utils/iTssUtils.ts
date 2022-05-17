import { KeyShare } from '../../account-lib/mpc/tss';
import { IRequestTracer } from '../../api';
import { Keychain } from '../iKeychains';
import { Memo } from '../iWallet';
import type { SerializedKeyPair } from 'openpgp';
import { KeychainsTriplet } from '../iBaseCoin';

interface PrebuildTransactionWithIntentOptions {
  reqId: IRequestTracer;
  intentType: string;
  sequenceId?: string;
  recipients: {
    address: string;
    amount: string | number;
  }[];
  comment?: string;
  memo?: Memo;
  tokenName?: string;
  nonce?: string;
}

// complete with more props if neccesary
export interface TxRequest {
  txRequestId: string;
  unsignedTxs: {
    serializedTxHex: string;
    signableHex: string;
    feeInfo?: {
      fee: number;
      feeString: string;
    };
    derivationPath: string;
  }[];
  signatureShares?: SignatureShareRecord[];
  apiVersion?: string;
}

export enum SignatureShareType {
  USER = 'user',
  BACKUP = 'backup',
  BITGO = 'bitgo',
}

export interface SignatureShareRecord {
  from: SignatureShareType;
  to: SignatureShareType;
  share: string;
}

export interface ITssUtils {
  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string
  ): Promise<Keychain>;
  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain>;
  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise: string
  ): Promise<Keychain>;
  createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet>;
  signTxRequest(params: { txRequest: string | TxRequest; prv: string; reqId: IRequestTracer }): Promise<TxRequest>;
  prebuildTxWithIntent(params: PrebuildTransactionWithIntentOptions, apiVersion: undefined): Promise<TxRequest>;
  deleteSignatureShares(txRequestId: string): Promise<SignatureShareRecord[]>;
  sendTxRequest(txRequestId: string): Promise<any>;
  recreateTxRequest(txRequestId: string, decryptedPrv: string, reqId: IRequestTracer): Promise<TxRequest>;
  getTxRequest(txRequestId: string): Promise<TxRequest>;
  getPublicKeyFromCommonKeychain(commonKeychain: string): string;
}
