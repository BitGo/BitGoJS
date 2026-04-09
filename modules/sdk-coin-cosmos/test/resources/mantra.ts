/**
 * Mantra test data for the sdk-coin-cosmos module
 * This file extends the base configuration with mantra-specific data
 */

import { generateCoinData } from '../testUtils';

export const chainConfig = {
  mainnetName: 'Mantra',
  mainnetCoin: 'mantra',
  testnetName: 'Testnet Mantra',
  testnetCoin: 'tmantra',
  family: 'mantra',
  decimalPlaces: 6,
  baseDenom: 'uom',
  chainId: 'mantra-dukong-1',
  addressPrefix: 'mantra',
  validatorPrefix: 'mantravaloper',
};

export const DEFAULTS = {
  senderAddress: 'mantra1cyyzpxplxdzkeea7kwsydadg87357qna5d0frc',
  pubKey: 'AuwYyCUBxQiBGSUWebU46c+OrlApVsyGLHd4qhSDZeiG',
  privateKey: 'SNI8xBejBnTpB6JAPxCfCC2S4ZeCPQLmpCPGrrjkEgQ=',
  recipientAddress1: 'mantra18s5lynnmx37hq4wlrw9gdn68sg2uxp5rtxnwey',
  recipientAddress2: 'mantra1c6mj5v5wpjl6zs7lz0l6dlv3r4ccqaa4lax9ka',
  sendMessageTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
  sendAmount: '1000',
  feeAmount: '8000',
  gasLimit: 200000,
  validatorAddress1: 'mantravaloper1q8mgs55hfgkm7d5rret439997x87s2ek2r83q2',
  validatorAddress2: 'mantravaloper1ea4hlqfskjvn0ldenw8gv7jjdzrljcchl7deme',
};

export const TEST_SEND_TX = {
  hash: '3926020FD54D0D70BF0979CE9B2495AAF28E7B91C05270B54F670613A72CAA60',
  signature: 'zCJ6BW0ykPUjw+ElOIo53ZMw5cBMrRMyAnKCB0jjSyd4eH2bOFvliBpcKD9POeoxFM0NkraPwx5sAUitO8aqdg==',
  signedTxBase64:
    'Co4BCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKLW1hbnRyYTFjeXl6cHhwbHhkemtlZWE3a3dzeWRhZGc4NzM1N3FuYTVkMGZyYxItbWFudHJhMThzNWx5bm5teDM3aHE0d2xydzlnZG42OHNnMnV4cDVydHhud2V5GgsKA3VvbRIEMTAwMBJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC7BjIJQHFCIEZJRZ5tTjpz46uUClWzIYsd3iqFINl6IYSBAoCCAEYNRIRCgsKA3VvbRIEODAwMBDAmgwaQMwiegVtMpD1I8PhJTiKOd2TMOXATK0TMgJyggdI40sneHh9mzhb5YgaXCg/TznqMRTNDZK2j8MebAFIrTvGqnY=',
  accountNumber: 53,
  sequence: 53,
  sendAmount: '1000',
};

export const TEST_SEND_TX2 = {
  hash: '2D8B81526D385C5C602DE5E3F16E16733EFD40113C39CA1FEDA5E9213AEF6B52',
  signature: 'Ilon2DaoiCJdDGLcWI1rO35iGrlZsClshzwAmnmTfdhWB3rV27gKSH+1cPVYtSE6dT5iqA4qnOMC75mRtgdMFA==',
  signedTxBase64:
    'CosBCogBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmgKLW1hbnRyYTFjeXl6cHhwbHhkemtlZWE3a3dzeWRhZGc4NzM1N3FuYTVkMGZyYxItbWFudHJhMThzNWx5bm5teDM3aHE0d2xydzlnZG42OHNnMnV4cDVydHhud2V5GggKA3VvbRIBMRJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC7BjIJQHFCIEZJRZ5tTjpz46uUClWzIYsd3iqFINl6IYSBAoCCAEYOhIRCgsKA3VvbRIEODAwMBDAmgwaQCJaJ9g2qIgiXQxi3FiNazt+Yhq5WbApbIc8AJp5k33YVgd61du4Ckh/tXD1WLUhOnU+YqgOKpzjAu+ZkbYHTBQ=',
  accountNumber: 58,
  sequence: 58,
  sendAmount: '1',
};

