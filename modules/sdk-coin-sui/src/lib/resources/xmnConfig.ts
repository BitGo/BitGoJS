/**
 * XMN staking contract configuration for mainnet and testnet.
 *
 * XMN uses an app-level staking contract (StakingFactory) on the SUI blockchain.
 * There are no validators — all staked XMN goes into a single liquidity pool.
 *
 * Key insight: stake(), request_unstake(), unbond(), and claim_and_transfer() all
 * have void returns and transfer objects internally to ctx.sender(). Scripts must
 * NOT call tx.transferObjects() on their results.
 *
 * Type arguments for all StakingFactory calls: <XMN, XMN, BRIDGE_TOKEN>
 * The Db (boosted deposit) type is BRIDGE_TOKEN, not XMN.
 */

export interface XmnSharedObject {
  objectId: string;
  initialSharedVersion: number;
  mutable: boolean;
}

export interface XmnConfig {
  /** Active (upgraded) package ID — used for Move call targets */
  XMN_PKG_ID: string;
  /** Original package ID — used for type tag matching in on-chain object types */
  XMN_ORIGINAL_PKG_ID: string;
  /** StakingFactory shared object reference */
  XMN_STAKING_FACTORY: XmnSharedObject;
  /** XMN coin type tag (R and Dn type args) */
  XMN_COIN_TYPE: string;
  /** BRIDGE_TOKEN coin type tag (Db type arg — NOT XMN) */
  BRIDGE_TOKEN_COIN_TYPE: string;
  /** Module name in the staking contract */
  STAKING_MODULE: string;
}

export const XMN_TESTNET_CONFIG: XmnConfig = {
  XMN_PKG_ID: '0x82e3f0021547fdbc88d25b09a99e175742e7fb45b3a457e4373817f768494454',
  XMN_ORIGINAL_PKG_ID: '0x49934c5c0866e0b62db2f43296994f28d09505f48005032d4285a5da53f35e2a',
  XMN_STAKING_FACTORY: {
    objectId: '0x016a243d61c0814da7e07bbc5f6963f73941839433da9a11e2bc8a251dbd83a0',
    initialSharedVersion: 685940293,
    mutable: true,
  },
  XMN_COIN_TYPE: '0x49934c5c0866e0b62db2f43296994f28d09505f48005032d4285a5da53f35e2a::xmn::XMN',
  BRIDGE_TOKEN_COIN_TYPE:
    '0x4d2ba7e9a819c306c94c744efdd89f52009b0ed892c97b4e49adf4c78923d801::bridge_token::BRIDGE_TOKEN',
  STAKING_MODULE: 'staking_factory',
};

export const XMN_MAINNET_CONFIG: XmnConfig = {
  ...XMN_TESTNET_CONFIG,
  XMN_PKG_ID: '0x37e54838496fc4d620032cfa9e1d2542f21874429b107f097c1dab2c8bad2de8',
  XMN_ORIGINAL_PKG_ID: '0x3cc209ca80fde4e68f9abbae4776abc57de7bb3da33bdb8cbf6a66740ff81bd8',
  XMN_STAKING_FACTORY: {
    objectId: '0x8f8a82182a12f08f579046f167303a1083fcdd3b2eb7f58c3eefe7835639d5f8',
    initialSharedVersion: 648114799,
    mutable: true,
  },
  XMN_COIN_TYPE: '0x3cc209ca80fde4e68f9abbae4776abc57de7bb3da33bdb8cbf6a66740ff81bd8::xmn::XMN',
  BRIDGE_TOKEN_COIN_TYPE:
    '0x8db9d9dc5cd5723ee55725869620073e28f88ddf3c360a512ebd73cb46f1903d::bridge_token::BRIDGE_TOKEN',
};
