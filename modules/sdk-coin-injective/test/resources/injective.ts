// Get the test data by running the scripts for the particular coin from coin-sandbox repo.

export const TEST_ACCOUNT = {
  pubAddress: 'inj1vftzm2nnlt0x8z9gq2hgxxywlk79m8k7k3ljgk',
  compressedPublicKey: '0332363e3dfdccd329423bb0cdc0aaebf9dc8c8d2acbedd21a77e232bb84c1c7dc',
  compressedPublicKeyTwo: '03b0068d1db966573288f500e14d7fae04b5d083b7b500789e6eb03ce21413e6bc',
  uncompressedPublicKey:
    '0432363e3dfdccd329423bb0cdc0aaebf9dc8c8d2acbedd21a77e232bb84c1c7dc73c75bd6565b0dfaaad8ea4af5c9676a2e1ee0397dddcb633b56923daec4a2a3',
  privateKey: '20753d58ed0e87834f154ce7e94c278875927d4d05227c1b892a9796aa3bc9dc',
  extendedPrv:
    'xprv9s21ZrQH143K2P9CmgFZfiStbbt296pytKe7gUVpw1vvgcP13XxoJVHJ31CoSKGrFRBaQCbvFS5K1u1NXepG1WyBRyVw1faMh8C7StC25R9',
  extendedPub:
    'xpub661MyMwAqRbcEsDfshna2rPd9diWYZYqFYZiUruSVMTuZQi9b5H3rHbmtJK8ZBxPz8oL6x4PegXqZ8Xsdn4akea8qY4GddQubaidVGsmQQW',
};

