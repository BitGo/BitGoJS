import { Recipient } from '@bitgo/sdk-core';

export const AMOUNT = 100000000000000000; // 0.1 VET in base units

export const SPONSORED_TRANSACTION =
  '0xf8bc2788014e9cad44bade0940e0df94e59f1cea4e0fef511e3d0f4eec44adf19c4cbeec88016345785d8a0000808180825208808302d6b5c101b882ee76129c1259eb0c8a2b3b3e5f2b089cd11068da1c0db32a9e22228db83dd4be5c721858bc813514141fbd5cf641d0972ce47ceb9be61133fa2ebf0ea37c1f290011fdce201f56d639d827035a5ed8bcef42a42f6eb562bc76a6d95c7736cf8cf340122d1e2fb034668dc491d47b7d3bb10724ba2338a6e79df87bce9617fdce9c00';

export const UNSIGNED_TRANSACTION =
  '0xf8772788014eabfe2b8fcc1440dddc94e59f1cea4e0fef511e3d0f4eec44adf19c4cbeec85e8d4a51000808180825208808301bff7c0b8414f4b195e2dd666a01c1186df341ff3c0cbe2d6b4a58dca3c8c484f3eac05c4100a165a2730fe67b4c11b4a6c78ea8ab0757bf59735adef327a36737e1694536b00';

export const UNSIGNED_TRANSACTION_2 =
  '0xf72788014ead140e77bbc140e0df94e59f1cea4e0fef511e3d0f4eec44adf19c4cbeec88016345785d8a00008081808252088082faf8c101';

export const INVALID_TRANSACTION =
  '0xf8bc2788014ea060b5b5997e40e0df94e5f4eec44adf19c4cbeec88016345785d8a000080818082520880830bf84fc101b882418e212a40b29da685a7312829e8d1d3708b654f4ddb4388a7a80f5af3e5423b455451901d9b837fe18501e6ea5ec7d3d2711f00073d553aabe40e0260ec8a6f00da557d0a1af66b82b457324bc6fc86c7f0362e76c15b64432e66b6fa62fca38c7d208a604d1a7ec5356c95fec7bc6f332d16718a91a53e0e99e3a81ae3205ab400';

export const TRANSFER_CLAUSE = [
  {
    to: '0xe59f1cea4e0fef511e3d0f4eec44adf19c4cbeec',
    value: 1000000000000,
    data: '0x',
  },
];

export const addresses = {
  validAddresses: ['0x7ca00e3bc8a836026c2917c6c7c6d049e52099dd', '0xe59f1cea4e0fef511e3d0f4eec44adf19c4cbeec'],
  invalidAddresses: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const blockIds: { validBlockIds: string[]; invalidBlockIds: string[] } = {
  validBlockIds: [
    '0x014f12ed94c4b4770f7f9a73e2aa41a9dfbac02a49f36ec05acfdba8c7244ff0',
    '0x014f130d00a2fe06d471a35e7f2cd18d25bdefe5370c07a2ad68c0ae3852ad86',
  ],
  invalidBlockIds: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const invalidRecipients: Recipient[] = [
  {
    address: addresses.invalidAddresses[0],
    amount: AMOUNT.toString(),
  },
  {
    address: addresses.validAddresses[0],
    amount: '-919191',
  },
  {
    address: addresses.validAddresses[0],
    amount: 'invalidAmount',
  },
];

export const recipients: Recipient[] = [
  {
    address: addresses.validAddresses[1],
    amount: AMOUNT.toString(),
  },
];

export const feePayer = {
  address: '0xdc9fef0b84a0ccf3f1bd4b84e41743e3e051a083',
};
