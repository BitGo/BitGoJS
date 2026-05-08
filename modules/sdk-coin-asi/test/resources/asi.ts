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

export const TEST_DELEGATE_TX = {
  hash: 'A8BD3DE82A4B2453EC5EC86577EB60638741C8A10EEE0038941D36F5D5EC4F1A',
  signature: '+p86as/2XFjVHVLjQERp5aeMa7lHuxdoXiZGYp2onbs2Yt3QsLuElqD6Eg3wNq5BbCyzoj89d7l1tmoJHWML4Q==',
  pubKey: 'A/iPk4rOMnePj2eLaJrJuP+3wfQl5RuNWnatW8Ppwj3L',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CqIBCp8BCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ4CixmZXRjaDE3NTNmNzhmMmNwNjdzM2RkODkzZDBnbjBmYTNyeTBybmM2eTJ6dRIzZmV0Y2h2YWxvcGVyMXJzYW5lOTg4dmtzcmdwMm1scXpjbG10OHd1Y3h2MGVqNGhybjJrGhMKCGF0ZXN0ZmV0EgcxMDAwMDAwEnUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQP4j5OKzjJ3j49ni2iaybj/t8H0JeUbjVp2rVvD6cI9yxIECgIIARgIEiEKGwoIYXRlc3RmZXQSDzI1MDAwMDAwMDAwMDAwMBCQoQ8aQPqfOmrP9lxY1R1S40BEaeWnjGu5R7sXaF4mRmKdqJ27NmLd0LC7hJag+hIN8DauQWwss6I/PXe5dbZqCR1jC+E=',
  validator: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
  delegator: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 8,
  sequence: 8,
  sendAmount: '1000000',
  feeAmount: '250000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      validatorAddress: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
      delegatorAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
      amount: {
        denom: 'atestfet',
        amount: '1000000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'atestfet',
        amount: '250000000000000',
      },
    ],
    gasLimit: 250000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: 'DC6F8F0115C069B9C4D2013F7D1515432C0CEDC821B50E045FE4CEB3E442EC3A',
  signature: 'oXtW0tQjyKJB5Du66WTSrFyqMbKEQ2vnXHKwmSqtsY8x7uqNCenJSbN0QL6GZ48Fr7iNaTZBE7+TJOEL5RfiTg==',
  pubKey: 'A/iPk4rOMnePj2eLaJrJuP+3wfQl5RuNWnatW8Ppwj3L',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CqABCp0BCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnQKLGZldGNoMTc1M2Y3OGYyY3A2N3MzZGQ4OTNkMGduMGZhM3J5MHJuYzZ5Mnp1EjNmZXRjaHZhbG9wZXIxcnNhbmU5ODh2a3NyZ3AybWxxemNsbXQ4d3VjeHYwZWo0aHJuMmsaDwoIYXRlc3RmZXQSAzEwMBJ1ClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiED+I+Tis4yd4+PZ4tomsm4/7fB9CXlG41adq1bw+nCPcsSBAoCCAEYCBIhChsKCGF0ZXN0ZmV0Eg8yNTAwMDAwMDAwMDAwMDAQkKEPGkChe1bS1CPIokHkO7rpZNKsXKoxsoRDa+dccrCZKq2xjzHu6o0J6clJs3RAvoZnjwWvuI1pNkETv5Mk4QvlF+JO',
  validator: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
  delegator: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 8,
  sequence: 8,
  sendAmount: '100',
  feeAmount: '250000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
      validatorAddress: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
      amount: {
        denom: 'atestfet',
        amount: '100',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'atestfet',
        amount: '250000000000000',
      },
    ],
    gasLimit: 250000,
  },
};

