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
    unsigned:
      '0xa80403009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251d501210300be23000008000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    signed:
      '0x4902840061b18c6dc02ddcabdeac56cb4f21a971cc41cc97640f6f85b073480008c53a0d0009f863eb5db65c0a0300a2b3f9537933b07546db1da54c1030649220de97d0c13ac7c4f494f483964e8e30359a54c5cb137341df0366f91474492809ce90690fdbf52103000403009f7b0675db59d19b4bd9c8c72eaabba75a9863d02b30115b8b3c3ca5c20f02540bfadb9bbae251',
  },
};

export const unsignedTransaction = {
  serializedTxHex:
    '0xa80403004aafd11b678f5b781e7621168ca8eea8f8975f206e950dbb4305d1a097e7f66d0b16dc9bbae251bb520000be23000009000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e341a5195a8a88699afad6d244b1ada01c18070860cecd351d5484e9bb094f54b',
  signableHex:
    '0403004aafd11b678f5b781e7621168ca8eea8f8975f206e950dbb4305d1a097e7f66d0b16dc9bbae251bb520000be23000009000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e341a5195a8a88699afad6d244b1ada01c18070860cecd351d5484e9bb094f54b',
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

export const westendBlock = {
  blockNumber: 12640277,
  hash: '0x3771101969cc5cf1b37db0bdce589fe9174a1b820341c4d3673ce301352a3d42',
};

export const ovcResponse = {
  signatureShares: [
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                '0x90040400bf0678d312b2b2c7effd2b1f214ee13928d339391d5f5f7056608aa0d32b9edf012b4a0400d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423ea9190240f639000c66afbd7461ffac6c1c587abdb636873b791bf2c0769ecb8d',
              scanIndex: 0,
              coin: 'tdot',
              signableHex:
                '040400bf0678d312b2b2c7effd2b1f214ee13928d339391d5f5f7056608aa0d32b9edf012b4a0400d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423ea9190240f639000c66afbd7461ffac6c1c587abdb636873b791bf2c0769ecb8d',
              derivationPath: 'm/0',
              parsedTx: {
                inputs: [
                  {
                    address: '5Dtg2zKjVEL8p9keSM4dQ7nD26sVtMfCsyxkhvZZ9fqBbhw6',
                    valueString: '1500000000000',
                    value: 1500000000000,
                  },
                ],
                outputs: [
                  {
                    address: '5GPAveMvmDsjxVT6Q2xiu5kYPbFAmdebHaiNZK14FBaSaAKh',
                    valueString: '1500000000000',
                    coinName: 'tdot',
                  },
                ],
                spendAmount: '1500000000000',
                type: '',
              },
              feeInfo: { fee: 0, feeString: '0' },
              coinSpecific: {
                firstValid: 17269922,
                maxDuration: 2400,
                commonKeychain:
                  '3cd14f5d60744287cd3a50510e2964746b6feaad4b2300088eaae60d1a35f0abc518534d43b2614370d9a263aadb57edb5d0b78f816a519cd5896e7352920b67',
              },
            },
            signatureShares: [],
            signatureShare: {
              from: 'backup',
              to: 'user',
              share:
                '057c131cde2be39f4ff23eeba11139c46dd8c6d69ff517abede37381d8d24f0b46e84c8b024210202a84f25203e035a2298eb5862da4321f2f5ab804984b2c05',
              publicShare: '50d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c',
            },
          },
        ],
        walletCoin: 'tdot',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: '50d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c',
            R: '057c131cde2be39f4ff23eeba11139c46dd8c6d69ff517abede37381d8d24f0b',
            sigma: 'b30fd8805b2e51a9e2a75338d7fb7edb290be9638debedbfc001d10b8132be0b',
          },
        },
      ],
    },
  ],
};

