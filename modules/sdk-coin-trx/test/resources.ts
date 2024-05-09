// There is a file called "trx" in resources directory but it should be
// removed in the future and add that data to this file.

// # Contract call data fields

export const FEE_LIMIT = '10000';
export const BLOCK_NUMBER = 51407;
export const BLOCK_HASH = '0000000000badb0d89177fd84c5d9196021cc1085b9e689b3e9a6195cac8bcae';
export const MINT_CONFIRM_DATA = '2bf90baa1273140c3e1b5756b242cc88cd7c4dd8a61bf85cb5c1dd5f50ba61e066b53a15';
export const EXPIRATION = 60000;
export const TOKEN_TRANSFER_DATA =
  'a9059cbb0000000000000000000000004887974f42a789ef6d4dfc7ba28b1583219434b3000000000000000000000000000000000000000000000000000000003b9aca00';
export const USDT_CONTRACT_ADDRESS = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
export const TOKEN_TRANSFER_RECIPIENT = 'TGai5uHgBcoLERrzDXMepqZB8Et7D8nV8K';
export const TOKEN_TRANSFER_DATA_2 =
  'a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e100';
export const TOKEN_TXID = 'fe21c49f4febd9089125e3a006943c145721d8fcb7ab84136f8c6663ff92f8ed';

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

export const TOKEN_TX_CONTRACT = [
  {
    parameter: {
      value: {
        data: TOKEN_TRANSFER_DATA,
        owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
        contract_address: '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
      },
      type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
    },
    type: 'TriggerSmartContract',
  },
];

export const TOKEN_TX_CONTRACT_2 = [
  {
    parameter: {
      value: {
        data: TOKEN_TRANSFER_DATA_2,
        owner_address: '41c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac',
        contract_address: '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
      },
      type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
    },
    type: 'TriggerSmartContract',
  },
];

// DO NOT RE-USE THIS PRV FOR REAL MONEY
export const FirstPrivateKey = '2DBEAC1C22849F47514445A56AEF2EF164528A502DE4BD289E23EA1E2D4C4B06';
export const SecondPrivateKey = 'FB3AA887E0BE3FAC9D75E661DAFF4A7FE0E91AAB13DA9775CD8586D7CB9B7640';

export const FirstExpectedKeyAddress = 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz';
export const SecondExpectedKeyAddress = 'TDzm1tCXM2YS1PDa3GoXSvxdy4AgwVbBPE';

export const FirstExpectedSig =
  'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401';
export const SecondExpectedSig =
  'f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600';

export const TestRecoverData = {
  userKey:
    'xpub6BvMpt8ke8tCycBBw6uDob6PyNBkHbTyEztaRuwdMZhpiFk1mXpS7P7iv4c4w7XWFFRySMokUuFUqqgpZxK5wLxm6pgjpkNFhKsMaXTJoUN',
  backupKey:
    'xpub687kC8LeSJwj1gYQr4Js2BHbLK1nFeLvMzsDmH2LKMNrqAHNfeCw1sp61cbf2WxeY1QssaUBh9EFJbJ9LBuPivv7XDsFPVaFYj19ueCNczT',
  bitgoKey:
    'xpub661MyMwAqRbcFHCRyasU67NCA7V7goqUFPXvzsEiJd4SchCKyPtigHALvve5wtBdyHMZCWqpGzEsrQtfz6mE9m5QXWDantgbkmu56xvLwe3',
  baseAddress: 'TTgisRP7EJWMgpLXvbNHoHh5UotkjkBPoo',
  firstReceiveAddress: 'TXD3WiQZGCKTbYjNyxpzyaT8TtNkeTq12V',
  secondReceiveAddress: 'TCeoT36uUTtzatTnPh77veqTy4utYujXW6',
  recoveryDestination: 'TWkzN4WjxkyoRTmFHaMQ9po77uEerngjyQ',
};

