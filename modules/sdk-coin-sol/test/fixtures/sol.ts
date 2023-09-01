import {
  SINGLE_TOKEN_TRANSFER_WITH_ATA_CREATION,
  TOKEN_TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
  TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
  TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
  TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
  WALLET_INIT_SIGNED_TX,
  WALLET_INIT_UNSIGNED_TX,
} from '../resources/sol';

export const rawTransactions = {
  transfer: {
    unsigned: TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
    signed: TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
  },
  walletInit: {
    unsigned: WALLET_INIT_UNSIGNED_TX,
    signed: WALLET_INIT_SIGNED_TX,
  },
  transferToken: {
    unsigned: TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
    signed: TOKEN_TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
  },
  tokenTransferWithAtaCreation: {
    unsigned: SINGLE_TOKEN_TRANSFER_WITH_ATA_CREATION,
  },
};

const blockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
const durableNonceBlockhash = 'MeM29wJ8Kai1SyV5Xz8fHQhTygPs4Eka7UTgZH3LsEm';
const durableNonceSignatures = 2;
const latestBlockhashSignatures = 1;
const unsignedSweepSignatures = 1;

export const SolInputData = {
  blockhash,
  durableNonceBlockhash,
  durableNonceSignatures,
  latestBlockhashSignatures,
  unsignedSweepSignatures,
} as const;

const getBlockhashResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: {
        slot: 2792,
      },
      value: {
        blockhash: blockhash,
        lastValidBlockHeight: 3090,
      },
    },
    id: 1,
  },
};

const getFeesResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: {
        slot: 1,
      },
      value: {
        blockhash: 'CSymwgTNX1j3E4qhKfJAUE41nBWEwXufoYryPbkde5RR',
        feeCalculator: {
          lamportsPerSignature: 5000,
        },
        lastValidSlot: 297,
        lastValidBlockHeight: 296,
      },
    },
    id: 1,
  },
};

const getAccountInfoResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: { apiVersion: '1.10.39', slot: 163846900 },
      value: {
        data: {
          parsed: {
            info: {
              authority: 'LvDUy1MovMeusYaL8ErQAqL4PeD8H9W1RALJU3twUGj',
              blockhash: 'MeM29wJ8Kai1SyV5Xz8fHQhTygPs4Eka7UTgZH3LsEm',
              feeCalculator: { lamportsPerSignature: '5000' },
            },
            type: 'initialized',
          },
          program: 'nonce',
          space: 80,
        },
        executable: false,
        lamports: 1447680,
        owner: '11111111111111111111111111111111',
        rentEpoch: 0,
      },
    },
    id: 1,
  },
};

const getAccountBalanceResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: { context: { slot: 1 }, value: 1000000000 },
    id: 1,
  },
};

const getAccountBalanceResponseNoFunds = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: { context: { slot: 1 }, value: 0 },
    id: 1,
  },
};

const getAccountBalanceResponseM1Derivation = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: { context: { slot: 1 }, value: 0 },
    id: 1,
  },
};

const getAccountBalanceResponseM2Derivation = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: { context: { slot: 1 }, value: 5000000000 },
    id: 1,
  },
};

export const SolResponses = {
  getBlockhashResponse,
  getFeesResponse,
  getAccountBalanceResponse,
  getAccountInfoResponse,
  getAccountBalanceResponseNoFunds,
  getAccountBalanceResponseM2Derivation,
  getAccountBalanceResponseM1Derivation,
} as const;

export const accountInfo = {
  bs58EncodedPublicKey: 'BL352P8HKNq9BgkQjWjCq1RipHZb1iM6JwGpZYFK1JuB',
  bs58EncodedPublicKeyNoFunds: '3EJt66Hwfi22FRU2HWPet7faPRstiSdGxrEe486CxhTL',
  bs58EncodedPublicKeyM1Derivation: 'EoBmy4FQfhKEqiAysNXbCmhr682dkV92Yk4Y6cpUfopf',
  bs58EncodedPublicKeyM2Derivation: '89QdCRKLvajFUY3f2gZFykUZGgM5dsx3XS5VL4axrHA4',
};

