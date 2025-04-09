import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'flr testnet',
    networkId: (coins.get('tflr').network as EthereumNetwork).chainId,
    chainId: (coins.get('tflr').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'flr mainnet',
    networkId: (coins.get('flr').network as EthereumNetwork).chainId,
    chainId: (coins.get('flr').network as EthereumNetwork).chainId,
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
  address: '0x61e081c5f2dc3ae5ef4465e700704edb1444ce85',
};

const getTxListResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: [
    {
      hash: '0xede855d43d70ea1bb75db63d4f75113dae0845f0d4bdb0b2d8bda55249c70812',
      nonce: '23',
      from: '0x61e081c5f2dc3ae5ef4465e700704edb1444ce85',
    },
  ],
  message: 'OK',
};

const getBalanceRequestUnsignedSweep: Record<string, string> = {
  module: 'account',
  action: 'balance',
  address: '0x61e081c5f2dc3ae5ef4465e700704edb1444ce85',
};

const getBalanceResponseUnsignedSweep: Record<string, unknown> = {
  status: '1',
  result: '100000000000000000',
  message: 'OK',
};

export const mockDataUnsignedSweep = {
  userKey:
    '037ad32f53294c100cf15d18ab90718c6715adb8145f6c0ffa70499dc3f58e38d7890ec51e7fd971808b82110ad5920335facc7a358f42e70af1b8bf9da791a0ff',
  backupKey:
    '037ad32f53294c100cf15d18ab90718c6715adb8145f6c0ffa70499dc3f58e38d7890ec51e7fd971808b82110ad5920335facc7a358f42e70af1b8bf9da791a0ff',
  derivationPath: 'm/0',
  derivationSeed: '',
  walletBaseAddress: '0x61e081c5f2dc3ae5ef4465e700704edb1444ce85',
  recoveryDestination: '0xc97d9c8d769aefcc7c32857b5cc583f30ad68ecb',
  getTxListRequest: getTxListRequestUnsignedSweep,
  getTxListResponse: getTxListResponseUnsignedSweep,
  getBalanceRequest: getBalanceRequestUnsignedSweep,
  getBalanceResponse: getBalanceResponseUnsignedSweep,
};
