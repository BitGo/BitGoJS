import { coins } from '@bitgo/statics';

// Test fixtures for EIP-191 message tests
export const fixtures = {
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
