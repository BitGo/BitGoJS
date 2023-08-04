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

export const wrwUser = {
  senderAddress: 'agoric1enx2gvcpmf4fw7vnngj2qjw2x4270vhwev49ra',
  destinationAddress: 'agoric1tkfnp4khzd0f7mgtznwrvr0lv2at3p8c8sz89p',
  userPrivateKey:
    '{"iv":"P1169+ix5MxunnuGnImS1A==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"YaHeMap/tjc=","ct":"G06Q+7ttYkJOts\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"xwZOZPLd8e8ibVch/HuYEg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"oOWjYTqp1gI=","ct":"geEOWhQlQeX/jF\n' +
    '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"}',
  bitgoPublicKey:
    '026626d4eecfb9bc35ad48e559fa75551df355d3678cbfb02e6d8430296ea702d8c80441ed2\n' +
    '00d5c3210737faa9339afa4e6853d53145bb8887dd17c55fc33f6ff',
  walletPassphrase: 'bitgo_test@123',
};
