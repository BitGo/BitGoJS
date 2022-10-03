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
