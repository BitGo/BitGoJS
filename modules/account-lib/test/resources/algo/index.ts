/*
 * secret/public keys are from RFC 8032
 *
 */

export const accounts = {
  account1: {
    secretKey: Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex'),
    pubKey: Buffer.from('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a', 'hex'),
    prvKey: 'TVQ3DHPP7VNGBOUEJL2JF3BMYRCETRLJPMZGSGLQHOWAGHFOP5QEYTZH2Q',
    address: '25NJQAMCWEFLPVKL73J4SZAHHIHOC4XT3KTCGJNPAINGR5YHKENMEF5QTE',
    voteKey: 'O0lMKXAaqN4h7jVJr8LHY0hvEbK62OJLJkN1soxp9Bg=',
    selectionKey: 'wXjfzAoZhls/zrhgAn8zas/WTktvRuxeps6fkv2au+c=',
  },
  account2: {
    secretKey: Buffer.from('4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb', 'hex'),
    pubKey: Buffer.from('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c', 'hex'),
    address: 'HVABPQ7IIOEVVEVXBKTU2G36XSOJQLGPF3CJNDGAZVK7CKXUMYGA6EOE6Y',
  },
  account3: {
    secretKey: Buffer.from('c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7', 'hex'),
    pubKey: Buffer.from('fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025', 'hex'),
    prvKey: 'YWVI35B7T6BXX3NXIQXTDXFXWFTNHBJVA5XQSS4FZY5C4C2ELD3YWYSZLU',
    address: '7RI43DTCDCQ2HDNEP3IAEMHQLAEBN3ITXIZQHLC55OIRKSEQQAS52OYKJE',
  },
  account4: {
    secretKey: Buffer.from('9a78040f4889eac1878793757c54b85705638fad51996dd9135652ff8902d924', 'hex'),
    pubKey: Buffer.from('e8248c0ce9cf48ef41b5648220ac84caf7ef49988503b2ef036fa16ecae7fe1c', 'hex'),
    prvKey: 'TJ4AID2IRHVMDB4HSN2XYVFYK4CWHD5NKGMW3WITKZJP7CIC3ESKBVGXNA',
    address: '5ASIYDHJZ5EO6QNVMSBCBLEEZL366SMYQUB3F3YDN6QW5SXH7YOLUE3ZIY',
  },
  default: {
    secretKey: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'),
    pubKey: Buffer.from('3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29', 'hex'),
    address: 'HNVCPPGOW2SC2YVDVDICU3YNONSTEFLXDXREHJR2YBEKDC2Z3IUZSC6YGI',
  },
} as const;
export const rawTx = {
  transfer: {
    unsigned:
      'jKNhbXTNJxClY2xvc2XEIPxRzY5iGKGjjaR+0AIw8FgIFu0TujMDrF3rkRVIkIAlo2ZlZc1V8KJmdgGjZ2VurHRlc3RuZXQtdjEuMKJnaMQgSGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiKibHZkomx4xCCXDKhSkaeCFr/a4vTlGdynAwSMwrYTZ7G+zr0BrJ74o6Rub3RlxARub3Rlo3JjdsQgPUAXw+hDiVqStwqnTRt+vJyYLM8uxJaMwM1V8Sr0Zgyjc25kxCDXWpgBgrEKt9VL/tPJZAc6DuFy89qmIyWvAhpo9wdRGqR0eXBlo3BheQ==',
    signed:
      'gqNzaWfEQBNuiJOd4DX48r1j58j648aePWemKIfQoolycRgNGbWBS4veklsCtLwx6/XDf4gd37VBVzHlA+uSelt65RyYvw6jdHhujKNhbXTNJxClY2xvc2XEIPxRzY5iGKGjjaR+0AIw8FgIFu0TujMDrF3rkRVIkIAlo2ZlZc1V8KJmdgGjZ2VurHRlc3RuZXQtdjEuMKJnaMQgSGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiKibHZkomx4xCCXDKhSkaeCFr/a4vTlGdynAwSMwrYTZ7G+zr0BrJ74o6Rub3RlxARub3Rlo3JjdsQgPUAXw+hDiVqStwqnTRt+vJyYLM8uxJaMwM1V8Sr0Zgyjc25kxCDXWpgBgrEKt9VL/tPJZAc6DuFy89qmIyWvAhpo9wdRGqR0eXBlo3BheQ==',
    // signed with account1 only
    halfSigned:
      'gqRtc2lng6ZzdWJzaWeSgqJwa8Qg11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURqhc8RALU7Eycpgkq6o5Ib/jYKr/FBIDMrEtK3DW+YaKS87+AAYuiMGaDBf2WjABqWFvld0EQ9TmkMqQSw/8h/jFAzhC4GicGvEIPxRzY5iGKGjjaR+0AIw8FgIFu0TujMDrF3rkRVIkIAlo3RocgKhdgGjdHhuiqNhbXTNJxCjZmVlzVXwomZ2AaNnZW6sdGVzdG5ldC12MS4womdoxCBIY7UYpLPITsgQ8i1PEIHLD3HwWaesIN7GL39w5Qk6IqJsdmSibHjEICo7EN+p/8tIgA7K8AKIc06cjObUr/dFU6vXmcXso/n1o3JjdsQgPUAXw+hDiVqStwqnTRt+vJyYLM8uxJaMwM1V8Sr0Zgyjc25kxCBah0dipej1XgoZmVrjfWCmNVomuDA4bso2Oew5KGYMLKR0eXBlo3BheQ==',
    // signed with account1 and account 3
    multisig:
      'gqRtc2lng6ZzdWJzaWeSgqJwa8Qg11qYAYKxCrfVS/7TyWQHOg7hcvPapiMlrwIaaPcHURqhc8RALU7Eycpgkq6o5Ib/jYKr/FBIDMrEtK3DW+YaKS87+AAYuiMGaDBf2WjABqWFvld0EQ9TmkMqQSw/8h/jFAzhC4KicGvEIPxRzY5iGKGjjaR+0AIw8FgIFu0TujMDrF3rkRVIkIAloXPEQG4JWpJb0aPWohaIyfXU7rXZTvkfJuTE4X4sF9cYNPkFM3TfZroQyD+dk6+wURgegA1ZTnvWKyN2/V7b0M+gYAujdGhyAqF2AaN0eG6Ko2FtdM0nEKNmZWXNVfCiZnYBo2dlbqx0ZXN0bmV0LXYxLjCiZ2jEIEhjtRiks8hOyBDyLU8QgcsPcfBZp6wg3sYvf3DlCToiomx2ZKJseMQgKjsQ36n/y0iADsrwAohzTpyM5tSv90VTq9eZxeyj+fWjcmN2xCA9QBfD6EOJWpK3CqdNG368nJgszy7ElozAzVXxKvRmDKNzbmTEIFqHR2Kl6PVeChmZWuN9YKY1Wia4MDhuyjY57DkoZgwspHR5cGWjcGF5',
  },
  keyReg: {
    unsigned:
      'jaNmZWXNA+iiZnYBo2dlbqx0ZXN0bmV0LXYxLjCiZ2jEIEhjtRiks8hOyBDyLU8QgcsPcfBZp6wg3sYvf3DlCToiomx2ZKJseMQgcvPLigkQz2UF1YolcLlsi6TBnkuoLXHlvit1DoIEbnumc2Vsa2V5xCDBeN/MChmGWz/OuGACfzNqz9ZOS29G7F6mzp+S/Zq756NzbmTEINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1EapHR5cGWma2V5cmVnp3ZvdGVmc3QBpnZvdGVrZAmndm90ZWtlecQgO0lMKXAaqN4h7jVJr8LHY0hvEbK62OJLJkN1soxp9Bindm90ZWxzdGQ=',
    signed:
      'gqNzaWfEQLGiX/zeNnIx75S7O3s72u0qYOr2OYUIuXMo1NoRHYZDAF9haSpJpLEoN3BsvOC8OlqHh1A/GrUdIyEWysiUDAejdHhujaNmZWXNA+iiZnYBo2dlbqx0ZXN0bmV0LXYxLjCiZ2jEIEhjtRiks8hOyBDyLU8QgcsPcfBZp6wg3sYvf3DlCToiomx2ZKJseMQgcvPLigkQz2UF1YolcLlsi6TBnkuoLXHlvit1DoIEbnumc2Vsa2V5xCDBeN/MChmGWz/OuGACfzNqz9ZOS29G7F6mzp+S/Zq756NzbmTEINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1EapHR5cGWma2V5cmVnp3ZvdGVmc3QBpnZvdGVrZAmndm90ZWtlecQgO0lMKXAaqN4h7jVJr8LHY0hvEbK62OJLJkN1soxp9Bindm90ZWxzdGQ=',
  },
  assetTransfer: {
    unsigned:
      'i6RhYW10zQPopGFyY3bEID1AF8PoQ4lakrcKp00bfrycmCzPLsSWjMDNVfEq9GYMo2ZlZc0D6KJmdgGjZ2VurHRlc3RuZXQtdjEuMKJnaMQgSGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiKibHYKomx4xCAcYRGJPoeYic3WplXuuAMpWljMi9OMH8LfeGCT8zm3EaNzbmTEINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1EapHR5cGWlYXhmZXKkeGFpZAE=',
    signed:
      'gqNzaWfEQC1hYrepGwpeNbOC6MzRCm9M7ys5GMC1f1K3tGmu5jKjVE0V8aCYA0O2KT3gHqm2h8TjfLHS91/up6P8YE2m2gGjdHhui6RhYW10z4rHIwSJ6AAApGFyY3bEID1AF8PoQ4lakrcKp00bfrycmCzPLsSWjMDNVfEq9GYMo2ZlZc0D6KJmdgGjZ2VurHRlc3RuZXQtdjEuMKJnaMQgSGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiKibHYKomx4xCDVYYv7n0seBXSi9o/VdSy3QPH/5FhIuvMMHHWanc6idqNzbmTEINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1EapHR5cGWlYXhmZXKkeGFpZAE=',
  },
} as const;

