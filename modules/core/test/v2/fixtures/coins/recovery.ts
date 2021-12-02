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
