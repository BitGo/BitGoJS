/**
 *
 * This demonstrates the half-signing workflow for 2-of-3 multisig delegation transactions
 */

/**
 * Test accounts for half-signing workflow
 * These are the actual keys used to create and sign the on-chain transaction
 */
export const HALF_SIGN_TEST_ACCOUNTS = {
  user: {
    privateKey: 'd365653d2b76bd1c3d9272e8a30522b19d28131e474b7eb0887b36195b1ab1ff',
    publicKey: '028694abcbcdbf7973c1da76da65c2c05ac7eec98ed9b10b1e53a2c834c24163ca',
    pChainAddress: 'P-costwo1grycy5pmkw8590vghzaf2v5phjnjl583cmc3f5',
  },
  bitgo: {
    privateKey: 'a218141d495c9c61f76f9049b763a7b4a4c3c503f3f45698c17b5002939dcd84',
    publicKey: '0309d1e50b2496170dd50ae89bce71cc9e964104e4139eda9eb46800665264fe78',
    pChainAddress: 'P-costwo1ddgtqg8ls4t0clul3rhuzldd9386uqw85nr98f',
  },
  backup: {
    privateKey: '519c515c19a4b5488f68d271328355ed97072e314c322eb1d7ae467f8a9cb6b8',
    publicKey: '02cbee5efcfa04ba25cddcc67a69223afc8a9512ad9e69d28ab30317bf0f83dd2e',
    pChainAddress: 'P-costwo1wekdkg99hnfdcllsd8t3fyg7l5jufthhfysjgp',
  },
};

/**
 * Transaction parameters for the multisig delegation
 */
export const MULTISIG_DELEGATION_PARAMS = {
  nodeID: 'NodeID-AKt7WaK6ozEy5K8azKNacZXLzxZ9xFgC7',
  stakeAmount: '50000000000000', // 50,000 FLR in nanoFLR
  duration: 14, // days
  startTime: 1771850992,
  endTime: 1773060592,
  rewardAddress: 'P-costwo1grycy5pmkw8590vghzaf2v5phjnjl583cmc3f5',
  multisigAddresses: [
    'P-costwo1grycy5pmkw8590vghzaf2v5phjnjl583cmc3f5', // user (index 0)
    'P-costwo1ddgtqg8ls4t0clul3rhuzldd9386uqw85nr98f', // bitgo (index 1)
    'P-costwo1wekdkg99hnfdcllsd8t3fyg7l5jufthhfysjgp', // backup (index 2)
  ],
  threshold: 2,
};

/**
 * Unsigned transaction hex (before any signatures)
 * Built with sorted fromAddresses to match UTXO owner order
 */
export const MULTISIG_DELEGATION_UNSIGNED_TX_HEX =
  '00000000001a0000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000253e89cc00000000000000000000000010000000340c982503bb38f42bd88b8ba953281bca72fd0f16b50b020ff8556fc7f9f88efc17dad2c4fae01c7766cdb20a5bcd2dc7ff069d714911efd25c4aef700000001707288abed3b4da8d181ee2922ac55e1f269845583cf9adff0caee5fd47ddc3c0000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000500002d7bdc49040000000002000000000000000100000000664b4924a25af8be5f07052b2c2e582f7c10a65400000000699c4cf00000000069aec1f000002d79883d200000000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000700002d79883d20000000000000000000000000010000000340c982503bb38f42bd88b8ba953281bca72fd0f16b50b020ff8556fc7f9f88efc17dad2c4fae01c7766cdb20a5bcd2dc7ff069d714911efd25c4aef70000000b0000000000000000000000010000000140c982503bb38f42bd88b8ba953281bca72fd0f1';

/**
 * Half-signed transaction hex (signed by user key only)
 * First signature slot filled, second slot empty
 */
export const MULTISIG_DELEGATION_HALF_SIGNED_TX_HEX =
  '00000000001a0000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000253e89cc00000000000000000000000010000000340c982503bb38f42bd88b8ba953281bca72fd0f16b50b020ff8556fc7f9f88efc17dad2c4fae01c7766cdb20a5bcd2dc7ff069d714911efd25c4aef700000001707288abed3b4da8d181ee2922ac55e1f269845583cf9adff0caee5fd47ddc3c0000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000500002d7bdc49040000000002000000000000000100000000664b4924a25af8be5f07052b2c2e582f7c10a65400000000699c4cf00000000069aec1f000002d79883d200000000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000700002d79883d20000000000000000000000000010000000340c982503bb38f42bd88b8ba953281bca72fd0f16b50b020ff8556fc7f9f88efc17dad2c4fae01c7766cdb20a5bcd2dc7ff069d714911efd25c4aef70000000b0000000000000000000000010000000140c982503bb38f42bd88b8ba953281bca72fd0f1000000010000000900000002d488c1469bf92cfdeb2c164e1608f9c1bef4aec0b39fe33088a97b74268a908a579f079d56728dcfbda297b6f5c7792e26f109914b65ed974dcd1ad155cb61d3010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

