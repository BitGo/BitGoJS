export const mockTx = {
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
};

const txInfo = {
  recipients: [
    {
      address: '412c2ba4a9ff6c53207dc5b686bfecf75ea7b80577',
      amount: '10',
    },
  ],
  from: '41e5e00fc1cdb3921b8340c20b2b65b543c84aa1dd',
  txid: 'ee0bbf72b238361577a9dc41d79f7a74f6ba9efe472c21bfd3e7dc850c9e9020',
};

export const signTxOptions = {
  prv: 'FB3AA887E0BE3FAC9D75E661DAFF4A7FE0E91AAB13DA9775CD8586D7CB9B7640',
  txPrebuild: {
    txHex: JSON.stringify(mockTx),
    txInfo,
    feeInfo: { fee: 1 },
  },
};
