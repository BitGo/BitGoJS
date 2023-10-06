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

export const TEST_SEND_MANY_TX = {
  hash: 'F104E7246AF4BC292B5DDD8CEAE131E599B061C38ED5AE67BC6029FFD9FCF4BE',
  signature: 'z63EmmgJ0A5i+YMkVRr+wNkuaJEP0SqDapmGAtT4TuMv5+bI0DgtwLUgFrDxF+Yc8twgAIn+7tB6HwLzSSdibA==',
  pubKey: 'Ah0Xud1r7fdljxs/dx9Rud1Un55KArr94VMtAMoUXBsO',
  privateKey: 'cGQSjk/xusPlqScte8OnHMAaW7Zjt1wu7R6W4eYzLUg=',
  signedTxBase64:
    'Cp4CCowBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEmwKLWNvc21vczFzbWVma3E5eWF4Z3c5YzlmaHltNnFzcDc0NnE4ODRjemVhY24zMhItY29zbW9zMTZnaG45YzZmNXl1YTA5enF3N3k3OTRtdmMzMGg0eTRtZDdja3VrGgwKBXVhdG9tEgM1MDAKjAEKHC9jb3Ntb3MuYmFuay52MWJldGExLk1zZ1NlbmQSbAotY29zbW9zMXNtZWZrcTl5YXhndzljOWZoeW02cXNwNzQ2cTg4NGN6ZWFjbjMyEi1jb3Ntb3MxeXRlejA2eXgwdTN5anpqamptMDJ4eXgzbWgyNWFrZW56cWwzbjgaDAoFdWF0b20SAzUwMBJpClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECHRe53Wvt92WPGz93H1G53VSfnkoCuv3hUy0AyhRcGw4SBAoCCAEYFhIVCg8KBXVhdG9tEgYzMDAwMDAQkKEPGkDPrcSaaAnQDmL5gyRVGv7A2S5okQ/RKoNqmYYC1PhO4y/n5sjQOC3AtSAWsPEX5hzy3CAAif7u0HofAvNJJ2Js',
  sender: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  chainId: 'theta-testnet-001',
  accountNumber: 723763,
  sequence: 22,
  memo: '',
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uatom',
            amount: '500',
          },
        ],
        toAddress: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
        fromAddress: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'uatom',
            amount: '500',
          },
        ],
        toAddress: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
        fromAddress: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'uatom', amount: '300000' }],
    gasLimit: 250000,
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
  noMemoIdAddress: 'cosmos12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2',
  validMemoIdAddress: 'cosmos12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2?memoId=2',
  invalidMemoIdAddress: 'cosmos12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2?memoId=xyz',
  multipleMemoIdAddress: 'cosmos12xt4x49p96n9aw4umjwyp3huct27nwr2g4r6p2?memoId=3&memoId=12',
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

export const wrwUser = {
  senderAddress: 'cosmos1rezslj2gqh09r98crwkqk9prld2dp9dzeujnra',
  destinationAddress: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  userKey:
    '{"iv":"XGitNFfLPr/MWbgK9+Jskg==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"rQSityFnPIc=","ct":"ikiMK25o7LIsHh\n' +
    '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"}',
  backupKey:
    '{"iv":"oZL/6Hl1DlYoAXmFysJZZQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"Z1VUvrBf66s=","ct":"/NMP9LakS+hQC2\n' +
    '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"}',
  bitgoKey:
    '03f89408501a02e2ea74d5a581c34b2430e6ecc08e10e561f951c51e94c6cada08337157abd\n' +
    '417d0ea08450247ac837681487d21769e243246e3e07470eb20fcce',
  walletPassphrase: '6PZKSm$oIFa%s1fy',
};
