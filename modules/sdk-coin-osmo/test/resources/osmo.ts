export const TEST_ACCOUNT = {
  pubAddress: 'osmo1kvpv7vgzrc4du0hufgdfysgglv9a7294mcnsy8',
  compressedPublicKey: '02f24395e31dacdc3af853917b28b68d8bcaa3291ff77461f77b568aa6bef7b1e9',
  compressedPublicKeyTwo: '0241de3d6aa354bf25d2fbb10186bbc8d34de048f4f92c2379edd7db6951954619',
  uncompressedPublicKey:
    '04f24395e31dacdc3af853917b28b68d8bcaa3291ff77461f77b568aa6bef7b1e9c4be2b435ed204f2402ace7069083056f2add3305be223c777611f2cb3bcacca',
  privateKey: '9558c5f1240eabd46564f986ab9349626a25d6346cbb47cb3c98bdb379ae8ff0',
  extendedPrv:
    'xprv9s21ZrQH143K2b8FzvDTqLb7siAAUZVRHYooUDGUsoMtBfkzuHaNAkBRYDdA8V81QQBEQwNWQaNoYF35AxBCvR7gmv4bWKBzeSyzfzigTYZ',
  extendedPub:
    'xpub661MyMwAqRbcF5Cj6wkUCUXrRjzet2DGemjQGbg6S8ts4U69SptciYVuPVMr1zkmVgyK3iZaZtmeTEYChJEMy6QZKFpA7oL5K9neNRS6q7P',
};

