import * as utxolib from '@bitgo/utxo-lib';

import { IWallet } from '../wallet/iWallet';
import { Environments } from '../environments';

const NUM_MESSAGES_PER_TRANSACTION = 2;
const NUM_MESSAGES_PER_QUERY = 1000;

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
  protected messageCache: MessageInfo[];
  protected network: utxolib.Network;
  protected midnightClaimUrl: string;
  protected prevId: string | undefined;
  protected ranOnce = false;
  constructor(private wallet: IWallet, private message: string) {
    this.messageCache = [];
    this.network = utxolib.networks[wallet.coin()];
    this.midnightClaimUrl = `${
      Environments[wallet.bitgo.env].uri
    }/api/airdrop-claim/v1/midnight/claims/${wallet.coin()}/${wallet.id()}`;
  }

  async getMessagesAndAddressesToSign(): Promise<MessageInfo[]> {
    if (this.messageCache.length > 0) {
      return this.messageCache.splice(0, NUM_MESSAGES_PER_TRANSACTION);
    } else if (this.messageCache.length === 0 && this.ranOnce && this.prevId === undefined) {
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

    this.messageCache = response.claims.map((claim: Claim) => {
      if (!claim.originAddress) {
        throw new Error(`Claim ${JSON.stringify(claim)} is missing originAddress`);
      }
      return {
        message: this.message,
        address: claim.originAddress,
      };
    });
    const toReturn = this.messageCache.splice(0, NUM_MESSAGES_PER_TRANSACTION);
    return toReturn;
  }
}

export async function bulkSignBip322MidnightMessages(
  wallet: IWallet,
  message: string,
  walletPassphrase?: string
): Promise<BulkMessageResponse> {
  const provider = new MidnightMessageProvider(wallet, message);
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
