const simple = {
  input: {
    payload: JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    }),
    metadata: {
      encoding: 'utf8',
      customData: 'test data',
    },
    signature: {
      publicKey: { pub: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf' },
      signature: Buffer.from(
        '5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be8921b',
        'hex'
      ),
    },
    signer: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
  },
  expected: {
    expectedSignableHex:
      '1901f2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090fc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e',
    expectedSignableBase64: 'GQHyzuN1+kK0IUOAQCX8RJ3q/VDMAxyiV+CxlKZQqRIJD8UsDuXYQmRHGAYpCj8sTOz8VJBia/kS0B8kDXonSzce',
  },
  broadcastHex:
    '7b2274797065223a22454950373132222c227061796c6f6164223a227b5c2274797065735c223a7b5c22454950373132446f6d61696e5c223a5b7b5c226e616d655c223a5c226e616d655c222c5c22747970655c223a5c22737472696e675c227d2c7b5c226e616d655c223a5c2276657273696f6e5c222c5c22747970655c223a5c22737472696e675c227d2c7b5c226e616d655c223a5c22636861696e49645c222c5c22747970655c223a5c2275696e743235365c227d2c7b5c226e616d655c223a5c22766572696679696e67436f6e74726163745c222c5c22747970655c223a5c22616464726573735c227d5d2c5c22506572736f6e5c223a5b7b5c226e616d655c223a5c226e616d655c222c5c22747970655c223a5c22737472696e675c227d2c7b5c226e616d655c223a5c2277616c6c65745c222c5c22747970655c223a5c22616464726573735c227d5d2c5c224d61696c5c223a5b7b5c226e616d655c223a5c2266726f6d5c222c5c22747970655c223a5c22506572736f6e5c227d2c7b5c226e616d655c223a5c22746f5c222c5c22747970655c223a5c22506572736f6e5c227d2c7b5c226e616d655c223a5c22636f6e74656e74735c222c5c22747970655c223a5c22737472696e675c227d5d7d2c5c227072696d617279547970655c223a5c224d61696c5c222c5c22646f6d61696e5c223a7b5c226e616d655c223a5c224574686572204d61696c5c222c5c2276657273696f6e5c223a5c22315c222c5c22636861696e49645c223a312c5c22766572696679696e67436f6e74726163745c223a5c223078436343436363636343434343634343434343436343634363634363434343634363636363636363435c227d2c5c226d6573736167655c223a7b5c2266726f6d5c223a7b5c226e616d655c223a5c22436f775c222c5c2277616c6c65745c223a5c223078434432613364394639333845313343443934374563303541624337464537333444663844443832365c227d2c5c22746f5c223a7b5c226e616d655c223a5c22426f625c222c5c2277616c6c65745c223a5c223078624262424242426262424242626262426262426262626242426242626262624262426262424262425c227d2c5c22636f6e74656e74735c223a5c2248656c6c6f2c20426f62215c227d7d222c2273657269616c697a65645369676e617475726573223a5b7b227075626c69634b6579223a22307837453546343535323039314136393132356435446643623762384332363539303239333935426466222c227369676e6174757265223a22585a6d32392f6252397a30614a6b6c2f4b78794a736b774a6b35452f68756d6930437a576d49665a7955383869414e59563532424779486447332f5a757748423242305135703844684f5a31777973355a44766f6b68733d227d5d2c227369676e657273223a5b22307837453546343535323039314136393132356435446643623762384332363539303239333935426466225d2c226d65746164617461223a7b22656e636f64696e67223a2275746638222c22637573746f6d44617461223a22746573742064617461227d7d',
};

const recursive = {
  input: {
    payload: JSON.stringify({
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
          { name: 'replyTo', type: 'Mail' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
        replyTo: {
          to: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          from: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello!',
        },
      },
    }),
  },
  expected: {
    expectedSignableHex:
      '1901f2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f098a3fdba6dae9a89a220b7adbe1f38cf5d2aeabd94657aea65bb8aeef44f02e',
  },
};

export const fixtures = {
  tests: { simple, recursive },
  signedTest: simple,
  messageBuilderTest: simple,
};
