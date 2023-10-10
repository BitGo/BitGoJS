export const TEST_ACCOUNT = {
  pubAddress: 'celestia1evwrmkd3tr09ertyte8rdn2zyaqphphqfgvjv4',
  compressedPublicKey: '02f53fc29d7641fa1e94e87be452199665c31fb7edaba90d44ed2ca3bd235357c7',
  compressedPublicKeyTwo: '02369d4c27748548acfaa1a80ff5a4f9d39cec530036ae2fa1d9347ac5eabbe200',
  uncompressedPublicKey:
    '04f53fc29d7641fa1e94e87be452199665c31fb7edaba90d44ed2ca3bd235357c79de5f383e77b7d21800eb5d61b2e78e36694c7c34b6610ad290514c9c9777eba',
  privateKey: '36723152a025060781ae64ef067932efe3faf6b547e82e8f792ee82c0f595db8',
  extendedPrv:
    'xprv9s21ZrQH143K4X241Y8nDk821fwtY775WUpt6t6nXk7eYVQsASxGdxzzdnf8D8LrJSFuN36oFjnY5tFwJfP1WfWfRSYTbrCNALk3oT99ycK',
  extendedPub:
    'xpub661MyMwAqRbcH16X7Zfnat4kZhnNwZpvshkUuGWQ65edRHk1hzGXBmKUV58vTYUMLpEte9D2Qb45DjipKC9XWwJKqsDiehJc7AfcViA4SxF',
};

export const TEST_SEND_TX = {
  hash: '512DD4B77AD9C6492BAC68AD461C318C2B01869C574F43C84616080980B09CE6',
  signature: 'DlFD1U5T9lMFla/xb500BRDF08mlYTzZAvr0D3x1ht4sb8pbBEQzrcaZILpUCYg3ApoMYM62YWqzZuMmcBW0DA==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CpUBCpIBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnIKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEi9jZWxlc3RpYTFtbHhjZjA2eTNsdW1lenlmNzluMHA0aGtwZzI2eWNkcjhwcmpudxoOCgR1dGlhEgYxMDAwMDASZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfAEgQKAggBGAgSEQoLCgR1dGlhEgM1MDAQwJoMGkAOUUPVTlP2UwWVr/FvnTQFEMXTyaVhPNkC+vQPfHWG3ixvylsERDOtxpkgulQJiDcCmgxgzrZharNm4yZwFbQM',
  sender: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
  recipient: 'celestia1mlxcf06y3lumezyf79n0p4hkpg26ycdr8prjnw',
  chainId: 'mocha',
  accountNumber: 47997,
  sequence: 8,
  sendAmount: '100000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'utia',
          amount: '100000',
        },
      ],
      toAddress: 'celestia1mlxcf06y3lumezyf79n0p4hkpg26ycdr8prjnw',
      fromAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
    },
  },
  gasBudget: {
    amount: [{ denom: 'utia', amount: '500' }],
    gasLimit: 200000,
  },
};

