import { Action } from "./action";
import { Contract } from "./contract";

// Provides additional information about the transaction
// Allows users to visually compare and verify contract parameters
// before signing the transaction
export interface SignPsbtOptions {
  contracts: Contract[];
  action: Action;
}

export interface BtcProvider {
  // Sign a PSBT
  // Expecting the PSBT to be encoded in hex format.
  signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string>;

  // Signs a message using either ECDSA or BIP-322, depending on the address type.
  // - Taproot and Native Segwit addresses will use BIP-322.
  // - Legacy addresses will use ECDSA.
  // Expecting the message to be encoded in base64 format.
  signMessage: (
    message: string,
    type: "ecdsa" | "bip322-simple",
  ) => Promise<string>;

  // Get the transaction hex from the transaction ID
  getTransactionHex(txid: string): Promise<string>;
}

export interface BabylonProvider {
  /**
   * Signs a Babylon chain transaction.
   * This is primarily used for signing MsgCreateBTCDelegation transactions
   * which register the BTC delegation on the Babylon Genesis chain.
   *
   * @param {object} msg - The Cosmos SDK transaction message to sign
   * @param {string} msg.typeUrl - The Protobuf type URL identifying the message type
   * @param {T} msg.value - The transaction message data matching the typeUrl
   * @returns {Promise<Uint8Array>} The signed transaction bytes
   */
  signTransaction: <T extends object>(msg: {
    typeUrl: string;
    value: T;
  }) => Promise<Uint8Array>;

  /**
   * Gets the current height of the Babylon Genesis chain.
   *
   * @returns {Promise<number>} The current Babylon chain height
   */
  getCurrentHeight?: () => Promise<number>;

  /**
   * Gets the chain ID of the Babylon Genesis chain.
   *
   * @returns {Promise<string>} The Babylon chain ID
   */
  getChainId?: () => Promise<string>;
}

export interface StakingInputs {
  finalityProviderPksNoCoordHex: string[];
  stakingAmountSat: number;
  stakingTimelock: number;
}

// Inclusion proof for a BTC staking transaction that is included in a BTC block
// This is used for post-staking registration on the Babylon chain
// You can refer to https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-transaction-get-merkle
// for more information on the inclusion proof format.
export interface InclusionProof {
  // The 0-based index of the position of the transaction in the ordered list
  // of transactions in the block.
  pos: number;
  // A list of transaction hashes the current hash is paired with, recursively,
  // in order to trace up to obtain merkle root of the block, deepest pairing first.
  merkle: string[];
  // The block hash of the block that contains the transaction
  blockHashHex: string;
}

/**
 * Upgrade configuration for Babylon POP (Proof of Possession) context.
 * This is used to determine when to switch to the new POP context format
 * based on the Babylon chain height and version.
 */
export interface UpgradeConfig {
  /**
   * POP context upgrade configuration.
   */
  pop?: PopUpgradeConfig;
}

/**
 * Configuration for POP context upgrade.
 * - upgradeHeight: The Babylon chain height at which the POP context upgrade is activated.
 * - version: The version of the POP context to use after the upgrade.
 */
export interface PopUpgradeConfig {
  /**
   * The Babylon chain height at which the POP context upgrade is activated.
   */
  upgradeHeight: number;
  /**
   * The version of the POP context to use after the upgrade.
   */
  version: number;
}