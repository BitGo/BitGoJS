import { erc7984, terc7984 } from '../account';
import { UnderlyingAsset } from '../base';

/**
 * ERC-7984 confidential tokens (Zama fhEVM).
 *
 * These tokens use fully homomorphic encryption (FHE) for on-chain confidential transfers.
 * Balances are stored as encrypted ciphertexts; plaintext amounts require ACL-delegated
 * decryption via the Zama Gateway before they can be displayed.
 *
 * Mainnet contract addresses are TBD pending Zama fhEVM mainnet launch.
 * Testnet tokens (hteth:*) are deployed on Hoodi using Zama's cleartext FHE stack.
 *   Hoodi ACL: 0x6D3FAf6f86e1fF9F3B0831Dda920AbA1cBd5bd68  (Networks.test.hoodi.zamaAclContractAddress)
 *   Hoodi RPC: https://rpc.hoodi.ethpandaops.io  (chain ID 560048)
 *
 * Sandbox development contracts (Sepolia, real FHE stack):
 *   CTKN:  0x94167129172A35ab093B44b8b96213DDbc3cD387
 *   cUSDT: 0x4E7B06D78965594eB5EF5414c357ca21E1554491
 */
export const erc7984Tokens = [
  // Mainnet tokens (contract addresses TBD pending Zama fhEVM mainnet launch)
  erc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'eth:czama',
    'Zama Test Token',
    6,
    '0xeb5015ff021db115ace010f23f55c2591059bba0', // https://etherscan.io/address/0xeb5015ff021db115ace010f23f55c2591059bba0
    UnderlyingAsset['eth:czama']
  ),
  erc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'eth:cusdt',
    'Zama USDT',
    6,
    '0xae0207c757aa2b4019ad96edd0092ddc63ef0c50', // https://etherscan.io/token/0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50
    UnderlyingAsset['eth:cusdt']
  ),
  erc7984(
    'fb41ba70-858c-48e6-a513-9da1ea030853',
    'eth:cusdc',
    'Zama USDC',
    6,
    '0xe978f22157048e5db8e5d07971376e86671672b2', // https://etherscan.io/token/0xe978f22157048e5db8e5d07971376e86671672b2
    UnderlyingAsset['eth:cusdc']
  ),

  // Testnet tokens (hteth / Hoodi) — Zama cleartext FHE stack (chain ID 560048)
  terc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    'hteth:ctest1',
    'Zama Token Test 1',
    6,
    '0x7b1d59bbcd291daa59cb6c8c5bc04de1afc4aba1',
    UnderlyingAsset['hteth:ctest1']
  ),
  terc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    'hteth:cusdt',
    'Zama USDT',
    6,
    '0x2debbe0487ef921df4457f9e36ed05be2df1ac75',
    UnderlyingAsset['hteth:cusdt']
  ),
];
