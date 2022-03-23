export const accounts = {
  account1: {
    secretKey: '874578010603af8e93b44bfc1d13b32830d0dbca6c89f28ccdc662afd3cdc824',
    publicKey: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
    address: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
  },
  account2: {
    secretKey: '6f850d17c2bf64478a2aac860fe9c23a48d322f12932c43fe90704553b7b84fd',
    publicKey: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
    address: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
  },
  account3: {
    address: '8e498c7299bc8847915ad02989cf23dfde4296b6cba8cc815c36a49a4092ce8e',
    publicKey: '8e498c7299bc8847915ad02989cf23dfde4296b6cba8cc815c36a49a4092ce8e',
    secretKey: '28ByugHUcLmxyR4rN2gsLBDQFePrpkTvadtAURHKPeSDXn9iwi9aU9uHW8EFBoX7qVXc98shndvqJFt58NbzECG5',
  },
  account4: {
    secretKey: '3Yezqc8eWT9coM2dSguT1XCDcfC3BYYdtGVPEdczRBgqmWmLU7LEDzBwcNEHA31cXFsKyXoE4UC1H9n33C4np7EZ',
    publicKey: '38EYs2D2t9fYEwE66Eqdj7canW1PfSszieqtNorqfJWm',
    address: '1f91c283682b6014e68c56ba09302730fac1f4a1de5ec8f729bfe1fb51d2b9b2',
  },
  account5: {
    secretKey: '3Yezqc8eWT9coM2dSguT1XCDcfC3BYYdtGVPEdczRBgqmWmLU7LEDzBwcNEHA31cXFsKyXoE4UC1H9n33C4np7EZ',
    publicKey: '38EYs2D2t9fYEwE66Eqdj7canW1PfSszieqtNorqfJWm',
    address: 'btdev.testnet',
  },
  errorsAccounts: {
    address1: 'not ok',
    address2: 'bo__wen',
    address3: 'me@google.com',
    address4: '$$$',
    address5: 'abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz',
  },
  default: {
    secretKey: '0000000000000000000000000000000000000000000000000000000000000000',
    publicKey: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
    address: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
  },
};

export const blockHash = {
  block1: 'CDEwwp7TjjahriSvX3457qZ5uF3TtgEZHj7o5ssKFNs9',
  block2: 'CvjrdzHQB1KystXqa4bDWcLbNRaVUcrLZ3PVnMqHKyiW',
};

export const errorBlockHash = {
  block1: 'CDEwwp7TjjahErrorriSvX3457qZ5uF3TtgEZHj7o5ssKFNs9',
  block2: 'CvjrdzHQB1KystXqa4bDWcLbNRaVUcrLZ3PVnMqHKyiW',
};

export const signatures = {
  signature1: 'NfcCZq7rrxx8SN23w31Wtd53Bhw5qm6E4GaXfw1sxBEnV3J9MRdHRzwgDEEjTC5WCurvW84bkyDcpCGgGjkhi9A',
  signature2: 'NfcCZq7rrxx8SN23w31Wtd53Bhw5qm6E4GaXfw1sxBEnV3J9MRdHRzwgDEEjTC5WCurvW84bkyDcpCGgGjkhi9A',
  signature3: 'FrTD1L5nVyFqPmQDFtKX4goWoFtz9iF9bwF27DxfEmBDJ7eiBEr6H4ULPAJ4kNQTCpdQB2RJK2LuT7yUGKnDhty',
};

export const txIds = {
  id1: '9Z9Kn1aDw6CQTcH3qttxJSf3PCwc6BvMirrCiroY5v6W',
  id2: '3eBsBWBK9wtjYgtw2B23HzVaXj8vopFcmiMSTHSJiroW',
};

export const rawTx = {
  transfer: {
    signed:
      '9XRumdRxBY6xFxWJHDUJphSLaAB3sCDiprEmRWKS6kE3BeZC283HnFhqDibpNFsD9cqjUXtAAptYtiiCPDqh6RfzDwAst2iRZsWToFmZtQT8eNoHudNtCNoZ3XQTrDFqWKC5Uq4r3cnssQ9VpYxCfLxtr877JwjNvorhGkEedGcPEgEZkpqpaH4HkLpeb4CwPxrcni71zJ45u9mkbX4eQeY7g2RVX8B6w9f3ZV5dtQx2KwCtmbzPb4w1C67KTQGGkCx2eKRXwN7NuUa47duB7AFQykHQ6TsERnTBJuPn5BvWjVVg5gfBWBdB3Q7HrueKq7bqKwXERA2LBpmCLUUWC7CqM7Gj5dnLV2AStD5RQ9FMrL1BDphmx3eFzkzHAYWVtvRkSrbnuqiT5AMAq5S',
    unsigned:
      'NtQ88F2dE6w5kiZt8733mS9jUSKDe6P2ich2qDDe3M926Nc7EmSamHa35YL1Y6MDfvgth1MCjNyAutpn3SL4Wg7jDxFY8MuLiRY51zYJoQ3ycZGf1EjJP4tAAYJffucw4kS7pm9Xfdob8HSoh4SPGyhNkrbURZraWUuC66ykFVuUQ2qgWEgSC8jDdjQvnu7uzwHuAcSH95wnSNtUtrj2kvJn3Hhttu2g3J6oW8sqExo2TvWu5CnTApuTtPHeeXFR5pUNQrF1YbF8mq14qFu2cGdtVmEr6BXrQv5uTFCeZ78iKgrGtSqUQNLZqy',
  },
};

export const AMOUNT = '1000000000000000000000000';
