export const accounts = {
  account1: {
    secretKey: '874578010603af8e93b44bfc1d13b32830d0dbca6c89f28ccdc662afd3cdc824',
    publicKey: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
    publicKeyBase58: 'ed25519:7aMa9bTKziRzGACadUGwSLi6BRjtQQzHJPyzQrpZvj4G',
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
    address6: '',
  },
  default: {
    secretKey: '0000000000000000000000000000000000000000000000000000000000000000',
    publicKey: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
    address: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
  },
};

export const validatorContractAddress = 'lavenderfive.pool.f863973.m0';

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
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAAEAAAAA5ZjdiMDY3NWRiNTlkMTliNGJkOWM4YzcyZWFhYmJhNzVhOTg2M2QwMmIzMDExNWI4YjNjM2NhNWMyMGYwMjU0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAwAAAKHtzM4bwtMAAAAAAAAALgvCvIZFLIk8jb7g2teJf2WTnHWP083jtcT/uhgQCCPRc54P9xXwoXk35ePppQwS7bRMOTsl6mpIFWq75NUWCQ==',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAAEAAAAA5ZjdiMDY3NWRiNTlkMTliNGJkOWM4YzcyZWFhYmJhNzVhOTg2M2QwMmIzMDExNWI4YjNjM2NhNWMyMGYwMjU0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAwAAAKHtzM4bwtMAAAAAAAA=',
    signedHex:
      '40000000363162313863366463303264646361626465616335366362346632316139373163633431636339373634306636663835623037333438303030386335336130640061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d01000000000000004000000039663762303637356462353964313962346264396338633732656161626261373561393836336430326233303131356238623363336361356332306630323534a6934bd34fe3f0b2d16fe75083a75ae7df5fa7d5d766caf7432c4be1a28d26600100000003000000a1edccce1bc2d3000000000000002e0bc2bc86452c893c8dbee0dad7897f65939c758fd3cde3b5c4ffba18100823d1739e0ff715f0a17937e5e3e9a50c12edb44c393b25ea6a48156abbe4d51609',
    unsignedHex:
      '40000000363162313863366463303264646361626465616335366362346632316139373163633431636339373634306636663835623037333438303030386335336130640061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d01000000000000004000000039663762303637356462353964313962346264396338633732656161626261373561393836336430326233303131356238623363336361356332306630323534a6934bd34fe3f0b2d16fe75083a75ae7df5fa7d5d766caf7432c4be1a28d26600100000003000000a1edccce1bc2d3000000000000',
  },
  stakingActivate: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABwAAABsYXZlbmRlcmZpdmUucG9vbC5mODYzOTczLm0wppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAhEAAABkZXBvc2l0X2FuZF9zdGFrZQIAAAB7fQDQmNSvcQAAQEIPAAAAAAAAAAAAAAAAAADaTuzLDeNNux7YmqEETM+9BYcqpVBrOj6pAFmVkSeJ3+DpfhWD+TcA/u5de5B+fL75jMcUgRxI6BIcOwWwwCUF',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABwAAABsYXZlbmRlcmZpdmUucG9vbC5mODYzOTczLm0wppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAhEAAABkZXBvc2l0X2FuZF9zdGFrZQIAAAB7fQDQmNSvcQAAQEIPAAAAAAAAAAAAAAAAAA==',
  },
  stakingDeactivate: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABwAAABsYXZlbmRlcmZpdmUucG9vbC5mODYzOTczLm0wppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAgcAAAB1bnN0YWtlFAAAAHsiYW1vdW50IjoiMTAwMDAwMCJ9ANCY1K9xAAAAAAAAAAAAAAAAAAAAAAAAAK0AJ/A4D+Yd/0ZDKl+O5SGuGZrfx0JI0cUKYuS3IVL0NJJ+nT+E1/9iojjGL+16uFii6DUPEa/NhSwhALTRDgg=',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABwAAABsYXZlbmRlcmZpdmUucG9vbC5mODYzOTczLm0wppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAgcAAAB1bnN0YWtlFAAAAHsiYW1vdW50IjoiMTAwMDAwMCJ9ANCY1K9xAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  stakingWithdraw: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABwAAABsYXZlbmRlcmZpdmUucG9vbC5mODYzOTczLm0wppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAggAAAB3aXRoZHJhdxQAAAB7ImFtb3VudCI6IjEwMDAwMDAifQDQmNSvcQAAAAAAAAAAAAAAAAAAAAAAAABQ4cg+ZujnimeWGwINQCgV1zReeNTViTSogajLocNy4H3dxAJO0KrW+WAhGmM/dtCjVvWddAaxByRB/f+023sN',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABwAAABsYXZlbmRlcmZpdmUucG9vbC5mODYzOTczLm0wppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAggAAAB3aXRoZHJhdxQAAAB7ImFtb3VudCI6IjEwMDAwMDAifQDQmNSvcQAAAAAAAAAAAAAAAAAAAAAAAA==',
  },
  fungibleTokenTransfer: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAgsAAABmdF90cmFuc2Zlcm8AAAB7InJlY2VpdmVyX2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCIsImFtb3VudCI6IjEwMCIsIm1lbW8iOiJ0ZXN0In0A0JjUr3EAAAEAAAAAAAAAAAAAAAAAAAAAgaGrAZpNgVyjRUgas5GcjmEJyC/SROgXQk3AHW1mpO6yjzV3ElsM2pcxFfflvTi3oDQSFFh1ScVbkmya4QEaDA==',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAgsAAABmdF90cmFuc2Zlcm8AAAB7InJlY2VpdmVyX2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCIsImFtb3VudCI6IjEwMCIsIm1lbW8iOiJ0ZXN0In0A0JjUr3EAAAEAAAAAAAAAAAAAAAAAAAA=',
  },
  fungibleTokenTransferWithStorageDeposit: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmACAAAAAg8AAABzdG9yYWdlX2RlcG9zaXRRAAAAeyJhY2NvdW50X2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCJ9ANCY1K9xAAAAAEhWNxk8w0MAAAAAAAAAAgsAAABmdF90cmFuc2Zlcm8AAAB7InJlY2VpdmVyX2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCIsImFtb3VudCI6IjEwMCIsIm1lbW8iOiJ0ZXN0In0A0JjUr3EAAAEAAAAAAAAAAAAAAAAAAAAAZrNr09FzkuyOL31vzY7AgLbkIGn1DkoQ4TkljJFrMk6zBP/eC9qzRl4sWhbwR6WbUDoA3DYPApkW5wwCG07CAw==',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmACAAAAAg8AAABzdG9yYWdlX2RlcG9zaXRRAAAAeyJhY2NvdW50X2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCJ9ANCY1K9xAAAAAEhWNxk8w0MAAAAAAAAAAgsAAABmdF90cmFuc2Zlcm8AAAB7InJlY2VpdmVyX2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCIsImFtb3VudCI6IjEwMCIsIm1lbW8iOiJ0ZXN0In0A0JjUr3EAAAEAAAAAAAAAAAAAAAAAAAA=',
  },
  fungibleTokenTransferWithSelfStorageDeposit: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmACAAAAAg8AAABzdG9yYWdlX2RlcG9zaXQCAAAAe30A0JjUr3EAAAAASFY3GTzDQwAAAAAAAAACCwAAAGZ0X3RyYW5zZmVybwAAAHsicmVjZWl2ZXJfaWQiOiI5ZjdiMDY3NWRiNTlkMTliNGJkOWM4YzcyZWFhYmJhNzVhOTg2M2QwMmIzMDExNWI4YjNjM2NhNWMyMGYwMjU0IiwiYW1vdW50IjoiMTAwIiwibWVtbyI6InRlc3QifQDQmNSvcQAAAQAAAAAAAAAAAAAAAAAAAADSMrQ6WXa5kQmbCXifpMwCf+umrU4ckIHRrFJYLUQkCrnu3PXB10ehMmej1eGBIs3Jbu3PWl+CTRFfgAJk2FUC',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmACAAAAAg8AAABzdG9yYWdlX2RlcG9zaXQCAAAAe30A0JjUr3EAAAAASFY3GTzDQwAAAAAAAAACCwAAAGZ0X3RyYW5zZmVybwAAAHsicmVjZWl2ZXJfaWQiOiI5ZjdiMDY3NWRiNTlkMTliNGJkOWM4YzcyZWFhYmJhNzVhOTg2M2QwMmIzMDExNWI4YjNjM2NhNWMyMGYwMjU0IiwiYW1vdW50IjoiMTAwIiwibWVtbyI6InRlc3QifQDQmNSvcQAAAQAAAAAAAAAAAAAAAAAAAA==',
  },
  selfStorageDeposit: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAg8AAABzdG9yYWdlX2RlcG9zaXQCAAAAe30A0JjUr3EAAAAASFY3GTzDQwAAAAAAAAAAqH6xLHXPvsld56HLmtj16VGVHtxSY3TSUyVKpKOy2IBgRr4A2c7eyo8l/v6/KfXS3bOIFrIPX/zWw4qqaL7mAw==',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAg8AAABzdG9yYWdlX2RlcG9zaXQCAAAAe30A0JjUr3EAAAAASFY3GTzDQwAAAAAAAAA=',
  },
  storageDeposit: {
    signed:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAg8AAABzdG9yYWdlX2RlcG9zaXRRAAAAeyJhY2NvdW50X2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCJ9ANCY1K9xAAAAAEhWNxk8w0MAAAAAAAAAAHdbWPSf9BSFVxv1j5g4JdnRxPXuz7UFNAttCDM7KzwH0UW0uUvBsRd4OikOUQD+RSocvwstCGh2kwNc738xSgs=',
    unsigned:
      'QAAAADYxYjE4YzZkYzAyZGRjYWJkZWFjNTZjYjRmMjFhOTcxY2M0MWNjOTc2NDBmNmY4NWIwNzM0ODAwMDhjNTNhMGQAYbGMbcAt3KverFbLTyGpccxBzJdkD2+FsHNIAAjFOg0BAAAAAAAAABMAAABmdC10bmVwMjRkcC50ZXN0bmV0ppNL00/j8LLRb+dQg6da599fp9XXZsr3QyxL4aKNJmABAAAAAg8AAABzdG9yYWdlX2RlcG9zaXRRAAAAeyJhY2NvdW50X2lkIjoiOWY3YjA2NzVkYjU5ZDE5YjRiZDljOGM3MmVhYWJiYTc1YTk4NjNkMDJiMzAxMTViOGIzYzNjYTVjMjBmMDI1NCJ9ANCY1K9xAAAAAEhWNxk8w0MAAAAAAAAA',
  },
};

export const AMOUNT = '1000000000000000000000000';
