/**
 * Utility functions for Cosmos SDK test data
 * This file contains utility functions for test data
 */

import * as fs from 'fs';
import * as path from 'path';
import { coins } from '@bitgo-beta/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { CoinTestData } from './types';

/**
 * Get all available test coins
 * @returns {string[]} Array of coin names that have test data
 */
export const getAvailableTestCoins = (): string[] => {
  try {
    // Get the resources directory path
    const resourcesDir = path.join(__dirname, '../resources');
    // Read all files in the resources directory
    const files = fs.readdirSync(resourcesDir);
    // Extract coin names by removing the .ts extension
    return files.map((file) => file.replace('.ts', ''));
  } catch (error) {
    // Fallback to hardcoded list if there's an error
    console.warn('Failed to dynamically discover test coins:', error);
    return ['cosmos', 'cronos'];
  }
};

/**
 * Load test data for a specific coin
 *
 * This utility abstracts away the path resolution logic,
 * making it easier to load test data from anywhere in the test suite.
 *
 * @param {string} coinName - The coin name (e.g., 'cosmos', 'cronos')
 * @returns {CoinTestData} The test data for the coin
 * @throws {Error} If the test data for the coin is not found
 */
export const getTestData = (coinName: string): CoinTestData => {
  try {
    // Dynamic import of the coin-specific test data
    return require(`../resources/${coinName}`).default;
  } catch (e) {
    throw new Error(`Test data for coin ${coinName} not found: ${e}`);
  }
};

/**
 * Get test data for all available coins
 *
 * @returns {Record<string, CoinTestData>} An object mapping coin names to their test data
 */
export const getAllTestData = (): Record<string, CoinTestData> => {
  const availableCoins = getAvailableTestCoins();
  const result: Record<string, CoinTestData> = {};
  for (const coin of availableCoins) {
    result[coin] = getTestData(coin);
  }
  return result;
};

/**
 * Get the builder factory for a specific coin
 * @param {string} coin - The coin name
 * @returns {TransactionBuilderFactory} The transaction builder factory
 */
export const getBuilderFactory = (coin: string) => {
  const coinConfig = coins.get(coin);
  return new TransactionBuilderFactory(coinConfig);
};

/**
 * Ensures that all required properties are present in the test transaction data
 * This is useful for TypeScript type checking in test files
 *
 * @param {T} tx - The transaction data that might have optional properties
 * @returns {Required<T>} The same transaction data but with TypeScript treating all properties as non-optional
 */
export function ensureTransaction<T>(tx: T): Required<T> {
  // This function doesn't actually modify the data
  // It just tells TypeScript that all properties are present
  return tx as Required<T>;
}
