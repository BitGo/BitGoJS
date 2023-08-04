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

export const wrwUser = {
  senderAddress: 'inj1wkcrz3cs47agnzw64r58drmlexs4w4grdldem8',
  destinationAddress: 'inj1u67n43rz0clg3vav7nk20trn52ff5g6wmhteqy',
  userPrivateKey:
    '{"iv":"eFrowgNQBK4vLIaj3OZ+bQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"H9dPKDNZ/h0=","ct":"o66Opq7+VSs6Ll\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"o7OJfoF49Q58WKF0zyyuVQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"1YweFAaqvlE=","ct":"pvSVtxRVmAvVrI\n' +
    'GuwZ1ekbSN4+5gDts7cWaa8Bmd3XdXJ+3fZeJ32xT7fFGn8tjF9j0pFzCLw4Dn0I0lDsxxBzni4\n' +
    '+MyUdDIW50UixsFcAAWDx8+/6wK81cDtf+A3bgaub8/7bgcC2gpLM6iRmjG0QK3K3tUCJE3xt7D\n' +
    '2cW2lNHpfbzNY/b/PKgfARjguJCLeRz6hjkJatsqpgYFZmqJ02YQ9PCXX9pHyaV6DQXd5ScYoi6\n' +
    'xtyHNL+QMzvwClZcLQhurt1Np0CHkXK0ohuBo7lszGE4gzHi8FmWDGxeA1+FtQ8AqEiMm8hm4BY\n' +
    'PM5YWNezjwe7UEm9BuJAUj/3gNb9Sgnqnk1RlbcqznrrAs5H8TGrpxx521TxCCqgI8LQ4l5Ek+Q\n' +
    'ppYkl2COeTVajqNKW4ErsTDmewMWnX6dVJVoJw9jbAsIsYiEGWZJ4iF2chI98r1r46mnvvYRCJY\n' +
    'Kr/ZmTJBMVShFkUQz4I/o6Rynk3EmSlmnUv2Wqtbo97oumGPlOUC2FzJOhMonCmzy3tRK0ryhOn\n' +
    'AvC9shayZKaRz2Ho+5UyslfrHTm7qQDnMaLz1Ukb87Wqyuk3JTLKIaymOGcujfZ73Txppd+oZCx\n' +
    'RtfCGKvW+XMemH4E8rvh1jAzMurR6RJE/+J2ukieoqi/kTEOxt8COAjjXiKTbsvJD7TFKxQcnD7\n' +
    'Zki3UtPWmRTuVJ8oSP1jIQyNQBrgFloDQhk3lsRvo7Zew3hsNmOmYDKOATwJ4rCgYfZSRaY6m5F\n' +
    'U/3KXBOjuZXmXLLj5RSWd/6A1LvsSaMIWcLsUSSabBiY00jCARNdMIH7a78Z2dERp/SVi+nWtBf\n' +
    'uLk0OvI86pObhPKVqnFqvnl7C3ht41877jH/Aqy9qCzBo/0I4i5UJhaPyFveLHqVzlr4+Ysj7bh\n' +
    '9B2vOpXyZzZVRf/TAS3sk4juHUAmrv3j0APkgvugcXQd6wUIyyC1GUPIOUWU51caI/C1QVCrPS3\n' +
    'djQY54by1f9hWavMJ5/FHu/JK2uL49CZW3oEY/XgljTDkU1Vy/B5Lp3oqCucwrBifh9eM7uigzR\n' +
    'vkW0VpQqWYw4RbttG0s06qJ2E4ExkaZ4Q5mUTBdRg5tHZnE7M3va+cj84Zfl+7LLhxj2nV9b1Jd\n' +
    'wDR9ZY46fk9Lh2iG+frEPKZneyfApvuwQFbkUL6go2+PlZOMl+EqGrS63iQpHj5oz1S6le+igxb\n' +
    'p0WBYc6pjMkypfxa+orpjTWM8gVdboa8vddT/lC1Z53t22c5mQgfk6OJWX/OKqK4NxMp3p93Aa6\n' +
    'xDVEUe++7dYGdgNbU86McRbe+Lx0MVHQwC+V/mdb++dgGfxqLnqrqMP0TYLc2UdO4g+wsYr03Vy\n' +
    '1+DrbSuOSzLMUCbqznuBmXCB6bXLMkk5TxV/XQarAODH0xqmhYObJ+dsLFbk5YX/WHU8DOSFrum\n' +
    'ik2lnv7xgjUpCzFiP+rULSWUGpiVhU0kpC83tzZvK3oGZJhoGlIkfOCGu2vI+hd8RLAYTYYeXjf\n' +
    '3gFNVE1YDgA7Mq0w2GX8X3AF/YkutHsA/ToRX16tTsLgAXYOoFRs5mEkOCMYpKBAO7BZ7HJODrQ\n' +
    'UsqzKdPEtFdyKzMtO1zGSiLrzbHPlozurIChnvVMx2AwJEJyZjYX0QaqebyOSpN92RJgnVygNzx\n' +
    'PJH9UpWhq74YtL+4QAbBmdwOgkzGmLE0ULeWI3S1cgNckGyHPZAd6oJpMez4fxoXn0OGQUuTWDU\n' +
    'snBlI4YQSlUJI9nb/QNm70fBvL+PKfOLHA5Wxn49Qm0YkpemILpe6HPj37lH1UgvidWSe1Ji7TU\n' +
    'N5lFhvRmKsSw8rQvWjBcpbprLwygHTxW3aSt64wYya+Q+AtfEgUbifc/2J0rVy3y3Vfg71RINwv\n' +
    'nOWYF5zWpdvSzdFvxWnfuytOjA9jFms3L+/xZD7uBHdtEfjz5l20f8orUw0ZHcE2iFuVCsJhXmE\n' +
    'XFcRcQ35TY4y7K+WxNmMj5GHwK+4x5Y5oqZb2lAmrxoOMf7cNGzouJ4pg8r1WHztLaOZ8Je6vpe\n' +
    'D3h/FG5BVxrvTIMUFJnzV0TqN+qL/i7eI1tZQMe8KQSFzjs+BzU6i2L7tXyIUQuPrEbESbfZWQA\n' +
    'HrfPiWAyagqX7hDkRlnRwug2xFFuUse7ip8LXkDRZD2dxjzbu8PErX/CJXoOOigQVWpwnQH6QG+\n' +
    'SiArjpMJRrsvAKHHwc3286e1cQe3KTnGr2iiheGxcM/fpv81VjkO0Ma4dx2rR1P2HLan5BaSSyK\n' +
    '1Vjorrx3c51jBVNSnztCM3QI6FfJ3RFg3ySsXpYizm5UYcLJ04oUiIpIEJrw+0wG6vhPJEBNdkk\n' +
    'yqBBtu7kpK5PDNHpmnxfv8F4eVuPzCqX3ub4Xc9i4k6KywitWu+EaU29iy6XuPEoTFKJ0PfiBmf\n' +
    'L333RTwUqZ3QH718u9q+oCnauV0v7LvrDTiHuzpcCZ/u2X9K0A2dPxBkYFeO+v3n4S//LCAurPv\n' +
    'fvJMKKAFPMlWuso+tu4cun68oUhbGCfHMMoM8Bzu1lES6VX+mOW/YhCDNJy3KyxWIUU2+M/0VSz\n' +
    'OK/qnnBe10ODsST8opLnVEiiuM0R1IvAmeozentHOkfn1A3mpW3zkpwKwZ9NaOMMgACTJKa/sBC\n' +
    'Vs++SwQDQZWpaGak+x0bZf2Zc9iK7gYSTrAlPqBlE/QVLTB49gRc+bZNIbVwFxU/3eUeNDWcKqs\n' +
    '5OReJCtzwyavo1a1bbyfhreOCXuZjksKChb9YtIwl+OW83CfYdhfoK7nTxyZeM0twz9u7T+N1nJ\n' +
    'mz6Ul2MXbEqoozjtFkM3BbyswnPCMSKOso99QNjpMNLVievCstZEwWEqwsyK7M2BbHC8Jq+90d+\n' +
    'TtB5qtVRQvQCG1uDY19Mzo8rZWY0hheqE/7vEknQ1rQ+6sRDKyc3N0lxfGJGfqf91i9dYoa7i8K\n' +
    '2aWmyD7B8lhDGDPwLJuNfgIprE5+XPAxAskO9/ccNfIGG8tkxILZP87iQLB6bmucqw5zus+Ip1d\n' +
    '6DiW7txyJzLBVrRfAWEBtxZ7qdAErUL2cmPVAn5mpiXAVt3TwAq6Xb+BMBM855lQ7eMTy6pu7HM\n' +
    'f2ilnfHZSTudfE2xMgJMaKhJzifop8ovLulrO/NO2yuTv/llfmfwv7rwo+McYYLQsZp/z3UIPW0\n' +
    'JzYq5LsDCegXLSINsdryGUNLxfP96K8t7kQfw6WFtELTRPRY6M6lDTlHxRiVNtsYbAhTQ3wZZsn\n' +
    'uafhoSSsU6ZwKPihNwF5/2OJ7F1nmsFAMkjSjmRO5/MOkwmnX/0YpshjHKjtSpjJDMqbbJYlTmd\n' +
    '9BSNM3p/j67ibmoq49qFwOAOOoNhU9ZdXb+BZ+3/r5p/NCk911ofyFbm6GGDjGZtwG5WXssMCZC\n' +
    'NyNqNNno1Vule0GtGvUFhlgRbr4xKRjkbFXGkujbR+0Yu3DLjLG4cN2UaCdGMwcL218XyWVdgH5\n' +
    'ZLN0usfCOTGdjm8pdZ9VlI+f/QSY+htuwC2kiBWuzzd+6fMUztzPPA0thefTbvPyQdC9DUR/WeC\n' +
    'vtggl0MSUNF5cceq2Km1cHQ48v1Raj2U+sAHBrVFWjvouIPUMsXwJ37QO2GU26eaIfqUiPjrlPw\n' +
    '/NBSJiakoCKCTtKl3/bKzIAoKH5TjeVBr7Ymul1WdcpkkFgngmFJA1+D7E0zmEJxE80nBIkzUhb\n' +
    'BrYlgOOsxGd8cTak1/8aubqTgQ3ejJOUiwNzOnUXKC2BMTC3hlxUmLFL23PYYcAjbAFjfik8Fp2\n' +
    'lM1EhOTiW7MYC9DrimvFFe7Q0jsW6r/TCLxLv2VExfhwJDvta2iN3ygbdO7r9n6g5qQBY+3q2pI\n' +
    'dRo6W+MZYE5OK/f0nZt+KwUXFAsWBKX5n2gZDMCEFCUiH1OyPEnnPyhJmKhqgnAJGSNeeR8iQ5b\n' +
    '90d0gV5Fxcne9KsQPyD6Fefkel3VxeUYhK8DsC+OIB7+cQW1LLIIiLqYWc1QbzMoOnDY3ZRTb7S\n' +
    'L9yJ7/y3INo0G9B3PEdrvH9YhMsjX3b/HPeiKQbCKTosnj4JObae3oc+sf/8BPftMFrUuppAnTY\n' +
    'HHdHFeUR7CJ7gjxN+FFBNDBp3iW9zzL73h1fUbn28xkvMhebcVNvBaVNPddNnM2d50sSK+8s0UO\n' +
    'caCxFPV6IXnlN6FG41oGIi/4yYT3qwc8B/6o3/uw/hcA5xmYzxjjvjwCEFugTy2lgreW3LU2wav\n' +
    'uLw+PPCiTyeozwnw6x5JU78jPlqRcqSSvOuxHDds2mw2LkNdtF+a7ecR7ij/aKxvxLJ/dy9nnYL\n' +
    'fXXRVRcrtdNJmj8by8SigT5/NpVjoWXWdkRTQd5kDEujcsUjTUN1SwUDrnz0yj0rjb2Kqx4D7BG\n' +
    'Qho5RWF9Hc83KbUdRL+nminEiMVVFZPIAZmOEJ9xMSnRIYlxlVpHHNwnznYA+G/o7jLO8gfBC55\n' +
    'y25PTYXrhKop3jJNXQRUqYdn948OR2Ej4jZNw+JuvtEM7Zh+E47eVWFaBrTvWAm9oE73Wi7bQpA\n' +
    '8BkUujWJT/JGLOhOxljZHTMMr6mdjmg58Tvq347ZkWqomjKXfcYfbG9/Fi9J9E7Gi35ysWeAaC0\n' +
    'QiJP1fArSbmtPdVQBVTA4llvDGgddBPnWIe1kLfvrv9Xo8Dh0zlxGaZLxh3tGhESCRR4rau3jjW\n' +
    '6hFHvC0BxpcAmP9wvKnvWx5hboNpddb6L9/1EqLGRQRBRWj7GccRVNeo806KZaajb7KId2OCqit\n' +
    'GvYz6E1OcL/KVmcVvLlCYNWtI9nb6CKGS/DwOzVTopfxUjUB/d0+BKPf5hWfK2wDd42xW3dYC5v\n' +
    'aSbijSeUL9Z/wyUVN63OIu5fnbHSY/bM4k38nMfgR4ARXIJjAwkHQfGCXUuiz1Ufepk2iz01ik6\n' +
    'XwKpcevmbu/rWHRTMG6ySTdVJvv3njsqPInvOdLph0FD/21gAuv/5pbHLeLbf92w8kBTOQOKieF\n' +
    'RCvqmm862J3sqCv2aXDH+2P4iqvRJvQqOHc89Sf2y4HY0hOcM9i3RUltGBwxSOB6L1eJnp5Cogw\n' +
    'RzWCOnakCN/RY0OZxjdgvYl4dpcuJ2eaboVBcNPzoT+ifLbKZ7kcAwDHUeFkU+des4IC/Zjc7xW\n' +
    'FnrVnieypAqPydca1Fr+IXDubtjveCBvSQhXj0YXxHREdVDNbgpoRbxz1KoBYSvfgbn+Fqt+sLD\n' +
    '/vIr4EPnsQx5m/EFsgLyz9A0gJUjCh3dBHY3W/U4CmbuiaD0GXNyde/nBQodzUVw+QwJ2TQjPBH\n' +
    'dsgp8rEeAlE9dA6rFzZcMgUXisUJWhMIO4aQES/b0wRQ80Ww2BeiJwNJ1AicKhRQF4F7KnfeX/F\n' +
    'z8HX5BV34Vo/m0PFH/icZWiCNrgnMtxW1F7WOzdZmFF2ZYes5MI3eDOFvHqaLmPG1GBvwD+lg/j\n' +
    'Mz5u8KcPNt4h4j/MOaL5E4+ctPMX4tOdDLHFPjFKa4Cg=="}',
  bitgoPublicKey:
    '03924e763697f4388577cf234a57b1675ff5048f3adddec23959d85862f55cc97f6a06c263e\n' +
    'a42166875f0f13acb828c724bd9d67d06c440dff6e308326e9833ab',
  walletPassphrase: 'bitgo_test@123',
};

export const mockAccountDetailsResponse = {
  account: {
    '@type': '/injective.types.v1beta1.EthAccount',
    base_account: {
      address: 'inj1wkcrz3cs47agnzw64r58drmlexs4w4grdldem8',
      pub_key: {
        '@type': '/cosmos.crypto.secp256k1.PubKey',
        key: 'A+4Jt1KX92BFH9w4yL5B2vU7I5twG9AIWb+ZkUx0SiCj',
      },
      account_number: '42033',
      sequence: '2',
    },
  },
};
