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
