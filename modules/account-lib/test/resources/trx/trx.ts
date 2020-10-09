// DO NOT RE-USE THIS PRV FOR REAL MONEY
export const FirstPrivateKey = '2DBEAC1C22849F47514445A56AEF2EF164528A502DE4BD289E23EA1E2D4C4B06';
export const SecondPrivateKey = 'FB3AA887E0BE3FAC9D75E661DAFF4A7FE0E91AAB13DA9775CD8586D7CB9B7640';

export const FirstExpectedKeyAddress = 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz';
export const SecondExpectedKeyAddress = 'TDzm1tCXM2YS1PDa3GoXSvxdy4AgwVbBPE';

export const FirstExpectedSig =
  'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401';
export const SecondExpectedSig =
  'f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600';

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
    'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401',
  );
  return modifiedBuild;
})();

export const SecondSigOnBuildTransaction = (() => {
  const modifiedBuild = JSON.parse(JSON.stringify(UnsignedBuildTransaction));
  modifiedBuild['signature'] = [];
  modifiedBuild['signature'].push(
    'f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600',
  );
  modifiedBuild['signature'].push(
    'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401',
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
  sig:
    '0a9944316924ec7fba4895f1ea1e7cc95f9e2b828ae268a48a8dbeddef40c6f5e127170a95aed9f3f5425b13058d0cb6ef1f5c2213190e482e87043691f22e6800',
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

// ACCOUNTS

export const ACCOUNT_1 = {
  address: 'TVHsEa7nqPebk8fU5yc9ctf8n5X7DZKxkb',
  pk: '280DA606E22BB0F857753D74B2450D80BBE0B03E70F15873180A932D689CEDD8',
};

export const ACCOUNT_2 = {
  address: 'TSQQkC8189ARqHhrpNgPAV1XLH9ouAwdPD',
  pk: 'C87C22691E6423F48CFA2D2C5F60EB946E0DA6F31AEA3AA414D01B7670AA1092',
};

export const ACCOUNT_3 = {
  address: 'TGeT2sfMYcjx3ra2HhQUvMyBcVhjBc1Lbk',
  pk: 'EB94159C7EBC2959720B9F0321849F792B60FCBC7BFA4A9115F7E7A72B9ACE6F',
};

export const ACCOUNT_MULTISIG = {
  address: 'TQVxJBfK4JHfJN9sbw4fGSzCLrH6c6c1d5',
  pk: '0930B5929C4CE938BE6074EAA8B701E9FFF244A09327B6E92A3E875BFA1E7C34',
  owners: [ACCOUNT_1, ACCOUNT_2],
};

export const ACCOUNT_4 = {
  address: 'TMH8DL45MSyMZDj75ASRKj8811iqmaBPA2',
  pk: '879EFB4DB9241431FED9461CD0453EABFF44D5D12DA33920975DA03A990F0078',
};

export const ACCOUNT_5 = {
  address: 'TYbN1SsnDKad7AbCAWJjetSgn7a8zJjZQG',
  pk: 'F3307FFF3994A43C08735BBF0C9E3433DB33799B66DA42068B6EDFABBDA12B39',
};

export const ACCOUNT_6 = {
  address: 'TMpbB2NSJr7HeAdyzJ7uUrHULxya1QJ4iR',
  pk: '4BB66C64871FAB7780BF13E959DA938FA4FAB5ADA9D7D1618EC12EF0F1A45B1B',
};

export const WBTC_CONTRACT_ADDRESS = 'TEz9MS7yWMoPJboy5mnzPurXCu9ugPJMkw';