export const keys = {
  userKey:
    '{"iv":"abI51qL+t0WJD/kvdO6tQA==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"IlrhJ5t0FRo=","ct":"G/NoEkgwCPQdOW\n' +
    'opq+2s43uJVzvxRBhgGRYhcaPmFJWgkN9vaU0IODvvC5WBh0fNKKvPaYXniDcfwf/onk+fr7xPT\n' +
    'R2dcn3xYWB9QyTgrzbRnP3ALmFcUuFLhruMq4cdxG6JBibEQmKpFsnBkU2+r7gCamvJq6tBiwST\n' +
    'eu8bhGaY6jJGLAyo4dwdzyE6mdOc4lisVdx9ctMuiSyEzRwFUWJL5nLULD4MiXaN6lvJaSMmhmw\n' +
    'QUxE0KZ2QOqaA5mPU6wTJvNA+67E/F/zc3clyC5FSRIU/I8mCx1n9H+QOncdqhdOUvH8f2tJRYv\n' +
    'kyEjkcziQd8pBtkwUCEtd2ULlYcszHUKI3UOvo3wDP4aoOqu+1VQB2c+aM1LzpOLr6T4hnFsWIC\n' +
    'zE8uODWGFa0yILvrHp5thQPLQvQ/IS2SDl5IIR9dWGJife1l5dDUWCLBykhiq7ipASvakYR82As\n' +
    '68AdtlpSVsSdfmrTeogG+AtchfbMGBeyt0qYvczbP1eiFV+zRKFhRavvAUX+LfhHGD0iSeWyof/\n' +
    'RQDmgC5Nj+/yHwQ985S61RdthPwyJ1HWzB1fSb41nX3tPxMPL0OXn0dg3Qv78RsOpD+bb/EU7Yu\n' +
    'DGu6r2R0mP50YXY583w/+Ku95z1CydUzzd+etJ6rZCtogRj/Xuk7VbFbd66QFEKkmoyjU7Kw9XQ\n' +
    'pYK1xlShCe1uZrPvQq942trVP83AM14IwLDxnFR7GmTJjEvf2Ojxb+9EZyYvGhQnIId6IpLtOfV\n' +
    'AtDI7rHM0K0AgabGtUjhUA3GAtP+U/pO7u58JIXjqcQovMLUcjzqR9kWSWVyviKjJ/8g7rI3N26\n' +
    'tA+KFV4olxuAU2nwd1Hs4U/V7IbRyLf2UN9xZxd+XdT5aRdMt72EDjY44CEoj919+yt6v/ekEJT\n' +
    '8OBQiLAbHnxx9awIBqR68aKTr+ysv4b5iwX3S+BMasv2rMgeGdE6clkNHCVkieiUalkkZLM5aqF\n' +
    'v6JHFev/tdZNzMbPl9F2JPRkas="}',
  backupKey:
    '{"iv":"1cOLqQflLZUqiDVpoKI2SQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"i50ZX4iKnpg=","ct":"ckO+rOwDQJGP1h\n' +
    'hLXRpje98DZ+pYo3LFRm9W8T349FZQ2JfPe4dHcddxmQPLTiyaMRJZCPQmSXmK0kYM7HyQmIGb6\n' +
    'FtAB4W5WTjukxjes8fftPlfiwSrMbDm5VIf/qPv4/k/Cd7enUnSHUUUjTy5iqli0ea47mh3l52b\n' +
    'PYdnw4RwX0gMT/Jl82HHUYZazMe9AK+hIJuLJsv3PnUSz1SKhSYz0Wi9InSzVF7/HyG6IMmFbWM\n' +
    'gyBPNIjaILaDpa/4rKoHBJjCDhO70rq5hjU3t0rKwbdUVcGf9HhvQwAINbWmY+Kx4YHfD622oRp\n' +
    'D4hgcTWn5NtRu/t2/eBM72Nr+wsRanCk2CoO3L9saoQlE5M8jPPZ1oZkpnSsjq9DFCDTHM0tT4c\n' +
    'NUcSn7z48E0a6fnQJamWE0taEFZpZfwrF63iDiK6Txc1vUL7S/mZgWzJSOogSBEbbcQYvxHizYe\n' +
    'wwezSUkQ+MrRLYmnzgnWQYLnRuR6iOevPfH/5VnW5tE1mKx1nstx1MyGcWCIyYZ4Vsjy2N2X6L6\n' +
    'ZAYsIzucrmyBTK3r8zFIu5RIVB3165SakvyLy0Tgkw/WxO1Ii5ydw0EKKQLbjWKcxvsH0Os5xYt\n' +
    'Qk5VfeCoXO140LhBEeD01F3fGeF1Cgi0pm3IEcgWaw14cfHCDjKFAwiSQINJAFWRT1fz8vn3yFu\n' +
    'aEK/HIufxynCYzLzIplabgJ7tCbCmVHQyg12ijz6G0UOvgyDFsQxRtTgr5kJNjbpbH1qhv0AnfZ\n' +
    '4VTHKqJpsA826ZlmFc5uTZijcXtwTRmiMrAxyR0MmYL8EhdFtak+MbMyyqOxOsq7gpgCpxp1JbP\n' +
    'OlrvWZ+vdfz6eiNR12A0ToLVrjhfnRsiljMpcxMNDUNZHzUQUIzb0LnMn8/WJ4/hXGso8bqboms\n' +
    'oBM5Jvu9XtPLcmfiA5FZSXfWpHbgAIBhITIDyGy5MzHau7bnNoImIWOpch7IKGAK0m8s3BLWevx\n' +
    'ahjFvzJ48z99NVMkDLzXeiv"}',
  bitgoKey:
    'd3530bb015dadd34c8083d544794ac6e4e0fa4ad21c1167ad590baf9b0482b9bcd6c3b9e55c\n' +
    '5cd9bf18bf96e27edd8b7f58f9f51ce0a256c5a793aeaff8db811',
  bitgoKeyNoFunds:
    '4368cecc6b8290fdab5e449c70673c5cb8d7f76481db807d41d16629143a2e1d6d97c5672a0\n' +
    '3060a1777530681a784cb15165f41e49f072d5eb8026d7a287b35',
  destinationPubKey: '3EJt66Hwfi22FRU2HWPet7faPRstiSdGxrEe486CxhTL',
  walletPassword: 't3stSicretly!',
  durableNoncePubKey: '6LqY5ncj7s4b1c3YJV1hsn2hVPNhEfvDCNYMaCc1jJhX',
  durableNoncePrivKey:
    '447272d65cc8b39f88ea23b5f16859bd84b3ecfd6176ef99535efab37541c83b051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c',
};

