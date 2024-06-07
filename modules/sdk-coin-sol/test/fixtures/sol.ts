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

const broadcastTransactionResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: '2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao8rkxwPYPe8cSwE5GzhEgJA2y8fVjDEo6iR6ykBvDxrTQrtpb',
    id: 1,
  },
};

const broadcastTransactionResponseError = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    error: {
      code: -32002,
      message: 'Transaction simulation failed: Blockhash not found',
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

const getMinimumBalanceForRentExemptionResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: 2039280,
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

const getAccountInfoResponse2 = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: { apiVersion: '1.16.11', slot: 242229086 },
      value: {
        data: {
          parsed: {
            info: {
              authority: 'LvDUy1MovMeusYaL8ErQAqL4PeD8H9W1RALJU3twUGj',
              blockhash: 'CuuXb4dLUAgw12KmV9Lb1LHm67ojTZxwMfnwUGpyqMvP',
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

const getTokenAccountsByOwnerResponse = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: {
        apiVersion: '1.17.5',
        slot: 259019329,
      },
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  isNative: false,
                  mint: '9cgpBeNZ2HnLda7NWaaU1i3NyTstk2c4zCMUcoAGsi9C',
                  owner: 'HMEgbR4S2hLKfst2VZUVpHVUu4FioFPyW5iUuJvZdMvs',
                  state: 'initialized',
                  tokenAmount: {
                    amount: '2000000000',
                    decimals: 9,
                    uiAmount: 2,
                    uiAmountString: '2',
                  },
                },
                type: 'account',
              },
              program: 'spl-token',
              space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            rentEpoch: 18446744073709552000,
            space: 165,
          },
          pubkey: '4FaMdTh9uwmroyfBxgtT7FfZV6e6ngmEFBJtXBUjjoNt',
        },
        {
          account: {
            data: {
              parsed: {
                info: {
                  isNative: false,
                  mint: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
                  owner: 'HMEgbR4S2hLKfst2VZUVpHVUu4FioFPyW5iUuJvZdMvs',
                  state: 'initialized',
                  tokenAmount: {
                    amount: '3000000000',
                    decimals: 9,
                    uiAmount: 3,
                    uiAmountString: '3',
                  },
                },
                type: 'account',
              },
              program: 'spl-token',
              space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            rentEpoch: 18446744073709552000,
            space: 165,
          },
          pubkey: 'F3xVrafJVoKGHfzXB6wXE4S1iBAwH6ZigpNhQcybHghM',
        },
      ],
    },
    id: '1',
  },
};

const getTokenAccountsByOwnerResponse2 = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: {
        apiVersion: '1.17.5',
        slot: 259019329,
      },
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  isNative: false,
                  mint: '9cgpBeNZ2HnLda7NWaaU1i3NyTstk2c4zCMUcoAGsi9C',
                  owner: 'cyggsFnDvbfsPeiFXziebWsWAp6bW5Nc5SePTx8mebL',
                  state: 'initialized',
                  tokenAmount: {
                    amount: '2000000000',
                    decimals: 9,
                    uiAmount: 2,
                    uiAmountString: '2',
                  },
                },
                type: 'account',
              },
              program: 'spl-token',
              space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            rentEpoch: 18446744073709552000,
            space: 165,
          },
          pubkey: '4FaMdTh9uwmroyfBxgtT7FfZV6e6ngmEFBJtXBUjjoNt',
        },
        {
          account: {
            data: {
              parsed: {
                info: {
                  isNative: false,
                  mint: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
                  owner: 'cyggsFnDvbfsPeiFXziebWsWAp6bW5Nc5SePTx8mebL',
                  state: 'initialized',
                  tokenAmount: {
                    amount: '3000000000',
                    decimals: 9,
                    uiAmount: 3,
                    uiAmountString: '3',
                  },
                },
                type: 'account',
              },
              program: 'spl-token',
              space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            rentEpoch: 18446744073709552000,
            space: 165,
          },
          pubkey: 'F3xVrafJVoKGHfzXB6wXE4S1iBAwH6ZigpNhQcybHghM',
        },
      ],
    },
    id: '1',
  },
};

