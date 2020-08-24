import { UnspentInfo } from '../coins/abstractUtxoCoin';

/**
 * An unspent with bear minimum information required for recoveries.
 */
// TODO: consolidate RecoveryUnspent and UnspentInfo
export interface RecoveryUnspent extends UnspentInfo {
  amount: number,
  n: number,
  txid: string,
  address: string,
}

/**
 * An account with bear minimum information required for recoveries.
 */
export interface RecoveryAccountData {
  txCount: number,
  totalBalance: number,
}

/**
 * Methods required to perform different recovery actions in UTXO coins.
 */
export interface RecoveryProvider {
  getExplorerUrl(query: string): string;
  getAccountInfo(address: string): Promise<RecoveryAccountData>
  getUnspents(address: string): Promise<RecoveryUnspent[]>;
}
