// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'haqq1z34mxtp9xd0tv89cfyvc9r4cckfqt3gs2a0xh5',
  compressedPublicKey: '029ae62ba5168f4a7e4a48ce9ec85b6a0ba1c7cbb676a95ff993f8b0df74a461df',
  compressedPublicKeyTwo: '031dabb2069dfa614b9457ce9fc84c2a7b3b6f5e3cbb57c633380c5f4fcfd1486a',
  uncompressedPublicKey:
    '049ae62ba5168f4a7e4a48ce9ec85b6a0ba1c7cbb676a95ff993f8b0df74a461df371b136a9be5dbc0e233ad70a733a37beeb41398df69376326c9207368255a6a',
  privateKey: '2bc15c7ea4881524469f94e053429d92b89f60d1efb5048258291052ae0f70ff',
  extendedPrv:
    'xprv9s21ZrQH143K2xS8TWuFksLBHRRc994e166knSrbtBYVLpXDNkEF1DX45MvAdW97nV9FsrzmPtPCcg8dMxzFBeS2SZ1pWHC2k8xLMuTv673',
  extendedPub:
    'xpub661MyMwAqRbcFSWbZYSG81GuqTG6YbnVNK2MaqGDSX5UDcrMvHYVZ1qXvdnt6EZWFXMwerL8ySqJvj91855WUxiRcvDyVTwTYDhJ3JYnC8f',
};

