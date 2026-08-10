import { Networks } from './networks';

/**
 * Per-network static configuration for an ERC-7984 wrapper↔underlying pair.
 *
 * wrapperAddress        — the ERC-7984 confidential token contract
 * underlyingErc20Address — the plaintext ERC-20 that the wrapper holds in escrow
 * rate                  — underlying base units per 1 wrapper base unit (≥ 1).
 *                         e.g. rate=1 means 1 underlying → 1 wrapper.
 * requiresApprovalReset — true when the underlying ERC-20 follows the USDT pattern
 *                         (must reset allowance to 0 before granting a new amount).
 * isVetted              — address pair has been reviewed and confirmed on-chain.
 * isActive              — pair is live and eligible for shield/unshield operations.
 */
export interface Erc7984WrapperPair {
  wrapperAddress: string;
  underlyingErc20Address: string;
  rate: bigint;
  requiresApprovalReset: boolean;
  isVetted: boolean;
  isActive: boolean;
}

/**
 * Registry entry keyed by network name → list of wrapper pairs on that network.
 */
export type Erc7984Registry = Record<string, Erc7984WrapperPair[]>;

/**
 * Known ERC-7984 wrapper↔underlying pairs.
 *
 * Keys are the network name strings from Networks (e.g. Networks.test.hoodi.name).
 * All addresses are lowercase hex.
 *
 * Hoodi testnet pairs use the Zama cleartext FHE stack (chain ID 560048).
 *   Hoodi ACL: 0x6d3faf6f86e1ff9f3b0831dda920aba1cbd5bd68
 *
 * Mainnet pairs use the production Zama fhEVM stack (Ethereum mainnet, chain ID 1).
 */
export const erc7984Registry: Erc7984Registry = {
  // Hoodi testnet
  [Networks.test.hoodi.name]: [
    {
      // hteth:ctest1  ← wraps a Hoodi-only test ERC-20 (no real underlying asset)
      wrapperAddress: '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1',
      underlyingErc20Address: '0x0000000000000000000000000000000000000000',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    },
    {
      // hteth:cusdt  ← wraps a Hoodi USDT-like test token
      wrapperAddress: '0x2debbe0487ef921df4457f9e36ed05be2df1ac75',
      underlyingErc20Address: '0x0000000000000000000000000000000000000000',
      rate: 1n,
      requiresApprovalReset: true,
      isVetted: true,
      isActive: true,
    },
  ],

  // Ethereum mainnet
  [Networks.main.ethereum.name]: [
    {
      // eth:czama  ← wraps ZAMA (0xERC20)
      wrapperAddress: '0x80cb147fd86dc6dee3eee7e4cee33d1397d98071',
      underlyingErc20Address: '0x33f06f4e13c2b3c47c1bee8b4b79d0c3bd35b7e8',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    },
    {
      // eth:cxaut  ← wraps XAUT (Tether Gold)
      wrapperAddress: '0x73cc9af9d6befdb3c3faf8a5e8c05cb95fdaeef1',
      underlyingErc20Address: '0x68749665ff8041ef9e851f1d30c9ead1e2e0d8fb',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    },
    {
      // eth:ctgbp  ← wraps TGBP (Tether GBP)
      wrapperAddress: '0xa873750ccbafd5ec7dd13bfd5237d7129832edd9',
      underlyingErc20Address: '0x00000000441378008ea67f4284a57932b1c000a5',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    },
    {
      // eth:cweth  ← wraps WETH
      wrapperAddress: '0xda9396b82634ea99243ce51258b6a5ae512d4893',
      underlyingErc20Address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    },
    {
      // eth:cusdt  ← wraps USDT
      wrapperAddress: '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50',
      underlyingErc20Address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      rate: 1n,
      requiresApprovalReset: true,
      isVetted: true,
      isActive: true,
    },
    {
      // eth:cusdc  ← wraps USDC
      wrapperAddress: '0xe978f22157048e5db8e5d07971376e86671672b2',
      underlyingErc20Address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    },
  ],
};

/**
 * Look up the static configuration for a specific wrapper contract on a given network.
 *
 * @param networkName - value of EthereumNetwork.name (e.g. Networks.test.hoodi.name)
 * @param wrapperAddress - lowercase ERC-7984 contract address
 * @returns the pair config, or undefined if not found
 */
export function getWrapperPair(networkName: string, wrapperAddress: string): Erc7984WrapperPair | undefined {
  const pairs = erc7984Registry[networkName];
  if (!pairs) return undefined;
  const lower = wrapperAddress.toLowerCase();
  return pairs.find((p) => p.wrapperAddress === lower);
}

/**
 * Return all active, vetted wrapper pairs for a given network.
 */
export function getActiveWrapperPairs(networkName: string): Erc7984WrapperPair[] {
  return (erc7984Registry[networkName] ?? []).filter((p) => p.isVetted && p.isActive);
}
