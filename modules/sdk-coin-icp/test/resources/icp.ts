import { Metadata, OperationType, IcpAccount, DEFAULT_MEMO } from '../../src/lib/iface';

export const Accounts = {
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

export const BlockHashes = {
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
  senderAddress: Accounts.account1.address,
  receiverAddress: Accounts.account2.address,
  amount: '10',
  fee: '-10000',
  senderPublicKeyHex: Accounts.account1.publicKey,
  memo: 1740638136656000000,
  transactionType: OperationType.TRANSACTION,
  expiryTime: Date.now() * 1000_000 + 5 * 60 * 1000_000_000,
};

export const RawTransaction = {
  serializedTxHex:
    'b90002677570646174657381826b5452414e53414354494f4eb900056b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758420a0308d20912060a0408c0843d1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880bef0becffb919a186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b000000000000000070696e67726573735f6578706972696573811b18344814d8f97f00',
  publicKey:
    '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
};

export const ParsedRawTransaction = {
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
    created_at_time: 1743689749455000000,
    memo: 1234,
  },
};

export const MetaData: Metadata = {
  created_at_time: 1743689749455000000,
  ingress_end: 1743690049455000000,
  ingress_start: 1743689749455000000,
  memo: 1234,
};

export const MetaDataWithDefaultMemo: Metadata = {
  created_at_time: 1743689749455000000,
  ingress_end: 1743690049455000000,
  ingress_start: 1743689749455000000,
  memo: DEFAULT_MEMO,
};

export const PayloadsData = {
  payloads: [
    {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
      hex_bytes: '0a69632d72657175657374523de3c7c5b4613155b74ede2e54493f6acbe8bf6d910154fbbb3a98ba3e0098',
      signature_type: 'ecdsa',
    },
  ],
  unsigned_transaction:
    'b90002677570646174657381826b5452414e53414354494f4eb900056b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880a48596eb92b599186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b000000000000000070696e67726573735f6578706972696573811b1832d4ce93deb200',
};

export const OnChainTransactionHash = '87f2e7ca80961bdc3a1fe761553a8a7f8ac5bf28b71f4e1fba807cf352a27f52';

export const PayloadsDataWithoutMemo = {
  payloads: [
    {
      hex_bytes: '0a69632d726571756573747c1aff6d0edea47545315bb0be0230b5908e94aa5fcb8040e0680f30da5d4359',
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      signature_type: 'ecdsa',
    },
  ],
  unsigned_transaction:
    'b90002677570646174657381826b5452414e53414354494f4eb900056b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f706263617267583f0a02080012040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880a48596eb92b599186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b000000000000000070696e67726573735f6578706972696573811b1832d4ce93deb200',
};

export const Signatures = [
  {
    signing_payload: {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
      hex_bytes: '0a69632d72657175657374523de3c7c5b4613155b74ede2e54493f6acbe8bf6d910154fbbb3a98ba3e0098',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'dee0c728fc06d2140ad84e2be5f983626114d49f51216d4070bfccbfba79041d77648bad917428a8adb9908828458488562f0d159571382b1ac50fb81d5165c9',
  },
];

export const SignaturesWithoutMemo = [
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d726571756573747c1aff6d0edea47545315bb0be0230b5908e94aa5fcb8040e0680f30da5d4359',
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '32f3f90cbf76f81a4ffcba7819dad2b483afe1515d87711475d4af2e993a444b7f22ef303273d40fc18c7b4ffa3295c5cb58886a9e8cf252cedd1cdb8be5a399',
  },
];

export const SignedTransaction =
  'b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880a48596eb92b599186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b1832d4ce93deb2006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f7369675840dee0c728fc06d2140ad84e2be5f983626114d49f51216d4070bfccbfba79041d77648bad917428a8adb9908828458488562f0d159571382b1ac50fb81d5165c9';