const getTokenAccountsByOwnerResponseNoAccounts = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: {
        apiVersion: '1.17.5',
        slot: 259020450,
      },
      value: [],
    },
    id: '1',
  },
};

function generateValues() {
  const tokens = [
    { pub: '7nLPX6gmwAKrgYtR84qgCLz1f57Y561BceLeqMyy5VmS', mint: 'Ex6rHLLmvZoP9mpunMFvew424seSjPp5PQb5hDy8KJu6' },
    { pub: 'tTgPkxhJZC7djSb8YxLHzkXoAXenFZf3aHVKGysLiW7', mint: '9kLJoGbMgSteptkhKKuh7ken4JEvHrT83157ezEGrZ7R' },
    { pub: 'i34VuFZY1Lz8Tg9ajAqq5MNjE3ES32uVR8oPFFtLd9F', mint: '9cgpBeNZ2HnLda7NWaaU1i3NyTstk2c4zCMUcoAGsi9C' },
    { pub: 'Fxbh3i7s6hjVK2gZ6n6JdFwHxK78hECdhpkYcKZmiVCp', mint: 'D8YXLiwWQMibWRaxCTs9k6HwaYE6vtsbzK9KrQVMXU1K' },
    { pub: 'DS34T8TurqopxjupwTShZNoZ2LvGbcwoA7rMv1JBZBAF', mint: 'Aub3Nun71bD5B98JQAivGtEdwCuFJVvZVXKkcVJkuzgh' },
    { pub: 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg', mint: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf' },
    { pub: 'Eg4XVUKdMRwxoEwTgRS1VCWECbaeYM3RFcuycocQUAZw', mint: '64bco36MjrZ8K26FXZGoSrnDFDSCZhvJGfQ5ywLRFUpF' },
    { pub: '5sErqm6TdUvxEWQ6cLjd3fUnHbnkUHiYA8uqoDzhFsf3', mint: '4yQY4kNGCCM5rCWiQMWHFe5q3b5o7AqGWbx3XyeTti5h' },
  ];

  const result = tokens.map((token, index) => {
    return {
      account: {
        data: {
          parsed: {
            info: {
              isNative: false,
              mint: token.mint,
              owner: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
              state: 'initialized',
              tokenAmount: {
                amount: (index + 1).toString() + '000000000',
                decimals: 9,
                uiAmount: index + 1,
                uiAmountString: (index + 1).toString(),
              },
            },
            type: 'account',
          },
          program: 'spl-token',
          space: 165,
        },
        executable: false,
        lamports: 2039280,
        owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        rentEpoch: 18446744073709552000,
        space: 165,
      },
      pubkey: token.pub,
    };
  });
  return result;
}

const getTokenAccountsByOwnerResponse3 = {
  status: 200,
  body: {
    jsonrpc: '2.0',
    result: {
      context: {
        apiVersion: '1.17.5',
        slot: 259019329,
      },
      value: generateValues(),
    },
    id: '1',
  },
};

export const SolResponses = {
  getBlockhashResponse,
  getFeesResponse,
  getAccountBalanceResponse,
  getAccountInfoResponse,
  getAccountInfoResponse2,
  getAccountBalanceResponseNoFunds,
  getAccountBalanceResponseM2Derivation,
  getAccountBalanceResponseM1Derivation,
  getTokenAccountsByOwnerResponse,
  getTokenAccountsByOwnerResponse2,
  getTokenAccountsByOwnerResponse3,
  getTokenAccountsByOwnerResponseNoAccounts,
  getMinimumBalanceForRentExemptionResponse,
  broadcastTransactionResponse,
  broadcastTransactionResponseError,
} as const;

