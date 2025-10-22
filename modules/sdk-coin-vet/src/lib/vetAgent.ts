import BigNumber from 'bignumber.js';
import { TransactionClause, Transaction } from '@vechain/sdk-core';

export class VetAgent {
  private readonly nodeUrl: string;

  constructor(nodeUrl: string) {
    this.nodeUrl = nodeUrl;
  }

  /**
   * Makes a GET request to the VeChain node.
   * @param endpoint - The API endpoint to call.
   * @param params - Optional query parameters.
   * @returns Promise resolving to the response data.
   * @throws Error if the request fails.
   */
  public async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(endpoint, this.nodeUrl);
    if (params) {
      Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'GET', endpoint);
    }
  }

  /**
   * Makes a POST request to the VeChain node.
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the request body.
   * @returns Promise resolving to the response data.
   * @throws Error if the request fails.
   */
  public async post(endpoint: string, data: any): Promise<any> {
    const url = new URL(endpoint, this.nodeUrl);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'POST', endpoint);
    }
  }

  /**
   * Fetches the balance for a given address.
   * @param address - The VeChain address to check the balance for.
   * @param tokenContractAddress - Optional token contract address for fetching token balance.
   * @returns Promise resolving to the account balance as a BigNumber.
   * @throws Error if the balance could not be fetched.
   */
  public async getBalance(address: string, tokenContractAddress?: string): Promise<BigNumber> {
    try {
      if (tokenContractAddress) {
        const vthoBalance = await this.getTokenBalance(address, tokenContractAddress);
        return vthoBalance;
      }

      const endpoint = `/accounts/${address}`;
      const response = await this.get(endpoint);

      if (!response || !response.balance) {
        throw new Error('Invalid response from the VeChain node');
      }

      // Convert the hexadecimal balance to a BigNumber
      return new BigNumber(response.balance);
    } catch (error) {
      throw this.handleError(error, 'GET', `balance for address ${address}`);
    }
  }

  /**
   * Fetches the token balance for a given address and token contract.
   * @param address - The VeChain address to check the balance for.
   * @param tokenContractAddress - The token contract address.
   * @returns Promise resolving to the token balance as a BigNumber.
   * @throws Error if the token balance could not be fetched.
   */
  private async getTokenBalance(address: string, tokenContractAddress: string): Promise<BigNumber> {
    const functionSelector = '0x70a08231'; // keccak256('balanceOf(address)').slice(0, 8)
    const paddedAddress = address.slice(2).padStart(64, '0');
    const data = functionSelector + paddedAddress;

    const clause: TransactionClause = {
      to: tokenContractAddress,
      value: '0x0',
      data: data,
    };

    try {
      const endpoint = '/accounts/*';
      const response = await this.post(endpoint, { clauses: [clause] });

      if (!Array.isArray(response) || response.length === 0 || !response[0].data) {
        throw new Error('Invalid response from the VeChain node');
      }

      if (response[0].reverted) {
        throw new Error('Token balance query reverted');
      }

      // Convert the hexadecimal balance to a BigNumber
      return new BigNumber(response[0].data);
    } catch (error) {
      throw this.handleError(error, 'POST', `token balance for address ${address}`);
    }
  }

  /**
   * Fetches the block reference from the best block.
   * @returns Promise resolving to the block reference as a string.
   * @throws Error if the block reference could not be fetched.
   */
  public async getBlockRef(): Promise<string> {
    try {
      const endpoint = '/blocks/best';
      const response = await this.get(endpoint);

      if (!response || !response.id) {
        throw new Error('Invalid response from the VeChain node');
      }

      return response.id.slice(0, 18);
    } catch (error) {
      throw this.handleError(error, 'GET', 'block reference');
    }
  }

  /**
   * Estimates the gas for given clauses and caller.
   * @param clauses - Array of clauses to estimate gas for.
   * @param caller - The address of the caller.
   * @returns Promise resolving to the estimated gas result.
   * @throws Error if the gas estimation fails.
   */
  public async estimateGas(clauses: TransactionClause[], caller: string): Promise<BigNumber> {
    if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
      throw new Error('Clauses must be a non-empty array');
    }

    if (!caller) {
      throw new Error('Caller address is required');
    }

    try {
      const endpoint = '/accounts/*';
      const response = await this.post(endpoint, { clauses, caller });

      if (!Array.isArray(response)) {
        throw new Error('Invalid response from the VeChain node');
      }

      if (response.some((result) => result.reverted || result.vmError)) {
        console.warn('Gas estimation reverted or encountered VM error');
      }

      const totalSimulatedGas = response.reduce((sum, result) => sum + (result.gasUsed || 0), 0);

      const intrinsicGas = Number(Transaction.intrinsicGas(clauses).wei);

      const totalGas = Math.ceil(intrinsicGas + (totalSimulatedGas !== 0 ? totalSimulatedGas + 15000 : 0));

      return new BigNumber(totalGas);
    } catch (error) {
      throw this.handleError(error, 'POST', 'estimate gas');
    }
  }

  private handleError(error: any, method: string, endpoint: string): never {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`${method} request to ${endpoint} failed: ${errorMessage}`);
  }
}