export const SignedTransactionWithoutMemo =
  'b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f706263617267583f0a02080012040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880a48596eb92b599186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b1832d4ce93deb2006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f736967584032f3f90cbf76f81a4ffcba7819dad2b483afe1515d87711475d4af2e993a444b7f22ef303273d40fc18c7b4ffa3295c5cb58886a9e8cf252cedd1cdb8be5a399';

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
    created_at_time: 1743689749455000000,
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
  account_identifier_signers: [{ address: Accounts.account1.address }] as IcpAccount[],
  metadata: {
    created_at_time: 1743689749455000000,
    memo: 1234,
  },
};

export const WRWRecovery = {
  rootAddress: '4623c8c75bf76b1275460328de94a6f1b9f9000d173941694cb93a8bd26b77ca',
  destinationAddress: Accounts.account1.address,
  userKey:
    '{"iv":"ZfhJQF9+MUj7hZ8OoesfcA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"+f/agM4bM8s=","ct":"2dQxSuUKSyFbe3vSYHSRG4p4PJ4XWA/yz7Af9dPpmFDN+2G4iXsUdkyscBsU1QGZ1gDgB7EUPnNIoa36Kbm2Ioh9QR1pms2xPzkHMvdO9UtMwch+tDPFMSYBCOfIWXjAVIIDpJcJthepIK+f2W8JiuWIz9m+TGV+R6kA1ahBURgyKBA7pyUuPrnXmWWj4ihEOOvxjt5df14ZcQ11KjtnaE4Mal2Zm+oXQj4VwW39CUF7QI+5XIBlhq3uXfJ6NLhRQ1DjH2imQVp8iCE1to8lBLj9V09beXNdXQBAomm4fugl6ejTp5tsig/75VKazYJzjNuOAAKaEHDkdMOUzdp8oOWq3eiBFMgD+9Zy31tYxCHGlKyMNjgOlwrKxmuv1zWrhEbYkALB+m7AUc2+qkCYUK+L+FfAPO/U0Ww3gq/mYtFDvdqSF6wDa68r5eab9fc04k1phrxRRuL1K02Hf68z6nvw0I9CCzaW9C2Gmyz8K06o7YlRBy7fkya11L++OWpEL5zGs8Fnamaz3EImLakL/gKSvJVNXLRxrh2btjAbs/hEXek3WMntJCK1RiwALbMVakBYZiKgKCXlD0AvMdz+s8/pFyyQuDk1fmJtrnaCNnR6ozcvmd4+ZLtVOcte5f6t7DCHlIvEy3ys4sCQlr6zAXAtg2kX7uHkuEls2lTMwRb4PekNAoO4oxLRbKo+L9t4FnmnXBSDQW0+TqBfduMZ8rzLqppoTyep8dyFySBXQLQAaCrNsWgEnuHk7dKLWwKzYTCDJbX/UClS2ehoyoJcMQwmRIMjY9FmJPNK03RTBA9jllUk/JrNfEXkHwKeT+SWuQgAeMCqbWJ8A/b9SIPDRJFdR5mt1+H9sL5Y+6+2lcqXtAvSUnUgTMt9oUZirAXE7Wt2qZewaXYmaRarFRH/bw/xzVkSfjrLD22iribAKivIGDzPLIirhN+9xAXBlsErAOT/V8aejuPw9k9oL9Ae/Ok0NZfPZMR8/7uutiGvDgw7vJVDelYMIjEOJHXFDnj+rH3vwPnMNI4Y6M6fNt0yrgMR+eMjgbxxGFYTZO9vlsQRiL/pxP6ceM9ReampgOWLmnYfIhTx91DMURfN"}',
  backupKey:
    '{"iv":"ZKCXaP1L5fVxDOjVKKZuCg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"4mmZz3KxTqs=","ct":"R2UVujh0H0FmPFkxTLnAGg+/P50DVnNP8d7VbsVJWJJWJvbV5tf+eYpvuz+5dpCC7D6xR7vN08ZXuZf6whUFerYOev+LSTcq2T1uar5xLvZBTd7alD889aJQJcd9+Om2JIjdPq3drFaqQF366d2H9tsVY+3iGsuJwCMHf6k8pxePxx5vk3iu4lcy4mJWp4d0zdo95nc4IZCrDp9i9i1p+w/mPhR0Rn+9c6T770vblRm87ft8vfyLZwMEqvJp3QW2XR+6vSyCkzbeZ/+m2nJmsK/Wt6sRqv27KDGVh23YEKp+yY3T9hT4FK0kzaF3tR8yq62Nj40eQ2iHIz50teiyW6HFm7IL4BT/vhL7qFa+VBz6qowON9p/96/21D2Nq40QnAxnOVfxW9DfQwnfBWyZJ8cLvHQ2s24LJX/YdHilPbElbjHncrpqf1jT/AELfBar/i5rrQZ5T0kxNC6t1VJpTUqiWuGUU42GTfzj12XHdqEdj+PcycLWjx8/DoqNPxqcPiEenBl8mst5SWNp1LW/FfEFgyB9p7L2UkxHhRYEzQ4WqIpQ6wERFqmpF6tRgXcYvwu5qc903C9CkRp2HXx2zmryW/vpODBXqwtRiwK1TGXQ0FPuEML+vwhh2LoYRGKOqcfQDTY4qX25kcly6D0zyY7YPTqALJnQYEGXOP42CBO+i5NkTjNCWsJRQMyNqRgEuAE8m1MWjcUIFQWebSJEyss6Ty14HHv+p6ACk6bDVMSLQLhVW3eccvRV5cBu4O6xFAehtvJ74Hc44iDZd5MFjBCZhj9dB3qfrkVFuIjT9WJkXYAn4f6b8Src+COrscklpYvcObGjeel5/Hx80q3jzboYmo9wgisKVpGhtz0XuqrxfZUiHUOGCoWMXFsdLmruh6u3CKKLnobBFgcmFAHJZaotYKOvpK0Lge7qN5vsGVZQhLu6ba/mUJdueDnUPmIJfMczi/yZ+600OcYjD2hetxzzrhkJ7qYRx0WCAyWUKHDl/1QqmavS+wKbnmbziAhgq6BL9cOG7hlPYIx0OERHzpmA3BCpeojI1Fgu27sADyZWLzO1YNfqeTX9fYvgEUE1XmTiSshvkwQxa/KNNHE9+A=="}',
  bitgoPublicKey:
    '036ded8b5a849409935a4fa1a1cf921233f2c755162987804c861ab3aff95cf8fd8553beb55f568dc886b05c5b6831d946e7c442468fef9c953f62f9b1e06ac9d9',
  walletPassphrase: 'Eaglefenaus@1994',
};

