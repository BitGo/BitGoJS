import { RequestAddStake, RequestWithdrawStake } from '../../src/lib/iface';
import { DUMMY_SUI_GAS_PRICE } from '../../src/lib/constants';
import { Recipient } from '@bitgo/sdk-core';

export const AMOUNT = 100;

export const addresses = {
  validAddresses: [
    '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304',
    '0x77c3b5b21129793c4a5602220a4b970007c54d4a996de941e5b713719a42f8fe',
  ],
  invalidAddresses: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const sender = {
  address: '0x9882188ba3e8070a9bb06ae9446cf607914ee8ee58ed8306a3e3afff5a1bbb71',
  publicKey: 'AQIDBAUGBwgJAAECAwQFBgcICQABFwQFBk4BAgMEBQY=',
  signatureHex: '6JD68SxFyiEOdEVFHDuxEHtq9NO9zmC2glSJf/XswlY2yp7HWnmVT1sMNz2YTzmatIROKqsh8dAHkjoHd3cvDg==',
};

export const recipients: Recipient[] = [
  {
    address: addresses.validAddresses[0],
    amount: AMOUNT.toString(),
  },
  {
    address: addresses.validAddresses[1],
    amount: AMOUNT.toString(),
  },
];

export const gasPayment = {
  objectId: '0x27883af1cedf4b31b39bd4386ab48d0e74478579b8b2a03f72d61eae37c476f5',
  version: 32,
  digest: '99nxt9LtNZW4PxkGMVq2oCKAhrMr1ntU8yZirZNiPQNR',
};

export const coinsWithGasPayment = [
  {
    objectId: '0x57bedec931e87beebebd5a375fae5e969965dba710e3c8652814ab1750b9e301',
    version: 32,
    digest: '82LZWnJwxRpZPLyFvPdLWBTyEu9J5aEZQFrTva9QPLzJ',
  },
  {
    objectId: '0xa90fdca6a9b7e8363d5825fb41c0456fc85ab3f47ddf5bbc19f320c82acbc62a',
    version: 32,
    digest: 'EFcXPoBtcHKZK3NhBHULZASAu61aZb5ab9JCXKEb5eMC',
  },
  gasPayment,
];

export const coinsWithoutGasPayment = [
  {
    objectId: '0x57bedec931e87beebebd5a375fae5e969965dba710e3c8652814ab1750b9e301',
    version: 32,
    digest: '82LZWnJwxRpZPLyFvPdLWBTyEu9J5aEZQFrTva9QPLzJ',
  },
  {
    objectId: '0xa90fdca6a9b7e8363d5825fb41c0456fc85ab3f47ddf5bbc19f320c82acbc62a',
    version: 32,
    digest: 'EFcXPoBtcHKZK3NhBHULZASAu61aZb5ab9JCXKEb5eMC',
  },
];

export const GAS_BUDGET = 10000000;

export const gasData = {
  payment: coinsWithGasPayment,
  owner: sender.address,
  price: DUMMY_SUI_GAS_PRICE,
  budget: GAS_BUDGET,
};

export const gasDataWithoutGasPayment = {
  owner: sender.address,
  price: DUMMY_SUI_GAS_PRICE,
  budget: GAS_BUDGET,
};

export const invalidGasOwner = {
  owner: addresses.invalidAddresses[0],
  price: DUMMY_SUI_GAS_PRICE,
  budget: GAS_BUDGET,
};

export const invalidGasBudget = {
  owner: sender.address,
  price: DUMMY_SUI_GAS_PRICE,
  budget: -1,
};

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

export const TRANSFER =
  'AAAEAAhkAAAAAAAAAAAg+UGuPL5WRdzMFdqDRrUz9/kfICCJpVIWU8Bisv8QswQACGQAAAAAAAAAACB3w7WyESl5PEpWAiIKS5cAB8VNSplt6UHltxNxmkL4/gQCAAEBAAABAQIAAAEBAAIAAQECAAEBAgIAAQMAmIIYi6PoBwqbsGrpRGz2B5FO6O5Y7YMGo+Ov/1obu3EDV77eyTHoe+6+vVo3X65elpll26cQ48hlKBSrF1C54wEgAAAAAAAAACBoWYGqiuavMCUv2GwrPvNLd0D2AaDTQotdoUj5nj2eR6kP3Kapt+g2PVgl+0HARW/IWrP0fd9bvBnzIMgqy8YqIAAAAAAAAAAgxOY6f0nZPSkxTFoKXduBYv7z1a04aU8kk/f0SN7/uScniDrxzt9LMbOb1DhqtI0OdEeFebiyoD9y1h6uN8R29SAAAAAAAAAAIHkeHOqeAdLkLM8jGKOxs7QHn8qVjVkWykGi5qlc7Au2mIIYi6PoBwqbsGrpRGz2B5FO6O5Y7YMGo+Ov/1obu3HoAwAAAAAAAICWmAAAAAAAAA==';
export const TRANSFER_PAY_SUI_TX_WITH_GAS_PAYMENT_AND_IN_PAYTX =
  'AAUDNtbKCPIIFzKUTR5ba0BqSkYuObgDAAAAAAAAACC5SQ7eYyFSYsQ04D9gbZeZ87pwRSPO2hhLOG1Hqh/4HxEbikn2c3C8SljlALnmTLZGLjm4AgAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B8RG4pJ9nNwvEpY5QC55ky2VH7ptAMAAAAAAAAAIGS6H7Ly+9KTijUAFdYB9NuJzX6OI3DQ3ZrjrE9jXBWBAcQXOoBEBqNl5p37KX1OqvACVG69AWQAAAAAAAAAy6Ski7D4tYbBZ+Xc76ocXparPwg21soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfy6Ski7D4tYbBZ+Xc76ocXparPwgBAAAAAAAAAEBCDwAAAAAA';
export const TRANSFER_PAY_SUI_TX_WITH_GAS_PAYMENT_AND_NOT_IN_PAYTX =
  'AAUDNtbKCPIIFzKUTR5ba0BqSkYuObgDAAAAAAAAACC5SQ7eYyFSYsQ04D9gbZeZ87pwRSPO2hhLOG1Hqh/4HxEbikn2c3C8SljlALnmTLZUfum0AwAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYERG4pJ9nNwvEpY5QC55ky2Ri45uAIAAAAAAAAAIGS6H7Ly+9KTijUAFdYB9NuJzX6OI3DQ3ZrjrEeqH/gfAcQXOoBEBqNl5p37KX1OqvACVG69AWQAAAAAAAAAy6Ski7D4tYbBZ+Xc76ocXparPwg21soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfy6Ski7D4tYbBZ+Xc76ocXparPwgBAAAAAAAAAEBCDwAAAAAA';
export const TRANSFER_PAY_SUI_TX_WITHOUT_GAS_PAYMENT_AND_IN_PAYTX =
  'AAUDERuKSfZzcLxKWOUAueZMtlR+6bQDAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xPY1wVgREbikn2c3C8SljlALnmTLZGLjm4AgAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B821soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfAcQXOoBEBqNl5p37KX1OqvACVG69AWQAAAAAAAAAy6Ski7D4tYbBZ+Xc76ocXparPwgRG4pJ9nNwvEpY5QC55ky2VH7ptAMAAAAAAAAAIGS6H7Ly+9KTijUAFdYB9NuJzX6OI3DQ3ZrjrE9jXBWBy6Ski7D4tYbBZ+Xc76ocXparPwgBAAAAAAAAAEBCDwAAAAAA';
export const TRANSFER_PAY_SUI_TX_WITHOUT_GAS_PAYMENT_AND_NOT_IN_PAYTX =
  'AAUCERuKSfZzcLxKWOUAueZMtlR+6bQDAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xPY1wVgREbikn2c3C8SljlALnmTLZGLjm4AgAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B8BxBc6gEQGo2XmnfspfU6q8AJUbr0BZAAAAAAAAADLpKSLsPi1hsFn5dzvqhxelqs/CBEbikn2c3C8SljlALnmTLZUfum0AwAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYHLpKSLsPi1hsFn5dzvqhxelqs/CAEAAAAAAAAAQEIPAAAAAAA=';
export const TRANSFER_PAY_ALL_SUI_TX_WITH_GAS_PAYMENT_AND_IN_PAYTX =
  'AAYDNtbKCPIIFzKUTR5ba0BqSkYuObgDAAAAAAAAACC5SQ7eYyFSYsQ04D9gbZeZ87pwRSPO2hhLOG1Hqh/4HxEbikn2c3C8SljlALnmTLZGLjm4AgAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B8RG4pJ9nNwvEpY5QC55ky2VH7ptAMAAAAAAAAAIGS6H7Ly+9KTijUAFdYB9NuJzX6OI3DQ3ZrjrE9jXBWBxBc6gEQGo2XmnfspfU6q8AJUbr3LpKSLsPi1hsFn5dzvqhxelqs/CDbWygjyCBcylE0eW2tAakpGLjm4AwAAAAAAAAAguUkO3mMhUmLENOA/YG2XmfO6cEUjztoYSzhtR6of+B/LpKSLsPi1hsFn5dzvqhxelqs/CAEAAAAAAAAAQEIPAAAAAAA=';
export const TRANSFER_PAY_ALL_SUI_TX_WITH_GAS_PAYMENT_AND_NOT_IN_PAYTX =
  'AAYDNtbKCPIIFzKUTR5ba0BqSkYuObgDAAAAAAAAACC5SQ7eYyFSYsQ04D9gbZeZ87pwRSPO2hhLOG1Hqh/4HxEbikn2c3C8SljlALnmTLZUfum0AwAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYERG4pJ9nNwvEpY5QC55ky2Ri45uAIAAAAAAAAAIGS6H7Ly+9KTijUAFdYB9NuJzX6OI3DQ3ZrjrEeqH/gfxBc6gEQGo2XmnfspfU6q8AJUbr3LpKSLsPi1hsFn5dzvqhxelqs/CDbWygjyCBcylE0eW2tAakpGLjm4AwAAAAAAAAAguUkO3mMhUmLENOA/YG2XmfO6cEUjztoYSzhtR6of+B/LpKSLsPi1hsFn5dzvqhxelqs/CAEAAAAAAAAAQEIPAAAAAAA=';
export const TRANSFER_PAY_ALL_SUI_TX_WITHOUT_GAS_PAYMENT_AND_IN_PAYTX =
  'AAYDERuKSfZzcLxKWOUAueZMtlR+6bQDAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xPY1wVgREbikn2c3C8SljlALnmTLZGLjm4AgAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B821soI8ggXMpRNHltrQGpKRi45uAMAAAAAAAAAILlJDt5jIVJixDTgP2Btl5nzunBFI87aGEs4bUeqH/gfxBc6gEQGo2XmnfspfU6q8AJUbr3LpKSLsPi1hsFn5dzvqhxelqs/CBEbikn2c3C8SljlALnmTLZUfum0AwAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsT2NcFYHLpKSLsPi1hsFn5dzvqhxelqs/CAEAAAAAAAAAQEIPAAAAAAA=';
export const TRANSFER_PAY_ALL_SUI_TX_WITHOUT_GAS_PAYMENT_AND_NOT_IN_PAYTX =
  'AAYCERuKSfZzcLxKWOUAueZMtlR+6bQDAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xPY1wVgREbikn2c3C8SljlALnmTLZGLjm4AgAAAAAAAAAgZLofsvL70pOKNQAV1gH024nNfo4jcNDdmuOsR6of+B/EFzqARAajZead+yl9TqrwAlRuvcukpIuw+LWGwWfl3O+qHF6Wqz8IERuKSfZzcLxKWOUAueZMtlR+6bQDAAAAAAAAACBkuh+y8vvSk4o1ABXWAfTbic1+jiNw0N2a46xPY1wVgcukpIuw+LWGwWfl3O+qHF6Wqz8IAQAAAAAAAABAQg8AAAAAAA==';

export const INVALID_RAW_TX =
  'AAAAAAAAAAAAA6e7361637469bc4a58e500b9e64cb6547ee9b403000000000000002064ba1fb2f2fbd2938a350015d601f4db89cd7e8e2370d0dd9ae3ac4f635c1581111b8a49f67370bc4a58e500b9e64cb6462e39b802000000000000002064ba1fb2f2fbd2938a350015d601f4db89cd7e8e2370d0dd9ae3ac47aa1ff81f01c4173a804406a365e69dfb297d4eaaf002546ebd016400000000000000cba4a48bb0f8b586c167e5dcefaa1c5e96ab3f0836d6ca08f2081732944d1e5b6b406a4a462e39b8030000000000000020b9490ede63215262c434e03f606d9799f3ba704523ceda184b386d47aa1ff81f01000000000000006400000000000000';

export const ADD_DELEGATION_TX_ONE_COIN =
  'AAIAAAAAAAAAAAAAAAAAAAAAAAAAAgpzdWlfc3lzdGVtH3JlcXVlc3RfYWRkX2RlbGVnYXRpb25fbXVsX2NvaW4ABAEBAAAAAAAAAAAAAAAAAAAAAAAAAAUBAAAAAAAAAAECAQDTiq7aB1asDqCPK7kyHRSTrtVF5V1tDwAAAAAAIHidqPrFPCfbpmnfwHyKAAQxocdntavB7iy1a78tf/4EAAkBAC0xAQAAAAAAFF0G83ZU8RzdJxeQiPz+raqyHhPvj6UdQ6pFKizuLBUEF9HD3i2ydy00DUx6Imb68sxm/W0MxgXvrv3Nd11tDwAAAAAAIJaT9hMNZoKfDzZm+4C1JUX/NDraziXrSPLnxhCJMhLxj6UdQ6pFKizuLBUEF9HD3i2ydy0BAAAAAAAAAEBCDwAAAAAA';

export const ADD_DELEGATION_TX_MUL_COIN =
  'AAIAAAAAAAAAAAAAAAAAAAAAAAAAAgpzdWlfc3lzdGVtH3JlcXVlc3RfYWRkX2RlbGVnYXRpb25fbXVsX2NvaW4ABAEBAAAAAAAAAAAAAAAAAAAAAAAAAAUBAAAAAAAAAAECAgDTiq7aB1asDqCPK7kyHRSTrtVF5V1tDwAAAAAAIHidqPrFPCfbpmnfwHyKAAQxocdntavB7iy1a78tf/4EAIYZ4Z03FdoQNOYFLPCBuoo9NlZWRAEAAAAAAAAgvZpDYupjbwsZBv78wubrruzfPUHubK8mmRftdmo4VhIACQEALTEBAAAAAAAUXQbzdlTxHN0nF5CI/P6tqrIeE++PpR1DqkUqLO4sFQQX0cPeLbJ3LTQNTHoiZvryzGb9bQzGBe+u/c13XW0PAAAAAAAglpP2Ew1mgp8PNmb7gLUlRf80OtrOJetI8ufGEIkyEvGPpR1DqkUqLO4sFQQX0cPeLbJ3LQEAAAAAAAAAQEIPAAAAAAA=';

export const WITHDRAW_DELEGATION_TX =
  'AAIAAAAAAAAAAAAAAAAAAAAAAAAAAgpzdWlfc3lzdGVtG3JlcXVlc3Rfd2l0aGRyYXdfZGVsZWdhdGlvbgADAQEAAAAAAAAAAAAAAAAAAAAAAAAABQEAAAAAAAAAAQEARAM3T3R0zR5VpiJwWH/tIBPS4kki8wgAAAAAACAgQBQ78f1HVQ9gqo71dbAMMQYofSkctz9h707a0YMHiQEACqyOuB212d+hSaFJV+YpFeQie8QVnQgAAAAAACBSeVp0b2dxLIM1Nb3AyB2yDY4bPUmE+fkpyU0gB24snY+lHUOqRSos7iwVBBfRw94tsnctNA1MeiJm+vLMZv1tDMYF7679zXddbQ8AAAAAACCWk/YTDWaCnw82ZvuAtSVF/zQ62s4l60jy58YQiTIS8Y+lHUOqRSos7iwVBBfRw94tsnctAQAAAAAAAABAQg8AAAAAAA==';

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

export const STAKING_GAS_BUDGET = 1000000;

export const STAKING_AMOUNT = 20000000;

export const STAKING_SENDER_ADDRESS = '0x8fa51d43aa452a2cee2c150417d1c3de2db2772d';

export const coinToStakeOne = {
  objectId: '0xd38aaeda0756ac0ea08f2bb9321d1493aed545e5',
  version: 1011037,
  digest: 'eJ2o+sU8J9umad/AfIoABDGhx2e1q8HuLLVrvy1//gQ=',
};

export const coinToStakeTwo = {
  objectId: '0x8619e19d3715da1034e6052cf081ba8a3d365656',
  version: 324,
  digest: 'vZpDYupjbwsZBv78wubrruzfPUHubK8mmRftdmo4VhI=',
};

export const stakingGasPayment = {
  objectId: '0x340d4c7a2266faf2cc66fd6d0cc605efaefdcd77',
  version: 1011037,
  digest: 'lpP2Ew1mgp8PNmb7gLUlRf80OtrOJetI8ufGEIkyEvE=',
};

export const stakingGasData = {
  payment: stakingGasPayment,
  owner: STAKING_SENDER_ADDRESS,
  price: DUMMY_SUI_GAS_PRICE,
  budget: STAKING_GAS_BUDGET,
};

export const stakingGasDataWithoutGasPayment = {
  owner: STAKING_SENDER_ADDRESS,
  price: DUMMY_SUI_GAS_PRICE,
  budget: STAKING_GAS_BUDGET,
};

export const VALIDATOR_ADDRESS = '0x5d06f37654f11cdd27179088fcfeadaab21e13ef';
export const NEW_VALIDATOR_ADDRESS = '0x48f9c8662045805d9d98faf3e8d58d6251718a22';

export const requestAddDelegationTxOneCoin: RequestAddStake = {
  coins: [coinToStakeOne],
  amount: STAKING_AMOUNT,
  validatorAddress: VALIDATOR_ADDRESS,
};

export const requestAddDelegationTxMultipleCoins: RequestAddStake = {
  coins: [coinToStakeOne, coinToStakeTwo],
  amount: STAKING_AMOUNT,
  validatorAddress: VALIDATOR_ADDRESS,
};

export const requestWithdrawDelegation: RequestWithdrawStake = {
  stakedSuiObjectId: {
    objectId: '0x0aac8eb81db5d9dfa149a14957e62915e4227bc4',
    version: 564501,
    digest: 'UnladG9ncSyDNTW9wMgdsg2OGz1JhPn5KclNIAduLJ0=',
  },
  amount: STAKING_AMOUNT,
};