export function baseAddressBalance(trxBalance: number, trc20Balances: any[] = []) {
  return {
    data: [
      {
        owner_permission: {
          keys: [
            {
              address: 'TTgisRP7EJWMgpLXvbNHoHh5UotkjkBPoo',
              weight: 1,
            },
            {
              address: 'TBDy8HAy8vvhoqKc5V1hHQatfjZHM1MhPb',
              weight: 1,
            },
            {
              address: 'TPHPDfQ8Vs3Yp5UKDLHr5MjoVUrr5Y69m9',
              weight: 1,
            },
          ],
          threshold: 2,
          permission_name: 'owner',
        },
        balance: trxBalance,
        trc20: trc20Balances,
        active_permission: [
          {
            operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
            keys: [
              {
                address: 'TTgisRP7EJWMgpLXvbNHoHh5UotkjkBPoo',
                weight: 1,
              },
              {
                address: 'TBDy8HAy8vvhoqKc5V1hHQatfjZHM1MhPb',
                weight: 1,
              },
              {
                address: 'TPHPDfQ8Vs3Yp5UKDLHr5MjoVUrr5Y69m9',
                weight: 1,
              },
            ],
            threshold: 2,
            id: 2,
            type: 'Active',
            permission_name: 'active0',
          },
        ],
      },
    ],
  };
}

export function receiveAddressBalance(balance: number, address: string, trc20Balances: any[] = []) {
  return {
    data: [
      {
        owner_permission: {
          keys: [
            {
              address: address,
              weight: 1,
            },
          ],
          threshold: 1,
          permission_name: 'owner',
        },
        active_permission: [
          {
            operations: '7fff1fc0033ec30f000000000000000000000000000000000000000000000000',
            keys: [
              {
                address: address,
                weight: 1,
              },
            ],
            threshold: 1,
            id: 2,
            type: 'Active',
            permission_name: 'active',
          },
        ],
        balance: balance,
        trc20: trc20Balances,
      },
    ],
  };
}

export function creationTransaction(fromAddress: string, toAddress: string, amount: number) {
  return {
    visible: false,
    txID: 'cc675f47b56f84c011ee87c7c0dde5a5fd662b48139805aaf3c488409e3aaf3b',
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: amount,
              owner_address: fromAddress,
              to_address: toAddress,
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      ref_block_bytes: '37d3',
      ref_block_hash: 'a47d2ac2189487b9',
      expiration: 1693441548000,
      timestamp: 1693441489854,
    },
    raw_data_hex:
      '0a0237d32208a47d2ac2189487b940e0bdedc7a4315a68080112640a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412330a1541e8f88b4e239e85c92255b043450a34b65a329a54121541c25420255c2c5a2dd54ef69f92ef261e6bd4216a1880c2d72f70bef7e9c7a431',
  };
}

export const SampleRawTokenSendTxn = {
  result: {
    result: true,
  },
  transaction: {
    visible: false,
    txID: 'f8179caab4c781676cb33940948533e209dc7fe2135bbd6e00f60597862b86be',
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              data: 'a9059cbb000000000000000000000000e40b19afca3dde4ce8fcbc57ab41f8c326ab0cf2000000000000000000000000000000000000000000000000000000004190ab00',
              owner_address: '41c25420255c2c5a2dd54ef69f92ef261e6bd4216a',
              contract_address: '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
            },
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
          },
          type: 'TriggerSmartContract',
        },
      ],
      ref_block_bytes: 'cba3',
      ref_block_hash: 'e14cc425da3cfd94',
      expiration: 1693357620000,
      fee_limit: 100000000,
      timestamp: 1693357561339,
    },
    raw_data_hex:
      '0a02cba32208e14cc425da3cfd9440a0f6ea9fa4315aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c25420255c2c5a2dd54ef69f92ef261e6bd4216a12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb000000000000000000000000e40b19afca3dde4ce8fcbc57ab41f8c326ab0cf2000000000000000000000000000000000000000000000000000000004190ab0070fbabe79fa431900180c2d72f',
  },
};

