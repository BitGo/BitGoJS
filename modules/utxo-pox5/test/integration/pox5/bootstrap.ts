import { AnchorMode, makeContractDeploy } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

import type { Pox5LocalConfig } from './config';
import { StacksNodeAdapter } from './stacks';
import { waitFor } from './rpc';

const DEPLOYER_PRIVATE_KEY = 'cb3df38053d132895220b9ce471f6b676db5b9bf0b4adefb55f2118ece2478df01';
const DEPLOYER_ADDRESS = 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6';
const AGGREGATE_PUBKEY = '035379aa40c02890d253cfa577964116eb5295570ae9f7287cbae5f2585f5b2c7c';
const TOKEN_CONTRACT = 'sbtc-token';
const REGISTRY_CONTRACT = 'sbtc-registry';

const TOKEN_SOURCE = `
(define-fungible-token sbtc-token)

(define-public (transfer
        (amount uint)
        (sender principal)
        (recipient principal)
        (memo (optional (buff 34))))
    (begin
        (try! (ft-transfer? sbtc-token amount sender recipient))
        (ok true)))

(define-read-only (get-balance (who principal))
    (ok (ft-get-balance sbtc-token who)))

(define-public (mint (amount uint) (recipient principal))
    (ft-mint? sbtc-token amount recipient))
`;

const REGISTRY_SOURCE = `(define-read-only (get-current-aggregate-pubkey) 0x${AGGREGATE_PUBKEY})`;

function localStacksNetwork(config: Pox5LocalConfig): StacksTestnet {
  const network = new StacksTestnet();
  network.coreApiUrl = config.stacks.nodeUrl;
  network.chainId = 0x80000000;
  return network;
}

async function hasContract(stacks: StacksNodeAdapter, contractName: string): Promise<boolean> {
  try {
    await stacks.getContractSource(DEPLOYER_ADDRESS, contractName);
    return true;
  } catch {
    return false;
  }
}

async function deployContract(
  stacks: StacksNodeAdapter,
  network: StacksTestnet,
  contractName: string,
  codeBody: string,
  nonce: number
): Promise<void> {
  const transaction = await makeContractDeploy({
    contractName,
    codeBody,
    senderKey: DEPLOYER_PRIVATE_KEY,
    fee: 1_000,
    nonce,
    network,
    anchorMode: AnchorMode.Any,
  });
  const txid = await stacks.broadcastTransaction(transaction.serialize());
  console.log(`PoX-5 bootstrap broadcast ${contractName}: ${txid}`);
}

export async function bootstrapPox5(config: Pox5LocalConfig): Promise<void> {
  const stacks = new StacksNodeAdapter(config.stacks.nodeUrl, config.stacks.apiUrl, config.stacks.timeoutMs);
  await stacks.waitForReady(config.bitcoin.startupTimeoutMs);

  const network = localStacksNetwork(config);
  const tokenPresent = await hasContract(stacks, TOKEN_CONTRACT);
  const registryPresent = await hasContract(stacks, REGISTRY_CONTRACT);
  if (tokenPresent && registryPresent) return;

  const account = await stacks.getAccount(DEPLOYER_ADDRESS);
  let nonce = Number(account.nonce);
  if (!Number.isSafeInteger(nonce) || nonce < 0) throw new Error('PoX-5 bootstrap deployer nonce is invalid');

  if (!tokenPresent) {
    await deployContract(stacks, network, TOKEN_CONTRACT, TOKEN_SOURCE, nonce++);
    await waitFor(
      `${TOKEN_CONTRACT} deployment`,
      () => hasContract(stacks, TOKEN_CONTRACT),
      config.bitcoin.startupTimeoutMs
    );
  }
  if (!registryPresent) {
    await deployContract(stacks, network, REGISTRY_CONTRACT, REGISTRY_SOURCE, nonce);
    await waitFor(
      `${REGISTRY_CONTRACT} deployment`,
      () => hasContract(stacks, REGISTRY_CONTRACT),
      config.bitcoin.startupTimeoutMs
    );
  }
}
