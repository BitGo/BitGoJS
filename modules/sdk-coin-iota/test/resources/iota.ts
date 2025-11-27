import { TransactionRecipient } from '@bitgo/sdk-core';
import { GasData, TransactionObjectInput } from '../../src/lib/iface';

export const AMOUNT = 1000;
export const GAS_BUDGET = 5000000;
export const GAS_PRICE = 1000;

export const addresses = {
  validAddresses: [
    '0xda97e166d40fa6a0c949b6aeb862e391c29139b563ae0430b2419c589a02a6e0',
    '0x0502b39ec0b82c10c64a07e969ee1140e67d8e0c0fc0c0f6319fe7e47dbb0ab5',
    '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304',
  ],
  invalidAddresses: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const sender = {
  address: '0x9882188ba3e8070a9bb06ae9446cf607914ee8ee58ed8306a3e3afff5a1bbb71',
  publicKey: '8c26e54e36c902c5452e8b44e28abc5aaa6c3faaf12b4c0e8a38b4c9da0c0a6a',
};

export const gasSponsor = {
  address: '0x77291376d885efa752ed921b48d1aa1a65a389bf214ec0eab8b31970c9ab3618',
  publicKey: '4c13f955cee8f80d5d95577b07f624b42322d8ae1fadfc6a1b916828095247a2',
};

export const recipients: TransactionRecipient[] = [
  {
    address: addresses.validAddresses[0],
    amount: AMOUNT.toString(),
  },
  {
    address: addresses.validAddresses[1],
    amount: (AMOUNT * 2).toString(),
  },
];

export const gasPaymentObjects: TransactionObjectInput[] = [
  {
    objectId: '0x09c40522aed54bcecfa483605c5da5821b171ac1aa1b615971fb8dfe27ed13fd',
    version: '1105',
    digest: 'DGVhYjk6YHwdPdZBgBN8czavy8LvbrshkbxF963EW7mB',
  },
  {
    objectId: '0x27dd00e7fccdc87b4d95b6384b739119b91f2a81a16baedea7f4e0068e529437',
    version: '217',
    digest: 'DoJwXuz9oU5Y5v5vBRiTgisVTQuZQLmHZWeqJzzD5QUE',
  },
];

export const paymentObjects: TransactionObjectInput[] = [
  {
    objectId: '0x57bedec931e87beebebd5a375fae5e969965dba710e3c8652814ab1750b9e301',
    version: '32',
    digest: '82LZWnJwxRpZPLyFvPdLWBTyEu9J5aEZQFrTva9QPLzJ',
  },
  {
    objectId: '0xa90fdca6a9b7e8363d5825fb41c0456fc85ab3f47ddf5bbc19f320c82acbc62a',
    version: '33',
    digest: 'EFcXPoBtcHKZK3NhBHULZASAu61aZb5ab9JCXKEb5eMC',
  },
];

export const gasData: GasData = {
  gasBudget: GAS_BUDGET,
  gasPrice: GAS_PRICE,
  gasPaymentObjects: gasPaymentObjects,
};

export const generateObjects = (count: number): TransactionObjectInput[] => {
  return Array.from({ length: count }, (_, i) => ({
    objectId: `0x${i.toString(16).padStart(64, '0')}`,
    version: (i + 1).toString(),
    digest: `digest${i}`,
  }));
};

// Test signature data for signature serialization tests
export const testSignature = {
  // 64-byte signature (hex string)
  signature: Buffer.from(
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2' +
      'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    'hex'
  ),
  // Public key (already defined in sender)
  publicKey: {
    pub: sender.publicKey,
  },
};

export const testGasSponsorSignature = {
  // 64-byte signature (hex string)
  signature: Buffer.from(
    'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5' +
      'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    'hex'
  ),
  // Public key (already defined in gasSponsor)
  publicKey: {
    pub: gasSponsor.publicKey,
  },
};
