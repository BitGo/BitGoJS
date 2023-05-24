export const TEST_ACCOUNT = {
  pubAddress: 'osmo1kvpv7vgzrc4du0hufgdfysgglv9a7294mcnsy8',
  compressedPublicKey: '02f24395e31dacdc3af853917b28b68d8bcaa3291ff77461f77b568aa6bef7b1e9',
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
  privateKey: 'cGQSjk/xusPlqScte8OnHMAaW7Zjt1wu7R6W4eYzLUg=',
  signedTxBase64:
    'Co4BCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKK29zbW8xbWVtdHNtbHo5NWdmOTM4YWdmNXE2cWZoaGh0NHBwZThtZWpjdXMSK29zbW8xamo2NWR3MnF1bjRyZHg2d3V2dGM0dTh3YWRoaHp3bXU3enZsdzMaDwoFdW9zbW8SBjEwMDAwMBJkCk4KRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC+YLTNgkMbmpyrpsQVcZ4ySyXp9hjApsl6vd8cqPV4ZQSBAoCCAESEgoMCgV1b3NtbxIDNTAwEMCaDBpAQSYBjVIIMa1ILAong0RZ7NFiLbJiXMmyTso6bP+qt+05jsRMX1rPVGPy5izbqP9DF7NNNkUHt+Th05szBCVIwA==',
  sender: 'osmo1memtsmlz95gf938agf5q6qfhhht4ppe8mejcus',
  recipient: 'osmo1jj65dw2qun4rdx6wuvtc4u8wadhhzwmu7zvlw3',
  chainId: 'osmo-test-5',
  accountNumber: 239,
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
