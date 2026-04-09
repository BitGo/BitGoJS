export const TEST_ACCOUNT = {
  pubAddress: 'mantra178596utuac8l9tkj25afvwz8l7d7684kkswjlj',
  compressedPublicKey: '02bcdbd054a73aa6097c1926c87eb7d66142d2ea710584c4b3e9844e1dab1538f0',
  compressedPublicKeyTwo: '02001fda4568760a99e58ee295b4a51edcc6a689297a71f7d1571cf4e1253abcde',
  uncompressedPublicKey:
    '04bcdbd054a73aa6097c1926c87eb7d66142d2ea710584c4b3e9844e1dab1538f0a088291e83cb3438431deb5e251439e338d8edc4389ea2004f442a73cc97afc8',
  privateKey: '3f020639e98e5c4953abb23d01a7c892e83b57593a7f46f37298b58cbf1cacd5',
  extendedPrv:
    'xprv9s21ZrQH143K3n6kDURwkfkBxB58Fxoz7cFCbpQeFws4K5iXaSUcpq18cCqJQ74MnqNrnLBHfE7YvUgKpnckmpsBLExGSRK55Ud5uuxGrxL',
  extendedPub:
    'xpub661MyMwAqRbcGGBDKVxx7ogvWCucfRXqUqAoQCpFpHQ3Bt3g7ynsNdKcTWvGGYrpq6VYPPgxjMfKaszXMhKmmCZEnhg9RpqcGeP9uCnZsD9',
};

