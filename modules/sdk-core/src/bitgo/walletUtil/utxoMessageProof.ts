import { IWallet } from '../wallet';
import { IMessageProvider, MessageInfo } from './iMessageProvider';
import { MidnightMessageProvider } from './midnightMessageProvider';

type BulkMessageResponse = {
  success: boolean;
  numMessages: number;
  transactions: Record<string, unknown>[];
};

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
  // UTXO coins can only have a maximum of 200 messages per transaction
  const numMessagesPerTransaction = wallet.bitgo.env === 'prod' ? 200 : 4;
  const provider = new MidnightMessageProvider(wallet, destinationAddress, numMessagesPerTransaction);
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
