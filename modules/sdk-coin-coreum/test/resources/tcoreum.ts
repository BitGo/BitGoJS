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
  address4: 'testcore12rqvuw3tp3zne7p9c6c6mcuxv8vmej23jl7acc',
  validatorAddress1: 'testcorevaloper1xjehmty2z5j7mfmpzxe8dgrf506c70n37lggga',
  validatorAddress2: 'testcorevaloper1m569wc4z06sdntmcex6qxg8ds7l8e2ec7njj7d',
  validatorAddress3: 'testcorevaloper207pd89u5x20wxucx9yjk5wysv5rttpvu8vnvsf',
  validatorAddress4: 'testcorevaloper1xjehmty2z5j7mfmpzxe8dgrf506c70n37lgggb',
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

export const wrwUser = {
  senderAddress: 'testcore1pqgd472992d2aaf7gylgflrl67c23ul0w2w7hw',
  destinationAddress: 'testcore1xrh89ced02ea6928kcwectgtkk7k4954wqjdr7',
  userPrivateKey:
    '{"iv":"s7Mj3taTZR46bWX0oqkpZw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"8bdfezLgCVk=","ct":"u5XMS0O0hK03Rq\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"z5p9VFGbRMB+Zo0jgic/uw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"WL29RG24TaY=","ct":"ZZ4MA9LY65+psN\n' +
    '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"}',
  bitgoPublicKey:
    '039d9acd864b8f888df61b1beac85b47a3df88fe1ce85adc3741f70d7d642519a79a2a1daa0\n' +
    '9f0e7d5b91fd60299d64ef418b17f20d6c231e86e189b7a61e2bbe7',
  walletPassphrase: 'QczkC@AOmPC0vaR0p^8z',
};
