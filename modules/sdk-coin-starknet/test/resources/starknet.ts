import { StarknetTransactionType } from '../../src/lib/iface';

export const Accounts = {
  account1: {
    secretKey: 'c5bccb8f471c5c9eb6483aa77ee4b700003b1e12df430a24d93238eb378b968b',
    publicKey:
      '042ab77b959e28c4fa47fa8fb9e57cec3d66df5684d076ac2e4c5f28fd69a23dd31a59f908c8add51eab3530b4ac5d015166eaf2198c52fa9a8df7cfaeb8fdb7d4',
    address: '0x05a63dd0563db1ab71b5ffd25a6b4aaf5730de5de53d64423e4293fc8b3e12f6',
  },
  account2: {
    secretKey: '73312c28d0d455b6a29a9a66811ffda94f3db6bfd57bf5c2bed917ee5928e15f',
    publicKey:
      '044e01707f70f6ad8d9f79e5f2c2f0bac5e91520e5e2491354c6c7827b59d44148847f9180ac9679a6ce66f69c330551a99f8f9b7419c437705602a54c258a9dfe',
    address: '0x02e153ef86ae7682160f69f4218b6a41aebc79ca11dabb1a4fcd7cc55f16f977',
  },
  account3: {
    publicKey:
      '042281378584012843130dce9b19002f88a949f237397e2f6cda2db1392d54f6345faaf51c384fbfe4e8f67eb12fdb53732d2ddfe7470f9310a0bf824dad3f6b1b',
    secretKey: '7b4de3d8cc3e312c70f674b52f11818205546ca7036c8071997c46e429160dc3',
    address: '0x00b45a0e9f4b1eff1e2d2e528ae7c443655346c62750518217fb82cbce4dbb54',
  },
  errorsAccounts: {
    account1: {
      secretKey: 'not ok',
      publicKey: 'not ok',
      address: 'not ok',
    },
    account2: {
      secretKey: 'test_test',
      publicKey: 'test_test',
      address: 'invalid',
    },
  },
};

export const StarknetTransactionData = {
  senderAddress: Accounts.account1.address,
  nonce: '0',
  calls: [
    {
      contractAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      entrypoint: 'transfer',
      calldata: [Accounts.account2.address, '0xde0b6b3a7640000', '0x0'],
    },
  ],
  chainId: '0x534e5f5345504f4c4941',
  transactionType: StarknetTransactionType.INVOKE,
};

// Raw transaction hex (JSON serialized to hex)
const rawTxUnsigned = Buffer.from(
  JSON.stringify({
    senderAddress: Accounts.account1.address,
    calls: StarknetTransactionData.calls,
    nonce: '0',
    chainId: '0x534e5f5345504f4c4941',
    transactionType: StarknetTransactionType.INVOKE,
  }),
  'utf-8'
).toString('hex');

const rawTxSigned = Buffer.from(
  JSON.stringify({
    senderAddress: Accounts.account1.address,
    calls: StarknetTransactionData.calls,
    nonce: '0',
    chainId: '0x534e5f5345504f4c4941',
    transactionType: StarknetTransactionType.INVOKE,
    signature: ['0xabc123', '0xdef456', '0x789012', '0x345678', '0x0'],
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  }),
  'utf-8'
).toString('hex');

export const rawTx = {
  transfer: {
    unsigned: rawTxUnsigned,
    signed: rawTxSigned,
  },
};

export const TEST_AMOUNTS = {
  small: '1000000000000000000',
  medium: '10000000000000000000',
  large: '999999999999999999999999',
};

export const SandboxTransferData = {
  senderAddress: '0x1559292d3f9ea355458f83adf235b400e79786af5dc5e3b50f5505caa2bdc84',
  receiverAddress: '0x4a1e86ae265e6e6ecbea5be7f67117c3540f8aaf2ad7f1cfec33c53080f05af',
  amount: '1000000000000000000',
  chainId: '0x534e5f5345504f4c4941',
  tokenContract: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  resourceBounds: {
    l2_gas: { max_amount: '0x1c9c380', max_price_per_unit: '0x174876e800' },
    l1_gas: { max_amount: '0x0', max_price_per_unit: '0x5af3107a4000' },
    l1_data_gas: { max_amount: '0x3e8', max_price_per_unit: '0x2540be400' },
  },
};

// Known-good tx from coins-sandbox/strkMPC/transferLocal.ts (block 9537253, Sepolia)
// All inputs from the sandbox script; nonce confirmed via Voyager explorer.
export const KnownGoodInvokeTx = {
  senderAddress: '0x1559292d3f9ea355458f83adf235b400e79786af5dc5e3b50f5505caa2bdc84',
  receiverAddress: '0x4a1e86ae265e6e6ecbea5be7f67117c3540f8aaf2ad7f1cfec33c53080f05af',
  amount: '1000000000000000000',
  tokenContract: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  nonce: '0x8',
  chainId: '0x534e5f5345504f4c4941',
  tip: '0x0',
  resourceBounds: {
    l2_gas: { max_amount: '0x1c9c380', max_price_per_unit: '0x174876e800' },
    l1_gas: { max_amount: '0x0', max_price_per_unit: '0x5af3107a4000' },
    l1_data_gas: { max_amount: '0x3e8', max_price_per_unit: '0x2540be400' },
  },
  expectedTxHash: '0x739a72831c7f53634a2ffc94b78b61985e3cdffbad09ab20a1480e1bec9bdf2',
};
