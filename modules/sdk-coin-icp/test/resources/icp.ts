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
    address: '2b9b89604362e185544c8bba76cadff1a3af26e1467e8530d13743a08a52dd7b',
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
  outputAmount: '10',
  inputAmount: '10',
  spendAmount: '10',
  fee: '-10000',
  externalOutputs: [
    {
      amount: '10',
      address: accounts.account2.address,
    },
  ],
  type: OperationType.TRANSACTION,
  address: accounts.account1.address,
  senderKey: accounts.account1.publicKey,
  seqno: 1740638136656000000,
  spendAmountString: '10',
  id: '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw',
  expiryTime: Date.now() * 1000_000 + 5 * 60 * 1000_000_000,
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
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573742dd9527902e38bc015d4f5521e680b29d1ebc5b4fe24dd5515e2abe99097f0b1',
      signature_type: 'ecdsa',
    },
    {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573742adff4e1c4b8b725bd4accbaf80cd2b180b322bfc450ec00d14aa315c9a4e324',
      signature_type: 'ecdsa',
    },
    {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d7265717565737476265b535aeeda1b30f9a276a62e9247c9288d518349d68b504e9db5f9fd7563',
      signature_type: 'ecdsa',
    },
    {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d72657175657374bb6cfef054ce8ce0a54593f7eb78bb089dc14673e1556afd20dd9534d29aa2f7',
      signature_type: 'ecdsa',
    },
    {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573741c174f275615e80d7280542bf373e2ecfa59c3a1d87475feed0a97203fb22f37',
      signature_type: 'ecdsa',
    },
    {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573741814112eb6162e3dc5cc6a5a87c9ec2a6578e762059ec7510591aad208e7cded',
      signature_type: 'ecdsa',
    },
  ],
  unsigned_transaction:
    'b90002677570646174657381826b5452414e53414354494f4eb900056b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b000000000000000070696e67726573735f6578706972696573831b182859ea979462001b18285a06882312001b18285a2278b1c200',
};

export const signatures = [
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
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
      '11d903fe529788a2202a261568066371e2022ddb339379368e19567473b3c2d7a88e032684652109ec8d9ef6b6600c479620ca690b26ecf07678b3ee307d1375',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573742adff4e1c4b8b725bd4accbaf80cd2b180b322bfc450ec00d14aa315c9a4e324',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'b50df90e4c94e45d4bd7117d98380d104f19cf7053814887acfe4d6ad24b08f8735473b00e5740beef2e675d98764dc22ab44c653ecf65281cc46601d2802eb5',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d7265717565737476265b535aeeda1b30f9a276a62e9247c9288d518349d68b504e9db5f9fd7563',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '005e67fcb5f5937b969b64eca79077030e7a0e9841dc6babca4211167c32799235b16823f37ba8b9431293705ac4b5e62c6fa18e0ea265a121f58d368295d45c',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d72657175657374bb6cfef054ce8ce0a54593f7eb78bb089dc14673e1556afd20dd9534d29aa2f7',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '7e995be0c48d6e45c7fb671e53da580023bcca0346b346c7374d379d5d98b0205a304e9f9653694239c0e54d39503dbab5b0d3bcc64ca5f03f37de6a4300b6bd',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573741c174f275615e80d7280542bf373e2ecfa59c3a1d87475feed0a97203fb22f37',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '9ee8331ab5b3cab1047b34540c5f74b89d3bb754cef793c09a7e728b781609531a84796c1e6f8474014f75c4918d68eb314ee487f6c64878a039cf3fe618e184',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573741814112eb6162e3dc5cc6a5a87c9ec2a6578e762059ec7510591aad208e7cded',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '4ae4da61c3ef1b04e32fbb1b7c0b79ad89bb2b45501dbe2b84a4216df90a1038800e8e477e3eb52f1b91acfd14972279544ca940d5853fc7dcb2bc12dd0428ab',
  },
];

export const signedTransaction =
  'b9000168726571756573747381826b5452414e53414354494f4e83b9000266757064617465b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b182859ea979462006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f736967584011d903fe529788a2202a261568066371e2022ddb339379368e19567473b3c2d7a88e032684652109ec8d9ef6b6600c479620ca690b26ecf07678b3ee307d13756a726561645f7374617465b9000367636f6e74656e74b900046c726571756573745f747970656a726561645f73746174656673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a0265706174687381824e726571756573745f73746174757358202dd9527902e38bc015d4f5521e680b29d1ebc5b4fe24dd5515e2abe99097f0b16e696e67726573735f6578706972791b182859ea979462006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f7369675840b50df90e4c94e45d4bd7117d98380d104f19cf7053814887acfe4d6ad24b08f8735473b00e5740beef2e675d98764dc22ab44c653ecf65281cc46601d2802eb5b9000266757064617465b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b18285a06882312006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f7369675840005e67fcb5f5937b969b64eca79077030e7a0e9841dc6babca4211167c32799235b16823f37ba8b9431293705ac4b5e62c6fa18e0ea265a121f58d368295d45c6a726561645f7374617465b9000367636f6e74656e74b900046c726571756573745f747970656a726561645f73746174656673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a0265706174687381824e726571756573745f737461747573582076265b535aeeda1b30f9a276a62e9247c9288d518349d68b504e9db5f9fd75636e696e67726573735f6578706972791b18285a06882312006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f73696758407e995be0c48d6e45c7fb671e53da580023bcca0346b346c7374d379d5d98b0205a304e9f9653694239c0e54d39503dbab5b0d3bcc64ca5f03f37de6a4300b6bdb9000266757064617465b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b18285a2278b1c2006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f73696758409ee8331ab5b3cab1047b34540c5f74b89d3bb754cef793c09a7e728b781609531a84796c1e6f8474014f75c4918d68eb314ee487f6c64878a039cf3fe618e1846a726561645f7374617465b9000367636f6e74656e74b900046c726571756573745f747970656a726561645f73746174656673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a0265706174687381824e726571756573745f73746174757358201c174f275615e80d7280542bf373e2ecfa59c3a1d87475feed0a97203fb22f376e696e67726573735f6578706972791b18285a2278b1c2006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f73696758404ae4da61c3ef1b04e32fbb1b7c0b79ad89bb2b45501dbe2b84a4216df90a1038800e8e477e3eb52f1b91acfd14972279544ca940d5853fc7dcb2bc12dd0428ab';

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
