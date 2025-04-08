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

export function getTxListRequest(address: string) {
  return {
    module: 'account',
    action: 'txlist',
    address: address,
  };
}

export const getTxListResponse = {
  status: '0',
  message: 'No transactions found',
  result: [],
};

export function getBalanceRequest(address: string) {
  return {
    module: 'account',
    action: 'balance',
    address: address,
  };
}

export const getBalanceResponse = {
  status: '1',
  message: 'OK',
  result: '9999999999999999928',
};

export const getContractCallRequest = {
  module: 'proxy',
  action: 'eth_call',
  to: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
  data: 'a0b7967b',
  tag: 'latest',
};

export const getContractCallResponse = {
  jsonrpc: '2.0',
  result: '0x0000000000000000000000000000000000000000000000000000000000002a7f',
  id: 1,
};

export function getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2(intendedChain = 'twemix'): any {
  const address = '0x0f1cf244f061a3ca1976d73c8961858d769027d2';
  return {
    recoveryDestination: '0x26efa259beeb4373aff0f0e37167a7b6255fe34e',
    bitgoDestinationAddress: '0x10f6fb62aa31b23a7fc5482aeabb272c9735eb7f',
    walletContractAddress: '0x0f1cf244f061a3ca1976d73c8961858d769027d2',
    eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
    gasLimit: 500000,
    intendedChain: intendedChain,
    address: address,
    amount: '100000000000000000',
    commonKeyChain:
      '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446',
  };
}
