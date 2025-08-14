import { coins } from '@bitgo/statics';

// Test fixtures for EIP-191 message tests
export const eip191Fixtures = {
  coin: coins.get('teth'),
  messages: {
    validMessage: 'Hello, world!',
    emptyMessage: '',
    specialCharsMessage: '!@#$%^&*()',
    longMessage:
      'This is a very long message that contains multiple lines and special characters. ' +
      'It is designed to test the EIP-191 message format with a more complex payload.',
  },
  eip191: {
    validSignablePayload: '0x19457468657265756d205369676e6564204d6573736167653a0d48656c6c6f2c20776f726c6421',
    signature: {
      publicKey: { pub: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf' },
      signature: Buffer.from(
        '5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be8921b',
        'hex'
      ),
    },
    signer: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
    metadata: {
      encoding: 'utf8',
      customData: 'test data',
    },
  },
};

export const eip712Fixtures = {
  coin: coins.get('teth'),
  messages: {
    helloBob: {
      message: {
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
      },
      hex: '1901f2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090fc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e',
    },
    recursive: {
      message: {
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
      },
      hex: '1901f2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f098a3fdba6dae9a89a220b7adbe1f38cf5d2aeabd94657aea65bb8aeef44f02e',
    },
  },
  eip712: {
    validSignablePayload: '0x19457468657265756d205369676e6564204d6573736167653a0d48656c6c6f2c20776f726c6421',
    signature: {
      publicKey: { pub: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf' },
      signature: Buffer.from(
        '5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be8921b',
        'hex'
      ),
    },
    signer: '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf',
    metadata: {
      encoding: 'utf8',
      customData: 'test data',
    },
  },
};
