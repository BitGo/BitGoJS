// There is a file called "trx" in resources directory but it should be
// removed in the future and add that data to this file.

// # Contract call data fields

export const FEE_LIMIT = '10000';
export const BLOCK_NUMBER = 51407;
export const BLOCK_HASH = '0000000000badb0d89177fd84c5d9196021cc1085b9e689b3e9a6195cac8bcae';
export const MINT_CONFIRM_DATA = '2bf90baa1273140c3e1b5756b242cc88cd7c4dd8a61bf85cb5c1dd5f50ba61e066b53a15';
export const EXPIRATION = 60000;

export const PARTICIPANTS = {
  from: {
    address: 'TVYygaQGXRKvc4GBeDXBWh4FRDVSdTeCua',
    pk: 'e71c05b814f44ac519b4b9029227fccc1d9bf3e1456f4840a2c9aa87d7f6dd3b',
  },
  custodian: {
    address: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN',
    pk: 'c4b3a04836efc2ee2917235f55ccfb2dcf6b8341e5ea0405da5ba10cd526dfed',
    bitcoinAddress: '2MytEhVhDLyEzmfeSA7yJ46yf5GhuKZ6gce',
  },
  merchant: {
    address: 'TBmTq8r22tfd4csEyxEcaKiKRVdkha5Xr2',
    pk: 'bbf446b0d3c07a6e19675af24242f9718a734fd4d080e8a62b1f6d6a337bc18f',
    bitcoinAddress: '2NDjgTKnakBynrwSoyFpSinMsx9PPfubd2e',
  },
  multisig: {
    address: 'TFfsxb2oxGwswbmaNwVzFU8v8zecyGqfyj',
    pk: '477a9a5491a3bac32ec5f431ebab90143dbc251bbbb016a625e8c096fd6365d4',
  },
};

export const CONTRACTS = {
  token: 'TUARZw4YBWF1BECZE7v36QZRQy9MFjvjH5',
  controller: 'TXjhEMM1oHfSdPaXQSZ2V4CmC76v8EL8xo',
  members: 'TSDWGQigVD8awFNetpfpJLVnkCGByDgdDt',
  factory: 'TRHsfoMda4ADiSUPnJ9XL3PhyNw6X14UMi',
};

export const TX_CONTRACT = [
  {
    parameter: {
      value: {
        data: MINT_CONFIRM_DATA,
        owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
        contract_address: '41a811a706c9d6e5062835063c08165ea7990927c2',
      },
      type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
    },
    type: 'TriggerSmartContract',
  },
];
