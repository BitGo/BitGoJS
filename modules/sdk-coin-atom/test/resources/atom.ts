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

export const TEST_SEND_TX = {
  hash: 'A6E846004999A3D9C1F09A253C61E41FC5711C2228E18E8488B2F5FE1FE9F4D2',
  signature: 'pkBC/g2eqkRzLp/xc9Pw5zo2/9jCneJ+zvH0Lb+zIGoQqNNAR5eU3GTjR9inJfpikrprQYgoOxdT7OnWIsDdnw==',
  pubKey: 'Ah0Xud1r7fdljxs/dx9Rud1Un55KArr94VMtAMoUXBsO',
  privateKey: 'cGQSjk/xusPlqScte8OnHMAaW7Zjt1wu7R6W4eYzLUg=',
  signedTxBase64:
    'CpIBCo8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm8KLWNvc21vczFzbWVma3E5eWF4Z3c5YzlmaHltNnFzcDc0NnE4ODRjemVhY24zMhItY29zbW9zMTZnaG45YzZmNXl1YTA5enF3N3k3OTRtdmMzMGg0eTRtZDdja3VrGg8KBXVhdG9tEgYxMDAwMDASZApOCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAh0Xud1r7fdljxs/dx9Rud1Un55KArr94VMtAMoUXBsOEgQKAggBEhIKDAoFdWF0b20SAzcwMBDAmgwaQKZAQv4NnqpEcy6f8XPT8Oc6Nv/Ywp3ifs7x9C2/syBqEKjTQEeXlNxk40fYpyX6YpK6a0GIKDsXU+zp1iLA3Z8=',
  sender: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  recipient: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
  chainId: 'theta-testnet-001',
  accountNumber: 723763,
  sequence: 0,
  sendAmount: '100000',
  feeAmount: '700',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uatom',
          amount: '100000',
        },
      ],
      toAddress: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
      fromAddress: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uatom', amount: '700' }],
    gasLimit: 200000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '3FF02D82E6799633A33AA07CE26093913E6D7598AA9116A13D70B13302410BA3',
  signature: 'bxQvMdcZqetn4LAxYAhNeyluqfeDPIn/U7HMCw/0tIh4NY4JuHcZmSFFVxxks2oxWHzcnblxZnOSDtDpVIvHwQ==',
  pubKey: 'Ah0Xud1r7fdljxs/dx9Rud1Un55KArr94VMtAMoUXBsO',
  privateKey: 'cGQSjk/xusPlqScte8OnHMAaW7Zjt1wu7R6W4eYzLUg=',
  signedTxBase64:
    'CqEBCp4BCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ3Ci1jb3Ntb3Mxc21lZmtxOXlheGd3OWM5Zmh5bTZxc3A3NDZxODg0Y3plYWNuMzISNGNvc21vc3ZhbG9wZXIxODNheWNndHN0cDY3cjZzNHZkN3RzMm5wcDJja2s0eGFoN3J4ajYaEAoFdWF0b20SBzIwMDAwMDASaApQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAh0Xud1r7fdljxs/dx9Rud1Un55KArr94VMtAMoUXBsOEgQKAggBGAUSFAoOCgV1YXRvbRIFNTAwMDAQwJoMGkBvFC8x1xmp62fgsDFgCE17KW6p94M8if9TscwLD/S0iHg1jgm4dxmZIUVXHGSzajFYfNyduXFmc5IO0OlUi8fB',
  delegator: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  validator: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
  chainId: 'theta-testnet-001',
  accountNumber: 723763,
  sequence: 5,
  sendAmount: '2000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
      validatorAddress: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
      amount: {
        denom: 'uatom',
        amount: '2000000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'uatom',
        amount: '50000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '6ECDCDA93BC930CC40FFC574ACE9F127847333113C16A34AA71CE7BD79960351',
  signature: 'sPwVolfyEr5igbMKg8eC+YucUkrmtjNwnZlpLplrvqJ+eKoAYM3sZOJte6kkdwtOBd8aJbIDATtSkMMNoAxjCA==',
  pubKey: 'AyWF+4XfQ0l8vuwqDm7iu6SPqr5lhAj34JKwuxzHR4Fx',
  privateKey: 'iXqkSCHPAqBaWaPLiVkYGykGxZiCDunb4YA/kpLdIo0=',
  accountNumber: 722559,
  signedTxBase64:
    'CqMBCqABCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEncKLWNvc21vczF5dGV6MDZ5eDB1M3lqempqam0wMnh5eDNtaDI1YWtlbnpxbDNuOBI0Y29zbW9zdmFsb3BlcjE4M2F5Y2d0c3RwNjdyNnM0dmQ3dHMybnBwMmNrazR4YWg3cnhqNhoQCgV1YXRvbRIHMTAwMDAwMBJoClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDJYX7hd9DSXy+7CoObuK7pI+qvmWECPfgkrC7HMdHgXESBAoCCAEYRhIUCg4KBXVhdG9tEgU1MDAwMBDAmgwaQLD8FaJX8hK+YoGzCoPHgvmLnFJK5rYzcJ2ZaS6Za76ifniqAGDN7GTibXupJHcLTgXfGiWyAwE7UpDDDaAMYwg=',
  delegator: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  validator: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
  chainId: 'theta-testnet-001',
  accountId: '723928',
  sequence: 70,
  sendAmount: '1000000',
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
      validatorAddress: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
      amount: {
        denom: 'uatom',
        amount: '1000000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'uatom',
        amount: '50000',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: '8C531E7148AE0492BB1AB0C912AC1E027E02A916D1DD8887F8913307B11A6F04',
  signature: 'NXq/8RERL0auojFsiMM0MmLeWcmovH6/o/qx0SAi2wwuLqoepY3KwmHoWn/fpMeE2ADbFVCD57tvrrcaozPMcQ==',
  pubKey: 'Ah0Xud1r7fdljxs/dx9Rud1Un55KArr94VMtAMoUXBsO',
  privateKey: 'cGQSjk/xusPlqScte8OnHMAaW7Zjt1wu7R6W4eYzLUg=',
  signedTxBase64:
    'CqMBCqABCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmUKLWNvc21vczFzbWVma3E5eWF4Z3c5YzlmaHltNnFzcDc0NnE4ODRjemVhY24zMhI0Y29zbW9zdmFsb3BlcjE4M2F5Y2d0c3RwNjdyNnM0dmQ3dHMybnBwMmNrazR4YWg3cnhqNhJoClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECHRe53Wvt92WPGz93H1G53VSfnkoCuv3hUy0AyhRcGw4SBAoCCAEYBxIUCg4KBXVhdG9tEgU1MDAwMBDAmgwaQDV6v/ERES9GrqIxbIjDNDJi3lnJqLx+v6P6sdEgItsMLi6qHqWNysJh6Fp/36THhNgA2xVQg+e7b663GqMzzHE=',
  delegator: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  validator: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
  chainId: 'theta-testnet-001',
  accountNumber: 723763,
  sequence: 7,
  feeAmount: '50000',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
      validatorAddress: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
    },
  },
  gasBudget: {
    amount: [{ denom: 'uatom', amount: '50000' }],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'AEA8DFD3A86BFFE1B172E5B5E5F993BD90DBB08646AD082C1877167B0105D66C',
  signature: 'qeHDhr9ZwWQO2KcRINp8V7szW2fTgPJilX5eV/MI5PwoHKkgI8X6qH1IxgFC+EBFG04C9GhYoLyBtIa8vfcJnQ==',
  pubKey: 'AyWF+4XfQ0l8vuwqDm7iu6SPqr5lhAj34JKwuxzHR4Fx',
  privateKey: 'iXqkSCHPAqBaWaPLiVkYGykGxZiCDunb4YA/kpLdIo0=',
  signedTxBase64:
    'Cp4BCo8BChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEm8KLWNvc21vczF5dGV6MDZ5eDB1M3lqempqam0wMnh5eDNtaDI1YWtlbnpxbDNuOBItY29zbW9zMWo0YTB6Y3Z4bGh1dWQ1MHJobHM3c2xlbDB2ZG5uY3R5cDBjY203Gg8KBXVhdG9tEgYxMDAwMDASCjk4NzY1NDMyMTASZgpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAyWF+4XfQ0l8vuwqDm7iu6SPqr5lhAj34JKwuxzHR4FxEgQKAggBGGISEgoMCgV1YXRvbRIDNTAwEMCaDBpAqeHDhr9ZwWQO2KcRINp8V7szW2fTgPJilX5eV/MI5PwoHKkgI8X6qH1IxgFC+EBFG04C9GhYoLyBtIa8vfcJnQ==',
  from: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  to: 'cosmos1j4a0zcvxlhuud50rhls7slel0vdnnctyp0ccm7',
  chainId: 'theta-testnet-001',
  accountNumber: 722559,
  sequence: 98,
  feeAmount: '50000',
  sendAmount: '100000',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'uatom',
          amount: '100000',
        },
      ],
      fromAddress: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
      toAddress: 'cosmos1j4a0zcvxlhuud50rhls7slel0vdnnctyp0ccm7',
    },
  },
  memo: '9876543210',
  gasBudget: {
    amount: [{ denom: 'uatom', amount: '500' }],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'cosmos1ut2w0m3xa7z2rvndv23pthv9qc7hksx6tkf9uq',
  address2: 'cosmos12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2',
  address3: 'cosxyz1xxxz06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  address4: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
  address6: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  validatorAddress1: 'cosmosvaloper1ut2w0m3xa7z2rvndv23pthv9qc7hksx6tkf9uq',
  validatorAddress2: 'cosmosvaloper12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2',
  validatorAddress3: 'cosxyzvaloper1xxxz06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
  validatorAddress4: 'cosmosvalopr16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
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
