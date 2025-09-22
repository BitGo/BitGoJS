import * as utxolib from '@bitgo-beta/utxo-lib';

import { IMessageProvider, MessageInfo } from './iMessageProvider';
import { IWallet } from '../wallet';
import { Environments } from '../environments';

const NUM_MESSAGES_PER_QUERY = 1000;
export const MIDNIGHT_TNC_HASH = '31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

type Claim = {
  originWalletId: string;
  status: string;
  originAddress?: string;
  allocationAmount: string;
};

/**
 * The Midnight drop service can return up to 1000 messages per request.
 * We make this wrapper function that handles the pagination and batching of messages,
 * keeping a local cache of the unprocessed messages.
 */
export class MidnightMessageProvider implements IMessageProvider {
  protected unprocessedMessagesCache: MessageInfo[];
  protected network: utxolib.Network;
  protected midnightClaimUrl: string;
  protected prevId: string | undefined;
  protected ranOnce = false;

  constructor(
    private wallet: IWallet,
    private destinationAddress: string,
    private readonly batchSize = NUM_MESSAGES_PER_QUERY
  ) {
    this.unprocessedMessagesCache = [];
    this.network = utxolib.networks[wallet.coin()];
    this.midnightClaimUrl = `${
      Environments[wallet.bitgo.env].uri
    }/api/airdrop-claim/v1/midnight/claims/${wallet.coin()}/${wallet.id()}`;
  }

  async getMessagesAndAddressesToSign(): Promise<MessageInfo[]> {
    if (this.unprocessedMessagesCache.length > 0) {
      return this.unprocessedMessagesCache.splice(0, this.batchSize);
    } else if (this.unprocessedMessagesCache.length === 0 && this.ranOnce && this.prevId === undefined) {
      return [];
    }

    this.ranOnce = true;
    const query: Record<string, unknown> = {
      statuses: ['UNINITIATED', 'NEEDS_RESUBMITTING'],
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
    return this.unprocessedMessagesCache.splice(0, this.batchSize);
  }
}
