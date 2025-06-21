export const TEST_ACCOUNT = {
  pubAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  compressedPublicKey: '02bcdbd054a73aa6097c1926c87eb7d66142d2ea710584c4b3e9844e1dab1538f0',
  compressedPublicKeyTwo: '02001fda4568760a99e58ee295b4a51edcc6a689297a71f7d1571cf4e1253abcde',
  uncompressedPublicKey:
    '04bcdbd054a73aa6097c1926c87eb7d66142d2ea710584c4b3e9844e1dab1538f0a088291e83cb3438431deb5e251439e338d8edc4389ea2004f442a73cc97afc8',
  privateKey: '3f020639e98e5c4953abb23d01a7c892e83b57593a7f46f37298b58cbf1cacd5',
  extendedPrv:
    'xprv9s21ZrQH143K3n6kDURwkfkBxB58Fxoz7cFCbpQeFws4K5iXaSUcpq18cCqJQ74MnqNrnLBHfE7YvUgKpnckmpsBLExGSRK55Ud5uuxGrxL',
  extendedPub:
    'xpub661MyMwAqRbcGGBDKVxx7ogvWCucfRXqUqAoQCpFpHQ3Bt3g7ynsNdKcTWvGGYrpq6VYPPgxjMfKaszXMhKmmCZEnhg9RpqcGeP9uCnZsD9',
};