export const TEST_SEND_TX = {
  hash: '8603909AFBEA9D14D2162842A298C756EB397B25B2BBA2448DBF4A8C083B3AC4',
  signature: 'zc0JPNhaCap/5MYzWudOzLniUWdxOIYm8pFMQ1Ee4vN1AGw3cDb7NLjyisVPahwr9SDdDNkayIZypdXfKnxNFw==',
  pubKey: 'Az+k0qZ7H0aIik2+5KOWIkWMx5BlIVCjSbrx6hyDp///',
  privateKey: 'tEqy+qiR3NOJriVL2RrIon3PVDSzJ3SvrkfHr6yImKQ=',
  signedTxBase64:
    'Co4BCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKLW1hbnRyYTE1OGpwdzB4OTZ4aDQ2MG1wMm14cHlwejg2N3E4ang3aGhkbWx4eBItbWFudHJhMThmYXZwc2owczhoZnkyajAwZTg5cHFtcHA5bmRmbDAzYTZhN3ZqGgsKA3VvbRIEMTAwMBJkCk4KRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDP6TSpnsfRoiKTb7ko5YiRYzHkGUhUKNJuvHqHIOn//8SBAoCCAESEgoMCgN1b20SBTEwMDAwEMCEPRpAzc0JPNhaCap/5MYzWudOzLniUWdxOIYm8pFMQ1Ee4vN1AGw3cDb7NLjyisVPahwr9SDdDNkayIZypdXfKnxNFw==',
  sender: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
  recipient: 'mantra18favpsj0s8hfy2j00e89pqmpp9ndfl03a6a7vj',
  chainId: 'mantra-dukong-1',
  accountNumber: 6,
  sequence: 0,
  sendAmount: '1000',
  feeAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uom',
          amount: '1000',
        },
      ],
      toAddress: 'mantra18favpsj0s8hfy2j00e89pqmpp9ndfl03a6a7vj',
      fromAddress: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const TEST_SEND_TX2 = {
  hash: '01AAD63BB1BA07029DBD70900F33AC86FC3F57EE2C15A4D673286F3A48D36CFF',
  signature: 'ziYescvLMoVrj6W+WKxBV7q2VSibNscuh89+HH04R+4ZpbYLjcf3XueK8nx8FfPBrkx8blkTVUdcVxO6Y+El3g==',
  pubKey: 'Ak1wvPF1Ue6scjAWNkKjmtS/9+JajLstkoZWVup9tB+c',
  privateKey: 'QAzeAkPSTKyRT8/TvJcRC7VSzQHV9QhH9YTmGZbnvmk=',
  signedTxBase64:
    'Co4BCosBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmsKLW1hbnRyYTE3ODU5NnV0dWFjOGw5dGtqMjVhZnZ3ejhsN2Q3Njg0a2tzd2psahItbWFudHJhMTU4anB3MHg5NnhoNDYwbXAybXhweXB6ODY3cThqeDdoaGRtbHh4GgsKA3VvbRIEMTAwMBJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECTXC88XVR7qxyMBY2QqOa1L/34lqMuy2ShlZW6n20H5wSBAoCCAEYAhISCgwKA3VvbRIFMTAwMDAQwIQ9GkDOJh6xy8syhWuPpb5YrEFXurZVKJs2xy6Hz34cfThH7hmltguNx/de54ryfHwV88GuTHxuWRNVR1xXE7pj4SXe',
  sender: 'mantra178596utuac8l9tkj25afvwz8l7d7684kkswjlj',
  recipient: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
  chainId: 'mantra-dukong-1',
  accountNumber: 9,
  sequence: 2,
  sendAmount: '1000',
  feeAmount: '10000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uom',
          amount: '1000',
        },
      ],
      toAddress: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
      fromAddress: 'mantra178596utuac8l9tkj25afvwz8l7d7684kkswjlj',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: '03B141CC860C02DE95FB1CFD69512E9E3894FD10A3D9F21521493804694483DE',
  signature: 'f/qHRQWW4/k1FliQaZ5JEsUvS4JvMCKb55RnVHucSHhdUB69EzuFyykUf/jrV05uzO04qeYqNTdSreJY0+angw==',
  pubKey: 'Az+k0qZ7H0aIik2+5KOWIkWMx5BlIVCjSbrx6hyDp///',
  privateKey: 'tEqy+qiR3NOJriVL2RrIon3PVDSzJ3SvrkfHr6yImKQ=',
  signedTxBase64:
    'Cp4CCowBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKLW1hbnRyYTE1OGpwdzB4OTZ4aDQ2MG1wMm14cHlwejg2N3E4ang3aGhkbWx4eBItbWFudHJhMThmYXZwc2owczhoZnkyajAwZTg5cHFtcHA5bmRmbDAzYTZhN3ZqGgwKA3VvbRIFMTAwMDAKjAEKHC9jb3Ntb3MuYmFuay52MWJldGExLk1zZ1NlbmQSbAotbWFudHJhMTU4anB3MHg5NnhoNDYwbXAybXhweXB6ODY3cThqeDdoaGRtbHh4Ei1tYW50cmExbTQ5M3R4dWMyamgweno4NDJ3anNhbWh0NmhzeTd0NTA2dDQwcnEaDAoDdW9tEgUxMDAwMBJmClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDP6TSpnsfRoiKTb7ko5YiRYzHkGUhUKNJuvHqHIOn//8SBAoCCAEYChISCgwKA3VvbRIFMTAwMDAQwIQ9GkB/+odFBZbj+TUWWJBpnkkSxS9Lgm8wIpvnlGdUe5xIeF1QHr0TO4XLKRR/+OtXTm7M7Tip5io1N1Kt4ljT5qeD',
  sender: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
  chainId: 'mantra-dukong-1',
  accountNumber: 6,
  sequence: 10,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uom',
            amount: '10000',
          },
        ],
        toAddress: 'mantra18favpsj0s8hfy2j00e89pqmpp9ndfl03a6a7vj',
        fromAddress: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uom',
            amount: '10000',
          },
        ],
        toAddress: 'mantra1m493txuc2jh0zz842wjsamht6hsy7t506t40rq',
        fromAddress: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: '5D0FB282B1F0162392690018E1C8D20565532832EEFF8C63B4924996CC3C2E54',
  signature: 'qdQ3IadfZi9Y5ZXta+/p2Hd516RevlEhBTP3WoAiiyxi2uOTonLOrnX+6tKbEJyMybBYhWnKTMsr+tO87czMOw==',
  pubKey: 'Az+k0qZ7H0aIik2+5KOWIkWMx5BlIVCjSbrx6hyDp///',
  privateKey: 'tEqy+qiR3NOJriVL2RrIon3PVDSzJ3SvrkfHr6yImKQ=',
  signedTxBase64:
    'CpgBCogBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmgKLW1hbnRyYTE1OGpwdzB4OTZ4aDQ2MG1wMm14cHlwejg2N3E4ang3aGhkbWx4eBItbWFudHJhMThmYXZwc2owczhoZnkyajAwZTg5cHFtcHA5bmRmbDAzYTZhN3ZqGggKA3VvbRIBMRILMTIzYWxwaGE3ODkSZgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAz+k0qZ7H0aIik2+5KOWIkWMx5BlIVCjSbrx6hyDp///EgQKAggBGAgSEgoMCgN1b20SBTEwMDAwEMCEPRpAqdQ3IadfZi9Y5ZXta+/p2Hd516RevlEhBTP3WoAiiyxi2uOTonLOrnX+6tKbEJyMybBYhWnKTMsr+tO87czMOw==',
  from: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
  to: 'mantra18favpsj0s8hfy2j00e89pqmpp9ndfl03a6a7vj',
  chainId: 'mantra-dukong-1',
  accountNumber: 6,
  sequence: 8,
  feeAmount: '10000',
  sendAmount: '1',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uom',
          amount: '1',
        },
      ],
      fromAddress: 'mantra158jpw0x96xh460mp2mxpypz867q8jx7hhdmlxx',
      toAddress: 'mantra18favpsj0s8hfy2j00e89pqmpp9ndfl03a6a7vj',
    },
  },
  memo: '123alpha789',
  gasBudget: {
    amount: [{ denom: 'uom', amount: '10000' }],
    gasLimit: 1000000,
  },
};