export const TEST_SEND_TX = {
  hash: '12A20E2A5A2B54827A9B007D024D269E01957749E762706C3744BC76C56D4A81',
  signature: 's1wGhKeNOhdn4gFDMxRP/tFbQ/fQS1vt99A5J7/dxaZONLN4+PFtFVA0Ey1iqvojSrMGeYZg4i0PyzHvK+54Vg==',
  pubKey: 'AhvHHUQYuVrRbuUbrfX8NDqsQ/9swswreoiyzcg8L9bw',
  privateKey: 'hrLO1X8Z5PVyDlBji5HjgrETVatKBmJhTZjg9Oq7b18=',
  signedTxBase64:
    'CosBCogBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmgKKmluajE1cHo2ZnE2NTJjbWUwZ3g2ZGQyejl3dHphM3J3bXo5ajR5d2tzZBIqaW5qMWRybjN2emc2eGVwNjNwdGF4c3loajZweTVhajhmeTNkNDMwM3AwGg4KBHVpbmoSBjEwMDAwMBJwClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECG8cdRBi5WtFu5Rut9fw0OqxD/2zCzCt6iLLNyDwv1vASBAoCCAEYHhIcChYKA2luahIPMTAwMDAwMDAwMDAwMDAwEMCaDBpAs1wGhKeNOhdn4gFDMxRP/tFbQ/fQS1vt99A5J7/dxaZONLN4+PFtFVA0Ey1iqvojSrMGeYZg4i0PyzHvK+54Vg==',
  sender: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
  recipient: 'inj1drn3vzg6xep63ptaxsyhj6py5aj8fy3d4303p0',
  chainId: 'injective-888',
  accountNumber: 13079,
  sequence: 30,
  sendAmount: '100000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uinj',
          amount: '100000',
        },
      ],
      toAddress: 'inj1drn3vzg6xep63ptaxsyhj6py5aj8fy3d4303p0',
      fromAddress: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
    },
  },
  gasBudget: {
    amount: [{ denom: 'inj', amount: '100000000000000' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: 'CFE83BCC9BDA9E4E51E3E03F772B7CAEFEE9E74E00F223B26C5AB3A8B7F3B44A',
  signature: 'p5UoOHBw7mWPt4RA5ZNc9gOjcbIlYKx3/wz/cnHeTXVawu/kJ0Fr0TpfrTaZWvmstGaAUk1k5d5sM4b5ZIgIAw==',
  pubKey: 'AhvHHUQYuVrRbuUbrfX8NDqsQ/9swswreoiyzcg8L9bw',
  privateKey: 'hrLO1X8Z5PVyDlBji5HjgrETVatKBmJhTZjg9Oq7b18=',
  signedTxBase64:
    'CpgBCpUBCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJuCippbmoxNXB6NmZxNjUyY21lMGd4NmRkMno5d3R6YTNyd216OWo0eXdrc2QSMWluanZhbG9wZXIxa2s1MjNyc205cGV5NzQwY3g0cGxhbHA0MDAwOW5jczB3cmNoZmUaDQoEdWluahIFMTAwMDAScApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAhvHHUQYuVrRbuUbrfX8NDqsQ/9swswreoiyzcg8L9bwEgQKAggBGCASHAoWCgNpbmoSDzEwMDAwMDAwMDAwMDAwMBDAmgwaQKeVKDhwcO5lj7eEQOWTXPYDo3GyJWCsd/8M/3Jx3k11WsLv5CdBa9E6X602mVr5rLRmgFJNZOXebDOG+WSICAM=',
  delegator: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
  validator: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
  chainId: 'injective-888',
  accountNumber: 13079,
  sequence: 32,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
      validatorAddress: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
      amount: {
        denom: 'uinj',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'inj',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '2B373B66F359368527BDD9E40D716B3D66B46EDA048164BE00E655109A3FA374',
  signature: '750kQqYHaQ22TUCX2O1TaGKiSeetFlUl7B4J3ZplohZrfRylW4K/MGNh1mQ7oisUD065o4howrvn0DcMtxWIdQ==',
  pubKey: 'AhvHHUQYuVrRbuUbrfX8NDqsQ/9swswreoiyzcg8L9bw',
  privateKey: 'hrLO1X8Z5PVyDlBji5HjgrETVatKBmJhTZjg9Oq7b18=',
  signedTxBase64:
    'CpoBCpcBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEm4KKmluajE1cHo2ZnE2NTJjbWUwZ3g2ZGQyejl3dHphM3J3bXo5ajR5d2tzZBIxaW5qdmFsb3BlcjFrazUyM3JzbTlwZXk3NDBjeDRwbGFscDQwMDA5bmNzMHdyY2hmZRoNCgR1aW5qEgUxMDAwMBJwClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECG8cdRBi5WtFu5Rut9fw0OqxD/2zCzCt6iLLNyDwv1vASBAoCCAEYIRIcChYKA2luahIPMTAwMDAwMDAwMDAwMDAwEMCaDBpA750kQqYHaQ22TUCX2O1TaGKiSeetFlUl7B4J3ZplohZrfRylW4K/MGNh1mQ7oisUD065o4howrvn0DcMtxWIdQ==',
  delegator: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
  validator: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
  chainId: 'injective-888',
  accountNumber: 13079,
  sequence: 33,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
      validatorAddress: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
      amount: {
        denom: 'uinj',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'inj',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '55FBC9C1AC8674FFFAB1A80DAF928BC344DCBFE12876844C9E5FF08CD3FDE2F6',
  signature: '3sAfy+B22YFY0iLLrJCBHvKYlYwtaUARBswcDUCfnP4mZPwkS7vI9CEEyg23AYahndYHxQG0W1IbSHeiNf909Q==',
  pubKey: 'AhvHHUQYuVrRbuUbrfX8NDqsQ/9swswreoiyzcg8L9bw',
  privateKey: 'hrLO1X8Z5PVyDlBji5HjgrETVatKBmJhTZjg9Oq7b18=',
  signedTxBase64:
    'Cp0BCpoBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEl8KKmluajE1cHo2ZnE2NTJjbWUwZ3g2ZGQyejl3dHphM3J3bXo5ajR5d2tzZBIxaW5qdmFsb3BlcjFrazUyM3JzbTlwZXk3NDBjeDRwbGFscDQwMDA5bmNzMHdyY2hmZRJwClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECG8cdRBi5WtFu5Rut9fw0OqxD/2zCzCt6iLLNyDwv1vASBAoCCAEYIhIcChYKA2luahIPMTAwMDAwMDAwMDAwMDAwEMCaDBpA3sAfy+B22YFY0iLLrJCBHvKYlYwtaUARBswcDUCfnP4mZPwkS7vI9CEEyg23AYahndYHxQG0W1IbSHeiNf909Q==',
  delegator: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
  validator: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
  chainId: 'injective-888',
  accountNumber: 13079,
  sequence: 34,
  sendAmount: '10000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
      validatorAddress: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
      amount: {
        denom: 'uinj',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'inj',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'A9696BBAFE896A81DC4B339F3419361ECFE8EF6B6792FC2EA4F081962DF2B138',
  signature: 'QzTMK2mw2/tVw2t4En+2V/C5T2Iy/41tJ216GLJPWCgd7USBdDRsXrROwbGoxYi71hMvs58/DEAUaM7f8uGk0w==',
  pubKey: 'AhvHHUQYuVrRbuUbrfX8NDqsQ/9swswreoiyzcg8L9bw',
  privateKey: 'hrLO1X8Z5PVyDlBji5HjgrETVatKBmJhTZjg9Oq7b18=',
  signedTxBase64:
    'Co4BCogBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmgKKmluajE1cHo2ZnE2NTJjbWUwZ3g2ZGQyejl3dHphM3J3bXo5ajR5d2tzZBIqaW5qMWRybjN2emc2eGVwNjNwdGF4c3loajZweTVhajhmeTNkNDMwM3AwGg4KBHVpbmoSBjEwMDAwMBIBNRJwClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECG8cdRBi5WtFu5Rut9fw0OqxD/2zCzCt6iLLNyDwv1vASBAoCCAEYHxIcChYKA2luahIPMTAwMDAwMDAwMDAwMDAwEMCaDBpAQzTMK2mw2/tVw2t4En+2V/C5T2Iy/41tJ216GLJPWCgd7USBdDRsXrROwbGoxYi71hMvs58/DEAUaM7f8uGk0w==',
  from: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
  to: 'inj1drn3vzg6xep63ptaxsyhj6py5aj8fy3d4303p0',
  chainId: 'injective-888',
  accountNumber: 13079,
  sequence: 31,
  sendAmount: '100000',
  feeAmount: '100000000000000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uinj',
          amount: '100000',
        },
      ],
      toAddress: 'inj1drn3vzg6xep63ptaxsyhj6py5aj8fy3d4303p0',
      fromAddress: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'inj',
        amount: '100000000000000',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'inj15pz6fq652cme0gx6dd2z9wtza3rwmz9j4ywksd',
  address2: 'inj1drn3vzg6xep63ptaxsyhj6py5aj8fy3d4303p0',
  address3: 'inx1xxn3vzg6xep63ptaxsyhj6py5aj8fy3d4303p0',
  address4: 'inj1vftzm2nnlt0x8z9gq2hgxxywlk79m8k7k3ljgk',
  validatorAddress1: 'injvaloper1kk523rsm9pey740cx4plalp40009ncs0wrchfe',
  validatorAddress2: 'injvaloper15uad884tqeq9r76x3fvktmjge2r6kek55c2zpa',
  validatorAddress3: 'inxvaloper1xxx23rsm9pey740cx4plalp40009ncs0wrchfe',
  validatorAddress4: 'injvalopr1xkk523rsm9pey740cx4plalp40009ncs0wrchfe',
  noMemoIdAddress: 'inj15uad884tqeq9r76x3fvktmjge2r6kek55c2zpa',
  validMemoIdAddress: 'inj15uad884tqeq9r76x3fvktmjge2r6kek55c2zpa?memoId=2',
  invalidMemoIdAddress: 'inj15uad884tqeq9r76x3fvktmjge2r6kek55c2zpa?memoId=xyz',
  multipleMemoIdAddress: 'inj15uad884tqeq9r76x3fvktmjge2r6kek55c2zpa?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: 'AA8371F7D8796DDF24B660481B46C1F772135DA981750FF904DAC49C8282AB2A',
  hash2: 'BF476AB6A3A29D1EF1C70B3ACE0E9F0F5E877DD0DABD0146BE8380B31900C696',
};

export const txIds = {
  hash1: '7FCF872971836FCD571460898B05A6A1A1B6AB1E9C610B641E1D17FABA73B8F8',
  hash2: 'E6F064F7E9EC4709F357E3030A86196E34830287B670FF590FAB85F1E1A30B2E',
  hash3: '1184CF1119C7AF7BE49A13D10746ECAA133328E87B4CCFAA916C0B50EF646B41',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uinj' },
  amount2: { amount: '0.1', denom: 'inj' },
  amount3: { amount: '100000000000', denom: 'ninj' },
  amount4: { amount: '-1', denom: 'uinj' },
  amount5: { amount: '1000', denom: 'hinj' },
};