export const TEST_SEND_TX = {
  hash: '2679D297CD41346707EF8116D1691078199FEB8134D1EECAE5894B618D45AC84',
  signature: 'Edqy59rfNqIrgmBcHh4j6vsLIl9MeOldeVy/a1aa0yw3163yQBtqvV9Esn3rpwAWNzN6sBFjB00Of3VYdqoxLQ==',
  pubKey: 'AyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzj',
  privateKey: '3xn43lnhB0RxwYkJ2vW4UeBPPOcb947WYsYuqsOzXa0=',
  signedTxBase64:
    'Co4BCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK2hhcXExc2V5bXdyOHpzNmM5MnJjZnl6NmpsYTRhNTBkcm13Z3E5dHp2bHoSK2hhcXExOXAycm52emFoeHFoOXlrcmozcnFtamRndjBtejZlZm5qbWR6YTcaDwoFYUlTTE0SBjEwMDAwMBJ8ClkKTwooL2V0aGVybWludC5jcnlwdG8udjEuZXRoc2VjcDI1NmsxLlB1YktleRIjCiEDI7QTDMHGPtjNM6Y1v1NwgbIS+t18CWwzYuTIVvoVbOMSBAoCCAEYGBIfChkKBWFJU0xNEhA0MDAwMDAwMDAwMDAwMDAwEMCaDBpAEdqy59rfNqIrgmBcHh4j6vsLIl9MeOldeVy/a1aa0yw3163yQBtqvV9Esn3rpwAWNzN6sBFjB00Of3VYdqoxLQ==',
  sender: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
  recipient: 'haqq19p2rnvzahxqh9ykrj3rqmjdgv0mz6efnjmdza7',
  chainId: 'haqq_54211-3',
  accountNumber: 167676,
  sequence: 24,
  sendAmount: '100000',
  feeAmount: '4000000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
      toAddress: 'haqq19p2rnvzahxqh9ykrj3rqmjdgv0mz6efnjmdza7',
      amount: [
        {
          denom: 'aISLM',
          amount: '100000',
        },
      ],
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'aISLM',
        amount: '4000000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: 'F7E8933B59F514A0EEF66434C2438B639D208435071CC6F09BD07E229A19A262',
  signature: 'Bd9eww9Nh2WlH6vI8pPkD667hDXh/ErfjNkESsP5EokkUp/qbTaz0VWRXG6fJSbsY0iWhtonlnZqKCijAYqPgQ==',
  pubKey: 'AyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzj',
  privateKey: '3xn43lnhB0RxwYkJ2vW4UeBPPOcb947WYsYuqsOzXa0=',
  signedTxBase64:
    'CpwBCpkBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJyCitoYXFxMXNleW13cjh6czZjOTJyY2Z5ejZqbGE0YTUwZHJtd2dxOXR6dmx6EjJoYXFxdmFsb3BlcjE4eGEyZTJ6NG5kbWdlZjlhN2M3bGowMGV0dXR3MmRhZnl5aGRreBoPCgVhSVNMTRIGMTAwMDAwEnwKWQpPCigvZXRoZXJtaW50LmNyeXB0by52MS5ldGhzZWNwMjU2azEuUHViS2V5EiMKIQMjtBMMwcY+2M0zpjW/U3CBshL63XwJbDNi5MhW+hVs4xIECgIIARgREh8KGQoFYUlTTE0SEDQwMDAwMDAwMDAwMDAwMDAQwJoMGkAF317DD02HZaUfq8jyk+QPrruENeH8St+M2QRKw/kSiSRSn+ptNrPRVZFcbp8lJuxjSJaG2ieWdmooKKMBio+B',
  delegator: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
  validator: 'haqqvaloper18xa2e2z4ndmgef9a7c7lj00etutw2dafyyhdkx',
  chainId: 'haqq_54211-3',
  accountNumber: 167676,
  sequence: 17,
  sendAmount: '100000',
  feeAmount: '4000000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
      validatorAddress: 'haqqvaloper18xa2e2z4ndmgef9a7c7lj00etutw2dafyyhdkx',
      amount: {
        denom: 'aISLM',
        amount: '100000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'aISLM',
        amount: '4000000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: 'CCBD92831278103E852E8FB0C038717EA2B122A4C59BFEDC76E2BEE5F4F128BE',
  signature: 'fB8iHcGdjlb67Si9D68LK/jKsHPVkm7+Xcv+Hv+akG0RHSVrQvy2XowSFjfTwqt16Je7RWlLvfyfL/wq2Y9M6w==',
  pubKey: 'AyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzj',
  privateKey: '3xn43lnhB0RxwYkJ2vW4UeBPPOcb947WYsYuqsOzXa0=',
  signedTxBase64:
    'Cp4BCpsBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnIKK2hhcXExc2V5bXdyOHpzNmM5MnJjZnl6NmpsYTRhNTBkcm13Z3E5dHp2bHoSMmhhcXF2YWxvcGVyMTh4YTJlMno0bmRtZ2VmOWE3YzdsajAwZXR1dHcyZGFmeXloZGt4Gg8KBWFJU0xNEgYxMDAwMDASfApZCk8KKC9ldGhlcm1pbnQuY3J5cHRvLnYxLmV0aHNlY3AyNTZrMS5QdWJLZXkSIwohAyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzjEgQKAggBGBMSHwoZCgVhSVNMTRIQNDAwMDAwMDAwMDAwMDAwMBDAmgwaQHwfIh3BnY5W+u0ovQ+vCyv4yrBz1ZJu/l3L/h7/mpBtER0la0L8tl6MEhY308KrdeiXu0VpS738ny/8KtmPTOs=',
  delegator: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
  validator: 'haqqvaloper18xa2e2z4ndmgef9a7c7lj00etutw2dafyyhdkx',
  chainId: 'haqq_54211-3',
  accountNumber: 167676,
  sequence: 19,
  sendAmount: '100000',
  feeAmount: '4000000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
      validatorAddress: 'haqqvaloper18xa2e2z4ndmgef9a7c7lj00etutw2dafyyhdkx',
      amount: {
        denom: 'aISLM',
        amount: '100000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'aISLM',
        amount: '4000000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '11CD80A6B569D6EC5D42C0CE082CBD125472A6BF61FC55E500950BD1A9A3B957',
  signature: 'KXFbRvLeI+CvphTMZYz0U6wJuZ6VAZApXg/M4N8MWWpLsK8ERzppbgSSWGU30hDuI2GtD+CHUAiYy1bS3mDzSQ==',
  pubKey: 'AyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzj',
  privateKey: '3xn43lnhB0RxwYkJ2vW4UeBPPOcb947WYsYuqsOzXa0=',
  signedTxBase64:
    'Cp8BCpwBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmEKK2hhcXExc2V5bXdyOHpzNmM5MnJjZnl6NmpsYTRhNTBkcm13Z3E5dHp2bHoSMmhhcXF2YWxvcGVyMTh4YTJlMno0bmRtZ2VmOWE3YzdsajAwZXR1dHcyZGFmeXloZGt4EnwKWQpPCigvZXRoZXJtaW50LmNyeXB0by52MS5ldGhzZWNwMjU2azEuUHViS2V5EiMKIQMjtBMMwcY+2M0zpjW/U3CBshL63XwJbDNi5MhW+hVs4xIECgIIARgSEh8KGQoFYUlTTE0SEDQwMDAwMDAwMDAwMDAwMDAQwJoMGkApcVtG8t4j4K+mFMxljPRTrAm5npUBkCleD8zg3wxZakuwrwRHOmluBJJYZTfSEO4jYa0P4IdQCJjLVtLeYPNJ',
  delegator: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
  validator: 'haqqvaloper18xa2e2z4ndmgef9a7c7lj00etutw2dafyyhdkx',
  chainId: 'haqq_54211-3',
  accountNumber: 167676,
  sequence: 18,
  sendAmount: '100000',
  feeAmount: '4000000000000000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
      validatorAddress: 'haqqvaloper18xa2e2z4ndmgef9a7c7lj00etutw2dafyyhdkx',
      amount: {
        denom: 'aISLM',
        amount: '100000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'aISLM',
        amount: '4000000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'D930F12BC6764AA1971AFB20F466AC6F598C664BBCFE792D2D421C8C77B239A8',
  signature: 'ojuPe7cO37Zs69g5lHSg+NO18WE0/6qNoKnyeaomeYxhp+U7Ym7J5Z/fWAWTrP2+AWRmCqNuPOhnSxfFZabkSw==',
  pubKey: 'AyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzj',
  privateKey: '3xn43lnhB0RxwYkJ2vW4UeBPPOcb947WYsYuqsOzXa0=',
  signedTxBase64:
    'CpIBCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK2hhcXExc2V5bXdyOHpzNmM5MnJjZnl6NmpsYTRhNTBkcm13Z3E5dHp2bHoSK2hhcXExOXAycm52emFoeHFoOXlrcmozcnFtamRndjBtejZlZm5qbWR6YTcaDwoFYUlTTE0SBjEwMDAwMBICMjMSfApZCk8KKC9ldGhlcm1pbnQuY3J5cHRvLnYxLmV0aHNlY3AyNTZrMS5QdWJLZXkSIwohAyO0EwzBxj7YzTOmNb9TcIGyEvrdfAlsM2LkyFb6FWzjEgQKAggBGBQSHwoZCgVhSVNMTRIQNDAwMDAwMDAwMDAwMDAwMBDAmgwaQKI7j3u3Dt+2bOvYOZR0oPjTtfFhNP+qjaCp8nmqJnmMYaflO2JuyeWf31gFk6z9vgFkZgqjbjzoZ0sXxWWm5Es=',
  sender: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
  recipient: 'haqq19p2rnvzahxqh9ykrj3rqmjdgv0mz6efnjmdza7',
  chainId: 'haqq_54211-3',
  accountNumber: 167676,
  sequence: 20,
  sendAmount: '100000',
  feeAmount: '4000000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress: 'haqq1seymwr8zs6c92rcfyz6jla4a50drmwgq9tzvlz',
      toAddress: 'haqq19p2rnvzahxqh9ykrj3rqmjdgv0mz6efnjmdza7',
      amount: [
        {
          denom: 'aISLM',
          amount: '100000',
        },
      ],
    },
  },
  memo: '23',
  gasBudget: {
    amount: [
      {
        denom: 'aISLM',
        amount: '4000000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'haqq1g3g6nfmqf3f9lmdhf5g84pu7ustw8jt7tvrfzc',
  address2: 'haqq1j3hhwl6exe9yjnggy33raj5s3xeskgsljvzagt',
  address3: 'haqq2k3hhwl6exe9yjnggy33raj5s3xeskgsljvzagt',
  address4: 'haqq1tmm005xgms7qrfm7jwpst3mj9dp8tzdld34jgv',
  validatorAddress1: 'haqqvaloper16lp0xpq87cre5z4jkfddq78r5l4vcd7el2jlmj',
  validatorAddress2: 'haqqvaloper16gg3wzq8h98zyn9kjp7aw3jwy6pnxslrdhl7zp',
  validatorAddress3: 'haqqvaloper35eafuvcrh3c07z4g3pqgq68n3lmsyu5jd9swsy',
  validatorAddress4: 'haqqvaloder1p8k6xk94u24vv9dmxu3vkgg43fs3v72grkpjhm',
  noMemoIdAddress: 'haqq1g3g6nfmqf3f9lmdhf5g84pu7ustw8jt7tvrfzc',
  validMemoIdAddress: 'haqq1g3g6nfmqf3f9lmdhf5g84pu7ustw8jt7tvrfzc?memoId=2',
  invalidMemoIdAddress: 'haqq1g3g6nfmqf3f9lmdhf5g84pu7ustw8jt7tvrfzc?memoId=xyz',
  multipleMemoIdAddress: 'haqq1g3g6nfmqf3f9lmdhf5g84pu7ustw8jt7tvrfzc?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '78009F3F043D3BFDE78D3DB46C98AC6C4D30BE586E8DA2A28FB1FE537DF79265',
  hash2: '1CCB5E358CE84FB9FBD77311D25E0621356CF283159EA703455BA72A5CB61F97',
};

export const txIds = {
  hash1: 'CCDCFAC079BA3833AD3F8EEF3B411C9D8AE2747EF33CA516488A40E522DDD34D',
  hash2: 'B51713C6FFD9EBEAFF158498BB6C406AFCC5E1D0423F38073714DC1F54E576F6',
  hash3: '74BF02FE620C37EFC242B945B01A21D8E3BDAEDC23617BB0964AFC5BC598042E',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'aISLM' },
  amount2: { amount: '1000000', denom: 'aISLM' },
  amount3: { amount: '10000000', denom: 'aISLM' },
  amount4: { amount: '-1', denom: 'aISLM' },
  amount5: { amount: '1000000000', denom: 'uISLM' },
};
