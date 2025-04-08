import EthereumCommon from '@ethereumjs/common';
import { coins, EthereumNetwork } from '@bitgo/statics';

export const testnetCommon = EthereumCommon.custom(
  {
    name: 'sgb testnet',
    networkId: (coins.get('tsgb').network as EthereumNetwork).chainId,
    chainId: (coins.get('tsgb').network as EthereumNetwork).chainId,
  },
  {
    baseChain: 'sepolia',
    hardfork: 'london',
    eips: [1559],
  }
);

export const mainnetCommon = EthereumCommon.custom(
  {
    name: 'sgb mainnet',
    networkId: (coins.get('sgb').network as EthereumNetwork).chainId,
    chainId: (coins.get('sgb').network as EthereumNetwork).chainId,
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

export function getBuildUnsignedSweepForSelfCustodyColdWalletsMPCv2(intendedChain = 'tsgb'): any {
  const address = '0xb4ef407b02d0ea6de01cafb3543f51681e211851';
  return {
    recoveryDestination: '0x5c5a441e68b082a10c06ce1049e91de105a69c9f',
    bitgoDestinationAddress: '0x07efb1aa5e41b70b21facd3d287548ebf632a165',
    walletContractAddress: '0x1469e6e519ff8bf398b76b4be0b50701b999f14c',
    eip1559: { maxFeePerGas: 20000000000, maxPriorityFeePerGas: 10000000000 },
    gasLimit: 500000,
    intendedChain: intendedChain,
    address: address,
    amount: '100000000000000000',
    commonKeyChain:
      '0234eb39b22fed523ece7c78da29ba1f1de5b64a6e48013e0914de793bc1df0570e779de04758732734d97e54b782c8b336283811af6a2c57bd81438798e1c2446',
  };
}
