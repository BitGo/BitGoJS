import { Principal } from '@dfinity/principal';
import { HttpAgent, replica, AgentCanister } from 'ic0';
import utils from './utils';
import { ACCOUNT_BALANCE_CALL, LEDGER_CANISTER_ID, ICRC1_FEE_KEY, METADATA_CALL, DEFAULT_SUBACCOUNT } from './iface';
import BigNumber from 'bignumber.js';

export class IcpAgent {
  private readonly host: string;

  constructor(host: string) {
    this.host = host;
  }

  /**
   * Creates a new HTTP agent for communicating with the Internet Computer.
   * @returns An instance of HttpAgent.
   */
  private createAgent(): HttpAgent {
    return new HttpAgent({
      host: this.host,
      fetch,
      verifyQuerySignatures: false,
    });
  }

  /**
   * Retrieves an instance of the ledger canister agent.
   *
   * This method creates a new agent using `createAgent()`, initializes a replica interface
   * with the agent (configured for local use), and returns an `AgentCanister` instance
   * for the ledger canister identified by `LEDGER_CANISTER_ID`.
   *
   * @returns {AgentCanister} An agent interface for interacting with the ledger canister.
   */
  private getLedger(): AgentCanister {
    const agent = this.createAgent();
    const ic = replica(agent, { local: true });
    return ic(Principal.fromUint8Array(LEDGER_CANISTER_ID).toText());
  }

  /**
   * Fetches the account balance for a given principal ID.
   * @param principalId - The principal ID of the account.
   * @returns Promise resolving to the account balance as a string.
   * @throws Error if the balance could not be fetched.
   */
  public async getBalance(principalId: string): Promise<BigNumber> {
    try {
      if (!principalId) {
        throw new Error('Principal ID is required');
      }
      const ledger = this.getLedger();
      const account = {
        owner: Principal.fromText(principalId),
        subaccount: [utils.hexToBytes(DEFAULT_SUBACCOUNT)],
      };

      const balance = await ledger.call(ACCOUNT_BALANCE_CALL, account);
      return BigNumber(balance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching balance for principal ${principalId}: ${errorMessage}`);
    }
  }

  /**
   * Fetches the transaction fee from the ledger.
   * @returns Promise resolving to the transaction fee as a string.
   * @throws Error if the fee could not be fetched.
   */
  public async getFee(): Promise<BigNumber> {
    try {
      const ledger = this.getLedger();
      const metadata = await ledger.call(METADATA_CALL);

      const feeEntry = metadata.find(
        (entry): entry is [string, { Nat: string }] => entry[0] === ICRC1_FEE_KEY && entry[1]?.Nat !== undefined
      );

      if (!feeEntry) {
        throw new Error(`${ICRC1_FEE_KEY} metadata not found or invalid format`);
      }

      return BigNumber(feeEntry[1].Nat);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error fetching transaction fee: ${errorMessage}`);
    }
  }
}
