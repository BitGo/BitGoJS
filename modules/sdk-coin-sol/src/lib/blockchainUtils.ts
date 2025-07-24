import { Connection, clusterApiUrl } from '@solana/web3.js';

export interface BlockhashOptions {
  network?: 'devnet' | 'testnet' | 'mainnet-beta';
  rpcUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

/**
 * Get the latest blockhash from Solana network
 * @param options Configuration options for the network and commitment level
 * @returns Promise<string> The latest blockhash
 */
export async function getLatestBlockhash(options: BlockhashOptions = {}): Promise<string> {
  const { network = 'devnet', rpcUrl, commitment = 'confirmed' } = options;

  try {
    const connection = rpcUrl ? new Connection(rpcUrl, commitment) : new Connection(clusterApiUrl(network), commitment);

    const { blockhash } = await connection.getLatestBlockhash(commitment);
    return blockhash;
  } catch (error) {
    throw new Error(`Failed to fetch latest blockhash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the latest blockhash with a fallback to a hardcoded value
 * @param options Configuration options
 * @param fallback Fallback blockhash to use if network call fails
 * @returns Promise<string> The latest blockhash or fallback
 */
export async function getLatestBlockhashWithFallback(
  options: BlockhashOptions = {},
  fallback = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi'
): Promise<string> {
  try {
    return await getLatestBlockhash(options);
  } catch (error) {
    return fallback;
  }
}