export const networks = {
  mainnet: {
    genesisID: 'mainnet-v1.0',
    genesisHash: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  },
  testnet: {
    genesisID: 'testnet-v1.0',
    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  },
  betanet: {
    genesisID: 'betanet-v1.0',
    genesisHash: 'mFgazF+2uRS1tMiL9dsj01hJGySEmPN28B/TjjvpVW0=',
  },
} as const;

export const transactions = {
  payTxn: {
    from: 'YGNUPHXWPHJPUHP5Y4N5FEKHPRGIGGL7G6DR33BF6GLMMW554D53DEHINI',
    to: 'SP745JJR4KPRQEXJZHVIEN736LYTL2T2DFMG3OIIFJBV66K73PHNMDCZVM',
    amount: 5000,
    firstRound: 167,
    lastRound: 1167,
    genesisID: 'testnet-v1.0',
    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  },
  nonParticipationTxn: {
    type: 'keyreg',
    from: 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA',
    firstRound: 167,
    lastRound: 1167,
    genesisID: 'testnet-v1.0',
    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    nonParticipation: true,
  },
  keyregTxn: {
    fee: 1000,
    firstRound: 167,
    genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    lastRound: 1167,
    selectionKey: 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA',
    from: 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA',
    type: 'keyreg',
    voteFirst: 1,
    voteKeyDilution: 10000,
    voteKey: 'R275HNKEXC3AI3CYL2PPOGP2AFA4XCRDO2CCREGCVDX6OJAZ54MBD7VLYA',
    voteLast: 6000001,
  },
} as const;