export const accountInfo = {
  bs58EncodedPublicKey: 'BL352P8HKNq9BgkQjWjCq1RipHZb1iM6JwGpZYFK1JuB',
  bs58EncodedPublicKeyNoFunds: '3EJt66Hwfi22FRU2HWPet7faPRstiSdGxrEe486CxhTL',
  bs58EncodedPublicKeyM1Derivation: 'EoBmy4FQfhKEqiAysNXbCmhr682dkV92Yk4Y6cpUfopf',
  bs58EncodedPublicKeyM2Derivation: '89QdCRKLvajFUY3f2gZFykUZGgM5dsx3XS5VL4axrHA4',
  bs58EncodedPublicKeyWithManyTokens: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
};
export const tokenAddress = {
  TestUSDC: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
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
  destinationPubKey2: 'HMEgbR4S2hLKfst2VZUVpHVUu4FioFPyW5iUuJvZdMvs',
  walletPassword: 't3stSicretly!',
  durableNoncePubKey: '6LqY5ncj7s4b1c3YJV1hsn2hVPNhEfvDCNYMaCc1jJhX',
  durableNoncePubKey2: '4Y3kQtmVUfF7nimtABPpCwjihmLgJUgm8eZTAo44c4u9',
  durableNoncePubKey3: '6UW2N7eynvw1zjULpGDxPorJHj6wpvVgiFUcjzwoY6fg',
  durableNoncePrivKey:
    '447272d65cc8b39f88ea23b5f16859bd84b3ecfd6176ef99535efab37541c83b051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c',
};

