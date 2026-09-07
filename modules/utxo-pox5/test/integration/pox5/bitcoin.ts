import { JsonRpcClient, isRecord, readArray, readNumber, readString, waitFor } from './rpc';

export type BitcoinBlockchainInfo = {
  chain: string;
  blocks: number;
  headers: number;
};

export type BitcoinWalletBalance = {
  trusted: number;
  untrustedPending: number;
};

export type BitcoinWalletTransaction = {
  txid: string;
  category: string;
  amountBtc: number;
  confirmations: number;
  address: string | null;
  time: number | null;
};

function satsToBtc(sats: bigint): string {
  if (sats <= 0n) throw new Error('Bitcoin amount must be positive');
  const whole = sats / 100_000_000n;
  const fraction = (sats % 100_000_000n).toString().padStart(8, '0').replace(/0+$/, '');
  return fraction.length === 0 ? whole.toString() : `${whole}.${fraction}`;
}

export class BitcoinCoreAdapter {
  private walletReady = false;

  public constructor(private readonly rpc: JsonRpcClient, private readonly walletRpc: JsonRpcClient = rpc) {}

  private async ensureWallet(): Promise<void> {
    if (this.walletReady) return;

    const loadedWallets = readArray(await this.rpc.call('listwallets'), 'listwallets result');
    if (!loadedWallets.includes('main')) {
      const directory = await this.rpc.call('listwalletdir');
      if (!isRecord(directory)) throw new Error('listwalletdir returned an invalid response');
      const wallets = readArray(directory.wallets, 'listwalletdir.wallets');
      const mainWallet = wallets.some((wallet) => isRecord(wallet) && wallet.name === 'main');
      if (mainWallet) await this.rpc.call('loadwallet', ['main']);
      else await this.rpc.call('createwallet', ['main']);
    }
    this.walletReady = true;
  }

  public async getBlockchainInfo(): Promise<BitcoinBlockchainInfo> {
    const value = await this.rpc.call('getblockchaininfo');
    if (!isRecord(value)) throw new Error('getblockchaininfo returned an invalid response');
    return {
      chain: readString(value.chain, 'chain'),
      blocks: readNumber(value.blocks, 'blocks'),
      headers: readNumber(value.headers, 'headers'),
    };
  }

  public async getNewAddress(label: string): Promise<string> {
    await this.ensureWallet();
    return readString(await this.walletRpc.call('getnewaddress', [label, 'bech32']), 'getnewaddress result');
  }

  public async getWalletBalance(): Promise<BitcoinWalletBalance> {
    await this.ensureWallet();
    const value = await this.walletRpc.call('getbalances');
    if (!isRecord(value)) throw new Error('getbalances returned an invalid response');
    const mine = value.mine;
    if (!isRecord(mine)) throw new Error('getbalances.mine returned an invalid response');
    return {
      trusted: readNumber(mine.trusted, 'getbalances.mine.trusted'),
      untrustedPending: readNumber(mine.untrusted_pending, 'getbalances.mine.untrusted_pending'),
    };
  }

  public async getWalletAddress(label: string): Promise<string> {
    await this.ensureWallet();
    const addresses = await this.walletRpc.call('getaddressesbylabel', [label]);
    if (!isRecord(addresses)) throw new Error('getaddressesbylabel returned an invalid response');
    const firstAddress = Object.keys(addresses)[0];
    return firstAddress ?? this.getNewAddress(label);
  }

  public async getWalletTransactions(limit = 50): Promise<BitcoinWalletTransaction[]> {
    await this.ensureWallet();
    const values = readArray(
      await this.walletRpc.call('listtransactions', ['*', limit, 0, true]),
      'listtransactions result'
    );
    return values.map((value, index) => {
      if (!isRecord(value)) throw new Error(`listtransactions entry ${index} returned an invalid response`);
      return {
        txid: readString(value.txid, `listtransactions[${index}].txid`),
        category: readString(value.category, `listtransactions[${index}].category`),
        amountBtc: readNumber(value.amount, `listtransactions[${index}].amount`),
        confirmations: readNumber(value.confirmations, `listtransactions[${index}].confirmations`),
        address: typeof value.address === 'string' ? value.address : null,
        time: typeof value.time === 'number' ? value.time : null,
      };
    });
  }

  public async sendToAddress(address: string, sats: bigint): Promise<string> {
    await this.ensureWallet();
    return readString(await this.walletRpc.call('sendtoaddress', [address, satsToBtc(sats)]), 'sendtoaddress result');
  }

  public async mine(blocks: number, address: string): Promise<string[]> {
    return readArray(await this.rpc.call('generatetoaddress', [blocks, address]), 'generatetoaddress result').map(
      (hash, index) => readString(hash, `generated block ${index}`)
    );
  }

  public async getRawTransaction(txid: string): Promise<string> {
    return readString(await this.rpc.call('getrawtransaction', [txid, false]), 'getrawtransaction result');
  }

  public async getBlockCount(): Promise<number> {
    return readNumber(await this.rpc.call('getblockcount'), 'getblockcount result');
  }

  public async waitForBlockProgress(startHeight: number, timeoutMs: number): Promise<number> {
    let height = startHeight;
    await waitFor(
      'a Bitcoin regtest block',
      async () => {
        height = await this.getBlockCount();
        return height > startHeight;
      },
      timeoutMs
    );
    return height;
  }

  public async waitForHeight(targetHeight: number, timeoutMs: number): Promise<void> {
    await waitFor(`Bitcoin block ${targetHeight}`, async () => (await this.getBlockCount()) >= targetHeight, timeoutMs);
  }
}
