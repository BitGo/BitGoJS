import { erc7984, terc7984 } from '../account';
import { UnderlyingAsset } from '../base';

/**
 * ERC-7984 confidential tokens (Zama fhEVM).
 *
 * These tokens use fully homomorphic encryption (FHE) for on-chain confidential transfers.
 * Balances are stored as encrypted ciphertexts; plaintext amounts require ACL-delegated
 * decryption via the Zama Gateway before they can be displayed.
 *
 * Wrapper↔underlying metadata (`underlyingErc20Address`, `rate`, `requiresApprovalReset`)
 * is wired on Hoodi test pairs only for now so mainnet served configs stay unchanged.
 * Allowlisting is owned by AMS.
 *
 * Testnet tokens (hteth:*) are deployed on Hoodi using Zama's cleartext FHE stack.
 *   Hoodi ACL: 0x6D3FAf6f86e1fF9F3B0831Dda920AbA1cBd5bd68  (Networks.test.hoodi.zamaAclContractAddress)
 *   Hoodi RPC: https://rpc.hoodi.ethpandaops.io  (chain ID 560048)
 */
export const erc7984Tokens = [
  // Mainnet tokens
  erc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'eth:czama',
    'Confidential Zama',
    6,
    '0x80cb147fd86dc6dee3eee7e4cee33d1397d98071', // https://etherscan.io/token/0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071
    UnderlyingAsset['eth:czama']
  ),
  erc7984(
    'c9d5d51b-15b7-4d93-b079-9af313160e66',
    'eth:cxaut',
    'Zama Confidential XAUT',
    6,
    '0x73cc9af9d6befdb3c3faf8a5e8c05cb95fdaeef1', // https://etherscan.io/token/0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1
    UnderlyingAsset['eth:cxaut']
  ),
  erc7984(
    '0d1b01c8-ee4a-4ca4-a1af-2ab3132d91ee',
    'eth:ctgbp',
    'Zama Confidential TGBP',
    6,
    '0xa873750ccbafd5ec7dd13bfd5237d7129832edd9', // https://etherscan.io/token/0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9
    UnderlyingAsset['eth:ctgbp']
  ),
  erc7984(
    '2fbf960e-9747-4d38-b93b-28029e78b5d4',
    'eth:cweth',
    'Zama Confidential WETH',
    6,
    '0xda9396b82634ea99243ce51258b6a5ae512d4893', // https://etherscan.io/token/0xda9396b82634Ea99243cE51258B6A5Ae512D4893
    UnderlyingAsset['eth:cweth']
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
    '0x7740f913dc24d4f9e1a72531372c3170452b2f87',
    '1000000000000', // 1e12
    false,
    UnderlyingAsset['hteth:ctest1']
  ),
  terc7984(
    'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    'hteth:cusdt',
    'Zama USDT',
    6,
    '0x2debbe0487ef921df4457f9e36ed05be2df1ac75',
    '0x51a63b5621d78de54d2f4d098a23a5a69e76f30b',
    '1',
    false,
    UnderlyingAsset['hteth:cusdt']
  ),
];
