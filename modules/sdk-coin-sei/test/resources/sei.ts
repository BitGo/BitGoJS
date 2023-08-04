// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'sei1lyymgvt294ruvhm4cf50q2y0qnh0qmdqmjcj9d',
  compressedPublicKey: '03aee22022516db99b8edb59a11a8f668a9a35e3040115023d3660fd5ba298b406',
  compressedPublicKeyTwo: '0271313f2fc9cbe772d84e559a6e5b3ea15befd0ffcb80715e9709e1145962a028',
  uncompressedPublicKey:
    '04aee22022516db99b8edb59a11a8f668a9a35e3040115023d3660fd5ba298b406bb39055f471402b103ba2d52064a2f95475e2664b564f681ffdce6c1a5af6d73',
  privateKey: '83dd39e05b43086b71b955636065430ba7b0920285bbd6ee916a5044fcd8966c',
  extendedPrv:
    'xprv9s21ZrQH143K2rjewJ3k9W3JEBM2SjXFXqnPF5xDATm5psCT2W75hJUrvq96K46RTMn6f7MvbrCsKsgrbWzSNVsgczwatJXTdxFCs8uaK4w',
  extendedPub:
    'xpub661MyMwAqRbcFLp83KakWdz2nDBWrCF6u4hz3UMpioJ4hfXba3RLF6oLn8SYoAL9dWhor3YhK5kpcagyqFkEHnf7TsrBjfJuh21Doh22vAh',
};

