import * as utxolib from '@bitgo/utxo-lib';

import { IWallet } from '../wallet/iWallet';
import { Environments } from '../environments';

const NUM_MESSAGES_PER_QUERY = 1000;
export const MIDNIGHT_TNC_HASH = '31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

type MessageInfo = {
  message: string;
  address: string;
};

type Claim = {
  originWalletId: string;
  status: string;
  originAddress?: string;
  allocationAmount: string;
};

type BulkMessageResponse = {
  success: boolean;
  numMessages: number;
  transactions: Record<string, unknown>[];
};

export interface IMessageProvider {
  /**
   * Returns the messages and addresses that we want to sign. We call this function multiple times until there are no more
   * messages. If there are no more messages, an empty array is returned. Note that we only return messages in sets of 200.
   */
  getMessagesAndAddressesToSign(): Promise<MessageInfo[]>;
}

/**
 * The Midnight drop service can return up to 1000 messages per request. However, UTXO coins
 * can only have a maximum of 200 messages per transaction. We make this wrapper function that
 * handles the pagination and batching of messages, keeping a local cache of the unprocessed messages.
 */
export class MidnightMessageProvider implements IMessageProvider {
  protected unprocessedMessagesCache: MessageInfo[];
  protected network: utxolib.Network;
  protected midnightClaimUrl: string;
  protected prevId: string | undefined;
  protected ranOnce = false;
  private readonly numMessagesPerTransaction: number;

  constructor(private wallet: IWallet, private destinationAddress: string) {
    this.unprocessedMessagesCache = [];
    this.network = utxolib.networks[wallet.coin()];
    this.midnightClaimUrl = `${
      Environments[wallet.bitgo.env].uri
    }/api/airdrop-claim/v1/midnight/claims/${wallet.coin()}/${wallet.id()}`;
    this.numMessagesPerTransaction = wallet.bitgo.env === 'prod' ? 200 : 4;
  }

  async getMessagesAndAddressesToSign(): Promise<MessageInfo[]> {
    if (this.unprocessedMessagesCache.length > 0) {
      return this.unprocessedMessagesCache.splice(0, this.numMessagesPerTransaction);
    } else if (this.unprocessedMessagesCache.length === 0 && this.ranOnce && this.prevId === undefined) {
      return [];
    }

    this.ranOnce = true;
    const query: Record<string, unknown> = {
      status: 'UNINITIALIZED',
      limit: NUM_MESSAGES_PER_QUERY,
    };
    if (this.prevId !== undefined) {
      query.prevId = this.prevId;
    }
    const response = await this.wallet.bitgo.get(this.midnightClaimUrl).query(query).result();
    if (response.status !== 'success') {
      throw new Error(`Unexpected status code ${response.status} from ${this.midnightClaimUrl}`);
    }
    if (response?.pagination?.hasNext) {
      this.prevId = response?.pagination?.nextPrevId;
    } else {
      this.prevId = undefined;
    }

    this.unprocessedMessagesCache = response.claims.map((claim: Claim) => {
      if (!claim.originAddress) {
        throw new Error(`Claim ${JSON.stringify(claim)} is missing originAddress`);
      }
      return {
        // Midnight claim message format
        message: `STAR ${claim.allocationAmount} to ${this.destinationAddress} ${MIDNIGHT_TNC_HASH}`,
        address: claim.originAddress,
      };
    });
    const toReturn = this.unprocessedMessagesCache.splice(0, this.numMessagesPerTransaction);
    return toReturn;
  }
}

/**
 * Bulk signs BIP322 messages for the Midnight airdrop.
 * @param wallet The wallet to sign the messages with.
 * @param destinationAddress The ADA address the rewards will get sent to
 * @param walletPassphrase (Optional) The wallet passphrase of the wallet
 */
export async function bulkSignBip322MidnightMessages(
  wallet: IWallet,
  destinationAddress: string,
  walletPassphrase?: string
): Promise<BulkMessageResponse> {
  const provider = new MidnightMessageProvider(wallet, destinationAddress);
  return bulkSignBip322MessagesWithProvider(provider, wallet, walletPassphrase);
}

async function bulkSignBip322MessagesWithProvider(
  provider: IMessageProvider,
  wallet: IWallet,
  walletPassphrase?: string
): Promise<BulkMessageResponse> {
  let numMessages = 0;
  let messages: MessageInfo[] = await provider.getMessagesAndAddressesToSign();
  const sendingFunction = wallet.type() === 'cold' ? wallet.prebuildTransaction : wallet.sendMany;
  const transactions: Record<string, unknown>[] = [];
  while (messages.length > 0) {
    // Sign the messages with the wallet
    const result = await sendingFunction.call(wallet, {
      messages,
      // Recipients must be empty
      recipients: [],
      // txFormat must be psbt
      txFormat: 'psbt',
      // Pass in the optional wallet passphrase
      walletPassphrase,
      offlineVerification: wallet.type() === 'cold',
    });
    transactions.push(result);
    numMessages += messages.length;
    messages = await provider.getMessagesAndAddressesToSign();
  }
  return { success: true, numMessages, transactions };
}