export const GetAccountBalanceResponse = {
  block_identifier: {
    index: 503,
    hash: '775b6651b0e66b0163d0f5db533ed5dfd1273d668b75a33ed11751694f85497e',
  },
  balances: [
    {
      value: '1000000000',
      currency: {
        symbol: 'ICP',
        decimals: 8,
      },
    },
  ],
};

export const TxnId = '4c10cf22a768a20e7eebc86e49c031d0e22895a39c6355b5f7455b2acad59c1e';

export const PublicNodeApiBroadcastResponse =
  'd9d9f7a266737461747573677265706c6965646b6365727469666963617465590317d9d9f7a2647472656583018301820458200548bee8d4a0ada144f09841a1814e0c7b06a9c525e19d07990c27a8d5dfebe983018204582059964f7dcd455bb5333f0424188250c1bafdfee505b6d4bffce6b93d84b02fbc83024e726571756573745f7374617475738301820458208ec4679d2b1049ab4154b9113c88a7bacc1772831a799d0337e650fe093339648302582086ab628166c7c823c4fac064f42bcb6c6939aec9a63ce88a2eef553475fd55958301830183024a6572726f725f636f646582034649433035303383024b72656a6563745f636f646582034105830183024e72656a6563745f6d65737361676582035901984572726f722066726f6d2043616e69737465722072796a6c332d74796161612d61616161612d61616162612d6361693a2043616e69737465722063616c6c656420606963302e74726170602077697468206d6573736167653a20746865206465626974206163636f756e7420646f65736e2774206861766520656e6f7567682066756e647320746f20636f6d706c65746520746865207472616e73616374696f6e2c2063757272656e742062616c616e63653a20302e303030303030303020546f6b656e2e0a436f6e736964657220677261636566756c6c792068616e646c696e67206661696c757265732066726f6d20746869732063616e6973746572206f7220616c746572696e67207468652063616e697374657220746f2068616e646c6520657863657074696f6e732e2053656520646f63756d656e746174696f6e3a20687474703a2f2f696e7465726e6574636f6d70757465722e6f72672f646f63732f63757272656e742f7265666572656e6365732f657865637574696f6e2d6572726f727323747261707065642d6578706c696369746c7983024673746174757382034872656a6563746564830182045820535b0b886d8f16a1d4909618e38af89fa407ef6f606c1e667ab31015f35db57f83024474696d658203498ad7d790e682f69918697369676e61747572655830a26f5ae0c1396f6005487223031062886416c7d4ea37a1b2a7b64a287b376a5f4495cffd99a69bf4f4fd95e53794f415';

