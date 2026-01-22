/**
 * Kava test data for the sdk-coin-cosmos module
 * This file extends the base configuration with kava-specific data
 */

import { generateCoinData } from '../testUtils';

export const chainConfig = {
  mainnetName: 'Kava',
  mainnetCoin: 'kava',
  testnetName: 'Testnet Kava',
  testnetCoin: 'tkava',
  family: 'kava',
  decimalPlaces: 6,
  baseDenom: 'ukava',
  chainId: 'kava_2221-16000',
  addressPrefix: 'kava',
  validatorPrefix: 'kavavaloper',
};

export const DEFAULTS = {
  senderAddress: 'kava1cyyzpxplxdzkeea7kwsydadg87357qnarn3sk9',
  pubKey: 'AuwYyCUBxQiBGSUWebU46c+OrlApVsyGLHd4qhSDZeiG',
  privateKey: 'SNI8xBejBnTpB6JAPxCfCC2S4ZeCPQLmpCPGrrjkEgQ=',
  recipientAddress1: 'kava18s5lynnmx37hq4wlrw9gdn68sg2uxp5rucdhve',
  recipientAddress2: 'kava1c6mj5v5wpjl6zs7lz0l6dlv3r4ccqaa4grcurq',
  sendMessageTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
  sendAmount: '1000',
  feeAmount: '5000',
  gasLimit: 200000,
  validatorAddress1: 'kavavaloper1q8mgs55hfgkm7d5rret439997x87s2ek5szwp9',
  validatorAddress2: 'kavavaloper1ea4hlqfskjvn0ldenw8gv7jjdzrljcchpdgx6k',
};

export const TEST_SEND_TX = {
  hash: 'EC11A7FD316965E5B8D9CA37EF983C7E20181B77B1FFD829D44C718BA55F0301',
  signature: 'OnBWLyOUqNqX7h65Dtfna4W1vU4+OEVZPZLOffO+amNnHHwoFQZMnVK1+s4Y5/arizHXdbFTtrIG1ANWJz94zw==',
  signedTxBase64:
    'CowBCokBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmkKK2thdmExY3l5enB4cGx4ZHprZWVhN2t3c3lkYWRnODczNTdxbmFybjNzazkSK2thdmExOHM1bHlubm14MzdocTR3bHJ3OWdkbjY4c2cydXhwNXJ1Y2RodmUaDQoFdWthdmESBDEwMDASZwpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAuwYyCUBxQiBGSUWebU46c+OrlApVsyGLHd4qhSDZeiGEgQKAggBGBQSEwoNCgV1a2F2YRIENTAwMBDAmgwaQDpwVi8jlKjal+4euQ7X52uFtb1OPjhFWT2Szn3zvmpjZxx8KBUGTJ1StfrOGOf2q4sx13WxU7ayBtQDVic/eM8=',
  accountNumber: 182114,
  sequence: 20,
  sendAmount: '1000',
};

export const TEST_SEND_TX2 = {
  hash: 'CECA35F4E76012EFB04BD069EAE2F791436354897A7078F554F5E80C559FA567',
  signature: 'nCRo4QhtTTldC+bQadH6Dqplm8s9UuRtXVmQqvVriKkWFGlO/n70VvbB+YuQ8sYc1q06AapkWpt/mD4HQbgG3w==',
  signedTxBase64:
    'CokBCoYBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmYKK2thdmExY3l5enB4cGx4ZHprZWVhN2t3c3lkYWRnODczNTdxbmFybjNzazkSK2thdmExOHM1bHlubm14MzdocTR3bHJ3OWdkbjY4c2cydXhwNXJ1Y2RodmUaCgoFdWthdmESATESZwpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAuwYyCUBxQiBGSUWebU46c+OrlApVsyGLHd4qhSDZeiGEgQKAggBGBQSEwoNCgV1a2F2YRIENTAwMBDAmgwaQJwkaOEIbU05XQvm0GnR+g6qZZvLPVLkbV1ZkKr1a4ipFhRpTv5+9Fb2wfmLkPLGHNatOgGqZFqbf5g+B0G4Bt8=',
  accountNumber: 182114,
  sequence: 20,
  sendAmount: '1',
};

