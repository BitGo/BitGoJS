module.exports.getHalfSignedTethFromVault = function () {
  return {
    paramsFromVault: {
      txPrebuild: {
        halfSigned: {
          recipients: [
            {
              address: '0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b',
              amount: '1000000000000000000',
              value: '1.000000000000000000 TETH',
            },
          ],
          expireTime: 1549311285,
          contractSequenceId: 1,
          operationHash: '0x19e8caf58f41071b8522e57d84686458667221e70a584e55bfc3af0c02a143f9',
          signature:
            '0x45864316d0c882ace5a3d5a000db8b9047835281c7dc9759441424f3f470d48821f9baebc35e4d1955af1cb072d4e9b1fa4d4dddcb7a859ba6d3bbe33f6efdfb1c',
        },
        coin: 'teth',
        gasPrice: '20000000000',
        gasLimit: '500000',
        amount: '1000000000000000000',
        walletContractAddress: '0x27121c36c854c8775166f01ee9b2a5cc012718af',
        recipients: [
          {
            address: '0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b',
            amount: '1000000000000000000',
            value: '1.000000000000000000 TETH',
            $$hashKey: 'object:20',
          },
        ],
        fee: '0.010000000000000000 TETH',
        total: '1.010000000000000009 TETH',
        isUnknownTokenAddress: false,
      },
      prv: 'xprv9s21ZrQH143K4Vt5t2P7wySzHWNLZrCzwHBJFGnr9nnLVW45iCvfT9iSpEsmnnkQxxSrtSSfU9APZRo4oR28z6kqQ2HxBRWec4dti5APG1K',
      recipients: [
        {
          address: '0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b',
          amount: '1000000000000000000',
          value: '1.000000000000000000 TETH',
          $$hashKey: 'object:20',
        },
      ],
      signingKeyNonce: 1,
      walletContractAddress: '0x27121c36c854c8775166f01ee9b2a5cc012718af',
      isLastSignature: true,
    },
    expectedResult: {
      txHex:
        'f901cb018504a817c8008307a1209427121c36c854c8775166f01ee9b2a5cc012718af80b9016439125215000000000000000000000000ebd0d0c1f101ab5a27ef1c54430e0c4b1166548b0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000005c589d35000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004145864316d0c882ace5a3d5a000db8b9047835281c7dc9759441424f3f470d48821f9baebc35e4d1955af1cb072d4e9b1fa4d4dddcb7a859ba6d3bbe33f6efdfb1c000000000000000000000000000000000000000000000000000000000000001ba0ea29106959adf3042ff3ee4955db795ec2b0ddb994c4a244fa3ea5a891d49109a06efee03668c6579f4ece9362b2e682a313a89224d9bc73e72cbd9364fd6aa3c4',
    },
  };
};

module.exports.getUnsignedEip1559TethFromVault = function () {
  return {
    paramsFromVault: {
      txPrebuild: {
        eip1559: {
          maxPriorityFeePerGas: '1000000000',
          maxFeePerGas: '1000000014',
        },
        recipients: [
          {
            amount: '1000000000000000000',
            address: '0x5e55082d4c6919b65fcda80f801038d85dfec1b3',
            data: 'abcdef',
          },
        ],
        nextContractSequenceId: 1,
        gasLimit: 500000,
        isBatch: false,
        coin: 'teth',
        walletId: '616f03422f5814000608f346d694bfef',
        walletContractAddress: '0x6c089dbaf18618273711d12cb3f61f5cba9f86ee',
        amount: '10000000000000000',
        address: '0x46Fd47e1a52463E1d2d304812F34435Bd1e40DBA',
        receivedCoin: {
          name: 'teth',
          svg: 'eth',
          modifier: '1000000000000000000',
          modifierExp: 18,
          fullDisplay: 'Testnet Ethereum',
          shortDisplay: 'TETH',
          family: 'eth',
          hasMarketData: true,
          walletCreationPolling: true,
          requiresPricingPlan: false,
          hasTokens: true,
          isUtxoCoin: false,
        },
      },
      prv: 'xprv9s21ZrQH143K4Vt5t2P7wySzHWNLZrCzwHBJFGnr9nnLVW45iCvfT9iSpEsmnnkQxxSrtSSfU9APZRo4oR28z6kqQ2HxBRWec4dti5APG1K',
      recipients: [
        {
          address: '0xebd0d0c1f101ab5a27ef1c54430e0c4b1166548b',
          amount: '1000000000000000000',
          value: '1.000000000000000000 TETH',
          $$hashKey: 'object:20',
        },
      ],
      signingKeyNonce: 1,
      walletContractAddress: '0x27121c36c854c8775166f01ee9b2a5cc012718af',
    },
    expectedResult: {
      halfSigned: {
        eip1559: { maxPriorityFeePerGas: '1000000000', maxFeePerGas: '1000000014' },
        isBatch: false,
        recipients: [
          {
            address: '0x5e55082d4c6919b65fcda80f801038d85dfec1b3',
            amount: '1000000000000000000',
            data: 'abcdef',
          },
        ],
        expireTime: 1635453518,
        contractSequenceId: 1,
        operationHash: '0x7a7f023f34e0acd9c1a69dde09bc30562de362c464d829dc1393cc0a63efd149',
        signature:
          '0x0f9eebcab976926ec251eb2d91d1cd1f9e396fa21cc7fffa46a892784b5fef7e0d13aa57721227884958affe41f8ea957434b864c75dc3f0bddb798b1ab7af411b',
      },
    },
  };
};