/**
 * Fully signed transaction hex (signed by both user and bitgo keys)
 * This transaction was successfully broadcast to Coston2 testnet
 */
export const MULTISIG_DELEGATION_FULLY_SIGNED_TX_HEX =
  '00000000001a0000007200000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd000000070000000253e89cc00000000000000000000000010000000340c982503bb38f42bd88b8ba953281bca72fd0f16b50b020ff8556fc7f9f88efc17dad2c4fae01c7766cdb20a5bcd2dc7ff069d714911efd25c4aef700000001707288abed3b4da8d181ee2922ac55e1f269845583cf9adff0caee5fd47ddc3c0000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000500002d7bdc49040000000002000000000000000100000000664b4924a25af8be5f07052b2c2e582f7c10a65400000000699c4cf00000000069aec1f000002d79883d200000000000000000000000000000000000000000000000000000000000000000000000000158734f94af871c3d131b56131b6fb7a0291eacadd261e69dfb42a9cdf6f7fddd0000000700002d79883d20000000000000000000000000010000000340c982503bb38f42bd88b8ba953281bca72fd0f16b50b020ff8556fc7f9f88efc17dad2c4fae01c7766cdb20a5bcd2dc7ff069d714911efd25c4aef70000000b0000000000000000000000010000000140c982503bb38f42bd88b8ba953281bca72fd0f1000000010000000900000002d488c1469bf92cfdeb2c164e1608f9c1bef4aec0b39fe33088a97b74268a908a579f079d56728dcfbda297b6f5c7792e26f109914b65ed974dcd1ad155cb61d30139507d355619359a57ce9f85b42c1d5daca3808db218513b45417f5c6bc1bc531bfefef6ae78309486fe114c6d64626b0ba619f453946a385dc8ff4a31b333b701';

/**
 * On-chain transaction ID after broadcast
 */
export const MULTISIG_DELEGATION_TX_ID = '2hGeGfU7vAi7aMWAGSc5RHfRBpum2LWhxqypv2uxQvZXVrnEA5';

/**
 * Address sorting information for the 2-of-3 multisig wallet
 * After lexicographic sorting by hex value, the addresses remain in the same order:
 * 1. user (P-costwo1grycy5pmkw8590vghzaf2v5phjnjl583cmc3f5) - sorted index 0
 * 2. bitgo (P-costwo1ddgtqg8ls4t0clul3rhuzldd9386uqw85nr98f) - sorted index 1
 * 3. backup (P-costwo1wekdkg99hnfdcllsd8t3fyg7l5jufthhfysjgp) - sorted index 2
 *
 * Keys needed for signing (first 2 in sorted order for threshold=2):
 * - user (original index 0, sorted index 0)
 * - bitgo (original index 1, sorted index 1)
 */
export const MULTISIG_ADDRESS_SORTING = {
  original: [
    'P-costwo1grycy5pmkw8590vghzaf2v5phjnjl583cmc3f5', // index 0: user
    'P-costwo1ddgtqg8ls4t0clul3rhuzldd9386uqw85nr98f', // index 1: bitgo
    'P-costwo1wekdkg99hnfdcllsd8t3fyg7l5jufthhfysjgp', // index 2: backup
  ],
  sorted: [
    'P-costwo1grycy5pmkw8590vghzaf2v5phjnjl583cmc3f5', // sorted 0 = original 0 (user)
    'P-costwo1ddgtqg8ls4t0clul3rhuzldd9386uqw85nr98f', // sorted 1 = original 1 (bitgo)
    'P-costwo1wekdkg99hnfdcllsd8t3fyg7l5jufthhfysjgp', // sorted 2 = original 2 (backup)
  ],
  // addressesIndex[originalIdx] = sortedPosition
  addressesIndex: [0, 1, 2], // user->0, bitgo->1, backup->2
  signingKeys: [
    { role: 'user', originalIndex: 0, sortedIndex: 0 },
    { role: 'bitgo', originalIndex: 1, sortedIndex: 1 },
  ],
};
