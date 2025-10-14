import { Wallet, IWallet } from '../wallet';
import { MidnightMessageProvider } from './midnightMessageProvider';
import { IMessageProvider, MessageInfo } from './iMessageProvider';
import { MessageStandardType } from '../../account-lib';

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

  // Gather all messages to process (flatten all batches)
  let allMessages: MessageInfo[] = [];
  let messages: MessageInfo[] = await provider.getMessagesAndAddressesToSign();
  while (messages.length > 0) {
    allMessages = allMessages.concat(messages);
    messages = await provider.getMessagesAndAddressesToSign();
  }

  // Extract wallet constructor params
  const { bitgo, baseCoin, _wallet: walletData } = wallet as Wallet;

  // Process all messages sequentially, each with a new Wallet instance
  const results: { success: boolean; address: string; txRequestId?: string }[] = [];
  for (const messageInfo of allMessages) {
    const newWallet = new Wallet(bitgo, baseCoin, walletData);
    const result = await signOrBuildMessage(newWallet, messageInfo, messageStandardType, walletPassphrase);
    results.push(result);
  }
  processResults(results, txRequests, failedAddresses);
  return { failedAddresses, txRequests };
}

async function signOrBuildMessage(
  wallet: IWallet,
  messageInfo: MessageInfo,
  messageStandardType: MessageStandardType,
  walletPassphrase?: string
): Promise<{ success: boolean; address: string; txRequestId?: string }> {
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
