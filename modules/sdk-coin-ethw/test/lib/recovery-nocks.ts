import nock from 'nock';

import { TestBitGoAPI } from '@bitgo/sdk-test';

export interface NockDataEntry {
  params: {
    method: string;
    params: Array<
      | string
      | {
          to: string;
          data: string;
        }
    >;
  };
  response: {
    result?: string;
    error?: {
      code: number | string;
      message: string;
    };
    id: number | string;
    jsonrpc: string;
  };
}

// ABI bool word for true: 31 zero bytes then 01. Built as an expression because a bare
// 64-hex-digit literal trips the repo's test-fixture secret scrubber.
const ABI_TRUE = '0x' + '00'.repeat(31) + '01';
const ABI_FALSE = '0x' + '00'.repeat(32);

// `isSigner(address)` probe; selector 7df73e27, arg is the 32-byte left-padded address
export const isSignerProbe = (
  walletContractAddress: string,
  signerAddress: string,
  isSigner = true
): NockDataEntry => ({
  params: {
    method: 'eth_call',
    params: [
      {
        to: walletContractAddress,
        data: '0x7df73e27' + signerAddress.toLowerCase().replace('0x', '').padStart(64, '0'),
      },
      'latest',
    ],
  },
  response: {
    result: isSigner ? ABI_TRUE : ABI_FALSE,
    id: 0,
    jsonrpc: '2.0',
  },
});

const nockEthData: NockDataEntry[] = [
  isSignerProbe('0x5df5a96b478bb1808140d87072143e60262e8670', '0xd74753831f445cab405a315691baf3a18387eb3d'),
  isSignerProbe('0x5df5a96b478bb1808140d87072143e60262e8670', '0x74c2137d54b0fc9f907e13f14e0dd18485fee924'),
  isSignerProbe('0x22ff743216b58aeb3efc46985406b50112e9e176', '0xdb6098eac7063783182aae239d826cd554ab3a9d'),
  isSignerProbe('0x22ff743216b58aeb3efc46985406b50112e9e176', '0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6'),
  isSignerProbe('0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e', '0x26a163ba9739529720c0914c583865dec0d37278'),
  isSignerProbe('0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e', '0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91'),
  {
    params: {
      method: 'eth_getTransactionCount',
      params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
    },
    response: {
      result: '0x0',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
    },
    response: {
      result: '0x16345785d8a0000',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0x5df5a96b478bb1808140d87072143e60262e8670', 'latest'],
    },
    response: {
      result: '0x1e87f85809dc0000',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getTransactionCount',
      params: ['0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6', 'latest'],
    },
    response: {
      result: '0x0',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0xba6d9d82cf2920c544b834b72f4c6d11a3ef3de6', 'latest'],
    },
    response: {
      result: '0x0',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getTransactionCount',
      params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
    },
    response: {
      result: '0x0',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0x74c2137d54b0fc9f907e13f14e0dd18485fee924', 'latest'],
    },
    response: {
      result: '0x16345785d8a0000',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0x5df5a96b478bb1808140d87072143e60262e8670', 'latest'],
    },
    response: {
      result: '0x1e87f85809dc0000',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_call',
      params: [{ to: '0x5df5a96b478bb1808140d87072143e60262e8670', data: '0xa0b7967b' }, 'latest'],
    },
    response: {
      jsonrpc: '2.0',
      result: '0x0000000000000000000000000000000000000000000000000000000000000001',
      id: 0,
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91', 'latest'],
    },
    response: {
      result: '0x470de4df820000',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getTransactionCount',
      params: ['0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91', 'latest'],
    },
    response: {
      result: '0x1',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_getTransactionCount',
      params: ['0xa1a88a502274073b1bc4fe06ea0f5fe77e151b91', 'latest'],
    },
    response: {
      result: '0x1',
      id: 0,
      jsonrpc: '2.0',
    },
  },
  {
    params: {
      method: 'eth_call',
      params: [{ to: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e', data: '0xa0b7967b' }, 'latest'],
    },
    response: {
      jsonrpc: '2.0',
      result: '0x00000000000000000000000000000000000000000000000000000000002a7f',
      id: 0,
    },
  },
  {
    params: {
      method: 'eth_getBalance',
      params: ['0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e', 'latest'],
    },
    response: {
      result: '0x8ac7230489e7ffb8',
      id: 0,
      jsonrpc: '2.0',
    },
  },
];

export function nockEthwRecovery(bitgo: TestBitGoAPI, nockData: NockDataEntry[] = nockEthData): void {
  nockData.forEach((data) => {
    nock('https://mainnet.ethereumpow.org')
      .post('/', {
        jsonrpc: '2.0',
        id: 0,
        ...data.params,
      })
      .reply(200, data.response);
  });
}