export const TEST_SEND_MANY_TX = {
  hash: 'F72944EA53BA7795E8AB7B07232445946752DB8BFBB2CA01B9F7D8803AA5FAFB',
  signature: 'w49jpRImzNo77zag0IdWyVK5iiUnt2TH4QmvNkiF8Kd6YKn0rVLaPmhJt7aJAGnX2pT8AyCNT4x45Aj0RVnYtg==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CqoCCpIBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnIKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEi9jZWxlc3RpYTE1dmtldmhjODQ5Znh4YzVjcHYzNjByZzN0NTZoMGswcnlna2tueRoOCgR1dGlhEgYxMDAwMDAKkgEKHC9jb3Ntb3MuYmFuay52MWJldGExLk1zZ1NlbmQScgovY2VsZXN0aWExeW4zdDhxdWptdHhqc254N2FuZ2p1YTNqaHZranh5NW41eGdzMG4SL2NlbGVzdGlhMXBlNmx1ZDQ4cWV0bGg0ODYwdXZyazJyOTRhcW4wNjRqbjZqeHNrGg4KBHV0aWESBjEwMDAwMBJnClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiEDJvPH755e6pAOdtcDEwcQEhKGQ11Q3diEP0znzo39J8ASBAoCCAEYLRITCg0KBHV0aWESBTIwMDAwEMCaDBpAw49jpRImzNo77zag0IdWyVK5iiUnt2TH4QmvNkiF8Kd6YKn0rVLaPmhJt7aJAGnX2pT8AyCNT4x45Aj0RVnYtg==',
  sender: 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32',
  chainId: 'mocha-4',
  accountNumber: 47998,
  sequence: 45,
  sendMessages: [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'utia',
            amount: '100000',
          },
        ],
        toAddress: 'celestia15vkevhc849fxxc5cpv360rg3t56h0k0rygkkny',
        fromAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      },
    },
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        amount: [
          {
            denom: 'utia',
            amount: '100000',
          },
        ],
        toAddress: 'celestia1pe6lud48qetlh4860uvrk2r94aqn064jn6jxsk',
        fromAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'utia', amount: '20000' }],
    gasLimit: 200000,
  },
};

export const TEST_SEND_MANY_STAKE_TX = {
  hash: '41FDE39A6294A4AB3985CE073D6F91E53E5E48A10121A4AF1C816A1CCEAAFEF7',
  signature: '+FTvI+MeURNUDE3Vd7AjjWxglBQPet4Hmwqn+kLwvCtpCnwrFkGIKh/ei+wZCrGGO8aRRy0HhZDB4QamOLYKzg==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CsMCCp4BCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ3Ci9jZWxlc3RpYTF5bjN0OHF1am10eGpzbng3YW5nanVhM2podmtqeHk1bjV4Z3MwbhI2Y2VsZXN0aWF2YWxvcGVyMXU2NTV0Z3VsM3N1N3MwdTdreHloNm1kd2N5NXFuNnh3bDMyczBkGgwKBHV0aWESBDcwMDAKnwEKIy9jb3Ntb3Muc3Rha2luZy52MWJldGExLk1zZ0RlbGVnYXRlEngKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEjZjZWxlc3RpYXZhbG9wZXIxOXVyZzlhd2p6d3E4ZDQwdndqZHZ2MHl3OWtnZWhzY2YwengzZ3MaDQoEdXRpYRIFMTEwMDASZwpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfAEgQKAggBGDASEwoNCgR1dGlhEgUzMDAwMBDgpxIaQPhU7yPjHlETVAxN1XewI41sYJQUD3reB5sKp/pC8LwraQp8KxZBiCof3ovsGQqxhjvGkUctB4WQweEGpji2Cs4=',
  chainId: 'mocha-4',
  accountNumber: 47998,
  sequence: 48,
  sendMessages: [
    {
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: {
        amount: {
          denom: 'utia',
          amount: '7000',
        },
        validatorAddress: 'celestiavaloper1u655tgul3su7s0u7kxyh6mdwcy5qn6xwl32s0d',
        delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      },
    },
    {
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: {
        amount: {
          denom: 'utia',
          amount: '11000',
        },
        validatorAddress: 'celestiavaloper19urg9awjzwq8d40vwjdvv0yw9kgehscf0zx3gs',
        delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'utia', amount: '30000' }],
    gasLimit: 300000,
  },
};

