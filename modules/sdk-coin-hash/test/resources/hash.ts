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
