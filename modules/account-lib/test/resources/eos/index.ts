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

export const permission = {
  permission1: {
    name: 'some.perm',
    privateKey: '5Jo5FrZgNXGk7XtWGbTjnG7P2ChHyxYsnij7n2XceHtMo1vAdnn',
    publicKey: 'EOS84sGZeiwH21SDuAgUQoXdEuowccNP5ceuQU6GrFPfwPboJmZ7u',
    type: 'some.act',
    requirement: 'action.perm',
  },
};

export const tranferTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d640064000000000000000100a6823403ea3055000000572d3ccdcd010000000080d0553400000000a8ed32322a0000000080d055340000000080e4b6491027000000000000045359530000000009536f6d65206d656d6f00',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const stakeTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea305500003f2a1ba6a24a010000000080d0553400000000a8ed3232310000000080d055340000000080e4b64910270000000000000453595300000000102700000000000004535953000000000000',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const doubleStakeTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000020000000000ea305500003f2a1ba6a24a010000000080d0553400000000a8ed3232310000000080d055340000000080e4b6491027000000000000045359530000000010270000000000000453595300000000000000000000ea305500003f2a1ba6a24a010000000080d0553400000000a8ed3232310000000080d055340000000080e4b64910270000000000000453595300000000102700000000000004535953000000000000',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const unstakeTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea3055c08fca86a9a8d2d4010000000080d0553400000000a8ed3232300000000080d055340000000080e4b649102700000000000004535953000000001027000000000000045359530000000000',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const updateAuthTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea30550040cbdaa86c52d5010000000080d0553400000000a8ed3232550000000080d055340000905755a024c500000000a8ed323201000000010003a2a70865b500e3e9347c009d944bf8a3b42a32dac02fe465b51bc93699a20d110100010000000080d0553400000000a8ed323201000000',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const deleteAuthTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea30550040cbdaa8aca24a010000000080d0553400000000a8ed3232100000000080d055340000905755a024c500',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const linkAuthTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea30550000002d6b03a78b010000000080d0553400000000a8ed3232200000000080d055340000000080d055340000001919a024c500e455154cea323200',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const unlinkAuthTransaction = {
  signatures: [],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea30550040cbdac0e9e2d4010000000080d0553400000000a8ed3232180000000080d055340000000080d055340000001919a024c500',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};

export const buyRamBytesTransaction = {
  signatures: ['SIG_K1_KVgqPFjr1C96K6F7xSBpn91w8BYVyPrb7g5xQ9ogf2XE81B26cYaJpsPTLn5eWJPuDX5jvWk3w2jvcxYT6L7WALrEJ5n4d'],
  serializedTransaction: new Uint8Array(
    Buffer.from(
      '33af835d64006400000000000000010000000000ea305500b0cafe4873bd3e010000000080d0553400000000a8ed3232140000000080d055340000000080e4b6490020000000',
      'hex',
    ),
  ),
  serializedContextFreeData: null,
};