export const TEST_SEND_TX = {
  hash: 'AF62BAD7D8BE9013BAF56655B12DE42635FAE8E35837E9E28AB971CFF8DC6688',
  signature: 'wlCkV161lvg+MtFYC9hWA2r4yUXjFy3KnOzEiI1vcjQgrsAv5syGI9XpX+Y+Y/Q5jb+ppkijnSJMpqiZaFCTiQ==',
  pubKey: 'At7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/',
  privateKey: 'H0FLnMbQoF8atIUiqoxjmimuEdUOfn7//Pz0+y5mtUY=',
  signedTxBase64:
    'CokBCoYBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmYKKnNlaTEwOXBscTVzMmRxbGo3am52bncyODMzaHhrdTdmOWZ1dXh6a2Q4aBIqc2VpMTN4YTVjc3pxdjU4ZjRnNnB0amVtdTV0NWgwZ3B5ZGM2ZWc5cmdyGgwKBHVzZWkSBDUwMDASZgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAt7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/EgQKAggBGA8SEgoMCgR1c2VpEgQyMDAwEMCaDBpAwlCkV161lvg+MtFYC9hWA2r4yUXjFy3KnOzEiI1vcjQgrsAv5syGI9XpX+Y+Y/Q5jb+ppkijnSJMpqiZaFCTiQ==',
  sender: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  recipient: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr',
  chainId: 'atlantic-2',
  accountNumber: 5334296,
  sequence: 15,
  sendAmount: '5000',
  feeAmount: '2000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'usei',
          amount: '5000',
        },
      ],
      toAddress: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr',
      fromAddress: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
    },
  },
  gasBudget: {
    amount: [{ denom: 'usei', amount: '2000' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '7CDE1CA5DCBBAD62F26ECBACF75A9697D85373A609136378E7A1510718DE0590',
  signature: 'BJ494VvGzSScBE+TB+ZPohzGBdb4gzasL2BLSriLwH0ILW37A59rGeWKgpecz1+SedXALP35HtB7nKk2fxv44A==',
  pubKey: 'At7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/',
  privateKey: 'H0FLnMbQoF8atIUiqoxjmimuEdUOfn7//Pz0+y5mtUY=',
  signedTxBase64:
    'CpgBCpUBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJuCipzZWkxMDlwbHE1czJkcWxqN2pudm53MjgzM2h4a3U3ZjlmdXV4emtkOGgSMXNlaXZhbG9wZXIxOXQ0ZDc4cHQ1eGc2eG0wbWY5N3E4YXk3djB4d3JyNGptZjA0ajMaDQoEdXNlaRIFMTAwMDASZgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAt7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/EgQKAggBGBESEgoMCgR1c2VpEgQyMDAwEMCaDBpABJ494VvGzSScBE+TB+ZPohzGBdb4gzasL2BLSriLwH0ILW37A59rGeWKgpecz1+SedXALP35HtB7nKk2fxv44A==',
  delegator: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  validator: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  chainId: 'atlantic-2',
  accountNumber: 5334296,
  sequence: 17,
  sendAmount: '10000',
  feeAmount: '2000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
      validatorAddress: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
      amount: {
        denom: 'usei',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'usei',
        amount: '2000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '9D8E66ADC439D52EDABAFFB19EE4481583BDF53EF2927E39ECF36F3DB44D8DAC',
  signature: '6XpakagSbgcmB/ZMycMAPqAsa/byKZAuHTer3RKFXwg4pVScY18BwjrdYqSgXrATSX7Ji5RnOg/1SDvmpbn6rA==',
  pubKey: 'At7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/',
  privateKey: 'H0FLnMbQoF8atIUiqoxjmimuEdUOfn7//Pz0+y5mtUY=',
  signedTxBase64:
    'CpoBCpcBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEm4KKnNlaTEwOXBscTVzMmRxbGo3am52bncyODMzaHhrdTdmOWZ1dXh6a2Q4aBIxc2VpdmFsb3BlcjE5dDRkNzhwdDV4ZzZ4bTBtZjk3cThheTd2MHh3cnI0am1mMDRqMxoNCgR1c2VpEgUxMDAwMBJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC3tZIKCqqu8n0aFO4er6y5LSmuXignDktdp2a/QV1J38SBAoCCAEYEhISCgwKBHVzZWkSBDIwMDAQwJoMGkDpelqRqBJuByYH9kzJwwA+oCxr9vIpkC4dN6vdEoVfCDilVJxjXwHCOt1ipKBesBNJfsmLlGc6D/VIO+alufqs',
  delegator: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  validator: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  chainId: 'atlantic-2',
  accountNumber: 5334296,
  sequence: 18,
  sendAmount: '10000',
  feeAmount: '2000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
      validatorAddress: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
      amount: {
        denom: 'usei',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'usei',
        amount: '2000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: 'CCE9654282D9B85E0D3CFCC1A3D942B2FA3A3FDA947EC17FCC3CB6F5B086F59F',
  signature: '/Glfs+Eg47wfBW1NjYuhk/U0XNelTsd8sUCpTtMQNB4B+yfNzl7Rs6/1KYpuXrksB6akumM2rhg1I51hr2KjXw==',
  pubKey: 'At7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/',
  privateKey: 'H0FLnMbQoF8atIUiqoxjmimuEdUOfn7//Pz0+y5mtUY=',
  signedTxBase64:
    'Cp0BCpoBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEl8KKnNlaTEwOXBscTVzMmRxbGo3am52bncyODMzaHhrdTdmOWZ1dXh6a2Q4aBIxc2VpdmFsb3BlcjE5dDRkNzhwdDV4ZzZ4bTBtZjk3cThheTd2MHh3cnI0am1mMDRqMxJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC3tZIKCqqu8n0aFO4er6y5LSmuXignDktdp2a/QV1J38SBAoCCAEYExISCgwKBHVzZWkSBDIwMDAQwJoMGkD8aV+z4SDjvB8FbU2Ni6GT9TRc16VOx3yxQKlO0xA0HgH7J83OXtGzr/Upim5euSwHpqS6YzauGDUjnWGvYqNf',
  delegator: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  validator: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  chainId: 'atlantic-2',
  accountNumber: 5334296,
  sequence: 19,
  sendAmount: '10000',
  feeAmount: '2000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
      validatorAddress: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
      amount: {
        denom: 'usei',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'usei',
        amount: '2000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'D416D43175417A18A66E340973665CDCAA5DB837C739DC3555B37FE1C6D9DF9C',
  signature: 'NGB+d+aFJ969X0q6JfUP7zY0RsPlmu4yjHcgFU8XeLh3GhdKuK2nmOl5ILbWV52juaERhbJ7gNxbwLC3dAPhpw==',
  pubKey: 'At7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/',
  privateKey: 'H0FLnMbQoF8atIUiqoxjmimuEdUOfn7//Pz0+y5mtUY=',
  signedTxBase64:
    'CowBCoYBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmYKKnNlaTEwOXBscTVzMmRxbGo3am52bncyODMzaHhrdTdmOWZ1dXh6a2Q4aBIqc2VpMTN4YTVjc3pxdjU4ZjRnNnB0amVtdTV0NWgwZ3B5ZGM2ZWc5cmdyGgwKBHVzZWkSBDUwMDASATUSZgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAt7WSCgqqrvJ9GhTuHq+suS0prl4oJw5LXadmv0FdSd/EgQKAggBGBASEgoMCgR1c2VpEgQyMDAwEMCaDBpANGB+d+aFJ969X0q6JfUP7zY0RsPlmu4yjHcgFU8XeLh3GhdKuK2nmOl5ILbWV52juaERhbJ7gNxbwLC3dAPhpw==',
  from: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  to: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr',
  chainId: 'atlantic-2',
  accountNumber: 5334296,
  sequence: 16,
  sendAmount: '5000',
  feeAmount: '2000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'usei',
          amount: '5000',
        },
      ],
      toAddress: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr',
      fromAddress: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'usei',
        amount: '2000',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'sei109plq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  address2: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr',
  address3: 'sxi10xplq5s2dqlj7jnvnw2833hxku7f9fuuxzkd8h',
  address4: 'sei1lyymgvt294ruvhm4cf50q2y0qnh0qmdqvm8dv6',
  validatorAddress1: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  validatorAddress2: 'seivaloper19t4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  validatorAddress3: 'sxivaloper1xx4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  validatorAddress4: 'seivalopr19xt4d78pt5xg6xm0mf97q8ay7v0xwrr4jmf04j3',
  noMemoIdAddress: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr',
  validMemoIdAddress: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr?memoId=2',
  invalidMemoIdAddress: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr?memoId=xyz',
  multipleMemoIdAddress: 'sei13xa5cszqv58f4g6ptjemu5t5h0gpydc6eg9rgr?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '74C389108519ACCC7E552B859077A07B509255A423B8CB316A5B773864FC7B45',
  hash2: '468AF162711CF1B3BBFD9473586D3E09FA0F599BC81D6A0409147EABD6BD9CB5',
};

export const txIds = {
  hash1: 'A025AA7B7BDEC5A558FE8B2C08F42025FD22D0EDE56301B177C628FC98ED2407',
  hash2: 'F1AE2972D47F6DA250F35B2C7380F9DCE067B29255CC270E655FE2CA41291ABD',
  hash3: '20663DB79B45A0FC69E2C8328F522294E5B35532EEFFE0D7F4C2D763E53A2B02',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'usei' },
  amount2: { amount: '0.1', denom: 'sei' },
  amount3: { amount: '100000000000', denom: 'nsei' },
  amount4: { amount: '-1', denom: 'usei' },
  amount5: { amount: '1000', denom: 'hsei' },
};

export const wrwUser = {
  senderAddress: 'sei1g3esayphyp9ep0jfhlq4gvr3wu6c2rdvgx6n60',
  destinationAddress: 'sei1vqzcenhrtu0597lmkl9tvrvedpf8jruraujvcj',
  userPrivateKey:
    '{"iv":"i3uiDt5Jtea00XY9ju52lQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"6pLLCS7gjMU=","ct":"UcOMX5CgtAISKv\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"FFWNtdweLg6bIaMEIb28AQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"DUxG3N/JXm0=","ct":"rCxYIZjCFXDfv+\n' +
    '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"}',
  bitgoPublicKey:
    '0212e4c197187e04c91c268e15c587c8159ca49ec933b6f251a708c4790e09a3a7a92dd383a\n' +
    'ec577aa30e25ddd1b733281e4bab23896aa245f10c8e03e23f8ab6f',
  walletPassphrase: 'bitgo_test@123',
};
