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

export const wrwUser = {
  senderAddress: 'zeta1juqku5ysh6w3uagls0f9e6fdee5mt9m997zmzn',
  destinationAddress: 'zeta1nkpd2m3kw7xd9c0rpp9t3sk76jmgmz9us7vr7y',
  userPrivateKey:
    '{"iv":"OZhdhxzDZHPLpcL9A1Hnwg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"EicsafS2iWs=","ct":"MRxUYlbm/YKzNf\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"w7IJzj373cCAC49Q4lAAZA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"7LUyP/s6X1g=","ct":"/YahJbBVT/9BCz\n' +
    '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"}',
  bitgoPublicKey:
    '0353b6e739bc603052ff0d2df7762a9a94ee78ad046819bbd2947d50043b25f0b7e9620329d\n' +
    'cee04055dab91ff48d8e28a1d6c4884057a7f6c06b065fdd87513dd',
  walletPassphrase: 'QczkC@AOmPC0vaR0p^8z',
};

export const mockAccountDetailsResponse = {
  account: {
    '@type': '/ethermint.types.v1.EthAccount',
    base_account: {
      address: 'zeta1juqku5ysh6w3uagls0f9e6fdee5mt9m997zmzn',
      pub_key: null,
      account_number: '32393',
      sequence: '0',
    },
    code_hash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  },
};
