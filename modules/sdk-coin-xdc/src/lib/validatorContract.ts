/**
 * XDC Validator Contract Constants and ABI
 *
 * This file contains the contract address and ABI for the XDC Validator contract
 * which handles KYC uploads and validator staking operations.
 *
 * Contract Address: 0x0000000000000000000000000000000000000088 (System Contract)
 * Source: XDC Network Validator Contract
 * Reference: https://github.com/XinFinOrg/XDPoSChain
 */

import XDCValidatorABI from './XDCValidatorABI.json';

/**
 * XDC Validator Contract Address (Testnet)
 * This is the deployed contract address on XDC Apothem testnet (chainId: 51)
 */
export const XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET = '0x0000000000000000000000000000000000000088';

/**
 * XDC Validator Contract Address (Mainnet)
 * This is the deployed contract address on XDC mainnet (chainId: 50)
 */
export const XDC_VALIDATOR_CONTRACT_ADDRESS_MAINNET = '0x0000000000000000000000000000000000000088';

/**
 * uploadKYC method ID
 * keccak256("uploadKYC(string)") = 0xf5c95125
 */
export const UPLOAD_KYC_METHOD_ID = '0xf5c95125';

/**
 * propose method ID
 * keccak256("propose(address)") = 0x01267951
 */
export const PROPOSE_METHOD_ID = '0x01267951';

/**
 * Full XDC Validator Contract ABI
 * Imported from JSON file for easy use with Web3/XDC3
 */
export const XDC_VALIDATOR_ABI = XDCValidatorABI;

/**
 * Get the uploadKYC function ABI
 * Useful for encoding function calls
 */
export const UPLOAD_KYC_ABI = XDCValidatorABI.find((item) => item.name === 'uploadKYC');

/**
 * Get the propose function ABI
 * Useful for encoding function calls
 */
export const PROPOSE_ABI = XDCValidatorABI.find((item) => item.name === 'propose');

/**
 * Get the validator contract address for the given network
 * @param isTestnet - whether to use testnet or mainnet
 * @returns the validator contract address
 */
export function getValidatorContractAddress(isTestnet: boolean): string {
  return isTestnet ? XDC_VALIDATOR_CONTRACT_ADDRESS_TESTNET : XDC_VALIDATOR_CONTRACT_ADDRESS_MAINNET;
}