export const TEST_SEND_MANY_UNSTAKE_TX = {
  hash: '11A81B3542A12F95CBBD6CA126A0A407C752DBFFA03884B7BE8DEE839A7C2D1D',
  signature: 'Nq25TSajPGzmJHGXvbzzQcCFZ452cC8bew+07nxebGQ5VorJzerlY08rmxFhsVcKRGJhZet/f8s9C0OPyQQ3tA==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CsYCCqABCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEncKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEjZjZWxlc3RpYXZhbG9wZXIxdTY1NXRndWwzc3U3czB1N2t4eWg2bWR3Y3k1cW42eHdsMzJzMGQaDAoEdXRpYRIENTAwMAqgAQolL2Nvc21vcy5zdGFraW5nLnYxYmV0YTEuTXNnVW5kZWxlZ2F0ZRJ3Ci9jZWxlc3RpYTF5bjN0OHF1am10eGpzbng3YW5nanVhM2podmtqeHk1bjV4Z3MwbhI2Y2VsZXN0aWF2YWxvcGVyMTl1cmc5YXdqendxOGQ0MHZ3amR2djB5dzlrZ2Voc2NmMHp4M2dzGgwKBHV0aWESBDkwMDASZwpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfAEgQKAggBGDISEwoNCgR1dGlhEgUzNTAwMBCwrhUaQDatuU0mozxs5iRxl72880HAhWeOdnAvG3sPtO58XmxkOVaKyc3q5WNPK5sRYbFXCkRiYWXrf3/LPQtDj8kEN7Q=',
  chainId: 'mocha-4',
  accountNumber: 47998,
  sequence: 50,
  sendMessages: [
    {
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
      value: {
        amount: {
          denom: 'utia',
          amount: '5000',
        },
        validatorAddress: 'celestiavaloper1u655tgul3su7s0u7kxyh6mdwcy5qn6xwl32s0d',
        delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      },
    },
    {
      typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
      value: {
        amount: {
          denom: 'utia',
          amount: '9000',
        },
        validatorAddress: 'celestiavaloper19urg9awjzwq8d40vwjdvv0yw9kgehscf0zx3gs',
        delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      },
    },
  ],
  gasBudget: {
    amount: [{ denom: 'utia', amount: '35000' }],
    gasLimit: 350000,
  },
};

