import { OperationType, SignatureType } from '../../src/lib/iface';

export const accounts = {
  account1: {
    secretKey: 'c5bccb8f471c5c9eb6483aa77ee4b700003b1e12df430a24d93238eb378b968b',
    publicKey:
      '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
    address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
  },
  account2: {
    secretKey: '73312c28d0d455b6a29a9a66811ffda94f3db6bfd57bf5c2bed917ee5928e15f',
    publicKey:
      '044e01707f70f6ad8d9f79e5f2c2f0bac5e91520e5e2491354c6c7827b59d44148847f9180ac9679a6ce66f69c330551a99f8f9b7419c437705602a54c258a9dfe',
    address: 'c3d30f404955975adaba89f2e1ebc75c1f44a6a204578afce8f3780d64fe252e',
  },
  account3: {
    publicKey:
      '042281378584012843130dce9b19002f88a949f237397e2f6cda2db1392d54f6345faaf51c384fbfe4e8f67eb12fdb53732d2ddfe7470f9310a0bf824dad3f6b1b',
    secretKey: '7b4de3d8cc3e312c70f674b52f11818205546ca7036c8071997c46e429160dc3',
    address: '50b59c953c9412823ada13c485656f853ec65cb58f164756429af53f06d3ab5f',
  },
  account4: {
    secretKey: 'c71d2779709061cc991b58bd79b0080cc125acb98b28c71ac5d63bca62e2b742',
    publicKey:
      '045b340975daf07887df1f32689dad303cb3e2869939d82f9225a79b0a2e56621f0c773070dc6316b36b796e7c92334c6897c9179b75efbd7a78c149f4b7a15cd9',
    address: '8812eef6cf88b86ccf8d3e1b5d4aa3011025ec0c014aece4e8e9bdb02151392c',
  },
  account5: {
    secretKey: '8d08c0393b707cd90c37213025fe7ed13c05b267d946ca1b6e0fd3b0e47ec188',
    publicKey:
      '04c8e66bf2e02f15ebe8da05b74d105b54cde5114f13d4afdec8afad6aaeb621bacab8c119821ef079545413cb26ef71dd8ab681c0fcce6085648b3fe08d3cd109',
    address: '6f1cd9940598e205b0affacff7fcdafa81700cd7b2d0c25f15803b955a12f100',
  },
  account6: {
    secretKey: '8d08c0393b707cd90c37213025fe7ed13c05b267d946ca1b6e0fd3b0e47ec188',
    publicKey: '02ad010ce68b75266c723bf25fbe3a0c48eb29f14b25925b06b7f5026a0f12702e',
    address: '2b9b89604362e185544c8bba76cadff1a3af26e1467e8530d13743a08a52dd7b',
  },
  errorsAccounts: {
    account1: {
      secretKey: 'not ok',
      publicKey: 'not ok',
      address: 'not ok',
    },
    account2: {
      secretKey: 'test_test',
      publicKey: 'test_test',
      address: 'bo__wen',
    },
    account3: {
      publicKey: 'invalid-public-key',
      secretKey: 'invalid-private-key',
      address: 'me@google.com',
    },
    account4: {
      secretKey: '#$%',
      publicKey: '#$%',
      address: '$$$',
    },
    account5: {
      secretKey: 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      publicKey: 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      address: 'abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz',
    },
    account6: {
      secretKey: '',
      publicKey: '',
      address: '',
    },
  },
};

export const IcpTransactionData = {
  senderAddress: accounts.account1.address,
  receiverAddress: accounts.account2.address,
  amount: '10',
  fee: '-10000',
  senderPublicKeyHex: accounts.account1.publicKey,
  memo: 1740638136656000000,
  transactionType: OperationType.TRANSACTION,
  expiryTime: Date.now() * 1000_000 + 5 * 60 * 1000_000_000,
};

export const rawTransaction = {
  outputAmount: '10',
  inputAmount: '10',
  spendAmount: '10',
  externalOutputs: [
    {
      amount: '10',
      address: accounts.account2.address,
    },
  ],
  type: OperationType.TRANSACTION,
  address: accounts.account1.address,
  senderKey: accounts.account1.publicKey,
  seqno: 1740638136656000000,
  spendAmountString: '10',
  id: '5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw',
  expiryTime: Date.now() * 1000_000 + 5 * 60 * 1000_000_000,
};

export const signatures = [
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d72657175657374b2131c069040ccd4aceac295f53159d8d9a786cdab5c4ebdd2ed47a83e1902eb',
      signature_type: SignatureType.ECDSA,
    },
    signature_type: SignatureType.ECDSA,
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'e9b37dfd8ae85414d8b371c0a324a4fb65a1cbd6189f02f8a86a7b963ec8f7f2fdfedc836caabb26b1db0312d08150da5c31591c02db4c945e98094f052f44d8',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d72657175657374d7e6bf08c4c0c783b481c8dae7d8cf39bec7e2a198d6950312bb99c23498973e',
      signature_type: SignatureType.ECDSA,
    },
    signature_type: SignatureType.ECDSA,
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'ff3b75750106ee6e911de6cf039224cd9f623c65c5ba3cebb18e66d969ec6be3bd4292d96f4807c980e513d5676fb680ddfd44c71063ef57f868a098b3163406',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d7265717565737432a1939ab22a9b08e131d5dc3ed5704bca08c7ab97144871d08e5f4d83e9cbd9',
      signature_type: SignatureType.ECDSA,
    },
    signature_type: SignatureType.ECDSA,
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '8bad0e718c71bac77129c01376b5767f4e0b0aed31a0d0ec4f1c10be2e79825ac3624f2f98b5fc763eec9f572840c11c3eb8f096d9cc5ea130ab4e4160ed0d99',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d7265717565737429fa34da10b70a79abede2965312487d39063b56f2eeeee60dc4cd0fe25d78c2',
      signature_type: SignatureType.ECDSA,
    },
    signature_type: SignatureType.ECDSA,
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'afe95a736a0162dd4335d2f4fb9e8dbd952e589511431fd6f8e72adf673ee697522651d670621522ed128ac7c7da5ca4df5175186f5419492eb70b4a0a41ed42',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d72657175657374dd33e62262d41d19c74828331fc27d96df83bd343cc638f9daee28c14b562acd',
      signature_type: SignatureType.ECDSA,
    },
    signature_type: SignatureType.ECDSA,
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      'fbe7577ecbc45dcd605367b58a6046061219230617c5aaaff2913abe0f5b7000b8159c0b879536771f132ccda5c514765f98bc77fe79454e2fbffd2dca641279',
  },
  {
    signing_payload: {
      account_identifier: {
        address: '0af815da8259ba8bb3d34fbfb2ac730f07a1adc81438d40d667d91b408b25f2f',
      },
      hex_bytes: '0a69632d7265717565737476cd4d6b83e5a8526a59a32c8ebf6835f05d87adb2719eba4bf3621de6b199af',
      signature_type: SignatureType.ECDSA,
    },
    signature_type: SignatureType.ECDSA,
    public_key: {
      hex_bytes:
        '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
      curve_type: 'secp256k1',
    },
    hex_bytes:
      '6f05a9764e9311417e6abdbd4c1d0532311bf2c65cd5907b7180149e306bfed530d6742e7274bdf50f195405a3326c4ba6538c0cf348dea199785ecfe637f147',
  },
];
