
// DO NOT RE-USE THIS PRV FOR REAL MONEY
export const FirstPrivateKey = '2DBEAC1C22849F47514445A56AEF2EF164528A502DE4BD289E23EA1E2D4C4B06';
export const SecondPrivateKey = 'FB3AA887E0BE3FAC9D75E661DAFF4A7FE0E91AAB13DA9775CD8586D7CB9B7640';

export const FirstExpectedKeyAddress = 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz';
export const SecondExpectedKeyAddress = 'TDzm1tCXM2YS1PDa3GoXSvxdy4AgwVbBPE';

export const FirstExpectedSig = 'bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401';
export const SecondExpectedSig = 'f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600';

export const UnsignedBuildTransaction = {
  visible: false,
  txID:
     '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data:
     { contract:
        [ { parameter:
           {
             value:
             {
                amount: 1718,
                owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
                to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa'
              },
              type_url: 'type.googleapis.com/protocol.TransferContract'
           },
           type: 'TransferContract' } ],
     ref_block_bytes: '90e4',
     ref_block_hash: 'a018bf9892ddb138',
     expiration: 1571811468000,
     timestamp: 1571811410819 },
  raw_data_hex:
     '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',

};

export const FirstSigOnBuildTransaction = (() => {
  let modifiedBuild = JSON.parse(JSON.stringify(UnsignedBuildTransaction));
  modifiedBuild["signature"] = [];
  modifiedBuild["signature"].push('bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401');
  return modifiedBuild;
})();

export const SecondSigOnBuildTransaction = (() => {
  let modifiedBuild = JSON.parse(JSON.stringify(UnsignedBuildTransaction));;
  modifiedBuild["signature"] = [];
  modifiedBuild["signature"].push('f3cabe2f4aed13e2342c78c7bf4626ea36cd6509a44418c24866814d3426703686be9ef21bd993324c520565beee820201f2a50a9ac971732410d3eb69cdb2a600');
  modifiedBuild["signature"].push('bd08e6cd876bb573dd00a32870b58b70ea8b7908f5131686502589941bfa4fdda76b8c81bbbcfc549be6d4988657cea122df7da46c72041def2683d6ecb04a7401');
  return modifiedBuild;
})();

export const UnsignedTransferContractTx = {
  tx: {
    visible: false,
    txID:
      'ee0bbf72b238361577a9dc41d79f7a74f6ba9efe472c21bfd3e7dc850c9e9020',
    raw_data:
      { contract:
        [ { parameter:
              { value:
                { amount: 10,
                  owner_address: '41e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd',
                  to_address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577' },
                type_url: 'type.googleapis.com/protocol.TransferContract' },
            type: 'TransferContract' } ],
        ref_block_bytes: '5123',
        ref_block_hash: '52a26dea963a47bc',
        expiration: 1569463320000,
        timestamp: 1569463261623 },
    raw_data_hex:
      '0a025123220852a26dea963a47bc40c0fbb6dad62d5a65080112610a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412300a1541e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd1215412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577180a70b7b3b3dad62d',
    signature:
      [ ]
    },
    sig: '0a9944316924ec7fba4895f1ea1e7cc95f9e2b828ae268a48a8dbeddef40c6f5e127170a95aed9f3f5425b13058d0cb6ef1f5c2213190e482e87043691f22e6800',
};

export const UnsignedAccountPermissionUpdateContractPriv = '88413601C267316040413C68AAB35651F8C7AB05EC8FFEF42D42DDA16AA3732C';
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
                  weight: 1
                },
                {
                  address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
                  weight: 1
                },
                {
                  address: '41e0c0f581d7d02d40826c1c6cbee71f625d6344d0',
                  weight: 1
                }
              ],
              threshold: 2,
              permission_name: 'owner'
            },
            owner_address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
            actives: [
              {
                operations: '7fff1fc0037e0000000000000000000000000000000000000000000000000000',
                keys: [
                  {
                    address: '41ca42a499a2eee394323baa2c2f7d8a764ce0689c',
                    weight: 1
                  },
                  {
                    address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
                    weight: 1
                  },
                  {
                    address: '41e0c0f581d7d02d40826c1c6cbee71f625d6344d0',
                    weight: 1
                  }
                ],
                threshold: 2,
                type: 'Active',
                permission_name: 'active0'
              }
            ]
          },
          type_url: 'type.googleapis.com/protocol.AccountPermissionUpdateContract'
        },
        type: 'AccountPermissionUpdateContract'
      }
    ],
    ref_block_bytes: 'eeb2',
    ref_block_hash: '97904e2922d6b5e8',
    expiration: 1572473529000,
    timestamp: 1572473469065
  },
  raw_data_hex: '0a02eeb2220897904e2922d6b5e840a8c5e7f5e12d5abc02082e12b7020a3c747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e4163636f756e745065726d697373696f6e557064617465436f6e747261637412f6010a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c125a1a056f776e657220023a190a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c10013a190a15412c2ba4a9ff6c53207dc5b686bfecf75ea7b8057710013a190a1541e0c0f581d7d02d40826c1c6cbee71f625d6344d0100122800108021a0761637469766530200232207fff1fc0037e00000000000000000000000000000000000000000000000000003a190a1541ca42a499a2eee394323baa2c2f7d8a764ce0689c10013a190a15412c2ba4a9ff6c53207dc5b686bfecf75ea7b8057710013a190a1541e0c0f581d7d02d40826c1c6cbee71f625d6344d010017089f1e3f5e12d'
};

