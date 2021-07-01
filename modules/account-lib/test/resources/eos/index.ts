export const keypairAccounts = {
  account1: {
    secretKey: 'KxUQDwKgNVYasRJkMR9WwnswQ62sWNcwhvPyaBhYSGJwvwafngc8',
    pubKey: 'EOS7Y9ae85tTsidzj6sZoSo8AS5U1bh1R8C7o5Eqy54YLKAgxVNqn',
  },
  account2: {
    secretKey: 'KzXKfnQidAh9zusMxPTaHm5Ch7CgQ7vCXHY8dRpnVWgtNiFBc2i6',
    pubKey: 'EOS7iqa3kx1qoV6rVD8B1P7yd8qN8Br91MqMQJfwZdYnmTzEk5AEw',
  },
};
export const accounts = {
  account1: {
    name: 'alex1',
    privateKey: '5JaDD9yfdXTtVnCgurdBMd7RNNtVHuiCfFoSN3u3FccpwRmV6hE',
    publicKey: 'EOS5hqRbQY6HqZEh4LBLmFJUjEMXznYf8eymDkyZceU21rqeF9mJ1',
  },

  account2: {
    name: 'david',
    privateKey: '5J1owiEQiSLo3K6fyPeaiE6EhJ7Riz8xUd3Mk3u9HtyxFfR7aC7',
    publicKey: 'EOS5HVEVr37Ms3ofpKV2WgtqA3YC1TAHLPX1tHceYAWBmN8WYdhQH',
  },

  account3: {
    name: 'kerry',
    privateKey: '5Jhpg7jQuYK2cBPEHuRaB8v5EMfxY1YeKHgHjPoPgdqGt8BQqxC',
    publicKey: 'EOS5QCH3oSK2yJVDViSkDAsSAAM4c61VN2bgqwF824Nqc6FgED5Hx',
  },
};

export const tranferTransaction = {
  signatures: ['SIG_K1_KVgqPFjr1C96K6F7xSBpn91w8BYVyPrb7g5xQ9ogf2XE81B26cYaJpsPTLn5eWJPuDX5jvWk3w2jvcxYT6L7WALrEJ5n4d'],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d640064000000000000000100a6823403ea3055000000572d3ccdcd010000000080d0553400000000a8ed32322a0000000080d055340000000080e4b6491027000000000000045359530000000009536f6d65206d656d6f00',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};
