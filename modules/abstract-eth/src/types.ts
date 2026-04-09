import EthereumCommon from '@ethereumjs/common';

export type SendCrossChainRecoveryOptions = {
  recoveryId: string;
  walletPassphrase?: string;
  encryptedPrv?: string;
  walletType: 'hot' | 'cold';
  common?: EthereumCommon;
};
