// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
  compressedPublicKey: '0260a15611f230b0a872073912d219dbb16937d934bd2a3c0f37321eefd8a8c8e8',
  compressedPublicKeyTwo: '02a862845d55f23b23eb18b09e57f4f0501f2626d5b67a74bd3cd250d1e240cb66',
  uncompressedPublicKey:
    '0460a15611f230b0a872073912d219dbb16937d934bd2a3c0f37321eefd8a8c8e84dc9e12aec0450b4046bec0c111de7ef1c42a276e683bd51091ea4778448d932',
  privateKey: '63e13f9ec52ba035e1b25185e87f49e6486d4553183605623ad577216a0abbb7',
  extendedPrv:
    'xprv9s21ZrQH143K4DQW6JgmACS8u5DUUpixFNy3XkpYUU12Jyigo1rY5HNyWyLdWwXeAGwyUGzuDmH7yX3HCH3agquFYDMQiRZeETKWM5PFPG7',
  extendedPub:
    'xpub661MyMwAqRbcGhUyCLDmXLNsT73xtHSocbteL9EA2oY1Bn3qLZAnd5hTNELxx7CWPQ875EgDWKRQfaV5qbzHPSuoTGTKnPE3zBayvJbyrX6',
};

export const TEST_SEND_TX = {
  hash: '61862FC954E8F0AD740E73DF6A193A12011E79E36D68E3EB0901467B7D4B074D',
  signature: 'LV/V0dgYvQEFCUuorcIlsCw5hBAYFIQyO1sFE81lyX5RoR1wlwRqkSH6j8AbEGGZaSETkibFX9T6PzIEJjqsTQ==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'Co8BCowBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKK2thdmExdHNldjN2dGxsY3ZnNDlkMDZweHJqOHl3c2owaHpxNTdyYzZzNDgSK2thdmExeTh6OHl1YXd1MGx3NGZkY3pwcGxzbXJxcTBrZTc3eTd2eGZ3bmsaEAoFdWthdmESBzEwMDAwMDASaApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjoEgQKAggBGAISFAoOCgV1a2F2YRIFNTAwMDAQwIQ9GkAtX9XR2Bi9AQUJS6itwiWwLDmEEBgUhDI7WwUTzWXJflGhHXCXBGqRIfqPwBsQYZlpIROSJsVf1Po/MgQmOqxN',
  sender: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
  recipient: 'kava1y8z8yuawu0lw4fdczpplsmrqq0ke77y7vxfwnk',
  chainId: 'kava_2221-16000',
  accountNumber: 169530,
  sequence: 2,
  sendAmount: '1000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ukava',
          amount: '1000000',
        },
      ],
      toAddress: 'kava1y8z8yuawu0lw4fdczpplsmrqq0ke77y7vxfwnk',
      fromAddress: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
    },
  },
  gasBudget: {
    amount: [{ denom: 'ukava', amount: '50000' }],
    gasLimit: 1000000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '63A3AEBEA4898F20667AC9D4046E521289B25A2C41EA1190CCAB908BFA1FD516',
  signature: 'xVubQZ/Jif+43DnxboKTHZPV94K9UPERJmQsuXJToUtaY8vkacDCiunrFEhndKHD/vr9plBEb9XYXqjCzYzPGA==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'Cp0BCpoBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJzCitrYXZhMXRzZXYzdnRsbGN2ZzQ5ZDA2cHhyajh5d3NqMGh6cTU3cmM2czQ4EjJrYXZhdmFsb3BlcjF2bHBzcm1keXV5d3ZhcXJ2N3J4NnhnYTIyNHNxZnd6M3lqbmxraBoQCgV1a2F2YRIHMTAwMDAwMBJoClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECYKFWEfIwsKhyBzkS0hnbsWk32TS9KjwPNzIe79ioyOgSBAoCCAEYBBIUCg4KBXVrYXZhEgU1MDAwMBDAhD0aQMVbm0GfyYn/uNw58W6Ckx2T1feCvVDxESZkLLlyU6FLWmPL5GnAworp6xRIZ3Shw/76/aZQRG/V2F6ows2Mzxg=',
  delegator: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
  validator: 'kavavaloper1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
  chainId: 'kava_2221-16000',
  accountNumber: 169530,
  sequence: 4,
  sendAmount: '1000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
      validatorAddress: 'kavavaloper1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
      amount: {
        denom: 'ukava',
        amount: '1000000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ukava',
        amount: '50000',
      },
    ],
    gasLimit: 1000000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: 'D4F26E91F5E872C18A07E25EF646CDCED7F82116617BBA7F7DFA6A83E03C0FA8',
  signature: '20s5rHsykWFno6bKZtmODxKhX5uJJa37u5uKiaUT+gE4bX/dkxZmf75bSQ5/SFYRB/lSLoISHFnAaLcohIleiw==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'Cp8BCpwBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnMKK2thdmExdHNldjN2dGxsY3ZnNDlkMDZweHJqOHl3c2owaHpxNTdyYzZzNDgSMmthdmF2YWxvcGVyMXZscHNybWR5dXl3dmFxcnY3cng2eGdhMjI0c3Fmd3ozeWpubGtoGhAKBXVrYXZhEgcxMDAwMDAwEmgKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQJgoVYR8jCwqHIHORLSGduxaTfZNL0qPA83Mh7v2KjI6BIECgIIARgFEhQKDgoFdWthdmESBTUwMDAwEMCEPRpA20s5rHsykWFno6bKZtmODxKhX5uJJa37u5uKiaUT+gE4bX/dkxZmf75bSQ5/SFYRB/lSLoISHFnAaLcohIleiw==',
  delegator: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
  validator: 'kavavaloper1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
  chainId: 'kava_2221-16000',
  accountNumber: 169530,
  sequence: 5,
  sendAmount: '1000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
      validatorAddress: 'kavavaloper1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
      amount: {
        denom: 'ukava',
        amount: '1000000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ukava',
        amount: '50000',
      },
    ],
    gasLimit: 1000000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '2673D03968946210A8290F13D1EC4150C4853549A16EC899361937B0B44781C2',
  signature: '3FMsPOWwfosJJJ+fJgtwUry7VmM7GpAcZgR1HCdjoS8dGm3RisHv06IIHFjnPukxorkPTpOqmEUYP69V77lHSg==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'Cp8BCpwBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmEKK2thdmExdHNldjN2dGxsY3ZnNDlkMDZweHJqOHl3c2owaHpxNTdyYzZzNDgSMmthdmF2YWxvcGVyMXZscHNybWR5dXl3dmFxcnY3cng2eGdhMjI0c3Fmd3ozeWpubGtoEmgKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQJgoVYR8jCwqHIHORLSGduxaTfZNL0qPA83Mh7v2KjI6BIECgIIARgGEhQKDgoFdWthdmESBTUwMDAwEMCEPRpA3FMsPOWwfosJJJ+fJgtwUry7VmM7GpAcZgR1HCdjoS8dGm3RisHv06IIHFjnPukxorkPTpOqmEUYP69V77lHSg==',
  delegator: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
  validator: 'kavavaloper1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
  chainId: 'kava_2221-16000',
  accountNumber: 169530,
  sequence: 6,
  sendAmount: '1000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
      validatorAddress: 'kavavaloper1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
      amount: {
        denom: 'ukava',
        amount: '1000000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'ukava',
        amount: '50000',
      },
    ],
    gasLimit: 1000000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '4F6FF623E46B11227237D25F9FA8830DCDBADD78904A3374642C331F4DD8A151',
  signature: 'uzNgGjg0x6OSv6faTuNUcardwe048Kezyalikq4yAXdFUAF7YVnl7D78TBD51XxhD2StiqZiVcbAAfJ4l1C9rw==',
  pubKey: 'AmChVhHyMLCocgc5EtIZ27FpN9k0vSo8DzcyHu/YqMjo',
  privateKey: 'Y+E/nsUroDXhslGF6H9J5khtRVMYNgViOtV3IWoKu7c=',
  signedTxBase64:
    'CpMBCowBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKK2thdmExdHNldjN2dGxsY3ZnNDlkMDZweHJqOHl3c2owaHpxNTdyYzZzNDgSK2thdmExeTh6OHl1YXd1MGx3NGZkY3pwcGxzbXJxcTBrZTc3eTd2eGZ3bmsaEAoFdWthdmESBzEwMDAwMDASAjEwEmgKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQJgoVYR8jCwqHIHORLSGduxaTfZNL0qPA83Mh7v2KjI6BIECgIIARgHEhQKDgoFdWthdmESBTUwMDAwEMCEPRpAuzNgGjg0x6OSv6faTuNUcardwe048Kezyalikq4yAXdFUAF7YVnl7D78TBD51XxhD2StiqZiVcbAAfJ4l1C9rw==',
  from: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
  to: 'kava1y8z8yuawu0lw4fdczpplsmrqq0ke77y7vxfwnk',
  chainId: 'kava_2221-16000',
  accountNumber: 169530,
  sequence: 7,
  sendAmount: '1000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'ukava',
          amount: '1000000',
        },
      ],
      toAddress: 'kava1y8z8yuawu0lw4fdczpplsmrqq0ke77y7vxfwnk',
      fromAddress: 'kava1tsev3vtllcvg49d06pxrj8ywsj0hzq57rc6s48',
    },
  },
  memo: '10',
  gasBudget: {
    amount: [
      {
        denom: 'ukava',
        amount: '50000',
      },
    ],
    gasLimit: 1000000,
  },
};

