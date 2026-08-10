import { Networks } from './networks';

/**
 * Per-network static configuration for an ERC-7984 wrapper↔underlying pair.
 *
 * wrapperAddress        — the ERC-7984 confidential token contract (0x-prefixed lowercase hex)
 * underlyingErc20Address — the plaintext ERC-20 that the wrapper holds in escrow
 *                          (0x-prefixed lowercase hex; zero address means no real on-chain
 *                          underlying, e.g. Hoodi test tokens)
 * rate                  — underlying base units per 1 wrapper base unit (must be ≥ 1n).
 *                         e.g. rate=1n means 1 underlying wei → 1 wrapper wei.
 * requiresApprovalReset — true when the underlying ERC-20 follows the USDT pattern
 *                         (must reset allowance to 0 before granting a new amount).
 * isVetted              — address pair has been reviewed and confirmed on-chain.
 * isActive              — pair is live and eligible for shield/unshield operations.
 */
export interface Erc7984WrapperPair {
  readonly wrapperAddress: string;
  readonly underlyingErc20Address: string;
  readonly rate: bigint;
  readonly requiresApprovalReset: boolean;
  readonly isVetted: boolean;
  readonly isActive: boolean;
}

/**
 * Registry keyed by network name → immutable list of wrapper pairs on that network.
 */
export type Erc7984Registry = Readonly<Record<string, ReadonlyArray<Erc7984WrapperPair>>>;

/**
 * Known ERC-7984 wrapper↔underlying pairs.
 *
 * Keys are the network name strings from Networks (e.g. Networks.test.hoodi.name).
 * All addresses are 0x-prefixed lowercase hex (42 chars total).
 *
 * Hoodi testnet pairs use the Zama cleartext FHE stack (chain ID 560048).
 *   Hoodi ACL: 0x6d3faf6f86e1ff9f3b0831dda920aba1cbd5bd68
 *
 * Mainnet pairs use the production Zama fhEVM stack (Ethereum mainnet, chain ID 1).
 */
export const erc7984Registry: Erc7984Registry = Object.freeze({
  // Hoodi testnet — Zama cleartext FHE stack, chain ID 560048
  [Networks.test.hoodi.name]: Object.freeze([
    Object.freeze({
      // hteth:ctest1  ← wraps a Hoodi-only test ERC-20 (no real on-chain underlying)
      wrapperAddress: '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1',
      underlyingErc20Address: '0x0000000000000000000000000000000000000000',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    }),
    Object.freeze({
      // hteth:cusdt  ← wraps a Hoodi USDT-like test token (no real on-chain underlying)
      wrapperAddress: '0x2debbe0487ef921df4457f9e36ed05be2df1ac75',
      underlyingErc20Address: '0x0000000000000000000000000000000000000000',
      rate: 1n,
      requiresApprovalReset: true,
      isVetted: true,
      isActive: true,
    }),
  ]),

  // Ethereum mainnet — production Zama fhEVM stack, chain ID 1
  [Networks.main.ethereum.name]: Object.freeze([
    Object.freeze({
      // eth:czama  ← wraps ZAMA
      wrapperAddress: '0x80cb147fd86dc6dee3eee7e4cee33d1397d98071',
      underlyingErc20Address: '0x33f06f4e13c2b3c47c1bee8b4b79d0c3bd35b7e8',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    }),
    Object.freeze({
      // eth:cxaut  ← wraps XAUT (Tether Gold)
      wrapperAddress: '0x73cc9af9d6befdb3c3faf8a5e8c05cb95fdaeef1',
      underlyingErc20Address: '0x68749665ff8041ef9e851f1d30c9ead1e2e0d8fb',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    }),
    Object.freeze({
      // eth:ctgbp  ← wraps TGBP (Tether GBP)
      wrapperAddress: '0xa873750ccbafd5ec7dd13bfd5237d7129832edd9',
      underlyingErc20Address: '0x00000000441378008ea67f4284a57932b1c000a5',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    }),
    Object.freeze({
      // eth:cweth  ← wraps WETH
      wrapperAddress: '0xda9396b82634ea99243ce51258b6a5ae512d4893',
      underlyingErc20Address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    }),
    Object.freeze({
      // eth:cusdt  ← wraps USDT (requiresApprovalReset: USDT disallows non-zero → non-zero)
      wrapperAddress: '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50',
      underlyingErc20Address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      rate: 1n,
      requiresApprovalReset: true,
      isVetted: true,
      isActive: true,
    }),
    Object.freeze({
      // eth:cusdc  ← wraps USDC
      wrapperAddress: '0xe978f22157048e5db8e5d07971376e86671672b2',
      underlyingErc20Address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      rate: 1n,
      requiresApprovalReset: false,
      isVetted: true,
      isActive: true,
    }),
  ]),
});

// Validate invariants at module load: catch bad data before any caller sees it.
(function validateRegistry() {
  const addrRe = /^0x[0-9a-f]{40}$/;
  for (const [networkName, pairs] of Object.entries(erc7984Registry)) {
    const seen = new Set<string>();
    for (const p of pairs) {
      if (!addrRe.test(p.wrapperAddress)) {
        throw new Error(`erc7984Registry[${networkName}]: invalid wrapperAddress '${p.wrapperAddress}'`);
      }
      if (!addrRe.test(p.underlyingErc20Address)) {
        throw new Error(
          `erc7984Registry[${networkName}]: invalid underlyingErc20Address '${p.underlyingErc20Address}'`
        );
      }
      if (p.rate < 1n) {
        throw new Error(`erc7984Registry[${networkName}]: rate must be ≥ 1n for '${p.wrapperAddress}'`);
      }
      if (seen.has(p.wrapperAddress)) {
        throw new Error(`erc7984Registry[${networkName}]: duplicate wrapperAddress '${p.wrapperAddress}'`);
      }
      seen.add(p.wrapperAddress);
    }
  }
})();

/**
 * Look up the static configuration for a specific wrapper contract on a given network.
 *
 * @param networkName - value of EthereumNetwork.name (e.g. Networks.test.hoodi.name)
 * @param wrapperAddress - ERC-7984 contract address; must be 0x-prefixed hex (case-insensitive)
 * @returns the pair config, or undefined if not found
 */
export function getWrapperPair(networkName: string, wrapperAddress: string): Erc7984WrapperPair | undefined {
  if (!wrapperAddress) return undefined;
  const pairs = erc7984Registry[networkName];
  if (!pairs) return undefined;
  const lower = wrapperAddress.toLowerCase();
  return pairs.find((p) => p.wrapperAddress === lower);
}

/**
 * Return all active, vetted wrapper pairs for a given network.
 */
export function getActiveWrapperPairs(networkName: string): ReadonlyArray<Erc7984WrapperPair> {
  return (erc7984Registry[networkName] ?? []).filter((p) => p.isVetted && p.isActive);
}
