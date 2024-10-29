// Source: https://docs.coredao.org/docs/Learn/products/btc-staking/design
export const CORE_DAO_TESTNET_CHAIN_ID = Buffer.from('045b', 'hex');
export const CORE_DAO_MAINNET_CHAIN_ID = Buffer.from('045c', 'hex');
export const CORE_DAO_SATOSHI_PLUS_IDENTIFIER = Buffer.from('5341542b', 'hex');
// https://github.com/bitcoin/bitcoin/blob/5961b23898ee7c0af2626c46d5d70e80136578d3/src/script/script.h#L47
const OP_RETURN_IDENTIFIER = Buffer.from('6a', 'hex');
const OP_PUSHDATA1_IDENTIFIER = Buffer.from('4c', 'hex');
const OP_PUSHDATA2_IDENTIFIER = Buffer.from('4d', 'hex');
const OP_PUSHDATA4_IDENTIFIER = Buffer.from('4e', 'hex');

export function encodeTimelock(timelock: number): Buffer {
  const buff = Buffer.alloc(4);
  buff.writeUInt32LE(timelock);
  return buff;
}

export function decodeTimelock(buffer: Buffer): number {
  if (buffer.length !== 4) {
    throw new Error('Invalid timelock buffer length');
  }
  return buffer.readUInt32LE();
}

export function encodeOpReturnLength(length: number): Buffer {
  /**
   * Any bytes with lengths smaller than 0x4c (76) is pushed with 1 byte equal to the size (byte[10] -> 10 + byte[10]; byte[70] -> 70 + byte[70])
   * Any bytes bigger than or equal to 0x4c is pushed by using 0x4c (ie. OP_PUSHDATA) followed by the length followed by the data (byte[80] -> OP_PUSHDATA + 80 + byte[80])
   * Any bytes with length bigger than 255 uses 0x4d (OP_PUSHDATA2)
   * Any bytes with length bigger than 65535 (0xffff) uses 0x4e (OP_PUSHDATA4)
   */
  if (length < 76) {
    return Buffer.alloc(1, length);
  } else if (length < 255) {
    return Buffer.concat([OP_PUSHDATA1_IDENTIFIER, Buffer.alloc(1, length)]);
  } else if (length < 65535) {
    const buff = Buffer.alloc(2);
    buff.writeUInt16BE(length);
    return Buffer.concat([OP_PUSHDATA2_IDENTIFIER, buff]);
  } else {
    const buff = Buffer.alloc(4);
    buff.writeUInt32BE(length);
    return Buffer.concat([OP_PUSHDATA4_IDENTIFIER, buff]);
  }
}

/**
 * Decode the length of an OP_RETURN output script
 * @param buffer
 * @returns { length: number, offset: number } Length of the OP_RETURN output script and the offset
 */
export function decodeOpReturnLength(buffer: Buffer): { length: number; offset: number } {
  if (buffer[0] < 0x4c) {
    return { length: buffer[0], offset: 1 };
  } else if (buffer[0] === 0x4c) {
    return { length: buffer[1], offset: 2 };
  } else if (buffer[0] === 0x4d) {
    return { length: buffer.readUInt16BE(1), offset: 3 };
  } else if (buffer[0] === 0x4e) {
    return { length: buffer.readUInt32BE(1), offset: 5 };
  } else {
    throw new Error('Invalid length');
  }
}

type BaseParams = {
  version: number;
  chainId: Buffer;
  delegator: Buffer;
  validator: Buffer;
  fee: number;
};

type OpReturnParams = BaseParams & ({ redeemScript: Buffer } | { timelock: number });

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
  ...rest
}: OpReturnParams): Buffer {
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
   * Chain ID: (0x045b (1115) for Core Testnet and 0x045c (1116) for Core Mainnet) 2 bytes
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

  const redeemScriptBuffer = 'redeemScript' in rest ? rest.redeemScript : Buffer.from([]);
  if ('timelock' in rest && (rest.timelock < 0 || rest.timelock > 4294967295)) {
    throw new Error('Invalid timelock - out of range');
  }

  // encode the number into a 4-byte buffer
  // if timelock is provided, write it into 32-bit little-endian
  const timelockBuffer = 'timelock' in rest ? encodeTimelock(rest.timelock) : Buffer.from([]);

  const lengthBuffer = encodeOpReturnLength(
    CORE_DAO_SATOSHI_PLUS_IDENTIFIER.length +
      versionBuffer.length +
      chainId.length +
      delegator.length +
      validator.length +
      feeBuffer.length +
      redeemScriptBuffer.length +
      timelockBuffer.length
  );

  return Buffer.concat([
    OP_RETURN_IDENTIFIER,
    lengthBuffer,
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
