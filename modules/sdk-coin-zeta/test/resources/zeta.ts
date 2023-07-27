// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'zeta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu',
  compressedPublicKey: '03055083ec23f7041c8d8410ebcd0c9888bcab28fd23aa3a629de58e28c825f95f',
  compressedPublicKeyTwo: '0311278f8100296c002a52ce13acd0cb90f88375228aa4dec6c5adbb8ffc636321',
  uncompressedPublicKey:
    '04055083ec23f7041c8d8410ebcd0c9888bcab28fd23aa3a629de58e28c825f95fcf00c04b0504d749b15d86e7f89e9f8cfef0830484a492310888f26f1315a687',
  privateKey: 'd78dbd2355c4071fc235237768efb16d50c330d7100ef46f95b57df0adb9078a',
  extendedPrv:
    'xprv9s21ZrQH143K2Mpei3jmq9YFzANSavQHq2KyT1aED2pRrfWfqLPEJA5yLn6hDnsryqqAL3typ7EBmSgLnXLzjgVk2QV7csHQqJ9tx5BeB6L',
  extendedPub:
    'xpub661MyMwAqRbcEqu7p5GnCHUzYCCvzP89CFFaFPyqmNMQjTqpNshUqxQTC3UcZbTYBhzyHrve6HgRSTvkUdFw2ZxQgP9o1geZZHS2L8Zr8pn',
};

