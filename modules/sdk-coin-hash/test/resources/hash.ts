// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj',
  compressedPublicKey: '02f2501af39680be0afea7d3e5dbb399e0fa018f7c6de12287282a315c88f72b70',
  compressedPublicKeyTwo: '03a0b91e3c7bfd399e46990a0ac60e0c75c53e83da944e65ce7d23f37302d253b4',
  uncompressedPublicKey:
    '04f2501af39680be0afea7d3e5dbb399e0fa018f7c6de12287282a315c88f72b70ac9999713ff6ded12f0a3739cefda92557f845fbb2ad4469484e04208ffadeb6',
  privateKey: '1ebe6c5e621d269cffe8b7098d51d50870c97ab960624d9123d031183eeaa49f',
  extendedPrv:
    'xprv9s21ZrQH143K2VcV73a1eknZEvz18eJq6xxkvdDoGY27xSnYgzFtjFY42eF9kFZRMYePGxHavGotAGCngbr7ZDvPLwYQt8GzwnjYJbJqUYw',
  extendedPub:
    'xpub661MyMwAqRbcEygxD5721tjHnxpVY72gUBtMj1dQpsZ6qF7hEXa9H3rXsvt6SGgWF5gLKnsU9e7JxbZFVk9uvwZRPnzrSCNhiiUQdWE4cRM',
};