module.exports.WRWUnsignedSweepETHTx = {
  tx: 'f9012b808504a817c8008307a12094fd12f1d563650fbdd9314dce06992159778f634380b9010439125215000000000000000000000000a98fdfc2c711260cd665a3884b509b4a5ad6f4e80000000000000000000000000000000000000000000000003782dace9d90000000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000005f6a471c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c8080',
  userKey:
    'xpub661MyMwAqRbcFcNDKt46HgPAJTfNyQUS6M7i8jUwZKHz9wZGaK1XdQuT8XU5PkFfbrfoGXc1C4QD9PDJ7zhpu52rLzzynovwgcXh7NtDbH9',
  backupKey:
    'xpub661MyMwAqRbcGUJYcAgycBqG5HrQoUJAvBv7PEbvjGGffdtMP8hx3DX9AwzaY4vA7ynqHfxzRTRLwS2E9DH1HRPG8u7kWXd4JMCNgonGGnk',
  coin: 'teth',
  gasPrice: '20000000000',
  gasLimit: '500000',
  recipients: [
    {
      address: '0xa98fdfc2c711260cd665a3884b509b4a5ad6f4e8',
      amount: '4000000000000000000',
    },
  ],
  walletContractAddress: '0xfd12f1d563650fbdd9314dce06992159778f6343',
  amount: '4000000000000000000',
  backupKeyNonce: 0,
  recipient: {
    address: '0xa98fdfc2c711260cd665a3884b509b4a5ad6f4e8',
    amount: '4000000000000000000',
  },
  expireTime: 1600800540,
  contractSequenceId: 1,
  nextContractSequenceId: 1,
};

module.exports.WRWUnsignedSweepERC20Tx = {
  tx: 'f9010a808504a817c8008307a12094df07117705a9f8dc4c2a78de66b7f1797dba9d4e80b8e40dcd7a6c00000000000000000000000052c8b29ab8b0a49a01c2b75f8e7f11b23e0e37820000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000004f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa00000000000000000000000000000000000000000000000000000000611fb4330000000000000000000000000000000000000000000000000000000000002a7f00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000001c8080',
  userKey:
    'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
  backupKey:
    'xpub661MyMwAqRbcGhSaXikpuTC9KU88Xx9LrjKSw1JKsvXNgabpTdgjy7LSovh9ZHhcqhAHQu7uthu7FguNGdcC4aXTKK5gqTcPe4WvLYRbCSG',
  coin: 'tdai',
  gasPrice: '20000000000',
  gasLimit: '500000',
  recipients: [
    {
      address: '0x52c8B29Ab8B0a49a01c2b75f8e7f11B23e0e3782',
      amount: '1000000000000000000',
    },
  ],
  walletContractAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
  amount: '1000000000000000000',
  backupKeyNonce: 0,
  recipient: {
    address: '0x52c8b29ab8b0a49a01c2b75f8e7f11b23e0e3782',
    amount: '1000000000000000000',
  },
  expireTime: 1629468332,
  contractSequenceId: 10879,
  nextContractSequenceId: 10879,
  tokenContractAddress: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
};

export function getTxListRequest(address: string) {
  return {
    module: 'account',
    action: 'txlist',
    address: address,
  };
}

export const getTxListResponse = {
  status: '0',
  message: 'No transactions found',
  result: [],
};

export function getBalanceRequest(address: string) {
  return {
    module: 'account',
    action: 'balance',
    address: address,
  };
}

export const getBalanceResponse = {
  status: '1',
  message: 'OK',
  result: '9999999999999999928',
};

export const getContractCallRequest = {
  module: 'proxy',
  action: 'eth_call',
  to: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
  data: 'a0b7967b',
  tag: 'latest',
};

export const getContractCallResponse = {
  jsonrpc: '2.0',
  result: '0x0000000000000000000000000000000000000000000000000000000000002a7f',
  id: 1,
};
