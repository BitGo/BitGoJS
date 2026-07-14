import { MessageTypes, SignTypedDataVersion, TypedDataUtils, TypedMessage } from '@metamask/eth-sig-util';
import { ethers } from 'ethers';

/**
 * EIP-712 typed data for OpenZeppelin ERC20Votes-style `delegateBySig`:
 * `Delegation(address delegatee,uint256 nonce,uint256 expiry)`
 *
 * Domain fields must match the token's on-chain `eip712Domain()` (e.g. WLFI proxy
 * `0xda5e1988097297dcdc1f90d4dfe7909e847cbef6` on Ethereum mainnet).
 */

const delegateBySigAbi = [
  'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)',
];

const erc20VotesDelegationTypes: Record<string, Array<{ name: string; type: string }>> = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
  Delegation: [
    { name: 'delegatee', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
  ],
};

export interface Erc20VotesDelegationDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

/**
 * Fields of the OpenZeppelin `Delegation(address delegatee,uint256 nonce,uint256 expiry)` struct.
 */
export interface Erc20VotesDelegationMessageFields {
  delegatee: string;
  nonce: ethers.BigNumberish;
  expiry: ethers.BigNumberish;
}

export interface Erc20VotesDelegationTypedData {
  types: typeof erc20VotesDelegationTypes;
  primaryType: 'Delegation';
  domain: Erc20VotesDelegationDomain;
  message: {
    delegatee: string;
    nonce: string;
    expiry: string;
  };
}

function uint256FieldToDecimalString(value: ethers.BigNumberish): string {
  return ethers.BigNumber.from(value).toString();
}

/**
 * Build EIP-712 v4 typed data for `delegateBySig` signing (e.g. BitGo `signTypedData` with
 * `typedDataRaw: JSON.stringify(result)` and `SignTypedDataVersion.V4`).
 */
export function buildErc20VotesDelegationTypedData(params: {
  domain: Erc20VotesDelegationDomain;
  message: Erc20VotesDelegationMessageFields;
}): Erc20VotesDelegationTypedData {
  return {
    types: erc20VotesDelegationTypes,
    primaryType: 'Delegation',
    domain: { ...params.domain },
    message: {
      delegatee: ethers.utils.getAddress(params.message.delegatee),
      nonce: uint256FieldToDecimalString(params.message.nonce),
      expiry: uint256FieldToDecimalString(params.message.expiry),
    },
  };
}

const EIP712_DOMAIN_PRIMARY = 'EIP712Domain';

/** EIP-712 v4 digest buffer for the structured data (matches ETH-like `encodeTypedData` in this package). */
export function encodeErc20VotesDelegationTypedDataDigest(typedData: Erc20VotesDelegationTypedData): Buffer {
  const raw = JSON.parse(JSON.stringify(typedData)) as TypedMessage<MessageTypes>;
  const sanitized = TypedDataUtils.sanitizeData(raw);
  const parts: Buffer[] = [Buffer.from('1901', 'hex')];
  parts.push(
    TypedDataUtils.hashStruct(EIP712_DOMAIN_PRIMARY, sanitized.domain, sanitized.types, SignTypedDataVersion.V4)
  );
  if (sanitized.primaryType !== EIP712_DOMAIN_PRIMARY) {
    parts.push(
      TypedDataUtils.hashStruct(
        sanitized.primaryType as string,
        sanitized.message,
        sanitized.types,
        SignTypedDataVersion.V4
      )
    );
  }
  return Buffer.concat(parts);
}

/** Hex-encoded digest for BitGo typed-data tx request `messageEncoded` / `typedDataEncoded`. */
export function encodeErc20VotesDelegationTypedDataDigestHex(typedData: Erc20VotesDelegationTypedData): string {
  return encodeErc20VotesDelegationTypedDataDigest(typedData).toString('hex');
}

export interface DelegateBySigCallParams {
  delegatee: string;
  nonce: ethers.BigNumberish;
  expiry: ethers.BigNumberish;
  v: number;
  r: string;
  s: string;
}

/** ABI-encoded calldata for `delegateBySig` (contract call `data` field). */
export function encodeDelegateBySigCalldata(params: DelegateBySigCallParams): string {
  const iface = new ethers.utils.Interface(delegateBySigAbi);
  return iface.encodeFunctionData('delegateBySig', [
    ethers.utils.getAddress(params.delegatee),
    ethers.BigNumber.from(params.nonce),
    ethers.BigNumber.from(params.expiry),
    params.v,
    params.r,
    params.s,
  ]);
}

/** WLFI ERC-20 proxy on Ethereum mainnet (verify `eip712Domain()` before signing). */
export const WLFI_ETHEREUM_MAINNET_PROXY = '0xda5e1988097297dcdc1f90d4dfe7909e847cbef6';

/**
 * EIP-712 domain as returned by WLFI `eip712Domain()` on Ethereum mainnet (Apr 2026).
 * Re-read on-chain after upgrades; name/version/verifyingContract can change.
 */
export function wlfiEthereumMainnetDelegationDomain(): Erc20VotesDelegationDomain {
  return {
    name: 'World Liberty Financial',
    version: '2',
    chainId: 1,
    verifyingContract: WLFI_ETHEREUM_MAINNET_PROXY,
  };
}