export const TEST_REDELEGATE_TX = {
  hash: 'A36F88D8A810DFCD256746E55D29644D491812B2D13FB8E98C1708749885042D',
  signature: 'cPbIm75ZXDUnNOyfNWoRXIPfI2QchcghQ7O86PgOGppHAWWsDa5e9MfOKOnO42CnPNz79hWbFJHSos9blQEMEA==',
  pubKey: 'A/iPk4rOMnePj2eLaJrJuP+3wfQl5RuNWnatW8Ppwj3L',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'Ct4BCtsBCiovY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dCZWdpblJlZGVsZWdhdGUSrAEKLGZldGNoMTc1M2Y3OGYyY3A2N3MzZGQ4OTNkMGduMGZhM3J5MHJuYzZ5Mnp1EjNmZXRjaHZhbG9wZXIxcnNhbmU5ODh2a3NyZ3AybWxxemNsbXQ4d3VjeHYwZWo0aHJuMmsaM2ZldGNodmFsb3BlcjFqZTdyOHl1cWdhZjVmMnR4NHoyZjkwMDh3cDRqeDBjdDZtc256ZyISCghhdGVzdGZldBIGMTAwMDAwEnUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQP4j5OKzjJ3j49ni2iaybj/t8H0JeUbjVp2rVvD6cI9yxIECgIIARgIEiEKGwoIYXRlc3RmZXQSDzI1MDAwMDAwMDAwMDAwMBCQoQ8aQHD2yJu+WVw1JzTsnzVqEVyD3yNkHIXIIUOzvOj4DhqaRwFlrA2uXvTHzijpzuNgpzzc+/YVmxSR0qLPW5UBDBA=',
  validator: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
  validatorDst: 'fetchvaloper1je7r8yuqgaf5f2tx4z2f9008wp4jx0ct6msnzg',
  delegator: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 8,
  sequence: 8,
  sendAmount: '100',
  feeAmount: '250000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    value: {
      delegatorAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
      validatorSrcAddress: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
      validatorDstAddress: 'fetchvaloper1je7r8yuqgaf5f2tx4z2f9008wp4jx0ct6msnzg',
      amount: {
        denom: 'atestfet',
        amount: '100000',
      },
    },
  },
  gasBudget: {
    amount: [{ denom: 'atestfet', amount: '250000000000000' }],
    gasLimit: 250000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '3B9236E5EEB2D657E4A7F1E32583C621B7EB1EAF5E51F841010F39F63FD3DBC4',
  signature: 'WjzqdlfBdzokA8AbalFgT6oKeDbBaKbcTP4z+Auo/AdvZytEu77j1CSGmVXOprx12npT33FI+hZvMmPp5YZshg==',
  pubKey: 'A/iPk4rOMnePj2eLaJrJuP+3wfQl5RuNWnatW8Ppwj3L',
  privateKey: '06tW+IizHiD8gQGxJ6f6xSty27MlzdUs9TwMc9iWcVM=',
  signedTxBase64:
    'CqEBCp4BCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmMKLGZldGNoMTc1M2Y3OGYyY3A2N3MzZGQ4OTNkMGduMGZhM3J5MHJuYzZ5Mnp1EjNmZXRjaHZhbG9wZXIxcnNhbmU5ODh2a3NyZ3AybWxxemNsbXQ4d3VjeHYwZWo0aHJuMmsSdQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohA/iPk4rOMnePj2eLaJrJuP+3wfQl5RuNWnatW8Ppwj3LEgQKAggBGAgSIQobCghhdGVzdGZldBIPMjUwMDAwMDAwMDAwMDAwEJChDxpAWjzqdlfBdzokA8AbalFgT6oKeDbBaKbcTP4z+Auo/AdvZytEu77j1CSGmVXOprx12npT33FI+hZvMmPp5YZshg==',
  validator: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
  delegator: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
  chainId: 'dorado-1',
  accountNumber: 8,
  sequence: 8,
  sendAmount: '100',
  feeAmount: '250000000000000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'fetch1753f78f2cp67s3dd893d0gn0fa3ry0rnc6y2zu',
      validatorAddress: 'fetchvaloper1rsane988vksrgp2mlqzclmt8wucxv0ej4hrn2k',
    },
  },
  gasBudget: {
    amount: [{ denom: 'atestfet', amount: '250000000000000' }],
    gasLimit: 250000,
  },
};
