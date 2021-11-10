/**
 * The invariant in every nock - some metadata that blockchair usually responds with
 */
export const blockchairContext = {
  context: {
    code: 200,
    source: 'D',
    limit: '100,100',
    offset: '0,0',
    results: 1,
    state: 0,
    cache: {
      live: true,
      duration: 10,
      since: '2020-08-13 19:04:38',
      until: '2020-08-13 19:04:48',
      time: null,
    },
    api: {
      version: '2.0.64',
      last_major_update: '2020-07-19 00:00:00',
      next_major_update: null,
      documentation: 'https://blockchair.com/api/docs',
      notice: 'Beginning July 19th, 2020 we start enforcing request cost formulas, see the changelog for details',
    },
    time: 0.08114314079284668,
    render_time: 0.014548063278198242,
    full_time: 0.09569120407104492,
    request_cost: 1,
  },
};

export const btcKrsRecoveryDecodedTx = {
  success: true,
  transaction: {
    Version: '1',
    LockTime: '0',
    Vin: [
      {
        TxId: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
        Vout: '0',
        ScriptSig: {
          Asm:
            '0 3045022100ca835086284cb84e9cbf96464057dcd58fa9b4b37cf4c51171c109dae13ec9ee02203ca1b77600820e670d7bd0c6bd8fbfc003c2a67ffedab7950a1c7f9d0fc17b4c[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
          Hex:
            '00483045022100ca835086284cb84e9cbf96464057dcd58fa9b4b37cf4c51171c109dae13ec9ee02203ca1b77600820e670d7bd0c6bd8fbfc003c2a67ffedab7950a1c7f9d0fc17b4c014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
        },
        CoinBase: null,
        TxInWitness: null,
        Sequence: '4294967295',
      },
    ],
    Vout: [
      {
        Value: 0.070956,
        N: 0,
        ScriptPubKey: {
          Asm: 'OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL',
          Hex: 'a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787',
          ReqSigs: 1,
          Type: 'scripthash',
          Addresses: ['2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'],
        },
      },
      {
        Value: 0.0099,
        N: 1,
        ScriptPubKey: {
          Asm: 'OP_HASH160 1b60c33def13c3eda4cf4835e11a633e4b3302ec OP_EQUAL',
          Hex: 'a9141b60c33def13c3eda4cf4835e11a633e4b3302ec87',
          ReqSigs: 1,
          Type: 'scripthash',
          Addresses: ['2Mujz9eicmgpPcdScRJTywVK3EQNHDJG3yN'],
        },
      },
    ],
    TxId: '946dbefaefa5452daba373c0e0e3ada7d74bc4cf2a27518c9fcc581f19b0cb2b',
  },
};

export const btcNonKrsRecoveryDecodedTx = {
  success: true,
  transaction: {
    Version: '1',
    LockTime: '0',
    Vin: [
      {
        TxId: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
        Vout: '0',
        ScriptSig: {
          Asm:
            '0 30440220513ff3a0a4d72230a7ca9b1285d5fa19669d7cccef6a9c8408b06da666f4c51f022058e8cc58b9f9ca585c37a8353d87d0ab042ac081ebfcea86fda0da1b33bf4747[ALL] 3045022100e27c00394553513803e56e6623e06614cf053834a27ca925ed9727071d4411380220399ab1a0269e84beb4e8602fea3d617ffb0b649515892d470061a64217bad613[ALL] 522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
          Hex:
            '004730440220513ff3a0a4d72230a7ca9b1285d5fa19669d7cccef6a9c8408b06da666f4c51f022058e8cc58b9f9ca585c37a8353d87d0ab042ac081ebfcea86fda0da1b33bf474701483045022100e27c00394553513803e56e6623e06614cf053834a27ca925ed9727071d4411380220399ab1a0269e84beb4e8602fea3d617ffb0b649515892d470061a64217bad613014c69522102f5ca5d074093abf996278d1e82b64497333254c786e9a69d34909a785aa9af32210239125d1a21ba8ae375cd37a92e48700cbb3bc1b1268d3c3f7e1d95f42155e1a821031ab00568ea1522a55f277699110649f3b8d08022494af2cc475c09e8a43b3a3a53ae',
        },
        CoinBase: null,
        TxInWitness: null,
        Sequence: '4294967295',
      },
    ],
    Vout: [
      {
        Value: 0.080899,
        N: 0,
        ScriptPubKey: {
          Asm: 'OP_HASH160 c39dcc27823a8bd42cd3318a1dac8c25789b7ac7 OP_EQUAL',
          Hex: 'a914c39dcc27823a8bd42cd3318a1dac8c25789b7ac787',
          ReqSigs: 1,
          Type: 'scripthash',
          Addresses: ['2NB5Ynem6iNvA6GBLZwRxwid3Kui33729Nw'],
        },
      },
    ],
    TxId: '7cf7dc9e9abcb0bc4303332b128af4200b6b3730461a3bb579143b002739f51f',
  },
};

export const emptyAddressInfo = {
  txCount: 0,
  totalBalance: 0,
};

export const addressUnspents = {
  '2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp': {
    amount: 41000,
    n: 1,
    txid: '8040382653ee766f6c82361c8a19b333702fbb3faabc87e7b5fa0d6c9b8aa387',
    address: '2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp',
  },

  '2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49': {
    amount: 100000,
    n: 0,
    txid: '4bf4a792816cb4e25f0a4faea6ecb42ffd360bde293bfd8a4b6d2c255aa379f9',
    address: '2MxZA7JFtNiQrET7JvywDisrZnKPEDAHf49',
  },

  '2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR': {
    amount: 100000,
    n: 0,
    txid: '4bf4a792816cb4e25f0a4faea6ecb42ffd360bde293bfd8a4b6d2c255aa379f9',
    address: '2MtHCVNaDed65jnq6YUN7qiHoef6xGDH4PR',
  },

  '2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z': {
    amount: 120000,
    n: 1,
    txid: 'a9192dea1de9c79f4b6d4a4eeaf70542bd4eaec37206aab799b893d61c76552e',
    address: '2N6swovegiiYQZpDHR7yYxvoNj8WUBmau3z',
  },

  '2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws': {
    amount: 20000,
    n: 0,
    txid: '9a57cdf7a8ce94c1cdad90f639fd8dcab8d20f68a117a7c30dbf468652fbf7e0',
    address: '2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws',
  },

  '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw': {
    amount: 8125000,
    n: 0,
    txid: 'e18283471a9374ef9812757ac70cd6660c66265cac7b19a87354d64937a7ed74',
    address: '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw',
  },

  '2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT': {
    amount: 1199994390,
    n: 0,
    txid: 'dfa6e8fb31dcbcb4adb36ed247ceb37d32f44335f662b0bb41372a9e9419335a',
    address: '2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT',
  },

};


export const addressInfos = {
  '2N7kMMaUjmBYCiZqQV7GDJhBSnJuJoTuBws': {
    txCount: 2,
    totalBalance: 20000,
  },

  '2MwvWgPCe6Ev9ikkXzidYB5WQqmhdfWMyVp': {
    txCount: 2,
    totalBalance: 20000,
  },

  '2MzLAGkQVaDiW2Dbm22ETf4ePyLUcDroqdw': {
    txCount: 1,
    totalBalance: 8125000,
  },

  '2NEXK4AjYnUCkdUDJQgbbEGGks5pjkfhcRN': {
    txCount: 1,
    totalBalance: 0,
  },

  '2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT': {
    txCount: 1,
    totalBalance: 1199994390,
  },
};
