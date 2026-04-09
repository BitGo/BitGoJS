import { payments, networks } from '@bitgo/utxo-lib';

// Source: https://docs.coredao.org/docs/Learn/products/btc-staking/design
export const CORE_DAO_DEVNET_CHAIN_ID = Buffer.from('0458', 'hex');
export const CORE_DAO_TESTNET2_CHAIN_ID = Buffer.from('045a', 'hex');
export const CORE_DAO_TESTNET_CHAIN_ID = Buffer.from('045b', 'hex');
export const CORE_DAO_MAINNET_CHAIN_ID = Buffer.from('045c', 'hex');
export const CORE_DAO_SATOSHI_PLUS_IDENTIFIER = Buffer.from('5341542b', 'hex');
// https://github.com/bitcoin/bitcoin/blob/5961b23898ee7c0af2626c46d5d70e80136578d3/src/script/script.h#L47
const OP_RETURN_IDENTIFIER = Buffer.from('6a', 'hex');

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

type BaseParams = {
  version: number;
  chainId: Buffer;
  delegator: Buffer;
  validator: Buffer;
  fee: number;
};

export type OpReturnParams = BaseParams & ({ redeemScript: Buffer } | { timelock: number });

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
   * Satoshi Plus Identifier: (SAT+) 4 bytes
   * Version: (0x01) 1 byte
   * Chain ID: (0x045b (1115) for Core Testnet and 0x045c (1116) for Core Mainnet) 2 bytes
   * Delegator: The Core address to receive rewards, 20 bytes
   * Validator: The Core validator address to stake to, 20 bytes
   * Fee: Fee for relayer, 1 byte, range [0,255], measured in CORE
   * (Optional) RedeemScript
   * (Optional) Timelock: 4 bytes
   *
   * Either RedeemScript or Timelock must be available, the purpose is to allow relayer to
   * obtain the RedeemScript and submit transactions on Core. If a RedeemScript is provided,
   * relayer will use it directly. Otherwise, relayer will construct the redeem script based
   * on the timelock and the information in the transaction inputs.
   *
   * Note that any length > 80 bytes wont be relayed by nodes and therefore we will throw an error.
   */
  if (version < 0 || version > 255) {
    throw new Error('Invalid version - out of range');
  }
  const versionBuffer = Buffer.alloc(1, version);

  if (
    !(
      chainId.equals(CORE_DAO_TESTNET_CHAIN_ID) ||
      chainId.equals(CORE_DAO_TESTNET2_CHAIN_ID) ||
      chainId.equals(CORE_DAO_MAINNET_CHAIN_ID) ||
      chainId.equals(CORE_DAO_DEVNET_CHAIN_ID)
    )
  ) {
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
  const data = Buffer.concat([
    CORE_DAO_SATOSHI_PLUS_IDENTIFIER,
    versionBuffer,
    chainId,
    delegator,
    validator,
    feeBuffer,
    redeemScriptBuffer,
    timelockBuffer,
  ]);
  if (data.length > 80) {
    throw new Error('OP_RETURN outputs cannot have a length larger than 80 bytes');
  }

  const payment = payments.embed({
    data: [data],
    network: chainId.equals(CORE_DAO_DEVNET_CHAIN_ID) ? networks.testnet : networks.bitcoin,
  });
  if (!payment.output) {
    throw new Error('Unable to create OP_RETURN output');
  }

  return payment.output;
}

/**
 * Parse a CoreDAO OP_RETURN output script into the constituent parts
 * @param script
 * @returns OpReturnParams
 */
export function parseCoreDaoOpReturnOutputScript(script: Buffer): OpReturnParams {
  if (!script.subarray(0, 1).equals(OP_RETURN_IDENTIFIER)) {
    throw new Error('First byte must be an OP_RETURN');
  }

  const payment = payments.embed({
    output: script,
  });
  const data = payment.data;
  if (!data || data.length !== 1) {
    throw new Error('Invalid OP_RETURN output');
  }
  const dataBuffer = data[0];
  if (dataBuffer.length > 80) {
    throw new Error(`OP_RETURN outputs cannot have a length larger than 80 bytes`);
  }
  let offset = 0;

  // Decode satoshi+ identifier
  if (!dataBuffer.subarray(offset, offset + 4).equals(CORE_DAO_SATOSHI_PLUS_IDENTIFIER)) {
    throw new Error('Invalid satoshi+ identifier');
  }
  offset += 4;

  // Decode version
  const version = dataBuffer[offset];
  offset += 1;

  // Decode chainId
  const chainId = Buffer.from(dataBuffer.subarray(offset, offset + 2));
  if (
    !(
      chainId.equals(CORE_DAO_DEVNET_CHAIN_ID) ||
      chainId.equals(CORE_DAO_TESTNET_CHAIN_ID) ||
      chainId.equals(CORE_DAO_TESTNET2_CHAIN_ID) ||
      chainId.equals(CORE_DAO_MAINNET_CHAIN_ID)
    )
  ) {
    throw new Error(
      `Invalid ChainID: ${chainId.toString(
        'hex'
      )}. Must be either 0x0458 (devnet), 0x045b (testnet), or 0x045c (mainnet).`
    );
  }
  offset += 2;

  // Decode delegator
  const delegator = Buffer.from(dataBuffer.subarray(offset, offset + 20));
  offset += 20;

  // Decode validator
  const validator = Buffer.from(dataBuffer.subarray(offset, offset + 20));
  offset += 20;

  // Decode fee
  const fee = dataBuffer[offset];
  offset += 1;

  const baseParams = { version, chainId, delegator, validator, fee };

  // Decode redeemScript or timelock
  if (offset === dataBuffer.length - 4) {
    return { ...baseParams, timelock: decodeTimelock(dataBuffer.subarray(offset)) };
  } else {
    return { ...baseParams, redeemScript: Buffer.from(dataBuffer.subarray(offset)) };
  }
}

export function toString(params: OpReturnParams): string {
  return JSON.stringify({
    version: params.version,
    chainId: params.chainId.toString('hex'),
    delegator: params.delegator.toString('hex'),
    validator: params.validator.toString('hex'),
    fee: params.fee,
    ...('redeemScript' in params ? { redeemScript: params.redeemScript.toString('hex') } : {}),
    ...('timelock' in params ? { timelock: params.timelock } : {}),
  });
}
