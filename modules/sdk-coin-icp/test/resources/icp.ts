import { IcpMetadata, OperationType, IcpAccount } from '../../src/lib/iface';

export const accounts = {
  account1: {
    secretKey: 'c5bccb8f471c5c9eb6483aa77ee4b700003b1e12df430a24d93238eb378b968b',
    publicKey:
      '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
    address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
  },
  account2: {
    secretKey: '73312c28d0d455b6a29a9a66811ffda94f3db6bfd57bf5c2bed917ee5928e15f',
    publicKey:
      '044e01707f70f6ad8d9f79e5f2c2f0bac5e91520e5e2491354c6c7827b59d44148847f9180ac9679a6ce66f69c330551a99f8f9b7419c437705602a54c258a9dfe',
    address: 'c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e',
  },
  account3: {
    publicKey:
      '042281378584012843130dce9b19002f88a949f237397e2f6cda2db1392d54f6345faaf51c384fbfe4e8f67eb12fdb53732d2ddfe7470f9310a0bf824dad3f6b1b',
    secretKey: '7b4de3d8cc3e312c70f674b52f11818205546ca7036c8071997c46e429160dc3',
    address: '50b59c953c9412823ada13c485656f853ec65cb58f164756429af53f06d3ab5f',
  },
  account4: {
    secretKey: 'c71d2779709061cc991b58bd79b0080cc125acb98b28c71ac5d63bca62e2b742',
    publicKey:
      '045b340975daf07887df1f32689dad303cb3e2869939d82f9225a79b0a2e56621f0c773070dc6316b36b796e7c92334c6897c9179b75efbd7a78c149f4b7a15cd9',
    address: '8812eef6cf88b86ccf8d3e1b5d4aa3011025ec0c014aece4e8e9bdb02151392c',
  },
  account5: {
    secretKey: '8d08c0393b707cd90c37213025fe7ed13c05b267d946ca1b6e0fd3b0e47ec188',
    publicKey:
      '04c8e66bf2e02f15ebe8da05b74d105b54cde5114f13d4afdec8afad6aaeb621bacab8c119821ef079545413cb26ef71dd8ab681c0fcce6085648b3fe08d3cd109',
    address: '6f1cd9940598e205b0affacff7fcdafa81700cd7b2d0c25f15803b955a12f100',
  },
  account6: {
    secretKey: '8d08c0393b707cd90c37213025fe7ed13c05b267d946ca1b6e0fd3b0e47ec188',
    publicKey: '02ad010ce68b75266c723bf25fbe3a0c48eb29f14b25925b06b7f5026a0f12702e',
    address: '2b9b89604362e185544c8bba76cadff1a3af26e1467e8530d13743a08a52dd7b?memoId=0',
  },
  errorsAccounts: {
    account1: {
      secretKey: 'not ok',
      publicKey: 'not ok',
      address: 'not ok',
    },
    account2: {
      secretKey: 'test_test',
      publicKey: 'test_test',
      address: 'bo__wen',
    },
    account3: {
      publicKey: 'invalid-public-key',
      secretKey: 'invalid-private-key',
      address: 'me@google.com',
    },
    account4: {
      secretKey: '#$%',
      publicKey: '#$%',
      address: '$$$',
    },
    account5: {
      secretKey: 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      publicKey: 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      address: 'abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz',
    },
    account6: {
      secretKey: '',
      publicKey: '',
      address: '',
    },
  },
};

export const blockHashes = {
  validHashes: {
    block1: 'ddd1f3bcc1aae4a61af0f44415d9610889b9231ad4ee9a42935efe80dbb007a2',
    block2: '3ca42afc8d0507282ce48ac942397f4691ce26d41fd37967cf0cf9021ed39da2',
    block3: 'e768ce1d1923d6819f25ff91dc996f2b505f031945768af124632cc226db7307',
  },
};

export const TransactionHashes = {
  validHashes: {
    txId1: '4e1577f120f29dd68cdd2235e6574c12b9dc73724177269c254571e044936bbe',
    txId2: '02d71df6e694aec6b51577f2adb299e1a677e56c47c62d6da7c78e91740cb207',
    txId3: '70879bb9a9852d663860b01f44bdf86bbc3cd0b1d4f156793028f4bcd638ebac',
  },
};

