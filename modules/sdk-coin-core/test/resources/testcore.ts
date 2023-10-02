// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_SEND_TX = {
  hash: '92D97E811479957397B9F3CEE579C9A7076E49B2256CF37D93350F10E44F1ABA',
  signature: 'bO2vtjntGwpnTKYUgtF0NFkyoObZ9GFgycqNSldll7EM2VlnmEagFekT7dpV8PAEXupGjIJ489sGHzuGDdfIBw==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'CpsBCpgBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEngKL3Rlc3Rjb3JlMXRzZXYzdnRsbGN2ZzQ5ZDA2cHhyajh5d3NqMGh6cTU3NmhkdHRkEi90ZXN0Y29yZTFxdmxxbXFqenU2Mmg4MjMzeHo2bHU2dG1sN2hkNnpsOWZ3OTVjNBoUCgl1dGVzdGNvcmUSBzEwMDAwMDASaQpOCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjoEgQKAggBEhcKEQoJdXRlc3Rjb3JlEgQ2MjUwEMCaDBpAbO2vtjntGwpnTKYUgtF0NFkyoObZ9GFgycqNSldll7EM2VlnmEagFekT7dpV8PAEXupGjIJ489sGHzuGDdfIBw==',
  sender: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
  recipient: 'testcore1qvlqmqjzu62h8233xz6lu6tml7hd6zl9fw95c4',
  chainId: 'coreum-testnet-1',
  accountNumber: 3483,
  sequence: 0,
  sendAmount: '1000000',
  feeAmount: '6250',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'utestcore',
          amount: '1000000',
        },
      ],
      toAddress: 'testcore1qvlqmqjzu62h8233xz6lu6tml7hd6zl9fw95c4',
      fromAddress: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
    },
  },
  gasBudget: {
    amount: [{ denom: 'utestcore', amount: '6250' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '9D59B3BB4CBC5DC4E61C4D416B5469C2D6B732AA283DD5DC0B087EF4E3DDD73A',
  signature: '5zXq7qVNCb6+w5kZvSQEz0VVA6FgJEEhvjOmyfZDFIQ8VgcWanSrMeVBQvCjQ+wIUapGpwWZso0EqrOceTimyA==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'CqcBCqQBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ9Ci90ZXN0Y29yZTF0c2V2M3Z0bGxjdmc0OWQwNnB4cmo4eXdzajBoenE1NzZoZHR0ZBI2dGVzdGNvcmV2YWxvcGVyMTA3cGQ4OXU1eDIwd3h1Y3g5eWprNXd5c3Y1cnR0cHZ1OHZudnNmGhIKCXV0ZXN0Y29yZRIFMTAwMDASawpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjoEgQKAggBGAISFwoRCgl1dGVzdGNvcmUSBDYyNTAQwJoMGkDnNerupU0Jvr7DmRm9JATPRVUDoWAkQSG+M6bJ9kMUhDxWBxZqdKsx5UFC8KND7AhRqkanBZmyjQSqs5x5OKbI',
  delegator: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
  validator: 'testcorevaloper107pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
  chainId: 'coreum-testnet-1',
  accountNumber: 3483,
  sequence: 2,
  sendAmount: '10000',
  feeAmount: '6250',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
      validatorAddress: 'testcorevaloper107pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
      amount: {
        denom: 'utestcore',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'utestcore',
        amount: '6250',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '43616034DF5EE315EBD213694081901A54250FFE55EBCC2A2BDF8CAB92E0C008',
  signature: 'OYqBRch0gD9CCRUV0SvsXKauBn4BC1I9zGGg12o3K19DaWSq/Uo6awBYPc6t3l4U+ebNyV5soKCk5dzlD+LR5Q==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'CqkBCqYBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEn0KL3Rlc3Rjb3JlMXRzZXYzdnRsbGN2ZzQ5ZDA2cHhyajh5d3NqMGh6cTU3NmhkdHRkEjZ0ZXN0Y29yZXZhbG9wZXIxMDdwZDg5dTV4MjB3eHVjeDl5ams1d3lzdjVydHRwdnU4dm52c2YaEgoJdXRlc3Rjb3JlEgUxMDAwMBJsClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECYKFWEfIwsKhyBzkS0hnbsWk32TS9KjwPNzIe79ioyOgSBAoCCAEYBBIYChIKCXV0ZXN0Y29yZRIFMTAwMDAQwJoMGkA5ioFFyHSAP0IJFRXRK+xcpq4GfgELUj3MYaDXajcrX0NpZKr9SjprAFg9zq3eXhT55s3JXmygoKTl3OUP4tHl',
  delegator: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
  validator: 'testcorevaloper107pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
  chainId: 'coreum-testnet-1',
  accountNumber: 3483,
  sequence: 4,
  sendAmount: '10000',
  feeAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
      validatorAddress: 'testcorevaloper107pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
      amount: {
        denom: 'utestcore',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'utestcore',
        amount: '10000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '1B41AD57D3E58938A1DDD658953EC95E3BEB7B66665B291D4EA8723386E2C972',
  signature: 'ni515KM/8bSxsOGyrYuoGoCxxBMOMYl/kFqFUF4LyUA/sjVVtZ/iMszH6Trvdu7Hgr5HeZdKpkfAbFi4qBBAwg==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'CqcBCqQBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmkKL3Rlc3Rjb3JlMXRzZXYzdnRsbGN2ZzQ5ZDA2cHhyajh5d3NqMGh6cTU3NmhkdHRkEjZ0ZXN0Y29yZXZhbG9wZXIxMDdwZDg5dTV4MjB3eHVjeDl5ams1d3lzdjVydHRwdnU4dm52c2YSbApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjoEgQKAggBGAMSGAoSCgl1dGVzdGNvcmUSBTEwMDAwEMCaDBpAni515KM/8bSxsOGyrYuoGoCxxBMOMYl/kFqFUF4LyUA/sjVVtZ/iMszH6Trvdu7Hgr5HeZdKpkfAbFi4qBBAwg==',
  delegator: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
  validator: 'testcorevaloper107pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
  chainId: 'coreum-testnet-1',
  accountNumber: 3483,
  sequence: 3,
  sendAmount: '10000',
  feeAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
      validatorAddress: 'testcorevaloper107pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
      amount: {
        denom: 'utestcore',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'utestcore',
        amount: '10000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '3C0A174E03BF93825685A9E76D256A949E409B552F55F5859F36D2D7EA058DDC',
  signature: 'wFnlYw1qYCihQkeojncOv3eJi4po6fNfpLucnNJAtZk7yv43eYH4+gnmb8xb+Mu2m3Z9vsY8cpXmwb0GGpJlnw==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'Cp8BCpgBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEngKL3Rlc3Rjb3JlMXRzZXYzdnRsbGN2ZzQ5ZDA2cHhyajh5d3NqMGh6cTU3NmhkdHRkEi90ZXN0Y29yZTFxdmxxbXFqenU2Mmg4MjMzeHo2bHU2dG1sN2hkNnpsOWZ3OTVjNBoUCgl1dGVzdGNvcmUSBzEwMDAwMDASAjIzEmwKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQJgoVYR8jCwqHIHORLSGduxaTfZNL0qPA83Mh7v2KjI6BIECgIIARgFEhgKEgoJdXRlc3Rjb3JlEgUxMTAwMBDAmgwaQMBZ5WMNamAooUJHqI53Dr93iYuKaOnzX6S7nJzSQLWZO8r+N3mB+PoJ5m/MW/jLtpt2fb7GPHKV5sG9BhqSZZ8=',
  from: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
  to: 'testcore1qvlqmqjzu62h8233xz6lu6tml7hd6zl9fw95c4',
  chainId: 'coreum-testnet-1',
  accountNumber: 3483,
  sequence: 5,
  sendAmount: '1000000',
  feeAmount: '11000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'utestcore',
          amount: '1000000',
        },
      ],
      toAddress: 'testcore1qvlqmqjzu62h8233xz6lu6tml7hd6zl9fw95c4',
      fromAddress: 'testcore1tsev3vtllcvg49d06pxrj8ywsj0hzq576hdttd',
    },
  },
  memo: '23',
  gasBudget: {
    amount: [
      {
        denom: 'utestcore',
        amount: '11000',
      },
    ],
    gasLimit: 200000,
  },
};

export const testnetAddress = {
  address1: 'testcore12rqvuw3tp3zne7p9c6c6mcuxv8vmej23jl7acn',
  address2: 'testcore1ecqgwd4whevrzjxrhrja54c5jg043j79xtz5a5',
  address3: 'testcore2zackgzh7f2p980mhps48z6zm2tyl76a8r896nh',
  address4: 'testcore1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3sp2f36',
  validatorAddress1: 'testcorevaloper1xjehmty2z5j7mfmpzxe8dgrf506c70n37lggga',
  validatorAddress2: 'testcorevaloper1m569wc4z06sdntmcex6qxg8ds7l8e2ec7njj7d',
  validatorAddress3: 'testcorevaloper207pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
  validatorAddress4: 'testcorevaloder17udnpgy7sfam2rmeq5huumj0tqzfr0t4s49an9',
  noMemoIdAddress: 'testcore12rqvuw3tp3zne7p9c6c6mcuxv8vmej23jl7acn',
  validMemoIdAddress: 'testcore12rqvuw3tp3zne7p9c6c6mcuxv8vmej23jl7acn?memoId=2',
  invalidMemoIdAddress: 'testcore12rqvuw3tp3zne7p9c6c6mcuxv8vmej23jl7acn?memoId=xyz',
  multipleMemoIdAddress: 'testcore12rqvuw3tp3zne7p9c6c6mcuxv8vmej23jl7acn?memoId=3&memoId=12',
};

export const testnetCoinAmounts = {
  amount1: { amount: '100000', denom: 'utestcore' },
  amount2: { amount: '1000000', denom: 'utestcore' },
  amount3: { amount: '10000000', denom: 'utestcore' },
  amount4: { amount: '-1', denom: 'utestcore' },
  amount5: { amount: '1000000000', denom: 'atestcore' },
};
