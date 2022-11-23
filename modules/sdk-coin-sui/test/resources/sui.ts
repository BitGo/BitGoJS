export const addresses = {
  validAddresses: [
    '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08',
    '0xc4173a804406a365e69dfb297d4eaaf002546ebd',
    '0x111b8a49f67370bc4a58e500b9e64cb6547ee9b4',
  ],
  invalidAddresses: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const sender = {
  address: addresses.validAddresses[0],
  publicKey: 'ISHc0JgGmuU1aX3QGc/YZ3ynq6CtrB0ZWcvObcVLElk=',
  signatureHex: '6JD68SxFyiEOdEVFHDuxEHtq9NO9zmC2glSJf/XswlY2yp7HWnmVT1sMNz2YTzmatIROKqsh8dAHkjoHd3cvDg==',
};

export const recipients = [addresses.validAddresses[1]];

export const gasPayment = {
  objectId: '0x36d6ca08f2081732944d1e5b6b406a4a462e39b8',
  version: 3,
  digest: 'uUkO3mMhUmLENOA/YG2XmfO6cEUjztoYSzhtR6of+B8=',
};

export const coinsWithGasPayment = [
  {
    objectId: '0x111b8a49f67370bc4a58e500b9e64cb6547ee9b4',
    version: 3,
    digest: 'ZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYE=',
  },
  {
    objectId: '0x111b8a49f67370bc4a58e500b9e64cb6462e39b8',
    version: 2,
    digest: 'ZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B8=',
  },
  gasPayment,
];

export const coinsWithoutGasPayment = [
  {
    objectId: '0x111b8a49f67370bc4a58e500b9e64cb6547ee9b4',
    version: 3,
    digest: 'ZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYE=',
  },
  {
    objectId: '0x111b8a49f67370bc4a58e500b9e64cb6462e39b8',
    version: 2,
    digest: 'ZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B8=',
  },
];

export const GAS_BUDGET = 120;

export const AMOUNT = 100;

export const payTxWithGasPayment = {
  coins: coinsWithGasPayment,
  recipients,
  amounts: [AMOUNT],
};

export const payTxWithoutGasPayment = {
  coins: coinsWithoutGasPayment,
  recipients,
  amounts: [AMOUNT],
};

export const txIds = {
  id1: 'rAraxzR2QeTU/bULpEUWjv+oCY/8YnHS9Oc/IhkoaCM=',
};

export const TRANSFER_PAY_TX =
  'VHJhbnNhY3Rpb25EYXRhOjoABAIRG4pJ9nNwvEpY5QC55ky2VH7ptAMAAAAAAAAAIGS6H7Ly+9KTijUAFdYB9NuJzX6OI3DQ3ZrjrE9jXBWBERuKSfZzcLxKWOUAueZMtkYuObgCAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xHqh/4HwHEFzqARAajZead+yl9TqrwAlRuvQFkAAAAAAAAAMukpIuw+LWGwWfl3O+qHF6Wqz8INtbKCPIIFzKUTR5ba0BqSkYuObgDAAAAAAAAACC5SQ7eYyFSYsQ04D9gbZeZ87pwRSPO2hhLOG1Hqh/4HwEAAAAAAAAAeAAAAAAAAAA=';
export const TRANSFER_PAY_SUI_TX =
  'VHJhbnNhY3Rpb25EYXRhOjoABQM21soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfERuKSfZzcLxKWOUAueZMtkYuObgCAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xHqh/4HxEbikn2c3C8SljlALnmTLZUfum0AwAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYEBxBc6gEQGo2XmnfspfU6q8AJUbr0BZAAAAAAAAADLpKSLsPi1hsFn5dzvqhxelqs/CDbWygjyCBcylE0eW2tAakpGLjm4AwAAAAAAAAAguUkO3mMhUmLENOA/YG2XmfO6cEUjztoYSzhtR6of+B8BAAAAAAAAAHgAAAAAAAAA';
export const TRANSFER_PAY_ALL_SUI_TX =
  'VHJhbnNhY3Rpb25EYXRhOjoABgM21soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfERuKSfZzcLxKWOUAueZMtkYuObgCAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xHqh/4HxEbikn2c3C8SljlALnmTLZUfum0AwAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYHEFzqARAajZead+yl9TqrwAlRuvWQAAAAAAAAAy6Ski7D4tYbBZ+Xc76ocXparPwg21soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfAQAAAAAAAAB4AAAAAAAAAA==';

export const INVALID_RAW_TX =
  'AAAAAAAAAAAAA6e73616374696f6e446174613a3a02111b8a49f67370bc4a58e500b9e64cb6547ee9b403000000000000002064ba1fb2f2fbd2938a350015d601f4db89cd7e8e2370d0dd9ae3ac4f635c1581111b8a49f67370bc4a58e500b9e64cb6462e39b802000000000000002064ba1fb2f2fbd2938a350015d601f4db89cd7e8e2370d0dd9ae3ac47aa1ff81f01c4173a804406a365e69dfb297d4eaaf002546ebd016400000000000000cba4a48bb0f8b586c167e5dcefaa1c5e96ab3f0836d6ca08f2081732944d1e5b6b406a4a462e39b8030000000000000020b9490ede63215262c434e03f606d9799f3ba704523ceda184b386d47aa1ff81f01000000000000006400000000000000';

export const invalidPayTxs = [
  {
    coins: [
      {
        objectId: '',
        version: -1,
        digest: '',
      },
    ],
    recipients,
    amounts: [AMOUNT],
  },
  {
    coins: coinsWithGasPayment,
    recipients: [addresses.invalidAddresses[0]],
    amounts: [AMOUNT],
  },
  {
    coins: coinsWithGasPayment,
    recipients: addresses.invalidAddresses,
    amounts: [AMOUNT],
  },
  {
    coins: coinsWithGasPayment,
    recipients,
    amounts: [0],
  },
];
