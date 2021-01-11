export const recoverBtcSegwitFixtures = function() {
  const userKey = '{"iv":"OVZx6VlJtv74kyE9gi5c0A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"gY6e6MieSZ4=","ct":"O64y1HhJWxbST1 /KfiRXpSDBl3/d+Grphpq9IhWrXKI2m/V0H1fxRQPj4KCoCV0veEUAvvgSfi49vksEZ0PdXI66umlqWnTahqyQgddBiT05E8yB3HWzVBvwIoMfkL9acQhnL7phjwupZRy73EzeGEX9burWx3w="}';
  const backupKey = '{"iv":"sFkDFraiYrF6L+FNkN7gAQ==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"SIQYthT9wnw=","ct":"szZdOYRaeaDmHir1f21lC37z2taPNFCNYTUVURBOj19j3KGgMZY8VhWt+StS9U9qZN+kl4LshuQ1IP9oIbL0zyVC/mgfEcgOemgeC/PBACzTtcUy/qyDvv1TXGeqJWXVIuPlpLugTUAYm8B3C2lKloOawfhbWd4="}';
  const walletPassphrase = 'bitconnectisthefutureofmonee';
  const bitgoKey = 'xpub661MyMwAqRbcFQg4uLavkkbf4nAPU9xvyHtFC4FgRgTrcGi3HSVWKqpnW8nujw7sAyqy3gUXNXLWunR82P6JjoC7NoZ3ustoXJTvT7rxbmy';
  const recoveryDestination = '2NAuziD75WnPPHJVwnd4ckgY4SuJaDVVbMD';
  const scan = 2;
  const ignoreAddressTypes = ['p2wsh'];
  return {
    params: { userKey, backupKey, walletPassphrase, bitgoKey, recoveryDestination, scan, ignoreAddressTypes },
    expectedTxHex: '01000000000102e0f7fb528646bf0dc3a717a1680fd2b8ca8dfd39f690adcdc194cea8f7cd579a00000000fdfe0000483045022100a7d8208df8844882203739b07211d5b1070592c7daf822150ffddee88eb99b88022012d3da2e29d7f30d10c495f0c8ee6a1699425b404d1b8142de72517c474f9cf401483045022100f3c1d45823cd15d7771061b8ac4c156dc67e9e4cc33ab27361441a9cccfa7e0d0220747fc7f69d9f7d70cf699a61cb6affa9c90e8172970e8de6f6eed02b53a8735e014c695221038c3ed7682e0999fbbb9f2a06348c9406f20a4c6acfa6015aa0049dae8d846dfc2102bdb5d7ac2a8775dcd8eb31bdea85ec82f6019f9580084dc62e905e741a34e5af2103fb333c62e4a349acecb98d63c307bb3a4cf439c71b3a6dce29ab9cfa65ee2ce153aeffffffff87a38a9b6c0dfab5e787bcaa3fbb2f7033b3198a1c36826c6f76ee53263840800100000023220020d397ea8831c203b211445a981bcbb643f464b826cf3a1226842ce956baf9bcd2ffffffff0118df00000000000017a914c1cf4712d6435cb99851d1e47c3fcef34c8681ed870004004730440220176a7de94926af913a0a3b5c668e23d66dc09f2b92b8adb9c4fb44a30afb0fc902206e9b76764a8dd921426d3ff11c43b3f62f431a1ee02647a83c0cd321cdd816bb01483045022100e2150355a76ca81b3bb510caae0a63a18f960d2102c220c6a73d7fd7b8b4301d02200cf50d06d7ccff824030ee4221fdb33d04213b0116dfa41c827ecdf9c39fc26f01695221025e8f5d3dc7e2247a05b7434cd57f985a782d858762ab73bb31f27b4e9cb006cb21036cca9315316b6a54c3b5de33d30d374575c5a30f9b0629e95a37abacf2d878fd2103b7a4d470b12a223518c49d26e2b587c03382ab9c6f7c00e428f8985b57abc2be53ae00000000'
  };
};

export const recoverBtcUnsignedFixtures = function() {
  const userKey = 'xpub661MyMwAqRbcEc56gSK9UBdYL6FggedPtK7HGjDgmn9Hr8NdoED6q8YxJ5CCwdN6MtmRL8DsXiFrMoEEBJn8uNSkH4jgZGrWhWUVS4k4m51';
  const backupKey = 'xpub661MyMwAqRbcGyxYz3v8K7PiqYCpyJvrJW6u3fCTi8KKNJPEFkEuzx2vfX4JZpjdLP7uvuWAT9ESEAH2C9y7TduF7LsLvSGnefrgjXXPiZS';
  const recoveryDestination = '2N1KrBvGLcz8DjivbUjqq7N9eH7km6a8FtT';
  const bitgoKey = 'xpub661MyMwAqRbcFn9RcuYmAcJyG5yJ1ohChcvtQHdGRNVuup5CNpb3PQVYqkYLUZigVEkp28gNrMibHohNGhQxxoe2pr21NqFGYWQxR7kivR2';
  const scan = 2;
  const ignoreAddressTypes = ['p2wsh'];
  return {
    params: { userKey, backupKey, bitgoKey, recoveryDestination, scan, ignoreAddressTypes },
    expectedTxHex: '0100000002f979a35a252c6d4b8afd3b29de0b36fd2fb4eca6ae4f0a5fe2b46c8192a7f44b0000000000ffffffff2e55761cd693b899b7aa0672c3ae4ebd4205f7ea4e4a6d4b9fc7e91dea2d19a90100000000ffffffff01304c03000000000017a91458a0e38c7d65307abe4fe74bf1e0127c6d5804c58700000000'
  };
};


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

export const btcNonKrsRecoveryDecodedTx =  {
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

export const emptyBlockchairBtcAddressData = {
    address: {
      type: null,
        script_hex: '',
        balance: 0,
        balance_usd: 0,
        received: 0,
        received_usd: 0,
        spent: 0,
        spent_usd: 0,
        output_count: 0,
        unspent_output_count: 0,
        first_seen_receiving: null,
        last_seen_receiving: null,
        first_seen_spending: null,
        last_seen_spending: null,
        scripthash_type: null,
        transaction_count: 0,
    },
    transactions: [],
      utxo: [],
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
  }

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
  }
};
