export const TEST_ACCOUNT = {
  pubAddress: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
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
  hash: 'A7AB5F0273AEB21D8589E9CE0CAD88E597F7429915234E925921E30EC72E04E6',
  signature: 'UnSmSuU+Q5f2PbuYUI8CBuBKpugCNfR5C/WyGIl5tpYjMsxhpcH503UN8bRRVRy0+IZMaWtqkP1d5mKMQ4ox4w==',
  pubKey: 'Aq6esFYEASosOy+P8oL8Qa6YEgw5Ik7+ImI4yaGajBuu',
  privateKey: 'HsNHJw6QAHsAO65PkX8O3m6H7Dkddv/KMpfkkL75doE=',
  signedTxBase64:
    'Co0BCooBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmoKK2luaXQxdzY5ZTk1OHc4OTIyajNxMDdwYzk5MzM4Z3c1NDd3ZXB1NzZ5Z2sSK2luaXQxcjRreXVqN3A5ZG0yeDJxaDR2ZXM4cm10anhsajc3cTZscTYwcHQaDgoFdWluaXQSBTEwMDAwEmgKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQKunrBWBAEqLDsvj/KC/EGumBIMOSJO/iJiOMmhmowbrhIECgIIARgLEhQKDgoFdWluaXQSBTMwMDAwEKDCHhpAUnSmSuU+Q5f2PbuYUI8CBuBKpugCNfR5C/WyGIl5tpYjMsxhpcH503UN8bRRVRy0+IZMaWtqkP1d5mKMQ4ox4w==',
  sender: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
  recipient: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
  chainId: 'initiation-2',
  accountNumber: 11,
  sequence: 11,
  sendAmount: '10000',
  feeAmount: '30000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uinit',
          amount: '10000',
        },
      ],
      toAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
      fromAddress: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uinit', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const TEST_SEND_TX2 = {
  hash: 'A80DC6BB5C6CA0A02CF54F58B307AC0230C33AF9347F0A1CB639B4C142458CD9',
  signature: 'Cz24QQpt2xaQ18pfOiYtp2EZDfV9zka6YYkaHX44stUiDKZ6hLMleF46nj2x+GT7CJUnn4pdtOoJfTaPW/tbnQ==',
  pubKey: 'Aq6esFYEASosOy+P8oL8Qa6YEgw5Ik7+ImI4yaGajBuu',
  privateKey: 'HsNHJw6QAHsAO65PkX8O3m6H7Dkddv/KMpfkkL75doE=',
  signedTxBase64:
    'Co0BCooBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmoKK2luaXQxdzY5ZTk1OHc4OTIyajNxMDdwYzk5MzM4Z3c1NDd3ZXB1NzZ5Z2sSK2luaXQxcjRreXVqN3A5ZG0yeDJxaDR2ZXM4cm10anhsajc3cTZscTYwcHQaDgoFdWluaXQSBTMwMDAwEmgKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQKunrBWBAEqLDsvj/KC/EGumBIMOSJO/iJiOMmhmowbrhIECgIIARgMEhQKDgoFdWluaXQSBTMwMDAwEKDCHhpACz24QQpt2xaQ18pfOiYtp2EZDfV9zka6YYkaHX44stUiDKZ6hLMleF46nj2x+GT7CJUnn4pdtOoJfTaPW/tbnQ==',
  sender: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
  recipient: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
  chainId: 'initiation-2',
  accountNumber: 12,
  sequence: 12,
  sendAmount: '30000',
  feeAmount: '30000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uinit',
          amount: '30000',
        },
      ],
      toAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
      fromAddress: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uinit', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: 'C08126CEC4F6C4907A8B52BC879B0BBA28E7FC2FCBBFCB1331EC17CB7A4C7CD0',
  signature: 'lDLRazFhpE6DBCPSAQyeL37MVHRBTwCVO7Pj7Wx+xCxGFdlc5MSY/w0PyFC8kmRtCIRgnvPBTc+gCGfvX3wlDQ==',
  pubKey: 'Aq6esFYEASosOy+P8oL8Qa6YEgw5Ik7+ImI4yaGajBuu',
  privateKey: 'HsNHJw6QAHsAO65PkX8O3m6H7Dkddv/KMpfkkL75doE=',
  signedTxBase64:
    'CpoCCooBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmoKK2luaXQxdzY5ZTk1OHc4OTIyajNxMDdwYzk5MzM4Z3c1NDd3ZXB1NzZ5Z2sSK2luaXQxcjRreXVqN3A5ZG0yeDJxaDR2ZXM4cm10anhsajc3cTZscTYwcHQaDgoFdWluaXQSBTEwMDAwCooBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmoKK2luaXQxdzY5ZTk1OHc4OTIyajNxMDdwYzk5MzM4Z3c1NDd3ZXB1NzZ5Z2sSK2luaXQxN3hwZnZha20yYW1nOTYyeWxzNmY4NHoza2VsbDhjNWw3MHJucWwaDgoFdWluaXQSBTEwMDAwEmgKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQKunrBWBAEqLDsvj/KC/EGumBIMOSJO/iJiOMmhmowbrhIECgIIARgGEhQKDgoFdWluaXQSBTMwMDAwEKDCHhpAlDLRazFhpE6DBCPSAQyeL37MVHRBTwCVO7Pj7Wx+xCxGFdlc5MSY/w0PyFC8kmRtCIRgnvPBTc+gCGfvX3wlDQ==',
  sender: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
  chainId: 'initiation-2',
  accountNumber: 6,
  sequence: 6,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uinit',
            amount: '10000',
          },
        ],
        toAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
        fromAddress: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uinit',
            amount: '10000',
          },
        ],
        toAddress: 'init17xpfvakm2amg962yls6f84z3kell8c5l70rnql',
        fromAddress: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'uinit', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '1448E3DA45FAA2E2E15AEAF55DCCF54A555F187C233F38E2B04CFA756C82003C',
  signature: 'ifZYlCQuBiw8zcyYIq2BxVdzL0BJThmKV02Pzg7E85dDONHjKKknrvn5yw9Z/V++3SfAi+AwnCsopvf9Is7qHw==',
  pubKey: 'Aq6esFYEASosOy+P8oL8Qa6YEgw5Ik7+ImI4yaGajBuu',
  privateKey: 'HsNHJw6QAHsAO65PkX8O3m6H7Dkddv/KMpfkkL75doE=',
  signedTxBase64:
    'CpIBCooBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmoKK2luaXQxdzY5ZTk1OHc4OTIyajNxMDdwYzk5MzM4Z3c1NDd3ZXB1NzZ5Z2sSK2luaXQxcjRreXVqN3A5ZG0yeDJxaDR2ZXM4cm10anhsajc3cTZscTYwcHQaDgoFdWluaXQSBTMwMDAwEgMyNDESaApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAq6esFYEASosOy+P8oL8Qa6YEgw5Ik7+ImI4yaGajBuuEgQKAggBGAoSFAoOCgV1aW5pdBIFMzAwMDAQoMIeGkCJ9liUJC4GLDzNzJgirYHFV3MvQElOGYpXTY/ODsTzl0M40eMoqSeu+fnLD1n9X77dJ8CL4DCcKyim9/0izuof',
  from: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
  to: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
  chainId: 'initiation-2',
  accountNumber: 10,
  sequence: 10,
  feeAmount: '30000',
  sendAmount: '30000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uinit',
          amount: '30000',
        },
      ],
      fromAddress: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
      toAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
    },
  },
  memo: '241',
  gasBudget: {
    amount: [{ denom: 'uinit', amount: '30000' }],
    gasLimit: 500000,
  },
};