export const closeATAkeys = {
  userKey:
    '{"iv":"tdxJRqIZeAmwW7/DWfslCw==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"f1pErh1sAJ4=","ct":"mCGBRKlQNXRz+N\n' +
    'N7Ji3Ee2lHT8HD0ce353sZBe32xrnzClTZasI9BqEI6H9TycnkEtI1guN8utmVD3Hkyd24k89Xg\n' +
    '0Wm85NFR/I4li6lAEPFNSajRUTgUxaHLEP/yNFxjE1y+N247H9jgKRJG8IYAsQE+p8kYTPkv637\n' +
    'crpdz2uv0bw4duD4lzyfAi6WZ6DArAOJu1Oisq7uJg7YTc4MV33SUHx9E8PQJ8PJiugeCgNYNCQ\n' +
    'XoUPxRcR4Q5vtrQ+58F7sFs4KxDmTZUVHHQw6PRLkfseZUYL58/hr/XB2Y+i2bp2tdqEDbxO+Nn\n' +
    '+cZcTWAGlZWcJy6Lhf5GO4OriOBST2UyqwvPifIbI4FC0OR1bD5g3f8C/iUtXz0MsHnfEWM+SlG\n' +
    'PsbzLRoEjGn55gSYWTSY+bgNqMYIAHgOwEtdD4wNJYRuMOXq7HepD4U2CWTj1Plz9zkkBEMspzV\n' +
    'ycWQpEKY4FTfPXQ7KPQFbcLkVuMlnXGAU4F69Xs7sDp1vdE9lhvAp1UStd6VJNkaAVaK7DWxNke\n' +
    'uXad5T2sLIjHZ6xatVqvFeg3RSjPOKron6SOZBHmmMvhMsJLQAk91AVKGCoHQSvcEQQv9j4aA54\n' +
    '7Vr74aK8205Fyl14iDMen7Mxwd832wRxV331gAgzkNfNtzkI5X89BYe09fEZUxaAnZ41Q50c9tm\n' +
    'qWybmbenaY1jvbJM8Hb3s/HrStY5rbEEfs9uEOuvHgjFH3x9z7dyX6FwQQX9eGq2bhsaGWnH2OJ\n' +
    '93Qd+HSYMMMx7WQdoR6Q1RO+wOUCO8SNKrl7JB3/Q0PNkG4/NNPSHMrmz/cLhtS6gWoEDOH4sFq\n' +
    'PnFKPuDSgAj5bCGLphFvCmkKpzzAe09ankgtvcHnApOgIyxsFAWSIsnAZZPQS27+BBWUEC1/zn6\n' +
    'bZsp4Tb3bAERLBRD0fnKWzBqc0mKRkhlAiG5+PXLkEWZb7AWdHkKEXUHK3PySQBESpmuDCkmLVh\n' +
    '041t+7u7ww20yvOAwFPpGX/VQe9XW9m2Qg+iggGZP+yGukCJKlI+ctXgE/BcMWXbiO2Ndhc01wE\n' +
    'HLaKfqw/Etjt7BZEW6aqCEjZ5/EBD4zCY6RNuPpjroTu5EWissCT5DagAyMWt7GagKGuKo1YNWp\n' +
    'dFRX/mhxg8tw7IJz3JnmcPI6IqzPtFjTVi88/qnFguuIkcyMQPkSmHq7r06iSCDwl"}',
  backupKey:
    '{"iv":"+zCbKLiK3DF63dlFem5++w==","v":1,"iter":10000,"ks":256,"ts":64,"mode"\n' +
    ':"ccm","adata":"","cipher":"aes","salt":"DyYbR+D2OqM=","ct":"zQDYsLpMr6YmKi\n' +
    '6vtQN6KCvTk9JQUj95Qnxb9nfla2cx8vttXMp/OK8+U4wn0M9yaCA4fznThPTyaQgZ5x2/nf2Vi\n' +
    '7dz/IX+HkeR8Vz01QKVWKgqFidrVMVlgKi5wFLcAecC5XQ4T82XcfnlWEp+Z/gjj9MygcUBVedW\n' +
    'jqhLmnaqJUZDDo8UChj4VC0tBPHyPiQIOtbqTiHlWyeqwAEjg4WzwPI71KvPBBqGy7lqhRFKeg3\n' +
    'j5Z5qAj/cxdiL9MmKYtdkVQO1xIylrqiuqPg/WATeJ+zWyDy7WuNNI88Hh8690utqNV0FPnp6su\n' +
    'MaPmhA+0au6ACBtqnaBrK+3LM26MSavkmFPl6kt5fpMVDpm0uAw3FdO2srPKkEC9JXhcdcTn3QQ\n' +
    'uET9vvB5g24ZgtvFT0R1R6V+yG+2bs3PNEEMwDnl0TFuEIxsGbXVYmAoKiIzPomX7bN162mpZw9\n' +
    '6dlg/ooZ1J6HqaDzKB/ruRi+pC0lBxoq+mn5UfXXGKjyLzmW+w/R96m53YuBbuwbOTP8fNQQrFX\n' +
    'Ukryq6NvWXgXiIpGw6pyYfTYQT/Q9lxP7oIlu2m46vvMszp+P1aQMbyfiMaxU7MxYa9QJRiiThN\n' +
    'mGf4i7CDZsNqcoVCkTCLQfDJHl9FvAxsu1sqlzq/6GZyPrl9QshkB/GVzieNk5cuQQiV/mITiWG\n' +
    '8UpF/BGBVsIlJtny8u28DlSy+vhegizhV8MRAwZSzhiMe7jwWw1AM8YTiUaK0hbJGt0cJauZhUu\n' +
    'wXr8/queFn+i+cG5/Gpwr0sQizLzf4hzggFDGUaITcJlfd0Y1S9p9IfSxhieKA3MGOEvVRtOpxa\n' +
    'RgS8EtIeWEJlYmVQ2nh4jiP0TGni5KI8xe9eB+U849Jf+qL0DRFyf6tq5Jy2sSEmpFbQlLy/QM0\n' +
    'oKTTsFclqgtnWP7fmBfMQXZCRqHgnucAvTom5UtyfrIsU1TjHwHbx0mQLMHZKGj/ZyM4GSPiSsr\n' +
    '54q3jGalxuSlQOlYPcAOaGm1sSl3VyaYmTmY5JZZKkmM2cvqLG/WqZaF65gVgaom3ZrWQdy7/Oz\n' +
    'RnEX1VTkP1cSeqdSs5HuiXZ1dQ0bXsFel7HgAAAllkSkv1rkc3ncujMJCeIRlMm2v9xjBtdBITy\n' +
    'w+P6nc73r8HBH+qsyuZJ9lfC0nYFr2KIgFFrdELIzE6do2JMZtdPHPbxeHvwmFg=="}',
  bitgoKey:
    'c6fb4543578d4a326d71ee8aeddf3ed24e2b2f2930e013ad518bd7795ab17d330e4891e8a3c\n' +
    'c2c83b1434424dfb66756fd6eb166ad10f667e351ebfe686978bd',
  closeAtaAddress: 'ESj8juGxsWFKKfqDUEbPLGgJ2ZTzKXZm7WVqGGkJKSTs',
  bs58EncodedPublicKey: 'GuYaM6jMbkdzSwgkTUvcjSZe9j95hShWAMEAge1Xnq3u',
  destinationPubKey: 'DTn5zvSLiHJ4fApHobgkzcHzSdgM4Hc9Enkfy2UCC8oo',
  walletPassword: 'bitgo_test@123',
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

export const ovcResponse2 = {
  signatureShares: [
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNJM2UWbBUH5wT0JJHILlhCs33HX8DeE/8Tdsw6tGfZoMhCnSKv6TPWtBxy7Sb6sW8ksCUPnAWuHGGKmgjEMBAgECBmLrqxJrY2kbN/tcrQw3P8P15OljFGabFJAKBrUO1grNBRo0vIrNQ4djl2+Wh2EVBQ9zgoVTVm0RHXrIv/6/WHxPX1mHv+JqpmAT79ltNjYPK0M2yR+ZMln7VgUTBWFNQsLVtfT7mpvNii8wPk0G942N7TAHE/RW2iq/8LPqAYWqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAIZQniiS73D6mwfpnfhVMC4lyYJtRSrmoZpF7yIlUdIDAgQDAgUBBAQAAAAEAgADDAIAAADwPc0dAAAAAA==',
              scanIndex: 1,
              coin: 'tsol',
              signableHex:
                '0201020662ebab126b63691b37fb5cad0c373fc3f5e4e96314669b14900a06b50ed60acd051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c4f5f5987bfe26aa66013efd96d36360f2b4336c91f993259fb56051305614d42c2d5b5f4fb9a9bcd8a2f303e4d06f78d8ded300713f456da2abff0b3ea0185aa000000000000000000000000000000000000000000000000000000000000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea940000086509e2892ef70fa9b07e99df855302e25c9826d452ae6a19a45ef222551d2030204030205010404000000040200030c02000000f03dcd1d00000000',
              derivationPath: 'm/1',
              parsedTx: {
                inputs: [
                  {
                    address: '7f9P5FqH9hDsWzM13F9yiKpgyDLCiE3unnxx7KgKkhik',
                    valueString: '499990000',
                    value: 499990000,
                  },
                ],
                outputs: [
                  {
                    address: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
                    valueString: '499990000',
                    coinName: 'tsol',
                  },
                ],
                spendAmount: '499990000',
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
                'd40f2f33a62ee2b01d8e8de57a092192bf4fb5b5d2e6169bf311b5edc61547651f27370be7c76ff5205f40ace949bd88f01b18e0dcdf78aeed33afac9f720209',
              publicShare: '62ebab126b63691b37fb5cad0c373fc3f5e4e96314669b14900a06b50ed60acd',
            },
          },
        ],
        walletCoin: 'tsol',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: '62ebab126b63691b37fb5cad0c373fc3f5e4e96314669b14900a06b50ed60acd',
            R: 'd40f2f33a62ee2b01d8e8de57a092192bf4fb5b5d2e6169bf311b5edc6154765',
            sigma: 'fb0de01cb8d26bd1fae9649f14db9b43120f724c490f296d90fee4b0b0dff508',
          },
        },
      ],
    },
    {
      txRequest: {
        transactions: [
          {
            unsignedTx: {
              serializedTx:
                'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcp9xJp3TFHdivEbhwJKldR4Ny+pasoFx+Bgk8q6g1iNiq7XSi1Ov3bs7euMkTj7nDRFqP8lv7xLTcvrBm9OQJAgECBp14ImBCdmVROlw0UveYS1MvG/ljCRI3MJTFmsxuXEoWBRo0vIrNQ4djl2+Wh2EVBQ9zgoVTVm0RHXrIv/6/WHw0hyxvpVwtIx9/zeX2O16eTrY+aKIh1mdKg4MMg0eyxMLVtfT7mpvNii8wPk0G942N7TAHE/RW2iq/8LPqAYWqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAC7ws1XFslinwgtpISUViVWIVTHyD2Q0qj24YjKmrAmXAgQDAgUBBAQAAAAEAgADDAIAAADwPc0dAAAAAA==',
              scanIndex: 2,
              coin: 'tsol',
              signableHex:
                '020102069d782260427665513a5c3452f7984b532f1bf9630912373094c59acc6e5c4a16051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c34872c6fa55c2d231f7fcde5f63b5e9e4eb63e68a221d6674a83830c8347b2c4c2d5b5f4fb9a9bcd8a2f303e4d06f78d8ded300713f456da2abff0b3ea0185aa000000000000000000000000000000000000000000000000000000000000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea94000002ef0b355c5b258a7c20b692125158955885531f20f6434aa3db86232a6ac09970204030205010404000000040200030c02000000f03dcd1d00000000',
              derivationPath: 'm/2',
              parsedTx: {
                inputs: [
                  {
                    address: 'BbhFquGMfMz2KcMrXrqZZhKD1GLcvBgtJnaA5sE7viv9',
                    valueString: '499990000',
                    value: 499990000,
                  },
                ],
                outputs: [
                  {
                    address: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
                    valueString: '499990000',
                    coinName: 'tsol',
                  },
                ],
                spendAmount: '499990000',
                type: '',
              },
              feeInfo: { fee: 10000, feeString: '10000' },
              coinSpecific: {
                commonKeychain:
                  'f342b7b3bfe5086d189bc0886139d3fbb1669381d725d9f6b6b522c62c8c14e8d772493a05c9bb82fb1adfb42dfae30f8746c3dc17bc0183806094f66d5e2fe0',
                lastScanIndex: 20,
              },
            },
            signatureShares: [],
            signatureShare: {
              from: 'backup',
              to: 'user',
              share:
                'e2e1380e7398e05947ce65a3e9ca753a2957024032b329e8d5bef149c636c481d04cc96a656c063f0ad62fb55d46edeb39880b5cb7146db613e26968fd1e0a0b',
              publicShare: '9d782260427665513a5c3452f7984b532f1bf9630912373094c59acc6e5c4a16',
            },
          },
        ],
        walletCoin: 'tsol',
      },
      tssVersion: '0.0.1',
      ovc: [
        {
          eddsaSignature: {
            y: '9d782260427665513a5c3452f7984b532f1bf9630912373094c59acc6e5c4a16',
            R: 'e2e1380e7398e05947ce65a3e9ca753a2957024032b329e8d5bef149c636c481',
            sigma: '4a9064a9f59942a4a0f6cfbb6939577b39b9bf1a25f8f97ab7b3e954d4ce1f02',
          },
        },
      ],
    },
  ],
};

