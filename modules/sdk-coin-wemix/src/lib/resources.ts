import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'wemix testnet',
    networkId: (coins.get('twemix').network as EthereumNetwork).chainId,
    chainId: (coins.get('twemix').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'wemix mainnet',
    networkId: (coins.get('wemix').network as EthereumNetwork).chainId,
    chainId: (coins.get('wemix').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
    hardfork: 'london',
    eips: [1559],
  }
);

const getTxListRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'txlist',
  address: '0x0f1cf244f061a3ca1976d73c8961858d769027d2',
};

const getTxListResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x0f1cf244f061a3ca1976d73c8961858d769027d2',
    },
  ],
  message: 'OK',
};

const getBalanceRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x0f1cf244f061a3ca1976d73c8961858d769027d2',
};

const getBalanceResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataUnsignedSweep = {
  userKey:
    '03b652162cf853235b7f5fc356bbdc26c104366f87ac04bc1211c492fb7e585361c23d7f6f49cf9ead6aa5986b6ecc04b03ad65079e9eb1c25672922045970d2b1',
  backupKey:
    '03b652162cf853235b7f5fc356bbdc26c104366f87ac04bc1211c492fb7e585361c23d7f6f49cf9ead6aa5986b6ecc04b03ad65079e9eb1c25672922045970d2b1',
  derivationPath: 'm/0',
  derivationSeed: '',
  walletBaseAddress: '0x0f1cf244f061a3ca1976d73c8961858d769027d2',
  recoveryDestination: '0x26efa259beeb4373aff0f0e37167a7b6255fe34e',
  getTxListRequest: getTxListRequestUnsignedSweep,
  getTxListResponse: getTxListResponseUnsignedSweep,
  getBalanceRequest: getBalanceRequestUnsignedSweep,
  getBalanceResponse: getBalanceResponseUnsignedSweep,
};
