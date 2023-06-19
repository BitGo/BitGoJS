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
