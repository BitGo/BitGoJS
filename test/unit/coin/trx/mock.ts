

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
}

 export const UnsignedAccountPermissionUpdateContractTx = {
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
        "0x37708fcec317b5579280085e258ddc437727a1bb47de2be746e894e26bc51b0e25513c1e91576a9560829fdf688bdd53af40a50e1e61dbd683f31508961a5c5301"
      ],
      txID: "8677936f55a6ca665a84dc3104087a63ac53dbf30fc802202b537d7ecffd9b1c",
      visible: false
    }
   ,
    signature:[],
 }