export const ovcResponse2 = {
  signatureShares: [
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                '0x9004040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c011b370000d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e7365806dcefd64a20c66de6f5abddcf7db171a41bfced6d7d20e28d0c235ae2f',
              scanIndex: 1,
              coin: 'tdot',
              signableHex:
                '04040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c011b370000d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e7365806dcefd64a20c66de6f5abddcf7db171a41bfced6d7d20e28d0c235ae2f',
              derivationPath: 'm/1',
              parsedTx: {
                inputs: [
                  {
                    address: '5HVpFNtexaySsAxL27274TnUCgRYJpHTcXCMJ9uZntXGMUSB',
                    valueString: '1490000000000',
                    value: 1490000000000,
                  },
                ],
                outputs: [
                  {
                    address: '5HVpFNtexaySsAxL27274TnUCgRYJpHTcXCMJ9uZntXGMUSB',
                    valueString: '1490000000000',
                    coinName: 'tdot',
                  },
                ],
                spendAmount: '1490000000000',
                type: '',
              },
              feeInfo: { fee: 0, feeString: '0' },
              coinSpecific: {
                firstValid: 17351537,
                maxDuration: 2400,
                commonKeychain:
                  '3cd14f5d60744287cd3a50510e2964746b6feaad4b2300088eaae60d1a35f0abc518534d43b2614370d9a263aadb57edb5d0b78f816a519cd5896e7352920b67',
              },
            },
            signatureShares: [],
            signatureShare: {
              from: 'backup',
              to: 'user',
              share:
                '9871feb8389e12191b460ebea1f9e1716ada8a31d94ac08f5c15cb5f7be24683f1c5e0e2ab82726bf2e817b0ea8fbe68bf72505b0c6330b205ba67c0f1e42709',
              publicShare: 'f053d177371f4919b71017421aa34841ac87c926a14e8a7e75f092693665cb4a',
            },
          },
        ],
        walletCoin: 'tdot',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: 'f053d177371f4919b71017421aa34841ac87c926a14e8a7e75f092693665cb4a',
            R: '9871feb8389e12191b460ebea1f9e1716ada8a31d94ac08f5c15cb5f7be24683',
            sigma: 'cdfc300ae3e6802c6f4b044dd92ea03d15b92399ab45803e43beb5cbff582a03',
          },
        },
      ],
    },
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                '0x9004040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c011b370000d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e7365806dcefd64a20c66de6f5abddcf7db171a41bfced6d7d20e28d0c235ae2f',
              scanIndex: 2,
              coin: 'tdot',
              signableHex:
                '04040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c011b370000d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e7365806dcefd64a20c66de6f5abddcf7db171a41bfced6d7d20e28d0c235ae2f',
              derivationPath: 'm/2',
              parsedTx: {
                inputs: [
                  {
                    address: '5GkmTAtEHRqhN4xDYQAR1XAct73EuUb6GDVhJ4Rh1Z29LdLa',
                    valueString: '1490000000000',
                    value: 1490000000000,
                  },
                ],
                outputs: [
                  {
                    address: '5Dtg2zKjVEL8p9keSM4dQ7nD26sVtMfCsyxkhvZZ9fqBbhw6',
                    valueString: '1490000000000',
                    coinName: 'tdot',
                  },
                ],
                spendAmount: '9834367',
                type: '',
              },
              feeInfo: { fee: 0, feeString: '0' },
              coinSpecific: {
                firstValid: 17351537,
                maxDuration: 2400,
                commonKeychain:
                  '3cd14f5d60744287cd3a50510e2964746b6feaad4b2300088eaae60d1a35f0abc518534d43b2614370d9a263aadb57edb5d0b78f816a519cd5896e7352920b67',
              },
            },
            signatureShares: [],
            signatureShare: {
              from: 'backup',
              to: 'user',
              share:
                'd153cbb683706ddf320f7b225af14ce4b59b868c07440aefa4c4e1297e49bcd5e9bc4836a113bb93a578dc32dcde7add987b4778716960677a9d15e9972ee60d',
              publicShare: 'cf7ed9f536373c8f874e780a4269ec1bd6799ed7d4a854c670b0c72805fac876',
            },
          },
        ],
        walletCoin: 'tdot',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: 'cf7ed9f536373c8f874e780a4269ec1bd6799ed7d4a854c670b0c72805fac876',
            R: 'd153cbb683706ddf320f7b225af14ce4b59b868c07440aefa4c4e1297e49bcd5',
            sigma: 'f6ee84f696b0c2e456e2a7f8779a78a2c832dfb47d5b283eba8408b003c7dd03',
          },
        },
      ],
    },
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                '0x9004040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c011b370000d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e7365806dcefd64a20c66de6f5abddcf7db171a41bfced6d7d20e28d0c235ae2f',
              scanIndex: 3,
              coin: 'tdot',
              signableHex:
                '04040050d1e116cdb32e61ba3ece275b620f503f0c5ae4e7690d9f9aa7e0b50303976c011b370000d624000016000000e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e7365806dcefd64a20c66de6f5abddcf7db171a41bfced6d7d20e28d0c235ae2f',
              derivationPath: 'm/3',
              parsedTx: {
                inputs: [
                  {
                    address: '5FRRmEcdMfFvfF86v9Sv5BJdanVaoZkogEqLA3LjSmnMLmWo',
                    valueString: '1490000000000',
                    value: 1490000000000,
                  },
                ],
                outputs: [
                  {
                    address: '5Dtg2zKjVEL8p9keSM4dQ7nD26sVtMfCsyxkhvZZ9fqBbhw6',
                    valueString: '1490000000000',
                    coinName: 'tdot',
                  },
                ],
                spendAmount: '1490000000000',
                type: '',
              },
              feeInfo: { fee: 0, feeString: '0' },
              coinSpecific: {
                firstValid: 17351537,
                maxDuration: 2400,
                commonKeychain:
                  '3cd14f5d60744287cd3a50510e2964746b6feaad4b2300088eaae60d1a35f0abc518534d43b2614370d9a263aadb57edb5d0b78f816a519cd5896e7352920b67',
                lastScanIndex: 20,
              },
            },
            signatureShares: [],
            signatureShare: {
              from: 'backup',
              to: 'user',
              share:
                'e255698d110977faf33efb3336ba98ad7eaa2a1a926487fc696a277442d4414bebdd646626bde65ef29a0a0977da24dda638440f9418015121cb21c2c235440b',
              publicShare: '9482ad7e43b40b7df3383244daafed32b3b9fd7541016b5c907f2d9052f85f86',
            },
          },
        ],
        walletCoin: 'tdot',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: '9482ad7e43b40b7df3383244daafed32b3b9fd7541016b5c907f2d9052f85f86',
            R: 'e255698d110977faf33efb3336ba98ad7eaa2a1a926487fc696a277442d4414b',
            sigma: '2a441ba92d598f2b1f96f13b28785f5e572984035a608d63c48bd35ba955090e',
          },
        },
      ],
    },
  ],
};