export const address = {
  address1: 'kava196n9432kj8gq9c63zqp0tw84vzxl5fe42g6mcf',
  address2: 'kava1f5gdcsqnp7pwer2tcew2cknt7yxx075y2hmn8q',
  address3: 'kava3p2peruj0e6jf3rr0v5khvgcshsal83ma2wqkc4',
  address4: 'kava1rapguads86vzzzx8ex3l7c4fcqfxcc3l9tu9m0',
  validatorAddress1: 'kavavaloper1w33q067j4swp3clyqheecyuujzp0c74zmh3p3m',
  validatorAddress2: 'kavavaloper1ymz04qqhpdwawfc94hxzz8lgfysde5xzf28twu',
  validatorAddress3: 'kavavaloper37h967rknehr2rcq4dskv240yjc80nr884n0evd',
  validatorAddress4: 'kavavaloder1vlpsrmdyuywvaqrv7rx6xga224sqfwz3yjnlkh',
  noMemoIdAddress: 'kava196n9432kj8gq9c63zqp0tw84vzxl5fe42g6mcf',
  validMemoIdAddress: 'kava196n9432kj8gq9c63zqp0tw84vzxl5fe42g6mcf?memoId=2',
  invalidMemoIdAddress: 'kava196n9432kj8gq9c63zqp0tw84vzxl5fe42g6mcf?memoId=xyz',
  multipleMemoIdAddress: 'kava196n9432kj8gq9c63zqp0tw84vzxl5fe42g6mcf?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: 'EAC6FD8E99B5F3E464288A7BC3879A692114F272064879D0CE4FD8B016A0C9B6',
  hash2: 'DCDBF88AB119A27B9C791E1671F9249CAB1410137CB6453054330E77712ED9D1',
};

export const txIds = {
  hash1: '0242DD592F2A62F07440149D1B149CFA08CC68775CB1A4AA5EB1C90C0CB26AED',
  hash2: '09896626162BF18399A9218FA83B545F42E35F4D9BAFBB50555E527CFEA46FEB',
  hash3: '1AABA0D505742921CB6D4B4CDA71322C4A41CC2A94751E97F25C53F08FCB287F',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'ukava' },
  amount2: { amount: '1000000', denom: 'ukava' },
  amount3: { amount: '10000000', denom: 'ukava' },
  amount4: { amount: '-1', denom: 'ukava' },
  amount5: { amount: '1000000000', denom: 'akava' },
};