export const UnsignedBuildTransaction = {
  visible: false,
  txID: '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

export const FirstSigOnBuildTransaction = (() => {
  const modifiedBuild = JSON.parse(JSON.stringify(UnsignedBuildTransaction));
  modifiedBuild['signature'] = [];
  modifiedBuild['signature'].push(
    'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401'
  );
  return modifiedBuild;
})();

export const SecondSigOnBuildTransaction = (() => {
  const modifiedBuild = JSON.parse(JSON.stringify(UnsignedBuildTransaction));
  modifiedBuild['signature'] = [];
  modifiedBuild['signature'].push(
    'f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600'
  );
  modifiedBuild['signature'].push(
    'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401'
  );
  return modifiedBuild;
})();

export const UnsignedTransferContractTx = {
  tx: {
    visible: false,
    txID: 'ee0bbf72b238361577a9dc41d79f7a74f6ba9efe472c21bfd3e7dc850c9e9020',
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: 10,
              owner_address: '41e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd',
              to_address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        },
      ],
      ref_block_bytes: '5123',
      ref_block_hash: '52a26dea963a47bc',
      expiration: 1569463320000,
      timestamp: 1569463261623,
    },
    raw_data_hex:
      '0a025123220852a26dea963a47bc40c0fbb6dad62d5a65080112610a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412300a1541e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd1215412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577180a70b7b3b3dad62d',
    signature: [],
  },
  sig: '0a9944316924ec7fba4895f1ea1e7cc95f9e2b828ae268a48a8dbeddef40c6f5e127170a95aed9f3f5425b13058d0cb6ef1f5c2213190e482e87043691f22e6800',
};

export const AccountPermissionUpdateContractPriv = '88413601C267316040413C68AAB35651F8C7AB05EC8FFEF42D42DDA16AA3732C';
export const UnsignedAccountPermissionUpdateContractTx = {
  visible: false,
  txID: '7d5407d81d4e95f4c3c28f8849947b91fbfa9c5b102bfd5b48fe77e63c68107d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            owner: {
              keys: [
                {
                  address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
                  weight: 1,
                },
                {
                  address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
                  weight: 1,
                },
                {
                  address: '41e0c0f581d7d02d40826c1c6cbee71f625d6344d0',
                  weight: 1,
                },
              ],
              threshold: 2,
              permission_name: 'owner',
            },
            owner_address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
            actives: [
              {
                operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
                keys: [
                  {
                    address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
                    weight: 1,
                  },
                  {
                    address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
                    weight: 1,
                  },
                  {
                    address: '41e0c0f581d7d02d40826c1c6cbee71f625d6344d0',
                    weight: 1,
                  },
                ],
                threshold: 2,
                type: 'Active',
                permission_name: 'active0',
              },
            ],
          },
          type_url: 'type.googleapis.com/protocol.AccountPermissionUpdateContract',
        },
        type: 'AccountPermissionUpdateContract',
      },
    ],
    ref_block_bytes: 'eeb2',
    ref_block_hash: '97904e2922d6b5e8',
    expiration: 1572473529000,
    timestamp: 1572473469065,
  },
  raw_data_hex:
    '0a02eeb2220897904e2922d6b5e840a8c5e7f5e12d5abc02082e12b7020a3c747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e4163636f756e745065726d697373696f6e557064617465436f6e747261637412f6010a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c125a1a056f776e657220023a190a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c10013a190a15412c2ba4a9ff6c53207dc5b686bfecf75ea7b8057710013a190a1541e0c0f581d7d02d40826c1c6cbee71f625d6344d0100122800108021a0761637469766530200232207fff1fc0037e00000000000000000000000000000000000000000000000000003a190a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c10013a190a15412c2ba4a9ff6c53207dc5b686bfecf75ea7b8057710013a190a1541e0c0f581d7d02d40826c1c6cbee71f625d6344d010017089f1e3f5e12d',
};