export const wrwUser = {
  userKey:
    '{"iv":"BJifMTDKIWs26T0sLhmQNw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"CR5VO6Zc1no=","ct":"g8M2XrlRYkL4Io\n' +
    'Y5fmZeNdnsBXymx7o5xR5Ei9zRNd8mgCz2cBYPGsNCMjm588XwuIi7Wboil3DZy1+sPni66UXgl\n' +
    '6N14mPfz7WjGkQSfitVto/QEkupTFXMO8+8px11FkRvnJ7niI0hYYKMMiqttC0Dr21XIqey5c9J\n' +
    'QtKvyH7vMjAvUMKNOx1RFeBH8CWhcxZqcJ6pktjxYM3zbwiAdQPynh6HYK91ljqBJ1EUke6a/hM\n' +
    'IDpptUU73tzrfarBtHV/7qKIAHDbFsSUV341Nus3yMQpJ5Iegn+5plbgKXlMxRhU3WQrk18DFFZ\n' +
    'b3czHicGdFlFQ3FQk4iXkadBSIYU0Svxd1Jvw1p+gkhPKMBgsFQ8CT2bObkh6unXJ5WuqSJ6hWc\n' +
    '9eCeJfzunz6zvPAjJ5yB3nxx0p86Ai2G8gqJlJBRXa7pnJcpsrcLxfYo7p2q/nbrLvdYxecvGop\n' +
    '4W2bfXpSv+3Oq/IaKtu+xcFdE3uytW1AAiEEOWjz3W+tlgRjrYXCJ8rezZ5gs8R2xUeZUKJfpgF\n' +
    '89INGPK6xUtbFRYomCIxEj1QBMwaS0uKYfwJKkFg07TE7uURnzTUOnfqpJJzOThHDOMwIE/xulB\n' +
    '6Kfk6GUn7PTXGFgAIgi7pPIbOMPfvZSkQjU+MRfVB/saretRlHKssUOo2V6FHaqy/T0sC7vdxZY\n' +
    'taUidSTGzYU/13SvZ3isguGnbZVADDIA6pyMxl2sgo4WaZEdSOZK8Ge31c+8bsAXF/zoIEYd0wv\n' +
    'fi3nST/hgM4fUpPYYvUTKS+CVT71prGy5mvHTx1mf1/VtDVuOG6dFNQcsacuL8oTHNRLyd0/r80\n' +
    '6qXrVQ4Nb3Y0cUD0kFpCXh/fxo/eGECdhQdc9s7ASarwHmD7C41FcEI5TodBUvoLtOsDjSlkYY1\n' +
    'Gh8lOrCcpo/qKRJllgKBiOHfKn3AAOx3yPZa7zQTPRX5AlTVtPMV/FIwWjsfxXPCGuxFCpSeRAo\n' +
    'Mk4JYZ+t2wwFCiJl55II3SoCVg="}',
  backupKey:
    '{"iv":"7ImZQkc5WKJpMcRvEFIR4Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"7W6tMEuyvyA=","ct":"igLPbrjaR1vyLM\n' +
    'LaYeVuluRqMQftsn82djpiaJiY+RlAF8VMlJP1+TQFNDjRfwQicfucuGX/m5icmxLuZmW3eTXuU\n' +
    'L2sQ9hBk4HaFN3ic8ckNiaG2ssY/Aj3HNno8D+l4mGTmBrlaNl1qob4Ccl9AK94jYhDoViGg18Z\n' +
    '8UIRqXDo91oz4omFE0GTclfiHh/OytS3Pc92aGb8Zt5JIzOAwju7vy0R52m6G4y2I3t4Q2hyiRX\n' +
    '6uIRuRyUBj4UnXcbV5vC7HHyQIGsdPbQJb4zvXi2MQRjXwybnnUdJEXCCkufNkuKn/VelFtkrZp\n' +
    'l7Poz8RBHKQs3WAniYoyq/OBgiNbFallXqVqVBVOK/rgNbN81m1P9yFRXaxMM5X59W1MjLS2nvH\n' +
    'KWoe7Mgg9auLe1YYy72eEyqaUcnywN4mfwfXX0GRr6NwIna+X3LbgIpYqytJuj7e9YdBxI6oBlN\n' +
    'XIGErEYQJSJhT5AEIwkDreI2PcOeOw3aOG5LFJmHeVWksWQdklWCXjXOQMCUs/Bwk0z74Mfmkot\n' +
    'koi8h/Wp40i1oYF3NC4GQawDVxZ+NECLtsZma6R96SswI/RXsKC102nELM/3D4/RjXzB/OFZO8k\n' +
    'uTLdpAH4c6S39mbDai/XYm+fxYJxtJVaL28TNRZHYc6p6tzO7fHozUjh/CrGEJa4IksYXNVQRaH\n' +
    'k1fBugDw0co54vOdsJEIiZ4uj718/VEWw5q9qS00I47bZGO6cjyoJejzy70f3U2At28B3K+VLvT\n' +
    'CKmEWNhnZsGJavjONp8DGJyWQMqSpmzkNTuP6pRRfzaU5yF95jvr+0oZG64lRQhaal5B2Zp5LJo\n' +
    '6c8bdYRNzZw6b3omk0RHtltv4avS7K9gsgV5S9BccLUKC3oM8jBkuzxps7ZzJUZoyNIvOD9/U8E\n' +
    'c1rkxh/+bBcACIWGNxDt9AmC87f1+098VtbTBOm3ju/8hhTSVtEdwLXhZuhFH4NwMMTOKIMgEp0\n' +
    'RtdCxRIZJQCcn9qiaG7oWHX"}',
  bitgoKey:
    '2f209ca7f5c749d36813468dced481af1bc843fc45d990241bd57eee7991f9ea109f534e543\n' +
    '6a45cbe94bb61ba64e103389f18333004efd4cd15457957b5ff67',
  walletPassphrase: 'Ghghjkg!455544llll',
  walletAddress0: '5DT27GZcKRumteFW6PDpLaA64TbnKGoHpYbSYrCrFfTLhsq2',
  walletAddress1: '5CTtvzgJGjV3HJdv7uKgpd7N4McYhivkMf1r2ZBhtzPatMCF',
};