export const TEST_SEND_TX = {
  hash: 'AF0E060E0B5FD6041010B7A93340A045286F48D03CDCC81C4C29D11730334AD1',
  signature: '5H3a5WlZS3yvL+muU8qPB1IlYBxvuu7vIDOQuIc0JMU06kNtj8arKQLH9NGEpweu3u84KXYURA+Qxo8AzoO8Zw==',
  pubKey: 'AtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHL',
  privateKey: 'peFJjp2ECSNTRdKBfVhv8aGgoUBbmYPp2+l9prY5zjc=',
  signedTxBase64:
    'CowBCokBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmkKK3Rjcm8xZTlyeHkzajN3cGgwbHFqeHIweW51MHQzempmbmhjMGNzeWxkdGwSK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoaDQoIYmFzZXRjcm8SATESawpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHLEgQKAggBGAoSFwoRCghiYXNldGNybxIFMzAwMDAQoMIeGkDkfdrlaVlLfK8v6a5Tyo8HUiVgHG+67u8gM5C4hzQkxTTqQ22PxqspAsf00YSnB67e7zgpdhRED5DGjwDOg7xn',
  sender: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  recipient: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  chainId: 'testnet-croeseid-4',
  accountNumber: 10,
  sequence: 10,
  sendAmount: '1',
  feeAmount: '30000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'basetcro',
          amount: '1',
        },
      ],
      toAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
      fromAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
    },
  },
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const TEST_SEND_TX2 = {
  hash: '37942344412F197189EDFA4B421E1E44048C037D1D9742F9C7EABA9E4A3C5B27',
  signature: 'anxlla2d+vQUxsjRHBUqRrzwL2nekKFY098V637a7+d8w4aYL+RThxW62xyQa4ufuetPutB/YCCzt4LHJS9F2A==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CpABCo0BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm0KK3Rjcm8xZTlyeHkzajN3cGgwbHFqeHIweW51MHQzempmbmhjMGNzeWxkdGwSK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoaEQoIYmFzZXRjcm8SBTEwMDAwEmsKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgJEhcKEQoIYmFzZXRjcm8SBTMwMDAwEKDCHhpAanxlla2d+vQUxsjRHBUqRrzwL2nekKFY098V637a7+d8w4aYL+RThxW62xyQa4ufuetPutB/YCCzt4LHJS9F2A==',
  sender: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  recipient: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  chainId: 'testnet-croeseid-4',
  accountNumber: 9,
  sequence: 9,
  sendAmount: '10000',
  feeAmount: '30000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'basetcro',
          amount: '10000',
        },
      ],
      toAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
      fromAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
    },
  },
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: '553F1D275853B7DC7977A9D8A70C273CB9090312B5ABBA65CE4D5528D6197A66',
  signature: 'NWUXRBK0dYdaVxQyOwjzEkahZrZs04zxF/RxMpSAjj5vMnmuNiM+ru6kqvkMchembRzwJ+Q8kATYNutcZvmuLQ==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CqACCo0BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm0KK3Rjcm8xZTlyeHkzajN3cGgwbHFqeHIweW51MHQzempmbmhjMGNzeWxkdGwSK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoaEQoIYmFzZXRjcm8SBTEwMDAwCo0BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm0KK3Rjcm8xZTlyeHkzajN3cGgwbHFqeHIweW51MHQzempmbmhjMGNzeWxkdGwSK3Rjcm8xdTczY21lbWRnZDVxeDA2Y210ZWhyM3o1cGdzd3RhcjY1ZjlzcDUaEQoIYmFzZXRjcm8SBTEwMDAwEmsKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgIEhcKEQoIYmFzZXRjcm8SBTMwMDAwEKDCHhpANWUXRBK0dYdaVxQyOwjzEkahZrZs04zxF/RxMpSAjj5vMnmuNiM+ru6kqvkMchembRzwJ+Q8kATYNutcZvmuLQ==',
  sender: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  chainId: 'testnet-croeseid-4',
  accountNumber: 8,
  sequence: 8,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'basetcro',
            amount: '10000',
          },
        ],
        toAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
        fromAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'basetcro',
            amount: '10000',
          },
        ],
        toAddress: 'tcro1u73cmemdgd5qx06cmtehr3z5pgswtar65f9sp5',
        fromAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'A461E34341B43D85E8C0701D85E1E0AC49F85BE1B9E73F0A024D9A6B9E2FBAD9',
  signature: '0/0pH7+fBUNgiSnQg+to2HTOZfhhPs9Ji63Eu5aLDghkkaEbX56BuE3hs9xAOAMvi/tWtxP5qHLw7uN2p8PS4Q==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CpEBCokBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmkKK3Rjcm8xZTlyeHkzajN3cGgwbHFqeHIweW51MHQzempmbmhjMGNzeWxkdGwSK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoaDQoIYmFzZXRjcm8SATESAzI0MRJnClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDBPjGiu7ED4OQrKevUsfsIzrRHBHsunkifBDkhJo3UfASBAoCCAEYBRITCg0KCGJhc2V0Y3JvEgExEKDCHhpA0/0pH7+fBUNgiSnQg+to2HTOZfhhPs9Ji63Eu5aLDghkkaEbX56BuE3hs9xAOAMvi/tWtxP5qHLw7uN2p8PS4Q==',
  from: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  to: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  chainId: 'testnet-croeseid-4',
  accountNumber: 5,
  sequence: 5,
  feeAmount: '30000',
  sendAmount: '1',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'basetcro',
          amount: '1',
        },
      ],
      fromAddress: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
      toAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
    },
  },
  memo: '241',
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '1' }],
    gasLimit: 500000,
  },
};

export const address = {
  address1: 'tcro1e9rxy3j3wph0lqjxr0ynu0t3zjfnhc0csyldtl',
  address2: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  address3: 'tcro1u73cmemdgd5qx06cmtehr3z5pgswtar65f9sp54',
  address4: 'cro19syhqw5qeuas365cw9pvdadzax7durfm7hlfn8',
  address5: 'tcro19syhqw5qecduas365cw9pvdadzax7durfm7hlfn8',
  address6: 'tcro19syhqw5qeuas365c.9pvdadzax7durfm7hlfn8',
  validatorAddress1: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
  validatorAddress2: 'tcrocncl163tv59yzgeqcap8lrsa2r4zk580h8ddr5a0sdd',
  validatorAddress3: 'tcrocncl1rd8ye27kdy2h92hlk6xzqaa8tp2wd9vftpzheksd',
  validatorAddress4: 'tcrocncl1uw77lwy0zfwuuk6a7w6vre4wccweeevu025kny12',
  noMemoIdAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  validMemoIdAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj?memoId=2',
  invalidMemoIdAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj?memoId=1.23',
  multipleMemoIdAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '5A34334D251FDA6E1965BF8888A351E46B114D858988C355041E203C2360BC79',
  hash2: '109E069C5D24C0E4637ECABF6885093DB40B6EF0A9B545F3E9CE76900B7E5CFA',
};