export const TEST_SEND_TX = {
  hash: '92FC96BC1C41CAE90A406FD508B89059974B8F732CCAC61E3B932D9BF30991D9',
  signature: 'j+UuoCkJY6DuiwnYyl/G2egg1rSvVLZJe41QsxE0i6Ql/F7H1fd5IQ2II6dcjWhLMOhSyBfEldg83XSAXOZaqg==',
  pubKey: 'A+E+fjbiCvXkVwNfcfMyuV5xMQelOaHsgKt0XklolaiZ',
  privateKey: 'w7gsHxeGjJBwHNRE8fUwSJHYPrimZqngjc8hNR9vTLQ=',
  signedTxBase64:
    'CpEBCo4BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm4KK3pldGExMmtoeG1sa3l6OWhmbHV2MmR0ZDR0NzRsZjNocm1ha3kwc3EwZTISK3pldGExa3RycjRqdTNhMmx1eHBjZm12NDR4cnBhNGx3eDR1ZnNhMzh3dDgaEgoFYXpldGESCTEwMDAwMDAwMBJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiED4T5+NuIK9eRXA19x8zK5XnExB6U5oeyAq3ReSWiVqJkSBAoCCAEYBBISCgwKBWF6ZXRhEgM1MDAQwJoMGkCP5S6gKQljoO6LCdjKX8bZ6CDWtK9Utkl7jVCzETSLpCX8XsfV93khDYgjp1yNaEsw6FLIF8SV2DzddIBc5lqq',
  sender: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
  recipient: 'zeta1ktrr4ju3a2luxpcfmv44xrpa4lwx4ufsa38wt8',
  chainId: 'athens_7001-1',
  accountNumber: 258033,
  sequence: 4,
  sendAmount: '100000000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'azeta',
          amount: '100000000',
        },
      ],
      toAddress: 'zeta1ktrr4ju3a2luxpcfmv44xrpa4lwx4ufsa38wt8',
      fromAddress: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
    },
  },
  gasBudget: {
    amount: [{ denom: 'azeta', amount: '500' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '7CE96381A3BD78EE84D671CB360C2D616ADB4E3AAA5615BA054AC39B94E83EF6',
  signature: '879wbHPIcXpxPFAeMOUc1gNVeH+CbAftTcPk94Rz6mBiJo1QVRk7BnghHfaGIQ1tKSr8kc3c2A6FHcsJK9Iw+w==',
  pubKey: 'A+E+fjbiCvXkVwNfcfMyuV5xMQelOaHsgKt0XklolaiZ',
  privateKey: 'w7gsHxeGjJBwHNRE8fUwSJHYPrimZqngjc8hNR9vTLQ=',
  signedTxBase64:
    'CpsBCpgBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJxCit6ZXRhMTJraHhtbGt5ejloZmx1djJkdGQ0dDc0bGYzaHJtYWt5MHNxMGUyEjJ6ZXRhdmFsb3BlcjFwcHRmaG55ajM3cW4wbmZ1aG11N201c3N5NXg2dGQ4aG1jY3B6bBoOCgVhemV0YRIFMTAwMDAScgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohA+E+fjbiCvXkVwNfcfMyuV5xMQelOaHsgKt0XklolaiZEgQKAggBGAYSHgoYCgVhemV0YRIPMTAwMDAwMDAwMDAwMDAwEMCaDBpA879wbHPIcXpxPFAeMOUc1gNVeH+CbAftTcPk94Rz6mBiJo1QVRk7BnghHfaGIQ1tKSr8kc3c2A6FHcsJK9Iw+w==',
  delegator: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
  validator: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
  chainId: 'athens_7001-1',
  accountNumber: 258033,
  sequence: 6,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
      validatorAddress: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
      amount: {
        denom: 'azeta',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'azeta',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: 'A7FCEA1B657CD3CA0BF7E03CB6B3279D1B737CBE1B8449E920A23453DACE2B1A',
  signature: 'K69sqHfrCe32lsh18jRZ1ZRlr5E5XqdUS1zI3AIfQrRCiPrp/cTVbkyp1HGVr+geoE04CLRDuT7iLHjAwQNlwg==',
  pubKey: 'A+E+fjbiCvXkVwNfcfMyuV5xMQelOaHsgKt0XklolaiZ',
  privateKey: 'w7gsHxeGjJBwHNRE8fUwSJHYPrimZqngjc8hNR9vTLQ=',
  signedTxBase64:
    'Cp0BCpoBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnEKK3pldGExMmtoeG1sa3l6OWhmbHV2MmR0ZDR0NzRsZjNocm1ha3kwc3EwZTISMnpldGF2YWxvcGVyMXBwdGZobnlqMzdxbjBuZnVobXU3bTVzc3k1eDZ0ZDhobWNjcHpsGg4KBWF6ZXRhEgUxMDAwMBJyClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiED4T5+NuIK9eRXA19x8zK5XnExB6U5oeyAq3ReSWiVqJkSBAoCCAEYBxIeChgKBWF6ZXRhEg8xMDAwMDAwMDAwMDAwMDAQwJoMGkArr2yod+sJ7faWyHXyNFnVlGWvkTlep1RLXMjcAh9CtEKI+un9xNVuTKnUcZWv6B6gTTgItEO5PuIseMDBA2XC',
  delegator: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
  validator: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
  chainId: 'athens_7001-1',
  accountNumber: 258033,
  sequence: 7,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
      validatorAddress: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
      amount: {
        denom: 'azeta',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'azeta',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: 'C072433DD1B9D1A5A0C90E6C65EF0E034FBEA73B3C3E9ADC798D23049A058416',
  signature: 'gLE/KcGKXcpdZ9Lo5sjcwpaNOUESLgOBDtR46IhzIAtOLaxJQNuMW4uKYENLQr4So3dJLQgaArDbVsZygxJ3fg==',
  pubKey: 'A+E+fjbiCvXkVwNfcfMyuV5xMQelOaHsgKt0XklolaiZ',
  privateKey: 'w7gsHxeGjJBwHNRE8fUwSJHYPrimZqngjc8hNR9vTLQ=',
  signedTxBase64:
    'Cp8BCpwBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmEKK3pldGExMmtoeG1sa3l6OWhmbHV2MmR0ZDR0NzRsZjNocm1ha3kwc3EwZTISMnpldGF2YWxvcGVyMXBwdGZobnlqMzdxbjBuZnVobXU3bTVzc3k1eDZ0ZDhobWNjcHpsEnIKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQPhPn424gr15FcDX3HzMrlecTEHpTmh7ICrdF5JaJWomRIECgIIARgIEh4KGAoFYXpldGESDzEwMDAwMDAwMDAwMDAwMBDAmgwaQICxPynBil3KXWfS6ObI3MKWjTlBEi4DgQ7UeOiIcyALTi2sSUDbjFuLimBDS0K+EqN3SS0IGgKw21bGcoMSd34=',
  delegator: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
  validator: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
  chainId: 'athens_7001-1',
  accountNumber: 258033,
  sequence: 8,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
      validatorAddress: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
      amount: {
        denom: 'azeta',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'azeta',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'ED734BF9D37C4593DE3D535EDC0DB551E6CA250B0F6663AEA5C35989830D4D4A',
  signature: '7UgsEUhDIyhVCkuVulTyTdwdP5qTWPqEq4zt3JjtP2MuQVsYktjs96rQh1uBFI2qv7DL8w7hy+0pWYpP3pFthg==',
  pubKey: 'A+E+fjbiCvXkVwNfcfMyuV5xMQelOaHsgKt0XklolaiZ',
  privateKey: 'w7gsHxeGjJBwHNRE8fUwSJHYPrimZqngjc8hNR9vTLQ=',
  signedTxBase64:
    'CpEBCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK3pldGExMmtoeG1sa3l6OWhmbHV2MmR0ZDR0NzRsZjNocm1ha3kwc3EwZTISK3pldGExa3RycjRqdTNhMmx1eHBjZm12NDR4cnBhNGx3eDR1ZnNhMzh3dDgaDwoFYXpldGESBjEwMDAwMBIBNRJyClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiED4T5+NuIK9eRXA19x8zK5XnExB6U5oeyAq3ReSWiVqJkSBAoCCAEYBRIeChgKBWF6ZXRhEg8xMDAwMDAwMDAwMDAwMDAQwJoMGkDtSCwRSEMjKFUKS5W6VPJN3B0/mpNY+oSrjO3cmO0/Yy5BWxiS2Oz3qtCHW4EUjaq/sMvzDuHL7SlZik/ekW2G',
  from: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
  to: 'zeta1ktrr4ju3a2luxpcfmv44xrpa4lwx4ufsa38wt8',
  chainId: 'athens_7001-1',
  accountNumber: 258033,
  sequence: 5,
  sendAmount: '100000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'azeta',
          amount: '100000',
        },
      ],
      toAddress: 'zeta1ktrr4ju3a2luxpcfmv44xrpa4lwx4ufsa38wt8',
      fromAddress: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'azeta',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'zeta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu',
  address2: 'zeta12khxmlkyz9hfluv2dtd4t74lf3hrmaky0sq0e2',
  address3: 'zxta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu',
  address4: 'zeta1yt84ujwncxjy63rjceh7dcakx09cdz6yrst5hq',
  validatorAddress1: 'zetavaloper1pptfhnyj37qn0nfuhmu7m5ssy5x6td8hmccpzl',
  validatorAddress2: 'zetavaloper1p3emgemv8q0fmtw70kfzwecmcvyd9ztqlzudwn',
  validatorAddress3: 'zxtavaloper1ztq4hqq29ea7pxa0gq4j72a0qakj0nk6se8uxx',
  validatorAddress4: 'zetavalopr1xylc3m77tvm7wkrc7awn2tlqp4zfwvgnpdywp4y',
  noMemoIdAddress: 'zeta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu',
  validMemoIdAddress: 'zeta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu?memoId=2',
  invalidMemoIdAddress: 'zeta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu?memoId=xyz',
  multipleMemoIdAddress: 'zeta18t3y6mzljydmqzrlfrnsfvwtdupww0dexegtuu?memoId=3&memoId=12',
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
  amount1: { amount: '100000', denom: 'azeta' },
  amount2: { amount: '1000000', denom: 'azeta' },
  amount3: { amount: '10000000', denom: 'azeta' },
  amount4: { amount: '-1', denom: 'azeta' },
  amount5: { amount: '1000000000', denom: 'uzeta' },
};