export const ovcResponse = {
  signatureShares: [
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7yd8LOXvsLtO2REqMM/OCZ8wItfsqfTfia2xIfibRW3wHgw63jiaojbXeSqaYajJ/Ca7YwBUz5blydI3fYLgPAgECBsLVtfT7mpvNii8wPk0G942N7TAHE/RW2iq/8LPqAYWqBRo0vIrNQ4djl2+Wh2EVBQ9zgoVTVm0RHXrIv/6/WHxPX1mHv+JqpmAT79ltNjYPK0M2yR+ZMln7VgUTBWFNQvLqE/j/nXlY2/JpxuNr/fXLXEPeS04dPvt9qz1dAoYEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAADpiH20cxLj7KnOaoI5ANNoPxYjs472FdjDeMPft3kXdAgQDAgUBBAQAAAAEAgADDAIAAADwopo7AAAAAA==',
              scanIndex: 0,
              coin: 'tsol',
              signableHex:
                '02010206c2d5b5f4fb9a9bcd8a2f303e4d06f78d8ded300713f456da2abff0b3ea0185aa051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c4f5f5987bfe26aa66013efd96d36360f2b4336c91f993259fb56051305614d42f2ea13f8ff9d7958dbf269c6e36bfdf5cb5c43de4b4e1d3efb7dab3d5d028604000000000000000000000000000000000000000000000000000000000000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea94000003a621f6d1cc4b8fb2a739aa08e4034da0fc588ece3bd857630de30f7edde45dd0204030205010404000000040200030c02000000f0a29a3b00000000',
              derivationPath: 'm/0',
              parsedTx: {
                inputs: [
                  {
                    address: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
                    valueString: '999990000',
                    value: 999990000,
                  },
                ],
                outputs: [
                  {
                    address: 'HMEgbR4S2hLKfst2VZUVpHVUu4FioFPyW5iUuJvZdMvs',
                    valueString: '999990000',
                    coinName: 'tsol',
                  },
                ],
                spendAmount: '999990000',
                type: '',
              },
              feeInfo: { fee: 10000, feeString: '10000' },
              coinSpecific: {
                commonKeychain:
                  'f342b7b3bfe5086d189bc0886139d3fbb1669381d725d9f6b6b522c62c8c14e8d772493a05c9bb82fb1adfb42dfae30f8746c3dc17bc0183806094f66d5e2fe0',
              },
            },
            signatureShares: [],
            signatureShare: {
              from: 'backup',
              to: 'user',
              share:
                'f47e2fdd3d93346ae8db9a51ef45e89b7decc3a216cee3a56f0cb8eaf0cf811b04266d87b78fe27f9f4236c79ec62078562dadb220390c7e1264e28b6a2c5c0d',
              publicShare: 'c2d5b5f4fb9a9bcd8a2f303e4d06f78d8ded300713f456da2abff0b3ea0185aa',
            },
          },
        ],
        walletCoin: 'tsol',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: 'c2d5b5f4fb9a9bcd8a2f303e4d06f78d8ded300713f456da2abff0b3ea0185aa',
            R: 'f47e2fdd3d93346ae8db9a51ef45e89b7decc3a216cee3a56f0cb8eaf0cf811b',
            sigma: '285e34777d5d722fdb80b4eae20a64fc7877b39700f05b5b2e40d0af5e4fa801',
          },
        },
      ],
    },
  ],
};