export const RecoverySignedTransactionWithoutMemo =
  'b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758430a02080012080a0608f0c5eadc031a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880a48596eb92b599186673656e646572581db32b534dcc87771406ce0d93595733ca9c635f0f2f3e29559e8806a1026e696e67726573735f6578706972791b1832d4ce93deb2006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a0342000482ef63ee315d6323c616970c93267ca92ee81a691027f9c856ccd23f414f32c5209b7b6f64f42e66c9c5adf064cf0f372ae1b27c9a0fcbc4dcaa8fb5cd5ba0e66a73656e6465725f7369675840cd8f6cde4f72597767b740c3eae6bc8374afa73fd099a474c7d02e60dee5b3f3239829c223f0aec28ca6fe28d735068b7ab77bef6ef89f0a7307e9fdb5f15d09';

export const RecoverySignedTransactionWithMemo =
  'b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758440a0308d20912080a0608f0c5eadc031a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a0880a48596eb92b599186673656e646572581db32b534dcc87771406ce0d93595733ca9c635f0f2f3e29559e8806a1026e696e67726573735f6578706972791b1832d4ce93deb2006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a0342000482ef63ee315d6323c616970c93267ca92ee81a691027f9c856ccd23f414f32c5209b7b6f64f42e66c9c5adf064cf0f372ae1b27c9a0fcbc4dcaa8fb5cd5ba0e66a73656e6465725f7369675840819eeac2eeb59a283ab7c52a48a25a7abde85a8af02632245a3a89ace413cd2043c5bb662cf736a66c77bd61b606e581948843592f4ab8132925aff3826ba87c';

export const RecoverTransactionSignatureWithoutMemo = [
  {
    signing_payload: {
      hex_bytes: '0a69632d7265717565737462df1932709297580620a143faa0eba640642e396df9315b917d896311e29a2e',
      account_identifier: {
        address: '4623c8c75bf76b1275460328de94a6f1b9f9000d173941694cb93a8bd26b77ca',
      },
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes: '0282ef63ee315d6323c616970c93267ca92ee81a691027f9c856ccd23f414f32c5',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'cd8f6cde4f72597767b740c3eae6bc8374afa73fd099a474c7d02e60dee5b3f3239829c223f0aec28ca6fe28d735068b7ab77bef6ef89f0a7307e9fdb5f15d09',
  },
];

export const RecoverTransactionSignatureWithMemo = [
  {
    signing_payload: {
      hex_bytes: '0a69632d72657175657374512c76738f0008b5538f1feb16930f02f6cf6a08b804903872808749738b2c56',
      account_identifier: { address: '4623c8c75bf76b1275460328de94a6f1b9f9000d173941694cb93a8bd26b77ca' },
      signature_type: 'ecdsa',
    },
    signature_type: 'ecdsa',
    public_key: {
      hex_bytes: '0282ef63ee315d6323c616970c93267ca92ee81a691027f9c856ccd23f414f32c5',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '819eeac2eeb59a283ab7c52a48a25a7abde85a8af02632245a3a89ace413cd2043c5bb662cf736a66c77bd61b606e581948843592f4ab8132925aff3826ba87c',
  },
];
