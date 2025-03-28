export const TEST_ACCOUNT = {
  pubAddress: 'bbn1897xa4swxx9dr7z0zut0mfs7efplx80q86kd8q',
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
  hash: 'F91AD3FF898461BCE40A97C3D4A1CD6993D64599450A1C08185FA7DA446D4632',
  signature: 'GxwY0ko3vlfPsU6gYZ2iqt3Acg+GBBrsSPUHTnP5Xv8GHgbQH2OfCdI/61hqEPx3LMqRTl9zEcKfBkHtB7cg4Q==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CooBCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgGEhEKCwoEdWJibhIDMjAwEKCNBhpAGxwY0ko3vlfPsU6gYZ2iqt3Acg+GBBrsSPUHTnP5Xv8GHgbQH2OfCdI/61hqEPx3LMqRTl9zEcKfBkHtB7cg4Q==',
  sender: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  recipient: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
  chainId: 'bbn-test-5',
  accountNumber: 6,
  sequence: 6,
  sendAmount: '10000',
  feeAmount: '200',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ubbn',
          amount: '10000',
        },
      ],
      toAddress: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
      fromAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
    },
  },
  gasBudget: {
    amount: [{ denom: 'ubbn', amount: '200' }],
    gasLimit: 100000,
  },
};

export const TEST_SEND_TX2 = {
  hash: 'F3F54170A03449385C5E1CD14CD8F0D23931186618C76A3491C4B4C5D03B4DD8',
  signature: '9tD0slY4loMya9rocQROMVQAw0eWfiTlMZFr9VQ8RAg+q4YFgDhteHvFZvKQPn6Y9SCSlUkBr0I+ZlIj8v7oug==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CooBCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgJEhEKCwoEdWJibhIDMjAwEKCNBhpA9tD0slY4loMya9rocQROMVQAw0eWfiTlMZFr9VQ8RAg+q4YFgDhteHvFZvKQPn6Y9SCSlUkBr0I+ZlIj8v7oug==',
  sender: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  recipient: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
  chainId: 'bbn-test-5',
  accountNumber: 9,
  sequence: 9,
  sendAmount: '10000',
  feeAmount: '200',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ubbn',
          amount: '10000',
        },
      ],
      toAddress: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
      fromAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
    },
  },
  gasBudget: {
    amount: [{ denom: 'ubbn', amount: '200' }],
    gasLimit: 100000,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: 'CEA0A14B0BE20834B0A193B9327FCAAB21A539BEE44B89299848280ED371A2DC',
  signature: '5AHfov+3gmMBS/cLiM0kRBuyBhqpEOqyFPg3ANhzAdNB2Yfp7eR2BFep+xQaB/5r+3ISLrIdUv0V97uU8ENtwQ==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CpQCCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMWM5bnB0MHhod2Z2bXRuaHlxM2pxZmhxMDg4OWw4dzA0cWF5M2RzGg0KBHViYm4SBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQME+MaK7sQPg5Csp69Sx+wjOtEcEey6eSJ8EOSEmjdR8BIECgIIARgIEhEKCwoEdWJibhIDMjAwEKCNBhpA5AHfov+3gmMBS/cLiM0kRBuyBhqpEOqyFPg3ANhzAdNB2Yfp7eR2BFep+xQaB/5r+3ISLrIdUv0V97uU8ENtwQ==',
  sender: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  chainId: 'bbn-test-5',
  accountNumber: 8,
  sequence: 8,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'ubbn',
            amount: '10000',
          },
        ],
        toAddress: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
        fromAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'ubbn',
            amount: '10000',
          },
        ],
        toAddress: 'bbn1c9npt0xhwfvmtnhyq3jqfhq0889l8w04qay3ds',
        fromAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'ubbn', amount: '200' }],
    gasLimit: 100000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '75CD78D6C4C413750B43D91553B0BED47CB779F23B9D0CE8F94C47F82F97F069',
  signature: 'YQNm391A/NqX5RoJFSwqfv9VX0GrWxk6rJMDxGjtCaJrUtsc6JnlM66cw1miDajaQlZu5LBi6JgHmrN7Nq39JA==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'Co8BCocBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmcKKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIqYmJuMTlzeWhxdzVxZXVhczM2NWN3OXB2ZGFkemV4N2R1cmZtN2hsZm44Gg0KBHViYm4SBTEwMDAwEgMyNDESZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1HwEgQKAggBGAcSEQoLCgR1YmJuEgMyMDAQoI0GGkBhA2bf3UD82pflGgkVLCp+/1VfQatbGTqskwPEaO0JomtS2xzomeUzrpzDWaINqNpCVm7ksGLomAeas3s2rf0k',
  from: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  to: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
  chainId: 'bbn-test-5',
  accountNumber: 7,
  sequence: 7,
  feeAmount: '200',
  sendAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ubbn',
          amount: '10000',
        },
      ],
      fromAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      toAddress: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
    },
  },
  memo: '241',
  gasBudget: {
    amount: [{ denom: 'ubbn', amount: '200' }],
    gasLimit: 100000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: 'EC11EACC2692B1B741D0CEC74FD4E5DA2D9E8875623713ED0EAE63ED43FB5A91',
  signature: 'BkwhIYhaVq5UPGEpCUPBCdq59j/JrHCQHn86UiREjL5BqvvPaQZM+hexBpSNoXDokiwoQDQK53VSO4iUumCUGQ==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'Cp4BCpsBCicvYmFieWxvbi5lcG9jaGluZy52MS5Nc2dXcmFwcGVkRGVsZWdhdGUScApuCipiYm4xMjc0ZXA4cG5ybGVqNXZnbXR3cHB5c3luemNkNGZoeGMza3UwdDMSMWJibnZhbG9wZXIxemw3OGV6aGd3NmZxeHlkZWNubWNteWRzbTBndHJqZHRhbm03bnIaDQoEdWJibhIFMTAwMDASZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1HwEgQKAggBGB0SEQoLCgR1YmJuEgM1MDAQwJoMGkAGTCEhiFpWrlQ8YSkJQ8EJ2rn2P8mscJAefzpSJESMvkGq+89pBkz6F7EGlI2hcOiSLChANArndVI7iJS6YJQZ',
  from: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  to: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
  chainId: 'bbn-test-5',
  accountNumber: 59235,
  sequence: 29,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/babylon.epoching.v1.MsgWrappedDelegate',
    value: {
      delegatorAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      validatorAddress: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
      amount: {
        denom: 'ubbn',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubbn',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '009D9A8F17B4DB99B86F1EBAFC801AA2A887E89D4D20EAE2FE30203484A3273E',
  signature: 'm8XIY/88A66uBWShNLGFxLqgftFF18dpqni4ChvS6Wsn+xZCqZhcrpoJbmLzaFTRp+YnPvLawLy0QEAkff5NyA==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CqABCp0BCikvYmFieWxvbi5lcG9jaGluZy52MS5Nc2dXcmFwcGVkVW5kZWxlZ2F0ZRJwCm4KKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIxYmJudmFsb3BlcjF6bDc4ZXpoZ3c2ZnF4eWRlY25tY215ZHNtMGd0cmpkdGFubTduchoNCgR1YmJuEgUxMDAwMBJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDBPjGiu7ED4OQrKevUsfsIzrRHBHsunkifBDkhJo3UfASBAoCCAEYHhIRCgsKBHViYm4SAzUwMBDAmgwaQJvFyGP/PAOurgVkoTSxhcS6oH7RRdfHaap4uAob0ulrJ/sWQqmYXK6aCW5i82hU0afmJz7y2sC8tEBAJH3+Tcg=',
  from: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  to: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
  chainId: 'bbn-test-5',
  accountNumber: 59235,
  sequence: 30,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/babylon.epoching.v1.MsgWrappedUndelegate',
    value: {
      delegatorAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      validatorAddress: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
      amount: {
        denom: 'ubbn',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubbn',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_REDELEGATE_TX = {
  hash: 'CC45369A75E76D3287A3831853369EEE6C5D1B5FB4277CC4FA0D4D06A0DFA661',
  signature: 'bJlHHrfB08ypEZkSzy6wbqvNJhGB6OgPd2quqW5GqNYPtBniVHiS0jjVwgoldkM0cLdj8EilWP663Donqci8Aw==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'CtoBCtcBCi4vYmFieWxvbi5lcG9jaGluZy52MS5Nc2dXcmFwcGVkQmVnaW5SZWRlbGVnYXRlEqQBCqEBCipiYm4xMjc0ZXA4cG5ybGVqNXZnbXR3cHB5c3luemNkNGZoeGMza3UwdDMSMWJibnZhbG9wZXIxemw3OGV6aGd3NmZxeHlkZWNubWNteWRzbTBndHJqZHRhbm03bnIaMWJibnZhbG9wZXIxMmptOXo2aHdtNGV4N2MwejhodGV5M3loeWZoeDQ0em43MGE1bDYiDQoEdWJibhIFMTAwMDASZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1HwEgQKAggBGB8SEQoLCgR1YmJuEgM1MDAQwJoMGkBsmUcet8HTzKkRmRLPLrBuq80mEYHo6A93aq6pbkao1g+0GeJUeJLSONXCCiV2QzRwt2PwSKVY/rrcOiepyLwD',
  delegator: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  validator: 'bbnvaloper12jm9z6hwm4ex7c0z8htey3yhyfhx44zn70a5l6',
  chainId: 'bbn-test-5',
  accountNumber: 59235,
  sequence: 31,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/babylon.epoching.v1.MsgWrappedBeginRedelegate',
    value: {
      delegatorAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      validatorSrcAddress: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
      validatorDstAddress: 'bbnvaloper12jm9z6hwm4ex7c0z8htey3yhyfhx44zn70a5l6',
      amount: {
        denom: 'ubbn',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubbn',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: 'EA4ECA4DA17B158238242572AD9A7E7734D7085BF679555EE90FA4F0EF3CFA79',
  signature: 'vyVU/1zVhp6m0uMF5mLaKr3o/Oe36O+EF3E7Dgw7smlUjOW5Ttwgnl44zO1vro4MU2frc/KV4Ji2IqWKi8QlLA==',
  pubKey: 'AwT4xoruxA+DkKynr1LH7CM60RwR7Lp5InwQ5ISaN1Hw',
  privateKey: 'QAzeAkPWRGyRT8/TvJcRC7VSzQHV9QhH6YTmGZbnvmk=',
  signedTxBase64:
    'Cp0BCpoBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEl8KKmJibjEyNzRlcDhwbnJsZWo1dmdtdHdwcHlzeW56Y2Q0Zmh4YzNrdTB0MxIxYmJudmFsb3BlcjF6bDc4ZXpoZ3c2ZnF4eWRlY25tY215ZHNtMGd0cmpkdGFubTduchJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDBPjGiu7ED4OQrKevUsfsIzrRHBHsunkifBDkhJo3UfASBAoCCAEYIBIRCgsKBHViYm4SAzUwMBDAmgwaQL8lVP9c1YaeptLjBeZi2iq96Pznt+jvhBdxOw4MO7JpVIzluU7cIJ5eOMztb66ODFNn63PyleCYtiKliovEJSw=',
  from: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  to: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
  chainId: 'bbn-test-5',
  accountNumber: 59235,
  sequence: 32,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
      validatorAddress: 'bbnvaloper1zl78ezhgw6fqxydecnmcmydsm0gtrjdtanm7nr',
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubbn',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'bbn1897xa4swxx9dr7z0zut0mfs7efplx80q86kd8q',
  address2: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  address3: 'bbn19syhqw5qeuas365cw9pvdadzax7durfm7hlfn8',
  address4: 'bbn1ukzj0eme6srq8rtghy6zatk3gshw0ysr3pmjy9',
  address5: 'bbn1pa3s79kuppz7d0aq3rh9c439k4pwtfhxaea969',
  address6: 'bbn1c9npt0xhwfvmtnhyq3jqfhq0889l8w04qay3ds',
  validatorAddress1: 'bbnvaloper109x4ruspxarwt62puwcenhclw36l9v7j92f0ex',
  validatorAddress2: 'bbnvaloper1fa0c7df8v25mv926wey4m9kunhhm7svnp6tezt',
  validatorAddress3: 'bbnvaloper15rrsv9439j60o7wwv8l6zkv8tp5lrqy7quzx87',
  validatorAddress4: 'bbnvaloper1rlrjlm6rec6h2nvzakyj39d5fv7p7vgs3kq472',
  noMemoIdAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3',
  validMemoIdAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3?memoId=2',
  validMemoIdAddress2: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3?memoId=xyz123',
  invalidMemoIdAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3?memoId=-1',
  invalidMemoIdAddress2: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3?memoId=1.23',
  multipleMemoIdAddress: 'bbn1274ep8pnrlej5vgmtwppysynzcd4fhxc3ku0t3?memoId=3&memoId=12',
  finalityProviderAddress: 'e4889630fa8695dae630c41cd9b85ef165ccc2dc5e5935d5a24393a9defee9ef',
};

export const blockHash = {
  hash1: '4CF6A4005A3DEFB73B8AAC90D2FDF31E941E4F58D3D183E5F959E6CBC0AB4103',
  hash2: 'B3A416BA5A8C916279858861AEC61A79546D06FD0A541621E8054AA498311066',
};

export const txIds = {
  hash1: 'F91AD3FF898461BCE40A97C3D4A1CD6993D64599450A1C08185FA7DA446D4632',
  hash2: 'A7FB4EB5000BCFDB8A481E85027907A54BD05EFF9ED83CEBC5F53B1C77812896',
  hash3: '61E0C20DAD6C6077F3B07519CF03133FE77C98780E299DA5DDBED7FE523ED9E2',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'ubbn' },
  amount2: { amount: '1000000', denom: 'ubbn' },
  amount3: { amount: '10000000', denom: 'ubbn' },
  amount4: { amount: '-1', denom: 'ubbn' },
  amount5: { amount: '1000000000', denom: 'mbbn' },
};
