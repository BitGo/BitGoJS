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

export const keys = {
  userKey:
    '{"iv":"5zIleVnaLFh4t7RkmDuYWA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"a2GdyuPHoHc=","ct":"FNmholWWRDg/3r\n' +
    'TNqx7NxEHz6vZ14iJsJGKysKA6S2hXCsZXUjyUEaMBLQFgbo4w88UptMHS3mtJNUD3i8y6Zk5Kg\n' +
    'jAI35wSrofCfIlrTPjghh+z/pKTJIuGvcTGKLmYUVbtoZCei/76GkJvgR0HFy9f44ZZIoW771VS\n' +
    'u2OfxuQjAsP8qUYl9JZNs7nY0PDHSVSjJbXnTkgFf1y9KgJQ3Gv3nSRD+/YFpFzHqlbxfizt5R1\n' +
    'WzUBkLWTmV9SDT4qm/Qv9NA57Fc+6YPm1J9xL/HPBCLKmok4CHXYvfX4qZYAHeRfYTTFYN9Cg0d\n' +
    'svHL4CUKJA4g5f2eoDmPRguAK4jvbkQqTcpj7YgWZsJPp8FRJD6SRCpKRHYD/VNzV9Pz2KgzFxt\n' +
    'E941kD5Bjz9Lvo8q8CcoPuUx8L8+D9qm3APnkrXQXJ3rFxO/r9li681XNdkUOp6FvY28OeEBgdu\n' +
    'jzCpjtyEwZDh19a1AjNoa6tGLK+GwE7qNeZ/VxVl1YsK3wfwIyfZvrqgbUI91fcYYUPTGfRv+lY\n' +
    'dcOFsiimUAYRKFpEEawLGAqGwzRTEAz9cVvtg/zPj/rVsEZ6oMl0ogFPIsuGInCFw/Tqk4RWlGZ\n' +
    'S1FTsnP44QSYNV3JjK3MJxZ51ToV04cwm5yt4DjjhbQZhSdHXxvOe5axerGwCFKYJDq5lojabGn\n' +
    'MLI7hTtLd29qcBL7FHgtXuapiSLHOXrdkS7qui2oXS59JUBr6nlVBpAqoVwisizdy1kUrjanVwk\n' +
    '9VlqYSQtv1I9VMrM+JiWqZ+oBZd58lQiJsteCz2BwbCthd+7tlOD04TbJyFff9JOiVgSWBfcsL9\n' +
    'u+hWPZcpi7xU04QkPD8ru1ayK5L6LVQQvN7Nne2tIJCIBVE67BQ34icyjV6+VY/Y+YbAayX6X2x\n' +
    'hgrR3AW08LNuKiVxDJx3iNxmnXrqOCzGUzdaX+54qs1npP9ri9YpKDiD/u8VmcnXdQgzCE0sSMT\n' +
    'kUbAdS4ru3uXjNoJe848S8mr/YmgjwK4URmK1S5R6G5k48pQjal7aLUnp7Hvj9KcNsjDK+KaIxi\n' +
    '0IspfwMeaN5dc5rbmj5ARPskHiSNny1Rivf4cxkoa5ecQCgmzMtuutExL2XgkdRdVAVIIXyM5hc\n' +
    'S01ANvxyrDKwKMJfwpU8mWc5fyJeK+BCm8NJTzprDmHY/Myb6cQF1bvxFrOLI7Uut"}',
  backupKey:
    '{"iv":"H3k/G/X2nxj07c+G357WTg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"FLhYgX8tlRQ=","ct":"5DikpaMGVA0gEj\n' +
    'gagN4niJcyyhmGGwoJGWbmz8fwsvIdRxUA9WJWvuILX+jnqSUZrUFPzHVMGuhIKz6zE0OtpKIOU\n' +
    'Wnnp0O6mXfVnZ6n88Ti9q4H7cBoO655T100TTgm9Mqp8rMa7+SGf+KeDIYXPpX1hGSnKxFt8UlZ\n' +
    '+b+KoZndl87EKYsAjuSQLCl+WeB0uPr3CqohIu0dGF+d9gJOOkJsiosEKAZ5kY1SR6j8aLL6uDn\n' +
    'RKS6EiQfjeXQWBFJYFUS2cvZgKpfcAn0PXy2txlQmkJPMtJfclMqHvubOA8Bcj7p6UEjxJsMOUx\n' +
    'WKMvaynGenzoUcV8o4fkA0fKGGt+/i/tBfAV23tERjOdAvkUApGZgkOeaUySYPvo0m1NnQl9+1S\n' +
    't0kiTsJ14KoxKfVp3iAOJY6wr5gnB9cJIy27OWeQC1FaTXo40yE7FizS/fagxOoE2KUMvYxi1F+\n' +
    '6sg9L3ygUumfA2rv1x25NBvYHvwK8KzYGf1W4A4dRSdeGDXpIlUuE1QjDNnH9PH3nxgmY9mnJgF\n' +
    'pYmUTBz27FgtsFAE0Et0Lv0ESBmpKBNGMG8lncX56cTdGUbDQTEEXjOy+kkO09GV9QCq/mRlIKT\n' +
    '0HUCymfVn/MTm9V26W6wj5P/A1/HmlCJxzeVCrHftietHIB+rRGpoTvzN6WOeZ0Nbwybjr78CfR\n' +
    'FZJ5RIJieUg+S4bLqyMDb1QRsiY9N8JWEvTssBSacbpJMLVu++Ef+MqrLt3chaqTPY+vXNmFtt3\n' +
    'dDJ1OA69MM3EXYGmF2NyHCJ703y++qRAKNZrYyJP5FsBmwz1DAlsTEXc7p6k8r4zZfTg6JuIEIn\n' +
    '8f0XpLW5rm841kGR5GZYn4d5VF5CXxWq5naNByZRPFOeqEquz1T5vjtVaS96GZUyyirVcqIeSkM\n' +
    '0QiVdgCM+V18B7XQP6YJWn+zO+siVoyOvdwU6TIeKhAN4s0QTlG7DhNTbg8JNM1JWZPm8LUHk5q\n' +
    'CCXJBpFbZkPabpXWVSRxkBBU2oIui9fgn0F0Dk8fObmkJMd9GM3XWKZasriEoeXI4E1sp2RCBZB\n' +
    'CWyJBXa7jwGpUkQkyMuStG/1cPOEqHohSUEhFPDgxZdMkOq3KKxpe+0xZxb59ZYlbn1LFFC+olq\n' +
    'kj/FttWirJQ7MqFXXlvqvvBmckHyZnYEzJZct2DdbinIm3/nHoP4fSPotJKjkUw=="}',
  bitgoKey:
    '3b89eec9d2d2f3b049ecda2e7b5f47827f7927fe6618d6e8b13f64e7c95f4b00b9577ab0139\n' +
    '5ecf8eeb804b590cedae14ff5fd3947bf3b7a95b9327c49e27c54',
  bitgoKeyColdWallet:
    '79d4b9b594df028fee3725a6af51ae3ab6a3519e9d2c322f2c8fd815b96496323c5aba7ea87\n' +
    '4c102f966f1a61d3c9a42b5f3177c6a85712cf313715afddf83d8',
  bitgoKeyWithSeed:
    'ca0a014ba6f11106a155ef8e2cab2f76d277e4f01cffa591a9b40848343823b3d910752a49c96bf5813985206e23c9f9cd3a78f1cccf5cf88def52b573cedc93',
};
