export const TEST_ACCOUNT = {
  pubAddress: 'cosmos1ctwlqlm4lgnyxz5430ar4nvn43gv8t9mwejyf6',
  compressedPublicKey: '02001fda4568760a99e58ee295b4a51edcc6a689297a71f7d1571cf4e1253baf30',
  compressedPublicKeyTwo: '02001fda4568760a99e58ee295b4a51edcc6a689297a71f7d1571cf4e1253abcde',
  uncompressedPublicKey:
    '04001fda4568760a99e58ee295b4a51edcc6a689297a71f7d1571cf4e1253baf3036cc7d5af7ade45e189834f19730438f8ca10f3d2a7520f7405ebd29d66c4588',
  privateKey: '2904281770077a37148834686b5931376b8c78842c9fd25c90d7f012f459a5ea',
  extendedPrv:
    'xprv9s21ZrQH143K2R8si3vCFBf2mW2veQPp19YByJvAGviH4fxy47Yy8vzF1qvjgCfrAbvfwdeRqb7X9Jj48yZNaMDjDTZPRyoJ47ALvnZBpmr',
  extendedPub:
    'xpub661MyMwAqRbcEuDLp5TCcKbmKXsR3s7fNNTnmhKmqGFFwUJ7besDgjJis6eVbJgcTv9nuUuy71kKq7UrFvhTQCv8ng2ppt5yCQYMZ1y1C9s',
};

export const TEST_TX = {
  signature:
    'e21048009e5bbef93cdcd45bf9c40303423118837cf80800717bc0109c6636b168f3de879460c009bf6d09637842ab9b51d257b6b97e4ff3a6cd9427325dd2b6',
  pubKey: '03ab8d1d860207f559c630290e60a0afe31afacfcd8c900c07b40f1d3b11c954a1',
  signedTxBase64:
    'CpIBCo8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm8KLWNvc21vczE0cHRmOWx6czl1ZWduYXlyNWd6bG1zbDk3NzZ2MGwyeXZ3dGc0aBItY29zbW9zMTZnaG45YzZmNXl1YTA5enF3N3k3OTRtdmMzMGg0eTRtZDdja3VrGg8KBXVhdG9tEgYxMDAwMDASZwpOCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohA6uNHYYCB/VZxjApDmCgr+Ma+s/NjJAMB7QPHTsRyVShEgQKAggBEhUKDwoFdWF0b20SBjEwMDAwMBDAmgwaQOIQSACeW775PNzUW/nEAwNCMRiDfPgIAHF7wBCcZjaxaPPeh5RgwAm/bQljeEKrm1HSV7a5fk/zps2UJzJd0rY=',
  sender: 'cosmos14ptf9lzs9uegnayr5gzlmsl9776v0l2yvwtg4h',
  recipient: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
  chainId: 'theta-testnet-001',
  accountId: '723928',
  sequence: 0,
  sendAmount: '100000',
  feeAmount: '100000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress: 'cosmos14ptf9lzs9uegnayr5gzlmsl9776v0l2yvwtg4h',
      toAddress: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
      amount: [{ denom: 'uatom', amount: '100000' }],
    },
  },
  gasBudget: {
    amount: [{ denom: 'uatom', amount: '100000' }],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'cosmos1ut2w0m3xa7z2rvndv23pthv9qc7hksx6tkf9uq',
  address2: 'cosmos12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2',
  address3: 'cosxyz1xxxz06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  address4: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
  address6: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
};

export const blockHash = {
  hash1: 'b43e8f64d384f5bfcfb60da6a353f3efc4f2465767e5c7ce9c6e3ebce9df5551',
  hash2: 'e1571435b14a14f6caed10b2088377a34d000c83e77e08842c044b5f4bbcd9fa',
};

export const txIds = {
  hash1: '152E7623699AE4E23AA2A9A166E153AC31DBCEB95C0FF48FC78B384087480168',
  hash2: 'BF1ECA4F1C5A2DD039E7FB722875334CA494BCF642B1E260DA2A306FD91148DF',
  hash3: 'f25baab14faf059deb490dfcaa58533442cf76e18ccda4f6bef23f588e82ed30',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'uatom' },
  amount2: { amount: '0.1', denom: 'atom' },
  amount3: { amount: '100000000000', denom: 'natom' },
  amount4: { amount: '-1', denom: 'uatom' },
  amount5: { amount: '1000', denom: 'hatom' },
};