export const txIds = {
  hash1: 'AF0E060E0B5FD6041010B7A93340A045286F48D03CDCC81C4C29D11730334AD1',
  hash2: '37942344412F197189EDFA4B421E1E44048C037D1D9742F9C7EABA9E4A3C5B27',
  hash3: 'AA9E4619E83558BCCC006A377ED11978B5BB196F40AB24ED52A0C35BE34E295C',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'basetcro' },
  amount2: { amount: '1000000', denom: 'basetcro' },
  amount3: { amount: '10000000', denom: 'basetcro' },
  amount4: { amount: '-1', denom: 'basetcro' },
  amount5: { amount: '1000000000', denom: 'mbasetcro' },
};

export const TEST_DELEGATE_TX = {
  hash: '01BA59AAF0EC2AAAB8B036B16C27E654C57822BEB8AE3FDDC22C31D5ED7521D8',
  signature: '5H3a5WlZS3yvL+muU8qPB1IlYBxvuu7vIDOQuIc0JMU06kNtj8arKQLH9NGEpweu3u84KXYURA+Qxo8AzoO8Zw==',
  pubKey: 'AtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHL',
  privateKey: 'peFJjp2ECSNTRdKBfVhv8aGgoUBbmYPp2+l9prY5zjc=',
  signedTxBase64:
    'CpkBCpYBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJvCit0Y3JvMXJoczQwMnZuamY3MzY5eXlqa2swbnJza3VwbWZsNHl4cG5hYWhqEi90Y3JvY25jbDFzNGdncTJ6dXp2d2c1azh2bngyeGZ3dGRtNGN6Nnd0bnVxa2w3YRoPCghiYXNldGNybxIDMTAwEmoKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQLZTWi43eYo2qTX8SQsziVeKXTAaLhKJgAxzYEBD7pRyxIECgIIARgKEhYKEAoIYmFzZXRjcm8SBDUwMDAQwJoMGkDkfdrlaVlLfK8v6a5Tyo8HUiVgHG+67u8gM5C4hzQkxTTqQ22PxqspAsf00YSnB67e7zgpdhRED5DGjwDOg7xn',
  delegator: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  validator: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
  chainId: 'testnet-croeseid-4',
  accountNumber: 10,
  sequence: 10,
  sendAmount: '100',
  feeAmount: '5000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
      validatorAddress: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
      amount: {
        denom: 'basetcro',
        amount: '100',
      },
    },
  },
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '5000' }],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '0148F45CD290B9D4A5594ACC49707C362A3275AE00F881776BE2B8929FC3A430',
  signature: '5H3a5WlZS3yvL+muU8qPB1IlYBxvuu7vIDOQuIc0JMU06kNtj8arKQLH9NGEpweu3u84KXYURA+Qxo8AzoO8Zw==',
  pubKey: 'AtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHL',
  privateKey: 'peFJjp2ECSNTRdKBfVhv8aGgoUBbmYPp2+l9prY5zjc=',
  signedTxBase64:
    'CpsBCpgBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEm8KK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoSL3Rjcm9jbmNsMXM0Z2dxMnp1enZ3ZzVrOHZueDJ4Znd0ZG00Y3o2d3RudXFrbDdhGg8KCGJhc2V0Y3JvEgMxMDASawpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHLEgQKAggBGAoSFwoRCghiYXNldGNybxIFNTAwMDAQwJoMGkDkfdrlaVlLfK8v6a5Tyo8HUiVgHG+67u8gM5C4hzQkxTTqQ22PxqspAsf00YSnB67e7zgpdhRED5DGjwDOg7xn',
  delegator: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  validator: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
  chainId: 'testnet-croeseid-4',
  accountNumber: 10,
  sequence: 10,
  sendAmount: '100',
  feeAmount: '5000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
      validatorAddress: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
      amount: {
        denom: 'basetcro',
        amount: '100',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'basetcro',
        amount: '50000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_REDELEGATE_TX = {
  hash: '01BDED57D2A48B9CC3F47AFE9BFFEB934ABC0E83B83E9DF8B60C1C0843583A46',
  signature: '5H3a5WlZS3yvL+muU8qPB1IlYBxvuu7vIDOQuIc0JMU06kNtj8arKQLH9NGEpweu3u84KXYURA+Qxo8AzoO8Zw==',
  pubKey: 'AtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHL',
  privateKey: 'peFJjp2ECSNTRdKBfVhv8aGgoUBbmYPp2+l9prY5zjc=',
  signedTxBase64:
    'CtIBCs8BCiovY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dCZWdpblJlZGVsZWdhdGUSoAEKK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoSL3Rjcm9jbmNsMXM0Z2dxMnp1enZ3ZzVrOHZueDJ4Znd0ZG00Y3o2d3RudXFrbDdhGi90Y3JvY25jbDE2M3R2NTl5emdlcWNhcDhscnNhMnI0ems1ODBoOGRkcjVhMHNkZCIPCghiYXNldGNybxIDMTAwEmoKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQLZTWi43eYo2qTX8SQsziVeKXTAaLhKJgAxzYEBD7pRyxIECgIIARgKEhYKEAoIYmFzZXRjcm8SBDgwMDAQ4KcSGkDkfdrlaVlLfK8v6a5Tyo8HUiVgHG+67u8gM5C4hzQkxTTqQ22PxqspAsf00YSnB67e7zgpdhRED5DGjwDOg7xn',
  delegator: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  validator: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
  validatorDst: 'tcrocncl163tv59yzgeqcap8lrsa2r4zk580h8ddr5a0sdd',
  chainId: 'testnet-croeseid-4',
  accountNumber: 10,
  sequence: 10,
  sendAmount: '100',
  feeAmount: '5000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    value: {
      delegatorAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
      validatorSrcAddress: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
      validatorDstAddress: 'tcrocncl163tv59yzgeqcap8lrsa2r4zk580h8ddr5a0sdd',
      amount: {
        denom: 'basetcro',
        amount: '100',
      },
    },
  },
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '8000' }],
    gasLimit: 300000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '4CAA5DDBFB138D555DDDEFC8E256BDD3CFC201C6C71DC3BB245A412EB29CB49A',
  signature: '5H3a5WlZS3yvL+muU8qPB1IlYBxvuu7vIDOQuIc0JMU06kNtj8arKQLH9NGEpweu3u84KXYURA+Qxo8AzoO8Zw==',
  pubKey: 'AtlNaLjd5ijapNfxJCzOJV4pdMBouEomADHNgQEPulHL',
  privateKey: 'peFJjp2ECSNTRdKBfVhv8aGgoUBbmYPp2+l9prY5zjc=',
  signedTxBase64:
    'CpwBCpkBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEl4KK3Rjcm8xcmhzNDAydm5qZjczNjl5eWprazBucnNrdXBtZmw0eXhwbmFhaGoSL3Rjcm9jbmNsMXM0Z2dxMnp1enZ3ZzVrOHZueDJ4Znd0ZG00Y3o2d3RudXFrbDdhEmoKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQLZTWi43eYo2qTX8SQsziVeKXTAaLhKJgAxzYEBD7pRyxIECgIIARgKEhYKEAoIYmFzZXRjcm8SBDUwMDAQwJoMGkDkfdrlaVlLfK8v6a5Tyo8HUiVgHG+67u8gM5C4hzQkxTTqQ22PxqspAsf00YSnB67e7zgpdhRED5DGjwDOg7xn',
  delegator: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
  validator: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
  chainId: 'testnet-croeseid-4',
  accountNumber: 10,
  sequence: 10,
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'tcro1rhs402vnjf7369yyjkk0nrskupmfl4yxpnaahj',
      validatorAddress: 'tcrocncl1s4ggq2zuzvwg5k8vnx2xfwtdm4cz6wtnuqkl7a',
    },
  },
  gasBudget: {
    amount: [{ denom: 'basetcro', amount: '5000' }],
    gasLimit: 200000,
  },
};