export const TEST_DELEGATE_TX = {
  hash: '205B08B8148C27BA290945FA1A1110FE8F6A60F023D5D765E9C5EF61FD1FFDC6',
  signature: '7t7e7cuzamTzcy/8/3phcZqGvmialvRTAg4Zg4bAS5Eqki+rhHZ3K6wmfsDbWDbhMdiL0bQyt9maX8nEKMY1DA==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CqIBCp8BCiMvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dEZWxlZ2F0ZRJ4Ci9jZWxlc3RpYTF5bjN0OHF1am10eGpzbng3YW5nanVhM2podmtqeHk1bjV4Z3MwbhI2Y2VsZXN0aWF2YWxvcGVyMXEzdjVjdWdjOGNkcHVkODd1NHp3eTBhNzR1eGtrNnU0cTRneDRwGg0KBHV0aWESBTEwMDAwEmUKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQMm88fvnl7qkA521wMTBxASEoZDXVDd2IQ/TOfOjf0nwBIECgIIARgJEhEKCwoEdXRpYRIDNTAwEMCaDBpA7t7e7cuzamTzcy/8/3phcZqGvmialvRTAg4Zg4bAS5Eqki+rhHZ3K6wmfsDbWDbhMdiL0bQyt9maX8nEKMY1DA==',
  delegator: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
  validator: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  chainId: 'mocha',
  accountNumber: 47997,
  sequence: 9,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      validatorAddress: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
      amount: {
        denom: 'utia',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'utia',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_UNDELEGATE_TX = {
  hash: '5944341CE29B9CCBDD8D59B4704A96475ABB02DA0708B3944C5BDE6DA190D8D3',
  signature: 'yI7sW78CPSE4gTTdLf0roMZaWhM57RIFrkqhBHrFvKlw+7dL17yA3qOCZ+XIj1/ln+JI+Cd1tvSTI3T3RGAaSQ==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CqQBCqEBCiUvY29zbW9zLnN0YWtpbmcudjFiZXRhMS5Nc2dVbmRlbGVnYXRlEngKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEjZjZWxlc3RpYXZhbG9wZXIxcTN2NWN1Z2M4Y2RwdWQ4N3U0end5MGE3NHV4a2s2dTRxNGd4NHAaDQoEdXRpYRIFMTAwMDASZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfAEgQKAggBGAoSEQoLCgR1dGlhEgM1MDAQwJoMGkDIjuxbvwI9ITiBNN0t/SugxlpaEzntEgWuSqEEesW8qXD7t0vXvIDeo4Jn5ciPX+Wf4kj4J3W29JMjdPdEYBpJ',
  delegator: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
  validator: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  chainId: 'mocha',
  accountNumber: 47997,
  sequence: 10,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      validatorAddress: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
      amount: {
        denom: 'utia',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'utia',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_WITHDRAW_REWARDS_TX = {
  hash: 'C970F18E7513E0F4F18531EBEDA9B6C2E59DC6B0F8449064D6B72DA80E478353',
  signature: 'F5783K8r0vO5XkV44gibt92fU+dgv8KjpHtOpS1lgHRSSkrtcfMkxoi4vSlJOtz+0fWwu5S2L7Gskgoh6t7GgQ==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CqcBCqQBCjcvY29zbW9zLmRpc3RyaWJ1dGlvbi52MWJldGExLk1zZ1dpdGhkcmF3RGVsZWdhdG9yUmV3YXJkEmkKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEjZjZWxlc3RpYXZhbG9wZXIxcTN2NWN1Z2M4Y2RwdWQ4N3U0end5MGE3NHV4a2s2dTRxNGd4NHASZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfAEgQKAggBGAsSEQoLCgR1dGlhEgM1MDAQwJoMGkAXnvzcryvS87leRXjiCJu33Z9T52C/wqOke06lLWWAdFJKSu1x8yTGiLi9KUk63P7R9bC7lLYvsaySCiHq3saB',
  delegator: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
  validator: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  chainId: 'mocha',
  accountNumber: 47997,
  sequence: 11,
  sendAmount: '10000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
      validatorAddress: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
      amount: {
        denom: 'utia',
        amount: '10000',
      },
    },
  },
  gasBudget: {
    amount: [
      {
        denom: 'utia',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const TEST_TX_WITH_MEMO = {
  hash: 'ABEBFBDFD2747C2B9C8F62DF95DED14795F23844D03E06BED4F3FD242182FEAD',
  signature: 'Apti3ypffYdMJMUczqn8ZBm1ZmSmqJnDWA7L1JmOQu5RuuersVzFOrh2aFtMFLecNwWLRPAMP4ssD4BNDPY1qg==',
  pubKey: 'Aybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfA',
  privateKey: 'c3J/YwqMZ8WhKSmmmHi7tNZuvoYyqdZMzAVIBK19IBE=',
  signedTxBase64:
    'CpgBCpIBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnIKL2NlbGVzdGlhMXluM3Q4cXVqbXR4anNueDdhbmdqdWEzamh2a2p4eTVuNXhnczBuEi9jZWxlc3RpYTFtbHhjZjA2eTNsdW1lenlmNzluMHA0aGtwZzI2eWNkcjhwcmpudxoOCgR1dGlhEgYxMDAwMDASATUSZQpQCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAybzx++eXuqQDnbXAxMHEBIShkNdUN3YhD9M586N/SfAEgQKAggBGAwSEQoLCgR1dGlhEgM1MDAQwJoMGkACm2LfKl99h0wkxRzOqfxkGbVmZKaomcNYDsvUmY5C7lG656uxXMU6uHZoW0wUt5w3BYtE8Aw/iywPgE0M9jWq',
  from: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
  to: 'celestia1mlxcf06y3lumezyf79n0p4hkpg26ycdr8prjnw',
  chainId: 'mocha',
  accountNumber: 47997,
  sequence: 12,
  sendAmount: '100000',
  feeAmount: '500',
  sendMessage: {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      amount: [
        {
          denom: 'utia',
          amount: '100000',
        },
      ],
      toAddress: 'celestia1mlxcf06y3lumezyf79n0p4hkpg26ycdr8prjnw',
      fromAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
    },
  },
  memo: '5',
  gasBudget: {
    amount: [
      {
        denom: 'utia',
        amount: '500',
      },
    ],
    gasLimit: 200000,
  },
};

export const address = {
  address1: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
  address2: 'celestia1tygms3xhhs3yv487phx3dw4a95jn7t7ls3yw4w',
  address3: 'celexxxx1xxxz4q3dnzq0hzl4knpxsgg65gd43aadx689vt',
  address4: 'celestia13u434q3dnzq0hzl4knpxsgg65gd43aadx689vt',
  validatorAddress1: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  validatorAddress2: 'celestiavaloper1q3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  validatorAddress3: 'celestaivaloper1xxxxcugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  validatorAddress4: 'celestiavalopr1xq3v5cugc8cdpud87u4zwy0a74uxkk6u4q4gx4p',
  noMemoIdAddress: 'celestia13u434q3dnzq0hzl4knpxsgg65gd43aadx689vt',
  validMemoIdAddress: 'celestia13u434q3dnzq0hzl4knpxsgg65gd43aadx689vt?memoId=2',
  invalidMemoIdAddress: 'celestia13u434q3dnzq0hzl4knpxsgg65gd43aadx689vt?memoId=xyz',
  multipleMemoIdAddress: 'celestia13u434q3dnzq0hzl4knpxsgg65gd43aadx689vt?memoId=3&memoId=12',
};

export const blockHash = {
  hash1: 'FF2AD4E37810AC87039A76999C9A8C5A30D6BECDA6CF8F07858BA9932A93A035',
  hash2: '77D3D4E250E37A3238D8FDC395697109E8DFF3ECF6E901046B39689E4769CA4D',
};

export const txIds = {
  hash1: '512DD4B77AD9C6492BAC68AD461C318C2B01869C574F43C84616080980B09CE6',
  hash2: '944A0506F49DC890AF384556D67331E3952C044E1C7A86422BC71DDE75E724A5',
  hash3: '0DA223284EFC69D2503CB45991D114B50C47BD66EACCC98991A15406639B5DA2',
};

export const coinAmounts = {
  amount1: { amount: '100000', denom: 'utia' },
  amount2: { amount: '0.1', denom: 'tia' },
  amount3: { amount: '100000000000', denom: 'ntia' },
  amount4: { amount: '-1', denom: 'utia' },
  amount5: { amount: '1000', denom: 'htia' },
};

export const wrwUser = {
  senderAddress: 'celestia1afvmmaqxpt2d5wegl0q84ch22n2clntg6hu0vl',
  destinationAddress: 'celestia1tygms3xhhs3yv487phx3dw4a95jn7t7ls3yw4w',
  userPrivateKey:
    '{"iv":"kQSrV39qO/Mm54zd1fp95Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"5LLreWKasns=","ct":"W6uYXlFnHCI2sV\n' +
    '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"}',
  backupPrivateKey:
    '{"iv":"jZs01741DKIsl9GaSbVsMA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"aHatx360uSA=","ct":"5NtpKnPdDkdioG\n' +
    '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"}',
  bitgoPublicKey:
    '021013d80e799d51ddc7208618f3002ba49631e9caa98f84a2fd01ef600b0ede27132dd167f\n' +
    '76a8698dd54bae6144011271515033788621d49d4575ca5cfbee633',
  walletPassphrase: 'bitgo_test@123',
};

export const mockAccountDetailsResponse = {
  account: {
    '@type': '/cosmos.auth.v1beta1.BaseAccount',
    address: 'celestia1afvmmaqxpt2d5wegl0q84ch22n2clntg6hu0vl',
    pub_key: {
      '@type': '/cosmos.crypto.secp256k1.PubKey',
      key: 'Am9Sn9QU/ZBsbmbxTnc3ObeCKD5tpEf7hPZiJgVtAziK',
    },
    account_number: '57405',
    sequence: '6',
  },
};
