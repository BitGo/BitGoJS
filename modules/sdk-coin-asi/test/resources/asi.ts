export const TEST_ACCOUNT = {
  pubAddress: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
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
  hash: 'C23206B4F9A58AE97709913C292CA3C8414705B1752A85420ECCD48477C994A0',
  signature: 'yu/xu+ZErYiD8kz0yLSxN8vcb0c2czjiQZ5izzs+L1Ij0qpZ5c6+WBbA0v46pPe18Uy2A7bnsvG+F94PjDcmPA==',
  pubKey: 'AhbGVZ/tNWMeQdYLoTILXP6yrP/JuV9O1MahYUTV/fbX',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CpIBCo8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm8KLGZldGNoMXY2MHBobHV4eHY4NXdycnEya2puaHczMzZqNjhjdGR4ZzU5dmttEixmZXRjaDE3NTNmNzhmMmNwNjdzM2RkODkzZDBnbjBmYTNyeTBybmM2eTJ6dRoRCghhdGVzdGZldBIFMTAwMDASdQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAhbGVZ/tNWMeQdYLoTILXP6yrP/JuV9O1MahYUTV/fbXEgQKAggBGAgSIQobCghhdGVzdGZldBIPMTAwMDAwMDAwMDAwMDAwEKCNBhpAyu/xu+ZErYiD8kz0yLSxN8vcb0c2czjiQZ5izzs+L1Ij0qpZ5c6+WBbA0v46pPe18Uy2A7bnsvG+F94PjDcmPA==',
  sender: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
  recipient: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 8,
  sequence: 8,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'atestfet',
          amount: '10000',
        },
      ],
      toAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
      fromAddress: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
    },
  },
  gasBudget: {
    amount: [{ denom: 'atestfet', amount: '100000000000000' }],
    gasLimit: 100000,
  },
};

export const TEST_SEND_TX2 = {
  hash: '58136389A3FCA2F7600ADDA5A168408F2E684E141FCF9E841910B2A210EA174B',
  signature: 'UX+f9159YGdnpVghlSHRVQvKcGT+qxoGcUkQs6lHtV9eHXA6HLpGGrMwL/dN6XJBrthglPrCXSahNcRNZy3hgw==',
  pubKey: 'AhbGVZ/tNWMeQdYLoTILXP6yrP/JuV9O1MahYUTV/fbX',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CpIBCo8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm8KLGZldGNoMXY2MHBobHV4eHY4NXdycnEya2puaHczMzZqNjhjdGR4ZzU5dmttEixmZXRjaDE3NTNmNzhmMmNwNjdzM2RkODkzZDBnbjBmYTNyeTBybmM2eTJ6dRoRCghhdGVzdGZldBIFMTAwMDASdQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAhbGVZ/tNWMeQdYLoTILXP6yrP/JuV9O1MahYUTV/fbXEgQKAggBGBESIQobCghhdGVzdGZldBIPMTAwMDAwMDAwMDAwMDAwEKCNBhpAUX+f9159YGdnpVghlSHRVQvKcGT+qxoGcUkQs6lHtV9eHXA6HLpGGrMwL/dN6XJBrthglPrCXSahNcRNZy3hgw==',
  sender: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
  recipient: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 17,
  sequence: 17,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'atestfet',
          amount: '10000',
        },
      ],
      toAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
      fromAddress: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
    },
  },
  gasBudget: {
    amount: [{ denom: 'atestfet', amount: '100000000000000' }],
    gasLimit: 100000,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: 'E3EE15DF1FB4C4DCCE4F72FA524C33DE8FAB937A4CC43D5F7AF8747398A5B766',
  signature: 'Ay9E6/64xRYmP4aPDgquNm16ZRIsFaYSTWRQCS1YWWgqnuOGwCWKYUeFLSZROBjUhx26MZX7tzLXSmDQbpnQug==',
  pubKey: 'AhbGVZ/tNWMeQdYLoTILXP6yrP/JuV9O1MahYUTV/fbX',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CqQCCo8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm8KLGZldGNoMXY2MHBobHV4eHY4NXdycnEya2puaHczMzZqNjhjdGR4ZzU5dmttEixmZXRjaDE3NTNmNzhmMmNwNjdzM2RkODkzZDBnbjBmYTNyeTBybmM2eTJ6dRoRCghhdGVzdGZldBIFMTAwMDAKjwEKHC9jb3Ntb3MuYmFuay52MWJldGExLk1zZ1NlbmQSbwosZmV0Y2gxdjYwcGhsdXh4djg1d3JycTJram5odzMzNmo2OGN0ZHhnNTl2a20SLGZldGNoMTAzNTI5ZGF4NXM2anUwNHhnZmtxdTBhZWhhYWd5bjQ1bWRjd3JlGhEKCGF0ZXN0ZmV0EgUxMDAwMBJ1ClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECFsZVn+01Yx5B1guhMgtc/rKs/8m5X07UxqFhRNX99tcSBAoCCAEYEBIhChsKCGF0ZXN0ZmV0Eg8xMDAwMDAwMDAwMDAwMDAQoI0GGkADL0Tr/rjFFiY/ho8OCq42bXplEiwVphJNZFAJLVhZaCqe44bAJYphR4UtJlE4GNSHHboxlfu3MtdKYNBumdC6',
  sender: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
  chainId: 'dorado-1',
  accountNumber: 16,
  sequence: 16,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'atestfet',
            amount: '10000',
          },
        ],
        toAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
        fromAddress: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'atestfet',
            amount: '10000',
          },
        ],
        toAddress: 'fetch103529dax5s6ju04xgfkqu0aehaagyn45mdcwre',
        fromAddress: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'atestfet', amount: '100000000000000' }],
    gasLimit: 100000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'E439A7F40701015BE34E2F1EC60065CDF001E86FD49806C53F0844C992965442',
  signature: '5LP2fhRkAb+G/HNgQjyLkU+aIrVuk6yYkq6IU/JI9SBhtju441MOjS9XQ5ZZ6WT9t+muP6a8H0nQ1ZKtvQNZkg==',
  pubKey: 'AhbGVZ/tNWMeQdYLoTILXP6yrP/JuV9O1MahYUTV/fbX',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CpMBCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKLGZldGNoMXY2MHBobHV4eHY4NXdycnEya2puaHczMzZqNjhjdGR4ZzU5dmttEixmZXRjaDE3NTNmNzhmMmNwNjdzM2RkODkzZDBnbjBmYTNyeTBybmM2eTJ6dRoNCghhdGVzdGZldBIBMRIDMjQxEnUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQIWxlWf7TVjHkHWC6EyC1z+sqz/yblfTtTGoWFE1f321xIECgIIARgSEiEKGwoIYXRlc3RmZXQSDzEwMDAwMDAwMDAwMDAwMBCgjQYaQOSz9n4UZAG/hvxzYEI8i5FPmiK1bpOsmJKuiFPySPUgYbY7uONTDo0vV0OWWelk/bfprj+mvB9J0NWSrb0DWZI=',
  from: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
  to: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 18,
  sequence: 18,
  feeAmount: '100000000000000',
  sendAmount: '1',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'atestfet',
          amount: '1',
        },
      ],
      fromAddress: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
      toAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
    },
  },
  memo: '241',
  gasBudget: {
    amount: [{ denom: 'atestfet', amount: '100000000000000' }],
    gasLimit: 100000,
  },
};

