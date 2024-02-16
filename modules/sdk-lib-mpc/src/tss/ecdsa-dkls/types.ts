// Broadcast message meant to be sent to multiple parties
interface BroadcastMessage<T> {
  payload: T;
  from: number;
}

// P2P message meant to be sent to a specific party
interface P2PMessage<T, G> {
  payload: T;
  from: number;
  commitment?: G;
  to: number;
}

export enum DkgState {
  Uninitialized = 0,
  Round1,
  Round2,
  Round3,
  Round4,
  Complete,
  InvalidState,
}

export type AuthEncMessage = {
  encryptedMessage: string;
  signature: string;
};
export type AuthMessage = {
  message: string;
  signature: string;
};
export type PartyGpgKey = {
  partyId: number;
  gpgKey: string;
};
export type SerializedBroadcastMessage = BroadcastMessage<string>;
export type DeserializedBroadcastMessage = BroadcastMessage<Uint8Array>;
export type SerializedP2PMessage = P2PMessage<string, string>;
export type DeserializedP2PMessage = P2PMessage<Uint8Array, Uint8Array>;
export type AuthEncP2PMessage = P2PMessage<AuthEncMessage, string>;
export type AuthBroadcastMessage = BroadcastMessage<AuthMessage>;
export type SerializedMessages = {
  p2pMessages: SerializedP2PMessage[];
  broadcastMessages: SerializedBroadcastMessage[];
};
export type AuthEncMessages = {
  p2pMessages: AuthEncP2PMessage[];
  broadcastMessages: AuthBroadcastMessage[];
};
export type DeserializedMessages = {
  p2pMessages: DeserializedP2PMessage[];
  broadcastMessages: DeserializedBroadcastMessage[];
};

/**
 * Serializes messages payloads to base64 strings.
 * @param messages
 */
export function serializeMessages(messages: DeserializedMessages): SerializedMessages {
  return {
    p2pMessages: messages.p2pMessages.map((m) => {
      return {
        to: m.to,
        from: m.from,
        payload: Buffer.from(m.payload).toString('base64'),
        commitment: m.commitment ? Buffer.from(m.commitment).toString('base64') : m.commitment,
      };
    }),
    broadcastMessages: messages.broadcastMessages.map((m) => {
      return {
        from: m.from,
        payload: Buffer.from(m.payload).toString('base64'),
      };
    }),
  };
}

/**
 * Desrializes messages payloads to Uint8Array.
 * @param messages
 */
export function deserializeMessages(messages: SerializedMessages): DeserializedMessages {
  return {
    p2pMessages: messages.p2pMessages.map((m) => {
      return {
        to: m.to,
        from: m.from,
        payload: new Uint8Array(Buffer.from(m.payload, 'base64')),
        commitment: m.commitment ? new Uint8Array(Buffer.from(m.commitment, 'base64')) : undefined,
      };
    }),
    broadcastMessages: messages.broadcastMessages.map((m) => {
      return {
        from: m.from,
        payload: new Uint8Array(Buffer.from(m.payload, 'base64')),
      };
    }),
  };
}