export const TEST_SEND_MANY_TX = {
  hash: 'C46D043ECA9D2EE99751F50C7583D39D91B0F8FDF48BCE2B78F092B281A1B847',
  signature: '2QHmgov/0C6fl1HVPz+UEmcJthMvrqB2bAH0NfNJl/orjmAxdB67uhVhBZxqSWhxzI+va1htT+LNUbtxeV9I1Q==',
  signedTxBase64:
    'CpkCCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKLW1hbnRyYTFjeXl6cHhwbHhkemtlZWE3a3dzeWRhZGc4NzM1N3FuYTVkMGZyYxItbWFudHJhMThzNWx5bm5teDM3aHE0d2xydzlnZG42OHNnMnV4cDVydHhud2V5GgsKA3VvbRIEMTAwMAqIAQocL2Nvc21vcy5iYW5rLnYxYmV0YTEuTXNnU2VuZBJoCi1tYW50cmExY3l5enB4cGx4ZHprZWVhN2t3c3lkYWRnODczNTdxbmE1ZDBmcmMSLW1hbnRyYTE4czVseW5ubXgzN2hxNHdscnc5Z2RuNjhzZzJ1eHA1cnR4bndleRoICgN1b20SATISZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAuwYyCUBxQiBGSUWebU46c+OrlApVsyGLHd4qhSDZeiGEgQKAggBGDYSEQoLCgN1b20SBDgwMDAQwJoMGkDZAeaCi//QLp+XUdU/P5QSZwm2Ey+uoHZsAfQ180mX+iuOYDF0Hru6FWEFnGpJaHHMj69rWG1P4s1Ru3F5X0jV',
  accountNumber: 54,
  sequence: 54,
  sendAmount1: '1',
  sendAmount2: '2',
};

export const TEST_TX_WITH_MEMO = {
  hash: 'FBE31E5E5DFD1E346ED2FD7E2AC6A8183AB059F9E5B8293E6ED88348B321B8A6',
  signature: 'Q/n0dY74JoFl4JrVb/H/VUm5ji70rygMYr7kdLKZ9yJp3PW5j/usCypqF1tBIqTwBRvDfVXqx8Tat4W2LEkc/A==',
  signedTxBase64:
    'CqkBCooBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmoKLW1hbnRyYTFjeXl6cHhwbHhkemtlZWE3a3dzeWRhZGc4NzM1N3FuYTVkMGZyYxItbWFudHJhMThzNWx5bm5teDM3aHE0d2xydzlnZG42OHNnMnV4cDVydHhud2V5GgoKA3VvbRIDNTAwEhpUZXN0MTIzQWxwaGFudW1lcmljTWVtbzQ1NhJlClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEC7BjIJQHFCIEZJRZ5tTjpz46uUClWzIYsd3iqFINl6IYSBAoCCAEYNxIRCgsKA3VvbRIEODAwMBDAmgwaQEP59HWO+CaBZeCa1W/x/1VJuY4u9K8oDGK+5HSymfciadz1uY/7rAsqahdbQSKk8AUbw31V6sfE2reFtixJHPw=',
  accountNumber: 55,
  sequence: 55,
  sendAmount: '500',
  memo: 'Test123AlphanumericMemo456',
};

export const blockHashes = {
  hash1: '4E24C00A10E70F54B30BAFBF5B5545882740BC2894739017C284978D827FE196',
  hash2: '98DD4400BF70DC8B2214B3E38E1292ECEF2114C78C26A50B0BFED25DA2E8D4E7',
};

// Generate the complete cronos test data
export const mantra = generateCoinData(chainConfig, DEFAULTS, blockHashes, {
  TEST_SEND_TX,
  TEST_SEND_TX2,
  TEST_SEND_MANY_TX,
  TEST_TX_WITH_MEMO,
});

export default mantra;