export const SignedAccountPermissionUpdateContractTx = {
  visible: false,
  txID: '7d5407d81d4e95f4c3c28f8849947b91fbfa9c5b102bfd5b48fe77e63c68107d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            owner: {
              keys: [
                {
                  address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
                  weight: 1,
                },
                {
                  address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
                  weight: 1,
                },
                {
                  address: '41e0c0f581d7d02d40826c1c6cbee71f625d6344d0',
                  weight: 1,
                },
              ],
              threshold: 2,
              permission_name: 'owner',
            },
            owner_address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
            actives: [
              {
                operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
                keys: [
                  {
                    address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
                    weight: 1,
                  },
                  {
                    address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
                    weight: 1,
                  },
                  {
                    address: '41e0c0f581d7d02d40826c1c6cbee71f625d6344d0',
                    weight: 1,
                  },
                ],
                threshold: 2,
                type: 'Active',
                permission_name: 'active0',
              },
            ],
          },
          type_url: 'type.googleapis.com/protocol.AccountPermissionUpdateContract',
        },
        type: 'AccountPermissionUpdateContract',
      },
    ],
    ref_block_bytes: 'eeb2',
    ref_block_hash: '97904e2922d6b5e8',
    expiration: 1572473529000,
    timestamp: 1572473469065,
  },
  raw_data_hex:
    '0a02eeb2220897904e2922d6b5e840a8c5e7f5e12d5abc02082e12b7020a3c747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e4163636f756e745065726d697373696f6e557064617465436f6e747261637412f6010a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c125a1a056f776e657220023a190a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c10013a190a15412c2ba4a9ff6c53207dc5b686bfecf75ea7b8057710013a190a1541e0c0f581d7d02d40826c1c6cbee71f625d6344d0100122800108021a0761637469766530200232207fff1fc0037e00000000000000000000000000000000000000000000000000003a190a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c10013a190a15412c2ba4a9ff6c53207dc5b686bfecf75ea7b8057710013a190a1541e0c0f581d7d02d40826c1c6cbee71f625d6344d010017089f1e3f5e12d',
  signature: [
    '2bc5030727d42ed642c2806a3c1a5a0393408b159541f2163df4ba692c5c1240e2dde5a2aae4ecad465414e60b5aeca8522d0a2b6606f88a326658809161334f00',
  ],
};
export const InvalidIDTransaction = {
  visible: false,
  txID: '90b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};
export const UnsignedBuildEmptyIDTransaction = {
  visible: false,
  txID: '',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

export const UnsignedBuildInvalidIDTransaction = {
  visible: false,
  txID: '80b8b9ebfd51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

export const UnsignedInvalidExpirationBuildTransaction = {
  visible: false,
  txID: '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468900,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

export const UnsignedInvalidTimeStampBuildTransaction = {
  visible: false,
  txID: '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1581811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

export const UnsignedInvalidContractBuildTransaction = {
  visible: false,
  txID: '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

export const mockTokenTx = {
  signature: [],
  txID: '636a94d8662c51cbc7e1bdccc6ccc0d531827582bb7d73f8bbc0eea7f86df590',
  raw_data: {
    contractType: 2,
    contract: [
      {
        parameter: {
          value: {
            data: 'a9059cbb0000000000000000000000004887974f42a789ef6d4dfc7ba28b1583219434b3000000000000000000000000000000000000000000000000000000003b9aca00',
            owner_address: '414887974f42a789ef6d4dfc7ba28b1583219434b3',
            contract_address: '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
          },
          type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
        },
        type: 'TriggerSmartContract',
      },
    ],
    ref_block_bytes: 'c8cf',
    ref_block_hash: '89177fd84c5d9196',
    expiration: 1670543993164,
    timestamp: 1670540393164,
    fee_limit: 150000000,
  },
  raw_data_hex:
    '0a02c8cf220889177fd84c5d919640ccd2b9a1cf305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a15414887974f42a789ef6d4dfc7ba28b1583219434b312154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb0000000000000000000000004887974f42a789ef6d4dfc7ba28b1583219434b3000000000000000000000000000000000000000000000000000000003b9aca0070ccf5dd9fcf30900180a3c347',
};
