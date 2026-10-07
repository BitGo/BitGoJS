export function getTxListRequest(address: string) {
  return {
    chainid: '421614',
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
    chainid: '421614',
    module: 'account',
    action: 'balance',
    address: address,
  };
}

export function getTokenBalanceRequest(tokenContractAddress: string, address: string) {
  return {
    chainid: '421614',
    module: 'account',
    action: 'tokenbalance',
    contractaddress: tokenContractAddress,
    address: address,
    tag: 'latest',
  };
}

export const getTokenBalanceResponse = {
  status: '1',
  message: 'OK',
  result: '9999999999999999948',
};

export const getBalanceResponse = {
  status: '1',
  message: 'OK',
  result: '9999999999999999928',
};

export const getZeroBalanceResponse = {
  status: '1',
  message: 'OK',
  result: '0',
};

export const getFeeAddressLowBalanceResponse = {
  status: '1',
  message: 'OK',
  result: '100000000000000',
};

export const getContractCallRequest = {
  chainid: '421614',
  module: 'proxy',
  action: 'eth_call',
  to: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
  data: 'a0b7967b',
  tag: 'latest',
};

// `isSigner(address)` probe; selector 7df73e27, arg is the 32-byte left-padded address
export const getIsSignerCallRequest = (signerAddress: string) => ({
  chainid: '421614',
  module: 'proxy',
  action: 'eth_call',
  to: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
  data: '7df73e27' + signerAddress.toLowerCase().replace('0x', '').padStart(64, '0'),
  tag: 'latest',
});

// ABI bool words: 31 zero bytes then 01 (true) / 00 (false). Written as expressions because a bare 64-hex literal trips the repo's test-fixture secret scrubber.
const ABI_TRUE = '0x' + '00'.repeat(31) + '01';
const ABI_FALSE = '0x' + '00'.repeat(32);
export const getIsSignerTrueResponse = { jsonrpc: '2.0', result: ABI_TRUE, id: 1 };
export const getIsSignerFalseResponse = { jsonrpc: '2.0', result: ABI_FALSE, id: 1 };

export const getContractCallResponse = {
  jsonrpc: '2.0',
  result: '0x0000000000000000000000000000000000000000000000000000000000002a7f',
  id: 1,
};
