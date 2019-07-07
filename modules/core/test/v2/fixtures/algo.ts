module.exports.prebuild = function() {
  return {
    walletData: {
      id: '5a78dd561c6258a907f1eeaee132f796',
      users: [
        {
          user: '543c11ed356d00cb7600000b98794503',
          permissions: [
            'admin',
            'view',
            'spend'
          ]
        }
      ],
      coin: 'talgo',
      label: 'Test Validation Wallet',
      m: 2,
      n: 3,
      keys: [
        '5a78dd56bfe424aa07aa068651b194fd',
        '5a78dd5674a70eb4079f58797dfe2f5e',
        '5a78dd561c6258a907f1eea9f1d079e2'
      ],
      tags: [
        '5a78dd561c6258a907f1eeaee132f796'
      ],
      disableTransactionNotifications: false,
      freeze: {},
      deleted: false,
      approvalsRequired: 1,
      isCold: true,
      clientFlags: [],
      balance: 650000000,
      confirmedBalance: 650000000,
      spendableBalance: 650000000,
      balanceString: '650000000',
      confirmedBalanceString: '650000000',
      spendableBalanceString: '650000000',
      coinSpecific: {
        addressVersion: 1
      },
      pendingApprovals: []
    },
    txData: {
      from: 'AWSC7RL3RM72HSUW5QU4XTX3AOHY7QD3WLUZC2CAHWP6BTI5Q7IABVUXTA',
      to: 'XMHLMNAVJIMAW2RHJXLXKKK4G3J3U6VONNO3BTAQYVDC3MHTGDP3J5OCRU',
      amount: 1000,
      fee: 1000,
      firstRound: 1000,
      lastRound: 1999,
      genesisID: 'testnet-v38.0',
      genesisHash: '4HkOQEL2o2bVh2P1wSpky3s6cwcEg/AAd5qlery942g=',
      note: new Uint8Array()
    },
    buildTxBase64: 'iaNhbXTNA+ijZmVlzgADsVCiZnbNA+ijZ2VurXRlc3RuZXQtdjM4LjCiZ2jEIOB5DkBC9qNm1Ydj9cEqZMt7OnMHBIPwAHeapXq8veNoomx2zQfPo3JjdsQguw62NBVKGAtqJ03XdSlcNtO6eq5rXbDMEMVGLbDzMN+jc25kxCAFpC/Fe4s/o8qW7CnLzvsDj4/Ae7LpkWhAPZ/gzR2H0KR0eXBlo3BheQ==', 
    userKeychain: {
      pub: 'UMYEHZ2NNBYX43CU37LMINSHR362FT4GFVWL6V5IHPRCJVPZ46H6CBYLYE',
      prv: 'HEHPVOKEINTQMW4K536BZWUZWQNKBXKIAUSEWCVX3LCXDHI2LVPMV6T5L4'
    },
    backupKeychain: {
      pub: 'LT7DY6JX46K2MUCLJJHEUYWKVC63FXEKCOKUSPGVTDGH3DBBK2V4SEDZWY',
      // normally this wouldn't be here but we include it for signing purposes
      prv: 'R4MFSNIAR4PQQGGYA6LK374X6MJEATRVNLREZ3GLAP2VYWLXDN2R4JLI4'
    },
    bitgoKeychain: {
      pub: '3GFMZSPBX3XQL22IBAUF2UQFAZCOF5QFFVRRLEHFPHFLN5NY7WQJSSZRGQ',
      // normally this wouldn't be here but we include it for signing purposes
      prv: 'DLHE27PAI335VEQUNX7R2442SSJZUYISBL7OOR3V34AYNTH7YWI6XMGVVE'
    },
    signedTxBase64: Buffer.from([130,164,109,115,105,103,131,166,115,117,98,115,105,103,147,130,162,112,107,196,32,163,48,67,231,77,104,113,126,108,84,223,214,196,54,71,142,253,162,207,134,45,108,191,87,168,59,226,36,213,249,231,143,161,115,196,64,70,106,189,130,206,115,88,25,192,209,52,2,80,27,16,135,59,45,143,251,244,122,28,231,230,211,228,3,213,143,165,14,101,122,190,73,75,116,130,132,159,108,97,32,218,181,221,17,183,68,203,196,238,171,119,83,18,184,120,137,189,84,98,6,129,162,112,107,196,32,92,254,60,121,55,231,149,166,80,75,74,78,74,98,202,168,189,178,220,138,19,149,73,60,213,152,204,125,140,33,86,171,129,162,112,107,196,32,217,138,204,201,225,190,239,5,235,72,8,40,93,82,5,6,68,226,246,5,45,99,21,144,229,121,202,182,245,184,253,160,163,116,104,114,2,161,118,1,163,116,120,110,137,163,97,109,116,205,3,232,163,102,101,101,206,0,3,177,80,162,102,118,205,3,232,163,103,101,110,173,116,101,115,116,110,101,116,45,118,51,56,46,48,162,103,104,196,32,224,121,14,64,66,246,163,102,213,135,99,245,193,42,100,203,123,58,115,7,4,131,240,0,119,154,165,122,188,189,227,104,162,108,118,205,7,207,163,114,99,118,196,32,187,14,182,52,21,74,24,11,106,39,77,215,117,41,92,54,211,186,122,174,107,93,176,204,16,197,70,45,176,243,48,223,163,115,110,100,196,32,5,164,47,197,123,139,63,163,202,150,236,41,203,206,251,3,143,143,192,123,178,233,145,104,64,61,159,224,205,29,135,208,164,116,121,112,101,163,112,97,121]).toString('base64'),
  }
}