export const TEST_SEND_TX = {
  hash: '89391310BE0D3BF46F5B5584276366CD29E4DFCCEE18364B83CF227FBF2F1240',
  signature: 'QSYBjVIIMa1ILAong0RZ7NFiLbJiXMmyTso6bP+qt+05jsRMX1rPVGPy5izbqP9DF7NNNkUHt+Th05szBCVIwA==',
  pubKey: 'AvmC0zYJDG5qcq6bEFXGeMksl6fYYwKbJer3fHKj1eGU',
  privateKey: 'Z3oU9gNXXcifekIRlVe1fmoYIAbn0luis55Xw/Zbmko=',
  signedTxBase64:
    'Co4BCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK29zbW8xbWVtdHNtbHo5NWdmOTM4YWdmNXE2cWZoaGh0NHBwZThtZWpjdXMSK29zbW8xamo2NWR3MnF1bjRyZHg2d3V2dGM0dTh3YWRoaHp3bXU3enZsdzMaDwoFdW9zbW8SBjEwMDAwMBJkCk4KRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC+YLTNgkMbmpyrpsQVcZ4ySyXp9hjApsl6vd8cqPV4ZQSBAoCCAESEgoMCgV1b3NtbxIDNTAwEMCaDBpAQSYBjVIIMa1ILAong0RZ7NFiLbJiXMmyTso6bP+qt+05jsRMX1rPVGPy5izbqP9DF7NNNkUHt+Th05szBCVIwA==',
  from: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  to: 'osmo1jj65dw2qun4rdx6wuvtc4u8wadhhzwmu7zvlw3',
  chainId: 'osmo-test-5',
  accountNumber: 1346,
  sequence: 0,
  sendAmount: '100000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uosmo',
          amount: '100000',
        },
      ],
      toAddress: 'osmo1jj65dw2qun4rdx6wuvtc4u8wadhhzwmu7zvlw3',
      fromAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uosmo', amount: '500' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '0FA76F0E2EB79070590BE2E7F3F830F9A1278E2F5679EB591DD1400DDE28E4B8',
  signature: 'ZJh1FygiLSB1W55WQkknTjy/V57mkUK/3ibM5ed4LX1llCXcoNaCbqlIRXgGbatmGjn03UeH3nZsN5zE74s65w==',
  pubKey: 'AvmC0zYJDG5qcq6bEFXGeMksl6fYYwKbJer3fHKj1eGU',
  privateKey: 'Z3oU9gNXXcifekIRlVe1fmoYIAbn0luis55Xw/Zbmko=',
  signedTxBase64:
    'CpsBCpgBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJxCitvc21vMW1lbXRzbWx6OTVnZjkzOGFnZjVxNnFmaGhodDRwcGU4bWVqY3VzEjJvc21vdmFsb3BlcjFoaDBnNXhmMjNlNXpla2c0NWNtZXJjOTdoczRuMjAwNGR5MnQyNhoOCgV1b3NtbxIFMTAwMDASZgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAvmC0zYJDG5qcq6bEFXGeMksl6fYYwKbJer3fHKj1eGUEgQKAggBGAESEgoMCgV1b3NtbxIDNTAwEMCaDBpAZJh1FygiLSB1W55WQkknTjy/V57mkUK/3ibM5ed4LX1llCXcoNaCbqlIRXgGbatmGjn03UeH3nZsN5zE74s65w==',
  from: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  to: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
  chainId: 'osmo-test-5',
  accountNumber: 1346,
  sequence: 1,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
      validatorAddress: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
      amount: {
        denom: 'uosmo',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'uosmo',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: 'D498BC0C8D0DAB43442867DB9FFE645A3657E6DE90718BDBBE04609E3C06FFE0',
  signature: '8Xj2LyWR2Ltofb09NScBLeGBlTXYCf8xW/LwvSrgsDNfhgrWA3vMWlhek6uendGMWkyAWOcO2GtjhKiZKsdcyQ==',
  pubKey: 'AvmC0zYJDG5qcq6bEFXGeMksl6fYYwKbJer3fHKj1eGU',
  privateKey: 'Z3oU9gNXXcifekIRlVe1fmoYIAbn0luis55Xw/Zbmko=',
  signedTxBase64:
    'Cp0BCpoBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEnEKK29zbW8xbWVtdHNtbHo5NWdmOTM4YWdmNXE2cWZoaGh0NHBwZThtZWpjdXMSMm9zbW92YWxvcGVyMWhoMGc1eGYyM2U1emVrZzQ1Y21lcmM5N2hzNG4yMDA0ZHkydDI2Gg4KBXVvc21vEgUxMDAwMBJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC+YLTNgkMbmpyrpsQVcZ4ySyXp9hjApsl6vd8cqPV4ZQSBAoCCAEYAhISCgwKBXVvc21vEgM1MDAQwJoMGkDxePYvJZHYu2h9vT01JwEt4YGVNdgJ/zFb8vC9KuCwM1+GCtYDe8xaWF6Tq56d0YxaTIBY5w7Ya2OEqJkqx1zJ',
  from: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  to: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
  chainId: 'osmo-test-5',
  accountNumber: 1346,
  sequence: 2,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
      validatorAddress: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
      amount: {
        denom: 'uosmo',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'uosmo',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '2A7252984D16F728DFAA40C84D993BFA31F16480C493D129D1723BA05534A51F',
  signature: 'xdXMuc7H/PAN7YU2AMuVpkX5c3VKXOdJcK7uIGcGLsoiCnoHVsgnxHKC0mQvn0tO627eUgVacLmVCZk285r+Gg==',
  pubKey: 'AvmC0zYJDG5qcq6bEFXGeMksl6fYYwKbJer3fHKj1eGU',
  privateKey: 'Z3oU9gNXXcifekIRlVe1fmoYIAbn0luis55Xw/Zbmko=',
  signedTxBase64:
    'Cp8BCpwBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmEKK29zbW8xbWVtdHNtbHo5NWdmOTM4YWdmNXE2cWZoaGh0NHBwZThtZWpjdXMSMm9zbW92YWxvcGVyMWhoMGc1eGYyM2U1emVrZzQ1Y21lcmM5N2hzNG4yMDA0ZHkydDI2EmYKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQL5gtM2CQxuanKumxBVxnjJLJen2GMCmyXq93xyo9XhlBIECgIIARgDEhIKDAoFdW9zbW8SAzUwMBDAmgwaQMXVzLnOx/zwDe2FNgDLlaZF+XN1SlznSXCu7iBnBi7KIgp6B1bIJ8RygtJkL59LTutu3lIFWnC5lQmZNvOa/ho=',
  from: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  to: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
  chainId: 'osmo-test-5',
  accountNumber: 1346,
  sequence: 3,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
      validatorAddress: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
      amount: {
        denom: 'uosmo',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'uosmo',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '2B9388FD5CC5173E6B8CF5BCA7EC02F64B2C49D22279FC3C9B5BC95C6C9ACD8F',
  signature: 'Ew1YTouXfcBZoR1mdwBPCbIakZKlRWlf0UMp0Q7oz2cr+UioCmG5Mp6gegy6Iurpj40168WXlPRX71dQ/oUMig==',
  pubKey: 'AvmC0zYJDG5qcq6bEFXGeMksl6fYYwKbJer3fHKj1eGU',
  privateKey: 'Z3oU9gNXXcifekIRlVe1fmoYIAbn0luis55Xw/Zbmko=',
  signedTxBase64:
    'CpEBCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK29zbW8xbWVtdHNtbHo5NWdmOTM4YWdmNXE2cWZoaGh0NHBwZThtZWpjdXMSK29zbW8xamo2NWR3MnF1bjRyZHg2d3V2dGM0dTh3YWRoaHp3bXU3enZsdzMaDwoFdW9zbW8SBjEwMDAwMBIBNRJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC+YLTNgkMbmpyrpsQVcZ4ySyXp9hjApsl6vd8cqPV4ZQSBAoCCAEYBBISCgwKBXVvc21vEgM1MDAQwJoMGkATDVhOi5d9wFmhHWZ3AE8JshqRkqVFaV/RQynRDujPZyv5SKgKYbkynqB6DLoi6umPjTXrxZeU9FfvV1D+hQyK',
  from: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  to: 'osmo1jj65dw2qun4rdx6wuvtc4u8wadhhzwmu7zvlw3',
  chainId: 'osmo-test-5',
  accountNumber: 1346,
  sequence: 4,
  sendAmount: '100000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
      toAddress: 'osmo1jj65dw2qun4rdx6wuvtc4u8wadhhzwmu7zvlw3',
      amount: [
        {
          denom: 'uosmo',
          amount: '100000',
        },
      ],
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'uosmo',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_EXECUTE_CONTRACT_TRANSACTION = {
  hash: '62CA27678BFEFADBE064FFFDA425C9601E6BAD3044F1D2320663BF8594F70719',
  signature: 'KexKNBgM2+Uynfdw2IezPrs8J8y1G+J/JHIbPAKQLKANZtCcopig1H5DmlTxAoYeVZ9/b+2WLYJ/FIwvvA993g==',
  pubKey: 'ApWuvZlBAfy4KcVaOYNn4T9b6269swAx2QwuEJixkz+W',
  privateKey: 'UmzzQXbAKVSR6FTAbmq4xeOvwVXQ/oo60TOju8TFOB0=',
  signedTxBase64:
    'CqwBCqkBCiQvY29zbXdhc20ud2FzbS52MS5Nc2dFeGVjdXRlQ29udHJhY3QSgAEKK29zbW8xM2swd3JudnpkOW5qYWhqc3lydGZzODhlbjBqNWR6MDc1azhyNmgSP29zbW8xeGo0dnJhOHFzbThxa2h0dHRnMmEyeW44eW1obDh3eWdtbmRhYXE1c2xweG5nc2ZkaHZ1cXo5cmYwMBoQeyJpbmNyZW1lbnQiOnt9fRJnClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECla69mUEB/LgpxVo5g2fhP1vrbr2zADHZDC4QmLGTP5YSBAoCCAEYCxITCg0KBXVvc21vEgQ1MDAwEICJehpAKexKNBgM2+Uynfdw2IezPrs8J8y1G+J/JHIbPAKQLKANZtCcopig1H5DmlTxAoYeVZ9/b+2WLYJ/FIwvvA993g==',
  from: 'osmo13k0wrnvzd9njahjsyrtfs88en0j5dz075k8r6h',
  to: 'osmo1xj4vra8qsm8qkhtttg2a2yn8ymhl8wygmndaaq5slpxngsfdhvuqz9rf00',
  chainId: 'osmo-test-5',
  accountNumber: 2392,
  sequence: 11,
  feeAmount: '5000',
  message: {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: {
      sender: 'osmo13k0wrnvzd9njahjsyrtfs88en0j5dz075k8r6h',
      contract: 'osmo1xj4vra8qsm8qkhtttg2a2yn8ymhl8wygmndaaq5slpxngsfdhvuqz9rf00',
      msg: new Uint8Array(Buffer.from('7b22696e6372656d656e74223a7b7d7d', 'hex')),
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'uosmo',
        amount: '5000',
      },
    ],
    gasLimit: 2000000,
  },
};

export const address = {
  address1: 'osmo1jj65dw2qun4rdx6wuvtc4u8wadhhzwmu7zvlw3',
  address2: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  address3: 'osxx1xxxz06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  address4: 'osmo15al6vq6yfyqwru5adaxd9ju5e46qpvxx345cyg',
  validatorAddress1: 'osmovaloper1hh0g5xf23e5zekg45cmerc97hs4n2004dy2t26',
  validatorAddress2: 'osmovaloper12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2',
  validatorAddress3: 'osxyvaloper1xxxz06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  validatorAddress4: 'osmovalopr16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
  noMemoIdAddress: 'osmo15al6vq6yfyqwru5adaxd9ju5e46qpvxx345cyg',
  validMemoIdAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus?memoId=2',
  invalidMemoIdAddress: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus?memoId=xyz',
  multipleMemoIdAddress: 'osmo15al6vq6yfyqwru5adaxd9ju5e46qpvxx345cyg?memoId=3&memoId=12',
  contractAddress1: 'osmo1xj4vra8qsm8qkhtttg2a2yn8ymhl8wygmndaaq5slpxngsfdhvuqz9rf00',
  contractAddress2: 'sfa1xj4vra8qsm8qkhtttg2a2yn8ymhl8wygmndaaq5slpxngsfdhvuqz9rf00',
};

export const blockHash = {
  hash1: 'b43e8f64d384f5bfcfb60da6a353f3efc4f2465767e5c7ce9c6e3ebce9df5551',
  hash2: 'e1571435b14a14f6caed10b2088377a34d000c83e77e08842c044b5f4bbcd9fa',
};

export const txIds = {
  hash1: '89391310BE0D3BF46F5B5584276366CD29E4DFCCEE18364B83CF227FBF2F1240',
  hash2: 'D376D67A24E3226F7FEF1C7E4B2C6876E123A5B909C3A59ACF5115C60D8ED514',
  hash3: '9F713FE71613C8A27C6FE273264D886830E34234CAE3A811CB7D69BB22951299',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uosmo' },
  amount2: { amount: '0.1', denom: 'osmo' },
  amount3: { amount: '100000000000', denom: 'nosmo' },
  amount4: { amount: '-1', denom: 'uosmo' },
  amount5: { amount: '1000', denom: 'hosmo' },
  amount6: { amount: '0', denom: 'uosmo' },
};

export const wrwUser = {
  senderAddress: 'osmo1pqgd472992d2aaf7gylgflrl67c23ul0rt7gf3',
  destinationAddress: 'osmo1s7f3wxqjnu9d25ejy8hggnv4czuxt4uw5vqreh',
  userPrivateKey:
    '{"iv":"s7Mj3taTZR46bWX0oqkpZw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"8bdfezLgCVk=","ct":"u5XMS0O0hK03Rq\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"z5p9VFGbRMB+Zo0jgic/uw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"WL29RG24TaY=","ct":"ZZ4MA9LY65+psN\n' +
    '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"}',
  bitgoPublicKey:
    '039d9acd864b8f888df61b1beac85b47a3df88fe1ce85adc3741f70d7d642519a79a2a1daa0\n' +
    '9f0e7d5b91fd60299d64ef418b17f20d6c231e86e189b7a61e2bbe7',
  walletPassphrase: 'QczkC@AOmPC0vaR0p^8z',
};