export const TEST_SEND_TX = {
  hash: 'B6A56824EA46BB5CA9D39E0D7DEE4BA6E54D8B16316449D1BCAB6CE386FBB9A9',
  signature: 'KcdTXM8AXHvGH5dEnUNUmt1/VDxcrBkIjNNPmgxqxYQz6LGkPGmLt8kO5UBvmnsLOh1sCQgY13VGAzFBL3lZog==',
  pubKey: 'Awrb3Ou8+37VJeiBrMtmp1yDecbpFKBSH5CRvXUMv5bL',
  privateKey: 'sQxk+qdlg1wl0Ih6TPmpoJrJ9GZbe7jRn5EKHcAZIws=',
  signedTxBase64:
    'CooBCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKXRwMXVtbmVkN3d4N2xlNzB0dHZyY2VtM2ZzeWhuMzQzYXNyMmsycHdlEil0cDF5dHhoYTdsZzAwMnJ6ZDRqeG1haHJkanprZDYybXg5OWtsZ2pjYxoPCgVuaGFzaBIGMTAwMDAwEmwKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQMK29zrvPt+1SXogazLZqdcg3nG6RSgUh+Qkb11DL+WyxIECgIIARgSEhgKEgoFbmhhc2gSCTM4MTAwMDAwMBDAmgwaQCnHU1zPAFx7xh+XRJ1DVJrdf1Q8XKwZCIzTT5oMasWEM+ixpDxpi7fJDuVAb5p7CzodbAkIGNd1RgMxQS95WaI=',
  sender: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
  recipient: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
  chainId: 'pio-testnet-1',
  accountNumber: 172176,
  sequence: 18,
  sendAmount: '100000',
  feeAmount: '381000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'nhash',
          amount: '100000',
        },
      ],
      toAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
      fromAddress: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
    },
  },
  gasBudget: {
    amount: [{ denom: 'nhash', amount: '381000000' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: 'BD887ADE5E10C378B4B3DB3E4E0D5D77F0C2F3DFEE1A352BF186B22A8F022967',
  signature: 'FMZqHoNhxzJRvhhZbiLLybgAHdkszEstxow2oj1T1It8OyEGLJ8o2jnUo9OuCfeCKBfcWrKAi4w9dwsC8rBChQ==',
  pubKey: 'Awrb3Ou8+37VJeiBrMtmp1yDecbpFKBSH5CRvXUMv5bL',
  privateKey: 'sQxk+qdlg1wl0Ih6TPmpoJrJ9GZbe7jRn5EKHcAZIws=',
  signedTxBase64:
    'CpcBCpQBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJtCil0cDF1bW5lZDd3eDdsZTcwdHR2cmNlbTNmc3lobjM0M2FzcjJrMnB3ZRIwdHB2YWxvcGVyMXRncTZjcHU2aG1zcnZrdmR1ODJqOTl0c3h4dzdxcWFqbjg0M2ZlGg4KBW5oYXNoEgUxMDAwMBJsClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDCtvc67z7ftUl6IGsy2anXIN5xukUoFIfkJG9dQy/lssSBAoCCAEYFBIYChIKBW5oYXNoEgkzODEwMDAwMDAQwJoMGkAUxmoeg2HHMlG+GFluIsvJuAAd2SzMSy3GjDaiPVPUi3w7IQYsnyjaOdSj064J94IoF9xasoCLjD13CwLysEKF',
  delegator: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
  validator: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  chainId: 'pio-testnet-1',
  accountNumber: 172176,
  sequence: 20,
  sendAmount: '10000',
  feeAmount: '381000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
      validatorAddress: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
      amount: {
        denom: 'nhash',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'nhash',
        amount: '381000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '31FC4A0E40D0A7C0C8E80C04DB5F0F1777ACBEC709018FE3F9FB02AA816AC1B1',
  signature: 'B0aF5ncbMiHnwkmDcH4M0yRSn03mkwHdRxGf/3HlpbNPY/BTUxldVxiKI0Xyrymdy5tpP7D9r9Dnqy9o13N62w==',
  pubKey: 'Awrb3Ou8+37VJeiBrMtmp1yDecbpFKBSH5CRvXUMv5bL',
  privateKey: 'sQxk+qdlg1wl0Ih6TPmpoJrJ9GZbe7jRn5EKHcAZIws=',
  signedTxBase64:
    'CpkBCpYBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEm0KKXRwMXVtbmVkN3d4N2xlNzB0dHZyY2VtM2ZzeWhuMzQzYXNyMmsycHdlEjB0cHZhbG9wZXIxdGdxNmNwdTZobXNydmt2ZHU4Mmo5OXRzeHh3N3FxYWpuODQzZmUaDgoFbmhhc2gSBTEwMDAwEmwKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQMK29zrvPt+1SXogazLZqdcg3nG6RSgUh+Qkb11DL+WyxIECgIIARgVEhgKEgoFbmhhc2gSCTM4MTAwMDAwMBDAmgwaQAdGheZ3GzIh58JJg3B+DNMkUp9N5pMB3UcRn/9x5aWzT2PwU1MZXVcYiiNF8q8pncubaT+w/a/Q56svaNdzets=',
  delegator: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
  validator: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  chainId: 'pio-testnet-1',
  accountNumber: 172176,
  sequence: 21,
  sendAmount: '10000',
  feeAmount: '381000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
      validatorAddress: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
      amount: {
        denom: 'nhash',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'nhash',
        amount: '381000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '845F365BCBBB67635A536A11173896193D37050DB2B3241532B911FD757FDDA6',
  signature: 'lKAThw9ZFtQ9ODF9nubx+dsYVhOrLpqA0+WcFDtiVg0w8YH9OsTl6j7xKtRvBNoClR4Wr2OiRKeAa3TyiTGmjw==',
  pubKey: 'Awrb3Ou8+37VJeiBrMtmp1yDecbpFKBSH5CRvXUMv5bL',
  privateKey: 'sQxk+qdlg1wl0Ih6TPmpoJrJ9GZbe7jRn5EKHcAZIws=',
  signedTxBase64:
    'CpsBCpgBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEl0KKXRwMXVtbmVkN3d4N2xlNzB0dHZyY2VtM2ZzeWhuMzQzYXNyMmsycHdlEjB0cHZhbG9wZXIxdGdxNmNwdTZobXNydmt2ZHU4Mmo5OXRzeHh3N3FxYWpuODQzZmUSbApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAwrb3Ou8+37VJeiBrMtmp1yDecbpFKBSH5CRvXUMv5bLEgQKAggBGBYSGAoSCgVuaGFzaBIJMzgxMDAwMDAwEMCaDBpAlKAThw9ZFtQ9ODF9nubx+dsYVhOrLpqA0+WcFDtiVg0w8YH9OsTl6j7xKtRvBNoClR4Wr2OiRKeAa3TyiTGmjw==',
  delegator: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
  validator: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  chainId: 'pio-testnet-1',
  accountNumber: 172176,
  sequence: 22,
  sendAmount: '10000',
  feeAmount: '381000000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
      validatorAddress: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
      amount: {
        denom: 'nhash',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'nhash',
        amount: '381000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '0D53DAC5D0B321A44B9C7C51462B473DECB062A62EC457AAE40384F6AA41B6E4',
  signature: '6YpFOr9gj2oe1b+EKrTP4W/m83qA3CtQaqz6lWDoAG0nd4zetSVJmpedGe4drAnUE1Z5vtLalNam/nQSU7JJ8g==',
  pubKey: 'Awrb3Ou8+37VJeiBrMtmp1yDecbpFKBSH5CRvXUMv5bL',
  privateKey: 'sQxk+qdlg1wl0Ih6TPmpoJrJ9GZbe7jRn5EKHcAZIws=',
  signedTxBase64:
    'Co0BCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKXRwMXVtbmVkN3d4N2xlNzB0dHZyY2VtM2ZzeWhuMzQzYXNyMmsycHdlEil0cDF5dHhoYTdsZzAwMnJ6ZDRqeG1haHJkanprZDYybXg5OWtsZ2pjYxoPCgVuaGFzaBIGMTAwMDAwEgE1EmwKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQMK29zrvPt+1SXogazLZqdcg3nG6RSgUh+Qkb11DL+WyxIECgIIARgTEhgKEgoFbmhhc2gSCTM4MTAwMDAwMBDAmgwaQOmKRTq/YI9qHtW/hCq0z+Fv5vN6gNwrUGqs+pVg6ABtJ3eM3rUlSZqXnRnuHawJ1BNWeb7S2pTWpv50ElOySfI=',
  from: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
  to: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
  chainId: 'pio-testnet-1',
  accountNumber: 172176,
  sequence: 19,
  sendAmount: '100000',
  feeAmount: '381000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'nhash',
          amount: '100000',
        },
      ],
      toAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
      fromAddress: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'nhash',
        amount: '381000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'tp1umned7wx7le70ttvrcem3fsyhn343asr2k2pwe',
  address2: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
  address3: 'txp1x96r8u4a48k6khknrhzd6c8cm3c64ewxy5prj',
  address4: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj',
  validatorAddress1: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  validatorAddress2: 'tpvaloper1tgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  validatorAddress3: 'txvaloper1xxxxcpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  validatorAddress4: 'tpvalopr1xtgq6cpu6hmsrvkvdu82j99tsxxw7qqajn843fe',
  noMemoIdAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
  validMemoIdAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc?memoId=2',
  invalidMemoIdAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc?memoId=xyz',
  multipleMemoIdAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: 'F0AF84C97E51CDAE5A66E0722D937E730F760965BC5CE4EFC4F7698A1AA41D50',
  hash2: 'D47226B9967C280944518A2EA380D9D37DA2BCCBAAF65353E5DC7B2A19758D59',
};

export const txIds = {
  hash1: '28AE90D649888F5DEDBA78357414C48318794B36224FABC27AE73F614934DB9B',
  hash2: 'A110DB465991F925A2F3FA3B6809809D653DEAEEDC6AE9392018CD4EEB2CCD1D',
  hash3: '854451C513A6D9BD4408F20160D61D81673A37BDAA8377F2D51F19FAEB176140',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uhash' },
  amount2: { amount: '0.1', denom: 'hash' },
  amount3: { amount: '100000000000', denom: 'nhash' },
  amount4: { amount: '-1', denom: 'nhash' },
  amount5: { amount: '1000', denom: 'hhash' },
};

export const wrwUser = {
  senderAddress: 'tp1l2057hncsv40g6hhsdmga0d99whlmpj7qppl29',
  destinationAddress: 'tp1ytxha7lg002rzd4jxmahrdjzkd62mx99klgjcc',
  userPrivateKey:
    '{"iv":"ccowAI86nbNnXmZwiyeA1w==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"LjNDH3Wb5jE=","ct":"/bdRWgk3p3BMRx\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"VsX1W4JqNvouTMPMxsEpVQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"siHVlTd1ay0=","ct":"lsndtVZ3H0PICa\n' +
    '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"}',
  bitgoPublicKey:
    '03330c95c4f1384aa0e44d9c03c81591cb23d60d62c9c5ca75c891ef45d242ba1eb7906e4d9\n' +
    'e26577f0fef872e7cbba8472900f520f8e3436960f9d081e804bce8',
  walletPassphrase: 'bitgo_test@123',
};
