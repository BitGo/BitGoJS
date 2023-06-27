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
};
