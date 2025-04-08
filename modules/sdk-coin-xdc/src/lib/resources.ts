import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'xdc testnet',
    networkId: (coins.get('txdc').network as EthereumNetwork).chainId,
    chainId: (coins.get('txdc').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'xdc mainnet',
    networkId: (coins.get('xdc').network as EthereumNetwork).chainId,
    chainId: (coins.get('xdc').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'mainnet',
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

export function getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2(intendedChain = 'txdc'): any {
  const address = '0xc7a0760b30d1a329f2cc3a344801cd10f28906b0';
  return {
    recoveryDestination: '0xaa68b68b6aaef726832b55765398df62006872ba',
    bitgoDestinationAddress: '0x65fb8f97cd4171fe08336eea3f56e938a06e0e26',
    walletContractAddress: '0x742838193c4169f6b2ba7b0e03f723c3ba0928e1',
    eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
    gasLimit: 500000,
    intendedChain: intendedChain,
    address: address,
    amount: '100000000000000000',
    commonKeyChain:
      '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446',
  };
}