export const address = {
  address1: 'fetch1v60phluxxv85wrrq2kjnhw336j68ctdxg59vkm',
  address2: 'fetch17xpfvakm2amg962yls6f84z3kell8c5lry2yf2',
  address3: 'fetch17xpfvakm2amg962yls6f84z3kell8c5lry2-yf2',
  address4: 'fetch103529dax5s6ju04xgfkqu0332agyn45mdcwre',
  address5: 'fetch103529daxcd5s6ju04xgfkqu0aehaagyn45mdcwre',
  address6: 'fetch103529dax5s6ju04xgfkqu0aehaagyn45mdcwre.9pvdadzax7durfm7hlfn8',
  validatorAddress1: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
  validatorAddress2: 'fetchvaloper1je7r8yuqgaf5f2tx4z2f9008wp4jx0ct6msnzg',
  validatorAddress3: 'fetchvaloper1edqmkwy4rh87020rvf9xn7kktyu7x894l#d46w',
  validatorAddress4: 'fetchvaloper1edqmkw2y4rh87020rvf9xn7kktyu7x894led46w',
  noMemoIdAddress: 'fetch17xpfvakm2amg962yls6f84z3kell8c5lry2yf2',
  validMemoIdAddress: 'fetch17xpfvakm2amg962yls6f84z3kell8c5lry2yf2?memoId=2',
  invalidMemoIdAddress: 'fetch17xpfvakm2amg962yls6f84z3kell8c5lry2yf2?memoId=1.23',
  multipleMemoIdAddress: 'fetch17xpfvakm2amg962yls6f84z3kell8c5lry2yf2?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: 'E9FB894F357A88F33C3A3097A1354CFE0BFB4649AF07C032A590E549A564CED7',
  hash2: 'BD5B88D9DFE34C888CAA12C35A837A96CB420B422F21FD2C451BC3F6B9A446B1',
};

export const txIds = {
  hash1: '58136389A3FCA2F7600ADDA5A168408F2E684E141FCF9E841910B2A210EA174B',
  hash2: '7113A3B0757EDB21F7503F777B0520A25FA23D39CB4C7FB1265F69FBA32E601C',
  hash3: 'C23206B4F9A58AE97709913C292CA3C8414705B1752A85420ECCD48477C994A0',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'atestfet' },
  amount2: { amount: '1000000', denom: 'atestfet' },
  amount3: { amount: '10000000', denom: 'atestfet' },
  amount4: { amount: '-1', denom: 'atestfet' },
  amount5: { amount: '1000000000', denom: 'matestfet' },
};
