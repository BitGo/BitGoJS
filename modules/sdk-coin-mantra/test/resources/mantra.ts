export const TEST_ACCOUNT = {
  pubAddress: 'mantra178596utuac8l9tkj25afvwz8l7d7684kkswjlj',
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
  hash: '4D4B6A8631F85BC68991D832DD21F7C55644A1EDA73B453F80912C6F0E007F3A',
  signature: 'D3d79EgaCd6XuQIHQ5uVzxG08CSaBTX2NzoBwf/Ihi9wOSPwdxG7VHWdtp5WlSZQNrxWTsIgEqryyce++iad8A==',
  pubKey: 'A4DU/u4UYovmXhdVSnxK+1AXS/mSUMRaQ2eKphXUFFSE',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CooBCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgGEhEKCwoEdWJibhIDMjAwEKCNBhpAGxwY0ko3vlfPsU6gYZ2iqt3Acg+GBBrsSPUHTnP5Xv8GHgbQH2OfCdI/61hqEPx3LMqRTl9zEcKfBkHtB7cg4Q==',
  sender: 'mantra1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  recipient: 'mantra19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
  chainId: 'mantra-dukong-1',
  accountNumber: 6,
  sequence: 3725,
  sendAmount: '10000',
  feeAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uom',
          amount: '10000',
        },
      ],
      toAddress: 'mantra1p660uqa3jdumfykrz3ma672x9j3a6pg2j62mqm',
      fromAddress: 'mantra1ldae6j962muhq5yml6dca7plyne5hs6getw7pv',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const TEST_SEND_TX2 = {
  hash: 'E9CFDF7C396007490DD94331B6E744B2B9E4268D82A12BCEF1D4AB9B7448CD99',
  signature: 'JGuPysRcRQf5DyjPbUnPojq/t9qehk8Vv3SrXGuCvi807+qWNPyk/C+cWmNUY9Dpb0OV2Y6EPfdkfRIpWXtPMA==',
  pubKey: 'Amy4SvgVfqHgAj97ZDc0UtefTP0EYT4bTyR3Q52ndrH4',
  privateKey: 'QAzeAkPSTKyRT8/TvJcRC7VSzQHV9QhH9YTmGZbnvmk=',
  signedTxBase64:
    'CooBCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgJEhEKCwoEdWJibhIDMjAwEKCNBhpA9tD0slY4loMya9rocQROMVQAw0eWfiTlMZFr9VQ8RAg+q4YFgDhteHvFZvKQPn6Y9SCSlUkBr0I+ZlIj8v7oug==',
  sender: 'mantra1vjvn0vd4vcdfqq69t4wpdzd5u8j3tqzxevvazw',
  recipient: 'mantra15dluf69hcxa0uh9n62alkap69pp2xqxkljdnws',
  chainId: 'mantra-dukong-1',
  accountNumber: 9,
  sequence: 9,
  sendAmount: '1092935',
  feeAmount: '2355',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uom',
          amount: '1092935',
        },
      ],
      toAddress: 'mantra15dluf69hcxa0uh9n62alkap69pp2xqxkljdnws',
      fromAddress: 'mantra1vjvn0vd4vcdfqq69t4wpdzd5u8j3tqzxevvazw',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uom', amount: '2355' }],
    gasLimit: 235466,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: 'CEA0A14B0BE20834B0A193B9327FCAAB21A539BEE44B89299848280ED371A2DC',
  signature: '5AHfov+3gmMBS/cLiM0kRBuyBhqpEOqyFPg3ANhzAdNB2Yfp7eR2BFep+xQaB/5r+3ISLrIdUv0V97uU8ENtwQ==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CpQCCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMWM5bnB0MHhod2Z2bXRuaHlxM2pxZmhxMDg4OWw4dzA0cWF5M2RzGg0KBHViYm4SBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgIEhEKCwoEdWJibhIDMjAwEKCNBhpA5AHfov+3gmMBS/cLiM0kRBuyBhqpEOqyFPg3ANhzAdNB2Yfp7eR2BFep+xQaB/5r+3ISLrIdUv0V97uU8ENtwQ==',
  sender: 'mantra1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  chainId: 'mantra-dukong-1',
  accountNumber: 8,
  sequence: 8,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uom',
            amount: '10000',
          },
        ],
        toAddress: 'mantra19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
        fromAddress: 'mantra1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uom',
            amount: '10000',
          },
        ],
        toAddress: 'mantra1c9npt0xhwfvmtnhyq3jqfhq0889l8w04qay3ds',
        fromAddress: 'mantra1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '75CD78D6C4C413750B43D91553B0BED47CB779F23B9D0CE8F94C47F82F97F069',
  signature: 'YQNm391A/NqX5RoJFSwqfv9VX0GrWxk6rJMDxGjtCaJrUtsc6JnlM66cw1miDajaQlZu5LBi6JgHmrN7Nq39JA==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'Co8BCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwEgMyNDESZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1HwEgQKAggBGAcSEQoLCgR1YmJuEgMyMDAQoI0GGkBhA2bf3UD82pflGgkVLCp+/1VfQatbGTqskwPEaO0JomtS2xzomeUzrpzDWaINqNpCVm7ksGLomAeas3s2rf0k',
  from: 'mantra1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  to: 'mantra19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
  chainId: 'mantra-dukong-1',
  accountNumber: 7,
  sequence: 7,
  feeAmount: '200',
  sendAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uom',
          amount: '10000',
        },
      ],
      fromAddress: 'mantra1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      toAddress: 'mantra19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
    },
  },
  memo: '241',
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const address = {
  address1: 'mantra1hf65ux42ju3k2esjndyeh67c74d9v0zq8y27ml',
  address2: 'mantra1r6yj27sh3c982dh34qkw8yvrw2l5f0z9q6u8c0',
  address3: 'mantra1safytq0lmge66azvp064mcxusfk5exu3qq0sj0',
  address4: 'mantra18jywgwczf0qt4q40tnr9rmzyjmccawykhl3qm8',
  address5: 'mantra1ea4hlqfskjvn0ldenw8gv7jjdzrljcchm9vhhu',
  address6: 'mantra1q8mgs55hfgkm7d5rret439997x87s2ekwcxlv0',
  validatorAddress1: 'mantravaloper1q8mgs55hfgkm7d5rret439997x87s2ek2r83q2',
  validatorAddress2: 'mantravaloper1ea4hlqfskjvn0ldenw8gv7jjdzrljcchl7deme',
  validatorAddress3: 'mantravaloper18jywgwczf0qt4q40tnr9rmzyjmccawyknyswhz',
  validatorAddress4: 'mantravaloper1safytq0lmge66azvp064mcxusfk5exu3ymw772',
  noMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz',
  validMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=2',
  validMemoIdAddress2: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=xyz123',
  invalidMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=-1',
  invalidMemoIdAddress2: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=1.23',
  multipleMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '9D6D343A178ED6BEF8F9E8AA8B9F8D1ADE25262BDAB3F129A9ABB709207D51DF',
  hash2: '2833B5EAB34985A31DDE2B61827EC0A68D5D4F9441D83996CCCCEA986FEA5BD3',
};

export const txIds = {
  hash1: '350DBA4C1626EFE60AD528553942DE065BA57D4E39C6814730E0A58A948CBC46',
  hash2: '4947385C287BD976840C6FCCE8C09AF92AEC7BF9CC68087C3DC4314938646EE4',
  hash3: 'E70FF78E8FF92EE7D601545B175B6756F31F2121E219241706ED6A892BF9695D',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uom' },
  amount2: { amount: '1000000', denom: 'uom' },
  amount3: { amount: '10000000', denom: 'uom' },
  amount4: { amount: '-1', denom: 'uom' },
  amount5: { amount: '1000000000', denom: 'uom' },
};
