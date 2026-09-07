import { HttpJsonClient, isRecord, readArray, readNumber, readString, type RpcLogger, waitFor } from './rpc';

export type StacksNodeInfo = {
  networkId: number;
  burnBlockHeight: number;
  stacksTipHeight: number;
};

export class StacksNodeAdapter {
  private readonly node: HttpJsonClient;
  private readonly api: HttpJsonClient;

  public constructor(nodeUrl: string, apiUrl: string, timeoutMs: number, logger?: RpcLogger) {
    this.node = new HttpJsonClient(nodeUrl, timeoutMs, logger);
    this.api = new HttpJsonClient(apiUrl, timeoutMs, logger);
  }

  public async getNodeInfo(): Promise<StacksNodeInfo> {
    const value = await this.node.get('/v2/info');
    if (!isRecord(value)) throw new Error('Stacks /v2/info returned an invalid response');
    return {
      networkId: readNumber(value.network_id, 'network_id'),
      burnBlockHeight: readNumber(value.burn_block_height, 'burn_block_height'),
      stacksTipHeight: readNumber(value.stacks_tip_height, 'stacks_tip_height'),
    };
  }

  public async getPoxInfo(): Promise<Record<string, unknown>> {
    const value = await this.node.get('/v2/pox');
    if (!isRecord(value)) throw new Error('Stacks /v2/pox returned an invalid response');
    return value;
  }

  public async getAccount(address: string): Promise<Record<string, unknown>> {
    const value = await this.node.get(`/v2/accounts/${encodeURIComponent(address)}?proof=0`);
    if (!isRecord(value)) throw new Error('Stacks account response was invalid');
    return value;
  }

  public async getAddressTransactions(address: string, limit = 50): Promise<Record<string, unknown>[]> {
    const value = await this.api.get(`/extended/v1/address/${encodeURIComponent(address)}/transactions?limit=${limit}`);
    if (!isRecord(value)) throw new Error('Stacks address transactions response was invalid');
    return readArray(value.results, 'Stacks address transactions results').filter(isRecord);
  }

  public async getTransaction(txid: string): Promise<Record<string, unknown>> {
    const value = await this.api.get(`/extended/v1/tx/${encodeURIComponent(txid)}`);
    if (!isRecord(value)) throw new Error('Stacks transaction response was invalid');
    return value;
  }

  public async getApiStatus(): Promise<Record<string, unknown>> {
    const value = await this.api.get('/extended/v1/status');
    if (!isRecord(value)) throw new Error('Stacks API status response was invalid');
    return value;
  }

  public async getContractInterface(address: string, contractName: string): Promise<Record<string, unknown>> {
    const value = await this.node.get(
      `/v2/contracts/interface/${encodeURIComponent(address)}/${encodeURIComponent(contractName)}`
    );
    if (!isRecord(value)) throw new Error('Stacks contract interface response was invalid');
    return value;
  }

  public async waitForReady(timeoutMs: number): Promise<void> {
    await waitFor(
      'Stacks node and API readiness',
      async () => {
        await this.getNodeInfo();
        await this.getApiStatus();
        return true;
      },
      timeoutMs
    );
  }

  public async getContractSource(address: string, contractName: string): Promise<string> {
    const contractId = `${address}.${contractName}`;
    const value = await this.api.get(`/extended/v1/contract/${encodeURIComponent(contractId)}`);
    if (!isRecord(value)) throw new Error('Stacks contract source response was invalid');
    return readString(value.source_code, 'Stacks contract source');
  }

  public async broadcastTransaction(transaction: Uint8Array): Promise<string> {
    const value = await this.node.postBytes('/v2/transactions', transaction);
    if (typeof value === 'string') return value;
    if (isRecord(value) && typeof value.txid === 'string') return value.txid;
    throw new Error('Stacks broadcast response did not contain a transaction id');
  }

  public async waitForBurnHeight(targetHeight: number, timeoutMs: number): Promise<void> {
    await waitFor(
      `Stacks burn height ${targetHeight}`,
      async () => (await this.getNodeInfo()).burnBlockHeight >= targetHeight,
      timeoutMs
    );
  }

  public async waitForPox5Configured(contractId: string, activationHeight: number, timeoutMs: number): Promise<void> {
    await waitFor(
      'PoX-5 Epoch 4.0 configuration',
      async () => {
        const nodeInfo = await this.getNodeInfo();
        if (nodeInfo.burnBlockHeight < activationHeight) return false;
        const [address, contractName] = contractId.split('.');
        if (address === undefined || contractName === undefined) throw new Error(`Invalid contract id: ${contractId}`);
        await this.getContractInterface(address, contractName);
        return true;
      },
      timeoutMs
    );
  }
}