export const address = {
  address1: 'mantra178596utuac8l9tkj25afvwz8l7d7684kkswjlj',
  address2: 'mantra1r6yj27sh3c982dh34qkw8yvrw2l5f0z9q6u8c0',
  address3: 'mantra19syhqw5qeuas365cw9pvdadzax7durfm7hlfn8',
  address4: 'mantra1ukzj0eme6srq8rtghy6zatk3gshw0ysr3pmjy9',
  address5: 'mantra1ea4hlqfskjvn0ldenw8gv7jjdzrljcchm9vhhu',
  address6: 'mantra1q8mgs55hfgkm7d5rret439997x87s2ekwcxlv0',
  validatorAddress1: 'mantravaloper1q8mgs55hfgkm7d5rret439997x87s2ek2r83q2',
  validatorAddress2: 'mantravaloper1ea4hlqfskjvn0ldenw8gv7jjdzrljcchl7deme',
  validatorAddress3: 'mantravaloper18@#jywgf0qt4q40tnr9rmzyjmccawyknyswhz',
  validatorAddress4: 'mantravaloper1sa#@$flmge66azvp064mcxusfk5exu3ymw772',
  noMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz',
  validMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=2',
  validMemoIdAddress2: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=xyz123',
  invalidMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=-1',
  invalidMemoIdAddress2: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=1.23',
  multipleMemoIdAddress: 'mantra1zq5k0rcah0g4pmfqez0f6u92h39fwp4rttw4yz?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: '9D6D343A178ED6BEF8F9E8AA8B9F8D1ADE25262BDAB3F129A9ABB709207D51DF',
  hash2: '2833B5EAB34985A31DDE2B61827EC0A68D5D4F9441D83996CCCCEA986FEA5BD3',
};

export const txIds = {
  hash1: '350DBA4C1626EFE60AD528553942DE065BA57D4E39C6814730E0A58A948CBC46',
  hash2: '4947385C287BD976840C6FCCE8C09AF92AEC7BF9CC68087C3DC4314938646EE4',
  hash3: 'E70FF78E8FF92EE7D601545B175B6756F31F2121E219241706ED6A892BF9695D',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uom' },
  amount2: { amount: '1000000', denom: 'uom' },
  amount3: { amount: '10000000', denom: 'uom' },
  amount4: { amount: '-1', denom: 'uom' },
  amount5: { amount: '1000000000', denom: 'mom' },
};