export const TEST_SEND_MANY_TX = {
  hash: '681EE332D9590DCB76A32BE7172E5B9574EFA49DAB8001CEDDED65A8BEECAE01',
  signature: 'Opz+KYGr/pjC+iaYytf4PqRcgvFxQ3Lf0+1o3pGub0xlA6QbkySn7WS+c06rx4f27DTjHrhNflvCdhXmTCHulQ==',
  signedTxBase64:
    'CpICCoYBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmYKK2thdmExY3l5enB4cGx4ZHprZWVhN2t3c3lkYWRnODczNTdxbmFybjNzazkSK2thdmExOHM1bHlubm14MzdocTR3bHJ3OWdkbjY4c2cydXhwNXJ1Y2RodmUaCgoFdWthdmESATEKhgEKHC9jb3Ntb3MuYmFuay52MWJldGExLk1zZ1NlbmQSZgora2F2YTFjeXl6cHhwbHhkemtlZWE3a3dzeWRhZGc4NzM1N3FuYXJuM3NrORIra2F2YTFjNm1qNXY1d3BqbDZ6czdsejBsNmRsdjNyNGNjcWFhNGdyY3VycRoKCgV1a2F2YRIBMhJnClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC7BjIJQHFCIEZJRZ5tTjpz46uUClWzIYsd3iqFINl6IYSBAoCCAEYFBITCg0KBXVrYXZhEgQ1MDAwEMCaDBpAOpz+KYGr/pjC+iaYytf4PqRcgvFxQ3Lf0+1o3pGub0xlA6QbkySn7WS+c06rx4f27DTjHrhNflvCdhXmTCHulQ==',
  accountNumber: 182114,
  sequence: 20,
  sendAmount: '1',
  sendAmount2: '2',
  recipient2: 'kava1c6mj5v5wpjl6zs7lz0l6dlv3r4ccqaa4grcurq',
};

export const TEST_TX_WITH_MEMO = {
  hash: '09E5B56E645BE62C37791E1FF78CADFD35F1FC426F6CD5A3D7506D432BD270BB',
  signature: '5g4qRY2kii/w1vXRXbuGGOTbDZ9Ne+MeWyPNAXyNOvUM1hbhYGIVz0xI+J10B+Ugw/GqSSB6W1lxbzvAy/mQBg==',
  signedTxBase64:
    'CqcBCogBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmgKK2thdmExY3l5enB4cGx4ZHprZWVhN2t3c3lkYWRnODczNTdxbmFybjNzazkSK2thdmExOHM1bHlubm14MzdocTR3bHJ3OWdkbjY4c2cydXhwNXJ1Y2RodmUaDAoFdWthdmESAzUwMBIaVGVzdDEyM0FscGhhbnVtZXJpY01lbW80NTYSZwpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAuwYyCUBxQiBGSUWebU46c+OrlApVsyGLHd4qhSDZeiGEgQKAggBGBQSEwoNCgV1a2F2YRIENTAwMBDAmgwaQOYOKkWNpIov8Nb10V27hhjk2w2fTXvjHlsjzQF8jTr1DNYW4WBiFc9MSPiddAflIMPxqkkgeltZcW87wMv5kAY=',
  accountNumber: 182114,
  sequence: 20,
  sendAmount: '500',
  memo: 'Test123AlphanumericMemo456',
};

export const blockHashes = {
  hash1: 'E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6',
  hash2: 'F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1',
};

// Generate the complete kava test data
export const kava = generateCoinData(chainConfig, DEFAULTS, blockHashes, {
  TEST_SEND_TX,
  TEST_SEND_TX2,
  TEST_SEND_MANY_TX,
  TEST_TX_WITH_MEMO,
});

export default kava;
