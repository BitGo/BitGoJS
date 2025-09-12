import { IWallet, Wallet } from '../wallet';
import { MessageStandardType } from '../utils';
import { MidnightMessageProvider } from './midnightMessageProvider';
import { IMessageProvider, MessageInfo } from './iMessageProvider';

type BulkAccountBasedMessageResponse = {
  txRequests: Record<string, unknown>[];
  failedAddresses: string[];
};

export async function bulkSignAccountBasedMidnightClaimMessages(
  wallet: IWallet,
  messageStandardType: MessageStandardType,
  destinationAddress: string,
  walletPassphrase?: string
): Promise<BulkAccountBasedMessageResponse> {
  const provider = new MidnightMessageProvider(wallet, destinationAddress);
  return bulkSignAccountBasedMessagesWithProvider(provider, wallet, messageStandardType, walletPassphrase);
}

async function bulkSignAccountBasedMessagesWithProvider(
  provider: IMessageProvider,
  wallet: IWallet,
  messageStandardType: MessageStandardType,
  walletPassphrase?: string
): Promise<BulkAccountBasedMessageResponse> {
  const failedAddresses: string[] = [];
  const txRequests: Record<string, unknown>[] = [];

  // Extract wallet constructor params
  const { bitgo, baseCoin, _wallet: walletData } = wallet as Wallet;

  let messages: MessageInfo[] = await provider.getMessagesAndAddressesToSign();
  while (messages.length > 0) {
    // Process all messages in parallel, each with a new Wallet instance
    const results = await Promise.all(
      messages.map(async (messageInfo) => {
        const newWallet = new Wallet(bitgo, baseCoin, walletData);
        return signOrBuildMessage(newWallet, messageInfo, messageStandardType, walletPassphrase);
      })
    );
    // Process results and update counters
    processResults(results, txRequests, failedAddresses);
    // Get next batch of messages
    messages = await provider.getMessagesAndAddressesToSign();
  }
  return { failedAddresses, txRequests };
}

async function signOrBuildMessage(
  wallet: IWallet,
  messageInfo: MessageInfo,
  messageStandardType: MessageStandardType,
  walletPassphrase?: string
): Promise<{ success: boolean; address: string; txRequestId?: string }> {
  try {
    let txRequestId: string;
    if (walletPassphrase !== undefined) {
      // Sign the messages with the wallet
      const signedMessage = await wallet.signMessage({
        message: {
          messageRaw: messageInfo.message,
          messageStandardType,
          signerAddress: messageInfo.address,
        },
        walletPassphrase,
      });
      txRequestId = signedMessage.txRequestId;
    } else {
      // Build the sign message request
      const txRequest = await wallet.buildSignMessageRequest({
        message: {
          messageRaw: messageInfo.message,
          messageStandardType,
          signerAddress: messageInfo.address,
        },
      });
      txRequestId = txRequest.txRequestId;
    }
    return { success: true, address: messageInfo.address, txRequestId };
  } catch (error) {
    // Return failure result for individual message errors
    return { success: false, address: messageInfo.address };
  }
}

function processResults(
  results: { success: boolean; address: string; txRequestId?: string }[],
  txRequests: Record<string, unknown>[],
  failedAddresses: string[]
): void {
  for (const result of results) {
    if (result.success) {
      txRequests.push({
        address: result.address,
        txRequestId: result.txRequestId,
      });
    } else {
      failedAddresses.push(result.address);
    }
  }
}