export const IcpTransactionData = {
  senderAddress: accounts.account1.address,
  receiverAddress: accounts.account2.address,
  amount: '10',
  fee: '-10000',
  senderPublicKeyHex: accounts.account1.publicKey,
  memo: 1740638136656000000,
  transactionType: OperationType.TRANSACTION,
  expiryTime: Date.now() * 1000_000 + 5 * 60 * 1000_000_000,
};

export const rawTransaction = {
  serializedTxHex:
    'b90002677570646174657381826b5452414e53414354494f4eb900056b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758410a02080112060a0408c0843d1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880ecbac5bfcc9d97186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b000000000000000070696e67726573735f6578706972696573811b182e769bd9cc1600',
  publicKey:
    '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
};

export const parsedRawTransaction = {
  operations: [
    {
      operation_identifier: {
        index: 0,
      },
      type: 'TRANSACTION',
      status: null,
      account: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      amount: {
        value: '-1000000',
        currency: {
          symbol: 'ICP',
          decimals: 8,
        },
      },
    },
    {
      operation_identifier: {
        index: 1,
      },
      type: 'TRANSACTION',
      status: null,
      account: {
        address: 'c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e',
      },
      amount: {
        value: '1000000',
        currency: {
          symbol: 'ICP',
          decimals: 8,
        },
      },
    },
    {
      operation_identifier: {
        index: 2,
      },
      type: 'FEE',
      status: null,
      account: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      amount: {
        value: '-10000',
        currency: {
          symbol: 'ICP',
          decimals: 8,
        },
      },
    },
  ],
  account_identifier_signers: [],
  metadata: {
    created_at_time: 1742457444920999936,
    memo: 1,
  },
};

export const metaData: IcpMetadata = {
  created_at_time: 1740739880079000000,
  ingress_end: 1740740180079000000,
  ingress_start: 1740739880079000000,
  memo: 1234,
};

export const payloadsData = {
  payloads: [
    {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
      hex_bytes: '0a69632d726571756573742dd9527902e38bc015d4f5521e680b29d1ebc5b4fe24dd5515e2abe99097f0b1',
      signature_type: 'ecdsa',
    },
  ],
  unsigned_transaction:
    'b90002677570646174657381826b5452414e53414354494f4eb900056b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b000000000000000070696e67726573735f6578706972696573811b182859ea97946200',
};

export const signatures = [
  {
    signing_payload: {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
      hex_bytes: '0a69632d726571756573742dd9527902e38bc015d4f5521e680b29d1ebc5b4fe24dd5515e2abe99097f0b1',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '11d903fe529788a2202a261568066371e2022ddb339379368e19567473b3c2d75771fcd97b9adef613726109499ff3b7248e127da421b34b4959aa9e9fb92dcc',
  },
];

export const signedTransaction =
  'b9000168726571756573747381826b5452414e53414354494f4e81b9000166757064617465b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b182859ea979462006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f736967584011d903fe529788a2202a261568066371e2022ddb339379368e19567473b3c2d75771fcd97b9adef613726109499ff3b7248e127da421b34b4959aa9e9fb92dcc';

export const ParsedUnsignedTransaction = {
  operations: [
    {
      type: 'TRANSACTION',
      account: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      amount: {
        value: '-10',
        currency: {
          symbol: 'icp',
          decimals: 8,
        },
      },
    },
    {
      type: 'TRANSACTION',
      account: {
        address: 'c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e',
      },
      amount: {
        value: '10',
        currency: {
          symbol: 'icp',
          decimals: 8,
        },
      },
    },
    {
      type: 'FEE',
      account: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      amount: {
        value: '-10000',
        currency: {
          symbol: 'icp',
          decimals: 8,
        },
      },
    },
  ],
  account_identifier_signers: [] as IcpAccount[],
  metadata: {
    created_at_time: 1740739880079000064,
    memo: 1234,
  },
};

export const ParsedSignedTransaction = {
  operations: [
    {
      type: 'TRANSACTION',
      account: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      amount: {
        value: '-10',
        currency: {
          symbol: 'icp',
          decimals: 8,
        },
      },
    },
    {
      type: 'TRANSACTION',
      account: {
        address: 'c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e',
      },
      amount: {
        value: '10',
        currency: {
          symbol: 'icp',
          decimals: 8,
        },
      },
    },
    {
      type: 'FEE',
      account: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      amount: {
        value: '-10000',
        currency: {
          symbol: 'icp',
          decimals: 8,
        },
      },
    },
  ],
  account_identifier_signers: [{ address: accounts.account1.address }] as IcpAccount[],
  metadata: {
    created_at_time: 1740739880079000064,
    memo: 1234,
  },
};
