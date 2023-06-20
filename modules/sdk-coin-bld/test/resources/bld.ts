export const TEST_ACCOUNT = {
  pubAddress: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p',
  compressedPublicKey: '03d0cb77c4cf8ade042913b8ccb722c274d723f648a9d48162ef341a8efe287db4',
  compressedPublicKeyTwo: '03a06cbe7b22029e8d61d504b888498801c9eb61425ac5df92998465052d495865',
  uncompressedPublicKey:
    '04d0cb77c4cf8ade042913b8ccb722c274d723f648a9d48162ef341a8efe287db46a09c301fd217d6fa32ad6c52591f39b70dbfa88e6296c78f78cc4fae707796f',
  privateKey: 'c5bde38576fd4e3d73bc1e9e30f2ea402d1e2617dd70187dba55a1c48b607721',
  extendedPrv:
    'xprv9s21ZrQH143K4R9Rf8GbhWp2ajQPkqAzwTcUJeNmkwP9QiQR2TMJX2PvVxWpcWCFrtvRMZqiLwGVuXJHDA8s8awznkfM5NZaAErEKTsGwHi',
  extendedPub:
    'xpub661MyMwAqRbcGuDtm9oc4ekm8mEtAHtrJgY572nPKGv8HWjZZzfZ4piQMFaCZpA6vhj3Q9NupCdEPsk4MTvhPDJMx7zdnhnRUXWWqQj6TPB',
};

