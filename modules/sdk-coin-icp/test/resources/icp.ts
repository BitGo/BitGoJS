import {
  IcpTransactionParseMetadata,
  OperationType,
  IcpAccount,
  IcpTransactionBuildMetadata,
} from '../../src/lib/iface';

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

export const metaData: IcpTransactionParseMetadata = {
  created_at_time: 1740739880079000000,
  ingress_end: 1740740180079000000,
  ingress_start: 1740739880079000000,
  memo: 1234,
};

export const transactionMetaData: IcpTransactionBuildMetadata = {
  created_at_time: 1740739880079000000,
  ingress_end: 1740740180079000000,
  ingress_start: 1740739880079000000,
};

export const payloadsData = {
  payloads: [
    {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
      hex_bytes: '0a69632d726571756573742dd9527902e38bc015d4f5521e680b29d1ebc5b4fe24dd5515e2abe99097f0b1',
      signature_type: 'ecdsa',
    },
    {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
      hex_bytes: '0a69632d726571756573742adff4e1c4b8b725bd4accbaf80cd2b180b322bfc450ec00d14aa315c9a4e324',
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
  {
    signing_payload: {
      account_identifier: { address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f' },
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
];

export const signedTransaction =
  'b9000168726571756573747381826b5452414e53414354494f4e81b9000266757064617465b9000367636f6e74656e74b900066c726571756573745f747970656463616c6c6b63616e69737465725f69644a000000000000000201016b6d6574686f645f6e616d656773656e645f70626361726758400a0308d20912040a02080a1a0308904e2a220a20c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e3a0a088084dcb3abb69694186673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a026e696e67726573735f6578706972791b182859ea979462006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f736967584011d903fe529788a2202a261568066371e2022ddb339379368e19567473b3c2d75771fcd97b9adef613726109499ff3b7248e127da421b34b4959aa9e9fb92dcc6a726561645f7374617465b9000367636f6e74656e74b900046c726571756573745f747970656a726561645f73746174656673656e646572581dd5fc1dc4d74d4aa35d81cf345533d20548113412d32fffdcece2f68a0265706174687381824e726571756573745f73746174757358202dd9527902e38bc015d4f5521e680b29d1ebc5b4fe24dd5515e2abe99097f0b16e696e67726573735f6578706972791b182859ea979462006d73656e6465725f7075626b6579d84058583056301006072a8648ce3d020106052b8104000a034200042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d46a73656e6465725f7369675840b50df90e4c94e45d4bd7117d98380d104f19cf7053814887acfe4d6ad24b08f8735473b00e5740beef2e675d98764dc22ab44c653ecf65281cc46601d2802eb5';

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

export const WRWRecovery = {
  rootAddress: '4623c8c75bf76b1275460328de94a6f1b9f9000d173941694cb93a8bd26b77ca',
  destinationAddress: accounts.account1.address,
  userKey:
    '{"iv":"ZfhJQF9+MUj7hZ8OoesfcA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"+f/agM4bM8s=","ct":"2dQxSuUKSyFbe3vSYHSRG4p4PJ4XWA/yz7Af9dPpmFDN+2G4iXsUdkyscBsU1QGZ1gDgB7EUPnNIoa36Kbm2Ioh9QR1pms2xPzkHMvdO9UtMwch+tDPFMSYBCOfIWXjAVIIDpJcJthepIK+f2W8JiuWIz9m+TGV+R6kA1ahBURgyKBA7pyUuPrnXmWWj4ihEOOvxjt5df14ZcQ11KjtnaE4Mal2Zm+oXQj4VwW39CUF7QI+5XIBlhq3uXfJ6NLhRQ1DjH2imQVp8iCE1to8lBLj9V09beXNdXQBAomm4fugl6ejTp5tsig/75VKazYJzjNuOAAKaEHDkdMOUzdp8oOWq3eiBFMgD+9Zy31tYxCHGlKyMNjgOlwrKxmuv1zWrhEbYkALB+m7AUc2+qkCYUK+L+FfAPO/U0Ww3gq/mYtFDvdqSF6wDa68r5eab9fc04k1phrxRRuL1K02Hf68z6nvw0I9CCzaW9C2Gmyz8K06o7YlRBy7fkya11L++OWpEL5zGs8Fnamaz3EImLakL/gKSvJVNXLRxrh2btjAbs/hEXek3WMntJCK1RiwALbMVakBYZiKgKCXlD0AvMdz+s8/pFyyQuDk1fmJtrnaCNnR6ozcvmd4+ZLtVOcte5f6t7DCHlIvEy3ys4sCQlr6zAXAtg2kX7uHkuEls2lTMwRb4PekNAoO4oxLRbKo+L9t4FnmnXBSDQW0+TqBfduMZ8rzLqppoTyep8dyFySBXQLQAaCrNsWgEnuHk7dKLWwKzYTCDJbX/UClS2ehoyoJcMQwmRIMjY9FmJPNK03RTBA9jllUk/JrNfEXkHwKeT+SWuQgAeMCqbWJ8A/b9SIPDRJFdR5mt1+H9sL5Y+6+2lcqXtAvSUnUgTMt9oUZirAXE7Wt2qZewaXYmaRarFRH/bw/xzVkSfjrLD22iribAKivIGDzPLIirhN+9xAXBlsErAOT/V8aejuPw9k9oL9Ae/Ok0NZfPZMR8/7uutiGvDgw7vJVDelYMIjEOJHXFDnj+rH3vwPnMNI4Y6M6fNt0yrgMR+eMjgbxxGFYTZO9vlsQRiL/pxP6ceM9ReampgOWLmnYfIhTx91DMURfN"}',
  backupKey:
    '{"iv":"ZKCXaP1L5fVxDOjVKKZuCg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"4mmZz3KxTqs=","ct":"R2UVujh0H0FmPFkxTLnAGg+/P50DVnNP8d7VbsVJWJJWJvbV5tf+eYpvuz+5dpCC7D6xR7vN08ZXuZf6whUFerYOev+LSTcq2T1uar5xLvZBTd7alD889aJQJcd9+Om2JIjdPq3drFaqQF366d2H9tsVY+3iGsuJwCMHf6k8pxePxx5vk3iu4lcy4mJWp4d0zdo95nc4IZCrDp9i9i1p+w/mPhR0Rn+9c6T770vblRm87ft8vfyLZwMEqvJp3QW2XR+6vSyCkzbeZ/+m2nJmsK/Wt6sRqv27KDGVh23YEKp+yY3T9hT4FK0kzaF3tR8yq62Nj40eQ2iHIz50teiyW6HFm7IL4BT/vhL7qFa+VBz6qowON9p/96/21D2Nq40QnAxnOVfxW9DfQwnfBWyZJ8cLvHQ2s24LJX/YdHilPbElbjHncrpqf1jT/AELfBar/i5rrQZ5T0kxNC6t1VJpTUqiWuGUU42GTfzj12XHdqEdj+PcycLWjx8/DoqNPxqcPiEenBl8mst5SWNp1LW/FfEFgyB9p7L2UkxHhRYEzQ4WqIpQ6wERFqmpF6tRgXcYvwu5qc903C9CkRp2HXx2zmryW/vpODBXqwtRiwK1TGXQ0FPuEML+vwhh2LoYRGKOqcfQDTY4qX25kcly6D0zyY7YPTqALJnQYEGXOP42CBO+i5NkTjNCWsJRQMyNqRgEuAE8m1MWjcUIFQWebSJEyss6Ty14HHv+p6ACk6bDVMSLQLhVW3eccvRV5cBu4O6xFAehtvJ74Hc44iDZd5MFjBCZhj9dB3qfrkVFuIjT9WJkXYAn4f6b8Src+COrscklpYvcObGjeel5/Hx80q3jzboYmo9wgisKVpGhtz0XuqrxfZUiHUOGCoWMXFsdLmruh6u3CKKLnobBFgcmFAHJZaotYKOvpK0Lge7qN5vsGVZQhLu6ba/mUJdueDnUPmIJfMczi/yZ+600OcYjD2hetxzzrhkJ7qYRx0WCAyWUKHDl/1QqmavS+wKbnmbziAhgq6BL9cOG7hlPYIx0OERHzpmA3BCpeojI1Fgu27sADyZWLzO1YNfqeTX9fYvgEUE1XmTiSshvkwQxa/KNNHE9+A=="}',
  bitgoPublicKey:
    '036ded8b5a849409935a4fa1a1cf921233f2c755162987804c861ab3aff95cf8fd8553beb55f568dc886b05c5b6831d946e7c442468fef9c953f62f9b1e06ac9d9',
  walletPassphrase: 'Eaglefenaus@1994',
};

export const FetchBalanceResponse = {
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

export const SubmitApiResponse = {
  transaction_identifier: {
    hash: '4c10cf22a768a20e7eebc86e49c031d0e22895a39c6355b5f7455b2acad59c1e',
  },
  metadata: {
    operations: [
      {
        account: {
          address: '47867f2cfb85094275c847435fa10cad54a813eba7e6a9bc3538aa2f537f1d73',
        },
        amount: {
          currency: {
            decimals: 8,
            symbol: 'ICP',
          },
          value: '-10',
        },
        metadata: {
          block_index: 503,
          transaction_identifier: {
            hash: '4c10cf22a768a20e7eebc86e49c031d0e22895a39c6355b5f7455b2acad59c1e',
          },
        },
        operation_identifier: {
          index: 0,
        },
        status: 'COMPLETED',
        type: 'TRANSACTION',
      },
      {
        account: {
          address: 'a1c60efca988c411cd7bc5e481364b9c94caebb24c00e01db269e3a0541ee498',
        },
        amount: {
          currency: {
            decimals: 8,
            symbol: 'ICP',
          },
          value: '10',
        },
        metadata: {
          block_index: 503,
          transaction_identifier: {
            hash: '4c10cf22a768a20e7eebc86e49c031d0e22895a39c6355b5f7455b2acad59c1e',
          },
        },
        operation_identifier: {
          index: 1,
        },
        status: 'COMPLETED',
        type: 'TRANSACTION',
      },
      {
        account: {
          address: '47867f2cfb85094275c847435fa10cad54a813eba7e6a9bc3538aa2f537f1d73',
        },
        amount: {
          currency: {
            decimals: 8,
            symbol: 'ICP',
          },
          value: '-10000',
        },
        metadata: {
          block_index: 503,
          transaction_identifier: {
            hash: '4c10cf22a768a20e7eebc86e49c031d0e22895a39c6355b5f7455b2acad59c1e',
          },
        },
        operation_identifier: {
          index: 2,
        },
        status: 'COMPLETED',
        type: 'FEE',
      },
    ],
  },
};