export const SignedAccountPermissionUpdateContractTx = {
  tx: {
    raw_data: {
      contract: [
        {
          parameter: {
            type_url: "type.googleapis.com/protocol.AccountPermissionUpdateContract",
            value: {
              actives: [
                {
                  keys: [
                    {
                      address: "4113001e2a65db1465868dde56ba0710040a587af3",
                      weight: 1
                    },
                    {
                      address: "4184465de31fc25bf6345a09d3abf8bf76ec98dc19",
                      weight: 1
                    },
                    {
                      address: "41b808cf439e09302b2e36ace3cd9153b5c747fd8b",
                      weight: 1
                    }
                  ],
                  operations: "7fff1fc0037e0000000000000000000000000000000000000000000000000000",
                  permission_name: "active0",
                  threshold: 2,
                  type: "Active"
                }
              ],
              owner: {
                keys: [
                  {
                    address: "4113001e2a65db1465868dde56ba0710040a587af3",
                    weight: 1
                  },
                  {
                    address: "4184465de31fc25bf6345a09d3abf8bf76ec98dc19",
                    weight: 1
                  },
                  {
                    address: "41b808cf439e09302b2e36ace3cd9153b5c747fd8b",
                    weight: 1
                  }
                ],
                permission_name: "owner",
                threshold: 2
              },
              owner_address: "4113001e2a65db1465868dde56ba0710040a587af3"
            }
          },
          type: "AccountPermissionUpdateContract"
        }
      ],
      expiration: 1571691861000,
      ref_block_bytes: "2147",
      ref_block_hash: "e5ea2176dd736cc0",
      timestamp: 1571691802033
    },
    raw_data_hex: "0a0221472208e5ea2176dd736cc04088a88a81df2d5abc02082e12b7020a3c747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e4163636f756e745065726d697373696f6e557064617465436f6e747261637412f6010a154113001e2a65db1465868dde56ba0710040a587af3125a1a056f776e657220023a190a154113001e2a65db1465868dde56ba0710040a587af310013a190a154184465de31fc25bf6345a09d3abf8bf76ec98dc1910013a190a1541b808cf439e09302b2e36ace3cd9153b5c747fd8b100122800108021a0761637469766530200232207fff1fc0037e00000000000000000000000000000000000000000000000000003a190a154113001e2a65db1465868dde56ba0710040a587af310013a190a154184465de31fc25bf6345a09d3abf8bf76ec98dc1910013a190a1541b808cf439e09302b2e36ace3cd9153b5c747fd8b100170b1db8681df2d",
    signature: [
      "37708fcec317b5579280085e258ddc437727a1bb47de2be746e894e26bc51b0e25513c1e91576a9560829fdf688bdd53af40a50e1e61dbd683f31508961a5c5301"
    ],
    txID: "8677936f55a6ca665a84dc3104087a63ac53dbf30fc802202b537d7ecffd9b1c",
    visible: false
  },
  signature:[],
};
