export type MessageInfo = {
  message: string;
  address: string;
};

export interface IMessageProvider {
  /**
   * Returns the messages and addresses that we want to sign. We call this function multiple times until there are no more
   * messages. If there are no more messages, an empty array is returned. Note that the messages are returned in batches.
   */
  getMessagesAndAddressesToSign(): Promise<MessageInfo[]>;
}