export const wrwUser = {
  userKey:
    '{"iv":"1ngPVLcgxlv5FSh1ygiR2Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode"' +
    ':"ccm","adata":"","cipher":"aes","salt":"p7A2qFEeWh8=","ct":"a2xFegpYHeqBSw' +
    'cRvMq4ja+QPAxuJUwVIYmUz/oT6DzNDXc/G45rM++sj59vewHdmcDW+ayaqPaYZNzzQlOBDErww' +
    '7ZDENSZfA/Ph/2/4xDBm1CKeNKnjtSz/yj4muMcaiW2/hwmdusVokWlN8rkEQQZv671z6A8h0u7' +
    'fq9W22JfPJSB7KM5BYylIWhl4e6p4JorQ2sMDAeswFKjIrwzmljA112C8XJOYZDRED9LCN3/Z08' +
    '7/3xeT8coFQKRXFFc2JWDjMGxi/eg/tl53VUvO1B4c0061kIRktO1aLM/nj75i+B8SITemgkv4g' +
    'iZekPo9GaQtnkM5HEWMyLBW6LZ12DApnDfx1NE5aEAJNpNVgwu/Yvfs3/lAabm6ctdb/9aNXQlE' +
    '4cQRHGuz5TqEPKJGPtzXzfLAmydYmatvh7MPcJtHjtxdt/4+FhsDlxa8RjqEnNksEY1mMM6li67' +
    'kCqks2mqFtSv9OpAOjhlc7tscJO7NgdV2sqLJFvoczg4SOz+S2EtXWowdvhzgudjtP8s9aAXduV' +
    '/rmNDtpK0kf5ODoaJgbGe7m6YFmBgCSJXBUWSbtB70mgoKmyfwC7qP5XAbwYOLZQzq2d/hbp85J' +
    '8vU4E8fEQvAQSIee2fwobNZHLaO6+UQu3ucSGVLCKJ9WevL1veEzL6f9SeNJQYhKa7tV0jHYBSd' +
    'SU2J9myHqXNa1X+2QmtzOiHthv9V6VghDrtXKPNbajMUA+u35C3613w76lX8tEv2nqYjp1fY1NJ' +
    'h8FP8rLNd7R3Bn7iWHwHw4sllqLBog4XRdPaVaeCclNeNLhQj3czOMS/JI/rW2h3A3azrQw3Hac' +
    'Jgma13hYzc4e6sWb+XjEke44p45TWc72y9hxAQ4+TZTIDM6EGXT1xRu62mwjOyaq+vFkw6T5ewQ' +
    'rpAAsIwKtjhF0ILN4+OD55jKjjVzjJgFUGtTzyrkBWRzqv949Fr6aqV6x0eoLKJ1l028Mq4/PjT' +
    'rb1pTyVcGOaa0xRBW6BMnhOSkbi+xE5Kv9kSLghXNl02R5CwO0Px2jD3vG0Pm1V/H+ZHlJsuLUo' +
    'rAnOlAXArTqeQGLv90wlUr9JsQc80gjtiYVBIBPKzeGxnx7yMbj9x9fKvAglKSAGbiNwl9/REBX' +
    'E7EXY3veDG0pJdYag3N0m4eXz6ITMctyFsVKQZALPDSsSmaZR0UcjbOOIC4YuISB9"}',
  backupKey:
    '{"iv":"wBepCUHdDonP5AVkRCTkkQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode"' +
    ':"ccm","adata":"","cipher":"aes","salt":"ETz6faBtlh8=","ct":"CldHw22d0wWFPd' +
    'dbQQcQHXfd6p5BvcE2Khp6FK57SdqUH9VZnTFjH6mqDYj0LfYVjtDkl/USckeYX5vI59iSrGxsV' +
    'rOQWmRpyRObpPp6dcm06sBO+6gWvPWB62508XpIUN4g1aCbpOY1MUNEzGHIIjM44JPBj9BJRqr5' +
    'DBw+fZrpp61UGx/4tYKB4+g65drybj45TW14BwJcu1vTZvsCs+JMmxxfnobqkCIjehIWn4dULl/' +
    'Nl6f2/v0AJryI1XnomvTesTLAEUKI0dXAJhTBqGwgTbBdN+XdoqTbvMaBdY6Qe2fQjoxnvbQZyg' +
    '18sHbaLpKVrKEBbhQ9CbamFHXRu88Vshrp9uymeoAaNjMeMGJLEiigeg2dNOraj6LTfFpmL+RF/' +
    'z2tgewGrLAuDm8t5t3aJF3Aj4bAZcBgSQqzLiNcKUWXQER/Tfx7cPCYXtJh3Krij34pQG7ZkA91' +
    'YPYFNjWgs0OfnHrOSZWYm9fS1IMGp0/qZaPilOSiHfcVI2Yc5+i2lsK+jyJh3qUQU00s8Edlzu3' +
    'XpKbxlNZW48R63w9YsuUZ9PJkhT3YMIDwissUl1h7zeE0kwuaaERPxJiT1G5b9NS82sdZVEH+1B' +
    'i/u3p65R/Zm/d81lneTHIaRRFRw4tLvwQhb0YVF4jph/ZruvqVQ9sXf81iS0wM1vbyvdHuSYk1p' +
    'PcovRNnjQerurSSODO+xWup2gNkSLy3K6Vyjg1179+Aqsc2wwko4wHihubpWn2TJ+QqVNBPBDbN' +
    'jhIS9o6+c5ZsRRWWfVZyRjPwYd7954ulG/uF8HaK2bkABkGpP10Q6ckb+t/HoN1MpGT/XXCxpLa' +
    'ElxM5vj7+eekIKxN9yvKDwShseH7KqWwwZmnavqb1L5QnfG91XdokrE0Lqz/H1xiNxyW36WE2xj' +
    'Fi7WV5RoySvTLNviXvH9apoZ8RR86mOnl0bAG4VbFmBf3a3jqIMm6yVyHT94Fnlz3V6yIibU2GB' +
    'TFHeDu935KOFDhNmw7qti+TZxdLDvZsDKKR7AsFrZwmreFwHjg9Tao4JSmUJd3tHfaW71+T0kZQ' +
    'SFwXrgMb5Lzr78WkhmEA7oZWrJP36X87CI8hMFhKwSb7FzfSHZCtRERLz2Q8C5Smd8b3EWvb1Ha' +
    'y8qhGB8Czq+z1mJSKbymnMMBwco42Y30ofQ/xEBwO2TypJwKS9Ey+yddfA6ASuQ=="}',
  bitgoKey:
    '125746de1919236bd30a4809d718b1c161ab8f7674fe506bed438fa860adcfcc256f3721062' +
    'dfeaea177c38c467a24228b9acf1a9f92fc2f5d0177bbbf218eb8',
  bitgoKeyWithManyTokens:
    'f342b7b3bfe5086d189bc0886139d3fbb1669381d725d9f6b6b522c62c8c14e8d772493a05c9bb82fb1adfb42dfae30f8746c3dc17bc0183806094f66d5e2fe0',
  walletPassphrase: 'Ghghjkg!455544llll',
  walletAddress0: 'cyggsFnDvbfsPeiFXziebWsWAp6bW5Nc5SePTx8mebL',
  walletAddress1: '9jCvKZbmzothfWS6P7AJxLKY8JLdapkurZbHsZ8p9TP8',
  walletAddress2: '22USpDwmubAoY5uws4hp4YhJZwt4eoumeLrGGx5z7DWV',
  walletAddress3: 'FNe4or6gc5vmmCCMASJyYu9BRoiL14fDhjC5vxoGFiW2',
  walletAddress4: 'E7Z6pFfUhjx2dFjdB9Ws2KnKepXoq62TeF5uaCVSvqQV',
  walletAddress5: '8V34g2KeJXChECTWHfcJ5NeyWwyb7HvKpu66DD3YPNcf',
};
