// Source: https://docs.coredao.org/docs/Learn/products/btc-staking/design
export const CORE_DAO_TESTNET_CHAIN_ID = Buffer.alloc(2, 0x1115);
export const CORE_DAO_MAINNET_CHAIN_ID = Buffer.alloc(2, 0x1116);
export const CORE_DAO_SATOSHI_PLUS_IDENTIFIER = Buffer.alloc(4, 0x5341542b);

/**
 * Create a CoreDAO OP_RETURN output script
 *
 * @param version Version of the OP_RETURN
 * @param chainId Chain ID
 * @param delegator Delegator address
 * @param validator Validator address
 * @param fee Fee for relayer
 * @param redeemScript Redeem script of the staking output
 * @param timelock Timelock for the staking output
 * @returns Buffer OP_RETURN buffer
 */
export function createCoreDaoOpReturnOutputScript({
  version,
  chainId,
  delegator,
  validator,
  fee,
  redeemScript,
  timelock,
}: {
  version: number;
  chainId: Buffer;
  delegator: Buffer;
  validator: Buffer;
  fee: number;
  redeemScript?: Buffer;
  timelock?: number;
}): Buffer {
  /**
   * As of v2, this is the construction of the OP_RETURN:
   * Source: https://docs.coredao.org/docs/Learn/products/btc-staking/design#op_return-output
   *
   * The OP_RETURN output should contain all staking information in order, and be composed in the following format:
   *
   * OP_RETURN: identifier 0x6a
   * LENGTH: which represents the total byte length after the OP_RETURN opcode. Note that all data has to be pushed with its appropriate size byte(s). [1]
   * Satoshi Plus Identifier: (SAT+) 4 bytes
   * Version: (0x01) 1 byte
   * Chain ID: (0x1115 for Core Testnet and 0x1116 for Core Mainnet) 2 bytes
   * Delegator: The Core address to receive rewards, 20 bytes
   * Validator: The Core validator address to stake to, 20 bytes
   * Fee: Fee for relayer, 1 byte, range [0,255], measured in CORE
   * (Optional) RedeemScript
   * (Optional) Timelock: 4 bytes
   *
   * [1] Any bytes bigger than or equal to 0x4c is pushed by using 0x4c (ie. OP_PUSHDATA)
   * followed by the length followed by the data (byte[80] -> OP_PUSHDATA + 80 + byte[80])
   *
   * Either RedeemScript or Timelock must be available, the purpose is to allow relayer to
   * obtain the RedeemScript and submit transactions on Core. If a RedeemScript is provided,
   * relayer will use it directly. Otherwise, relayer will construct the redeem script based
   * on the timelock and the information in the transaction inputs.
   */
  if (version < 0 || version > 255) {
    throw new Error('Invalid version - out of range');
  }
  const versionBuffer = Buffer.alloc(1, version);

  if (!(chainId.equals(CORE_DAO_TESTNET_CHAIN_ID) || chainId.equals(CORE_DAO_MAINNET_CHAIN_ID))) {
    throw new Error('Invalid chain ID');
  }

  if (delegator.length !== 20) {
    throw new Error('Invalid delegator address');
  }

  if (validator.length !== 20) {
    throw new Error('Invalid validator address');
  }

  if (fee < 0 || fee > 255) {
    throw new Error('Invalid fee - out of range');
  }
  const feeBuffer = Buffer.alloc(1, fee);

  if (feeBuffer.length !== 1) {
    throw new Error('Invalid fee');
  }

  if (!redeemScript && !timelock) {
    throw new Error('Either redeemScript or timelock must be provided');
  }
  const redeemScriptBuffer = redeemScript ?? Buffer.from([]);
  if (timelock && (timelock < 0 || timelock > 4294967295)) {
    throw new Error('Invalid timelock - out of range');
  }
  const timelockBuffer = timelock ? Buffer.alloc(4, timelock).reverse() : Buffer.from([]);

  const totalLength =
    CORE_DAO_SATOSHI_PLUS_IDENTIFIER.length +
    versionBuffer.length +
    chainId.length +
    delegator.length +
    validator.length +
    feeBuffer.length +
    redeemScriptBuffer.length +
    timelockBuffer.length +
    // This is to account for the LENGTH byte
    1;

  // If the length is  >= 0x4c (76), we need to use the OP_PUSHDATA (0x4c) opcode and then the length
  const totalLengthBuffer =
    totalLength >= 76
      ? Buffer.concat([
          Buffer.from([0x4c]),
          Buffer.alloc(
            1,
            // This is to account for the extra OP_PUSHDATA byte
            totalLength + 1
          ),
        ])
      : Buffer.alloc(1, totalLength);

  return Buffer.concat([
    Buffer.from([0x6a]),
    totalLengthBuffer,
    CORE_DAO_SATOSHI_PLUS_IDENTIFIER,
    versionBuffer,
    chainId,
    delegator,
    validator,
    feeBuffer,
    redeemScriptBuffer,
    timelockBuffer,
  ]);
}