export const TEST_SEND_TX = {
  hash: '72CD9FEE751DD6C1138F1567D48BCFFD4F028BD0E621B3B222EBE8311D7EBC50',
  signature: 'Ca9R3sDHIPt29r47ScAihlggEwi5PR1+WL9o9VhzkspTTakm+y7Zr34dRQSbeAfOs8cGxCP1jy8JNEvhRCYYKg==',
  pubKey: 'A7GpQESSpV24eEjRCzZS2fD6J9rN+gfivysh4nt05gkL',
  privateKey: 'lFjrreTB2/7/KJkdTwXsNqyDihgAMDkzM8sBDNia5mw=',
  signedTxBase64:
    'CpEBCo4BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm4KLWFnb3JpYzEzZmUwZzV6OGtyaDJ6d3p6eW51c3Z1czVxOGMwZWE3aG4wcXkzbRItYWdvcmljMTJkYXgwcTZmZm55cGVsd2hxamw1MmE4YXdmeHlwcDJ1NzZzY3d5Gg4KBHVibGQSBjEwMDAwMBJjCk4KRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDsalARJKlXbh4SNELNlLZ8Pon2s36B+K/KyHie3TmCQsSBAoCCAESEQoLCgR1YmxkEgM1MDAQwJoMGkAJr1HewMcg+3b2vjtJwCKGWCATCLk9HX5Yv2j1WHOSylNNqSb7Ltmvfh1FBJt4B86zxwbEI/WPLwk0S+FEJhgq',
  sender: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
  recipient: 'agoric12dax0q6ffnypelwhqjl52a8awfxypp2u76scwy',
  chainId: 'agoricdev-19',
  accountNumber: 152,
  sequence: 0,
  sendAmount: '100000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ubld',
          amount: '100000',
        },
      ],
      toAddress: 'agoric12dax0q6ffnypelwhqjl52a8awfxypp2u76scwy',
      fromAddress: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
    },
  },
  gasBudget: {
    amount: [{ denom: 'ubld', amount: '500' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '1E79FAB7E0D7415FF2FC7A996A3D525BDD509B460E544E612E22B0B6C0F113BE',
  signature: 'UPhHE9W+cWXsbf0ahLjtyYU3ugDD/vd+ROxSObnENDAnWZ22vxRnSMZEMibWNVwg5Mh69Y9tmf4yLMT78k79IA==',
  pubKey: 'A7GpQESSpV24eEjRCzZS2fD6J9rN+gfivysh4nt05gkL',
  privateKey: 'lFjrreTB2/7/KJkdTwXsNqyDihgAMDkzM8sBDNia5mw=',
  signedTxBase64:
    'Cp4BCpsBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ0Ci1hZ29yaWMxM2ZlMGc1ejhrcmgyend6enludXN2dXM1cThjMGVhN2huMHF5M20SNGFnb3JpY3ZhbG9wZXIxdzVheWRlNjk0ZzdneXJ5YTZ0NHZ5ZGM3Z3M1OXVwa2s4bWtyNzYaDQoEdWJsZBIFMTAwMDASZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohA7GpQESSpV24eEjRCzZS2fD6J9rN+gfivysh4nt05gkLEgQKAggBGAISEQoLCgR1YmxkEgM1MDAQwJoMGkBQ+EcT1b5xZext/RqEuO3JhTe6AMP+935E7FI5ucQ0MCdZnba/FGdIxkQyJtY1XCDkyHr1j22Z/jIsxPvyTv0g',
  delegator: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
  validator: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
  chainId: 'agoricdev-19',
  accountNumber: 152,
  sequence: 2,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
      validatorAddress: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
      amount: {
        denom: 'ubld',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubld',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: 'EE7C2EA800DDE56E85490679563F2AE37F5951B02EB2C51AFF78FD90D3E56728',
  signature: 'UNmT7oqymMa9tAP3wsbeWIZqVh5+3D9npdVJf6Pu0URGHrrrqAjJCjcjOub60vuNsG9u5JTXM+Xw3DkDY3hzdQ==',
  pubKey: 'A7GpQESSpV24eEjRCzZS2fD6J9rN+gfivysh4nt05gkL',
  privateKey: 'lFjrreTB2/7/KJkdTwXsNqyDihgAMDkzM8sBDNia5mw=',
  signedTxBase64:
    'CqABCp0BCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnQKLWFnb3JpYzEzZmUwZzV6OGtyaDJ6d3p6eW51c3Z1czVxOGMwZWE3aG4wcXkzbRI0YWdvcmljdmFsb3BlcjF3NWF5ZGU2OTRnN2d5cnlhNnQ0dnlkYzdnczU5dXBrazhta3I3NhoNCgR1YmxkEgUxMDAwMBJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDsalARJKlXbh4SNELNlLZ8Pon2s36B+K/KyHie3TmCQsSBAoCCAEYAxIRCgsKBHVibGQSAzUwMBDAmgwaQFDZk+6KspjGvbQD98LG3liGalYeftw/Z6XVSX+j7tFERh6666gIyQo3Izrm+tL7jbBvbuSU1zPl8Nw5A2N4c3U=',
  delegator: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
  validator: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
  chainId: 'agoricdev-19',
  accountNumber: 152,
  sequence: 3,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
      validatorAddress: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
      amount: {
        denom: 'ubld',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubld',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: 'FC79CB4D502FD6220ACCB4FF618934CA97E3D5A4A6F619E4025EFE7517A85C45',
  signature: 'rkrUzJHYZRJ0oNLHf6VkiZCu+yVudoAWlz+ytsuL50Q1fD3we9N2Yy+5h2SDBs7Fl69sIHY4zqvD2Lp2Y6Lx9g==',
  pubKey: 'A7GpQESSpV24eEjRCzZS2fD6J9rN+gfivysh4nt05gkL',
  privateKey: 'lFjrreTB2/7/KJkdTwXsNqyDihgAMDkzM8sBDNia5mw=',
  signedTxBase64:
    'CqMBCqABCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmUKLWFnb3JpYzEzZmUwZzV6OGtyaDJ6d3p6eW51c3Z1czVxOGMwZWE3aG4wcXkzbRI0YWdvcmljdmFsb3BlcjF3NWF5ZGU2OTRnN2d5cnlhNnQ0dnlkYzdnczU5dXBrazhta3I3NhJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDsalARJKlXbh4SNELNlLZ8Pon2s36B+K/KyHie3TmCQsSBAoCCAEYBBIRCgsKBHVibGQSAzUwMBDAmgwaQK5K1MyR2GUSdKDSx3+lZImQrvslbnaAFpc/srbLi+dENXw98HvTdmMvuYdkgwbOxZevbCB2OM6rw9i6dmOi8fY=',
  delegator: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
  validator: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
  chainId: 'agoricdev-19',
  accountNumber: 152,
  sequence: 4,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
      validatorAddress: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
      amount: {
        denom: 'ubld',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ubld',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '8F2E375738F519A4FCC9A9C1B1C2DFF494D6BD192A979413E0637FFF49F6667B',
  signature: '1caaewgmx4C/9vxOTczjZW5x582gPkIT+mh1yEY2KdpWqhy9Pfj+UkhHwWetR06Bu8W6eu7kqCeUz+54fAk0IA==',
  pubKey: 'A7GpQESSpV24eEjRCzZS2fD6J9rN+gfivysh4nt05gkL',
  privateKey: 'lFjrreTB2/7/KJkdTwXsNqyDihgAMDkzM8sBDNia5mw=',
  signedTxBase64:
    'CpQBCo4BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm4KLWFnb3JpYzEzZmUwZzV6OGtyaDJ6d3p6eW51c3Z1czVxOGMwZWE3aG4wcXkzbRItYWdvcmljMTJkYXgwcTZmZm55cGVsd2hxamw1MmE4YXdmeHlwcDJ1NzZzY3d5Gg4KBHVibGQSBjEwMDAwMBIBNRJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDsalARJKlXbh4SNELNlLZ8Pon2s36B+K/KyHie3TmCQsSBAoCCAEYARIRCgsKBHVibGQSAzUwMBDAmgwaQNXGmnsIJseAv/b8Tk3M42VucefNoD5CE/podchGNinaVqocvT34/lJIR8FnrUdOgbvFunru5KgnlM/ueHwJNCA=',
  from: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
  to: 'agoric12dax0q6ffnypelwhqjl52a8awfxypp2u76scwy',
  chainId: 'agoricdev-19',
  accountNumber: 152,
  sequence: 1,
  sendAmount: '100000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ubld',
          amount: '100000',
        },
      ],
      toAddress: 'agoric12dax0q6ffnypelwhqjl52a8awfxypp2u76scwy',
      fromAddress: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'ubld',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p',
  address2: 'agoric13fe0g5z8krh2zwzzynusvus5q8c0ea7hn0qy3m',
  address3: 'agoxxx1xxxnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p',
  address4: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p',
  validatorAddress1: 'agoricvaloper1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
  validatorAddress2: 'agoricvaloper1l59wfskgu2564m6e7wmd20e3wyn0d0h8qsyrc5',
  validatorAddress3: 'agoxxxvaloper1xxxxde694g7gyrya6t4vydc7gs59upkk8mkr76',
  validatorAddress4: 'agoricvalopxr1w5ayde694g7gyrya6t4vydc7gs59upkk8mkr76',
  noMemoIdAddress: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p',
  validMemoIdAddress: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p?memoId=2',
  invalidMemoIdAddress: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p?memoId=xyz',
  multipleMemoIdAddress: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '631720ED616D5E94A8D972CB2DF945E20A03B94B102324579C07C8F6734CE5E8',
  hash2: '6D0836887522A796D800E5093412D38930C71510B39E628B650E1C1F28E1BE80',
};

export const txIds = {
  hash1: '9FBEBFBB1A473CB3E90DBF31B5B4DC9BEADC39D7D4DEB1E19B8A9EDFD638CA81',
  hash2: 'E4E09A51709443CB351D1E5DBC0031F0ED9C7E480F1001C95AADC1F7BC1D7F31',
  hash3: '9028EEC9698428696ECE122A59CAACDE7BF725F4BA1C23714595C7B6E58AAB7F',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'ubld' },
  amount2: { amount: '0.1', denom: 'bld' },
  amount3: { amount: '100000000000', denom: 'nbld' },
  amount4: { amount: '-1', denom: 'ubld' },
  amount5: { amount: '1000', denom: 'hbld' },
};