export const address = {
  address1: 'init1w69e958w8922j3q07pc99338gw547wepu76ygk',
  address2: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
  address3: 'init1r4kyujp9dm2x2qh4,ves87rmtjxlj77q6lq60pt-yf2',
  address4: 'inict17xpfvakm2amg962yls6f84z3kell85l70rnql',
  address5: 'init17xpfvakm2amg962yls6f84z3kell8c5l70rnql1',
  address6: 'init17xpfvakm2amg962yls6f84z3kell8c5l70rnql.9pvdadzax7durfm7hlfn8',
  validatorAddress1: 'initvaloper13xnlyk0uz3ccfvsfvv8q36p7exvphferkusz0h',
  validatorAddress2: 'initvaloper1lcrpklc7yhl5v8kg2feedweqg3cpw005eq39w3',
  validatorAddress3: 'initvalper1qx6ghyv83caecuxgl77lvlndha9d9y6fntryc8a#d46w',
  validatorAddress4: 'initvaloper1qx6ghyv83caecuxgl77lvlnha9d9ys6fntryc8a',
  noMemoIdAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt',
  validMemoIdAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt?memoId=2',
  invalidMemoIdAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt?memoId=1.23',
  multipleMemoIdAddress: 'init1r4kyuj7p9dm2x2qh4ves8rmtjxlj77q6lq60pt?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '25E7C3989DDE06BBCCEBDFBA7A0AA38CF05EF14C3FBCE8A4B4349FCB5863F189',
  hash2: '8CBEA52AA9937916264C303E121E08BF2C35C85810ECC2B76E76FC982CC6ABF8',
};

export const txIds = {
  hash1: '02D8E9AC3F33D6825F8F13E494EF6B0E035160DBAA82865666EAEC095FF36156',
  hash2: 'A7AB5F0273AEB21D8589E9CE0CAD88E597F7429915234E925921E30EC72E04E6',
  hash3: 'A80DC6BB5C6CA0A02CF54F58B307AC0230C33AF9347F0A1CB639B4C142458CD9',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uinit' },
  amount2: { amount: '1000000', denom: 'uinit' },
  amount3: { amount: '10000000', denom: 'uinit' },
  amount4: { amount: '-1', denom: 'uinit' },
  amount5: { amount: '1000000000', denom: 'muinit' },
};