export const consolidationWrwUser = {
  userKey:
    '{"iv":"DPB6lAnkLqyWzo32COTyKA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"' +
    ':"ccm","adata":"","cipher":"aes","salt":"SG1wZ8DdSu8=","ct":"qDwb1WSdqg2WFm' +
    'B6d0PYLc9IBNK7whqochK4PtR1JjtON5LfYZjt+BZQGml4r5lDDwjCePDZTSq/s6/l2lMnkccFU' +
    'FYl/NOYA4QbSvHqG8xU5vF3lVlGbMKIi1TZqb3/U19+SDn7Sow0tDWnRS+3lZBDh5/Q5KWYwskZ' +
    'JAkPOJ4mirvg6xZHCxvsF1KDlOVBcsSxgUTAdiVf3sz13GuHxisxMbiMu4sATeBC0K0xW3IKsg9' +
    'ivsJkFVgpQy89SPFlYBL4JDM6Q0bS+TIGkH+Yh62psNrlNOu9pa7l3V7We985+iMVgrxl/nfA8W' +
    'GiqJxt27+vYo5OOCj+VR7V3BMrJ+wN2rCr1ouuPSCcPhKz1I5BeH1PCRzMXLDlAneIE6zr2XTKS' +
    'SRan1SRzfB/7Ld8CX+r5UoYzE/6yB09kgBnEvjXoX6PLtgpfFwL6rOX6oEgD3baRv7G8EFTjBVU' +
    'qxUxnom7+qjoFreP2hDpX2NsZDGVfJRLMJR/ZEcbjiuMF5mdWVt7cAhklfhm1qwtwIlQrvwPMCh' +
    'ELLx6TQRXKGlQ3fJiVOe7L7ixplncazQKn9yHJKYfoeMXvc2q2nlf7GnEeCuqHdVuF4Wc9Wpl+r' +
    'miR1HhrMcfxdTXKjIh8QLiPN7DDRc2YTXjZssifo2M0HiWln7BH2paB0qDfMh0DUYGI0cUIT47x' +
    'AfV36QsL/UZDg2JP68zQ4+ScdE/v9JrPHQ5TlJ3naWLOD2oQZQss5C26tc8P03mDK/7i+asLsTm' +
    'LF+BgR7vs+VSMMxvIY9PsdJ5cB9igvFRVl+7+5B6B80RoU49F8NdbBzZGNKL8DOIhe0q2pDNMV4' +
    'honilhmD5lDmqFa6nTt+ddiDXVTH/Ve95KCgre+XS2h05dXDN63lBqN+M2BGNoc3yyz/MkT7ODl' +
    'RjM5mbqaS1wsJLjUUvcfLLZJ5ie7uXtirt1yS80VdPKieBrry8f9nvtIuPQ10I1/hRWVMfQJC9L' +
    'Q4zqbOqLVDfY9Fr/su3NpX/B2CfjMBe+nfknVEbImNpXaGzJxqrr3hwcNxxhULVS5tSvplKJM5S' +
    'TcarMjN+KoDbTefmApaE2kLinwXX4EHBIR7c8WESdIEgqiNB3/6UT8k3ZmUlji4TmA5RxcbZp2U' +
    'L1NqbtOrmrYGmOdeoDXxgwSSY5UT8kKa8QLAbA3C16Fbsu6FJmrvLtw5iwb39tFpJ"}',
  backupKey:
    '{"iv":"wiVhUZWI/zCyD+6LpRChjQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"' +
    ':"ccm","adata":"","cipher":"aes","salt":"jhSZXteQa5I=","ct":"yJmTSpfZS2Vu+3' +
    'tvawtfjsxs2w56wpeXTTuIhM7ly1WIewF3/FDF9StYYuzWJM+K+aafmGSWWVharw6G1WnzbR0qz' +
    'gsFfmpVbO7IcrUM3SRs7ITw0TiScKUe0KSE1qSYLWt/iI54LzMxmnbQNePX1cvYMMW3U9Skd0ES' +
    'c2/fPgRrEvyZ7TIj+BUQylocAf7DA6fks3AIqdk9fd/CiPkarlXxIGuz0Udk7jvzV5319jE0eXb' +
    '8cp95W7dE6l9E6p1Nnd9kaaews4NFL7R1JFA/DAFnyNFkvBdjOUMb7Ql628F+HVjfS/MUMrBAB8' +
    'HqKmkY7hXd1ypTD/hCpgVAoA4kwZUVNs72BYqinoVdRm7oaYrV8R57JFjfr7Ujplyl0rwLN+bxh' +
    'Ju73HvaCaFh+pRvxbdrTiclSEBLF8am94/KHURHscFxH64LwrMMb/DaFHAX1F/R3o/DfonDtC8v' +
    'yacph9yFgu9QxrrGjXMyQIay8GFSwOPnHOHC2KHwGD+jXtLDTzXWXP0YbejzJWlGLrFDh0bNzhv' +
    'GXAgRMcleMcTiSimBe1Ml7u3vVrioq8jn8wU6lSZPvCYp//yF/RHVV7Qp6FCpH7r66amkWkIs+n' +
    'XFw/HHoJvYrdylO6UP/q8v8bar2zzezmdyd2dNLsjEf0OazAyDeM7iqK9JHo8rB0E2iz7jOwZ/2' +
    '/lbx5grCSy0bhR0KrT/K1UQybkqyWrk5rmhOyIVMqOnDbz2r205s8CeMP4QX3skhQPurFXTMe3J' +
    '60Bqk87YsTipEBqzflw4NaiNFeGbmMbU31HN1gaUekiC/6hD8PeFSleRQRrdgHTsa36qXKz8aFT' +
    '+srzxtY5jTCghNtTser8ydbeOypg3/zJDntZnwKEIg7fV68mqnyOndzF2cRsYQ5fzQSopaZjH9I' +
    '+sv+G8Bmc7rBXNV1M0RrpzvnzN38m197C5b4hMS/aMo1MFL/VPAIof43VYgASzs7eUvfXAuRHHX' +
    'HnovoIixbdxKtFBaZmMDiJW60zRVc0X1rK3v1jD8jX2exiyhDM641WgVBo70KZmqNK3mlKLmODY' +
    'ImXZd1jz/pknG8ixJsE6xIdOpI2ZpUV7BuD55kkUyWSeiLGrzMKgBp1cbL/STXTCOjc6qTrvGw5' +
    '7AIdQzpYzRUKfcdFCOM50HV41tIM27KONqWVbMtai8v49bLylnx7h+ThJzjK76A=="}',
  bitgoKey:
    '24693306a9c03db718dd4be5527688bfa1860d3fe462838c2305ca1c1bccd3eece236b3cf4e' +
    '2af8f9a10dcea861d5273137820083e9eff05ed089e4988cee125',
  walletPassphrase: 'Ghghjkg!455544llll',
  walletAddress0: '5GPAveMvmDsjxVT6Q2xiu5kYPbFAmdebHaiNZK14FBaSaAKh',
  walletAddress1: '5HS1u25BhdBLA1xkSLjppsjn7tbfrjwd9svpMRpKxuctDk28',
  walletAddress2: '5DnDaCroHD9qGoxh9GELqDWBFhJ4UDHywwbb5zeC5DTQZGXv',
  walletAddress3: '5ENNdRwfFXzTHK3tWq3ZHfGHG3RfXMYPbwieok2ajEniHcuf',
};
