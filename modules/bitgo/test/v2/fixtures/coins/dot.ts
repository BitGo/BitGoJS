export const accounts = {
  account1: {
    secretKey: '874578010603af8e93b44bfc1d13b32830d0dbca6c89f28ccdc662afd3cdc824',
    publicKey: '61b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d',
    address: '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr',
  },
  account2: {
    secretKey: '6f850d17c2bf64478a2aac860fe9c23a48d322f12932c43fe90704553b7b84fd',
    publicKey: '9f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f0254',
    address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
  },
  account3: {
    secretKey: 'ff2f0c73e7e8a34ba80401efa06f16cbb3406ca1f04b4fc618bc937643eef498',
    publicKey: 'd472bd6e0f1f92297631938e30edb682208c2cd2698d80cf678c53a69979eb9f',
    address: '5GsG6P9EqkbmTrM1GE5bcQx9nsSq74KueiLa1kNZiwagFxW4',
  },
  account4: {
    secretKey: '1c096bd907cc0149661a153431004ac40743330f9f0a2d03627628e16eeda1a8',
    publicKey: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7',
    address: '5EmS1nuXogd8JXCUfyMjYBZ3MNbvPSBB4uNRjKGFS6E68YbK',
  },
  default: {
    secretKey: '0000000000000000000000000000000000000000000000000000000000000000',
    publicKey: '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
    address: '5DQcDYQ3wwobcrJ5aE5CzGp34ZWYNeYfYZ1yLbPiU2RcSvwm',
  },
};

export const rawTx = {
  transfer: {
    unsigned: '0xa80403009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251d501210300be23000008000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    signed: '0x4902840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d0009f863eb5db65c0a0300a2b3f9537933b07546db1da54c1030649220de97d0c13ac7c4f494f483964e8e30359a54c5cb137341df0366f91474492809ce90690fdbf52103000403009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251',
  },
};

export const unsignedTransaction = {
  serializedTxHex: '0xa80403004aafd11b678f5b781e7621168ca8eea8f8975f206e950dbb4305d1a097e7f66d0b16dc9bbae251bb520000be23000009000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e341a5195a8a88699afad6d244b1ada01c18070860cecd351d5484e9bb094f54b',
  signableHex: '0403004aafd11b678f5b781e7621168ca8eea8f8975f206e950dbb4305d1a097e7f66d0b16dc9bbae251bb520000be23000009000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e341a5195a8a88699afad6d244b1ada01c18070860cecd351d5484e9bb094f54b',
  feeInfo: {
    feeString: '10',
    fee: 10,
  },
  coinSpecific: {
    blockNumber: 8619307,
    senderAddress: '5CT1LNkgz6PYAXWY9wcAL9vsV6AESUhUJg27S4osCw1qvChi',
  },
  derivationPath: 'm/0',
  parsedTx: {
    address: '5CT1LNkgz6PYAXWY9wcAL9vsV6AESUhUJg27S4osCw1qvChi',
    sequenceId: 0,
    inputAmount: '90034235235350',
    outputAmount: '90034235235350',
    spendAmount: '90034235235350',
    inputs: [
      {
        address: '5CT1LNkgz6PYAXWY9wcAL9vsV6AESUhUJg27S4osCw1qvChi',
        value: 90034235235350,
        valueString: '90034235235350',
      },
    ],
    outputs: [
      {
        address: '5DkddSfPsWojjfuH9iJEcUV7ZseQ9EJ6RjtNmCR1w3CEb8S9',
        valueString: '90034235235350',
        coinName: 'tdot',
        wallet: '62a1205751675b2f0fe72328',
      },
    ],
    externalOutputs: [
      {
        address: '5DkddSfPsWojjfuH9iJEcUV7ZseQ9EJ6RjtNmCR1w3CEb8S9',
        valueString: '90034235235350',
        coinName: 'tdot',
        wallet: '62a1205751675b2f0fe72328',
      },
    ],
    minerFee: '0',
    payGoFee: 0,
    hasBackupKeySignature: false,
    type: '0',
    id: '0x0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8',
  },
  entryValues: {
    inputEntries: [
      {
        address: '5CT1LNkgz6PYAXWY9wcAL9vsV6AESUhUJg27S4osCw1qvChi',
        entryOptions: {
          wallet: '62a1205751675b2f0fe72328',
        },
        wallet: '62a1205751675b2f0fe72328',
        value: '-90034235235350',
      },
    ],
    outputEntries: [
      {
        address: '5DkddSfPsWojjfuH9iJEcUV7ZseQ9EJ6RjtNmCR1w3CEb8S9',
        entryOptions: {
          wallet: '62a1205751675b2f0fe72328',
        },
        wallet: '62a1205751675b2f0fe72328',
        value: '90034235235350',
      },
    ],
    value: '0',
    transferEntryOptions: {
      inputValue: '-90034235235350',
      outputValue: '90034235235350',
    },
    inputValue: '-90034235235350',
    outputValue: '90034235235350',
  },
};
